import React, { useState, useEffect } from 'react';
import { CheckSquare, Trash2 } from 'lucide-react';
import api from '../../../api/api';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/ConfirmModal';

const DecisionBoards = () => {
  const { showToast } = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [boardToDelete, setBoardToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [decRes, usersRes] = await Promise.all([
          api.get('/api/decisions', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        let userMap = {};
        if (usersRes.data?.success) {
          usersRes.data.data.forEach(u => {
            userMap[u.id] = u.username || u.fullName || u.email;
          });
        }

        if (decRes.data?.success) {
          const mapped = decRes.data.data.map(d => {
            const totalVotes = d.options ? d.options.reduce((sum, opt) => sum + (opt.score || 0), 0) : 0;
            return {
              id: d.id,
              title: d.title,
              owner: userMap[d.userId] || `User #${d.userId}`,
              votes: totalVotes,
              status: d.status || 'ACTIVE',
              created: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'
            };
          });
          setBoards(mapped);
        }
      } catch (err) {
        console.error("Failed to load admin decision boards:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteBoardClick = (id) => {
    setBoardToDelete(id);
  };

  const handleConfirmDeleteBoard = async () => {
    if (!boardToDelete) return;
    const id = boardToDelete;
    setBoardToDelete(null);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/decisions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setBoards(prev => prev.filter(x => x.id !== id));
      showToast("Decision board deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete decision board:", err);
      showToast(err.response?.data?.message || "Could not delete decision board.", "error");
    }
  };

  const filtered = filter === 'ALL' ? boards : boards.filter(b => b.status === filter);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
        <h3>Loading decision boards...</h3>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total Boards', value: boards.length,                                   color: 'var(--neon-cyan)' },
          { label: 'Active',        value: boards.filter(b => b.status === 'ACTIVE').length,   color: 'var(--success)'   },
          { label: 'Closed',       value: boards.filter(b => b.status === 'CLOSED').length, color: 'var(--neon-pink)' },
        ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{s.label}</p>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '2rem', fontFamily: 'Outfit', color: s.color }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {['ALL','ACTIVE','CLOSED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 18px', borderRadius: '20px', border: '1px solid var(--glass-border)', background: filter === f ? 'var(--neon-cyan)' : 'transparent', color: filter === f ? 'var(--bg-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: filter === f ? '700' : '400', transition: 'all 0.2s' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No decision boards found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Board Title','Owner','Total Votes','Status','Created','Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '16px', textAlign: i === 5 ? 'right' : 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const isClosed = b.status === 'CLOSED';
                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,245,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckSquare size={18} color="var(--neon-cyan)" />
                      </div>
                      {b.title}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{b.owner}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--neon-cyan)', fontWeight: '600' }}>{b.votes.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.72rem', 
                        fontWeight: 'bold', 
                        background: isClosed ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,153,0.1)', 
                        color: isClosed ? '#ff4444' : 'var(--success)', 
                        border: `1px solid ${isClosed ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,153,0.3)'}` 
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.created}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteBoardClick(b.id)} title="Delete" style={{ marginLeft: 'auto', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)', background: 'transparent', color: '#ff4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={15}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(boardToDelete)}
        title="Delete Decision Board"
        message="Are you sure you want to permanently delete this decision board? This action cannot be undone."
        onConfirm={handleConfirmDeleteBoard}
        onCancel={() => setBoardToDelete(null)}
        confirmText="Delete Board"
        type="destructive"
      />
    </div>
  );
};

export default DecisionBoards;
