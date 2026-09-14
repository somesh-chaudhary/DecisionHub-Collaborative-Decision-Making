import React, { useState } from 'react';
import { Download, FileText, PieChart, Users, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';

const Reports = () => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState({});

  const reports = [
    {
      id: 'decisions',
      title: 'Decision Report',
      desc: 'Comprehensive breakdown of all decisions made, resolution status, author metrics, and voting counts.',
      icon: FileText,
      color: 'var(--neon-cyan)',
      type: 'decisions'
    },
    {
      id: 'voting',
      title: 'Voting Analytics',
      desc: 'Demographic and temporal records of individual votes, options chosen, and time trends.',
      icon: PieChart,
      color: 'var(--neon-pink)',
      type: 'voting'
    },
    {
      id: 'communities',
      title: 'Community Report',
      desc: 'Growth, engagement, moderator details, and active membership metrics across all communities.',
      icon: Users,
      color: 'var(--accent-purple)',
      type: 'communities'
    },
    {
      id: 'moderation',
      title: 'Moderation & Audit Log',
      desc: 'Security incidents, user reports, flagged content, warnings issued, bans, and moderator action audit trails.',
      icon: ShieldAlert,
      color: '#FF9500',
      type: 'moderation'
    },
  ];

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`;
    setDownloading(prev => ({ ...prev, [key]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/analytics/export?type=${type}`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'csv' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export report ${type}:`, err);
      showToast('Failed to generate report export. Please ensure you are logged in.', 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontFamily: 'Outfit', margin: 0, marginBottom: '10px' }}>Generated Reports</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Export live data for offline analysis, compliance, and platform auditing.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        {reports.map((report) => (
          <div key={report.id} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: `${report.color}20`, padding: '12px', borderRadius: '12px' }}>
                <report.icon color={report.color} size={28} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'Outfit', margin: 0 }}>{report.title}</h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', flex: 1, marginBottom: '24px', lineHeight: 1.5 }}>
              {report.desc}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleExport(report.type, 'csv')}
                disabled={downloading[`${report.type}-csv`]}
                className="btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
              >
                {downloading[`${report.type}-csv`] ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
                CSV Export
              </button>
              
              <button
                onClick={() => handleExport(report.type, 'excel')}
                disabled={downloading[`${report.type}-excel`]}
                className="btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
              >
                {downloading[`${report.type}-excel`] ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
                Excel / Data
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
