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
      const { error } = await supabase.from('room_types').update({
        name: room.name,
        description: room.description,
        base_price: room.base_price,
        max_occupancy: room.max_occupancy
      }).eq('id', room.id);
      if (error) throw error;
      setSuccess('Room information updated successfully.');
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
      <div className="dash-section-label">Edit Room Info & Prices</div>
      {error && <div className="admin-error-msg">{error}</div>}
      {success && <div className="admin-error-msg" style={{ backgroundColor: '#2e7d32', color: 'white' }}>{success}</div>}
      
      <form onSubmit={handleSave} className="admin-card" style={{ maxWidth: '600px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Room Name</span>
            <input type="text" value={room.name || ''} onChange={e => setRoom({...room, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Base Price (?)</span>
            <input type="number" value={room.base_price || 0} onChange={e => setRoom({...room, base_price: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required min="0" />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Max Occupancy</span>
            <input type="number" value={room.max_occupancy || 1} onChange={e => setRoom({...room, max_occupancy: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required min="1" />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', marginBottom: '8px', color: 'rgba(244,240,228,0.7)', fontSize: '13px' }}>Description</span>
            <textarea value={room.description || ''} onChange={e => setRoom({...room, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white', minHeight: '100px' }} required />
          </label>
          <button type="submit" disabled={saving} style={{ background: 'var(--gold)', color: 'var(--color-background)', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
