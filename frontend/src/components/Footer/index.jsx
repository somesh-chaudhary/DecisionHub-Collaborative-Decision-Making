import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ 
      borderTop: '1px solid var(--glass-border)', 
      padding: '40px',
      marginTop: 'auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'var(--bg-secondary)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h3 className="text-gradient" style={{ fontFamily: 'Outfit', fontSize: '1.2rem' }}>DECISION_HUB</h3>
        </Link>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>© 2026 Neural Networks. Copyright Reserved.</p>
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Quick Links</strong>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Home</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Decisions</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Support</strong>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Terms of Service</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Social</strong>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>GitHub</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>LinkedIn</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
