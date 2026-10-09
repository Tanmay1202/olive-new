import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, X, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { RoomType, RoomUnit } from './RoomTypesPage';
import '../admin.css';

interface AvailabilityBlock {
  id: string;
  room_unit_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
  room_units?: {
    unit_label: string;
    room_types: { name: string };
  };
}

interface Booking {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  room_unit_id: string | null;
  room_units?: { unit_label: string };
}

export function AvailabilityPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [blockRoomTypeId, setBlockRoomTypeId] = useState('');
  const [blockRoomUnitId, setBlockRoomUnitId] = useState('');
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockUnits, setBlockUnits] = useState<RoomUnit[]>([]);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { if (selectedRoomTypeId) fetchRoomSpecificData(selectedRoomTypeId); }, [selectedRoomTypeId]);
  useEffect(() => {
    if (blockRoomTypeId) {
      fetchBlockUnits(blockRoomTypeId);
    } else {
      setBlockUnits([]);
      setBlockRoomUnitId('');
    }
  }, [blockRoomTypeId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: rtData, error: rtErr } = await supabase
        .from('room_types').select('*').order('display_order', { ascending: true });
      if (rtErr) throw rtErr;
      setRoomTypes(rtData || []);
      if (rtData && rtData.length > 0) setSelectedRoomTypeId(rtData[0].id);
      await fetchAllBlocks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBlocks = async () => {
    try {
      const { data, error: err } = await supabase
        .from('availability_blocks')
        .select(`*, room_units ( unit_label, room_types ( name ) )`)
        .order('start_date', { ascending: true });
      if (err) throw err;
      setBlocks(data || []);
    } catch (err: unknown) {
      console.error('Error fetching blocks:', err);
    }
  };

  const fetchRoomSpecificData = async (roomTypeId: string) => {
    try {
      const [unitsResult, bookingsResult] = await Promise.all([
        supabase.from('room_units').select('*').eq('room_type_id', roomTypeId).order('unit_label', { ascending: true }),
        supabase.from('booking_units')
          .select(`booking_id, room_unit_id, bookings!inner ( id, guest_name, check_in, check_out, status, room_type_id )`)
          .eq('bookings.room_type_id', roomTypeId)
          .in('bookings.status', ['confirmed', 'pending'])
      ]);
      if (unitsResult.error) throw unitsResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      const formattedBookings = (bookingsResult.data || []).map((bu: any) => ({
        id: bu.booking_id + '-' + bu.room_unit_id, // ensure unique key for rendering if a booking spans multiple units
        guest_name: bu.bookings.guest_name,
        check_in: bu.bookings.check_in,
        check_out: bu.bookings.check_out,
        status: bu.bookings.status,
        room_unit_id: bu.room_unit_id,
      }));

      setRoomUnits(unitsResult.data || []);
      setBookings(formattedBookings as Booking[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching room data.');
    }
  };

  const fetchBlockUnits = async (roomTypeId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('room_units').select('*').eq('room_type_id', roomTypeId).order('unit_label', { ascending: true });
      if (err) throw err;
      setBlockUnits(data || []);
      setBlockRoomUnitId(data && data.length > 0 ? data[0].id : '');
    } catch (err: unknown) {
      console.error('Error fetching block units:', err);
    }
  };

  const handleOpenAddForm = () => {
    setBlockRoomTypeId(selectedRoomTypeId || (roomTypes[0]?.id || ''));
    setBlockStartDate('');
    setBlockEndDate('');
    setBlockReason('');
    setError('');
    setShowAddForm(true);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);

    if (!blockRoomUnitId) { setError('Please select a room.'); setActionLoading(false); return; }
    if (!blockStartDate || !blockEndDate) { setError('Please choose both start and end dates.'); setActionLoading(false); return; }
    if (new Date(blockEndDate) <= new Date(blockStartDate)) { setError('End date must be after start date.'); setActionLoading(false); return; }

    try {
      const { error: blockErr } = await supabase.from('availability_blocks').insert([{
        room_unit_id: blockRoomUnitId,
        start_date: blockStartDate,
        end_date: blockEndDate,
        reason: blockReason.trim() || null,
      }]);
      if (blockErr) throw blockErr;
      setShowAddForm(false);
      await fetchAllBlocks();
      if (selectedRoomTypeId) await fetchRoomSpecificData(selectedRoomTypeId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block the dates.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Remove this date block? The room will become available again for online booking.')) return;
    try {
      const { error: delErr } = await supabase.from('availability_blocks').delete().eq('id', blockId);
      if (delErr) throw delErr;
      await fetchAllBlocks();
      if (selectedRoomTypeId) await fetchRoomSpecificData(selectedRoomTypeId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing block.');
    }
  };

  return (
    <div className="admin-page">
      {/* Page intro */}
      <div className="admin-page-header">
        <div>
          <p className="admin-page-subtitle">
            Use this page to <strong>block dates</strong> when a room is unavailable — for maintenance,
            owner stays, or deep cleaning. Blocked dates prevent online bookings for those days.
          </p>
        </div>
        <button onClick={handleOpenAddForm} className="btn-primary">
          <Plus size={16} /> Block Dates
        </button>
      </div>

      {error && <div className="admin-error-msg">{error}</div>}

      {loading ? (
        <div className="admin-empty-state">Loading room data...</div>
      ) : (
        <div className="availability-grid">
          {/* Left: Room schedule viewer */}
          <div className="avail-occupancy-card">
            <div className="admin-card">
              <div className="avail-card-header">
                <div>
                  <h3 className="admin-card-title" style={{ margin: 0 }}>Room Schedule</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(244,240,228,0.5)', margin: '4px 0 0' }}>
                    Upcoming bookings and blocked dates per room
                  </p>
                </div>
                
              </div>

              {roomUnits.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '32px', fontStyle: 'italic', textAlign: 'left' }}>
                  No rooms have been set up under this category yet. Go to <strong>Room Setup</strong> to add them.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {roomUnits.map((unit) => {
                    const unitBookings = bookings.filter((b) => b.room_unit_id === unit.id);
                    const unitBlocks = blocks.filter((b) => b.room_unit_id === unit.id);
                    return (
                      <div key={unit.id} className="avail-unit-row">
                        <div className="avail-unit-header">
                          <span className="avail-unit-name">{unit.unit_label}</span>
                          <span className="avail-unit-count">
                            {unitBookings.length + unitBlocks.length === 0
                              ? 'Fully open'
                              : `${unitBookings.length + unitBlocks.length} schedule entries`}
                          </span>
                        </div>

                        {unitBookings.length === 0 && unitBlocks.length === 0 ? (
                          <span className="avail-unit-empty">✓ No bookings or blocks — room is fully available.</span>
                        ) : (
                          <div className="avail-schedule-list">
                            {unitBookings.map((b) => (
                              <div key={b.id} className="avail-booking-item">
                                <div>
                                  <strong className="avail-booking-guest">{b.guest_name}</strong>
                                  <span className="avail-booking-dates">&nbsp;{b.check_in} → {b.check_out}</span>
                                </div>
                                <span className="avail-booking-badge">Guest Booking</span>
                              </div>
                            ))}
                            {unitBlocks.map((blk) => (
                              <div key={blk.id} className="avail-block-item">
                                <div>
                                  <strong className="avail-block-label">
                                    🔒 {blk.reason || 'Maintenance'}
                                  </strong>
                                  <span className="avail-booking-dates">&nbsp;{blk.start_date} → {blk.end_date}</span>
                                </div>
                                <span className="avail-block-badge">Blocked</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Active blocks list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="admin-card">
              <h3 className="admin-card-title dashboard-card-title">
                Blocked Dates ({blocks.length})
              </h3>

              <div className="avail-info-box">
                <Info size={15} />
                <span>These dates are closed to online bookings. Tap the trash icon to re-open a date.</span>
              </div>

              {blocks.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '24px 0', fontStyle: 'italic', textAlign: 'left' }}>
                  No dates are currently blocked. Use "Block Dates" when a room needs to go offline.
                </div>
              ) : (
                <div className="avail-registry-list">
                  {blocks.map((blk) => (
                    <div key={blk.id} className="avail-block-card">
                      <button
                        className="avail-block-delete"
                        onClick={() => handleDeleteBlock(blk.id)}
                        title="Remove this block"
                        aria-label="Remove date block"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="avail-block-meta">
                        <span className="avail-block-type">{blk.room_units?.room_types?.name}</span>
                        <strong className="avail-block-unit">{blk.room_units?.unit_label}</strong>
                      </div>

                      <div className="avail-block-dates">
                        <Calendar size={14} className="dashboard-stat-icon" />
                        <span>{blk.start_date} → {blk.end_date}</span>
                      </div>

                      {blk.reason && (
                        <div className="avail-block-reason">Reason: {blk.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Dates Modal */}
      {showAddForm && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal-sm">
            <button className="admin-modal-close" onClick={() => setShowAddForm(false)} aria-label="Close">
              <X size={24} />
            </button>

            <h3 className="admin-modal-title admin-modal-title-sm">Block Dates for a Room</h3>

            <p style={{ fontSize: '14px', color: 'rgba(244,240,228,0.6)', margin: 0 }}>
              Choose which room to block and for how long. Guests won't be able to book this room online during these dates.
            </p>

            {error && <div className="admin-error-msg">{error}</div>}

            <form onSubmit={handleCreateBlock} className="admin-modal-form">
              <div className="form-grid">
                <label>
                  <span>Accommodation</span><div style={{ padding: "0.5rem", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px" }}>{roomTypes.find(rt => rt.id === blockRoomTypeId)?.name || "Standard Room"}</div>
                </label>
                <label>
                  <span>Which room?</span>
                  <select value={blockRoomUnitId} onChange={(e) => setBlockRoomUnitId(e.target.value)}
                    required disabled={blockUnits.length === 0}>
                    {blockUnits.length === 0
                      ? <option value="">No rooms set up yet</option>
                      : blockUnits.map((u) => <option key={u.id} value={u.id}>{u.unit_label}</option>)
                    }
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>From (start date)</span>
                  <input type="date" value={blockStartDate} onChange={(e) => setBlockStartDate(e.target.value)} required />
                </label>
                <label>
                  <span>To (end date)</span>
                  <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} required />
                </label>
              </div>

              <label>
                <span>Why is it being blocked? (optional)</span>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Deep cleaning, Plumbing repair, Owner stay"
                />
              </label>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Block These Dates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


