import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import '../admin.css';

export function RoomInfoPage() {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRoom();
  }, []);

  const fetchRoom = async () => {
    try {
      const { data, error } = await supabase.from('room_types').select('*').limit(1).single();
      if (error) throw error;
      setRoom(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch room info');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Update basic info
      const { error: updateError } = await supabase.from('room_types').update({
        name: room.name,
        description: room.description,
        base_price: room.base_price,
        max_occupancy: room.max_occupancy,
        is_active: room.is_active
      }).eq('id', room.id);
      
      if (updateError) throw updateError;

      // Sync total_units
      const desiredCount = parseInt(room.total_units);
      if (desiredCount > 0) {
        const { data: activeUnits } = await supabase.from('room_units')
          .select('id, unit_label')
          .eq('room_type_id', room.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        const currentCount = activeUnits?.length || 0;
        
        if (desiredCount > currentCount) {
          const toAdd = desiredCount - currentCount;
          const { data: maxUnit } = await supabase.from('room_units')
            .select('unit_label').eq('room_type_id', room.id)
            .order('created_at', { ascending: false }).limit(1);
            
          let nextNum = currentCount + 1;
          if (maxUnit && maxUnit.length > 0) {
             const match = maxUnit[0].unit_label.match(/\d+/);
             if (match) nextNum = parseInt(match[0]) + 1;
          }
          
          const newRooms = [];
          for (let i = 0; i < toAdd; i++) {
             newRooms.push({ room_type_id: room.id, unit_label: "Room " + (nextNum + i), is_active: true });
          }
          await supabase.from('room_units').insert(newRooms);
        } else if (desiredCount < currentCount) {
          const toRemove = currentCount - desiredCount;
          for (let i = 0; i < toRemove; i++) {
             await supabase.from('room_units').update({ is_active: false }).eq('id', activeUnits[i].id);
          }
        }
      }

      setSuccess('Room information and inventory updated successfully.');
      await fetchRoom(); // refresh to get the true total_units after trigger
    } catch (e: any) {
      setError(e.message || 'Failed to update room info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-page"><div className="admin-empty-state">Loading...</div></div>;
  if (!room) return <div className="admin-page"><div className="admin-error-msg">No room found.</div></div>;

  return (
    <div className="admin-page">
      <div className="dash-section-label">Room Info & Inventory</div>
      {error && <div className="admin-error-msg">{error}</div>}
      {success && <div className="admin-error-msg" style={{ backgroundColor: '#2e7d32', color: 'white', border: 'none' }}>{success}</div>}
      
      <form onSubmit={handleSave} className="admin-card" style={{ maxWidth: '600px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--gold)' }}>Inventory Settings</h4>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Total Number of Rooms (Physical Capacity)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => setRoom({...room, total_units: Math.max(1, parseInt(room.total_units) - 1)})} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>-</button>
                <input type="number" value={room.total_units || 1} onChange={e => setRoom({...room, total_units: parseInt(e.target.value) || 1})} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', textAlign: 'center' }} required min="1" />
                <button type="button" onClick={() => setRoom({...room, total_units: parseInt(room.total_units) + 1})} style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>+</button>
              </div>
              <small style={{ display: 'block', marginTop: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>This will automatically create or deactivate physical room slots. Availability is calculated as this number minus bookings for any given date.</small>
            </label>
            
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Booking Engine Status</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setRoom({...room, is_active: true})} style={{ flex: 1, padding: '12px', borderRadius: '4px', border: room.is_active ? '2px solid var(--olive)' : '1px solid rgba(255,255,255,0.2)', background: room.is_active ? 'rgba(79, 102, 31, 0.2)' : 'transparent', color: room.is_active ? 'var(--olive)' : 'white', cursor: 'pointer', fontWeight: room.is_active ? 'bold' : 'normal' }}>
                  Accepting Bookings
                </button>
                <button type="button" onClick={() => setRoom({...room, is_active: false})} style={{ flex: 1, padding: '12px', borderRadius: '4px', border: !room.is_active ? '2px solid #c62828' : '1px solid rgba(255,255,255,0.2)', background: !room.is_active ? 'rgba(198, 40, 40, 0.2)' : 'transparent', color: !room.is_active ? '#ffcdd2' : 'white', cursor: 'pointer', fontWeight: !room.is_active ? 'bold' : 'normal' }}>
                  Stop All Bookings
                </button>
              </div>
              <small style={{ display: 'block', marginTop: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>If you stop bookings, guests will not be able to check availability or book online.</small>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--gold)' }}>Listing Details</h4>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Accommodation Name</span>
              <input type="text" value={room.name || ''} onChange={e => setRoom({...room, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Base Price (?)</span>
                <input type="number" value={room.base_price || 0} onChange={e => setRoom({...room, base_price: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required min="0" />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Max Occupancy</span>
                <input type="number" value={room.max_occupancy || 1} onChange={e => setRoom({...room, max_occupancy: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required min="1" />
              </label>
            </div>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Description</span>
              <textarea value={room.description || ''} onChange={e => setRoom({...room, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '100px' }} required />
            </label>
          </div>
          
          <button type="submit" disabled={saving} style={{ background: 'var(--gold)', color: 'var(--color-background)', padding: '16px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', fontSize: '16px' }}>
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

