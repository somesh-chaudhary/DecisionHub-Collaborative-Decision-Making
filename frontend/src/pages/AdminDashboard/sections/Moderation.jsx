import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Trash2, ShieldOff, AlertOctagon, CheckCircle2,
  RefreshCw, Filter, ShieldCheck, Eye, MessageSquare, AlertCircle, ExternalLink, X, FileText, User
} from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';

const typeColors = {
  BOARD: 'var(--neon-cyan)',
  DECISION: 'var(--neon-cyan)',
  POLL: 'var(--accent-purple)',
  USER: 'var(--neon-pink)',
  COMMENT: '#FF9500',
  COMMUNITY: 'var(--success)'
};

const Moderation = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actionModal, setActionModal] = useState(null); // { report, actionType: 'WARN' | 'BAN' | 'DELETE' }
  const [detailModal, setDetailModal] = useState(null); // report object to inspect
  const [modalNotes, setModalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/moderation/reports', {
        params: {
          status: statusFilter,
          type: typeFilter
        }
      });
      if (res.data?.success && res.data.data) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch moderation reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [typeFilter, statusFilter]);

  const handleDismiss = async (id) => {
    try {
      await api.post(`/api/moderation/reports/${id}/dismiss`);
      setReports(prev => prev.filter(r => r.id !== id));
      if (detailModal && detailModal.id === id) {
        setDetailModal(null);
      }
      showToast("Report ticket dismissed successfully.", "info");
    } catch (err) {
      console.error('Failed to dismiss report:', err);
      showToast(err.response?.data?.message || 'Failed to dismiss report.', 'error');
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const { report, actionType } = actionModal;
      await api.post(`/api/moderation/reports/${report.id}/action`, {
        action: actionType,
        moderatorNotes: modalNotes.trim() ? modalNotes.trim() : `Action [${actionType}] executed by Administrator.`
      });

      // Update state locally
      setReports(prev => prev.filter(r => r.id !== report.id));
      if (detailModal && detailModal.id === report.id) {
        setDetailModal(null);
      }
      setActionModal(null);
      setModalNotes('');
      showToast(`Moderation action [${actionType}] executed successfully!`, 'success');
    } catch (err) {
      console.error('Failed to execute moderation action:', err);
      showToast(err.response?.data?.message || 'Failed to execute moderation action on backend.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports;

  return (
    <div>
      {/* Top Banner & Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Total Pending Reports</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: 'Outfit', color: 'var(--neon-pink)' }}>
            {reports.filter(r => r.status === 'PENDING').length}
          </h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Reported Comments</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: 'Outfit', color: '#FF9500' }}>
            {reports.filter(r => r.targetType === 'COMMENT').length}
          </h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Reported Boards</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: 'Outfit', color: 'var(--neon-cyan)' }}>
            {reports.filter(r => r.targetType === 'BOARD' || r.targetType === 'DECISION').length}
          </h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Communities Flagged</p>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: 'Outfit', color: 'var(--success)' }}>
            {reports.filter(r => r.targetType === 'COMMUNITY').length}
          </h3>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--neon-cyan)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          </div>
          {['PENDING', 'ACTION_TAKEN', 'DISMISSED', 'ALL'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)',
                background: statusFilter === s ? 'var(--neon-cyan)' : 'transparent',
                color: statusFilter === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: statusFilter === s ? '700' : '400',
                transition: 'all 0.2s'
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Content Types</option>
            <option value="COMMENT">Comments</option>
            <option value="BOARD">Decision Boards</option>
            <option value="POLL">Polls</option>
            <option value="COMMUNITY">Communities</option>
            <option value="USER">Users</option>
          </select>

          <button
            onClick={fetchReports}
            className="btn-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Reports Queue List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3>Loading moderation incidents...</h3>
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
          <CheckCircle2 size={42} color="var(--success)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3>All Clear!</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No reports matching your active filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReports.map((r) => {
            const color = typeColors[r.targetType] || 'var(--text-secondary)';
            return (
              <div
                key={r.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${r.status === 'PENDING' ? 'var(--neon-pink)' : 'var(--glass-border)'}`
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: `${color}20`, flexShrink: 0 }}>
                    <AlertTriangle color={color} size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: `${color}20`,
                        color: color,
                        border: `1px solid ${color}40`
                      }}>
                        {r.targetType}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{r.targetTitle}</h4>
                      {r.status !== 'PENDING' && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          background: r.status === 'ACTION_TAKEN' ? 'rgba(0,255,153,0.15)' : 'rgba(255,255,255,0.1)',
                          color: r.status === 'ACTION_TAKEN' ? 'var(--success)' : 'var(--text-secondary)'
                        }}>
                          {r.status} ({r.actionTaken})
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#ff6b6b', fontWeight: '500' }}>
                      Reason: {r.reason}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Reported by <strong style={{ color: 'var(--text-primary)' }}>{r.reporterUsername || 'Anonymous'}</strong>
                      {r.reportedUsername && (
                        <> · Author: <strong style={{ color: 'var(--neon-cyan)' }}>@{r.reportedUsername}</strong></>
                      )}
                      {r.decisionTitle && (
                        <> · Board: <strong style={{ color: 'var(--accent-purple)' }}>{r.decisionTitle}</strong></>
                      )}
                      {r.communityName && (
                        <> · Community: <strong style={{ color: 'var(--success)' }}>{r.communityName}</strong></>
                      )}
                      {' · '}{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Item Inspection Button */}
                  <button
                    onClick={() => setDetailModal(r)}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)', borderColor: 'rgba(0,245,255,0.3)' }}
                    title="Inspect Full Report Details"
                  >
                    <Eye size={14} /> Details
                  </button>

                  {r.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleDismiss(r.id)}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--success)', borderColor: 'rgba(0,255,153,0.3)' }}
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => setActionModal({ report: r, actionType: 'WARN' })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,165,0,0.4)',
                          background: 'rgba(255,165,0,0.1)',
                          color: '#FF9500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem'
                        }}
                        title="Send Official Warning"
                      >
                        <AlertOctagon size={15} /> Warn
                      </button>
                      <button
                        onClick={() => setActionModal({ report: r, actionType: 'DELETE' })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,0,0,0.4)',
                          background: 'rgba(255,0,0,0.1)',
                          color: '#ff4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.8rem'
                        }}
                        title="Delete Content"
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Resolved by <strong>{r.moderatorUsername || 'Admin'}</strong>
                      {r.moderatorNotes && <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Note: {r.moderatorNotes}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Inspection Modal */}
      {detailModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: `${typeColors[detailModal.targetType] || 'var(--neon-cyan)'}20`,
                  color: typeColors[detailModal.targetType] || 'var(--neon-cyan)',
                  border: `1px solid ${typeColors[detailModal.targetType] || 'var(--neon-cyan)'}40`
                }}>
                  {detailModal.targetType} REPORT #{detailModal.id}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: detailModal.status === 'PENDING' ? 'rgba(255, 0, 127, 0.15)' : 'rgba(0, 255, 153, 0.15)',
                  color: detailModal.status === 'PENDING' ? 'var(--neon-pink)' : 'var(--success)'
                }}>
                  {detailModal.status}
                </span>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Content Banner */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>FLAGGED CONTENT / SNIPPET:</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                "{detailModal.targetTitle}"
              </div>
            </div>

            {/* Details Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>VIOLATION REASON</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ff6b6b' }}>{detailModal.reason || 'Unspecified'}</div>
                {detailModal.details && (
                  <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                    "{detailModal.details}"
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>ACTORS</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  <strong>Reported Author:</strong> @{detailModal.reportedUsername || 'Unknown'} {detailModal.reportedEmail && `(${detailModal.reportedEmail})`}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Reporter:</strong> @{detailModal.reporterUsername || 'Anonymous'}
                </div>
              </div>
            </div>

            {/* Hierarchy & Context Info */}
            {(detailModal.decisionTitle || detailModal.communityName || detailModal.decisionId) && (
              <div style={{ background: 'rgba(0, 245, 255, 0.03)', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px', padding: '14px', marginBottom: '24px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: '6px' }}>PARENT CONTEXT:</div>
                {detailModal.decisionTitle && (
                  <div>Decision Board: <strong>{detailModal.decisionTitle}</strong> (ID: {detailModal.decisionId})</div>
                )}
                {detailModal.communityName && (
                  <div>Community: <strong>{detailModal.communityName}</strong></div>
                )}
              </div>
            )}

            {/* Direct Context Navigation Button */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                {(detailModal.targetType === 'BOARD' || detailModal.targetType === 'DECISION' || detailModal.targetType === 'POLL') && (
                  <a
                    href={`/decision/${detailModal.targetId || detailModal.decisionId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={15} /> Open Decision Board
                  </a>
                )}
                {detailModal.targetType === 'COMMENT' && (
                  <a
                    href={`/decision/${detailModal.decisionId || detailModal.targetId}#comment-${detailModal.targetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: '#FF9500', borderColor: '#FF9500' }}
                  >
                    <MessageSquare size={15} /> Open in Discussion
                  </a>
                )}
                {detailModal.targetType === 'COMMUNITY' && (
                  <a
                    href={`/communities/${detailModal.targetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={15} /> Open Community
                  </a>
                )}
              </div>

              {detailModal.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const rep = detailModal;
                      setDetailModal(null);
                      handleDismiss(rep.id);
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--success)' }}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      const rep = detailModal;
                      setDetailModal(null);
                      setActionModal({ report: rep, actionType: 'WARN' });
                    }}
                    style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.4)', background: 'rgba(255,165,0,0.1)', color: '#FF9500', cursor: 'pointer' }}
                  >
                    Warn
                  </button>
                  <button
                    onClick={() => {
                      const rep = detailModal;
                      setDetailModal(null);
                      setActionModal({ report: rep, actionType: 'DELETE' });
                    }}
                    style={{ padding: '8px 14px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.4)', background: 'rgba(255,0,0,0.1)', color: '#ff4444', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Execution Dialog Modal */}
      {actionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '26px' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', margin: '0 0 14px 0', color: actionModal.actionType === 'BAN' ? 'var(--neon-pink)' : actionModal.actionType === 'DELETE' ? '#ff4444' : '#FF9500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actionModal.actionType === 'WARN' && <AlertTriangle size={20} />}
              {actionModal.actionType === 'BAN' && <ShieldOff size={20} />}
              {actionModal.actionType === 'DELETE' && <Trash2 size={20} />}
              Confirm Action: {actionModal.actionType === 'WARN' ? 'Issue Formal Warning' : actionModal.actionType === 'BAN' ? 'Ban User' : 'Delete Content'}
            </h3>

            {/* Target Breakdown Box */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Type:</span>
                <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{actionModal.report.targetType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Content:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: '280px', textAlign: 'right', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {actionModal.report.targetTitle}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reported User:</span>
                <span style={{ color: 'var(--text-primary)' }}>@{actionModal.report.reportedUsername || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: actionModal.report.details ? '6px' : 0 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Reported Reason:</span>
                <span style={{ color: '#FF9500', fontWeight: 600 }}>{actionModal.report.reason || 'Not specified'}</span>
              </div>
              {actionModal.report.details && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <strong>Reporter Details:</strong> <em>"{actionModal.report.details}"</em>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {actionModal.actionType === 'WARN' ? 'Additional Moderator Directive / Instructions (Optional):' : 'Moderator Resolution Notes:'}
              </label>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder={actionModal.actionType === 'WARN' ? "e.g. Please edit the post to remove offending content, or account will be suspended." : "Optional notes for audit logs..."}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Warning Message Live Preview */}
            {actionModal.actionType === 'WARN' && (
              <div style={{ background: 'rgba(255, 149, 0, 0.08)', border: '1px solid rgba(255, 149, 0, 0.25)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '0.8rem', color: '#ffb347' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#FF9500' }}>User Notification Preview:</strong>
                <p style={{ margin: 0, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                  Your {actionModal.report.targetType} ('{actionModal.report.targetTitle}') was reported for: <strong>{actionModal.report.reason || 'Policy Violation'}</strong>.
                  {actionModal.report.details && <><br /><span style={{ opacity: 0.85 }}>Report Details: {actionModal.report.details}</span></>}
                  <br />
                  <span style={{ color: '#FF9500' }}>
                    Moderator Directive: {modalNotes.trim() ? modalNotes.trim() : 'Please review community guidelines and adhere to platform standards.'}
                  </span>
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setActionModal(null); setModalNotes(''); }}
                className="btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  background: actionModal.actionType === 'BAN' ? '#ff0055' : actionModal.actionType === 'DELETE' ? '#ff4444' : '#FF9500',
                  border: 'none'
                }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Executing...' : actionModal.actionType === 'WARN' ? 'Send Warning' : `Confirm ${actionModal.actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Moderation;
