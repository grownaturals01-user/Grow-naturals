import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Lock, User as UserIcon, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import gnLogo from '../assets/grownaturalslogo.jpeg';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/pos';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password.trim());
      navigate('/pos');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-app)',
        padding: 'var(--space-4)',
        position: 'relative'
      }}
    >
      {/* Top-Right Theme Toggle */}
      <div style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-5)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-8) var(--space-6)',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <img
            src={gnLogo}
            alt="Grow Naturals Logo"
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto var(--space-3)',
              display: 'block',
              border: '2.5px solid var(--color-botanical-500)',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.35)',
              backgroundColor: '#ffffff'
            }}
          />
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, margin: '0 0 var(--space-1) 0', color: 'var(--color-text-primary)' }}>
            GrowNaturals Billing
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--font-sm)', margin: 0, color: 'var(--color-text-secondary)' }}>
            Unified Dual-Business POS, Inventory & ERP
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <AlertCircle size={16} style={{ color: 'var(--color-danger-text)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-danger-text)' }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Username</label>
            <div className="input-icon-wrapper">
              <UserIcon size={16} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              fontSize: 'var(--font-base)',
              fontWeight: 700,
              marginTop: 'var(--space-2)',
              borderRadius: 'var(--radius-lg)'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        {/* Demo Quick-Fill Roles */}
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-dim)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>
            Quick Demo Logins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickFill('admin', 'admin123')}
            >
              <span>👑</span>
              <div>
                <div style={{ fontWeight: 600 }}>Admin</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Full Access</div>
              </div>
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickFill('manager', 'admin123')}
            >
              <span>💼</span>
              <div>
                <div style={{ fontWeight: 600 }}>Manager</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Store Ops</div>
              </div>
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickFill('cashier', 'admin123')}
            >
              <span>🏷️</span>
              <div>
                <div style={{ fontWeight: 600 }}>Cashier</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>POS Counter</div>
              </div>
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickFill('rajesh', 'sup123')}
            >
              <span>👷</span>
              <div>
                <div style={{ fontWeight: 600 }}>Supervisor</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Site Projects</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
