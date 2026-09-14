import React, { useState, useEffect, useMemo } from 'react';
import { ThumbsUp, Plus, Search, Filter } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useDynamicCategories } from '../../utils/categoryUtils';

const DecisionBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const dynamicCategories = useDynamicCategories();
  
  const [decisions, setDecisions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');

  // Fetch decisions and current user from backend on mount
  useEffect(() => {
    const fetchDecisionsAndUser = async () => {
      try {
        const [res, userRes] = await Promise.all([
          api.get('/api/decisions'),
          api.get('/api/users/me').catch(() => null)
        ]);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDecisions(res.data.data);
        } else {
          setDecisions([]);
        }
        if (userRes && userRes.data?.success) {
          setCurrentUser(userRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch decisions from backend:", err);
        setDecisions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisionsAndUser();
  }, []);

  const filteredDecisions = useMemo(() => {
    const list = Array.isArray(decisions) ? decisions : [];
    let result = list.filter(dec => dec && !dec.communityId);
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(dec => 
        dec && (
          (dec.title && String(dec.title).toLowerCase().includes(lowerQuery)) || 
          (dec.category && String(dec.category).toLowerCase().includes(lowerQuery)) ||
          (dec.status && String(dec.status).toLowerCase().includes(lowerQuery))
        )
      );
    }
    if (filterCategory !== 'All') {
      result = result.filter(dec => dec && dec.category === filterCategory);
    }
    return result;
  }, [decisions, searchQuery, filterCategory]);

  return (
    <div style={{ paddingBottom: '40px' }} className="card-animate">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Outfit', margin: 0, textShadow: '0 0 20px rgba(0, 245, 255, 0.2)' }}>
            {searchQuery ? `Search Results: "${searchQuery}"` : 'Decision Boards'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '6px' }}>
            {searchQuery ? `Showing results matching your search.` : `Explore and participate in the network's consensus.`}
          </p>
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
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
          <div style={{ border: '3px solid rgba(0, 245, 255, 0.1)', borderTop: '3px solid var(--neon-cyan)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px auto' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>Loading decision boards...</h3>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
          <Search size={44} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--neon-cyan)' }} />
          <h3>No decisions found matching "{searchQuery}"</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {filteredDecisions.map((dec) => (
            <div 
              key={dec.id} 
              className="glass-panel card-animate" 
              style={{ 
                padding: '28px', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease, border-color 0.4s ease',
                border: '1px solid var(--glass-border)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 245, 255, 0.18), 0 0 1px rgba(0, 245, 255, 0.5)';
                e.currentTarget.style.borderColor = 'var(--neon-cyan)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '10px' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', flex: 1, margin: 0, color: 'var(--text-primary)', lineHeight: '1.3' }}>{dec.title}</h3>
                <span className="badge-premium" style={{ 
                  background: dec.status === 'Closed' ? 'var(--chip-bg)' : 'rgba(0, 245, 255, 0.1)', 
                  color: dec.status === 'Closed' ? 'var(--text-secondary)' : 'var(--neon-cyan)',
                  borderColor: dec.status === 'Closed' ? 'var(--glass-border)' : 'rgba(0, 245, 255, 0.25)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: '0.72rem',
                  whiteSpace: 'nowrap'
                }}>
                  {dec.status}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.6', flex: 1 }}>
                {dec.description ? (dec.description.length > 120 ? `${dec.description.substring(0, 120)}...` : dec.description) : 'No description provided.'}
              </p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {dec.category && (
                  <span className="badge-premium badge-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    #{dec.category}
                  </span>
                )}
                {dec.communityName ? (
                  <span className="badge-premium badge-pink" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Community: {dec.communityName}
                  </span>
                ) : (
                  <span className="badge-premium badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Public
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  <ThumbsUp size={16} color="var(--neon-pink)" style={{ filter: 'drop-shadow(0 0 5px var(--neon-pink))' }} /> Active Consensus
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/decision/${dec.id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}>
                    View
                  </Link>
                  {currentUser && (String(currentUser.id) === String(dec.userId) || currentUser.role === 'ADMIN' || currentUser.role === 'admin') && (
                    <Link to={`/decision/${dec.id}?edit=true`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}>
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (Non-Admin Users Only) */}
      {!(currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' || localStorage.getItem('role') === 'admin') && (
        <Link to="/create-decision" className="pulse-button" style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--neon-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-cyan)',
          color: 'black',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.8), 0 0 35px rgba(0, 245, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'var(--glow-cyan)';
        }}
        >
          <Plus size={32} />
        </Link>
      )}
    </div>
  );
};

export default DecisionBoard;
