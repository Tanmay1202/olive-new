import React, { useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  BedDouble,
  Lock,
  User,
  X,
  ChevronRight,
} from 'lucide-react';
import { UserProfile } from '../hooks/useAuth';
import '../admin.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  page: string;
  setPage: (page: string) => void;
  profile: UserProfile | null;
  logout: () => Promise<void>;
}

const menuItems = [
  {
    label: 'Home',
    id: 'admin/dashboard',
    icon: LayoutDashboard,
    hint: "Today's overview",
  },
  {
    label: 'Bookings',
    id: 'admin/bookings',
    icon: CalendarDays,
    hint: 'View & add guests',
  },
  {
    label: 'Block Dates',
    id: 'admin/availability',
    icon: Lock,
    hint: 'Maintenance / owner stay',
  },
  {
    label: 'Room Info',
    id: 'admin/room-types',
    icon: BedDouble,
    hint: 'Edit prices & details',
  },
];

export function AdminLayout({
  children,
  page,
  setPage,
  profile,
  logout,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      setPage('admin/login');
    }
  };

  const currentItem = menuItems.find((item) => item.id === page);

  return (
    <div className="admin-root">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img
            src="/images/logo.png"
            alt="Olive Green Resort"
            className="admin-sidebar-logo"
            onClick={() => setPage('home')}
          />
          <span className="tiny-label admin-sidebar-label">Staff Portal</span>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`admin-nav-btn${active ? ' active' : ''}`}
              >
                <div className="admin-nav-btn-icon">
                  <Icon size={18} />
                </div>
                <div className="admin-nav-btn-text">
                  <span className="admin-nav-btn-label">{item.label}</span>
                  <span className="admin-nav-btn-hint">{item.hint}</span>
                </div>
                {active && <ChevronRight size={14} className="admin-nav-btn-arrow" />}
              </button>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-row">
            <div className="admin-user-avatar">
              <User size={18} />
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name">{profile?.full_name || 'Staff'}</div>
              <div className="admin-user-role">{profile?.role || 'admin'}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="admin-mobile-drawer">
          <div className="admin-mobile-drawer-header">
            <img src="/images/logo.png" alt="Olive Green" className="admin-mobile-drawer-logo" />
            <button
              className="admin-mobile-close-btn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>
          </div>
          <nav className="admin-mobile-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`admin-mobile-nav-btn${page === item.id ? ' active' : ''}`}
                >
                  <Icon size={22} />
                  <div>
                    <div>{item.label}</div>
                    <div className="admin-mobile-nav-hint">{item.hint}</div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="admin-mobile-footer">
            <div>
              <div className="admin-mobile-footer-name">{profile?.full_name || 'Staff'}</div>
              <div className="admin-mobile-footer-role">{profile?.role || 'admin'}</div>
            </div>
            <button
              className="admin-mobile-logout-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main Work Area ── */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-header">
          <button
            className="admin-hamburger"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>

          <div className="admin-header-title-group">
            <h2 className="admin-header-title">{currentItem?.label || 'Admin'}</h2>
            {currentItem?.hint && (
              <span className="admin-header-hint">{currentItem.hint}</span>
            )}
          </div>

          <div className="admin-header-right">
            <div className="admin-live-dot" title="System live" />
            <span className="admin-live-label">Live</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

