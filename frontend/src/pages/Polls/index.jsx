import React, { useState } from 'react';
import { BarChart2, Clock, Users, PlusCircle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDynamicCategories } from '../../utils/categoryUtils';

const Polls = () => {
  const { showToast } = useToast();
  const dynamicCategories = useDynamicCategories();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPoll, setNewPoll] = useState({
    title: '',
    category: dynamicCategories[0] || 'Technology',
    options: ['', ''],
  });

  // Dummy data for polls
  const [polls, setPolls] = useState([
    {
      id: 1,
      title: "Which frontend framework will dominate 2027?",
      category: "Tech",
      totalVotes: 12450,
      timeLeft: "2 hours left",
      options: [
        { name: "React / Next.js", votes: 7500, color: "var(--neon-cyan)" },
        { name: "Vue / Nuxt", votes: 2450, color: "var(--neon-pink)" },
        { name: "Svelte", votes: 1500, color: "var(--accent-purple)" },
        { name: "Angular", votes: 1000, color: "var(--success)" }
      ],
      hasVoted: false
    },
    {
      id: 2,
      title: "Should we transition to a 4-day work week?",
      category: "Career",
      totalVotes: 8932,
      timeLeft: "1 day left",
      options: [
        { name: "Yes, definitely", votes: 6200, color: "var(--neon-cyan)" },
        { name: "No, keep it 5", votes: 1532, color: "var(--neon-pink)" },
        { name: "Depends on role", votes: 1200, color: "var(--accent-purple)" }
      ],
      hasVoted: true,
      userVoteIndex: 0
    },
    {
      id: 3,
      title: "Best investment strategy for the current market?",
      category: "Finance",
      totalVotes: 5420,
      timeLeft: "5 days left",
      options: [
        { name: "Index Funds", votes: 2100, color: "var(--neon-cyan)" },
        { name: "Crypto", votes: 1800, color: "var(--neon-pink)" },
        { name: "Real Estate", votes: 1000, color: "var(--accent-purple)" },
        { name: "Bonds", votes: 520, color: "var(--success)" }
      ],
      hasVoted: false
    }
  ]);

  const handleVote = (pollId, optionIndex) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId && !poll.hasVoted) {
        const newOptions = [...poll.options];
        newOptions[optionIndex].votes += 1;
        return {
          ...poll,
          totalVotes: poll.totalVotes + 1,
          hasVoted: true,
          userVoteIndex: optionIndex,
          options: newOptions
        };
      }
      return poll;
    }));
  };

  const handleAddOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    const formattedOptions = newPoll.options
      .filter(o => o.trim() !== '')
      .map((o, idx) => {
        const colors = ["var(--neon-cyan)", "var(--neon-pink)", "var(--accent-purple)", "var(--success)"];
        return {
          name: o,
          votes: 0,
          color: colors[idx % colors.length]
        };
      });

    if (newPoll.title.trim() === '' || formattedOptions.length < 2) {
      showToast("Please enter a question and at least 2 options.", "warning");
      return;
    }

    const createdPoll = {
      id: Date.now(),
      title: newPoll.title,
      category: newPoll.category,
      totalVotes: 0,
      timeLeft: "7 days left",
      options: formattedOptions,
      hasVoted: false
    };

    setPolls([createdPoll, ...polls]);
    setIsModalOpen(false);
    setNewPoll({ title: '', category: 'Tech', options: ['', ''] });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Outfit', margin: 0, marginBottom: '8px' }}>Active Polls</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cast your vote and shape the network's consensus.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={20} /> Create Poll
        </button>
      </div>

      {/* Polls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {polls.map((poll) => (
          <div key={poll.id} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            
            {/* Category Tag */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0, 245, 255, 0.1)', color: 'var(--neon-cyan)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              #{poll.category}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontFamily: 'Outfit', marginBottom: '20px', paddingRight: '60px' }}>{poll.title}</h2>
            
            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '30px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} /> {poll.totalVotes.toLocaleString()} Votes</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {poll.timeLeft}</span>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {poll.options.map((option, idx) => {
                const percentage = Math.round((option.votes / poll.totalVotes) * 100);
                const isWinner = poll.hasVoted && poll.userVoteIndex === idx;

                return (
                  <div key={idx} style={{ position: 'relative' }}>
                    <button 
                      onClick={() => handleVote(poll.id, idx)}
                      disabled={poll.hasVoted}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: 'var(--panel-bg-light)',
                        border: isWinner ? `1px solid ${option.color}` : '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--text-primary)',
                        cursor: poll.hasVoted ? 'default' : 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        zIndex: 1
                      }}
                      onMouseOver={(e) => {
                        if (!poll.hasVoted) e.currentTarget.style.borderColor = option.color;
                      }}
                      onMouseOut={(e) => {
                        if (!poll.hasVoted) e.currentTarget.style.borderColor = 'var(--glass-border)';
                      }}
                    >
                      {/* Animated Progress Bar Background */}
                      {poll.hasVoted && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${percentage}%`,
                          background: `${option.color}20`, // 20 hex is ~12% opacity
                          zIndex: -1,
                          transition: 'width 1s ease-out',
                          borderRight: `2px solid ${option.color}`
                        }} />
                      )}
                      
                      <span style={{ fontWeight: isWinner ? 'bold' : 'normal', zIndex: 2 }}>{option.name}</span>
                      
                      {poll.hasVoted && (
                        <span style={{ fontWeight: 'bold', color: option.color, zIndex: 2 }}>{percentage}%</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {poll.hasVoted && (
              <div style={{ marginTop: '20px', textAlign: 'center', color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BarChart2 size={16} /> Vote recorded successfully
              </div>
            )}

          </div>
        ))}
        
      </div>

      {/* Create Poll Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '30px', width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '25px', marginTop: 0 }}>Create New Poll</h2>
            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Poll Question</label>
                <input 
                  type="text" 
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                  placeholder="What do you want to ask?"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Category</label>
                <select 
                  value={newPoll.category || (dynamicCategories[0] || 'Technology')}
                  onChange={(e) => setNewPoll({...newPoll, category: e.target.value})}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', appearance: 'none' }}
                >
                  {dynamicCategories.map(cat => (
                    <option key={cat} value={cat} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {newPoll.options.map((opt, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                      placeholder={`Option ${idx + 1}`}
                    />
                  ))}
                </div>
                {newPoll.options.length < 6 && (
                  <button type="button" onClick={handleAddOption} style={{ background: 'transparent', color: 'var(--neon-cyan)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PlusCircle size={16} /> Add Option
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Publish Poll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Polls;
