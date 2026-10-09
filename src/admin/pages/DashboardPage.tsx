import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  DollarSign,
  BedDouble,
  ArrowRight,
  Users,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import '../admin.css';

interface DashboardStats {
  checkInsToday: number;
  checkOutsToday: number;
  confirmedBookingsCount: number;   // all upcoming confirmed+paid (primary number)
  inHouseTonight: number;           // strictly in-house right now
  monthlyRevenue: number;
  totalUnitsCount: number;
}

interface RecentBooking {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  status: string;
  payment_status: string;
  room_types?: { name: string };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    checkInsToday: 0,
    checkOutsToday: 0,
    confirmedBookingsCount: 0,
    inHouseTonight: 0,
    monthlyRevenue: 0,
    totalUnitsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const [
        checkInsResult,
        checkOutsResult,
        inHouseResult,
        confirmedResult,
        roomUnitsCountResult,
        revenueResult,
        recentResult,
      ] = await Promise.all([
        // Check-ins today: confirmed + paid only
        supabase.from('bookings').select('id').eq('check_in', todayStr).eq('status', 'confirmed').eq('payment_status', 'paid'),
        // Check-outs today: confirmed + paid only
        supabase.from('bookings').select('id').eq('check_out', todayStr).eq('status', 'confirmed').eq('payment_status', 'paid'),
        // In-house TONIGHT: checked in already, not yet checked out
        supabase.from('bookings').select('id, qty').lte('check_in', todayStr).gt('check_out', todayStr).eq('status', 'confirmed').eq('payment_status', 'paid'),
        // ALL confirmed+paid forward bookings (check_out still in future) — what staff actually want to see
        supabase.from('bookings').select('id, qty').gt('check_out', todayStr).eq('status', 'confirmed').eq('payment_status', 'paid'),
        // Total physical rooms configured
        supabase.from('room_units').select('id').eq('is_active', true),
        // Revenue this month
        supabase.from('bookings').select('total_amount').eq('payment_status', 'paid').gte('check_in', startOfMonthStr),
        // Recent bookings: ALL statuses so staff see pending/unpaid too
        supabase.from('bookings').select(`id, guest_name, check_in, check_out, total_amount, status, payment_status, room_types ( name )`).order('created_at', { ascending: false }).limit(5),
      ]);

      // Rooms physically occupied right now
      const inHouseCount = inHouseResult.data?.reduce((sum, b) => sum + (b.qty || 1), 0) ?? 0;
      // All upcoming confirmed+paid bookings (the number that matters)
      const confirmedCount = confirmedResult.data?.reduce((sum, b) => sum + (b.qty || 1), 0) ?? 0;
      const totalUnits = roomUnitsCountResult.data?.length ?? 0;
      const monthlyRev = revenueResult.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) ?? 0;

      setStats({
        checkInsToday: checkInsResult.data?.length ?? 0,
        checkOutsToday: checkOutsResult.data?.length ?? 0,
        confirmedBookingsCount: confirmedCount,
        inHouseTonight: inHouseCount,
        monthlyRevenue: monthlyRev,
        totalUnitsCount: totalUnits,
      });
      setRecentBookings((recentResult.data as RecentBooking[]) ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleResetBookings = async () => {
    if (!window.confirm("DANGER: This will permanently delete ALL bookings from the database. Are you absolutely sure?")) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      alert("All bookings have been cleared.");
      await fetchDashboardData();
    } catch (err) {
      alert("Failed to clear bookings: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  };

  const quickActions = [
    {
      href: '#/admin/bookings',
      label: 'Add a Walk-in Guest',
      description: 'Register a guest who came directly to the front desk',
      icon: Users,
      color: 'var(--gold)',
    },
    {
      href: '#/admin/availability',
      label: 'Block Dates for Maintenance',
      description: 'Close a room for cleaning, repairs, or owner use',
      icon: CalendarDays,
      color: '#7cb8c2',
    },
    {
      href: '#/admin/room-types',
      label: 'Edit Room Info & Prices',
      description: 'Update room names, prices, photos and descriptions',
      icon: BedDouble,
      color: 'var(--olive)',
    },
  ];

  return (
    <div className="admin-page">
      {/* Greeting Banner */}
      <div className="dash-greeting-banner">
        <div>
          <div className="dash-greeting-text">{getGreeting()} 👋</div>
          <div className="dash-greeting-date">{formatDate(new Date())}</div>
        </div>
        {!loading && (
          <div className="dash-greeting-summary">
            <span className="dash-greeting-pill">
              <CalendarDays size={14} />
              {stats.checkInsToday} check-in{stats.checkInsToday !== 1 ? 's' : ''} today
            </span>
            <span className="dash-greeting-pill">
              <TrendingUp size={14} />
              {stats.confirmedBookingsCount} confirmed booking{stats.confirmedBookingsCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {error && <div className="admin-error-msg">{error}</div>}

      {loading ? (
        <div className="admin-empty-state">Loading today's data...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div>
            <div className="dash-section-label">At a glance — today</div>
            <div className="dashboard-stats-grid">
              {[
                {
                  label: "Arriving today",
                  value: String(stats.checkInsToday),
                  icon: CalendarDays,
                  sub: 'Confirmed check-ins',
                  accent: '#7cb8c2',
                },
                {
                  label: "Leaving today",
                  value: String(stats.checkOutsToday),
                  icon: CalendarDays,
                  sub: 'Scheduled departures',
                  accent: '#c59b46',
                },
                {
                  label: 'Rooms Occupied Today',
                  value: `${stats.inHouseTonight} / ${stats.totalUnitsCount}`,
                  icon: BedDouble,
                  sub: `Total ${stats.confirmedBookingsCount} upcoming bookings`,
                  accent: 'var(--olive)',
                },
                {
                  label: 'Revenue this month',
                  value: `₹${stats.monthlyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                  icon: DollarSign,
                  sub: 'From paid bookings',
                  accent: 'var(--gold)',
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="dashboard-stat-card">
                    <div className="dashboard-stat-header">
                      <span className="dashboard-stat-label">{stat.label}</span>
                      <div className="dashboard-stat-icon" style={{ color: stat.accent }}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <div>
                      <div className="dashboard-stat-value" style={{ color: stat.accent }}>{stat.value}</div>
                      <div className="dashboard-stat-change">{stat.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dashboard-lower-grid">
            {/* Recent Bookings */}
            <div className="admin-card">
              <div className="dash-card-header">
                <h3 className="admin-card-title dashboard-card-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
                  Recent Bookings
                </h3>
                <a href="#/admin/bookings" className="dash-see-all">See all →</a>
              </div>
              {recentBookings.length === 0 ? (
                <p className="admin-empty-state dashboard-empty-italic">
                  No bookings registered yet.
                </p>
              ) : (
                <div className="dashboard-booking-list">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="dashboard-booking-row">
                      <div>
                        <div className="dashboard-booking-name">{b.guest_name}</div>
                        <div className="dashboard-booking-meta">
                          {b.room_types?.name} &bull; {b.check_in} → {b.check_out}
                        </div>
                      </div>
                      <div className="dashboard-booking-right">
                        <div className="dashboard-booking-amount">₹{Number(b.total_amount).toFixed(0)}</div>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <div className={`dashboard-booking-status ${
                            b.status === 'confirmed' ? 'status-confirmed' :
                            b.status === 'cancelled' || b.status === 'expired' ? 'status-cancelled' : 'status-pending'
                          }`}>
                            {b.status}
                          </div>
                          <div className={`dashboard-booking-status ${
                            b.payment_status === 'paid' ? 'status-confirmed' : 'status-unpaid'
                          }`}>
                            {b.payment_status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="admin-card">
              <h3 className="admin-card-title dashboard-card-title">What do you need to do?</h3>
              <div className="dashboard-quick-actions">
                {quickActions.map(({ href, label, description, icon: Icon, color }) => (
                  <a key={href} href={href} className="dash-quick-card">
                    <div className="dash-quick-card-icon" style={{ color }}>
                      <Icon size={20} />
                    </div>
                    <div className="dash-quick-card-text">
                      <div className="dash-quick-card-label">{label}</div>
                      <div className="dash-quick-card-desc">{description}</div>
                    </div>
                    <ArrowRight size={16} className="dash-quick-card-arrow" />
                  </a>
                ))}
              </div>
            </div>

            <div className="admin-card" style={{ marginTop: '24px', border: '1px solid rgba(220, 38, 38, 0.3)', background: 'rgba(220, 38, 38, 0.02)' }}>
              <h3 className="admin-card-title dashboard-card-title" style={{ color: 'rgba(220, 38, 38, 0.9)' }}>Danger Zone</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }}>
                Wipe all booking history. This will delete all bookings and cannot be undone. Use this to clean the system for production.
              </p>
              <button 
                onClick={handleResetBookings}
                style={{ 
                  background: 'rgba(220, 38, 38, 0.1)', 
                  color: 'rgb(252, 165, 165)', 
                  border: '1px solid rgba(220, 38, 38, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'; }}
              >
                Clear All Bookings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}




