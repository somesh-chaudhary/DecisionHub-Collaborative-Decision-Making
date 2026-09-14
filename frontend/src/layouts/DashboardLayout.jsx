import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isCollapsed ? '80px' : '250px', transition: 'margin-left 0.3s ease' }}>
        <Navbar isDashboard={true} isCollapsed={isCollapsed} />
        <main style={{ flex: 1, padding: '100px 40px 40px 40px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
