import React, { useState } from 'react';
import { X, FileText, Printer, CheckSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ReportGeneratorModal = ({ isOpen, onClose, analyticsData, period }) => {
  const { showToast } = useToast();
  
  const [reportTitle, setReportTitle] = useState('DecisionHub Platform Analytics & Executive Report');
  const [selectedPeriod, setSelectedPeriod] = useState(period || 'monthly');
  const [isGenerating, setIsGenerating] = useState(false);

  const [sections, setSections] = useState({
    executiveSummary: true,
    topBoards: true,
    communities: true,
    moderation: true
  });

  if (!isOpen) return null;

  const toggleSection = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── PDF Report Generator & Print Window ───────────────────────────
  const handleGeneratePdf = () => {
    setIsGenerating(true);

    const reportDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Please allow popups to generate the PDF report.", "warning");
      setIsGenerating(false);
      return;
    }

    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@600;700&display=swap');
          @page {
            size: A4;
            margin: 8mm 12mm;
          }
          @media print {
            body { padding: 0 !important; background: #fff !important; }
            .no-print { display: none !important; }
            .stat-card { break-inside: avoid; page-break-inside: avoid; }
            tr { break-inside: avoid; page-break-inside: avoid; }
          }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 12px 18px;
            background: #fff;
            line-height: 1.3;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #00F5FF;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .brand {
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 700;
            color: #0088cc;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }
          .meta-box {
            text-align: right;
            font-size: 10px;
            color: #475569;
            line-height: 1.3;
          }
          .section-block {
            margin-bottom: 12px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          .stat-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .stat-val {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.1;
            margin-bottom: 2px;
          }
          .stat-label {
            font-size: 9.5px;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            font-weight: 600;
          }
          .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 13.5px;
            font-weight: 700;
            color: #0f172a;
            margin: 10px 0 6px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 11px;
          }
          th, td {
            padding: 5px 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 600;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .badge {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: 600;
            background: #e0f2fe;
            color: #0369a1;
          }
          .footer {
            margin-top: 16px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">DECISION_HUB</div>
            <div class="subtitle">${reportTitle}</div>
          </div>
          <div class="meta-box">
            <div><strong>Generated On:</strong> ${reportDate}</div>
            <div><strong>Period:</strong> ${selectedPeriod.toUpperCase()}</div>
            <div><strong>Authority:</strong> System Admin Console</div>
          </div>
        </div>

        ${sections.executiveSummary ? `
          <div class="section-block">
            <div class="section-title">1. Executive Telemetry Overview</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-val">${analyticsData?.totalUsers || 0}</div>
                <div class="stat-label">Registered Users</div>
              </div>
              <div class="stat-card">
                <div class="stat-val">${analyticsData?.totalDecisions || 0}</div>
                <div class="stat-label">Decision Boards</div>
              </div>
              <div class="stat-card">
                <div class="stat-val">${analyticsData?.totalVotes || 0}</div>
                <div class="stat-label">Votes Cast</div>
              </div>
              <div class="stat-card">
                <div class="stat-val">${analyticsData?.totalCommunities || 0}</div>
                <div class="stat-label">Active Communities</div>
              </div>
            </div>
          </div>
        ` : ''}

        ${sections.topBoards ? `
          <div class="section-block">
            <div class="section-title">2. Top Performing Decision Boards</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Board Title</th>
                  <th>Votes Cast</th>
                  <th>Comments</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${(analyticsData?.topBoards || []).map((b, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${b.name || 'Untitled Board'}</strong></td>
                    <td>${b.votes || 0} votes</td>
                    <td>${b.comments || 0} comments</td>
                    <td><span class="badge">ACTIVE</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="5">No top decision board metrics recorded.</td></tr>'}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${sections.communities ? `
          <div class="section-block">
            <div class="section-title">3. Top Active Communities</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Community Name</th>
                  <th>Member Roster</th>
                </tr>
              </thead>
              <tbody>
                ${(analyticsData?.topCommunities || []).map((c, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.memberCount || 1} Members</td>
                  </tr>
                `).join('') || '<tr><td colspan="3">No community records.</td></tr>'}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${sections.moderation ? `
          <div class="section-block">
            <div class="section-title">4. Moderation & Platform Safety Audit</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-val">${analyticsData?.totalReports || 0}</div>
                <div class="stat-label">Total Reports Filed</div>
              </div>
              <div class="stat-card">
                <div class="stat-val" style="color: #059669;">${analyticsData?.resolvedReports || 0}</div>
                <div class="stat-label">Resolved Tickets</div>
              </div>
              <div class="stat-card">
                <div class="stat-val" style="color: #d97706;">${analyticsData?.dismissedReports || 0}</div>
                <div class="stat-label">Dismissed Reports</div>
              </div>
              <div class="stat-card">
                <div class="stat-val" style="color: #dc2626;">${analyticsData?.warningsIssued || 0}</div>
                <div class="stat-label">Official Warnings</div>
              </div>
            </div>

            <div style="font-weight: 600; font-size: 13px; margin: 12px 0 8px 0; color: #334155;">Violation Reason Breakdown & Percentage Split</div>
            <table>
              <thead>
                <tr>
                  <th>Violation Category / Reason</th>
                  <th>Ticket Count</th>
                  <th>Percentage Split</th>
                </tr>
              </thead>
              <tbody>
                ${(analyticsData?.violationBreakdown || []).map(v => `
                  <tr>
                    <td><strong>${v.reason}</strong></td>
                    <td>${v.count} reports</td>
                    <td><span class="badge" style="background: #fef3c7; color: #b45309;">${v.percentage}%</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="3">No violation ticket records filed.</td></tr>'}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <div>DecisionHub Platform Analytics Audit — Confidential System Report</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    setIsGenerating(false);
    showToast("PDF Report view opened for printing / PDF save!", "success");
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '32px',
        borderRadius: '20px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'none', border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <FileText color="var(--neon-cyan)" size={24} />
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', margin: 0 }}>
            Generate PDF Report
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Configure document title, timeframe period, and telemetry sections for PDF export.
        </p>

        {/* Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Report Title Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Report Document Title</label>
            <input 
              type="text" 
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(18, 18, 24, 0.75)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Timeframe Period */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Timeframe Period</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(18, 18, 24, 0.75)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="daily" style={{ background: '#14141d' }}>Daily (7 Days)</option>
              <option value="weekly" style={{ background: '#14141d' }}>Weekly (6 Weeks)</option>
              <option value="monthly" style={{ background: '#14141d' }}>Monthly (7 Months)</option>
              <option value="all-time" style={{ background: '#14141d' }}>All Time</option>
            </select>
          </div>

          {/* PDF Content Scope Checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>Include Report Sections</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'executiveSummary', label: 'Executive Telemetry' },
                { key: 'topBoards', label: 'Top Decision Boards' },
                { key: 'communities', label: 'Top Active Communities' },
                { key: 'moderation', label: 'Moderation Safety Audit' },
              ].map(sec => (
                <label key={sec.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={sections[sec.key]}
                    onChange={() => toggleSection(sec.key)}
                    style={{ accentColor: 'var(--neon-cyan)', cursor: 'pointer' }}
                  />
                  <span>{sec.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={16} />
              {isGenerating ? 'Generating...' : 'Generate & Print PDF'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportGeneratorModal;
