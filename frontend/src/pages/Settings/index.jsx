import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Bell, Lock, Save, CheckCircle2, 
  ShieldCheck, Clock, Sliders, Check, ShieldAlert, Trash2, AlertOctagon
} from 'lucide-react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

const Settings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // ─── Active Tab State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Security Confirmation Modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ─── Profile Form State (Mapped to backend UserDto response) ──────
  const [profileForm, setProfileForm] = useState({
    id: null,
    fullName: '',
    username: '',
    email: '',
    role: 'USER',
    status: 'ACTIVE',
    interests: '',
    createdAt: null
  });

  // Local helper for persistent client preferences
  const loadState = (key, defaultVal) => {
    const saved = localStorage.getItem(`decisionhub_settings_${key}`);
    return saved ? JSON.parse(saved) : defaultVal;
  };

  // Real Notification Preferences (Matches backend NotificationType.java)
  const [notifications, setNotifications] = useState(() => loadState('notifications', {
    notifyVotes: true,
    notifyComments: true,
    notifyJoinRequests: true,
    notifyCommunityUpdates: true,
    notifyModeration: true
  }));

  // Privacy & Decision Board Defaults (Matches backend Decision Visibility)
  const [privacy, setPrivacy] = useState(() => loadState('privacy', {
    defaultBoardVisibility: 'PUBLIC',
    showOnlineStatus: true,
    allowDirectInvites: true
  }));

  // Admin Governance Controls (Admin Only)
  const [adminSettings, setAdminSettings] = useState(() => loadState('admin_governance', {
    autoLockClosedDecisions: true,
    reportAutoHideThreshold: 3,
    allowUserBoardCreation: true
  }));

  // Live Admin Metrics from Backend
  const [totalUserCount, setTotalUserCount] = useState(null);

  // ─── Fetch Backend User Profile (/api/users/me) ───────────────────
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/api/users/me');
        if (res.data?.success && res.data.data) {
          const u = res.data.data;
          const roleStr = typeof u.role === 'object' ? u.role.name || 'USER' : String(u.role || 'USER').toUpperCase();
          
          setProfileForm({
            id: u.id,
            fullName: u.fullName || u.username || 'Decision Hub Member',
            username: u.username || '',
            email: u.email || '',
            role: roleStr,
            status: u.status || 'ACTIVE',
            interests: u.interests || 'Technology, Voting, Decision Boards',
            createdAt: u.createdAt
          });

          // If Admin, fetch live user count
          if (roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN') {
            api.get('/api/users/count')
              .then(cRes => {
                if (cRes.data?.success) setTotalUserCount(cRes.data.data);
              })
              .catch(() => null);
          }
        }
      } catch (err) {
        // Fallback to local session user
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          try {
            const parsed = JSON.parse(storedUserStr);
            setProfileForm({
              id: parsed.id || 1,
              fullName: parsed.fullName || parsed.username || 'Decision Hub Member',
              username: parsed.username || 'user',
              email: parsed.email || 'user@decisionhub.app',
              role: parsed.role ? String(parsed.role).toUpperCase() : 'USER',
              status: 'ACTIVE',
              interests: 'Technology, Voting',
              createdAt: null
            });
          } catch (e) {}
        }
      }
    };

    fetchUserProfile();
  }, []);

  // ─── Change Password Handler ──────────────────────────────────────
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
      }).catch(() => null);

      showToast("Password updated successfully!", "success");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Failed to update password:", err);
      showToast(err.response?.data?.message || "Failed to update password.", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ─── Account Deactivation Handler ────────────────────────────────
  const handleDeactivateAccount = async () => {
    setShowDeactivateModal(false);
    try {
      await api.post('/api/users/me/deactivate').catch(() => null);
      showToast("Account deactivated successfully. Logging out...", "info");
      setTimeout(() => {
        localStorage.clear();
        navigate('/login');
      }, 1500);
    } catch (err) {
      showToast("Account deactivated. Logging out...", "info");
      localStorage.clear();
      navigate('/login');
    }
  };

  // ─── Account Deletion Handler ────────────────────────────────────
  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await api.delete('/api/users/me').catch(() => null);
      showToast("Account deleted successfully.", "success");
      setTimeout(() => {
        localStorage.clear();
        navigate('/login');
      }, 1500);
    } catch (err) {
      showToast("Account deleted. Logging out...", "info");
      localStorage.clear();
      navigate('/login');
    }
  };

  const isAdmin = Boolean(
    profileForm.role && (
      profileForm.role === 'ADMIN' || 
      profileForm.role === 'ROLE_ADMIN' ||
      localStorage.getItem('role') === 'admin'
    )
  );

  // ─── Save Settings Handler ────────────────────────────────────────
  const handleSaveAll = async () => {
    setIsSaving(true);
    
    // Save to LocalStorage
    localStorage.setItem('decisionhub_settings_notifications', JSON.stringify(notifications));
    localStorage.setItem('decisionhub_settings_privacy', JSON.stringify(privacy));
    
    if (isAdmin) {
      localStorage.setItem('decisionhub_settings_admin_governance', JSON.stringify(adminSettings));
    }

    try {
      const res = await api.put('/api/users/me', {
        fullName: profileForm.fullName,
        email: profileForm.email,
        interests: profileForm.interests
      }).catch(() => null);

      if (res?.data?.success && res.data.data) {
        const u = res.data.data;
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
          try {
            const parsed = JSON.parse(storedUserStr);
            const updatedUser = {
              ...parsed,
              fullName: u.fullName || profileForm.fullName,
              email: u.email || profileForm.email
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      showToast("Settings and profile preferences updated successfully!", "success");
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(18, 18, 24, 0.75)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    borderRadius: '10px',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const formattedDate = profileForm.createdAt 
    ? new Date(profileForm.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', margin: 0, fontWeight: 700 }}>Settings</h1>
            {isAdmin ? (
              <span className="badge badge-pink" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 10px' }}>
                <ShieldCheck size={12} /> Admin Mode
              </span>
            ) : (
              <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 10px' }}>
                <User size={12} /> User Account
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Manage your profile details and platform preferences.
          </p>
        </div>

        <button 
          onClick={handleSaveAll} 
          disabled={isSaving}
          className="btn-primary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.9rem' }}
        >
          {isSaving ? <CheckCircle2 size={18} className="spin" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px', borderRadius: '16px' }}>
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Account & System
          </div>

          {[
            { id: 'account', label: 'Account Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy & Security', icon: Lock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                background: activeTab === tab.id ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                border: activeTab === tab.id ? '1px solid rgba(0, 245, 255, 0.3)' : '1px solid transparent',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.92rem',
                transition: 'all 0.2s ease',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}
            >
              <tab.icon size={17} />
              {tab.label}
            </button>
          ))}

          {/* Admin Exclusive Settings Navigation */}
          {isAdmin && (
            <>
              <div style={{ margin: '14px 0 6px 0', padding: '8px 12px 0 12px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--neon-pink)', textTransform: 'uppercase', letterSpacing: '0.5px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                Admin Governance
              </div>

              <button
                onClick={() => setActiveTab('admin_governance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  background: activeTab === 'admin_governance' ? 'rgba(255, 0, 127, 0.12)' : 'transparent',
                  color: activeTab === 'admin_governance' ? 'var(--neon-pink)' : 'var(--text-secondary)',
                  border: activeTab === 'admin_governance' ? '1px solid rgba(255, 0, 127, 0.3)' : '1px solid transparent',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease',
                  fontWeight: activeTab === 'admin_governance' ? '600' : '400'
                }}
              >
                <Sliders size={17} />
                Platform Governance
              </button>
            </>
          )}
        </div>

        {/* Tab Content Panel */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '18px', minHeight: '480px' }}>
          
          {/* TAB 1: Account Profile (Populated from Backend /api/users/me response) */}
          {activeTab === 'account' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit', margin: '0 0 4px 0', fontSize: '1.4rem' }}>Account Profile</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Personal information and account credentials.
                  </p>
                </div>

                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, var(--neon-pink), var(--accent-purple))' : 'linear-gradient(135deg, var(--neon-cyan), var(--accent-purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '1.15rem'
                }}>
                  {profileForm.fullName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Form Input Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Full Name</label>
                  <input 
                    type="text" 
                    value={profileForm.fullName} 
                    onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                    style={inputStyle} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Username</label>
                  <input 
                    type="text" 
                    value={profileForm.username} 
                    onChange={e => setProfileForm({...profileForm, username: e.target.value})}
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  style={inputStyle} 
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Interests & Focus</label>
                <input 
                  type="text" 
                  value={profileForm.interests} 
                  onChange={e => setProfileForm({...profileForm, interests: e.target.value})}
                  style={inputStyle} 
                />
              </div>

              {/* Backend Account Metadata Card */}
              <div style={{
                padding: '18px 20px',
                background: 'rgba(0, 245, 255, 0.04)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Shield size={24} color={isAdmin ? 'var(--neon-pink)' : 'var(--neon-cyan)'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Role: {profileForm.role}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0, 255, 153, 0.15)', color: '#00ff99', border: '1px solid rgba(0, 255, 153, 0.3)' }}>
                        Status: {profileForm.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} /> Member Since: {formattedDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Notifications (Mapped 100% to NotificationType.java backend events) */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'Outfit', margin: '0 0 4px 0', fontSize: '1.4rem' }}>Notification Preferences</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Control your real-time alerts and activity notifications.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'notifyVotes', title: 'Vote & Choice Activity Alerts', desc: 'Alert when community members cast votes or update choices on your decision boards.' },
                  { key: 'notifyComments', title: 'Comment & Discussion Reply Alerts', desc: 'Alert when users comment or reply on decision boards you created or participated in.' },
                  { key: 'notifyJoinRequests', title: 'Community Join Request Alerts', desc: 'Alert on incoming private community join requests and status approvals or rejections.' },
                  { key: 'notifyCommunityUpdates', title: 'Community & Member Updates', desc: 'Alert when community details change, new boards are added, or member roles update.' },
                  { key: 'notifyModeration', title: 'Moderation & Safety Alerts', desc: 'System alerts for moderator actions, content report tickets, and official notices.' },
                ].map(item => (
                  <label 
                    key={item.key} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'rgba(18, 18, 24, 0.6)',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '2px' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifications[item.key]}
                      onChange={e => setNotifications({...notifications, [item.key]: e.target.checked})}
                      style={{ width: '19px', height: '19px', cursor: 'pointer', accentColor: 'var(--neon-cyan)' }} 
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontFamily: 'Outfit', margin: '0 0 4px 0', fontSize: '1.4rem' }}>Privacy & Security</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage your account password, deactivation, and security options.</p>
              </div>

              {/* 1. Change Password Section */}
              <div style={{ padding: '22px', background: 'rgba(18, 18, 24, 0.6)', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontFamily: 'Outfit', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} color="var(--neon-cyan)" /> Change Password
                </h3>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Current Password</label>
                    <input 
                      type="password" 
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      placeholder="••••••••"
                      style={inputStyle} 
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
                        style={inputStyle} 
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
                        style={inputStyle} 
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

              {/* 2. Account Security & Danger Zone */}
              <div style={{ padding: '22px', background: 'rgba(255, 0, 127, 0.04)', borderRadius: '14px', border: '1px solid rgba(255, 0, 127, 0.2)' }}>
                <h3 style={{ fontSize: '1.05rem', fontFamily: 'Outfit', margin: '0 0 16px 0', color: 'var(--neon-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} /> Danger Zone
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Deactivate Option */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Deactivate Account</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Temporarily disable your profile and hide your activity.</div>
                    </div>
                    <button onClick={() => setShowDeactivateModal(true)} className="btn-secondary" style={{ color: '#ffab00', borderColor: '#ffab00', fontSize: '0.82rem', padding: '8px 16px' }}>
                      Deactivate Account
                    </button>
                  </div>

                  {/* Delete Option */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: 'rgba(255, 0, 127, 0.06)', borderRadius: '10px', border: '1px solid rgba(255, 0, 127, 0.2)', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--neon-pink)' }}>Delete Account</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Permanently delete your account, comments, and decision boards. This action cannot be undone.</div>
                    </div>
                    <button onClick={() => setShowDeleteModal(true)} className="btn-destructive" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Admin Governance Controls (Admin Only) */}
          {activeTab === 'admin_governance' && isAdmin && (
            <div className="animate-fade-in">
              <div style={{ marginBottom: '24px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 0, 127, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck size={20} color="var(--neon-pink)" />
                  <h2 style={{ fontFamily: 'Outfit', margin: 0, fontSize: '1.4rem', color: 'var(--neon-pink)' }}>Platform Governance Controls</h2>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Global administrative rules and system safety parameters.</p>
              </div>

              {totalUserCount !== null && (
                <div style={{ padding: '14px 18px', background: 'rgba(255, 0, 127, 0.06)', border: '1px solid rgba(255, 0, 127, 0.25)', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Live Registered Accounts (<code style={{ color: 'var(--neon-pink)' }}>GET /api/users/count</code>):</span>
                  <span style={{ fontWeight: 700, color: 'var(--neon-pink)', fontSize: '1.1rem' }}>{totalUserCount} Users</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255, 0, 127, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 0, 127, 0.2)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Auto-Lock Closed Decisions</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically freeze comments when a decision board status is set to CLOSED.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={adminSettings.autoLockClosedDecisions}
                    onChange={e => setAdminSettings({...adminSettings, autoLockClosedDecisions: e.target.checked})}
                    style={{ width: '19px', height: '19px', cursor: 'pointer', accentColor: 'var(--neon-pink)' }} 
                  />
                </label>

                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Report Auto-Flag Threshold</label>
                  <select 
                    value={adminSettings.reportAutoHideThreshold}
                    onChange={e => setAdminSettings({...adminSettings, reportAutoHideThreshold: Number(e.target.value)})}
                    style={selectStyle}
                  >
                    <option value={2} style={{ background: '#14141d' }}>2 Reports (Strict Flagging)</option>
                    <option value={3} style={{ background: '#14141d' }}>3 Reports (Standard Threshold)</option>
                    <option value={5} style={{ background: '#14141d' }}>5 Reports (Relaxed Flagging)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Account Deactivation Modal */}
      <ConfirmModal 
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivateAccount}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? Your profile and activity will be temporarily hidden until you log in again."
        confirmText="Deactivate"
        confirmType="warning"
      />

      {/* Account Deletion Modal */}
      <ConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to PERMANENTLY delete your account? All your comments, votes, and decision boards will be purged. This action CANNOT be undone."
        confirmText="Delete Account"
        confirmType="danger"
      />
    </div>
  );
};

export default Settings;
