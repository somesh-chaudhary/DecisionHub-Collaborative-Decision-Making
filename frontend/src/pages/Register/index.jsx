import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from "../../api/api";
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [interests, setInterests] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interestOptions = [
    'Career',
    'Technology',
    'Finance',
    'Travel',
    'Lifestyle'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/register", {
        username: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      

      console.log(response.data);
      showToast("Registration Successful!", "success");

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      setInterests([]);

    } catch (error) {
      console.error(error);

      if (error.response) {
        showToast(error.response.data.message || "Registration Failed", "error");
      } else {
        showToast("Unable to connect to server", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '100px 20px 40px 20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px',
          borderRadius: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2
            className="text-gradient"
            style={{ fontSize: '2rem', marginBottom: '10px' }}
          >
            Create Account
          </h2>

          <p style={{ color: 'var(--text-secondary)' }}>
            Join the network and start making decisions.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="fullName"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}
            >
              Full Name
            </label>

            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Neo"
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
              onFocus={(e) =>
                (e.target.style.border = '1px solid var(--neon-cyan)')
              }
              onBlur={(e) =>
                (e.target.style.border = '1px solid var(--glass-border)')
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="email"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}
            >
              Email
            </label>

            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="neo@matrix.com"
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
              onFocus={(e) =>
                (e.target.style.border = '1px solid var(--neon-cyan)')
              }
              onBlur={(e) =>
                (e.target.style.border = '1px solid var(--glass-border)')
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="password"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}
            >
              Password
            </label>

            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
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
              onFocus={(e) =>
                (e.target.style.border = '1px solid var(--neon-cyan)')
              }
              onBlur={(e) =>
                (e.target.style.border = '1px solid var(--glass-border)')
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}
            >
              Confirm Password
            </label>

            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
              onFocus={(e) =>
                (e.target.style.border = '1px solid var(--neon-cyan)')
              }
              onBlur={(e) =>
                (e.target.style.border = '1px solid var(--glass-border)')
              }
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                fontWeight: '500'
              }}
            >
              Interests
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${
                      interests.includes(interest)
                        ? 'var(--neon-pink)'
                        : 'var(--glass-border)'
                    }`,
                    background: interests.includes(interest)
                      ? 'rgba(255,0,234,0.1)'
                      : 'transparent',
                    color: interests.includes(interest)
                      ? 'var(--neon-pink)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: interests.includes(interest)
                      ? 'var(--glow-pink)'
                      : 'none'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}
        >
          <p>
            Already in the system?{' '}
            <Link
              to="/login"
              style={{
                fontWeight: '600',
                color: 'var(--neon-cyan)'
              }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;