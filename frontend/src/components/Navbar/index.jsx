import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Sun, Moon } from 'lucide-react';
import api from '../../api/api';

const Navbar = ({ isDashboard, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/users/me');
        if (res.data?.success && res.data.data) {
          const user = res.data.data;
          setUserProfile(user);
          localStorage.setItem('user', JSON.stringify(user));
          document.title = 'DecisionHub';
        }
      } catch (err) {
        // fail silently
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count');
        if (res.data?.success && typeof res.data.data === 'number') {
          setUnreadCount(res.data.data);
        } else if (typeof res.data === 'number') {
          setUnreadCount(res.data);
        }
      } catch (err) {
        // Silently catch if unauthenticated
      }
    };

    if (localStorage.getItem('token')) {
      fetchUser();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <nav style={{ position: 'fixed', top: 0, width: '100%', padding: '20px', zIndex: 1000, display: 'flex', justifyContent: 'center' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Outfit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15) 0%, rgba(255, 0, 255, 0.15) 100%)',
            border: '1px solid rgba(0, 245, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 245, 255, 0.35)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#FF00FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-gradient" style={{ letterSpacing: '0.5px' }}>DECISION_HUB</span>
        </Link>
      </nav>
    );
  }

  if (isDashboard) {
    return (
      <nav style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'fixed',
        top: 0,
        right: 0,
        left: isCollapsed ? '80px' : '250px',
        transition: 'left 0.3s ease',
        zIndex: 90
      }}>
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search grid..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/decision-board?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '10px 16px 10px 40px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '250px'
              }} 
            />
          </div>
          <Link to="/notifications" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', position: 'relative' }} title="Notifications">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--neon-pink)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--neon-pink)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link 
            to="/profile" 
            style={{ background: 'transparent', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={`@${userProfile?.username || localStorage.getItem('username') || 'Account'}`}
          >
            <User size={24} />
          </Link>
        </div>
      </nav>
    );
  }

  // Public Landing Navbar
  return (
    <nav style={{ 
      position: 'fixed', 
      top: 0, 
      width: '100%', 
      height: '80px',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 40px',
      zIndex: 1000,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--glass-border)'
    }}>
      {/* Left: Logo */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Outfit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.15) 0%, rgba(255, 0, 255, 0.15) 100%)',
            border: '1px solid rgba(0, 245, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(0, 245, 255, 0.35)'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#FF00FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-gradient" style={{ letterSpacing: '0.5px' }}>DECISION_HUB</span>
        </Link>
      </div>
      
      {/* Middle: Empty space */}
      <div style={{ flex: 1 }}></div>
      
      {/* Right: Actions */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '16px', alignItems: 'center' }}>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link to="/login" className="btn-secondary" style={{ padding: '8px 24px', fontSize: '0.9rem', borderRadius: '20px' }}>
          Log In / Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
