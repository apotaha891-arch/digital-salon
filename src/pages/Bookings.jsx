import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { useBusiness } from '../hooks/useBusiness';
import { useCustomers } from '../hooks/useCustomers';
import { useStaff } from '../hooks/useStaff';
import {
  Calendar, Clock, Phone, Scissors, CheckCircle, XCircle,
  AlertCircle, CalendarCheck, CalendarX, Filter, ChevronLeft, ChevronRight,
  MessageCircle, Send, Camera, Plus, X, Loader2, Search, UserPlus, User
} from 'lucide-react';
import Spinner from '../components/ui/Spinner';

const STATUS_CONFIG = {
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: AlertCircle,   label_ar: 'قيد الانتظار', label_en: 'Pending' },
  confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.3)',  icon: CheckCircle,   label_ar: 'مؤكد',         label_en: 'Confirmed' },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)',   icon: XCircle,       label_ar: 'ملغي',         label_en: 'Cancelled' },
  completed: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.3)',  icon: CalendarCheck, label_ar: 'مكتمل',        label_en: 'Completed' },
};

const CHANNEL_ICONS = {
  whatsapp:  { icon: MessageCircle, color: '#25D366' },
  instagram: { icon: Camera,        color: '#E1306C' },
  telegram:  { icon: Send,          color: '#0088cc' },
  facebook:  { icon: MessageCircle, color: '#0084FF' },
  manual:    { icon: Calendar,      color: '#8B5CF6' },
};

const PAGE_SIZE = 8;

const EMPTY_FORM = { clientName: '', clientPhone: '', serviceName: '', date: '', time: '', staffId: '', staffName: '' };

export default function Bookings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { bookings, loading, updateStatus, addBooking, filters, setFilters } = useBookings(user?.id);
  const { business } = useBusiness(user?.id);
  const { customers } = useCustomers(user?.id);
  const { staff } = useStaff(user?.id);
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const isAr = i18n.language === 'ar';

  const services = business?.services || [];
  const activeStaff = staff.filter(s => s.is_active !== false);

  // Staff eligible for the selected service
  const eligibleStaff = form.serviceName
    ? activeStaff.filter(s => {
        if (!s.specialties || s.specialties.length === 0) return true;
        const svc = services.find(sv => sv.name === form.serviceName);
        return svc ? s.specialties.includes(svc.id) : true;
      })
    : activeStaff;

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  }).slice(0, 6);

  const selectCustomer = (c) => {
    setForm(p => ({ ...p, clientName: c.full_name, clientPhone: c.phone || p.clientPhone }));
    setCustomerSearch(c.full_name);
    setShowCustomerDropdown(false);
  };

  const handleAdd = async () => {
    if (!form.clientName || !form.serviceName || !form.date || !form.time) {
      setFormError(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await addBooking({
        ...form,
        channel: 'manual',
        staffId:   form.staffId   || null,
        staffName: form.staffName || null,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setCustomerSearch('');
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setCustomerSearch('');
    setFormError('');
    setShowCustomerDropdown(false);
  };

  // Summary counts
  const counts = useMemo(() => {
    const c = { all: bookings.length, pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
    bookings.forEach(b => { if (c[b.status] !== undefined) c[b.status]++; });
    return c;
  }, [bookings]);

  // Today's bookings
  const today = new Date().toISOString().split('T')[0];
  const todayCount = useMemo(() => bookings.filter(b => b.appointment_date === today).length, [bookings, today]);

  // Pagination
  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const pageBookings = bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <Spinner centered />;

  const statusTabs = [
    { key: '',          label: isAr ? 'الكل' : 'All',       count: counts.all },
    { key: 'pending',   label: isAr ? 'قيد الانتظار' : 'Pending',   count: counts.pending,   ...STATUS_CONFIG.pending },
    { key: 'confirmed', label: isAr ? 'مؤكد' : 'Confirmed', count: counts.confirmed, ...STATUS_CONFIG.confirmed },
    { key: 'cancelled', label: isAr ? 'ملغي' : 'Cancelled', count: counts.cancelled, ...STATUS_CONFIG.cancelled },
  ];

  return (
    <div className="fade-in">

      {/* Add Booking Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={e => { e.target === e.currentTarget && closeModal(); setShowCustomerDropdown(false); }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)',
            padding: 32, width: '100%', maxWidth: 480, animation: 'slideUp 0.2s ease',
          }} onClick={() => setShowCustomerDropdown(false)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>
                {isAr ? '+ إضافة حجز يدوي' : '+ Add Manual Booking'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Customer Search Field */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  {isAr ? 'العميل *' : 'Customer *'}
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={customerSearch}
                    placeholder={isAr ? 'ابحث عن عميل أو اكتب اسماً جديداً...' : 'Search customer or type new name...'}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setForm(p => ({ ...p, clientName: e.target.value }));
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box', paddingInlineStart: 36 }}
                  />
                </div>
                {/* Dropdown */}
                {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 100,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 12, marginTop: 4, overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}>
                    {filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                          borderBottom: '1px solid var(--border)', transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,70,239,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 900, fontSize: 13
                        }}>
                          {c.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.full_name}</div>
                          {c.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone — auto-filled or manual */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  {isAr ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={form.clientPhone}
                  placeholder="05xxxxxxxx"
                  onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Date & Time */}
              {[
                { key: 'date', label: isAr ? 'تاريخ الموعد *' : 'Appointment Date *', type: 'date' },
                { key: 'time', label: isAr ? 'وقت الموعد *'   : 'Appointment Time *', type: 'time' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  {isAr ? 'الخدمة *' : 'Service *'}
                </label>
                {services.length > 0 ? (
                  <select
                    value={form.serviceName}
                    onChange={e => setForm(p => ({ ...p, serviceName: e.target.value, staffId: '', staffName: '' }))}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="">{isAr ? '— اختر الخدمة —' : '— Select Service —'}</option>
                    {services.map((s, i) => (
                      <option key={i} value={s.name || s}>{s.name || s}{s.price ? ` — ${s.price}` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.serviceName}
                    placeholder={isAr ? 'قص شعر، صبغة...' : 'Haircut, Color...'}
                    onChange={e => setForm(p => ({ ...p, serviceName: e.target.value, staffId: '', staffName: '' }))}
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Staff picker */}
              {activeStaff.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                    {isAr ? 'الموظفة / الخبيرة' : 'Staff Member'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {/* No preference option */}
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, staffId: '', staffName: '' }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${!form.staffId ? 'var(--primary)' : 'var(--border)'}`,
                        background: !form.staffId ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                        color: !form.staffId ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {isAr ? 'أي موظفة' : 'Any'}
                    </button>
                    {eligibleStaff.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, staffId: member.id, staffName: member.name }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          border: `1.5px solid ${form.staffId === member.id ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.staffId === member.id ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
                          color: form.staffId === member.id ? 'var(--primary)' : 'var(--text)',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{member.avatar || '👤'}</span>
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={closeModal} className="btn btn-secondary" style={{ flex: 1 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleAdd} disabled={saving} className="btn btn-primary" style={{ flex: 2 }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (isAr ? 'إضافة الحجز' : 'Add Booking')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={26} style={{ color: 'var(--primary)' }} />
            {t('bookings.title')}
          </h1>
          <p className="page-subtitle">{t('bookings.subtitle')}</p>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={16} />
            {isAr ? 'إضافة حجز' : 'Add Booking'}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => setFilters({ ...filters, date: today })}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
              background: filters.date === today ? 'rgba(217,70,239,0.1)' : 'var(--surface2)',
              color: filters.date === today ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          >
            {isAr ? `📅 اليوم (${todayCount})` : `📅 Today (${todayCount})`}
          </button>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 150, height: 38, fontSize: 12, borderRadius: 10 }}
            value={filters.date || ''}
            onChange={(e) => { setFilters({ ...filters, date: e.target.value }); setPage(0); }}
          />
          {filters.date && (
            <button
              onClick={() => setFilters({ ...filters, date: '' })}
              style={{
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: 'rgba(239,68,68,0.1)', color: 'var(--error)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
              }}
            >
              ✕
            </button>
          )}
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {statusTabs.map(tab => {
          const isActive = (filters.status || '') === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setFilters({ ...filters, status: tab.key }); setPage(0); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12,
                background: isActive ? (tab.bg || 'rgba(217,70,239,0.1)') : 'var(--surface)',
                border: `1.5px solid ${isActive ? (tab.border || 'var(--primary)') : 'var(--border)'}`,
                color: isActive ? (tab.color || 'var(--primary)') : 'var(--text-muted)',
                fontSize: 13, fontWeight: isActive ? 800 : 500,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              {tab.icon ? <tab.icon size={15} /> : <Filter size={15} />}
              {tab.label}
              <span style={{
                background: isActive ? (tab.color || 'var(--primary)') : 'var(--surface2)',
                color: isActive ? 'white' : 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 900
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings Table */}
      {bookings.length > 0 ? (
        <div style={{ 
          background: 'var(--surface)', borderRadius: 20, 
          border: '1px solid var(--border)', overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px',
            padding: '14px 24px',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            <span>{isAr ? 'العميلة' : 'Customer'}</span>
            <span>{isAr ? 'الخدمة' : 'Service'}</span>
            <span>{isAr ? 'الموظفة' : 'Staff'}</span>
            <span>{isAr ? 'التاريخ' : 'Date'}</span>
            <span>{isAr ? 'الوقت' : 'Time'}</span>
            <span>{isAr ? 'الحالة' : 'Status'}</span>
            <span style={{ textAlign: 'center' }}>{isAr ? 'إجراء' : 'Action'}</span>
          </div>

          {/* Table Rows */}
          {pageBookings.map((booking, idx) => {
            const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const SIcon = sc.icon;
            const channel = CHANNEL_ICONS[booking.channel] || CHANNEL_ICONS.manual;
            const CIcon = channel.icon;
            const isToday = booking.appointment_date === today;

            return (
              <div
                key={booking.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 100px',
                  padding: '16px 24px',
                  alignItems: 'center',
                  borderBottom: idx < pageBookings.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                  background: isToday ? 'rgba(217,70,239,0.02)' : 'transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,70,239,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(217,70,239,0.02)' : 'transparent'}
              >
                {/* Customer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${sc.color}20, ${sc.color}10)`,
                    border: `1px solid ${sc.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sc.color, fontWeight: 900, fontSize: 15
                  }}>
                    {booking.client_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.client_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={9} />
                      {booking.client_phone || '-'}
                      <CIcon size={9} style={{ color: channel.color, marginInlineStart: 4 }} />
                    </div>
                  </div>
                </div>

                {/* Service */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Scissors size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {booking.service_name}
                  </span>
                </div>

                {/* Staff */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {booking.staff_name ? (
                    <>
                      <User size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {booking.staff_name}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--primary)' : 'var(--text)' }}>
                    {isToday 
                      ? (isAr ? 'اليوم' : 'Today')
                      : new Date(booking.appointment_date + 'T00:00').toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
                    }
                  </span>
                </div>

                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {booking.appointment_time?.substring(0, 5)}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8,
                    background: sc.bg, color: sc.color,
                    fontSize: 11, fontWeight: 700,
                    border: `1px solid ${sc.border}`
                  }}>
                    <SIcon size={12} />
                    {isAr ? sc.label_ar : sc.label_en}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {booking.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => updateStatus(booking.id, 'confirmed')}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: 'rgba(16,185,129,0.1)', color: '#10B981',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                        title={isAr ? 'تأكيد' : 'Confirm'}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        title={isAr ? 'إلغاء' : 'Cancel'}
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>—</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 24px', background: 'var(--surface2)',
              borderTop: '1px solid var(--border)'
            }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                <ChevronRight size={14} />
                {isAr ? 'السابق' : 'Prev'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {page + 1} / {totalPages}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                {isAr ? 'التالي' : 'Next'}
                <ChevronLeft size={14} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div style={{ 
          padding: 80, textAlign: 'center', 
          background: 'var(--surface)', borderRadius: 20,
          border: '1px solid var(--border)'
        }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
            background: 'rgba(217,70,239,0.1)', border: '1px solid rgba(217,70,239,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CalendarX size={36} style={{ color: 'var(--primary)' }} />
          </div>
          <h3 style={{ fontWeight: 900, marginBottom: 8 }}>{t('bookings.empty.title')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('bookings.empty.description')}</p>
        </div>
      )}
    </div>
  );
}
