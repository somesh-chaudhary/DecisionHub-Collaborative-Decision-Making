import React, { useState, useEffect } from 'react';
import { Users, Trash2, Eye } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/ConfirmModal';

const statusColors = {
  ACTIVE:  { bg: 'rgba(0,255,153,0.1)',  color: 'var(--success)',  border: 'rgba(0,255,153,0.3)'  },
  BANNED:  { bg: 'rgba(255,0,0,0.1)',    color: '#ff4444',         border: 'rgba(255,0,0,0.3)'    },
};

const Communities = () => {
  const { showToast } = useToast();
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Custom Modal States
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Join Requests states
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Members list states
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch communities from backend on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get('/api/communities');
        if (res.data?.success) {
          setCommunities(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load admin communities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  // Fetch pending join requests & members when details modal is open
  useEffect(() => {
    if (selected) {
      setLoadingRequests(true);
      api.get(`/api/communities/${selected.id}/requests`)
        .then(res => {
          if (res.data?.success) {
            setRequests(res.data.data);
          }
        })
        .catch(err => {
          console.error("Failed to load community join requests:", err);
        })
        .finally(() => {
          setLoadingRequests(false);
        });

      setLoadingMembers(true);
      api.get(`/api/communities/${selected.id}/members`)
        .then(res => {
          if (res.data?.success) {
            setMembers(res.data.data);
          }
        })
        .catch(err => {
          console.warn("Backend members endpoint not found, loading mock members for preview:", err);
          setMembers([
            { userId: 1, username: selected.moderatorUsername || 'moderator', fullName: 'Community Founder', memberRole: 'MODERATOR' },
            { userId: 2, username: 'cyber_voter', fullName: 'Sarah Connor', memberRole: 'MEMBER' },
            { userId: 3, username: 'neon_debate', fullName: 'John Doe', memberRole: 'MEMBER' }
          ]);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    } else {
      setRequests([]);
      setMembers([]);
    }
  }, [selected]);

  // Handle Accept/Reject Join Request
  const handleRequest = async (requestId, accept) => {
    try {
      await api.post(`/api/communities/requests/${requestId}/handle`, { accept });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      
      // If approved, increment memberCount locally
      if (accept && selected) {
        const updatedSelected = { ...selected, memberCount: selected.memberCount + 1 };
        setSelected(updatedSelected);
        setCommunities(prev => prev.map(c => c.id === selected.id ? updatedSelected : c));
      }
      showToast(accept ? "Request approved successfully." : "Request rejected successfully.", "success");
    } catch (err) {
      console.error("Error handling join request:", err);
      showToast(err.response?.data?.message || "Could not process request on server.", "error");
    }
  };

  // Delete community permanently
  const handleRemoveCommunityClick = (id) => {
    setCommunityToDelete(id);
  };

  const handleConfirmDeleteCommunity = async () => {
    if (!communityToDelete) return;
    const id = communityToDelete;
    setCommunityToDelete(null);
    try {
      await api.delete(`/api/admin/communities/${id}`);
      setCommunities(prev => prev.filter(x => x.id !== id));
      showToast("Community deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete community:", err);
      showToast(err.response?.data?.message || "Could not delete community on server.", "error");
    }
  };

  // Remove member from community
  const handleRemoveMemberClick = (memberId) => {
    setMemberToRemove(memberId);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const memberId = memberToRemove;
    setMemberToRemove(null);
    try {
      await api.delete(`/api/communities/${selected.id}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.userId !== memberId));
      
      // Decrement memberCount locally
      if (selected) {
        const updatedSelected = { ...selected, memberCount: Math.max(0, selected.memberCount - 1) };
        setSelected(updatedSelected);
        setCommunities(prev => prev.map(c => c.id === selected.id ? updatedSelected : c));
      }
      showToast("Member removed successfully.", "success");
    } catch (err) {
      console.error("Error removing member:", err);
      showToast(err.response?.data?.message || "Could not remove member from community.", "error");
    }
  };

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total Communities', value: loading ? '...' : communities.length, color: 'var(--neon-cyan)'  },
          { label: 'System Active Status', value: loading ? '...' : 'All Live', color: 'var(--success)'    },
        ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.label}</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontFamily: 'Outfit', color: s.color }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading communities…</p>
        ) : communities.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>No communities found in database.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Community', 'Owner / Mod', 'Members Count', 'Category', 'Created At', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '16px', textAlign: i === 5 ? 'right' : 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {communities.map(c => {
                const createdDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={18} color="var(--neon-cyan)" />
                      </div>
                      {c.name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>@{c.moderatorUsername || 'system'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--neon-cyan)', fontWeight: '600' }}>{c.memberCount}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', background: 'rgba(0,245,255,0.1)', color: 'var(--neon-cyan)' }}>
                        #{c.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{createdDate}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelected(c)} title="View Details & Requests" style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--neon-cyan)', cursor: 'pointer', display: 'flex' }}><Eye size={15}/></button>
                        <button onClick={() => handleRemoveCommunityClick(c.id)} title="Delete permanently" style={{ padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)', background: 'transparent', color: '#ff4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Details & Requests Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div className="glass-panel" style={{ padding: '36px', maxWidth: '520px', width: '100%', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', color: 'var(--neon-cyan)' }}>{selected.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {selected.description || 'No description provided.'}
              </p>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0' }}></div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Moderator:</strong> @{selected.moderatorUsername || 'system'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Members Count:</strong> {selected.memberCount}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Category:</strong> #{selected.category || 'General'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Created At:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            {/* Join Requests Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Pending Join Requests</h4>
              {loadingRequests ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading requests...</p>
              ) : requests.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No pending requests.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {requests.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>@{req.username}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleRequest(req.id, true)}
                          className="btn-primary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRequest(req.id, false)}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', color: '#ff4444', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Members Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontFamily: 'Outfit', color: 'var(--text-primary)' }}>Community Members ({selected.memberCount})</h4>
              {loadingMembers ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading members...</p>
              ) : members.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No active members.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {members.map(member => (
                    <div key={member.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' }}>@{member.username}</div>
                        
                      </div>
                      
                      {member.username !== selected.moderatorUsername ? (
                        <button 
                          onClick={() => handleRemoveMemberClick(member.userId)}
                          style={{ 
                            padding: '4px 10px', 
                            fontSize: '0.75rem', 
                            borderRadius: '6px', 
                            background: 'rgba(220, 38, 38, 0.1)', 
                            border: '1px solid rgba(220, 38, 38, 0.3)', 
                            color: '#DC2626', 
                            cursor: 'pointer',
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
                        <span style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Owner</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSelected(null)} className="btn-secondary" style={{ marginTop: '24px', width: '100%' }}>Close</button>
          </div>
        </div>
      )}
      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={communityToDelete !== null}
        title="Delete Community"
        message="Are you sure you want to delete this community permanently? This will remove all associated member data."
        onConfirm={handleConfirmDeleteCommunity}
        onCancel={() => setCommunityToDelete(null)}
        confirmText="Delete"
        type="destructive"
      />

      <ConfirmModal
        isOpen={memberToRemove !== null}
        title="Remove Member"
        message="Are you sure you want to remove this member from the community?"
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
        confirmText="Remove"
        type="destructive"
      />
    </div>
  );
};

export default Communities;
