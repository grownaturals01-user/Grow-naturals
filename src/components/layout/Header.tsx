import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePosSync } from '../../context/PosSyncContext';
import { BusinessToggle } from './BusinessToggle';
import { Menu, Sun, Moon, RefreshCw, LogOut } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { syncStatus, queuedCount, triggerSync } = usePosSync();

  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Menu"
        >
          <Menu size={22} />
        </button>

        {/* Dual Business Toggle */}
        <BusinessToggle />
      </div>

      <div className="header-right">
        {/* Offline / Online Sync Status Pill */}
        <button
          type="button"
          className={`sync-badge ${syncStatus}`}
          onClick={() => triggerSync()}
          title={
            syncStatus === 'synced'
              ? 'All offline sales synced with PostgreSQL backend'
              : syncStatus === 'syncing'
              ? 'Synchronizing local sales with backend...'
              : `${queuedCount} offline sale(s) waiting to sync`
          }
        >
          <span className="sync-dot" />
          {syncStatus === 'synced' && <span>Online (Synced)</span>}
          {syncStatus === 'syncing' && <span>Syncing ({queuedCount})...</span>}
          {syncStatus === 'offline' && <span>Offline ({queuedCount} queued)</span>}
          <RefreshCw size={12} className={syncStatus === 'syncing' ? 'spin' : ''} />
        </button>

        {/* Light / Dark Mode Switcher */}
        <button
          type="button"
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Profile */}
        {user && (
          <div className="user-profile-badge" onClick={logout} title="Click to Log Out">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role-tag">{user.role}</span>
            </div>
            <LogOut size={16} color="var(--color-text-dim)" />
          </div>
        )}
      </div>
    </header>
  );
};
