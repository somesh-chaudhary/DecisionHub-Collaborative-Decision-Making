import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Users, Zap, BarChart2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div style={{ paddingBottom: '100px' }}>
      
      {/* Hero Section with Dual Curved Neon Arcs & Center Horizon Flare */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        padding: '100px 20px 80px 20px',
        textAlign: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #100726 0%, #06020e 70%, #030107 100%)'
      }}>
        {/* Top Curved Dual Neon Light Arc SVG */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none', opacity: 0.55, zIndex: 1 }}>
          <svg viewBox="0 0 1440 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="topArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff00c8" />
                <stop offset="50%" stopColor="#9000ff" />
                <stop offset="100%" stopColor="#00f5ff" />
              </linearGradient>
              <filter id="topArcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur1" />
                <feGaussianBlur stdDeviation="10" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M -100 -60 C 350 140, 1090 140, 1540 -60" stroke="url(#topArcGrad)" strokeWidth="2.8" filter="url(#topArcGlow)" />
            <path d="M -100 -60 C 350 140, 1090 140, 1540 -60" stroke="#ffffff" strokeWidth="1.0" strokeOpacity="0.35" />
          </svg>
        </div>

        {/* Bottom Curved Dual Neon Light Arc SVG */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', opacity: 0.55, zIndex: 1 }}>
          <svg viewBox="0 0 1440 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="bottomArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#9000ff" />
                <stop offset="100%" stopColor="#ff00c8" />
              </linearGradient>
              <filter id="bottomArcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur1" />
                <feGaussianBlur stdDeviation="10" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M -100 300 C 350 100, 1090 100, 1540 300" stroke="url(#bottomArcGrad)" strokeWidth="2.8" filter="url(#bottomArcGlow)" />
            <path d="M -100 300 C 350 100, 1090 100, 1540 300" stroke="#ffffff" strokeWidth="1.0" strokeOpacity="0.35" />
          </svg>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontSize: '4.2rem', marginBottom: '20px', maxWidth: '900px', lineHeight: '1.15', fontFamily: 'Outfit', fontWeight: '800', position: 'relative', zIndex: 2 }}
        >
          Collaborative Decision Making <br /><span className="text-gradient">Platform</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ color: 'var(--text-secondary)', fontSize: '1.3rem', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6', position: 'relative', zIndex: 2 }}
        >
          Create Decision • Vote • Compare • Decide
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}
        >
          <Link to="/login" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--glow-cyan)' }}>
            Get Started <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>

      {/* Features Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }} data-aos="fade-up">
          <h2 style={{ fontSize: '2.8rem', fontFamily: 'Outfit', fontWeight: '700' }}>Platform Capabilities</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {[
            { icon: <Zap color="var(--neon-cyan)" size={32} />, title: "Instant Consensus", desc: "Real-time voting mechanisms ensure you get feedback at the speed of thought." },
            { icon: <BarChart2 color="var(--neon-pink)" size={32} />, title: "Deep Analytics", desc: "Radar charts, vote distribution, and sentiment analysis for every decision." },
            { icon: <Users color="var(--accent-purple)" size={32} />, title: "Community Driven", desc: "Join niche communities to get expert opinions on specialized topics." }
          ].map((feat, i) => (
            <div key={i} className="glass-panel" data-aos="fade-up" data-aos-delay={i * 100} style={{ padding: '40px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <div style={{ marginBottom: '20px' }}>{feat.icon}</div>
              <h3 style={{ marginBottom: '16px', fontSize: '1.4rem', fontFamily: 'Outfit', fontWeight: '600' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.92rem' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div style={{ background: 'var(--panel-bg-light)', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }} data-aos="fade-up">
            <h2 style={{ fontSize: '2.8rem', fontFamily: 'Outfit', fontWeight: '700' }}>How It Works</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {[
              { step: '01', title: 'Frame Your Dilemma', desc: 'Define your options and comparison criteria (Cost, Risk, Time, etc.).' },
              { step: '02', title: 'Gather Insights', desc: 'Share with the public grid or private communities to collect votes.' },
              { step: '03', title: 'Analyze & Execute', desc: 'Use our AI-driven charts to find the objectively best path forward.' }
            ].map((item, index) => (
              <div key={index} className="glass-panel" data-aos="fade-right" data-aos-delay={index * 100} style={{ display: 'flex', alignItems: 'center', padding: '30px', gap: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <div className="text-gradient" style={{ fontSize: '3.6rem', fontWeight: 'bold', fontFamily: 'Outfit', opacity: 0.4 }}>{item.step}</div>
                <div>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', fontWeight: '600' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.5' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Landing;
