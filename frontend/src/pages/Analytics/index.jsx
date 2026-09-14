import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Activity, CheckCircle2, Users, Flame, RefreshCw } from 'lucide-react';
import api from '../../api/api';

const COLORS = ['#00E676', '#00F5FF', '#FF007F', '#8A2BE2', '#FF9500'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics/overview');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalAnalytics();
  }, []);

  const categoryTrends = data?.categoryTrends || [
    { month: 'Jan', tech: 4, career: 2, finance: 2, other: 1 },
    { month: 'Feb', tech: 6, career: 3, finance: 4, other: 2 },
    { month: 'Mar', tech: 8, career: 5, finance: 3, other: 1 },
    { month: 'Apr', tech: 12, career: 8, finance: 6, other: 3 },
    { month: 'May', tech: 15, career: 10, finance: 7, other: 4 },
    { month: 'Jun', tech: 18, career: 12, finance: 9, other: 5 }
  ];

  const resolutionData = data?.resolutionStates?.map(r => ({
    name: r.name,
    value: r.value || (r.name === 'Active / Ongoing' ? 1 : 0)
  })) || [
    { name: 'Resolved', value: 3 },
    { name: 'Active / Ongoing', value: 7 },
    { name: 'Closed', value: 1 }
  ];

  const communityGrowthData = data?.topCommunities?.map(c => ({
    name: c.name?.length > 14 ? c.name.substring(0, 14) + '…' : c.name,
    members: c.memberCount || 1,
    decisions: c.decisionCount || 0
  })) || [];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', margin: 0, background: 'linear-gradient(90deg, #FFFFFF, var(--neon-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Platform Network Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', fontSize: '0.95rem' }}>
            Live insights, decision trends, and collective intelligence indicators across the network.
          </p>
        </div>

        <button
          onClick={fetchGlobalAnalytics}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Vital Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--neon-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Users</span>
            <Users size={18} color="var(--neon-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{data?.totalUsers ?? '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Across {data?.totalCommunities ?? 0} active communities</div>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--neon-pink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Decisions</span>
            <Activity size={18} color="var(--neon-pink)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{data?.totalDecisions ?? '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', marginTop: '4px' }}>{data?.activeDecisions ?? 0} open for voting</div>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Votes Cast</span>
            <Flame size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{data?.totalVotes ?? '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{data?.totalComments ?? 0} collaborative comments</div>
        </div>

        <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolution Success</span>
            <CheckCircle2 size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{data?.resolutionRate != null ? `${data.resolutionRate}%` : '—'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px' }}>{data?.resolvedDecisions ?? 0} successfully concluded</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Category Participation Trends */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.2rem' }}>Category Participation Trends</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly Volume by Domain</span>
          </div>
          <div style={{ height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="tech" name="Technology" stroke="var(--neon-cyan)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="career" name="Career" stroke="var(--neon-pink)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="finance" name="Finance" stroke="var(--accent-purple)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="other" name="Other" stroke="#FF9500" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '30px' }}>
          
          {/* Decision Resolution State */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit', fontSize: '1.2rem' }}>Decision Resolution Lifecycle</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resolutionData}
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {resolutionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Community Activity Growth */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '20px', fontFamily: 'Outfit', fontSize: '1.2rem' }}>Top Active Communities</h3>
            <div style={{ height: '300px' }}>
              {communityGrowthData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No active communities yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={communityGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="members" name="Members" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="decisions" name="Decisions" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Analytics;
