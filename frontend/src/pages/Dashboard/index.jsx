import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
      navigate('/admin/dashboard?tab=analytics', { replace: true });
    } else {
      navigate('/decision-board', { replace: true });
    }
  }, [navigate]);

  return null;
};

export default Dashboard;
