import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../api/api";
import { useToast } from '../../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: email,
        password: password
      });

      console.log(response.data);

      // Store JWT if your backend returns one
      if (response.data.data && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token);
      }

      // Fetch actual user profile to get the role from the backend database
      let role = 'user';
      try {
        const userRes = await api.get('/api/users/me');
        if (userRes.data?.success && userRes.data.data?.role) {
          role = String(userRes.data.data.role).toLowerCase() === 'admin' ? 'admin' : 'user';
        }
      } catch (profileError) {
        console.error("Failed to fetch user profile, falling back to email check:", profileError);
        if (email.toLowerCase().includes('admin')) {
          role = 'admin';
        }
      }
      localStorage.setItem("role", role);

      showToast("Login Successful!", "success");

      // Redirect based on role
      if (role === 'admin') {
        navigate("/admin/dashboard?tab=analytics");
      } else {
        navigate("/decision-board");
      }

    } catch (error) {
      console.error(error);

      if (error.response) {
        showToast(error.response.data.message || "Invalid email or password", "error");
      } else {
        showToast("Unable to connect to server", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px', borderRadius: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
              DecisionHub
            </h2>
          </Link>

          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome back to the grid.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
              Email
            </label>

            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border 0.2s',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>
              Password
            </label>

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border 0.2s',
                width: '100%'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              marginTop: '10px',
              boxShadow: 'var(--glow-cyan)'
            }}
          >
            {isSubmitting ? "Authenticating..." : "Login"}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--neon-cyan)" }}>
              Register
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;