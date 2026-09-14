import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Target, BarChart2, CheckSquare, TrendingUp, Activity, 
  Clock, ShieldAlert, Radio, Send, Check, X, Terminal, AlertTriangle, ExternalLink
} from 'lucide-react';
import api from '../../../api/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const INITIAL_COMMUNITIES = [
  { id: 1, name: 'Quantum Devs', owner: 'coder_q', members: 124 },
  { id: 2, name: 'Web3 Architects', owner: 'solidity_guru', members: 89 }
];

const INITIAL_REPORTS = [
  { id: 1, type: 'Board', title: 'Hacked Coins Promotion', reason: 'Financial scam link', reporter: 'priya_n' },
  { id: 2, type: 'User', title: 'spammer_bot', reason: '100 posts in 5 minutes', reporter: 'sarah_j' }
];

const INITIAL_LOGS = [
  { time: '14:28:10', type: 'SYS', text: 'Database replication status: OK' },
  { time: '14:26:05', type: 'USR', text: 'New user signup: neo@matrix.com' },
  { time: '14:25:30', type: 'SEC', text: 'API call rate limit triggered for IP 192.168.1.45' },
  { time: '14:24:12', type: 'SYS', text: 'Automated database backup completed successfully' },
  { time: '14:20:00', type: 'COM', text: 'Community approval request submitted: Quantum Devs' },
  { time: '14:15:48', type: 'SYS', text: 'System CPU temperature stable at 44°C' }
];

const logColors = {
  SYS: 'var(--neon-cyan)',
  USR: 'var(--success)',
  SEC: '#ff4444',
  COM: 'var(--neon-pink)'
};

const weeklyUsers = [
  { day: 'Mon', users: 34 }, { day: 'Tue', users: 52 }, { day: 'Wed', users: 41 },
  { day: 'Thu', users: 68 }, { day: 'Fri', users: 89 }, { day: 'Sat', users: 105 }, { day: 'Sun', users: 78 },
];

const Overview = () => {
  const [maintenance, setMaintenance] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcTitle, setBcTitle] = useState('');
  const [bcMsg, setBcMsg] = useState('');
  
  const [pendingComs, setPendingComs] = useState(INITIAL_COMMUNITIES);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  
  const [userCount, setUserCount] = useState(null);
  const [communityCount, setCommunityCount] = useState(null);
  const [decisionCount, setDecisionCount] = useState(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const usersRes = await api.get('/api/users/count');
        if (usersRes.data?.success) {
          setUserCount(usersRes.data.data);
        } else {
          setUserCount("Error");
        }
      } catch (err) {
        console.error("Error fetching user count:", err);
        setUserCount("Error");
      }

      try {
        const commsRes = await api.get('/api/communities/count');
        if (commsRes.data?.success) {
          setCommunityCount(commsRes.data.data);
        } else {
          setCommunityCount("Error");
        }
      } catch (err) {
        console.error("Error fetching community count:", err);
        setCommunityCount("Error");
      }

      try {
        const decisionsRes = await api.get('/api/decisions/count');
        if (decisionsRes.data?.success) {
          setDecisionCount(decisionsRes.data.data);
        } else {
          setDecisionCount("Error");
        }
      } catch (err) {
        console.error("Error fetching decision count:", err);
        setDecisionCount("Error");
      }
    };
    fetchCounts();
  }, []);
  
  const logEndRef = useRef(null);

  // Auto-scrolling and live mock server terminal logs
  useEffect(() => {
    const logPool = [
      { type: 'SYS', text: 'Server health check: CPU 12%, Mem 34%' },
      { type: 'USR', text: 'User @dpark casted a vote on "MBA vs Corporate Job"' },
      { type: 'SYS', text: 'Vite HMR connection re-established' },
      { type: 'SEC', text: 'Cleared 4 expired session tokens' },
      { type: 'COM', text: 'New post published in "AI Enthusiasts"' },
      { type: 'USR', text: 'User @sarah_j created a poll: "Preferred IDE"' }
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLogs(prev => [...prev.slice(-15), { time: timeStr, ...randomLog }]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const triggerBroadcast = async (e) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMsg.trim()) return;
    try {
      await api.post('/api/admin/broadcast', { title: bcTitle, message: bcMsg, target: 'All Users' });
      alert(`Broadcast Sent: "${bcTitle}"`);
      
      // Add to terminal logs
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLogs(prev => [...prev, { time: timeStr, type: 'SYS', text: `Global Broadcast dispatched: "${bcTitle}"` }]);
      
      setBcTitle('');
      setBcMsg('');
      setBroadcastOpen(false);
    } catch (err) {
      console.error("Failed to send broadcast:", err);
      alert(err.response?.data?.message || "Failed to send broadcast.");
    }
  };

  const approveCommunity = (id, name) => {
    setPendingComs(prev => prev.filter(c => c.id !== id));
    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { time: timeStr, type: 'COM', text: `Approved community: "${name}"` }]);
  };

  const rejectCommunity = (id, name) => {
    setPendingComs(prev => prev.filter(c => c.id !== id));
    // Log action
    const timeStr = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { time: timeStr, type: 'SEC', text: `Rejected community: "${name}"` }]);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/api/moderation/reports?status=PENDING');
        if (res.data?.success && res.data.data) {
          setReports(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching overview moderation reports:", err);
      }
    };
    fetchReports();
  }, []);

  const resolveReport = async (id, title, action) => {
    try {
      if (action === 'DISMISS') {
        await api.post(`/api/moderation/reports/${id}/dismiss`);
      } else {
        await api.post(`/api/moderation/reports/${id}/action`, { action: action });
      }
      setReports(prev => prev.filter(r => r.id !== id));
      const timeStr = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [...prev, { time: timeStr, type: 'SEC', text: `Moderation action [${action}] taken on: "${title}"` }]);
    } catch (err) {
      console.error("Failed to execute moderation action:", err);
      alert("Failed to execute moderation action.");
    }
  };

  const stats = [
    { label: 'Total Users',         value: userCount !== null ? userCount.toLocaleString() : 'Loading...',         icon: Users,       color: 'var(--neon-cyan)'    },
    { label: 'Total Communities',   value: communityCount !== null ? communityCount.toLocaleString() : 'Loading...',   icon: Target,      color: 'var(--neon-pink)'    },
    { label: 'Decision Boards',     value: decisionCount !== null ? decisionCount.toLocaleString() : 'Loading...',     icon: CheckSquare, color: 'var(--accent-purple)'},
    { label: 'Total Polls',         value: '219',   icon: BarChart2,   color: '#FF9500'             },
    { label: 'Total Votes Cast',    value: '98.4K', icon: TrendingUp,  color: 'var(--success)'      },
    { label: 'Active Today',        value: '342',   icon: Activity,    color: 'var(--neon-cyan)'    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* ── Emergency Control Bar ────────────────────────────────────── */}
      <div className="glass-panel" style={{ 
        padding: '20px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        border: `1px solid ${maintenance ? 'rgba(255, 0, 0, 0.4)' : 'var(--glass-border)'}` 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            background: maintenance ? '#ff4444' : 'var(--success)', 
            boxShadow: `0 0 10px ${maintenance ? '#ff4444' : 'var(--success)'}`,
            animation: 'pulse 2s infinite'
          }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              System Status: {maintenance ? 'MAINTENANCE MODE ACTIVE' : 'OPERATIONAL'}
            </h3>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {maintenance ? 'Non-admin users blocked from console operations' : 'All public services functional'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setMaintenance(!maintenance)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'transparent',
              border: `1px solid ${maintenance ? 'var(--success)' : '#ff4444'}`,
              color: maintenance ? 'var(--success)' : '#ff4444',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {maintenance ? 'Disable Maintenance' : 'Toggle Maintenance'}
          </button>
          
          <button 
            onClick={() => setBroadcastOpen(true)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--glow-cyan)'
            }}
          >
            <Radio size={14} /> Send Announcement
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: `${s.color}20`, padding: '12px', borderRadius: '10px', flexShrink: 0 }}>
              <s.icon color={s.color} size={20} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{s.label}</p>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1.5rem', fontFamily: 'Outfit', fontWeight: '700' }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Queues (Pending Task Feeds) ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Pending Communities Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--neon-pink)" /> Community Approval Required
          </h4>
          {pendingComs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No communities awaiting approval.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingComs.map(c => (
                <div key={c.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', display: 'block' }}>{c.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>by @{c.owner} · {c.members} members</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => approveCommunity(c.id, c.name)}
                      title="Approve"
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid rgba(0,255,153,0.3)', background: 'transparent', color: 'var(--success)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => rejectCommunity(c.id, c.name)}
                      title="Reject"
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid rgba(255,0,0,0.3)', background: 'transparent', color: '#ff4444', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Moderation Reports Feed */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--neon-cyan)" /> Flagged Reports Inbox
          </h4>
          {reports.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              Reports clear! No items flagged.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map(r => {
                const targetType = r.targetType || r.type || 'BOARD';
                const targetTitle = r.targetTitle || r.title || 'Untitled';
                const itemUrl = targetType === 'COMMENT'
                  ? `/decision/${r.decisionId || r.targetId}#comment-${r.targetId}`
                  : (targetType === 'COMMUNITY' ? `/communities/${r.targetId}` : `/decision/${r.targetId || r.decisionId}`);
                
                return (
                  <div key={r.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 14px', 
                    background: 'rgba(255,255,255,0.01)', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '10px', background: 'rgba(0,245,255,0.1)', color: 'var(--neon-cyan)', fontWeight: 'bold', display: 'inline-block', marginBottom: '4px' }}>{targetType}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{targetTitle}</span>
                      <span style={{ fontSize: '0.74rem', color: '#ff4444' }}>Reason: {r.reason}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {itemUrl && (
                        <a
                          href={itemUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid rgba(0,245,255,0.3)', background: 'transparent', color: 'var(--neon-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Open Item in New Tab"
                        >
                          <ExternalLink size={12} /> View
                        </a>
                      )}
                      <button 
                        onClick={() => resolveReport(r.id, targetTitle, 'DISMISS')}
                        style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => resolveReport(r.id, targetTitle, 'DELETE')}
                        style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,0,0,0.3)', background: 'rgba(255,0,0,0.1)', color: '#ff4444', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Chart & Terminal Console Row ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* User signups */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontFamily: 'Outfit', fontSize: '1.1rem' }}>User Signup Growth</h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyUsers}>
                <defs>
                  <linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--neon-cyan)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="users" stroke="var(--neon-cyan)" fill="url(#ovGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live System activity console */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          background: 'rgba(5, 5, 5, 0.95)', 
          border: '1px solid #1f2937', 
          borderRadius: '16px',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--neon-cyan)" /> Live Operations Log
          </h3>
          <div style={{ 
            fontFamily: 'Consolas, Monaco, monospace', 
            fontSize: '0.78rem', 
            color: '#a3e635', 
            height: '240px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            padding: '10px', 
            background: 'black', 
            borderRadius: '8px',
            border: '1px solid #111827'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ lineHeight: 1.4 }}>
                <span style={{ color: '#6b7280' }}>[{log.time}]</span>{' '}
                <span style={{ color: logColors[log.type] || '#a3e635', fontWeight: 'bold' }}>[{log.type}]</span>{' '}
                <span style={{ color: '#d1d5db' }}>{log.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>

      {/* ── Broadcast Announcement Modal ────────────────────────────── */}
      {broadcastOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setBroadcastOpen(false)}>
          <form onSubmit={triggerBroadcast} className="glass-panel" style={{ padding: '36px', maxWidth: '440px', width: '100%', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={20} color="var(--neon-cyan)" /> Dispatch Broadcast
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Broadcast Title</label>
              <input 
                type="text" 
                value={bcTitle} 
                onChange={e => setBcTitle(e.target.value)} 
                placeholder="e.g. Critical Update"
                required
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Broadcast Content</label>
              <textarea 
                value={bcMsg} 
                onChange={e => setBcMsg(e.target.value)} 
                placeholder="Message details..." 
                rows={4}
                required
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setBroadcastOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: 'var(--glow-cyan)' }}>
                <Send size={14} /> Send
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Overview;

