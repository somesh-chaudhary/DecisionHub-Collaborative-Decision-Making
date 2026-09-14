import React, { useState, useEffect } from 'react';
import { User, Settings, Award, Edit3, Grid, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/api';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [currentUser, setCurrentUser] = useState(null);
  const [myDecisions, setMyDecisions] = useState([]);
  const [joinedCommunitiesCount, setJoinedCommunitiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userRes, commsRes, decisionsRes] = await Promise.all([
          api.get('/api/users/me'),
          api.get('/api/communities').catch(() => null),
          api.get('/api/decisions').catch(() => null)
        ]);

        if (userRes && userRes.data?.success) {
          const userObj = userRes.data.data;
          setCurrentUser(userObj);
          
          if (commsRes && commsRes.data?.success) {
            const list = commsRes.data.data;
            const membershipStatuses = await Promise.all(
              list.map(c => 
                api.get(`/api/communities/${c.id}/membership`)
                  .then(res => res.data?.data)
                  .catch(() => null)
              )
            );
            const joinedCount = list.filter((c, idx) => {
              const isModerator = c.moderatorUsername === userObj.username;
              const status = membershipStatuses[idx];
              if (status) {
                const isMember = status.member !== undefined ? status.member : status.isMember;
                const isModeratorVal = status.moderator !== undefined ? status.moderator : status.isModerator;
                return isMember || isModeratorVal;
              }
              return isModerator;
            }).length;
            setJoinedCommunitiesCount(joinedCount);
          }
          
          if (decisionsRes && decisionsRes.data?.success) {
            const allDecisions = decisionsRes.data.data;
            const filtered = allDecisions.filter(d => d.userId === userObj.id);
            setMyDecisions(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
        <h3>Loading profile...</h3>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
        <h3>User not found. Please log in again.</h3>
      </div>
    );
  }

  // Derive display username/handle
  const displayName = currentUser.fullName || currentUser.username || 'System User';
  const handleName = `@${currentUser.username || 'user'}`;
  
  // Dummy recent activities using real decision titles where possible
  const activities = myDecisions.map((d, index) => ({
    id: d.id,
    type: 'create',
    title: `Created decision board "${d.title}"`,
    time: 'Recent',
    icon: <Grid size={16} />,
    color: 'var(--neon-pink)'
  })).slice(0, 3);

  // Default mock activity if user hasn't created decisions
  if (activities.length === 0) {
    activities.push({
      id: 999,
      type: 'info',
      title: 'Joined the DecisionHub grid network',
      time: 'Just now',
      icon: <CheckCircle size={16} />,
      color: 'var(--success)'
    });
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--neon-cyan)', filter: 'blur(100px)', opacity: 0.1, zIndex: 0 }} />
        
        {/* Avatar */}
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-pink))',
          padding: '3px',
          zIndex: 1
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--text-secondary)'
          }}>
            <User size={60} />
          </div>
        </div>

        {/* User Info */}
        <div style={{ flex: 1, zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontFamily: 'Outfit', margin: 0 }}>{displayName}</h1>
              <span style={{ color: 'var(--neon-cyan)', fontSize: '1.1rem', fontWeight: '500' }}>{handleName}</span>
            </div>
            <span style={{ 
              background: 'rgba(0, 245, 255, 0.1)', 
              color: 'var(--neon-cyan)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {currentUser.role || 'USER'} Session
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1.05rem', lineHeight: '1.5', maxWidth: '600px' }}>
            Registered email: <span style={{ color: 'var(--text-primary)' }}>{currentUser.email}</span>
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Role Privileges', value: currentUser.role || 'USER', icon: <Award size={24} />, color: 'var(--accent-purple)' },
          { label: 'Decisions Created', value: myDecisions.length, icon: <Grid size={24} />, color: 'var(--neon-cyan)' },
          { label: 'Communities Joined', value: joinedCommunitiesCount, icon: <User size={24} />, color: 'var(--neon-pink)' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `${stat.color}20`, color: stat.color, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Outfit', color: 'var(--text-primary)', textTransform: stat.label === 'Role Privileges' ? 'capitalize' : 'none' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '30px', borderBottom: '1px solid var(--glass-border)', marginBottom: '30px' }}>
        {[
          { id: 'activity', label: 'Recent Activity', icon: <Clock size={18} /> },
          { id: 'decisions', label: 'My Decisions', icon: <Grid size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === tab.id ? 'var(--neon-cyan)' : 'var(--text-secondary)',
              padding: '12px 0',
              fontSize: '1.05rem',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeTab === tab.id ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '300px' }}>
        
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.map(activity => (
              <div key={activity.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${activity.color}20`, color: activity.color, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {activity.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 'normal', color: 'var(--text-primary)' }}>{activity.title}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Decisions Tab */}
        {activeTab === 'decisions' && (
          myDecisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <Grid size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h3>No decisions created yet</h3>
              <p>Initialize a new decision board from the sidebar to see it here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {myDecisions.map(decision => (
                <div key={decision.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'Outfit', margin: 0 }}>{decision.title}</h3>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: decision.status === 'ACTIVE' ? 'rgba(0, 255, 153, 0.1)' : 'var(--panel-bg)',
                      color: decision.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-secondary)'
                    }}>
                      {decision.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Category: #{decision.category || 'General'}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Profile;
