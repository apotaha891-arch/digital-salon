import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, User, Phone, Briefcase, CheckSquare, Square, Loader2 } from 'lucide-react';

const ROLE_EMOJIS = ['💇', '💅', '🧖', '💆', '✂️', '🎨', '💄', '👑'];

const EMPTY_FORM = { name: '', role: '', phone: '', avatar: '💇', specialties: [], is_active: true };

export default function StaffTab({ staff, services, onAdd, onEdit, onRemove }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };

  const openEdit = (member) => {
    setForm({
      name: member.name || '',
      role: member.role || '',
      phone: member.phone || '',
      avatar: member.avatar || '💇',
      specialties: member.specialties || [],
      is_active: member.is_active !== false,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const toggleSpecialty = (serviceId) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(serviceId)
        ? prev.specialties.filter(id => id !== serviceId)
        : [...prev.specialties, serviceId],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await onEdit(editingId, form);
      } else {
        await onAdd(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    setDeletingId(id);
    try { await onRemove(id); } finally { setDeletingId(null); }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h3 style={{ fontWeight: 900, marginBottom: 4 }}>
            {isAr ? '👩‍💼 فريق العمل' : '👩‍💼 Staff Members'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {isAr ? 'أضيفي فريق العمل وحددي التخصصات لكل موظفة' : 'Add your team and assign specialties to each member'}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={16} /> {isAr ? 'إضافة موظفة' : 'Add Member'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: 28, marginBottom: 24,
        }}>
          <h4 style={{ fontWeight: 800, marginBottom: 20, fontSize: 15 }}>
            {editingId ? (isAr ? 'تعديل الموظفة' : 'Edit Member') : (isAr ? 'موظفة جديدة' : 'New Member')}
          </h4>

          {/* Avatar picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              {isAr ? 'الأيقونة' : 'Icon'}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLE_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm(p => ({ ...p, avatar: emoji }))}
                  style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 20,
                    border: `2px solid ${form.avatar === emoji ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.avatar === emoji ? 'rgba(217,70,239,0.1)' : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {isAr ? 'الاسم *' : 'Name *'}
              </label>
              <input
                className="form-input neon-input"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={isAr ? 'مثال: سارة أحمد' : 'e.g. Sara Ahmed'}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {isAr ? 'التخصص / المسمى الوظيفي' : 'Role / Title'}
              </label>
              <input
                className="form-input neon-input"
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder={isAr ? 'مثال: مصففة شعر' : 'e.g. Hair Stylist'}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {isAr ? 'رقم الهاتف' : 'Phone'}
              </label>
              <input
                className="form-input neon-input"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
                {isAr ? 'نشطة حالياً' : 'Currently Active'}
              </label>
            </div>
          </div>

          {/* Specialties */}
          {services.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
                {isAr ? 'الخدمات التي تقدمها (اختياري)' : 'Services she provides (optional)'}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {services.map(svc => {
                  const selected = form.specialties.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleSpecialty(svc.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'rgba(217,70,239,0.1)' : 'var(--surface)',
                        color: selected ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                      }}
                    >
                      {selected ? <CheckSquare size={14} /> : <Square size={14} />}
                      {svc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary" style={{ flex: 1 }}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn btn-primary" style={{ flex: 2 }}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (isAr ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {staff.map(member => {
          const memberServices = services.filter(s => (member.specialties || []).includes(s.id));
          return (
            <div
              key={member.id}
              className="glass-card"
              style={{
                padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
                background: member.is_active ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)',
                opacity: member.is_active ? 1 : 0.6,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary)20, var(--secondary)20)',
                border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>
                {member.avatar || '💇'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{member.name}</span>
                  {!member.is_active && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 6,
                      background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700,
                    }}>
                      {isAr ? 'غير نشطة' : 'Inactive'}
                    </span>
                  )}
                </div>
                {member.role && (
                  <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                    <Briefcase size={11} style={{ display: 'inline', marginInlineEnd: 4 }} />
                    {member.role}
                  </div>
                )}
                {member.phone && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <Phone size={10} style={{ display: 'inline', marginInlineEnd: 4 }} />
                    {member.phone}
                  </div>
                )}
                {memberServices.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {memberServices.map(s => (
                      <span key={s.id} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(217,70,239,0.08)', color: 'var(--primary)',
                        border: '1px solid rgba(217,70,239,0.2)', fontWeight: 600,
                      }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(member)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
                >
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={deletingId === member.id}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {deletingId === member.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          );
        })}

        {staff.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👩‍💼</div>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>
              {isAr ? 'لم تُضيفي أي موظفة بعد' : 'No staff members yet'}
            </p>
            <p style={{ fontSize: 13 }}>
              {isAr ? 'أضيفي فريق العمل لربطهم بالحجوزات والخدمات' : 'Add your team to link them with bookings and services'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
