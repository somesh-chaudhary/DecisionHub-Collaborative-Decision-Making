import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages (using the index.jsx convention so paths stay mostly the same but point to folders)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DecisionBoards from './pages/DecisionBoards';
import CreateDecision from './pages/CreateDecision';
import DecisionDetails from './pages/DecisionDetails';
import Communities from './pages/Communities';
import CommunityDetails from './pages/CommunityDetails';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import ComparisonPage from './pages/ComparisonPage';
import Discussion from './pages/Discussion';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Feedback from './pages/Feedback';

// Simple Route Guard for Admin Role
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    return <Navigate to="/decision-board" replace />;
  }
  return children;
};

// Route Guard for Authenticated Sessions
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-quint',
    });

    // Load and apply theme colors on startup
    const savedTheme = localStorage.getItem('admin-theme') || 'neon-dark';
    const themes = {
      'neon-dark': {
        '--neon-cyan': '#00F5FF',
        '--neon-pink': '#FF00FF',
        '--glow-cyan': '0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3)',
        '--glow-pink': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)'
      },
      'cyberpunk-pink': {
        '--neon-cyan': '#FF00FF',
        '--neon-pink': '#00F5FF',
        '--glow-cyan': '0 0 10px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
        '--glow-pink': '0 0 10px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3)'
      },
      'emerald-glow': {
        '--neon-cyan': '#00FF99',
        '--neon-pink': '#FF8C00',
        '--glow-cyan': '0 0 10px rgba(0, 255, 153, 0.5), 0 0 20px rgba(0, 255, 153, 0.3)',
        '--glow-pink': '0 0 10px rgba(255, 140, 0, 0.5), 0 0 20px rgba(255, 140, 0, 0.3)'
      },
      'classic-slate': {
        '--neon-cyan': '#94A3B8',
        '--neon-pink': '#64748B',
        '--glow-cyan': '0 0 10px rgba(148, 163, 184, 0.3)',
        '--glow-pink': '0 0 10px rgba(100, 116, 139, 0.3)'
      }
    };
    const theme = themes[savedTheme];
    if (theme) {
      Object.entries(theme).forEach(([variable, value]) => {
        document.documentElement.style.setProperty(variable, value);
      });
    }
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Routes with Sidebar and Top Navbar */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Navigate to="/decision-board" replace />} />
            <Route path="/decision-board" element={<DecisionBoards />} />
            <Route path="/decision-board/:id" element={<DecisionDetails />} />
            <Route path="/create-decision" element={<CreateDecision />} />
            <Route path="/decision/:id" element={<DecisionDetails />} />
            <Route path="/decision/:id/compare" element={<ComparisonPage />} />
            <Route path="/decision/:id/discuss" element={<Discussion />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetails />} />
            <Route path="/community/:id" element={<CommunityDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
