import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, plan_id, topup_id, user_id, return_url } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user_id)
      .single();

    let customerId = profile?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        name: profile?.full_name,
        metadata: { user_id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user_id);
    }

    const baseReturnUrl = return_url || Deno.env.get('SITE_URL') || 'https://24shift.solutions';

    // ─── SUBSCRIPTION CHECKOUT ───
    if (type === 'subscription' && plan_id) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (!plan?.stripe_price_id) {
        return new Response(JSON.stringify({ error: 'Plan has no Stripe Price ID configured' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const sessionParams: any = {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        success_url: `${baseReturnUrl}/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${baseReturnUrl}/billing?status=cancelled`,
        metadata: { user_id, plan_id, type: 'subscription' },
        subscription_data: {
          metadata: { user_id, plan_id },
        },
      };

      // Add trial if plan has trial_days
      if (plan.trial_days > 0) {
        sessionParams.subscription_data.trial_period_days = plan.trial_days;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      
      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── TOP-UP CHECKOUT ───
    if (type === 'topup') {
      const { data: topup } = await supabase
        .from('topup_packages')
        .select('*')
        .eq('id', topup_id)
        .single();

      if (!topup) {
        return new Response(JSON.stringify({ error: 'Top-up package not found' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `${topup.tokens} AI Tokens Top-up` },
            unit_amount: Math.round(topup.price_usd * 100),
          },
          quantity: 1,
        }],
        success_url: `${baseReturnUrl}/billing?status=topup_success`,
        cancel_url: `${baseReturnUrl}/billing?status=cancelled`,
        metadata: { user_id, topup_id: topup.id, tokens: topup.tokens, type: 'topup' },
      });

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── CUSTOMER PORTAL ───
    if (type === 'portal') {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseReturnUrl}/billing`,
      });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid type. Use: subscription, topup, or portal' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[CREATE-CHECKOUT] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
