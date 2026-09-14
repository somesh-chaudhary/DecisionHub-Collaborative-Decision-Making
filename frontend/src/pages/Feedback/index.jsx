import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Star, MessageSquare, AlertCircle, FileText,
  Trash2, Send, ShieldCheck, ChevronDown, ChevronUp, Loader2,
  Search, Filter, CheckCircle2, Clock, Bug, Lightbulb, HelpCircle, MessageCircle
} from 'lucide-react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

/* ─── Helpers & Category Mappings ─────────────────────────────────── */
const CATEGORY_CONFIG = {
  Bug:        { color: 'var(--neon-pink)', icon: Bug, bg: 'rgba(255, 0, 255, 0.12)', border: 'rgba(255, 0, 255, 0.3)' },
  Suggestion: { color: 'var(--neon-cyan)', icon: Lightbulb, bg: 'rgba(0, 245, 255, 0.12)', border: 'rgba(0, 245, 255, 0.3)' },
  Question:   { color: 'var(--accent-purple)', icon: HelpCircle, bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  General:    { color: 'var(--success)', icon: MessageCircle, bg: 'rgba(0, 255, 153, 0.12)', border: 'rgba(0, 255, 153, 0.3)' },
};

const BUG_STATUS_STYLES = {
  NEW:           { color: '#FFD700', label: '🟡 NEW', bg: 'rgba(255, 215, 0, 0.12)', border: 'rgba(255, 215, 0, 0.3)' },
  INVESTIGATING: { color: 'var(--neon-cyan)', label: '🔵 INVESTIGATING', bg: 'rgba(0, 245, 255, 0.12)', border: 'rgba(0, 245, 255, 0.3)' },
  IN_PROGRESS:   { color: 'var(--accent-purple)', label: '🟣 IN_PROGRESS', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  RESOLVED:      { color: 'var(--success)', label: '🟢 RESOLVED', bg: 'rgba(0, 255, 153, 0.12)', border: 'rgba(0, 255, 153, 0.3)' },
};

const StarRow = ({ rating, size = 15 }) => (
  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} style={{
        color:  i <= rating ? '#FFD700' : 'rgba(255,255,255,0.15)',
        fill:   i <= rating ? '#FFD700' : 'transparent',
        filter: i <= rating ? 'drop-shadow(0 0 4px rgba(255,215,0,0.4))' : 'none',
      }} />
    ))}
  </div>
);

/* ─── Feedback Card Component ─────────────────────────────────────── */
const FeedbackCard = ({
  f, isAdmin, currentUserId,
  replyDraft, onDraftChange,
  replyOpen, onToggleReply,
  onPostReply, onDeleteReply, onDeleteFeedback, onUpdateStatus
}) => {
  const catConfig = CATEGORY_CONFIG[f.category] || CATEGORY_CONFIG.General;
  const CategoryIcon = catConfig.icon;

  const isBugCategory = (f.category || '').toLowerCase() === 'bug';
  const currentStatus = (f.status || 'NEW').toUpperCase();
  const statusInfo = BUG_STATUS_STYLES[currentStatus] || BUG_STATUS_STYLES.NEW;

  const isOwner = !!(currentUserId && (f.userId === currentUserId || (f.user && f.user.id === currentUserId)));
  const canDelete = isOwner || isAdmin;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '22px',
        borderRadius: '18px',
        background: 'rgba(18, 18, 24, 0.65)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        border: f.adminReply
          ? '1px solid rgba(0, 245, 255, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: f.adminReply
          ? '0 6px 20px rgba(0, 245, 255, 0.04)'
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = f.adminReply ? 'rgba(0, 245, 255, 0.25)' : 'rgba(255, 255, 255, 0.07)';
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--neon-cyan), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '0.95rem', color: '#000',
          boxShadow: '0 0 10px rgba(0, 245, 255, 0.2)',
        }}>
          {(f.username || 'A')[0].toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'Outfit' }}>
            @{f.username || f.user?.username || 'anonymous'}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
            {f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Just now'}
          </span>
        </div>

        {/* Category Pill */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '20px', fontSize: '0.74rem',
          fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
          color: catConfig.color, background: catConfig.bg, border: `1px solid ${catConfig.border}`,
        }}>
          <CategoryIcon size={12} />
          {f.category || 'General'}
        </div>

        {/* Bug Status Lifecycle Badge */}
        {isBugCategory && (
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '0.74rem',
            fontWeight: '700', color: statusInfo.color, background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`
          }}>
            {statusInfo.label}
          </span>
        )}

        {/* Delete Feedback Button (Owner or Admin) */}
        {canDelete && onDeleteFeedback && (
          <button
            onClick={() => onDeleteFeedback(f.id)}
            title={isOwner ? "Delete your feedback" : "Delete submission (Admin)"}
            style={{
              background: 'rgba(255, 0, 255, 0.05)', border: '1px solid rgba(255, 0, 255, 0.2)',
              borderRadius: '8px', cursor: 'pointer', color: 'var(--neon-pink)',
              padding: '6px', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 0, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 0, 255, 0.05)'}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Admin 1-Click Status Controls (Bug Only) */}
      {isAdmin && isBugCategory && onUpdateStatus && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
          padding: '10px 14px', borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Set Bug Status:
          </span>
          {['NEW', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED'].map(st => {
            const isActive = currentStatus === st;
            const btnStyle = BUG_STATUS_STYLES[st];
            return (
              <button
                key={st}
                onClick={() => onUpdateStatus(f.id, st)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: isActive ? btnStyle.color : 'transparent',
                  color: isActive ? '#000' : btnStyle.color,
                  border: `1px solid ${btnStyle.color}`,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 8px ${btnStyle.color}40` : 'none',
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      )}

      {/* Rating Stars (Only for General category feedback) */}
      {(f.category || '').toLowerCase() === 'general' && f.rating > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StarRow rating={f.rating || 0} size={16} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
            ({f.rating || 0} / 5.0)
          </span>
        </div>
      )}

      {/* Feedback Body */}
      <p style={{
        margin: 0, color: 'var(--text-primary)',
        fontSize: '0.94rem', lineHeight: '1.6', whiteSpace: 'pre-wrap',
        fontFamily: 'Inter, sans-serif',
      }}>
        {f.comment || f.feedbackText || 'No comment provided.'}
      </p>

      {/* Official Admin Reply Box */}
      {f.adminReply && (
        <div style={{
          background: 'rgba(0, 245, 255, 0.05)',
          border: '1px solid rgba(0, 245, 255, 0.25)',
          borderRadius: '14px', padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: '8px',
          boxShadow: '0 4px 14px rgba(0, 245, 255, 0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--neon-cyan)" />
              <span style={{
                color: 'var(--neon-cyan)', fontSize: '0.8rem',
                fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Official Admin Response
              </span>
              {f.adminRepliedAt && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                  · {new Date(f.adminRepliedAt).toLocaleString()}
                </span>
              )}
            </div>
            {isAdmin && onDeleteReply && (
              <button
                onClick={() => onDeleteReply(f.id)}
                title="Remove official reply"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--neon-pink)', opacity: 0.7, transition: 'opacity 0.2s', padding: '2px',
                  display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            {f.adminReply}
          </p>
        </div>
      )}

      {/* Admin Reply Action Toggle & Form */}
      {isAdmin && onToggleReply && onPostReply && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '2px' }}>
          <button
            onClick={() => onToggleReply(f.id)}
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(0, 245, 255, 0.06)',
              border: '1px solid rgba(0, 245, 255, 0.25)',
              borderRadius: '10px',
              color: 'var(--neon-cyan)',
              cursor: 'pointer',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 245, 255, 0.06)'}
          >
            <MessageSquare size={14} />
            {f.adminReply
              ? (replyOpen ? 'Cancel Edit' : 'Edit Official Reply')
              : (replyOpen ? 'Cancel'      : 'Write Official Reply')}
            {replyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {replyOpen && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                rows={3}
                placeholder="Write official response to user..."
                value={replyDraft}
                onChange={e => onDraftChange(f.id, e.target.value)}
                className="input-premium"
                style={{
                  flex: 1, resize: 'none',
                  padding: '12px 14px', borderRadius: '12px',
                  fontSize: '0.9rem', lineHeight: '1.5',
                  background: 'rgba(10, 10, 15, 0.6)',
                  border: '1px solid rgba(0, 245, 255, 0.3)',
                }}
              />
              <button
                onClick={() => onPostReply(f.id)}
                className="btn-primary"
                style={{
                  padding: '12px 20px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.88rem', whiteSpace: 'nowrap',
                  boxShadow: 'var(--glow-cyan)',
                }}
              >
                <Send size={14} /> Save Response
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page Component ─────────────────────────────────────────── */
const Feedback = () => {
  const { showToast } = useToast();
  
  const storedUserStr = localStorage.getItem('user');
  let userRole = localStorage.getItem('role');
  let currentUserId = null;
  if (storedUserStr) {
    try {
      const parsed = JSON.parse(storedUserStr);
      if (!userRole) userRole = parsed.role;
      currentUserId = parsed.id;
    } catch (e) {}
  }
  const isAdmin = !!(userRole && (userRole.toUpperCase() === 'ADMIN' || userRole.toUpperCase() === 'ROLE_ADMIN'));

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  const resolveTab = (param) => {
    if (!param) return isAdmin ? 'all' : 'submit';
    const p = param.toLowerCase();
    if (p === 'history' || p === 'my' || p === 'my_history' || p === 'my-history') return 'history';
    if (p === 'submissions' || p === 'all') return 'all';
    if (p === 'submit') return 'submit';
    return isAdmin ? 'all' : 'submit';
  };

  const [activeSubTab, setActiveSubTab] = useState(() => resolveTab(tabParam));

  useEffect(() => {
    if (tabParam) {
      setActiveSubTab(resolveTab(tabParam));
    }
  }, [location.search]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Submit form state
  const [rating, setRating]           = useState(5);
  const [hoveredStar, setHoveredStar] = useState(-1);
  const [category, setCategory]       = useState('General');
  const [comment, setComment]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin reply state
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyOpen, setReplyOpen]     = useState({});

  // Confirm Modal state for deletion
  const [showDeleteFeedbackModal, setShowDeleteFeedbackModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete]               = useState(null);

  /* ── 1. Fetch Feedbacks ── */
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/feedback');
      if (res.data?.success) {
        setFeedbacks(res.data.data || []);
      } else {
        setFeedbacks(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setError(err.response?.data?.message || 'Failed to load feedbacks from server.');
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  /* ── 2. Submit Feedback ── */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!comment.trim()) {
      showToast('Please write your feedback message.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        category,
        comment: comment.trim(),
      };
      await api.post('/api/feedback', payload);
      showToast('Feedback submitted successfully to admin!', 'success');
      setComment('');
      setRating(5);
      setCategory('General');

      await fetchFeedbacks();
      if (!isAdmin) {
        setActiveSubTab('history');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      showToast(err.response?.data?.message || 'Failed to submit feedback to backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── 3. Toggle Admin Reply Box ── */
  const handleToggleReply = (id) => {
    setReplyOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    const currentFeedback = feedbacks.find(f => f.id === id);
    if (currentFeedback && currentFeedback.adminReply && !replyDrafts[id]) {
      setReplyDrafts(prev => ({ ...prev, [id]: currentFeedback.adminReply }));
    }
  };

  const handleDraftChange = (id, val) =>
    setReplyDrafts(prev => ({ ...prev, [id]: val }));

  /* ── 4. Post Admin Reply ── */
  const handlePostReply = async (id) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) {
      showToast('Reply cannot be empty.', 'warning');
      return;
    }
    try {
      await api.post(`/api/feedback/${id}/reply`, { adminReply: text });
      showToast('Official response saved successfully!', 'success');
      setReplyDrafts(prev => ({ ...prev, [id]: '' }));
      setReplyOpen(prev => ({ ...prev, [id]: false }));
      await fetchFeedbacks();
    } catch (err) {
      console.error('Failed to post reply:', err);
      showToast(err.response?.data?.message || 'Failed to post reply to backend.', 'error');
    }
  };

  /* ── 5. Delete Admin Reply ── */
  const handleDeleteReply = async (id) => {
    try {
      await api.delete(`/api/feedback/${id}/reply`);
      showToast('Official reply removed.', 'success');
      await fetchFeedbacks();
    } catch (err) {
      console.error('Failed to delete reply:', err);
      showToast(err.response?.data?.message || 'Failed to delete reply.', 'error');
    }
  };

  /* ── 6. Update Bug Status (Admin Only) ── */
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/api/feedback/${id}/status`, { status: newStatus });
      showToast(`Bug status updated to ${newStatus}`, 'success');
      await fetchFeedbacks();
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast(err.response?.data?.message || 'Failed to update bug status.', 'error');
    }
  };

  /* ── 7. Delete Feedback Entry ── */
  const handleDeleteFeedbackClick = (id) => {
    setFeedbackToDelete(id);
    setShowDeleteFeedbackModal(true);
  };

  const handleConfirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    setShowDeleteFeedbackModal(false);
    try {
      await api.delete(`/api/feedback/${feedbackToDelete}`);
      showToast('Feedback dismissed from admin dashboard.', 'success');
      await fetchFeedbacks();
    } catch (err) {
      console.error('Failed to dismiss feedback:', err);
      showToast(err.response?.data?.message || 'Failed to dismiss feedback.', 'error');
    } finally {
      setFeedbackToDelete(null);
    }
  };

  /* ── Filter & Search Memoization ── */
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchCat = selectedCategory === 'All' || (f.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        (f.comment || '').toLowerCase().includes(q) ||
        (f.username || f.user?.username || '').toLowerCase().includes(q) ||
        (f.adminReply || '').toLowerCase().includes(q)
      );
      return matchCat && matchSearch;
    });
  }, [feedbacks, selectedCategory, searchQuery]);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : '0.0';

  const repliedCount = feedbacks.filter(f => f.adminReply).length;
  const bugResolvedCount = feedbacks.filter(f => (f.category || '').toLowerCase() === 'bug' && (f.status || '').toUpperCase() === 'RESOLVED').length;

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>

      <style>{`
        .fb-subtab-btn {
          padding: 10px 22px; border-radius: 12px; font-size: 0.95rem; font-family: 'Outfit', sans-serif;
          font-weight: 700; border: 1px solid transparent; cursor: pointer; transition: all 0.3s ease;
        }
        .fb-subtab-btn.active {
          background: rgba(0, 245, 255, 0.15); color: var(--neon-cyan); border-color: rgba(0, 245, 255, 0.35);
          box-shadow: 0 0 12px rgba(0, 245, 255, 0.15);
        }
        .fb-subtab-btn.inactive {
          background: rgba(255, 255, 255, 0.03); color: var(--text-secondary); border-color: rgba(255, 255, 255, 0.06);
        }
        .fb-subtab-btn.inactive:hover {
          background: rgba(255, 255, 255, 0.07); color: var(--text-primary);
        }
        .filter-pill {
          padding: 7px 16px; borderRadius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary); display: flex; align-items: center; gap: 6px;
        }
        .filter-pill.active {
          background: rgba(0, 245, 255, 0.15); color: var(--neon-cyan); border-color: rgba(0, 245, 255, 0.35);
          font-weight: 700; boxShadow: 0 0 10px rgba(0, 245, 255, 0.15);
        }
        .filter-pill:hover {
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontFamily: 'Outfit', margin: '0 0 8px 0', fontWeight: '800' }}>
          System Feedback Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>
          {isAdmin
            ? 'Review user feedback, track bug resolutions, and manage official responses.'
            : 'Share your experience, report bugs, or request new features directly with our team.'}
        </p>
      </div>

      {/* Main Mode Tabs */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
        {!isAdmin && (
          <>
            <button
              className={`fb-subtab-btn ${activeSubTab === 'submit' ? 'active' : 'inactive'}`}
              onClick={() => setActiveSubTab('submit')}
            >
              ✍️ Submit Feedback
            </button>
            <button
              className={`fb-subtab-btn ${activeSubTab === 'history' ? 'active' : 'inactive'}`}
              onClick={() => setActiveSubTab('history')}
            >
              📜 My History ({feedbacks.length})
            </button>
          </>
        )}
        {isAdmin && (
          <button
            className={`fb-subtab-btn ${activeSubTab === 'all' ? 'active' : 'inactive'}`}
            onClick={() => setActiveSubTab('all')}
          >
            📋 All Submissions ({feedbacks.length})
          </button>
        )}
      </div>

      {/* ══ SUBMIT TAB ══ */}
      {activeSubTab === 'submit' && (
        <div className="glass-panel" style={{ padding: '36px', borderRadius: '24px', background: 'rgba(18,18,24,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

            {/* Category Selector (Top) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Select Feedback Category
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['General', 'Bug', 'Suggestion', 'Question'].map(cat => {
                  const sel = category === cat;
                  const cfg = CATEGORY_CONFIG[cat];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={cat} type="button" onClick={() => setCategory(cat)}
                      style={{
                        padding: '10px 20px', borderRadius: '16px', cursor: 'pointer',
                        border:     sel ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.08)',
                        background: sel ? cfg.bg : 'rgba(255,255,255,0.02)',
                        color:      sel ? cfg.color : 'var(--text-secondary)',
                        fontWeight: sel ? '700' : '600',
                        boxShadow:  sel ? `0 0 12px ${cfg.color}30` : 'none',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={16} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Star Rating Selector (Only for General Platform Feedback) */}
            {category === 'General' && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
                  <label style={{ fontSize: '1.15rem', fontFamily: 'Outfit', fontWeight: '700', color: 'var(--text-primary)' }}>
                    How would you rate your overall experience?
                  </label>

                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map(s => {
                      const filled = hoveredStar !== -1 ? s <= hoveredStar : s <= rating;
                      return (
                        <Star
                          key={s} size={36}
                          onClick={() => setRating(s)}
                          onMouseEnter={() => setHoveredStar(s)}
                          onMouseLeave={() => setHoveredStar(-1)}
                          style={{
                            cursor: 'pointer',
                            color:  filled ? '#FFD700' : 'rgba(255,255,255,0.2)',
                            fill:   filled ? '#FFD700' : 'transparent',
                            filter: filled ? 'drop-shadow(0 0 10px rgba(255,215,0,0.6))' : 'none',
                            transform: filled ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      );
                    })}
                  </div>

                  <span style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', fontWeight: '700', fontFamily: 'Outfit', height: '24px' }}>
                    {starLabels[hoveredStar !== -1 ? hoveredStar : rating]}
                  </span>
                </div>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0' }} />

            {/* Comment Message */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Your Message
              </label>
              <textarea
                required rows={5}
                placeholder="Describe your thoughts, bug details, or feature idea in detail…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="input-premium"
                style={{ resize: 'none', padding: '18px', borderRadius: '16px', fontSize: '0.95rem', background: 'rgba(10, 10, 15, 0.6)' }}
              />
            </div>

            <button
              type="submit" className="btn-primary" disabled={isSubmitting}
              style={{
                padding: '16px', fontSize: '1.05rem', fontWeight: '700',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                borderRadius: '16px', boxShadow: 'var(--glow-cyan)',
              }}
            >
              {isSubmitting ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
              {isSubmitting ? 'Sending to Server…' : 'Submit Feedback to Team'}
            </button>
          </form>
        </div>
      )}

      {/* ══ HISTORY / ALL SUBMISSIONS TABS ══ */}
      {(activeSubTab === 'history' || activeSubTab === 'all') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Search & Category Filter Toolbar */}
          <div style={{
            display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center',
            justify: 'space-between', padding: '16px 20px', borderRadius: '18px',
            background: 'rgba(18, 18, 24, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {/* Live Search */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search feedback by keyword or user..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-premium"
                style={{ width: '100%', paddingLeft: '40px', paddingRight: '14px', paddingUp: '10px', paddingDown: '10px', borderRadius: '14px', fontSize: '0.88rem' }}
              />
            </div>

            {/* Category Filter Pills (Admin Only) */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', marginRight: '4px' }}>Filter:</span>
                {['All', 'Bug', 'Suggestion', 'Question', 'General'].map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={`filter-pill ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submissions List */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: '14px', color: 'var(--neon-cyan)' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Loading submissions from server...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neon-pink)' }} className="glass-panel">
              <AlertCircle size={38} style={{ marginBottom: '14px' }} />
              <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
              <FileText size={42} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '1rem' }}>No feedback submissions match your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
              {filteredFeedbacks.map(f => (
                <FeedbackCard
                  key={f.id}
                  f={f}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  replyDraft={replyDrafts[f.id] || ''}
                  onDraftChange={handleDraftChange}
                  replyOpen={!!replyOpen[f.id]}
                  onToggleReply={handleToggleReply}
                  onPostReply={handlePostReply}
                  onDeleteReply={handleDeleteReply}
                  onDeleteFeedback={handleDeleteFeedbackClick}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Feedback Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteFeedbackModal}
        title="Delete Feedback Entry"
        message="Are you sure you want to delete this feedback entry? This action will remove it from the feedback list."
        onConfirm={handleConfirmDeleteFeedback}
        onCancel={() => {
          setShowDeleteFeedbackModal(false);
          setFeedbackToDelete(null);
        }}
        confirmText="Delete"
        type="destructive"
      />

    </div>
  );
};

export default Feedback;
