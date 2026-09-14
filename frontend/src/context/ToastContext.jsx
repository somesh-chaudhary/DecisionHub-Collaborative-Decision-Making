import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, isExiting: false }]);

    // Trigger exit animation after 3.7 seconds
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 3700);

    // Remove toast completely after 4.0 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Map icon and styles based on toast type
  const getToastDetails = (type) => {
    switch (type) {
      case 'error':
        return {
          color: 'var(--neon-pink)',
          icon: <XCircle size={20} color="var(--neon-pink)" style={{ filter: 'drop-shadow(0 0 4px var(--neon-pink))' }} />,
          shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 12px rgba(255, 0, 255, 0.15)'
        };
      case 'warning':
        return {
          color: '#FFAA00',
          icon: <AlertTriangle size={20} color="#FFAA00" style={{ filter: 'drop-shadow(0 0 4px #FFAA00)' }} />,
          shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 12px rgba(255, 170, 0, 0.15)'
        };
      case 'info':
        return {
          color: '#2563EB',
          icon: <Info size={20} color="#2563EB" style={{ filter: 'drop-shadow(0 0 4px #2563EB)' }} />,
          shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 12px rgba(37, 99, 235, 0.15)'
        };
      case 'success':
      default:
        return {
          color: 'var(--neon-cyan)',
          icon: <CheckCircle size={20} color="var(--neon-cyan)" style={{ filter: 'drop-shadow(0 0 4px var(--neon-cyan))' }} />,
          shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), 0 0 12px rgba(0, 245, 255, 0.15)'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '12px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => {
          const details = getToastDetails(t.type);
          return (
            <div
              key={t.id}
              className={t.isExiting ? 'toast-exit' : 'toast-enter'}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderLeft: `5px solid ${details.color}`,
                borderRadius: '8px',
                boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.4), ${details.shadow}`,
                color: 'var(--text-primary)',
                fontFamily: 'Outfit, sans-serif',
                pointerEvents: 'auto',
                transition: 'all 0.3s ease',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>{details.icon}</div>
                <span style={{ 
                  fontSize: '0.94rem', 
                  lineHeight: '1.4', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  {t.message}
                </span>
              </div>
              
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '14px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={16} />
              </button>

              {/* Glowing animated progress timer bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2.5px',
                width: '100%',
                background: details.color,
                boxShadow: `0 0 8px ${details.color}`,
                animation: 'toastProgress 4s linear forwards',
                transformOrigin: 'left',
                opacity: 0.9
              }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
