import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart2, 
  Users, 
  TrendingUp, 
  FileText, 
  Bell, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  ShieldAlert,
  Globe,
  AlertTriangle,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';

const LogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cube_top" x1="-16" y1="-2" x2="16" y2="-2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F5FF" />
        <stop offset="1" stopColor="#FF00FF" />
      </linearGradient>
      <linearGradient id="cube_left" x1="-16" y1="-2" x2="0" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F5FF" />
        <stop offset="1" stopColor="rgba(0, 245, 255, 0)" />
      </linearGradient>
      <linearGradient id="cube_right" x1="16" y1="-2" x2="0" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF00FF" />
        <stop offset="1" stopColor="rgba(255, 0, 255, 0)" />
      </linearGradient>
      <filter id="core_glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <g transform="translate(20, 22)">
      {/* Left Face */}
      <path d="M -16 -2 L 0 6 L 0 18 L -16 10 Z" fill="url(#cube_left)" fillOpacity="0.8" stroke="#00F5FF" strokeWidth="0.5" strokeOpacity="0.5" />
      {/* Right Face */}
      <path d="M 0 6 L 16 -2 L 16 10 L 0 18 Z" fill="url(#cube_right)" fillOpacity="0.8" stroke="#FF00FF" strokeWidth="0.5" strokeOpacity="0.5" />
      {/* Top Face */}
      <path d="M 0 -10 L 16 -2 L 0 6 L -16 -2 Z" fill="url(#cube_top)" fillOpacity="0.9" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.8" />
    </g>
    
    {/* Floating Data Core */}
    <circle cx="20" cy="6" r="3" fill="#FFFFFF" filter="url(#core_glow)" />
    <circle cx="20" cy="6" r="2" fill="#00F5FF" />
  </svg>
);

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  const isAdminRoute = location.pathname.startsWith('/admin');
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'analytics';

  const baseNavItems = [
    { id: 'boards', name: 'Decision Boards', path: '/decision-board', icon: CheckSquare },
    { id: 'create', name: 'Create Decision', path: '/create-decision', icon: PlusCircle },
    { id: 'communities', name: 'Communities', path: '/communities', icon: Users },
    { id: 'notifications', name: 'Notifications', path: '/notifications', icon: Bell },
    { id: 'feedback', name: 'Feedback', path: '/feedback', icon: MessageSquare },
    { id: 'settings', name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { id: 'analytics', name: 'Analytics & Insights', path: '/admin/dashboard?tab=analytics', icon: TrendingUp },
    { id: 'users', name: 'User Management', path: '/admin/dashboard?tab=users', icon: Users },
    { id: 'communities', name: 'Community Management', path: '/admin/dashboard?tab=communities', icon: Globe },
    { id: 'boards', name: 'Decision Board Mgmt', path: '/admin/dashboard?tab=boards', icon: CheckSquare },
    { id: 'moderation', name: 'Reports & Moderation', path: '/admin/dashboard?tab=moderation', icon: AlertTriangle },
    { id: 'notifications', name: 'Notifications', path: '/admin/dashboard?tab=notifications', icon: Bell },
    { id: 'feedback', name: 'User Feedbacks', path: '/feedback', icon: MessageSquare },
    { id: 'settings', name: 'Settings', path: '/admin/dashboard?tab=settings', icon: Settings },
  ];

  const navItems = role === 'admin' ? adminNavItems : baseNavItems;

  return (
    <div style={{
      width: isCollapsed ? '80px' : '250px',
      transition: 'width 0.3s ease',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--nav-bg-solid)',
      borderRight: '1px solid var(--glass-border)',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      <div style={{ 
        padding: isCollapsed ? '0' : '0 24px', 
        marginBottom: '40px', 
        display: 'flex', 
        flexDirection: isCollapsed ? 'column' : 'row',
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: isCollapsed ? '15px' : '0'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isCollapsed && <LogoIcon />}
          {!isCollapsed && (
            <h2 className="text-gradient" style={{ fontFamily: 'Outfit', fontSize: '1.4rem', margin: 0, letterSpacing: '0.5px' }}>
              DECISION_HUB
            </h2>
          )}
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px' }}>
        {navItems.map((item) => {
          const isItemActive = role === 'admin' 
            ? activeTab === item.id 
            : undefined; // fallback to react-router-dom default matching for non-admin routes

          return (
            <NavLink
              key={item.id + '-' + item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              style={({ isActive }) => {
                const active = isItemActive !== undefined ? isItemActive : isActive;
                return {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '0' : '12px',
                  padding: isCollapsed ? '12px' : '12px 16px',
                  borderRadius: '8px',
                  color: active ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  background: active ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  fontWeight: active ? '600' : '400',
                };
              }}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '0 12px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(() => {
          let userObj = null;
          try { userObj = JSON.parse(localStorage.getItem('user')); } catch (e) {}
          const handle = userObj?.username || localStorage.getItem('username') || 'Account';
          const userRole = userObj?.role || role || 'USER';

          return (
            <div 
              className="glass-panel" 
              style={{
                padding: isCollapsed ? '10px 0' : '10px 12px',
                borderRadius: '10px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '10px',
                background: 'rgba(0, 245, 255, 0.05)',
                border: '1px solid rgba(0, 245, 255, 0.2)'
              }}
              title={`Logged in as @${handle}`}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 245, 255, 0.15)',
                border: '1px solid rgba(0, 245, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--neon-cyan)',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {handle.substring(0, 1).toUpperCase()}
              </div>

              {!isCollapsed && (
                <div style={{ overflow: 'hidden', textAlign: 'left', lineHeight: '1.2' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    @{handle}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <button 
          onClick={() => {
            localStorage.removeItem('role');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          title={isCollapsed ? "Logout" : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? '0' : '12px',
            padding: isCollapsed ? '12px' : '12px 16px',
            borderRadius: '8px',
            color: 'var(--neon-pink)',
            background: 'transparent',
            border: '1px solid rgba(255, 0, 255, 0.3)',
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 0, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'var(--glow-pink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
