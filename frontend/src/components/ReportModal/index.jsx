import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../../api/api';

const REASON_OPTIONS = [
  'Spam / Phishing / Advertising',
  'Harassment or Hate Speech',
  'Misinformation or False Claims',
  'Inappropriate or Explicit Content',
  'Violates Community Guidelines',
  'Other / Off-topic'
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, targetTitle, reportedUserId, onReportSubmitted }) => {
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        targetType: targetType || 'BOARD',
        targetId: targetId,
        targetTitle: targetTitle,
        reportedUserId: reportedUserId,
        reason: reason,
        details: details
      };

      const res = await api.post('/api/moderation/reports', payload);
      if (res.data?.success) {
        setSubmitted(true);
        if (onReportSubmitted) onReportSubmitted(res.data.data);
        setTimeout(() => {
          setSubmitted(false);
          setDetails('');
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '30px',
        position: 'relative',
        border: '1px solid rgba(255, 0, 127, 0.3)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <CheckCircle size={52} color="var(--success)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', margin: '0 0 8px 0' }}>Report Submitted</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Thank you for keeping our community safe. Our moderation team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 0, 127, 0.15)', padding: '10px', borderRadius: '10px' }}>
                <ShieldAlert size={24} color="var(--neon-pink)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.25rem' }}>Report Content</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Target: <span style={{ color: 'var(--neon-cyan)' }}>{targetType}</span> - {targetTitle || `#${targetId}`}
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255, 68, 68, 0.15)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff6b6b',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              >
                {REASON_OPTIONS.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe why this content violates community guidelines..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '10px 20px' }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #FF007F, #D0006F)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : <AlertTriangle size={16} />}
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
