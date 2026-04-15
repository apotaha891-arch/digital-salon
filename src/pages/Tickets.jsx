import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTickets, updateTicketStatus } from '../services/supabase';
import { MessageSquare, User, Phone, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const loadTickets = async () => {
    try {
      const data = await getTickets(user.id);
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateTicketStatus(id, status);
      await loadTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Sidebar List */}
      <div className="card" style={{ width: 350, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>استفسارات العميلات 💬</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              لا توجد تذاكر حالياً
            </div>
          ) : (
            tickets.map(t => (
              <div 
                key={t.id} 
                className={`ticket-item ${selectedTicket?.id === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTicket(t)}
                style={{
                  padding: 16, borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  background: selectedTicket?.id === t.id ? 'rgba(217,70,239,0.05)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{t.customer_name}</span>
                  <span className={`badge ${t.status === 'open' ? 'badge-inactive' : t.status === 'resolved' ? 'badge-active' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                    {t.status === 'open' ? 'جديد' : t.status === 'resolved' ? 'محلول' : 'قيد المعالجة'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {new Date(t.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Content */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {selectedTicket ? (
          <>
            <div style={{ padding: 24, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{selectedTicket.subject}</h2>
                <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14} /> {selectedTicket.customer_name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> {selectedTicket.customer_phone}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTicket.status !== 'resolved' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatus(selectedTicket.id, 'resolved')}>
                    <CheckCircle size={14} /> تم الحل
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(selectedTicket.id, 'open')}>
                    إعادة فتح التذكرة
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: 'var(--surface2)' }}>
              <div className="card" style={{ marginBottom: 20, background: 'var(--surface)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                  {selectedTicket.message}
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                  أرسلت في: {new Date(selectedTicket.created_at).toLocaleString('ar-SA')}
                </div>
              </div>

              {selectedTicket.status === 'resolved' && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--success)', background: 'rgba(16,185,129,0.05)', borderRadius: 12 }}>
                   تم تعليم هذا الاستفسار كمحلول وتم التواصل مع العميلة.
                </div>
              )}
            </div>

            <div style={{ padding: 20, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                قم بالتواصل مع العميلة عبر هاتفها {selectedTicket.customer_phone} ثم قم بتغيير حالة التذكرة.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href={`https://wa.me/${selectedTicket.customer_phone.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" 
                  className="btn btn-secondary" style={{ flex: 1 }}>
                   تواصل عبر واتساب
                </a>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleStatus(selectedTicket.id, 'in_progress')}>
                  قيد المعالجة
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <MessageSquare size={64} strokeWidth={1} style={{ marginBottom: 20, opacity: 0.5 }} />
            <p>اختر تذكرة من القائمة الجانبية لعرض التفاصيل</p>
          </div>
        )}
      </div>
    </div>
  );
}
