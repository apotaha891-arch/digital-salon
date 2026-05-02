import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, X, ChevronRight, AtSign, Phone, MapPin, User, Tag,
  CheckSquare, Square, Calendar, Activity, Eye,
  TrendingUp, Target, Award, Clock, Edit3, AlertCircle,
  MessageSquare, Video, BarChart2, Bot, Send, SkipForward, RefreshCw,
} from 'lucide-react';
import { useSalesLeads, PIPELINE_STAGES, getTransitionError } from '../../hooks/useSalesLeads';
import { findDuplicateByHandle } from '../../services/salesLeads';
import { generateOutreachMessage, saveDraftMessage, markMessageSent, skipMessage, recordInboundReply, getLeadMessages } from '../../services/salesAgent';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_META = {
  prospect:      { label: 'Prospect',      color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  contacted:     { label: 'Contacted',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  replied:       { label: 'Replied',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)'  },
  demo_booked:   { label: 'Demo Booked',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  proposal_sent: { label: 'Proposal Sent', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  closed:        { label: 'Closed',        color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
};

const CLOSED_REASONS = [
  { value: 'won',             label: '🏆 Won' },
  { value: 'lost_price',      label: '💸 Lost – Price' },
  { value: 'lost_timing',     label: '⏱ Lost – Timing' },
  { value: 'lost_competitor', label: '⚔️ Lost – Competitor' },
  { value: 'no_response',     label: '🔇 No Response' },
];

const CITIES    = ['Riyadh', 'Jeddah', 'Dammam', 'Other'];
const SOURCES   = ['Instagram DM', 'Referral', 'WhatsApp', 'Website', 'Event'];
const ACT_TYPES = ['dm_sent', 'whatsapp_sent', 'call_completed', 'note', 'demo_completed', 'proposal_sent', 'follow_up'];
const ACT_ICONS = {
  dm_sent: '📩', whatsapp_sent: '💬', call_completed: '📞', note: '📝',
  demo_completed: '🎥', proposal_sent: '📄', follow_up: '🔔',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

function daysInStage(lead) {
  const ref = lead.status_changed_at || lead.updated_at || lead.created_at;
  return Math.floor((Date.now() - new Date(ref)) / 86400000);
}

function agingColor(days) {
  if (days > 10) return '#EF4444';
  if (days > 5)  return '#F59E0B';
  return null;
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Badge({ color, bg, children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color, background: bg }}>
      {children}
    </span>
  );
}

function Field({ label, span, children }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function InfoChip({ icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
      {icon} {text}
    </span>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

// ─── Manager KPI Dashboard ────────────────────────────────────────────────────

function ManagerKPIs({ leads }) {
  const kpis = useMemo(() => {
    const allActivities = leads.flatMap(l => l.activities || []);
    const today = startOfToday();
    const weekStart = startOfWeek();

    // Leads by stage
    const byStageCounts = {};
    PIPELINE_STAGES.forEach(s => { byStageCounts[s] = leads.filter(l => l.status === s).length; });

    // Conversion rates between adjacent stages (leads that reached stage N / leads that entered stage N-1)
    // Approximation: count of leads at or past each stage
    const atOrPast = (stage) => {
      const idx = PIPELINE_STAGES.indexOf(stage);
      return leads.filter(l => PIPELINE_STAGES.indexOf(l.status) >= idx).length;
    };
    const conversions = PIPELINE_STAGES.slice(1).map((stage, i) => {
      const prev = PIPELINE_STAGES[i];
      const base = atOrPast(prev);
      const reach = atOrPast(stage);
      return { from: prev, to: stage, rate: base > 0 ? Math.round((reach / base) * 100) : 0 };
    });

    // DMs sent today
    const dmsToday = allActivities.filter(a =>
      (a.type === 'dm_sent' || a.type === 'whatsapp_sent') &&
      new Date(a.created_at) >= today
    ).length;

    // Demos booked this week
    const demosThisWeek = leads.filter(l =>
      l.status === 'demo_booked' &&
      l.status_changed_at && new Date(l.status_changed_at) >= weekStart
    ).length;

    // Loss reason breakdown (closed deals only)
    const closedLost = leads.filter(l => l.status === 'closed' && l.closed_reason && l.closed_reason !== 'won');
    const lossReasons = CLOSED_REASONS.filter(r => r.value !== 'won').map(r => ({
      ...r,
      count: closedLost.filter(l => l.closed_reason === r.value).length,
    })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

    return { byStageCounts, conversions, dmsToday, demosThisWeek, lossReasons, totalLost: closedLost.length };
  }, [leads]);

  return (
    <div className="card" style={{ marginBottom: 24, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart2 size={16} color="var(--primary)" />
        <span style={{ fontWeight: 800, fontSize: 14 }}>Manager Dashboard</span>
      </div>

      {/* 4 KPI numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiBox value={leads.filter(l => l.status !== 'closed').length} label="Active Leads" color="var(--primary)" icon={<Target size={16} />} />
        <KpiBox value={kpis.dmsToday} label="DMs Sent Today" color="#3B82F6" icon={<MessageSquare size={16} />} />
        <KpiBox value={kpis.demosThisWeek} label="Demos This Week" color="#F59E0B" icon={<Video size={16} />} />
        <KpiBox
          value={`${kpis.conversions.find(c => c.to === 'closed')?.rate ?? 0}%`}
          label="Close Rate"
          color="var(--success)"
          icon={<Award size={16} />}
        />
      </div>

      {/* Stage funnel */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pipeline Funnel
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PIPELINE_STAGES.map(s => {
            const m = STAGE_META[s];
            const count = kpis.byStageCounts[s];
            return (
              <div key={s} style={{
                flex: '1 1 70px', padding: '8px 10px', borderRadius: 8,
                background: m.bg, textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{count}</div>
                <div style={{ fontSize: 10, color: m.color, fontWeight: 700, marginTop: 2 }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage conversion rates */}
      <div style={{ marginBottom: kpis.lossReasons.length > 0 ? 16 : 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Stage Conversions
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {kpis.conversions.map(c => (
            <div key={c.to} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 20,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}>
              {STAGE_META[c.from].label} → {STAGE_META[c.to].label}:
              {' '}<strong style={{ color: c.rate >= 50 ? 'var(--success)' : c.rate >= 25 ? 'var(--warning)' : '#EF4444' }}>{c.rate}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Loss reason breakdown — the most important feedback loop */}
      {kpis.lossReasons.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Why Deals Are Lost ({kpis.totalLost} lost)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {kpis.lossReasons.map(r => {
              const pct = kpis.totalLost > 0 ? Math.round((r.count / kpis.totalLost) * 100) : 0;
              const isTop = r === kpis.lossReasons[0];
              return (
                <div key={r.value}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: isTop ? 700 : 500, color: isTop ? '#EF4444' : 'var(--text)' }}>
                      {r.label} {isTop && '← top issue'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{r.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${pct}%`,
                      background: isTop ? '#EF4444' : 'var(--text-muted)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiBox({ value, label, color, icon }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div style={{ color, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ─── Lead Card (kanban) ───────────────────────────────────────────────────────

function LeadCard({ lead, onClick, onDragStart }) {
  const stage = STAGE_META[lead.status];
  const days = daysInStage(lead);
  const ageColor = agingColor(days);
  const openTasks = (lead.tasks || []).filter(t => !t.is_completed).length;

  return (
    <div
      className="card"
      draggable
      onDragStart={() => onDragStart(lead)}
      onClick={() => onClick(lead)}
      style={{
        padding: '12px 14px', cursor: 'grab', userSelect: 'none',
        borderLeft: `3px solid ${ageColor || stage.color}`,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{lead.salon_name}</div>
      {lead.owner_name && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{lead.owner_name}</div>
      )}

      {/* Days in stage badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <InfoChip icon={<MapPin size={11} />} text={lead.city} />
        </div>
        {lead.status !== 'closed' && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            background: ageColor ? `${ageColor}18` : 'var(--surface2)',
            color: ageColor || 'var(--text-muted)',
            border: `1px solid ${ageColor || 'var(--border)'}`,
          }}>
            {days}d
          </span>
        )}
      </div>

      {lead.assignee && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={11} /> {lead.assignee.full_name || lead.assignee.email}
        </div>
      )}
      {openTasks > 0 && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> {openTasks} task{openTasks > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ─── Lead Form Modal ──────────────────────────────────────────────────────────

function LeadFormModal({ lead, team, onSave, onClose, onOpenExisting }) {
  const isEdit = !!lead;
  const [form, setForm] = useState({
    salon_name:       lead?.salon_name       || '',
    owner_name:       lead?.owner_name       || '',
    instagram_handle: lead?.instagram_handle || '',
    whatsapp_number:  lead?.whatsapp_number  || '',
    city:             lead?.city             || 'Riyadh',
    source:           lead?.source           || 'Instagram DM',
    assigned_to:      lead?.assigned_to      || '',
    notes:            lead?.notes            || '',
  });
  const [saving, setSaving]         = useState(false);
  const [duplicate, setDuplicate]   = useState(null); // existing lead with same handle
  const [checkingDup, setCheckingDup] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleHandleBlur = async () => {
    if (isEdit || !form.instagram_handle.trim()) { setDuplicate(null); return; }
    setCheckingDup(true);
    const dup = await findDuplicateByHandle(form.instagram_handle).catch(() => null);
    setDuplicate(dup);
    setCheckingDup(false);
  };

  const handleSave = async () => {
    if (!form.salon_name.trim() || duplicate) return;
    setSaving(true);
    try {
      await onSave({ ...form, assigned_to: form.assigned_to || null });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{isEdit ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Salon Name *" span={2}>
            <input style={styles.input} value={form.salon_name}
              onChange={e => set('salon_name', e.target.value)} placeholder="e.g. Glow Studio" />
          </Field>
          <Field label="Owner Name">
            <input style={styles.input} value={form.owner_name}
              onChange={e => set('owner_name', e.target.value)} placeholder="e.g. Sara" />
          </Field>
          <Field label="WhatsApp Number">
            <input style={styles.input} value={form.whatsapp_number}
              onChange={e => set('whatsapp_number', e.target.value)} placeholder="+966..." />
          </Field>
          <Field label="Instagram Handle">
            <input
              style={{ ...styles.input, borderColor: duplicate ? '#EF4444' : undefined }}
              value={form.instagram_handle}
              onChange={e => { set('instagram_handle', e.target.value); setDuplicate(null); }}
              onBlur={handleHandleBlur}
              placeholder="@handle"
            />
            {checkingDup && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Checking for duplicates…</span>}
            {duplicate && (
              <div style={{
                marginTop: 6, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                fontSize: 12, color: '#EF4444',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Duplicate — this handle already exists</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>
                  <strong>{duplicate.salon_name}</strong> · {STAGE_META[duplicate.status]?.label}
                </div>
                <button
                  style={{ ...styles.btnSecondary, fontSize: 11, padding: '4px 10px' }}
                  onClick={() => { onOpenExisting(duplicate.id); onClose(); }}
                >
                  Open existing lead →
                </button>
              </div>
            )}
          </Field>
          <Field label="City">
            <select style={styles.input} value={form.city} onChange={e => set('city', e.target.value)}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select style={styles.input} value={form.source} onChange={e => set('source', e.target.value)}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Assign To">
            <select style={styles.input} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">Unassigned</option>
              {team.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
            </select>
          </Field>
          <Field label="Notes" span={2}>
            <textarea style={{ ...styles.input, minHeight: 70, resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any extra context..." />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={handleSave} disabled={saving || !!duplicate}>
            {saving ? <Spinner size={14} /> : (isEdit ? 'Save Changes' : 'Add Lead')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move Stage Modal ─────────────────────────────────────────────────────────

function MoveStageModal({ lead, userId, onMove, onClose }) {
  const [target, setTarget] = useState(lead.status);
  const [reason, setReason] = useState('won');
  const [demoAt, setDemoAt] = useState('');
  const [saving, setSaving] = useState(false);

  const gateError = target !== lead.status
    ? getTransitionError(lead, target, demoAt, target === 'closed' ? reason : null)
    : null;

  const handleMove = async () => {
    if (gateError) return;
    setSaving(true);
    try {
      await onMove(lead, target, userId, {
        closedReason:    target === 'closed' ? reason : null,
        demoScheduledAt: target === 'demo_booked' ? demoAt : null,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Move Pipeline Stage</h3>
          <button onClick={onClose} style={styles.iconBtn}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          Moving: <strong>{lead.salon_name}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {PIPELINE_STAGES.map(s => {
            const m = STAGE_META[s];
            return (
              <label key={s} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${target === s ? m.color : 'var(--border)'}`,
                background: target === s ? m.bg : 'transparent',
              }}>
                <input type="radio" name="stage" value={s} checked={target === s}
                  onChange={() => setTarget(s)} style={{ accentColor: m.color }} />
                <span style={{ fontWeight: 600, fontSize: 13, color: target === s ? m.color : 'var(--text)' }}>
                  {m.label}
                </span>
              </label>
            );
          })}
        </div>
        {target === 'demo_booked' && (
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Demo Date & Time *</label>
            <input type="datetime-local" style={{ ...styles.input, marginTop: 6 }}
              value={demoAt} onChange={e => setDemoAt(e.target.value)} />
          </div>
        )}
        {target === 'closed' && (
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Closed Reason *</label>
            <select style={{ ...styles.input, marginTop: 6 }} value={reason} onChange={e => setReason(e.target.value)}>
              {CLOSED_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        )}
        {gateError && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            {gateError}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button style={styles.btnPrimary} onClick={handleMove}
            disabled={saving || target === lead.status || !!gateError}>
            {saving ? <Spinner size={14} /> : 'Move'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({ lead, team, userId, onClose, onEdit, onMove, onLogActivity, onCreateTask, onCompleteTask }) {
  const [tab, setTab]               = useState('activities');
  const [actType, setActType]       = useState('note');
  const [actContent, setActContent] = useState('');
  const [taskDesc, setTaskDesc]     = useState('');
  const [taskDue, setTaskDue]       = useState('');
  const [taskAssignee, setTaskAssignee] = useState(userId || '');
  const [saving, setSaving]         = useState(false);

  // Agent tab state
  const [agentMessages, setAgentMessages]   = useState(null);
  const [agentLoading,  setAgentLoading]    = useState(false);
  const [agentError,    setAgentError]      = useState(null);
  const [inboundText,   setInboundText]     = useState('');
  const [generatingMsg, setGeneratingMsg]   = useState(false);

  const loadAgentMessages = async () => {
    if (agentMessages !== null) return;
    setAgentLoading(true);
    setAgentError(null);
    try { setAgentMessages(await getLeadMessages(lead.id)); }
    catch (e) { setAgentError(e.message); }
    finally { setAgentLoading(false); }
  };

  const handleGenerate = async () => {
    setGeneratingMsg(true);
    setAgentError(null);
    try {
      const text = await generateOutreachMessage(lead);
      const saved = await saveDraftMessage(lead.id, text);
      setAgentMessages(prev => [...(prev || []), saved]);
    } catch (e) {
      setAgentError(e.message);
    } finally {
      setGeneratingMsg(false);
    }
  };

  const handleSend = async (msg) => {
    const updated = await markMessageSent(msg.id, userId);
    setAgentMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
  };

  const handleSkip = async (msg) => {
    const updated = await skipMessage(msg.id);
    setAgentMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
  };

  const handleInbound = async () => {
    if (!inboundText.trim()) return;
    setSaving(true);
    try {
      const recorded = await recordInboundReply(lead.id, inboundText, userId);
      setAgentMessages(prev => [...(prev || []), recorded]);
      setInboundText('');
    } catch (e) {
      setAgentError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const activities = [...(lead.activities || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const tasks      = [...(lead.tasks || [])].sort((a, b) => (a.is_completed ? 1 : 0) - (b.is_completed ? 1 : 0));
  const stage      = STAGE_META[lead.status];
  const days       = daysInStage(lead);
  const ageColor   = agingColor(days);

  const submitActivity = async () => {
    if (!actContent.trim()) return;
    setSaving(true);
    try { await onLogActivity(lead.id, actType, actContent, userId); setActContent(''); }
    finally { setSaving(false); }
  };

  const submitTask = async () => {
    if (!taskDesc.trim()) return;
    setSaving(true);
    try { await onCreateTask(lead.id, taskDesc, taskDue || null, taskAssignee || null); setTaskDesc(''); setTaskDue(''); }
    finally { setSaving(false); }
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${stage.color}33, ${stage.color}66)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {lead.salon_name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{lead.salon_name}</h3>
            <Badge color={stage.color} bg={stage.bg}>{stage.label}</Badge>
            {lead.status !== 'closed' && ageColor && (
              <Badge color={ageColor} bg={`${ageColor}18`}>{days}d in stage</Badge>
            )}
          </div>
          {lead.owner_name && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lead.owner_name}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button style={styles.iconBtn} onClick={() => onEdit(lead)} title="Edit"><Edit3 size={15} /></button>
          <button style={styles.iconBtn} onClick={() => onMove(lead)} title="Move Stage"><ChevronRight size={15} /></button>
          <button style={styles.iconBtn} onClick={onClose}><X size={15} /></button>
        </div>
      </div>

      {/* Info row */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {lead.whatsapp_number && <InfoChip icon={<Phone size={12} />} text={lead.whatsapp_number} />}
        {lead.instagram_handle && <InfoChip icon={<AtSign size={12} />} text={lead.instagram_handle} />}
        <InfoChip icon={<MapPin size={12} />} text={lead.city} />
        <InfoChip icon={<Tag size={12} />} text={lead.source} />
        {lead.assignee && <InfoChip icon={<User size={12} />} text={lead.assignee.full_name || lead.assignee.email} />}
        {lead.demo_scheduled_at && (
          <InfoChip icon={<Video size={12} />} text={`Demo: ${fmtDate(lead.demo_scheduled_at)} ${fmtTime(lead.demo_scheduled_at)}`} />
        )}
        {lead.status === 'closed' && lead.closed_reason && (
          <InfoChip icon={<AlertCircle size={12} />} text={CLOSED_REASONS.find(r => r.value === lead.closed_reason)?.label || lead.closed_reason} />
        )}
      </div>

      {lead.notes && (
        <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {lead.notes}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        {[
          { key: 'activities', icon: <Activity size={13} />, label: `Activities (${activities.length})` },
          { key: 'tasks', icon: <CheckSquare size={13} />, label: `Tasks (${tasks.filter(t => !t.is_completed).length} open)` },
          { key: 'agent', icon: <Bot size={13} />, label: 'AI Agent' },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'agent') loadAgentMessages(); }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 0', marginRight: 24, fontSize: 12, fontWeight: 700,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
            fontFamily: 'Tajawal, sans-serif',
          }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'activities' && (
          <>
            <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select style={{ ...styles.input, flex: '0 0 auto', width: 160 }} value={actType} onChange={e => setActType(e.target.value)}>
                  {ACT_TYPES.map(t => <option key={t} value={t}>{ACT_ICONS[t]} {t.replace(/_/g, ' ')}</option>)}
                </select>
                <textarea style={{ ...styles.input, flex: 1, minHeight: 60, resize: 'vertical' }}
                  placeholder="Enter details or message content..."
                  value={actContent} onChange={e => setActContent(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={styles.btnPrimary} onClick={submitActivity} disabled={saving || !actContent.trim()}>
                  {saving ? <Spinner size={13} /> : 'Log Activity'}
                </button>
              </div>
            </div>
            {activities.length === 0 ? (
              <EmptyState icon="📋" text="No activities yet. Log the first interaction." />
            ) : activities.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                  {ACT_ICONS[a.type] || '📌'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{a.type.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(a.created_at)} {fmtTime(a.created_at)}</span>
                  </div>
                  {a.content && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{a.content}</p>}
                  {a.performer && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {a.performer.full_name || '—'}</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'agent' && (
          <>
            {agentError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 13 }}>
                {agentError}
              </div>
            )}

            {/* Generate button */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={{ ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleGenerate}
                disabled={generatingMsg}
              >
                {generatingMsg ? <Spinner size={13} /> : <Bot size={13} />}
                {generatingMsg ? 'Generating…' : 'Generate Message'}
              </button>
              <button
                style={{ ...styles.iconBtn, padding: '6px 10px', fontSize: 12 }}
                onClick={() => { setAgentMessages(null); loadAgentMessages(); }}
                title="Refresh"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Inbound reply logger */}
            <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Log Incoming Reply
              </div>
              <textarea
                style={{ ...styles.input, minHeight: 56, resize: 'vertical' }}
                placeholder="Paste the salon owner's reply here to classify intent…"
                value={inboundText}
                onChange={e => setInboundText(e.target.value)}
              />
              <button
                style={{ ...styles.btnPrimary, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleInbound}
                disabled={saving || !inboundText.trim()}
              >
                {saving ? <Spinner size={13} /> : <Activity size={13} />}
                Classify &amp; Log
              </button>
            </div>

            {/* Message thread */}
            {agentLoading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>}
            {!agentLoading && agentMessages?.length === 0 && (
              <EmptyState icon="🤖" text="No messages yet. Click Generate to draft the first outreach." />
            )}
            {(agentMessages || []).map(msg => {
              const isOut = msg.direction === 'outbound';
              const intentColors = { POSITIVE: '#10b981', QUESTION: '#3b82f6', NEGATIVE: '#ef4444', AMBIGUOUS: '#f59e0b' };
              return (
                <div key={msg.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  alignItems: isOut ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '90%', padding: '10px 14px', borderRadius: 12,
                    fontSize: 13, lineHeight: 1.6,
                    background: isOut ? 'var(--primary)' : 'var(--surface2)',
                    color: isOut ? '#fff' : 'var(--text-primary)',
                    border: isOut ? 'none' : '1px solid var(--border)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    {isOut && msg.status === 'draft' && (
                      <>
                        <button onClick={() => handleSend(msg)} style={{ ...styles.iconBtn, fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', borderColor: '#10b981' }}>
                          <Send size={11} /> Mark Sent
                        </button>
                        <button onClick={() => handleSkip(msg)} style={{ ...styles.iconBtn, fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <SkipForward size={11} /> Skip
                        </button>
                      </>
                    )}
                    {isOut && msg.status === 'sent'    && <span style={{ color: '#10b981' }}>✓ Sent</span>}
                    {isOut && msg.status === 'skipped' && <span>Skipped</span>}
                    {!isOut && msg.intent && (
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: `${intentColors[msg.intent]}22`, color: intentColors[msg.intent], fontWeight: 700 }}>
                        {msg.intent}
                      </span>
                    )}
                    {!isOut && msg.escalated && (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠ Escalated</span>
                    )}
                    <span>{fmtDate(msg.created_at)} {fmtTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'tasks' && (
          <>
            <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={styles.input} placeholder="Task description..." value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" style={{ ...styles.input, flex: 1 }} value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                <select style={{ ...styles.input, flex: 1 }} value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.full_name || m.email}</option>)}
                </select>
                <button style={styles.btnPrimary} onClick={submitTask} disabled={saving || !taskDesc.trim()}>
                  {saving ? <Spinner size={13} /> : <Plus size={14} />}
                </button>
              </div>
            </div>
            {tasks.length === 0 ? (
              <EmptyState icon="✅" text="No tasks yet." />
            ) : tasks.map(t => (
              <div key={t.id} className="card" style={{
                padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                opacity: t.is_completed ? 0.55 : 1,
              }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, color: t.is_completed ? 'var(--success)' : 'var(--text-muted)' }}
                  onClick={() => onCompleteTask(lead.id, t.id, !t.is_completed)}>
                  {t.is_completed ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, textDecoration: t.is_completed ? 'line-through' : 'none' }}>{t.description}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {t.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {fmtDate(t.due_date)}</span>}
                    {t.assignee && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {t.assignee.full_name || '—'}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSalesCRM() {
  const { user } = useAuth();
  const {
    leads, team, loading, error,
    addLead, editLead, moveLead,
    logActivity, createTask, completeTask,
  } = useSalesLeads();

  const [myLeadsOnly, setMyLeadsOnly]     = useState(false);
  const [search, setSearch]               = useState('');
  const [filterCity, setFilterCity]       = useState('all');
  const [filterSource, setFilterSource]   = useState('all');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editTarget, setEditTarget]       = useState(null);
  const [moveTarget, setMoveTarget]       = useState(null);
  const [detailLead, setDetailLead]       = useState(null);
  const [showDashboard, setShowDashboard] = useState(true);

  // Drag-and-drop state
  const dragLead = useRef(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (myLeadsOnly && l.assigned_to !== user?.id) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.salon_name?.toLowerCase().includes(q) && !l.owner_name?.toLowerCase().includes(q) && !l.whatsapp_number?.includes(q)) return false;
      }
      if (filterCity !== 'all' && l.city !== filterCity) return false;
      if (filterSource !== 'all' && l.source !== filterSource) return false;
      return true;
    });
  }, [leads, myLeadsOnly, search, filterCity, filterSource, user?.id]);

  const handleSaveLead = async (formData) => {
    if (editTarget) {
      const updated = await editLead(editTarget.id, formData);
      if (detailLead?.id === editTarget.id) setDetailLead(updated);
    } else {
      await addLead(formData);
    }
  };

  const handleMove = async (lead, status, userId, opts) => {
    const updated = await moveLead(lead, status, userId, opts);
    if (detailLead?.id === lead.id) setDetailLead(updated);
  };

  // Drag-and-drop handlers
  const handleDragStart = (lead) => { dragLead.current = lead; };

  const handleDrop = async (targetStage) => {
    const lead = dragLead.current;
    dragLead.current = null;
    setDragOverStage(null);
    if (!lead || lead.status === targetStage) return;
    // Gate check — if it fails, open the move modal instead so the user can resolve it
    const err = getTransitionError(lead, targetStage, null, null);
    if (err || targetStage === 'demo_booked' || targetStage === 'closed') {
      setMoveTarget({ ...lead, _pendingStage: targetStage });
      return;
    }
    await handleMove(lead, targetStage, user?.id, {});
  };

  const syncedDetail = detailLead ? leads.find(l => l.id === detailLead.id) || detailLead : null;

  // Pre-select the pending stage in MoveStageModal when dragged
  const moveModalLead = moveTarget
    ? { ...moveTarget, _resolvedStatus: moveTarget.status }
    : null;

  if (loading) return <div className="loading-center"><Spinner /></div>;
  if (error)   return <div style={{ padding: 40, color: 'var(--error)', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingBottom: 40 }}>

        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Sales CRM</h1>
            <p className="page-subtitle">Track salon prospects through your sales pipeline</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => setShowDashboard(v => !v)}
            >
              <BarChart2 size={14} /> {showDashboard ? 'Hide' : 'Show'} Dashboard
            </button>
            <button
              style={{
                ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6,
                background: myLeadsOnly ? 'var(--primary)' : undefined,
                color: myLeadsOnly ? 'white' : undefined,
                borderColor: myLeadsOnly ? 'var(--primary)' : undefined,
              }}
              onClick={() => setMyLeadsOnly(v => !v)}
            >
              <Eye size={14} /> {myLeadsOnly ? 'My Leads' : 'All Leads'}
            </button>
            <button style={styles.btnPrimary} onClick={() => { setEditTarget(null); setShowAddModal(true); }}>
              <Plus size={15} /> Add Lead
            </button>
          </div>
        </div>

        {/* Manager KPI dashboard */}
        {showDashboard && <ManagerKPIs leads={leads} />}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            style={{ ...styles.input, flex: '1 1 200px', maxWidth: 280 }}
            placeholder="Search salon, owner, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={{ ...styles.input, flex: '0 0 auto' }} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="all">All Cities</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ ...styles.input, flex: '0 0 auto' }} value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="all">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Kanban board */}
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
          {PIPELINE_STAGES.map(stage => {
            const meta = STAGE_META[stage];
            const stageLeads = filtered.filter(l => l.status === stage);
            const isOver = dragOverStage === stage;
            return (
              <div
                key={stage}
                style={{ flex: '0 0 220px', minWidth: 220 }}
                onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column header */}
                <div style={{
                  padding: '8px 12px', borderRadius: 10, marginBottom: 10,
                  background: isOver ? meta.color : meta.bg,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.15s',
                }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: isOver ? 'white' : meta.color }}>{meta.label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: isOver ? 'rgba(255,255,255,0.3)' : meta.color, color: 'white',
                  }}>{stageLeads.length}</span>
                </div>

                {/* Cards */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  minHeight: 60,
                  border: isOver ? `2px dashed ${meta.color}` : '2px dashed transparent',
                  borderRadius: 10, padding: isOver ? 4 : 0, transition: 'all 0.15s',
                }}>
                  {stageLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={setDetailLead} onDragStart={handleDragStart} />
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{
                      padding: '20px 12px', textAlign: 'center', fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      {isOver ? '⬇ Drop here' : 'No leads'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {syncedDetail && (
        <LeadDetailPanel
          lead={syncedDetail}
          team={team}
          userId={user?.id}
          onClose={() => setDetailLead(null)}
          onEdit={(l) => { setEditTarget(l); setShowAddModal(true); }}
          onMove={(l) => setMoveTarget(l)}
          onLogActivity={logActivity}
          onCreateTask={createTask}
          onCompleteTask={completeTask}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <LeadFormModal
          lead={editTarget}
          team={team}
          onSave={handleSaveLead}
          onClose={() => { setShowAddModal(false); setEditTarget(null); }}
          onOpenExisting={(id) => {
            const existing = leads.find(l => l.id === id);
            if (existing) setDetailLead(existing);
            setShowAddModal(false);
            setEditTarget(null);
          }}
        />
      )}
      {moveTarget && (
        <MoveStageModal
          lead={moveTarget}
          userId={user?.id}
          onMove={handleMove}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  },
  modal: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '24px', width: '100%', maxHeight: '90vh',
    overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { margin: 0, fontSize: 17, fontWeight: 800 },
  panel: {
    width: 400, flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex', flexDirection: 'column',
    height: '100%', overflowY: 'hidden',
    position: 'sticky', top: 0,
  },
  input: {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px', fontSize: 13,
    color: 'var(--text)', fontFamily: 'Tajawal, sans-serif', width: '100%',
    outline: 'none', boxSizing: 'border-box',
  },
  label: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' },
  iconBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 8,
    padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    color: 'var(--text-muted)',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 10,
    background: 'var(--primary)', color: 'white',
    border: 'none', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
  },
  btnSecondary: {
    padding: '9px 18px', borderRadius: 10,
    background: 'var(--surface2)', color: 'var(--text)',
    border: '1px solid var(--border)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
  },
};
