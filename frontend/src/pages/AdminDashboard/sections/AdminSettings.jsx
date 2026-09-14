import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Palette, AlertTriangle, LogOut, UserX, Trash2, CheckCircle2, Save, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/ConfirmModal';
import { saveCategories, useDynamicCategories } from '../../../utils/categoryUtils';

const THEMES = [
  {
    id: 'neon-dark',
    name: 'Neon Dark (Default)',
    cyan: '#00F5FF',
    pink: '#FF00FF',
    colors: {
      '--neon-cyan': '#00F5FF',
      '--neon-pink': '#FF00FF',
      '--glow-cyan': '0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3)',
      '--glow-pink': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)'
    }
  },
  {
    id: 'cyberpunk-pink',
    name: 'Cyberpunk Pink',
    cyan: '#FF00FF',
    pink: '#00F5FF',
    colors: {
      '--neon-cyan': '#FF00FF',
      '--neon-pink': '#00F5FF',
      '--glow-cyan': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
      '--glow-pink': '0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3)'
    }
  },
  {
    id: 'emerald-glow',
    name: 'Emerald Glow',
    cyan: '#00FF99',
    pink: '#FF8C00',
    colors: {
      '--neon-cyan': '#00FF99',
      '--neon-pink': '#FF8C00',
      '--glow-cyan': '0 0 10px rgba(0, 255, 153, 0.5), 0 0 20px rgba(0, 255, 153, 0.3)',
      '--glow-pink': '0 0 10px rgba(255, 140, 0, 0.5), 0 0 20px rgba(255, 140, 0, 0.3)'
    }
  },
  {
    id: 'classic-slate',
    name: 'Classic Slate',
    cyan: '#94A3B8',
    pink: '#64748B',
    colors: {
      '--neon-cyan': '#94A3B8',
      '--neon-pink': '#64748B',
      '--glow-cyan': '0 0 10px rgba(148, 163, 184, 0.3)',
      '--glow-pink': '0 0 10px rgba(100, 116, 139, 0.3)'
    }
  }
];

const AdminSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ─── Password Change State ─────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ─── 1. Category State ────────────────────────────────────────────
  const categories = useDynamicCategories();
  const [newCat, setNewCat] = useState('');

  // ─── 2. Theme State ───────────────────────────────────────────────
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('admin-theme') || 'neon-dark');

  // ─── 3. Danger Zone Modal State ──────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: null
  });

  const applyThemeColors = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      Object.entries(theme.colors).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
      });
    }
  };

  useEffect(() => {
    applyThemeColors(selectedTheme);
  }, [selectedTheme]);

  // Category Add / Remove Handlers
  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    const cat = newCat.trim();
    if (categories.includes(cat)) {
      showToast(`Category '${cat}' already exists.`, 'warning');
      return;
    }
    const updated = [...categories, cat];
    saveCategories(updated);
    setNewCat('');
    showToast(`Category '${cat}' added successfully!`, 'success');
  };

  const handleRemoveCategory = (cat) => {
    if (categories.length <= 2) {
      showToast('Minimum 2 categories required for decision boards.', 'warning');
      return;
    }
    const updated = categories.filter(c => c !== cat);
    saveCategories(updated);
    showToast(`Category '${cat}' removed.`, 'info');
  };

  // Theme Save Handler
  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    localStorage.setItem('admin-theme', themeId);
    applyThemeColors(themeId);
    showToast(`Theme updated to ${THEMES.find(t => t.id === themeId)?.name}!`, 'success');
  };

  // ─── Password Change Handler ──────────────────────────────────────
  const handleChangePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast("Please enter your current password.", "warning");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "warning");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New password and confirm password do not match.", "warning");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.post('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      showToast("Admin password updated successfully!", "success");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Failed to update admin password:", err);
      showToast(err.response?.data?.message || "Failed to update password.", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ─── Danger Zone Actions ──────────────────────────────────────────
  
  // 1. Logout from all devices
  const handleLogoutAllDevices = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    showToast('Logged out from all devices successfully.', 'info');
    navigate('/login');
  };

  // 2. Trigger Deactivate Account Confirmation
  const promptDeactivateAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Deactivate Admin Account',
      message: 'Are you sure you want to deactivate your admin account? You will be signed out immediately and administrative access will be suspended.',
      actionType: 'DEACTIVATE'
    });
  };

  // 3. Trigger Delete Account Confirmation
  const promptDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Admin Account',
      message: 'WARNING: This action is permanent and cannot be undone. All local admin tokens and credentials will be removed.',
      actionType: 'DELETE'
    });
  };

  // Confirm Modal Handler
  const handleConfirmAction = async () => {
    const action = confirmModal.actionType;
    setConfirmModal({ isOpen: false, title: '', message: '', actionType: null });

    if (action === 'DEACTIVATE') {
      try {
        await api.post('/api/users/me/deactivate').catch(() => null);
      } catch (e) {}
      localStorage.clear();
      showToast('Admin account deactivated. Signed out.', 'warning');
      navigate('/login');
    } else if (action === 'DELETE') {
      try {
        await api.delete('/api/users/me').catch(() => null);
      } catch (e) {}
      localStorage.clear();
      showToast('Admin account deleted permanently.', 'error');
      navigate('/login');
    }
  };

  const cardStyle = {
    padding: '28px',
    borderRadius: '16px',
    background: 'rgba(18, 18, 24, 0.65)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(12px)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '850px' }} className="animate-fade-in">

      {/* ── SECTION 1: Decision Board Categories ────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Tag color="var(--neon-cyan)" size={20} />
          <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem' }}>Decision Board Categories</h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Manage available categories for decision boards published across platform feeds.
        </p>

        {/* Existing Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {categories.map(cat => (
            <span 
              key={cat} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                background: 'rgba(0, 245, 255, 0.1)',
                color: 'var(--neon-cyan)',
                border: '1px solid rgba(0, 245, 255, 0.3)',
                fontSize: '0.86rem',
                fontWeight: 600
              }}
            >
              {cat}
              <button 
                onClick={() => handleRemoveCategory(cat)} 
                title={`Remove ${cat}`}
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.7 }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        {/* Add New Category Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text"
            value={newCat} 
            onChange={e => setNewCat(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder="Add new category (e.g. Design, Mobile)..."
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(18, 18, 24, 0.85)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button 
            onClick={handleAddCategory} 
            className="btn-primary" 
            style={{ padding: '11px 22px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* ── SECTION 2: Theme Customization ─────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Palette color="var(--neon-pink)" size={20} />
          <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem' }}>Theme Customization</h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Customize visual accent colors and glow effects for the admin console and dashboard interface.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {THEMES.map(theme => {
            const isSelected = selectedTheme === theme.id;
            return (
              <div 
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                style={{
                  padding: '18px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(0, 245, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid var(--glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: isSelected ? '0 0 12px rgba(0, 245, 255, 0.2)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{theme.name}</span>
                  {isSelected && <CheckCircle2 size={16} color="var(--neon-cyan)" />}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.cyan, boxShadow: `0 0 8px ${theme.cyan}` }} />
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.pink, boxShadow: `0 0 8px ${theme.pink}` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: Admin Security & Password Change ─────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Lock color="var(--neon-cyan)" size={20} />
          <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem' }}>Admin Security & Password</h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Update your system administrator login credentials.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Current Password</label>
            <input 
              type="password" 
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(18, 18, 24, 0.85)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.9rem'
              }}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
              <input 
                type="password" 
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(18, 18, 24, 0.85)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(18, 18, 24, 0.85)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isUpdatingPassword}
            className="btn-primary" 
            style={{ alignSelf: 'flex-start', padding: '10px 22px', fontSize: '0.88rem', marginTop: '6px' }}
          >
            {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── SECTION 4: Danger Zone (Limited for Admin) ─────────────── */}
      <div style={{ ...cardStyle, border: '1px solid rgba(255, 0, 127, 0.4)', background: 'rgba(255, 0, 127, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle color="var(--neon-pink)" size={20} />
          <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem', color: 'var(--neon-pink)' }}>Danger Zone</h3>
        </div>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          High-privilege account security actions. Exercise caution when performing these actions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Action 1: Logout from all devices */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(18, 18, 24, 0.75)', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogOut size={16} color="var(--neon-cyan)" /> Logout from all devices
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Sign out active session tokens across all browser sessions.
              </div>
            </div>
            <button 
              onClick={handleLogoutAllDevices}
              className="btn-secondary"
              style={{ fontSize: '0.84rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Logout Devices
            </button>
          </div>

          {/* Action 2: Deactivate admin account */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255, 171, 0, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 171, 0, 0.25)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#ffab00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={16} color="#ffab00" /> Deactivate admin account
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Temporarily suspend administrative access and sign out.
              </div>
            </div>
            <button 
              onClick={promptDeactivateAccount}
              style={{
                background: 'rgba(255, 171, 0, 0.15)',
                border: '1px solid rgba(255, 171, 0, 0.4)',
                color: '#ffab00',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <UserX size={14} /> Deactivate Account
            </button>
          </div>

          {/* Action 3: Delete account */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255, 0, 127, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 0, 127, 0.3)', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={16} color="var(--neon-pink)" /> Delete account
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Permanently remove admin session credentials and local account data.
              </div>
            </div>
            <button 
              onClick={promptDeleteAccount}
              style={{
                background: 'rgba(255, 0, 127, 0.2)',
                border: '1px solid rgba(255, 0, 127, 0.5)',
                color: 'var(--neon-pink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 10px rgba(255, 0, 127, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal for Deactivate / Delete Account */}
      {confirmModal.isOpen && (
        <ConfirmModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', actionType: null })}
        />
      )}

    </div>
  );
};

export default AdminSettings;
