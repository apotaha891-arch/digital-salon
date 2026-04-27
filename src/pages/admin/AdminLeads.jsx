import React, { useEffect, useState } from 'react';
import { MessageCircle, User, Mail, Phone, CheckCircle, Clock, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { adminGetLeads, adminMarkLeadResolved } from '../../services/admin';
import Spinner from '../../components/ui/Spinner';

export default function AdminLeads() {
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState('all'); // all | open | resolved

  useEffect(() => {
    adminGetLeads()
      .then(setLeads)
      .finally(() => setLoading(false));
  }, []);

  const toggleResolved = async (lead) => {
    const next = !lead.is_resolved;
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, is_resolved: next } : l));
    await adminMarkLeadResolved(lead.id, next).catch(() => {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, is_resolved: lead.is_resolved } : l));
    });
  };

  const filtered = leads.filter(l => {
    if (filter === 'open')     return !l.is_resolved;
    if (filter === 'resolved') return  l.is_resolved;
    return true;
  });

  const openCount     = leads.filter(l => !l.is_resolved).length;
  const resolvedCount = leads.filter(l =>  l.is_resolved).length;

  if (loading) return <div className="loading-center"><Spinner /></div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">💬 Concierge Leads</h1>
        <p className="page-subtitle">Visitor conversations from the website chatbot</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-number">{leads.length}</div>
          <div className="stat-label">Total Conversations</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--warning)' }}>{openCount}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--success)' }}>{resolvedCount}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {leads.filter(l => l.visitor_email || l.visitor_phone).length}
          </div>
          <div className="stat-label">With Contact Info</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all',      label: `All (${leads.length})` },
          { key: 'open',     label: `Open (${openCount})` },
          { key: 'resolved', label: `Resolved (${resolvedCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: '1px solid var(--border)',
              background: filter === key ? 'var(--primary)' : 'var(--surface2)',
              color: filter === key ? 'white' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Tajawal, sans-serif',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Lead cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No conversations yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            When visitors chat with the website concierge, their conversations will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(lead => {
            const isOpen = expanded === lead.id;
            const msgCount = Array.isArray(lead.messages) ? lead.messages.length : 0;
            const userMsgs = Array.isArray(lead.messages)
              ? lead.messages.filter(m => m.role === 'user').length : 0;
            const hasContact = lead.visitor_name || lead.visitor_email || lead.visitor_phone;
            const date = new Date(lead.created_at);

            return (
              <div
                key={lead.id}
                className="card"
                style={{
                  padding: 0, overflow: 'hidden',
                  border: `1px solid ${lead.is_resolved ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                }}
              >
                {/* Lead summary row */}
                <div
                  style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center',
                    gap: 14, cursor: 'pointer', userSelect: 'none',
                  }}
                  onClick={() => setExpanded(isOpen ? null : lead.id)}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: hasContact
                      ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                      : 'var(--surface2)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {hasContact ? <User size={18} color="white" /> : <Globe size={18} style={{ color: 'var(--text-muted)' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                      {lead.visitor_name || (lead.language === 'ar' ? 'زائر مجهول' : 'Anonymous Visitor')}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {lead.visitor_email && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={11} /> {lead.visitor_email}
                        </span>
                      )}
                      {lead.visitor_phone && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} /> {lead.visitor_phone}
                        </span>
                      )}
                      {!hasContact && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          No contact info
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700,
                        background: lead.language === 'ar' ? 'rgba(147,51,234,0.1)' : 'rgba(14,165,233,0.1)',
                        color: lead.language === 'ar' ? 'var(--primary)' : '#0EA5E9',
                      }}>
                        {lead.language === 'ar' ? 'عربي' : 'EN'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700,
                        background: lead.is_resolved ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: lead.is_resolved ? 'var(--success)' : 'var(--warning)',
                      }}>
                        {lead.is_resolved ? '✓ Resolved' : '● Open'}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageCircle size={11} /> {userMsgs} messages
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded conversation */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Chat history */}
                    <div style={{
                      padding: '16px 20px',
                      maxHeight: 320, overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      background: 'var(--surface2)',
                    }}>
                      {Array.isArray(lead.messages) && lead.messages
                        .filter(m => !m.text?.startsWith('[CONTACT]'))
                        .map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              maxWidth: '80%',
                              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                              background: msg.role === 'user'
                                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                                : 'var(--surface)',
                              color: msg.role === 'user' ? 'white' : 'var(--text)',
                              border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
                              padding: '8px 12px', borderRadius: 12,
                              fontSize: 13, lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              direction: 'auto', unicodeBidi: 'plaintext',
                            }}
                          >
                            {msg.text ?? msg.content}
                          </div>
                        ))}
                      {msgCount === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                          No messages recorded
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => toggleResolved(lead)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', borderRadius: 10,
                          border: `1px solid ${lead.is_resolved ? 'var(--border)' : 'rgba(16,185,129,0.4)'}`,
                          background: lead.is_resolved ? 'var(--surface2)' : 'rgba(16,185,129,0.08)',
                          color: lead.is_resolved ? 'var(--text-muted)' : 'var(--success)',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'Tajawal, sans-serif',
                        }}
                      >
                        <CheckCircle size={14} />
                        {lead.is_resolved ? 'Mark as Open' : 'Mark as Resolved'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
