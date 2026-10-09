import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Search, Eye, X, PhoneCall } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { RoomType } from './RoomTypesPage';
import '../admin.css';

interface BookingRecord {
  id: string;
  room_type_id: string;
  room_unit_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  qty: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  hold_expires_at: string | null;
  source: 'online' | 'manual';
  notes: string | null;
  created_at: string;
  updated_at: string;
  room_types?: { name: string };
  booking_units?: { room_units: { unit_label: string } }[];
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed': return 'admin-badge admin-badge-confirmed';
    case 'pending': return 'admin-badge admin-badge-pending';
    case 'cancelled':
    case 'expired': return 'admin-badge admin-badge-cancelled';
    default: return 'admin-badge';
  }
}

function paymentBadgeClass(status: string): string {
  return status === 'paid' ? 'admin-badge admin-badge-paid' : 'admin-badge admin-badge-unpaid';
}

export function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formRoomTypeId, setFormRoomTypeId] = useState('');
  const [formGuestName, setFormGuestName] = useState('');
  const [formGuestEmail, setFormGuestEmail] = useState('');
  const [formGuestPhone, setFormGuestPhone] = useState('');
  const [formCheckIn, setFormCheckIn] = useState('');
  const [formCheckOut, setFormCheckOut] = useState('');
  const [formGuestsCount, setFormGuestsCount] = useState(2);
  const [formQty, setFormQty] = useState(1);
  const [formTotalAmount, setFormTotalAmount] = useState(0);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'unpaid' | 'paid'>('paid');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => { fetchInitialData(); }, []);

  // Auto-calculate total
  useEffect(() => {
    if (formRoomTypeId && formCheckIn && formCheckOut) {
      const selectedRoom = roomTypes.find((r) => r.id === formRoomTypeId);
      if (selectedRoom) {
        const nights = Math.round(
          (new Date(formCheckOut).getTime() - new Date(formCheckIn).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (!isNaN(nights) && nights > 0) {
          setFormTotalAmount(selectedRoom.base_price * nights * formQty);
        }
      }
    }
  }, [formRoomTypeId, formCheckIn, formCheckOut, formQty, roomTypes]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: rtData } = await supabase
        .from('room_types').select('*').order('display_order', { ascending: true });
      setRoomTypes(rtData || []);
      if (rtData && rtData.length > 0) setFormRoomTypeId(rtData[0].id);
      await fetchBookings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('bookings')
        .select(`*, room_types ( name ), booking_units ( room_units ( unit_label ) )`)
        .order('created_at', { ascending: false });
      if (fetchErr) throw fetchErr;
      setBookings((data as BookingRecord[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    }
  };

  const handleOpenAddModal = () => {
    setFormGuestName(''); setFormGuestEmail(''); setFormGuestPhone('');
    setFormCheckIn(''); setFormCheckOut('');
    setFormGuestsCount(2); setFormQty(1); setFormTotalAmount(0);
    setFormPaymentStatus('paid'); setFormNotes('');
    setError('');
    setShowAddModal(true);
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);

    if (!formRoomTypeId || !formCheckIn || !formCheckOut || !formGuestName.trim() || !formGuestPhone.trim()) {
      setError('Please fill in all required fields.'); setActionLoading(false); return;
    }
    if (new Date(formCheckOut) <= new Date(formCheckIn)) {
      setError('Check-out must be after check-in.'); setActionLoading(false); return;
    }

    try {
      const { error: rpcErr } = await supabase.rpc('create_manual_booking', {
        p_room_type_id: formRoomTypeId,
        p_check_in: formCheckIn,
        p_check_out: formCheckOut,
        p_guest_name: formGuestName.trim(),
        p_guest_email: formGuestEmail.trim(),
        p_guest_phone: formGuestPhone.trim(),
        p_guests_count: Number(formGuestsCount),
        p_qty: Number(formQty),
        p_total_amount: Number(formTotalAmount),
        p_payment_status: formPaymentStatus,
        p_notes: formNotes.trim() || null,
      });

      if (rpcErr) {
        if (rpcErr.message.includes('Selected dates are no longer available')) {
          setError('No availability for this room type on the selected dates.');
        } else {
          throw rpcErr;
        }
        setActionLoading(false); return;
      }

      setShowAddModal(false);
      await fetchBookings();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, status: 'paid' | 'refunded') => {
    if (!window.confirm(`Mark this booking payment as ${status}?`)) return;
    try {
      const { error: err } = await supabase.from('bookings')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (err) throw err;
      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => prev ? { ...prev, payment_status: status } : null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update payment.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking? The room will become available again for new bookings.')) return;
    try {
      const { error: err } = await supabase.from('bookings')
        .update({ status: 'cancelled', hold_expires_at: null, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (err) throw err;
      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = !filterStatus || b.status === filterStatus;
    const matchesRoomType = !filterRoomType || b.room_type_id === filterRoomType;
    const q = filterSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      b.guest_name.toLowerCase().includes(q) ||
      b.guest_email.toLowerCase().includes(q) ||
      b.guest_phone.toLowerCase().includes(q) ||
      (b.razorpay_order_id && b.razorpay_order_id.toLowerCase().includes(q)) ||
      (b.razorpay_payment_id && b.razorpay_payment_id.toLowerCase().includes(q));
    return matchesStatus && matchesRoomType && matchesSearch;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          All online reservations and front-desk bookings. Use the filters to find a guest quickly.
        </p>
        <button onClick={handleOpenAddModal} className="btn-primary">
          <Plus size={16} /> Add Front-Desk Guest
        </button>
      </div>

      {error && <div className="admin-error-msg">{error}</div>}

      {/* Filter bar */}
      <div className="admin-filter-bar">
        <div className="admin-filter-search">
          <Search size={18} className="admin-filter-search-icon" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search by guest name, phone or email..."
          />
        </div>
        <select className="admin-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>

      </div>

      {/* Bookings table */}
      {loading ? (
        <div className="admin-empty-state">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} className="dashboard-stat-icon" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>No Bookings Found</h3>
          <p className="admin-page-subtitle" style={{ margin: 0 }}>No records matched your search or filter.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Check-in → Check-out</th>
                <th>Room</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="right">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{b.guest_name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(244,240,228,0.5)', marginTop: '2px' }}>{b.guest_phone}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    <div>{b.check_in}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(244,240,228,0.5)', marginTop: '2px' }}>→ {b.check_out}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    <div>{b.room_types?.name}</div>
                    {b.booking_units && b.booking_units.length > 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 900 }}>
                        {b.booking_units.map(u => u.room_units.unit_label).join(', ')}
                      </div>
                    ) : b.status === 'confirmed' ? (
                      <div style={{ fontSize: '11px', color: '#ffd777', marginTop: '2px', textTransform: 'uppercase', fontWeight: 800 }}>
                        Unassigned
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'rgba(244,240,228,0.3)', marginTop: '2px' }}>—</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 800 }}>₹{Number(b.total_amount).toFixed(2)}</td>
                  <td><span className={statusBadgeClass(b.status)}>{b.status}</span></td>
                  <td><span className={paymentBadgeClass(b.payment_status)}>{b.payment_status}</span></td>
                  <td className="right">
                    <button
                      className="btn-icon"
                      title="View full details"
                      onClick={() => { setSelectedBooking(b); setShowDetailModal(true); }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Booking Detail Modal ── */}
      {showDetailModal && selectedBooking && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal-md">
            <button className="admin-modal-close" onClick={() => setShowDetailModal(false)} aria-label="Close">
              <X size={24} />
            </button>

            <h3 className="admin-modal-title admin-modal-title-sm">Booking Details</h3>

            {/* Guest header strip */}
            <div className="booking-guest-strip">
              <div className="booking-guest-avatar">
                {selectedBooking.guest_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="booking-detail-name">{selectedBooking.guest_name}</div>
                <div className="booking-detail-contact">{selectedBooking.guest_email}</div>
                <div className="booking-detail-contact" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <PhoneCall size={13} style={{ color: 'var(--gold)' }} />
                  {selectedBooking.guest_phone}
                </div>
              </div>
            </div>

            <div className="booking-detail-grid">
              <div>
                <span className="tiny-label booking-detail-section-title">Stay Details</span>
                <div>Room: <strong>{selectedBooking.room_types?.name || '—'}</strong></div>
                {selectedBooking.booking_units && selectedBooking.booking_units.length > 0 && (
                  <div style={{ marginTop: '4px', color: 'var(--gold)', fontWeight: 800 }}>
                    Assigned: {selectedBooking.booking_units.map(u => u.room_units.unit_label).join(', ')}
                  </div>
                )}
                <div style={{ marginTop: '4px' }}>Check-in: <strong>{selectedBooking.check_in}</strong></div>
                <div style={{ marginTop: '4px' }}>Check-out: <strong>{selectedBooking.check_out}</strong></div>
                <div style={{ marginTop: '4px' }}>Guests: <strong>{selectedBooking.guests_count}</strong></div>
                <div style={{ marginTop: '4px' }}>Rooms booked: <strong>{selectedBooking.qty}</strong></div>
              </div>

              <div>
                <span className="tiny-label booking-detail-section-title">Payment</span>
                <div className="booking-detail-amount">₹{Number(selectedBooking.total_amount).toFixed(2)}</div>
                <div style={{ marginTop: '8px' }}>Booking: <strong style={{ textTransform: 'uppercase' }}>{selectedBooking.status}</strong></div>
                <div style={{ marginTop: '4px' }}>Payment: <strong style={{ textTransform: 'uppercase' }}>{selectedBooking.payment_status}</strong></div>
                <div style={{ marginTop: '4px' }}>Source: <strong style={{ textTransform: 'uppercase' }}>{selectedBooking.source === 'manual' ? 'Front Desk' : 'Online'}</strong></div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(244,240,228,0.5)' }}>
                  Booked on {new Date(selectedBooking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {selectedBooking.razorpay_order_id && (
              <div className="booking-razorpay-block">
                <div>Razorpay Order: <strong style={{ fontFamily: 'monospace' }}>{selectedBooking.razorpay_order_id}</strong></div>
                {selectedBooking.razorpay_payment_id && (
                  <div>Payment ID: <strong style={{ fontFamily: 'monospace' }}>{selectedBooking.razorpay_payment_id}</strong></div>
                )}
              </div>
            )}

            {selectedBooking.notes && (
              <div className="booking-notes-block">
                <span className="tiny-label" style={{ display: 'block', marginBottom: '6px' }}>Notes / Special Requests</span>
                <div className="booking-notes-text">"{selectedBooking.notes}"</div>
              </div>
            )}

            <div className="admin-modal-footer" style={{ flexWrap: 'wrap' }}>
              {selectedBooking.status === 'confirmed' && (
                <button className="btn-danger" onClick={() => handleCancelBooking(selectedBooking.id)}>
                  Cancel Booking
                </button>
              )}
              {selectedBooking.payment_status === 'unpaid' && selectedBooking.status !== 'cancelled' && (
                <button className="btn-success" onClick={() => handleUpdatePaymentStatus(selectedBooking.id, 'paid')}>
                  Mark as Paid
                </button>
              )}
              <button type="button" className="btn-secondary" style={{ marginLeft: 'auto' }}
                onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Front-Desk Guest Modal ── */}
      {showAddModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal-lg">
            <button className="admin-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
              <X size={24} />
            </button>

            <h3 className="admin-modal-title admin-modal-title-sm">Register a Front-Desk Guest</h3>

            <p style={{ fontSize: '14px', color: 'rgba(244,240,228,0.6)', margin: 0 }}>
              Use this form when a guest books directly at the front desk or by phone. 
              The booking will be confirmed immediately.
            </p>

            {error && <div className="admin-error-msg">{error}</div>}

            <form onSubmit={handleCreateManualBooking} className="admin-modal-form">
              {/* Room & dates first — most important */}
              <div className="form-section-label">Room & Dates</div>
              <div className="form-grid">
                <label>
                  <span>Accommodation</span><div style={{ padding: "0.5rem", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px" }}>{roomTypes.find(rt => rt.id === formRoomTypeId)?.name || "Standard Room"}</div>
                </label>
                <label>
                  <span>Number of Rooms</span>
                  <input type="number" min={1} value={formQty} onChange={(e) => setFormQty(Number(e.target.value))} required />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Check-In Date</span>
                  <input type="date" value={formCheckIn} onChange={(e) => setFormCheckIn(e.target.value)} required />
                </label>
                <label>
                  <span>Check-Out Date</span>
                  <input type="date" value={formCheckOut} onChange={(e) => setFormCheckOut(e.target.value)} required />
                </label>
              </div>

              {/* Guest info */}
              <div className="form-section-label">Guest Information</div>
              <div className="form-grid">
                <label>
                  <span>Guest's Full Name *</span>
                  <input type="text" value={formGuestName} onChange={(e) => setFormGuestName(e.target.value)}
                    placeholder="e.g. Ravi Kumar" required />
                </label>
                <label>
                  <span>Phone Number *</span>
                  <input type="tel" value={formGuestPhone} onChange={(e) => setFormGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210" required />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Email Address (optional)</span>
                  <input type="email" value={formGuestEmail} onChange={(e) => setFormGuestEmail(e.target.value)}
                    placeholder="guest@example.com" />
                </label>
                <label>
                  <span>Total Guests (people)</span>
                  <input type="number" min={1} value={formGuestsCount}
                    onChange={(e) => setFormGuestsCount(Number(e.target.value))} required />
                </label>
              </div>

              {/* Payment */}
              <div className="form-section-label">Payment</div>
              <div className="form-grid">
                <label>
                  <span>Payment received?</span>
                  <select value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as 'unpaid' | 'paid')}>
                    <option value="paid">Yes — paid (cash / card at desk)</option>
                    <option value="unpaid">No — will pay on check-out</option>
                  </select>
                </label>
                <label>
                  <span>Total Amount (₹) {formCheckIn && formCheckOut ? '— auto-calculated' : ''}</span>
                  <input type="number" value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(Number(e.target.value))} required />
                </label>
              </div>

              <label>
                <span>Notes (optional)</span>
                <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Extra bedding requested, paid via UPI, needs early check-in" />
              </label>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

