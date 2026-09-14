import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Search, PlusCircle, CheckCircle, Shield, X, ArrowRight, Filter, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';
import { useDynamicCategories } from '../../utils/categoryUtils';

const CATEGORY_STYLES = {
  Technology: { color: 'var(--neon-cyan)', icon: <TrendingUp size={24} />, badgeClass: 'badge-cyan' },
  Finance:    { color: 'var(--success)',   icon: <Shield size={24} />, badgeClass: 'badge-success' },
  Career:     { color: 'var(--accent-purple)', icon: <Users size={24} />, badgeClass: 'badge-purple' },
  Travel:     { color: 'var(--neon-pink)', icon: <MessageSquare size={24} />, badgeClass: 'badge-pink' },
  Lifestyle:  { color: '#FF9500',          icon: <Users size={24} />, badgeClass: 'badge-secondary' },
};

const DEFAULT_STYLE = { color: 'var(--neon-cyan)', icon: <Users size={24} />, badgeClass: 'badge-cyan' };

const Communities = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const dynamicCategories = useDynamicCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [communities, setCommunities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredButtonId, setHoveredButtonId] = useState(null);
  
  // Create community modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(dynamicCategories[0] || 'Technology');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user profile and communities from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, commsRes, decRes] = await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/communities'),
          api.get('/api/decisions').catch(() => ({ data: { success: false, data: [] } }))
        ]);

        const user = userRes.data?.data;
        if (user) {
          setCurrentUser(user);
        }

        const decisions = decRes.data?.success ? decRes.data.data : [];
        const accessedCommunityIds = new Set(
          decisions.filter(d => d.communityId).map(d => d.communityId)
        );

        if (commsRes.data?.success) {
          const list = commsRes.data.data;
          
          // Query membership status for all fetched communities in parallel
          const membershipStatuses = await Promise.all(
            list.map(c => 
              api.get(`/api/communities/${c.id}/membership`)
                .then(res => res.data?.data)
                .catch(() => null)
            )
          );

          const updatedList = list.map((c, idx) => {
            const styleInfo = CATEGORY_STYLES[c.category] || DEFAULT_STYLE;
            const isModerator = user && c.moderatorUsername === user.username;

            const status = membershipStatuses[idx];
            let isJoined = isModerator;
            let isPending = false;

            if (status) {
              const isMember = status.member !== undefined ? status.member : status.isMember;
              const isPendingVal = status.pending !== undefined ? status.pending : status.isPending;
              const isModeratorVal = status.moderator !== undefined ? status.moderator : status.isModerator;
              isJoined = isMember || isModeratorVal;
              isPending = isPendingVal;
            }

            return {
              ...c,
              color: styleInfo.color,
              icon: styleInfo.icon,
              badgeClass: styleInfo.badgeClass,
              isJoined: !!isJoined,
              isPending: !!isPending
            };
          });
          setCommunities(updatedList);
        }
      } catch (err) {
        console.error("Failed to load communities data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleJoin = async (id, isJoined) => {
    if (!currentUser) return;
    try {
      if (isJoined) {
        // Leave community
        await api.delete(`/api/communities/${id}/members/${currentUser.id}`);
        setCommunities(prev => prev.map(c => {
          if (c.id === id) {
            return { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) };
          }
          return c;
        }));

        const currentJoined = JSON.parse(localStorage.getItem(`joined_comm_${currentUser.id}`) || "[]");
        const updated = currentJoined.filter(x => x !== id);
        localStorage.setItem(`joined_comm_${currentUser.id}`, JSON.stringify(updated));
      } else {
        // Join community
        const res = await api.post(`/api/communities/${id}/join`);
        const msg = res.data?.message || res.data?.data || "Join request sent.";
        showToast(msg, msg.toLowerCase().includes("joined") ? "success" : "info");
        
        if (msg.toLowerCase().includes("joined")) {
           setCommunities(prev => prev.map(c => {
            if (c.id === id) {
              return { ...c, isJoined: true, memberCount: c.memberCount + 1 };
            }
            return c;
          }));

          const currentJoined = JSON.parse(localStorage.getItem(`joined_comm_${currentUser.id}`) || "[]");
          if (!currentJoined.includes(id)) {
            localStorage.setItem(`joined_comm_${currentUser.id}`, JSON.stringify([...currentJoined, id]));
          }
        } else {
           setCommunities(prev => prev.map(c => {
             if (c.id === id) {
               return { ...c, isPending: true };
             }
             return c;
            }));
        }
      }
    } catch (err) {
      console.error("Failed to toggle join status:", err);
      showToast(err.response?.data?.message || "An error occurred.", "error");
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/api/communities', {
        name,
        category,
        description
      });

      if (res.data?.success) {
        const created = res.data.data;
        const styleInfo = CATEGORY_STYLES[created.category] || DEFAULT_STYLE;
        
        const newComm = {
          ...created,
          color: styleInfo.color,
          icon: styleInfo.icon,
          badgeClass: styleInfo.badgeClass,
          isJoined: true // creator is automatically moderator and joined
        };

        setCommunities(prev => [newComm, ...prev]);
        
        // Reset and close
        setName('');
        setCategory('Technology');
        setDescription('');
        setShowModal(false);
        showToast("Community created successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to create community:", err);
      showToast(err.response?.data?.message || "Failed to create community.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Outfit', margin: 0, marginBottom: '8px', textShadow: '0 0 20px rgba(0, 245, 255, 0.2)' }}>Communities</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Find your tribe. Debate, vote, and decide together.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search communities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium"
              style={{
                paddingLeft: '45px',
                borderRadius: 'var(--radius-xl)',
                width: '260px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid var(--glass-border)',
                height: '44px'
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-secondary)' }} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-premium"
              style={{
                appearance: 'none',
                paddingLeft: '45px',
                paddingRight: '35px',
                borderRadius: 'var(--radius-xl)',
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid var(--glass-border)',
                height: '44px',
                width: '180px'
              }}
            >
              <option value="All" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>All Categories</option>
              {dynamicCategories.map(cat => (
                <option key={cat} value={cat} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  {cat}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '14px', top: '15px', pointerEvents: 'none', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }}></div>
          </div>

          {!(currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' || localStorage.getItem('role') === 'admin') && (
            <button 
              className="btn-primary pulse-button" 
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 20px', borderRadius: 'var(--radius-xl)' }}
            >
              <PlusCircle size={18} /> Create Group
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
          <div style={{ border: '3px solid rgba(0, 245, 255, 0.1)', borderTop: '3px solid var(--neon-cyan)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>Loading communities...</h3>
        </div>
      ) : (
        /* Communities Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
          
          {filteredCommunities.map((community) => (
            <div 
              key={community.id} 
              className="glass-panel card-animate" 
              onClick={() => navigate(`/communities/${community.id}`)}
              style={{ 
                padding: '30px', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                cursor: 'pointer',
                transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease, border-color 0.4s ease',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 15px 35px ${community.color}20, 0 0 1px ${community.color}`;
                e.currentTarget.style.borderColor = community.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              
              {/* Header: Icon & Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: 'var(--radius-md)', 
                  background: `${community.color}15`, 
                  color: community.color,
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  boxShadow: `0 0 15px ${community.color}30`,
                  border: `1px solid ${community.color}30`,
                  transition: 'transform 0.3s ease'
                }}>
                  {community.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', margin: 0, color: 'var(--text-primary)', lineHeight: '1.3' }}>{community.name}</h2>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} /> {community.memberCount} members</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><MessageSquare size={13} /> @{community.moderatorUsername || 'moderator'}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', flex: 1, marginBottom: '22px' }}>
                {community.description || 'Join this group to debate and gather consensus together.'}
              </p>

              {/* Category Tag */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span className={`badge-premium ${community.badgeClass || 'badge-secondary'}`}>
                  #{community.category || 'General'}
                </span>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (!community.isJoined) {
                    toggleJoin(community.id, community.isJoined);
                  }
                }}
                onMouseEnter={() => !community.isJoined && setHoveredButtonId(community.id)}
                onMouseLeave={() => setHoveredButtonId(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: community.isJoined 
                    ? hoveredButtonId === community.id 
                      ? 'rgba(0, 255, 127, 0.15)' 
                      : 'rgba(0, 255, 127, 0.08)' 
                    : community.isPending 
                      ? 'rgba(255, 165, 0, 0.08)' 
                      : hoveredButtonId === community.id
                        ? 'rgba(0, 245, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.02)',
                  border: community.isJoined 
                    ? hoveredButtonId === community.id 
                      ? '1px solid rgba(0, 255, 127, 0.6)' 
                      : '1px solid rgba(0, 255, 127, 0.35)' 
                    : community.isPending 
                      ? '1px solid rgba(255, 165, 0, 0.35)' 
                      : hoveredButtonId === community.id
                        ? '1px solid var(--neon-cyan)'
                        : '1px solid var(--glass-border)',
                  color: community.isJoined 
                    ? 'var(--success)' 
                    : community.isPending 
                      ? '#FFA500' 
                      : hoveredButtonId === community.id
                        ? 'var(--neon-cyan)'
                        : 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: community.isJoined 
                    ? '0 0 10px rgba(0, 255, 127, 0.1)' 
                    : hoveredButtonId === community.id
                      ? '0 0 10px rgba(0, 245, 255, 0.15)'
                      : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: community.isJoined ? 'default' : 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {community.isJoined ? (
                  <>Joined Community <CheckCircle size={16} /></>
                ) : community.isPending ? (
                  <>Pending Approval <Clock size={16} /></>
                ) : (
                  hoveredButtonId === community.id ? (
                    <>Join Community <PlusCircle size={16} /></>
                  ) : (
                    <>View Community <ArrowRight size={16} /></>
                  )
                )}
              </button>
              
            </div>
          ))}

          {filteredCommunities.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }} className="glass-panel">
              <Search size={44} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--neon-cyan)' }} />
              <h3>No communities found</h3>
              <p style={{ marginTop: '8px' }}>Try adjusting your search terms or create a new community.</p>
            </div>
          )}
          
        </div>
      )}

      {/* ── Create Community Modal ────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel modal-animate" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '35px',
            borderRadius: '24px',
            position: 'relative',
            background: 'rgba(15, 15, 15, 0.9)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 2px rgba(0, 245, 255, 0.3)'
          }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--neon-pink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <X size={22} />
            </button>

            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', margin: '0 0 8px 0', textShadow: '0 0 10px rgba(0, 245, 255, 0.3)' }} className="text-gradient">
              Create Community
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: '1.4' }}>
              Launch a new hub to collaborate and gather consensus.
            </p>

            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Community Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. AI Pioneers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                  onFocus={(e) => e.target.style.border = '1px solid var(--neon-cyan)'}
                  onBlur={(e) => e.target.style.border = '1px solid var(--glass-border)'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Category
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category || (dynamicCategories[0] || 'Technology')}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-premium"
                    style={{ appearance: 'none' }}
                  >
                    {dynamicCategories.map(cat => (
                      <option key={cat} value={cat} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '16px', top: '18px', pointerEvents: 'none', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--text-secondary)' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Description
                </label>
                <textarea 
                  rows={4}
                  placeholder="What is this community about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-premium"
                  style={{ resize: 'none' }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--neon-cyan)'}
                  onBlur={(e) => e.target.style.border = '1px solid var(--glass-border)'}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
                style={{ 
                  padding: '14px', 
                  fontSize: '1rem', 
                  marginTop: '10px',
                  boxShadow: 'var(--glow-cyan)'
                }}
              >
                {isSubmitting ? 'Creating Community...' : 'Create Community'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
