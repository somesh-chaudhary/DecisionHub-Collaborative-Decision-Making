import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Globe,
  CheckSquare,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Bell,
  Settings,
  ShieldAlert,
} from 'lucide-react';

import Analytics      from './sections/Analytics';
import UserManagement from './sections/UserManagement';
import Communities    from './sections/Communities';
import DecisionBoards from './sections/DecisionBoards';
import Moderation     from './sections/Moderation';
import Notifications  from './sections/Notifications';
import AdminSettings  from './sections/AdminSettings';

const TABS = [
  { id: 'analytics',      label: 'Analytics & Insights', icon: TrendingUp,      component: Analytics      },
  { id: 'users',          label: 'User Management',    icon: Users,           component: UserManagement },
  { id: 'communities',    label: 'Community Management', icon: Globe,         component: Communities    },
  { id: 'boards',         label: 'Decision Board Management', icon: CheckSquare, component: DecisionBoards },
  { id: 'moderation',     label: 'Reports & Moderation', icon: AlertTriangle, component: Moderation     },
  { id: 'notifications',  label: 'Notifications',      icon: Bell,            component: Notifications  },
  { id: 'settings',       label: 'Settings',           icon: Settings,        component: AdminSettings  },
];

const AdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'analytics';

  const currentTabInfo = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = currentTabInfo.component;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '60px' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.2)' }}>
            <ShieldAlert color="var(--neon-pink)" size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.9rem', fontFamily: 'Outfit' }}>Admin Console</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Elevated privilege session · <span style={{ color: 'var(--neon-cyan)', fontWeight: '600' }}>{currentTabInfo.label}</span>
            </p>
          </div>
        </div>

      </div>

      {/* ── Active Section ──────────────────────────────────────────── */}
      <div style={{ animation: 'fadeIn 0.2s ease' }}>
        <ActiveComponent />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

