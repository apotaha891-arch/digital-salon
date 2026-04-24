import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('[STRIPE-WEBHOOK] Signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[STRIPE-WEBHOOK] Event: ${event.type}`);

  try {
    switch (event.type) {
      // ─── CHECKOUT COMPLETED ───
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { user_id, plan_id, type, tokens, topup_id } = session.metadata || {};

        if (type === 'topup' && user_id && tokens) {
          // Add tokens to wallet
          const tokenCount = parseInt(tokens);
          await supabase.rpc('refill_monthly_tokens', {
            p_user_id: user_id,
            p_tokens: tokenCount,
            p_plan_name: 'Top-up'
          });
          console.log(`[STRIPE] Top-up: +${tokenCount} tokens for ${user_id}`);
        }

        if (type === 'subscription' && user_id && plan_id) {
          // Create/update subscription record
          const stripeSubId = session.subscription as string;
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

          await supabase.from('subscriptions').upsert({
            user_id,
            plan_id,
            status: stripeSub.status === 'trialing' ? 'trialing' : 'active',
            stripe_subscription_id: stripeSubId,
            stripe_customer_id: session.customer as string,
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            trial_ends_at: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          // Update wallet plan
          await supabase.from('wallets').update({ plan_id }).eq('user_id', user_id);

          // Add initial tokens
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('monthly_tokens, name')
            .eq('id', plan_id)
            .single();

          if (plan && stripeSub.status !== 'trialing') {
            await supabase.rpc('refill_monthly_tokens', {
              p_user_id: user_id,
              p_tokens: plan.monthly_tokens,
              p_plan_name: plan.name
            });
          } else if (plan && stripeSub.status === 'trialing') {
            // Trial gets tokens immediately
            await supabase.rpc('refill_monthly_tokens', {
              p_user_id: user_id,
              p_tokens: plan.monthly_tokens,
              p_plan_name: `${plan.name} Trial`
            });
          }

          // Unfreeze if was frozen
          await supabase.rpc('unfreeze_user_tokens', { p_user_id: user_id });

          console.log(`[STRIPE] Subscription created: ${plan_id} for ${user_id}`);
        }
        break;
      }

      // ─── INVOICE PAID (MONTHLY RENEWAL) ───
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === 'subscription_cycle') {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.user_id;
          const planId = sub.metadata?.plan_id;

          if (userId && planId) {
            const { data: plan } = await supabase
              .from('subscription_plans')
              .select('monthly_tokens, name')
              .eq('id', planId)
              .single();

            if (plan) {
              // ROLLOVER: Add tokens, don't replace
              await supabase.rpc('refill_monthly_tokens', {
                p_user_id: userId,
                p_tokens: plan.monthly_tokens,
                p_plan_name: plan.name
              });

              // Update subscription period
              await supabase.from('subscriptions').update({
                status: 'active',
                current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              }).eq('stripe_subscription_id', sub.id);

              console.log(`[STRIPE] Monthly refill: +${plan.monthly_tokens} for ${userId}`);
            }
          }
        }
        break;
      }

      // ─── PAYMENT FAILED ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = sub.metadata?.user_id;

          if (userId) {
            await supabase.from('subscriptions').update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            }).eq('user_id', userId);

            console.log(`[STRIPE] Payment failed for ${userId}`);
          }
        }
        break;
      }

      // ─── SUBSCRIPTION CANCELLED ───
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;

        if (userId) {
          // Freeze tokens (don't delete them)
          await supabase.rpc('freeze_user_tokens', { p_user_id: userId });

          await supabase.from('subscriptions').update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId);

          console.log(`[STRIPE] Subscription cancelled, tokens frozen for ${userId}`);
        }
        break;
      }

      // ─── TRIAL ENDING ───
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        console.log(`[STRIPE] Trial ending soon for ${userId}`);
        // TODO: Send notification email
        break;
      }

      default:
        console.log(`[STRIPE-WEBHOOK] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[STRIPE-WEBHOOK] Processing error:`, err);
    // Return 200 to avoid retries, but log the error
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
