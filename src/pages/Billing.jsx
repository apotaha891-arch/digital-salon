import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../hooks/useWallet';
import { CreditCard, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function Billing() {
  const { user } = useAuth();
  const { wallet, ledger, loading } = useWallet(user?.id);

  if (loading) return <Spinner centered />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">إدارة الرصيد والتوكنز</h1>
        <p className="page-subtitle">تابعي استهلاك التوكنز وعمليات الشحن الخاصة بصالونك</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard 
          label="الرصيد الحالي (توكن)" 
          value={wallet?.balance ?? 0} 
          icon={Zap} 
          color="var(--success)" 
        />
        <StatCard 
          label="إجمالي الاستهلاك" 
          value="-- --" 
          icon={TrendingDown} 
          color="var(--error)" 
        />
        <StatCard 
          label="آخر عملية شحن" 
          value={ledger[0]?.amount ? `+${ledger[0].amount}` : 0} 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid-2" style={{ gap: 28 }}>
        {/* Recharge Card */}
        <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>شحن الرصيد 💳</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            اشحن رصيدك الآن لتضمن استمرارية عمل الموظفة الرقمية دون انقطاع. يتم خصم 1 توكن لكل رسالة مرسلة.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { amount: 500, price: 50, popular: false },
              { amount: 1500, price: 120, popular: true },
              { amount: 5000, price: 350, popular: false },
            ].map(plan => (
              <div key={plan.amount} className="glass-card" style={{ 
                padding: 16, border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                position: 'relative'
              }}>
                {plan.popular && (
                  <div style={{ 
                    position: 'absolute', left: 16, top: -10, background: 'var(--primary)', 
                    color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 900 
                  }}>الأكثر طلباً</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{plan.amount} توكن</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>صلاحية غير محدودة</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--primary)' }}>{plan.price} ر.س</div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>شراء الآن</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Card */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>سجل العمليات 📜</h3>
          {ledger.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ledger.map(item => (
                <div key={item.id} style={{ 
                  padding: '12px 16px', borderRadius: 12, 
                  background: 'rgba(255,255,255,0.02)', display: 'flex', 
                  justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      color: item.amount > 0 ? 'var(--success)' : 'var(--error)',
                      background: item.amount > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      padding: 8, borderRadius: 8
                    }}>
                      {item.amount > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{item.reason}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={10} /> {new Date(item.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: item.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {item.amount > 0 ? `+${item.amount}` : item.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={CreditCard}
              title="لا توجد عمليات مسبقة"
              description="ستظهر هنا كافة عمليات شحن واستهلاك الرصيد."
            />
          )}
        </div>
      </div>
    </div>
  );
}
