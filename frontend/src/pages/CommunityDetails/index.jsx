import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Shield, MessageSquare, Plus, ArrowLeft, CheckCircle, X, ThumbsUp, Clock, Trash2, Edit3, ShieldAlert, AlertTriangle, Eye, EyeOff, UserX, ExternalLink, Flag, Filter, Check } from 'lucide-react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import ReportModal from '../../components/ReportModal';

const CommunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberIdToRemove, setMemberIdToRemove] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit Community State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Technology');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdatingCommunity, setIsUpdatingCommunity] = useState(false);

  const [community, setCommunity] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [decisions, setDecisions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isHoveredJoined, setIsHoveredJoined] = useState(false);

  // Manage Requests State
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Manage Members State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Manage Reports State (Community Moderator Queue)
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [communityReports, setCommunityReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState('ALL');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // Moderation Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReportForAction, setSelectedReportForAction] = useState(null);
  const [actionType, setActionType] = useState('WARN'); // WARN | HIDE_COMMENT | UNHIDE_COMMENT | DELETE_CONTENT | KICK_MEMBER | DISMISS
  const [modNotes, setModNotes] = useState('');
  const [warningDirective, setWarningDirective] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, commRes, decRes, membershipRes] = await Promise.all([
          api.get('/api/users/me'),
          api.get(`/api/communities/${id}`),
          api.get('/api/decisions').catch(() => ({ data: { success: false, data: [] } })),
          api.get(`/api/communities/${id}/membership`).catch(() => ({ data: { success: false, data: null } }))
        ]);

        const user = userRes.data?.data;
        setCurrentUser(user);

        const comm = commRes.data?.data;
        if (comm) {
          setCommunity(comm);

          const isMod = Boolean(user?.username && comm.moderatorUsername && user.username === comm.moderatorUsername);
          const isUserAdmin = Boolean(
            user?.role === 'ADMIN' || 
            user?.role === 'ROLE_ADMIN' || 
            localStorage.getItem('role')?.toLowerCase() === 'admin'
          );
          
          const allDecisions = decRes.data?.success ? decRes.data.data : [];
          const commDecisions = allDecisions.filter(d => d.communityId === parseInt(id));

          const status = membershipRes.data?.data;
          let joined = false;
          let pending = false;

          const localJoinedList = user?.id ? JSON.parse(localStorage.getItem(`joined_comm_${user.id}`) || "[]") : [];
          const isLocallyJoined = localJoinedList.includes(parseInt(id));

          if (status) {
            const isMember = Boolean(status.member !== undefined ? status.member : status.isMember);
            const isPendingVal = Boolean(status.pending !== undefined ? status.pending : status.isPending);
            const isModeratorVal = Boolean(status.moderator !== undefined ? status.moderator : status.isModerator);
            joined = isMember || isModeratorVal || isLocallyJoined || isMod;
            pending = isPendingVal && !joined;
          } else {
            joined = isMod || isLocallyJoined;
          }

          setIsJoined(Boolean(joined));
          setIsPending(Boolean(pending));

          if (joined && user?.id) {
            if (!localJoinedList.includes(parseInt(id))) {
              localStorage.setItem(`joined_comm_${user.id}`, JSON.stringify([...localJoinedList, parseInt(id)]));
            }
          }

          const canViewDecisions = joined || isMod || isUserAdmin;

          if (canViewDecisions) {
            setDecisions(commDecisions);
          } else {
            setDecisions([]);
          }

          // Check pending reports for moderator or admin
          if (isMod || isUserAdmin) {
            api.get(`/api/communities/${id}/reports?status=PENDING`).then(rRes => {
              if (rRes.data?.success && Array.isArray(rRes.data.data)) {
                setPendingReportsCount(rRes.data.data.length);
              }
            }).catch(() => null);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load community details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleToggleJoin = async () => {
    if (!currentUser || !community) return;
    try {
      if (isJoined) {
        // Leave
        await api.delete(`/api/communities/${id}/members/${currentUser.id}`);
        setIsJoined(false);
        setIsPending(false);
        setCommunity(prev => ({ ...prev, memberCount: Math.max(0, prev.memberCount - 1) }));
        setDecisions([]); // Hide decisions
      } else {
        // Request Join
        const res = await api.post(`/api/communities/${id}/join`);
        const detail = String(res.data?.data || "");
        const msg = String(res.data?.message || "Join request processed.");
        const combinedMsg = `${detail} ${msg}`.toLowerCase();
        
        if (combinedMsg.includes("joined")) {
          showToast("Joined community successfully!", "success");
          setIsJoined(true);
          setIsPending(false);
          setCommunity(prev => ({ ...prev, memberCount: prev.memberCount + 1 }));

          if (currentUser?.id) {
            const localList = JSON.parse(localStorage.getItem(`joined_comm_${currentUser.id}`) || "[]");
            if (!localList.includes(parseInt(id))) {
              localStorage.setItem(`joined_comm_${currentUser.id}`, JSON.stringify([...localList, parseInt(id)]));
            }
          }

          // Fetch decisions now that they are joined
          const decRes = await api.get('/api/decisions');
          if (decRes.data?.success) {
            const commDecisions = decRes.data.data.filter(d => d.communityId === parseInt(id));
            setDecisions(commDecisions);
          }
        } else {
          showToast(detail || msg, "info");
          setIsPending(true);
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "";
      if (errMsg.toLowerCase().includes("already a member")) {
        showToast("You are already a member of this community!", "info");
        setIsJoined(true);
        setIsPending(false);
        // Fetch decisions now that they are joined
        const decRes = await api.get('/api/decisions');
        if (decRes.data?.success) {
          const commDecisions = decRes.data.data.filter(d => d.communityId === parseInt(id));
          setDecisions(commDecisions);
        }
      } else if (errMsg.toLowerCase().includes("pending join request")) {
        showToast("Your join request is already pending moderator approval!", "warning");
        setIsPending(true);
      } else {
        showToast(errMsg || "An error occurred.", "error");
      }
    }
  };

  const openManageRequests = async () => {
    setShowRequestsModal(true);
    setLoadingRequests(true);
    try {
      const res = await api.get(`/api/communities/${id}/requests`);
      if (res.data?.success) {
        setJoinRequests(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
      showToast("Failed to load requests.", "error");
    } finally {
      setLoadingRequests(false);
    }
  };

  const processJoinRequest = async (requestId, accept) => {
    try {
      const res = await api.post(`/api/communities/requests/${requestId}/handle`, { accept });
      if (res.data?.success) {
        showToast(res.data.message || (accept ? "Request accepted." : "Request rejected."), "success");
        setJoinRequests(prev => prev.filter(req => req.id !== requestId));
        if (accept) {
          setCommunity(prev => ({ ...prev, memberCount: prev.memberCount + 1 }));
        }
      }
    } catch (err) {
      console.error("Failed to process request:", err);
      showToast(err.response?.data?.message || "Failed to process request.", "error");
    }
  };

  const openManageMembers = async () => {
    setShowMembersModal(true);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/api/communities/${id}/members`);
      if (res.data?.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.warn("Backend members endpoint not found, loading mock members for preview:", err);
      setMembers([
        { userId: 1, username: community?.moderatorUsername || 'moderator', fullName: 'Community Founder', memberRole: 'MODERATOR' },
        { userId: 2, username: 'cyber_voter', fullName: 'Sarah Connor', memberRole: 'MEMBER' },
        { userId: 3, username: 'neon_debate', fullName: 'John Doe', memberRole: 'MEMBER' },
        { userId: 4, username: 'quantum_coder', fullName: 'Alice Smith', memberRole: 'MEMBER' }
      ]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    setMemberIdToRemove(memberId);
    setShowRemoveMemberConfirm(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberIdToRemove) return;
    setShowRemoveMemberConfirm(false);
    try {
      const res = await api.delete(`/api/communities/${id}/members/${memberIdToRemove}`);
      if (res.data?.success) {
        showToast("Member removed successfully.", "success");
        setMembers(prev => prev.filter(m => m.userId !== memberIdToRemove));
        setCommunity(prev => ({ ...prev, memberCount: Math.max(0, prev.memberCount - 1) }));
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
      showToast(err.response?.data?.message || "Failed to remove member.", "error");
    } finally {
      setMemberIdToRemove(null);
    }
  };

  const handleConfirmDeleteCommunity = async () => {
    setShowDeleteConfirm(false);
    try {
      const res = await api.delete(`/api/communities/${id}`);
      if (res.data?.success || res.status === 200) {
        showToast("Community deleted successfully.", "success");
        navigate('/communities');
      }
    } catch (err) {
      console.error("Failed to delete community:", err);
      showToast(err.response?.data?.message || "Failed to delete community.", "error");
    }
  };

  const openEditModal = () => {
    if (community) {
      setEditName(community.name || '');
      setEditCategory(community.category || 'Technology');
      setEditDescription(community.description || '');
      setShowEditModal(true);
    }
  };

  const handleUpdateCommunity = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!editName || !editName.trim() || !editDescription || !editDescription.trim()) {
      showToast("Community name and description are required.", "warning");
      return;
    }

    setIsUpdatingCommunity(true);
    try {
      const res = await api.put(`/api/communities/${id}`, {
        name: editName.trim(),
        category: editCategory,
        description: editDescription.trim()
      });

      if (res.data?.success && res.data.data) {
        setCommunity(res.data.data);
      } else {
        setCommunity(prev => ({
          ...prev,
          name: editName.trim(),
          category: editCategory,
          description: editDescription.trim()
        }));
      }
      showToast("Community updated successfully!", "success");
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update community:", err);
      showToast(err.response?.data?.message || "Failed to update community.", "error");
    } finally {
      setIsUpdatingCommunity(false);
    }
  };

  const fetchCommunityReports = async (status = reportFilter) => {
    if (!id) return;
    setLoadingReports(true);
    try {
      const res = await api.get(`/api/communities/${id}/reports?status=${status}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setCommunityReports(res.data.data);
        const pending = res.data.data.filter(r => r.status === 'PENDING').length;
        setPendingReportsCount(pending);
      }
    } catch (err) {
      console.error("Failed to load community reports:", err);
      showToast(err.response?.data?.message || "Failed to load reports.", "error");
    } finally {
      setLoadingReports(false);
    }
  };

  const openReportsModal = () => {
    setShowReportsModal(true);
    fetchCommunityReports(reportFilter);
  };

  const handleFilterChange = (status) => {
    setReportFilter(status);
    fetchCommunityReports(status);
  };

  const handleInitiateAction = (report, type) => {
    setSelectedReportForAction(report);
    setActionType(type);
    setModNotes('');
    setWarningDirective(
      type === 'WARN' 
        ? `Please ensure future contributions strictly follow community standards.`
        : ''
    );
    setActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedReportForAction) return;
    setActionSubmitting(true);
    try {
      const payload = {
        action: actionType,
        moderatorNotes: modNotes.trim(),
        warningMessage: actionType === 'WARN' ? warningDirective.trim() : undefined
      };
      const res = await api.post(
        `/api/communities/${id}/reports/${selectedReportForAction.id}/action`,
        payload
      );
      if (res.data?.success) {
        showToast(`Moderation action (${actionType}) applied successfully.`, 'success');
        setActionModalOpen(false);
        setSelectedReportForAction(null);
        setModNotes('');
        setWarningDirective('');
        await fetchCommunityReports(reportFilter);
      }
    } catch (err) {
      console.error("Failed to execute moderation action:", err);
      showToast(err.response?.data?.message || "Failed to execute moderation action.", "error");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleQuickDismissReport = async (reportId) => {
    try {
      const res = await api.post(`/api/communities/${id}/reports/${reportId}/dismiss`, { notes: "Dismissed by community moderator" });
      if (res.data?.success) {
        showToast("Report dismissed.", "success");
        await fetchCommunityReports(reportFilter);
      }
    } catch (err) {
      console.error("Failed to dismiss report:", err);
      showToast(err.response?.data?.message || "Failed to dismiss report.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
        <h3>Loading community details...</h3>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
        <h3>{error || 'Community not found.'}</h3>
        <button onClick={() => navigate('/communities')} className="btn-secondary" style={{ marginTop: '20px' }}>
          Back to Communities
        </button>
      </div>
    );
  }

  const isModerator = currentUser && (
    currentUser.username === community?.moderatorUsername ||
    currentUser.username?.toLowerCase() === community?.moderatorUsername?.toLowerCase()
  );
  
  const isAdmin = currentUser && (
    currentUser.role?.toLowerCase() === 'admin' ||
    currentUser.role?.toLowerCase() === 'role_admin' ||
    localStorage.getItem('role')?.toLowerCase() === 'admin'
  );

  const handleBack = () => {
    if (isAdmin) {
      navigate('/admin/dashboard?tab=communities');
    } else {
      navigate('/communities');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={handleBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '8px 16px' }}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Community Header */}
      <div className="glass-panel" style={{ padding: '40px', position: 'relative', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--neon-cyan)', opacity: '0.1', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ background: 'rgba(0, 245, 255, 0.1)', color: 'var(--neon-cyan)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                #{community.category}
              </span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'Outfit', margin: '0 0 16px 0', textShadow: 'var(--glow-cyan)' }}>
              {community.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6', marginBottom: '24px' }}>
              {community.description}
            </p>
            
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--neon-cyan)" /> {community.memberCount} Members
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="var(--neon-pink)" /> Moderated by @{community.moderatorUsername}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
            {isModerator ? (
              <>
                <button 
                  onClick={openReportsModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ffab00',
                    background: pendingReportsCount > 0 ? 'rgba(255, 171, 0, 0.2)' : 'rgba(255, 171, 0, 0.08)',
                    color: '#ffab00',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: pendingReportsCount > 0 ? '0 0 15px rgba(255, 171, 0, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 171, 0, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = pendingReportsCount > 0 ? 'rgba(255, 171, 0, 0.2)' : 'rgba(255, 171, 0, 0.08)';
                  }}
                >
                  <ShieldAlert size={16} /> Comment Reports
                  {pendingReportsCount > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite'
                    }}>
                      {pendingReportsCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={openEditModal}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--neon-cyan)', background: 'rgba(0, 245, 255, 0.15)', color: 'var(--neon-cyan)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Edit3 size={16} /> Edit Community
                </button>
                <button 
                  onClick={openManageRequests}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: "'Outfit', sans-serif" }}
                >
                  Join Requests
                </button>
                <button 
                  onClick={openManageMembers}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--neon-pink)', background: 'rgba(255, 0, 255, 0.1)', color: 'var(--neon-pink)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: "'Outfit', sans-serif" }}
                >
                  View Members
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <Trash2 size={16} /> Delete Community
                </button>
              </>
            ) : isAdmin ? (
              <>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Outfit', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                >
                  <Trash2 size={16} /> Delete Community
                </button>
              </>
            ) : isPending ? (
              <button 
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 165, 0, 0.3)',
                  background: 'rgba(255, 165, 0, 0.1)',
                  color: 'orange',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'default',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                <Clock size={18} /> Pending Approval
              </button>
            ) : isJoined ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div 
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 255, 127, 0.3)',
                    background: 'rgba(0, 255, 127, 0.05)',
                    color: 'var(--success)',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.95rem',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  <CheckCircle size={18} /> Joined Member
                </div>
                
                <button 
                  onClick={handleToggleJoin}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--neon-pink)',
                    background: 'rgba(255, 0, 255, 0.05)',
                    color: 'var(--neon-pink)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 255, 0.15)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 255, 0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <X size={18} /> Leave Community
                </button>
              </div>
            ) : (
              <button 
                onClick={handleToggleJoin}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: `linear-gradient(45deg, var(--neon-cyan), var(--bg-primary))`,
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Outfit', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 245, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Request to Join
              </button>
            )}

            {!isModerator && !isAdmin && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 0, 127, 0.25)',
                  background: 'rgba(255, 0, 127, 0.05)',
                  color: 'var(--neon-pink)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                <ShieldAlert size={14} /> Report Community
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Decision Boards Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', margin: 0 }}>Community Decisions</h2>
      </div>

      {!(isJoined || isModerator || isAdmin) ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Shield size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>Private Boards</h3>
          <p>You must join this community to view and participate in its decision boards.</p>
        </div>
      ) : (
        decisions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No decisions have been created for this community yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {decisions.map((dec) => (
              <div key={dec.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'Outfit', flex: 1, margin: '0 10px 0 0' }}>{dec.title}</h3>
                  <span style={{ background: dec.status === 'Closed' ? 'var(--chip-bg)' : 'rgba(0, 245, 255, 0.1)', color: dec.status === 'Closed' ? 'var(--text-secondary)' : 'var(--neon-cyan)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {dec.status}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', flex: 1 }}>
                  {dec.description ? (dec.description.length > 120 ? `${dec.description.substring(0, 120)}...` : dec.description) : 'No description provided.'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <ThumbsUp size={16} color="var(--neon-pink)" /> Active Consensus
                  </div>
                  <Link to={`/decision/${dec.id}`} className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Manage Requests Modal ────────────────────────────────────── */}
      {showRequestsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', borderRadius: '24px', position: 'relative', border: '1px solid var(--glass-border)' }}>
            <button onClick={() => setShowRequestsModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', margin: '0 0 8px 0' }} className="text-gradient">
              Join Requests
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
              Approve or reject users requesting to join.
            </p>

            {loadingRequests ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
            ) : joinRequests.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No pending requests.</div>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {joinRequests.map(req => (
                   <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                     <div>
                       <div style={{ fontWeight: 'bold' }}>{req.username}</div>
                       <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(req.createdAt).toLocaleDateString()}</div>
                     </div>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <button onClick={() => processJoinRequest(req.id, false)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'rgba(255, 99, 132, 0.2)', color: 'var(--neon-pink)', cursor: 'pointer' }}>Reject</button>
                       <button onClick={() => processJoinRequest(req.id, true)} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'rgba(0, 245, 255, 0.2)', color: 'var(--neon-cyan)', cursor: 'pointer' }}>Accept</button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manage Members Modal ────────────────────────────────────── */}
      {showMembersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '30px', borderRadius: '24px', position: 'relative', border: '1px solid var(--glass-border)' }}>
            <button onClick={() => setShowMembersModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', margin: '0 0 8px 0' }} className="text-gradient">
              Community Members
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
              Manage users who are currently members of this community.
            </p>

            {loadingMembers ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading members...</div>
            ) : members.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No members found.</div>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {members.map(member => (
                   <div key={member.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          @{member.username}
                        </div>
                        {member.email && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {member.email}
                          </div>
                        )}
                      </div>
                     {member.username !== community.moderatorUsername ? (
                       <button 
                         onClick={() => handleRemoveMember(member.userId)} 
                         style={{ 
                           padding: '6px 12px', 
                           borderRadius: '4px', 
                           border: '1px solid rgba(220, 38, 38, 0.3)', 
                           background: 'rgba(220, 38, 38, 0.1)', 
                           color: '#DC2626', 
                           cursor: 'pointer',
                           fontSize: '0.82rem',
                           fontWeight: '600',
                           transition: 'all 0.2s'
                         }}
                         onMouseEnter={e => {
                           e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
                           e.currentTarget.style.color = '#EF4444';
                         }}
                         onMouseLeave={e => {
                           e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
                           e.currentTarget.style.color = '#DC2626';
                         }}
                       >
                         Remove
                       </button>
                     ) : (
                       <span style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Owner</span>
                     )}
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showRemoveMemberConfirm}
        title="Remove Member"
        message="Are you sure you want to remove this member from the community?"
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => {
          setShowRemoveMemberConfirm(false);
          setMemberIdToRemove(null);
        }}
        confirmText="Remove"
        type="destructive"
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Community"
        message="Are you sure you want to delete this community? All members and community data will be permanently removed. This action cannot be undone."
        onConfirm={handleConfirmDeleteCommunity}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        type="destructive"
      />

      {/* Edit Community Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '550px', padding: '32px',
            borderRadius: '20px', background: 'var(--panel-bg)',
            border: '1px solid var(--neon-cyan)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowEditModal(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
              Edit Community
            </h2>

            <form onSubmit={handleUpdateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Community Name
                </label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                >
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Career">Career</option>
                  <option value="Travel">Travel</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea 
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input-premium"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingCommunity}
                  className="btn-primary"
                  style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isUpdatingCommunity ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="COMMUNITY"
        targetId={community?.id}
        targetTitle={community?.name}
        reportedUserId={community?.moderatorId}
        onReportSubmitted={() => {
          showToast("Community report submitted for moderation review.", "success");
        }}
      />

      {/* ── Community Moderation Queue Modal ────────────────────────────── */}
      {showReportsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', overflowY: 'auto', padding: '32px', borderRadius: '24px', position: 'relative', border: '1px solid #ffab00' }}>
            <button 
              onClick={() => setShowReportsModal(false)} 
              style={{ position: 'absolute', top: '22px', right: '22px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ShieldAlert size={28} color="#ffab00" />
              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', margin: 0, color: 'var(--text-primary)' }}>
                Reported Comments Queue
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
              Review reported comments in <strong>{community.name}</strong>. As community moderator, you can warn commenters, hide/delete comments, or remove rule-violating members. (Decision Board reports are reviewed by Super Admin).
            </p>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Reports', value: 'ALL' },
                { label: 'Pending Review', value: 'PENDING' },
                { label: 'Actions Taken', value: 'ACTION_TAKEN' },
                { label: 'Dismissed', value: 'DISMISSED' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: reportFilter === f.value ? '1px solid #ffab00' : '1px solid var(--glass-border)',
                    background: reportFilter === f.value ? 'rgba(255, 171, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: reportFilter === f.value ? '#ffab00' : 'var(--text-secondary)',
                    fontWeight: reportFilter === f.value ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loadingReports ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading reported content...
              </div>
            ) : communityReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <CheckCircle size={36} color="var(--neon-cyan)" style={{ marginBottom: '12px', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>All Clean!</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No reports found in this status category.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {communityReports.map(rep => {
                  const isPending = rep.status === 'PENDING';
                  const isComment = rep.targetType === 'COMMENT';

                  return (
                    <div 
                      key={rep.id}
                      style={{
                        padding: '20px',
                        background: 'var(--panel-bg)',
                        border: isPending ? '1px solid rgba(255, 171, 0, 0.4)' : '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: isComment ? 'rgba(0, 245, 255, 0.15)' : 'rgba(255, 0, 255, 0.15)',
                            color: isComment ? 'var(--neon-cyan)' : 'var(--neon-pink)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {rep.targetType}
                          </span>
                          <span style={{
                            background: isPending ? 'rgba(255, 171, 0, 0.15)' : rep.status === 'ACTION_TAKEN' ? 'rgba(0, 255, 127, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: isPending ? '#ffab00' : rep.status === 'ACTION_TAKEN' ? '#00ff7f' : 'var(--text-secondary)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {rep.status} {rep.actionTaken && rep.actionTaken !== 'NONE' ? `(${rep.actionTaken})` : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(rep.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Reported Content Box */}
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        borderLeft: '3px solid #ffab00'
                      }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Reported {rep.targetType}: {rep.reportedUsername ? <strong style={{ color: 'var(--neon-cyan)' }}>@{rep.reportedUsername}</strong> : 'Author unknown'}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                          "{rep.targetTitle}"
                        </div>
                        {(rep.decisionId || (isComment && rep.targetId)) && (
                          <div style={{ marginTop: '8px' }}>
                            <Link 
                              to={`/decision/${rep.decisionId || rep.targetId}${isComment ? `#comment-${rep.targetId}` : ''}`} 
                              target="_blank"
                              style={{ color: 'var(--neon-cyan)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                            >
                              <ExternalLink size={12} /> {isComment ? 'View Comment in Board Discussion' : 'View Flagged Board'}
                              {rep.decisionTitle ? ` ("${rep.decisionTitle}")` : ''}
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Reason & Details */}
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Reason:</strong> {rep.reason || 'Not specified'}
                        </div>
                        {rep.details && (
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Details:</strong> {rep.details}
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                          Reported by: @{rep.reporterUsername || 'Anonymous'}
                        </div>
                      </div>

                      {/* Moderator Notes if present */}
                      {rep.moderatorNotes && (
                        <div style={{ fontSize: '0.82rem', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                          <strong>Mod Note:</strong> {rep.moderatorNotes}
                        </div>
                      )}

                      {/* Action Buttons for Pending Reports */}
                      {isPending && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                          <button
                            onClick={() => handleInitiateAction(rep, 'WARN')}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ffab00', background: 'rgba(255, 171, 0, 0.1)', color: '#ffab00', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <AlertTriangle size={14} /> Warn Author
                          </button>

                          {isComment && (
                            <button
                              onClick={() => handleInitiateAction(rep, 'HIDE_COMMENT')}
                              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--neon-cyan)', background: 'rgba(0, 245, 255, 0.1)', color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <EyeOff size={14} /> Hide Comment
                            </button>
                          )}

                          <button
                            onClick={() => handleInitiateAction(rep, 'DELETE_CONTENT')}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Trash2 size={14} /> Delete Content
                          </button>

                          {rep.reportedUserId && (
                            <button
                              onClick={() => handleInitiateAction(rep, 'KICK_MEMBER')}
                              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--neon-pink)', background: 'rgba(255, 0, 255, 0.1)', color: 'var(--neon-pink)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <UserX size={14} /> Kick Member
                            </button>
                          )}

                          <button
                            onClick={() => handleQuickDismissReport(rep.id)}
                            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', marginLeft: 'auto' }}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Action Confirmation & Directive Modal ──────────────────────── */}
      {actionModalOpen && selectedReportForAction && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '30px', borderRadius: '20px', position: 'relative', border: '1px solid var(--neon-cyan)' }}>
            <button 
              onClick={() => setActionModalOpen(false)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
              Confirm Action: {actionType.replace('_', ' ')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Target: <strong>"{selectedReportForAction.targetTitle}"</strong> {selectedReportForAction.reportedUsername ? `by @${selectedReportForAction.reportedUsername}` : ''}
            </p>

            {actionType === 'WARN' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Warning Directive / Guidance for User:
                </label>
                <textarea
                  rows={3}
                  value={warningDirective}
                  onChange={(e) => setWarningDirective(e.target.value)}
                  className="input-premium"
                  placeholder="Explain what rule was broken and what is expected..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Internal Moderator Notes (Optional):
              </label>
              <input
                type="text"
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                className="input-premium"
                placeholder="Reason or notes recorded for moderation history..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setActionModalOpen(false)} 
                className="btn-secondary" 
                style={{ padding: '8px 18px' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={actionSubmitting} 
                onClick={handleExecuteAction} 
                className="btn-primary" 
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {actionSubmitting ? 'Executing...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetails;
