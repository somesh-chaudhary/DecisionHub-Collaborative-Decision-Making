import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  type = "warning" 
}) => {
  if (!isOpen) return null;

  const isDestructive = type === 'destructive';
  const actionColor = isDestructive ? '#EF4444' : 'var(--neon-cyan)';
  const actionBg = isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 245, 255, 0.08)';
  const actionBorder = isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 245, 255, 0.3)';
  const actionBgHover = isDestructive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 245, 255, 0.2)';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(3, 3, 5, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 100000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="glass-panel modal-animate" 
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '30px 36px',
          borderRadius: '16px',
          background: 'rgba(15, 15, 18, 0.95)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        {/* Subtle icon container */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--glass-border)',
          marginBottom: '4px'
        }}>
          {isDestructive ? (
            <Trash2 size={24} color="#EF4444" />
          ) : (
            <AlertTriangle size={24} color="var(--neon-cyan)" />
          )}
        </div>

        <h3 style={{ 
          margin: 0, 
          fontFamily: 'Outfit', 
          fontSize: '1.45rem', 
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
        
        <p style={{ 
          margin: 0, 
          color: 'var(--text-secondary)', 
          fontSize: '0.96rem', 
          lineHeight: '1.55',
          fontFamily: 'Outfit',
          fontWeight: '400'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
          <button 
            type="button"
            onClick={onCancel}
            style={{ 
              flex: 1, 
              height: '40px', 
              borderRadius: '8px', 
              fontSize: '0.9rem',
              fontFamily: 'Outfit',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            {cancelText}
          </button>
          
          <button 
            type="button"
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              height: '40px', 
              borderRadius: '8px', 
              fontSize: '0.9rem',
              fontFamily: 'Outfit',
              background: actionBg,
              color: actionColor,
              border: `1px solid ${actionBorder}`,
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = actionBgHover;
              e.currentTarget.style.boxShadow = `0 0 10px ${actionBgHover}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = actionBg;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
