import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Users, Vote, CheckCircle, TrendingUp, Layers, RefreshCw, FileText } from 'lucide-react';
import api from '../../../api/api';
import ReportGeneratorModal from '../../../components/ReportGeneratorModal';

const PIE_COLORS = ['#00F5FF', '#FF007F', '#8A2BE2', '#FF9500', '#00E676'];
const tooltipStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)'
};

const Analytics = () => {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchAnalytics = async (selectedPeriod) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/analytics/admin?period=${selectedPeriod || period}`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const userGrowth = data?.userGrowth || [];
  const votingTrends = data?.votingTrends || [];
  const topBoards = data?.topBoards?.map(b => ({
    name: b.name?.length > 18 ? b.name.substring(0, 18) + '…' : b.name,
    votes: b.votes,
    comments: b.comments
  })) || [];

  const communityData = data?.topCommunities?.map(c => ({
    name: c.name,
    value: c.memberCount || 1
  })) || [];

  const categoryData = data?.categoryDistribution || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.4rem' }}>Platform Intelligence & Analytics</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Real-time telemetry on user acquisition, voting velocity, and community engagement.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Period Toggle */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
            {['daily', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: period === p ? 'var(--neon-cyan)' : 'transparent',
                  color: period === p ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: '0.82rem',
                  fontWeight: period === p ? '700' : '500',
                  transition: 'all 0.2s'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(period)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '0.84rem'
            }}
          >
            <FileText size={15} /> Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,245,255,0.1)', color: 'var(--neon-cyan)' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{data?.totalUsers ?? '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>● {data?.activeUsers ?? 0} Active</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,0,127,0.1)', color: 'var(--neon-pink)' }}>
            <Vote size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Votes Cast</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{data?.totalVotes ?? '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{data?.totalComments ?? 0} Comments</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(138,43,226,0.1)', color: 'var(--accent-purple)' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Boards</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{data?.activeDecisions ?? data?.totalDecisions ?? '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>In {data?.totalCommunities ?? 0} Communities</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,230,118,0.1)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolution Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Outfit' }}>{data?.resolutionRate != null ? `${data.resolutionRate}%` : '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{data?.resolvedDecisions ?? 0} Resolved</div>
          </div>
        </div>
      </div>

      {/* Row 1: User Growth & Voting Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* User Growth */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--neon-cyan)" /> User Acquisition
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{period} Timeline</span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" name="Users" stroke="var(--neon-cyan)" fill="url(#ugGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voting Trends */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Vote size={18} color="var(--neon-pink)" /> Voting Activity
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{period} Volume</span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={votingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" name="Votes" stroke="var(--neon-pink)" strokeWidth={2} dot={{ fill: 'var(--neon-pink)', r: 4 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Most Voted Decisions & Active Communities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Most Voted Decision Boards */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontFamily: 'Outfit', fontSize: '1.1rem' }}>🏆 Top Decision Boards</h3>
          <div style={{ height: '240px' }}>
            {topBoards.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No decision boards recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBoards} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="votes" name="Votes" fill="var(--accent-purple)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Most Active Communities */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', fontSize: '1.1rem' }}>🌐 Community Distribution</h3>
          <div style={{ height: '180px' }}>
            {communityData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No communities recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={communityData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {communityData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            {communityData.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Category Breakdown */}
      {categoryData.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Outfit', fontSize: '1.1rem' }}>🏷️ Decision Category Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {categoryData.map((cat, idx) => (
              <div key={cat.category} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{cat.category}</span>
                  <span style={{ color: 'var(--neon-cyan)', fontWeight: '700', fontSize: '0.85rem' }}>{cat.percentage}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(cat.percentage, 100)}%`, height: '100%', background: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{cat.count} decisions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Analytics Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        analyticsData={data}
        period={period}
      />

    </div>
  );
};

export default Analytics;
