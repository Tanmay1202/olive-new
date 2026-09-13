import React, { useEffect, useState } from 'react';
import { BedDouble, Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import '../admin.css';

export interface RoomType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_occupancy: number;
  base_price: number;
  amenities: string[];
  images: string[];
  total_units: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  available_today?: number;
}

export interface RoomUnit {
  id: string;
  room_type_id: string;
  unit_label: string;
  is_active: boolean;
  created_at: string;
}

export function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaxOccupancy, setFormMaxOccupancy] = useState(2);
  const [formBasePrice, setFormBasePrice] = useState(0);
  const [formAmenities, setFormAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formTotalUnits, setFormTotalUnits] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [units, setUnits] = useState<RoomUnit[]>([]);
  const [newUnitLabel, setNewUnitLabel] = useState('');
  const [unitsError, setUnitsError] = useState('');

  useEffect(() => { fetchRoomTypes(); }, []);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('room_types').select('*').order('display_order', { ascending: true });
      if (fetchErr) throw fetchErr;
      
      // Fetch live availability for today to show in the admin cards
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      const { data: availData } = await supabase.rpc('get_room_types_with_availability', {
        p_check_in: today,
        p_check_out: tomorrow
      });

      const enhancedData = (data || []).map(type => {
        const availRoom = (availData || []).find((a: any) => a.id === type.id);
        return {
          ...type,
          available_today: availRoom ? availRoom.available_units : type.total_units
        };
      });

      setRoomTypes(enhancedData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room types.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedRoomType(null);
    setFormName(''); setFormDescription('');
    setFormMaxOccupancy(2); setFormBasePrice(0);
    setFormAmenities([]); setFormImages([]);
    setFormTotalUnits(1); setFormIsActive(true);
    setFormDisplayOrder(roomTypes.length);
    setError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setFormName(roomType.name);
    setFormDescription(roomType.description || '');
    setFormMaxOccupancy(roomType.max_occupancy);
    setFormBasePrice(roomType.base_price);
    setFormAmenities(Array.isArray(roomType.amenities) ? roomType.amenities : []);
    setFormImages(Array.isArray(roomType.images) ? roomType.images : []);
    setFormTotalUnits(roomType.total_units);
    setFormIsActive(roomType.is_active);
    setFormDisplayOrder(roomType.display_order);
    setError('');
    setShowFormModal(true);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleAddAmenity = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = newAmenity.trim();
      if (trimmed && !formAmenities.includes(trimmed)) {
        setFormAmenities([...formAmenities, trimmed]);
      }
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormAmenities(formAmenities.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setError('');
    const slug = generateSlug(formName || 'room');
    try {
      const urls: string[] = [...formImages];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}-${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('room-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('room-images').getPublicUrl(fileName);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
      setFormImages(urls);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error uploading images.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleSaveRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formName.trim()) { setError('Room name is required.'); return; }
    const payload = {
      name: formName.trim(),
      slug: generateSlug(formName),
      description: formDescription.trim() || null,
      max_occupancy: Number(formMaxOccupancy),
      base_price: Number(formBasePrice),
      amenities: formAmenities,
      images: formImages,
      total_units: Number(formTotalUnits),
      is_active: formIsActive,
      display_order: Number(formDisplayOrder),
      updated_at: new Date().toISOString(),
    };
    try {
      if (selectedRoomType) {
        const { error: updateErr } = await supabase.from('room_types').update(payload).eq('id', selectedRoomType.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from('room_types').insert([payload]);
        if (insertErr) throw insertErr;
      }
      setShowFormModal(false);
      fetchRoomTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving room type.');
    }
  };

  const handleToggleActive = async (roomType: RoomType) => {
    try {
      const { error: updateErr } = await supabase.from('room_types')
        .update({ is_active: !roomType.is_active }).eq('id', roomType.id);
      if (updateErr) throw updateErr;
      fetchRoomTypes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating status.');
    }
  };

  const handleOpenUnitsModal = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setNewUnitLabel('');
    setUnitsError('');
    setShowUnitsModal(true);
    fetchUnits(roomType.id);
  };

  const fetchUnits = async (roomTypeId: string) => {
    try {
      const { data, error: unitsErr } = await supabase
        .from('room_units').select('*').eq('room_type_id', roomTypeId)
        .order('unit_label', { ascending: true });
      if (unitsErr) throw unitsErr;
      setUnits(data || []);
    } catch (err: unknown) {
      setUnitsError(err instanceof Error ? err.message : 'Failed to fetch rooms.');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnitsError('');
    if (!newUnitLabel.trim() || !selectedRoomType) {
      setUnitsError('Room name/number cannot be empty.'); return;
    }
    try {
      const { error: addErr } = await supabase.from('room_units').insert([{
        room_type_id: selectedRoomType.id,
        unit_label: newUnitLabel.trim(),
        is_active: true,
      }]);
      if (addErr) throw addErr;
      setNewUnitLabel('');
      fetchUnits(selectedRoomType.id);
    } catch (err: unknown) {
      setUnitsError(err instanceof Error ? err.message : 'Error adding room.');
    }
  };

  const handleRemoveUnit = async (unitId: string) => {
    if (!selectedRoomType || !window.confirm('Remove this room? This cannot be undone.')) return;
    try {
      const { error: delErr } = await supabase.from('room_units').delete().eq('id', unitId);
      if (delErr) throw delErr;
      fetchUnits(selectedRoomType.id);
    } catch (err: unknown) {
      setUnitsError(err instanceof Error ? err.message : 'Error removing room.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <p className="admin-page-subtitle">
          Manage room categories shown on the website — names, photos, pricing, and individual room numbers.
        </p>
        <button onClick={handleOpenAddModal} className="btn-primary">
          <Plus size={16} /> Add Room Category
        </button>
      </div>

      {error && <div className="admin-error-msg">{error}</div>}

      {loading ? (
        <div className="admin-empty-state">Loading room types...</div>
      ) : roomTypes.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px' }}>
          <BedDouble size={48} className="dashboard-stat-icon" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>No Room Types Yet</h3>
          <p className="admin-page-subtitle" style={{ margin: 0 }}>
            Add your first room category to get started.
          </p>
        </div>
      ) : (
        <div className="rt-card-grid">
          {roomTypes.map((type) => (
            <div key={type.id} className="rt-card">
              {/* Image */}
              <div className="rt-card-img">
                {type.images && type.images.length > 0 ? (
                  <img src={type.images[0]} alt={type.name} />
                ) : (
                  <div className="rt-card-img-empty">
                    <BedDouble size={28} />
                  </div>
                )}
                <button
                  onClick={() => handleToggleActive(type)}
                  className={`rt-status-pill ${type.is_active ? 'rt-status-active' : 'rt-status-inactive'}`}
                >
                  {type.is_active ? '● Live' : '○ Hidden'}
                </button>
              </div>

              {/* Info */}
              <div className="rt-card-body">
                <div className="rt-card-title">{type.name}</div>
                <div className="rt-card-price">₹{Number(type.base_price).toLocaleString('en-IN')}<span>/night</span></div>
                <div className="rt-card-meta">
                  <span>{type.max_occupancy} guests max</span>
                  <span>·</span>
                  <span style={{ color: type.available_today === 0 ? 'var(--red)' : 'var(--gold)', fontWeight: 600 }}>
                    {type.available_today} / {type.total_units} available today
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="rt-card-actions">
                <button
                  onClick={() => handleOpenUnitsModal(type)}
                  className="rt-action-btn"
                  title="Manage individual rooms"
                >
                  <BedDouble size={15} />
                  Manage Rooms
                </button>
                <button
                  onClick={() => handleOpenEditModal(type)}
                  className="rt-action-btn rt-action-btn-icon"
                  title="Edit this category"
                >
                  <Edit2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Room Type Modal ── */}
      {showFormModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal-lg">
            <button className="admin-modal-close" onClick={() => setShowFormModal(false)} aria-label="Close">
              <X size={24} />
            </button>

            <h3 className="admin-modal-title">
              {selectedRoomType ? `Edit: ${selectedRoomType.name}` : 'Add New Room Category'}
            </h3>

            {error && <div className="admin-error-msg">{error}</div>}

            <form onSubmit={handleSaveRoomType} className="admin-modal-form">
              <div className="form-section-label">Basic Info</div>
              <div className="form-grid">
                <label>
                  <span>Room Category Name *</span>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Royal Villa, Deluxe Room" required />
                </label>
                <label>
                  <span>Price per Night (₹) *</span>
                  <input type="number" value={formBasePrice} onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    placeholder="e.g. 8500" required />
                </label>
              </div>

              <label>
                <span>Description (shown on website)</span>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the room — space, views, special features..." rows={3} />
              </label>

              <div className="form-section-label">Capacity &amp; Visibility</div>
              <div className="form-grid">
                <label>
                  <span>Max Guests per Room</span>
                  <input type="number" min={1} value={formMaxOccupancy}
                    onChange={(e) => setFormMaxOccupancy(Number(e.target.value))} required />
                </label>
                <label>
                  <span>Total Rooms of this Type</span>
                  <input type="number" min={1} value={formTotalUnits}
                    onChange={(e) => setFormTotalUnits(Number(e.target.value))} required />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  <span>Visible on Website?</span>
                  <select value={formIsActive ? 'yes' : 'no'}
                    onChange={(e) => setFormIsActive(e.target.value === 'yes')}>
                    <option value="yes">Yes — show to guests</option>
                    <option value="no">No — hide from website</option>
                  </select>
                </label>
                <label>
                  <span>Display order (1 = first on website)</span>
                  <input type="number" value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))} required />
                </label>
              </div>

              {/* Amenities */}
              <div className="form-section-label">Amenities</div>
              <label>
                <span>Type an amenity and press Enter</span>
                <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={handleAddAmenity} placeholder="e.g. Private pool, Air conditioning, Balcony" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {formAmenities.map((amenity, idx) => (
                    <span key={amenity} className="admin-amenity-tag">
                      {amenity}
                      <button type="button" className="admin-amenity-remove" onClick={() => handleRemoveAmenity(idx)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </label>

              {/* Images */}
              <div className="form-section-label">Room Photos</div>
              <label>
                <span>Upload photos (shown on website)</span>
                <div className="admin-upload-zone">
                  <input type="file" multiple accept="image/*"
                    onChange={handleImageUpload} disabled={uploadingImage} />
                  <Upload size={24} className="admin-upload-icon" />
                  <span className="admin-upload-label">
                    {uploadingImage ? 'Uploading...' : 'Click or drag to upload photos'}
                  </span>
                  <span className="admin-upload-hint">Photos are saved automatically to storage.</span>
                </div>
                <div className="admin-image-grid">
                  {formImages.map((url, idx) => (
                    <div key={url} className="admin-image-thumb">
                      <img src={url} alt={`Room image ${idx + 1}`} />
                      <button type="button" className="admin-image-remove" onClick={() => handleRemoveImage(idx)}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </label>

              <div className="admin-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedRoomType ? 'Save Changes' : 'Create Room Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Individual Rooms Modal ── */}
      {showUnitsModal && selectedRoomType && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal admin-modal-sm">
            <button className="admin-modal-close" onClick={() => setShowUnitsModal(false)} aria-label="Close">
              <X size={24} />
            </button>

            <h3 className="admin-modal-title admin-modal-title-sm">
              Rooms in: {selectedRoomType.name}
            </h3>

            <p style={{ fontSize: '14px', color: 'rgba(244,240,228,0.6)', margin: 0 }}>
              Add each individual room by its number or name (e.g. "Room 101", "Villa A"). 
              These are used to track which specific room a guest is assigned to.
            </p>

            {unitsError && <div className="admin-error-msg">{unitsError}</div>}

            <form onSubmit={handleAddUnit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <label style={{ flex: 1 }}>
                <span>Room Number / Name</span>
                <input type="text" value={newUnitLabel} onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="e.g. Room 101, Villa B" required />
              </label>
              <button type="submit" className="btn-primary" style={{ height: '56px', padding: '0 20px', flexShrink: 0 }}>
                Add Room
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--dark-line)', paddingTop: '16px' }}>
              <span className="tiny-label" style={{ marginBottom: '12px', display: 'block' }}>
                Added Rooms ({units.length})
              </span>

              {units.length === 0 ? (
                <p className="admin-empty-state" style={{ padding: '16px 0', textAlign: 'left', fontStyle: 'italic' }}>
                  No rooms added yet. Add room numbers above to enable room assignment.
                </p>
              ) : (
                <div className="room-unit-list">
                  {units.map((unit) => (
                    <div key={unit.id} className="room-unit-item">
                      <span className="room-unit-item-label">{unit.unit_label}</span>
                      <button className="room-unit-delete" onClick={() => handleRemoveUnit(unit.id)}
                        aria-label={`Remove ${unit.unit_label}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowUnitsModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
