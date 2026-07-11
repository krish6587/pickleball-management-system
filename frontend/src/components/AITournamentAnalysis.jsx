import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Brain, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Bold: **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bold alternative: *text* (if used for bold)
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

  const lines = escaped.split('\n');
  let inList = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Bullet points: - item or * item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('<ul class="chat-list" style="margin-left: 20px; margin-bottom: 12px; color: var(--text-muted); list-style-type: disc;">');
        inList = true;
      }
      result.push(`<li style="margin-bottom: 6px;">${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      
      if (line === '') {
        result.push('<div style="height: 10px;"></div>');
      } else {
        // Headers: ### Header
        if (line.startsWith('### ')) {
          result.push(`<h4 style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-top: 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">${line.substring(4)}</h4>`);
        } else if (line.startsWith('## ')) {
          result.push(`<h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary); margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">${line.substring(3)}</h3>`);
        } else if (line.startsWith('# ')) {
          result.push(`<h2 style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-top: 24px; margin-bottom: 12px;">${line.substring(2)}</h2>`);
        } else {
          result.push(`<p style="margin-bottom: 12px; line-height: 1.6; color: var(--text-muted);">${line}</p>`);
        }
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('');
};

export default function AITournamentAnalysis({ tournamentId }) {
  const { token, API_URL } = useAuth();
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async (isRefresh = false) => {
    setLoading(true);
    setError('');
    if (!isRefresh) setAnalysis('');
    
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const promptMessage = `Aap is tournament ka complete structured analysis aur insight pradan karein (Hindi/Hinglish language mix preferred, taaki conversational lage). Niche likhe sections shamil karein:
1. **Tournament Status Overview (खेल की स्थिति)**: Tournament ki stage aur progress.
2. **Top Performers & Standings (टॉप खिलाड़ी और स्टैंडिंग्स)**: Kaun si teams dominant hain, standings analysis.
3. **Key Highlights & Interesting Scores (रोमांचक मैच और स्कोर)**: Koi high stakes or nail-biting matches, points diff context.
4. **Predictions & Final Outlook (भविष्यवाणी)**: Kaun si team ke jitne ke chances hain ya kaun knockout me ja sakta hai.

Response ko beautifully sections, subheadings and bullet points me structured rakhe aur directly output shuru kare.`;

      const response = await fetch(`${API_URL}/ai/analyze`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: promptMessage,
          tournamentId: tournamentId,
          chatHistory: []
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'AI Analysis report generate karne me dikkat aayi.');
      }
      setAnalysis(data.text);
    } catch (err) {
      console.error(err);
      setError(err.message || 'AI Server se sampark nahi ho paya.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      fetchAnalysis();
    }
  }, [tournamentId]);

  return (
    <div className="glass-card animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.sparkleIcon}>
            <Sparkles size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h3 style={styles.title}>AI Tournament Insights & Analyst</h3>
            <p style={styles.subtitle}>Gemini AI powered live brackets, standings, and performance analysis</p>
          </div>
        </div>
        <button 
          onClick={() => fetchAnalysis(true)} 
          disabled={loading}
          style={styles.refreshBtn}
          title="Refresh Analysis"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Re-Analyze</span>
        </button>
      </div>

      {loading && !analysis && (
        <div style={styles.loadingArea}>
          <Brain size={40} className="pulse" style={{ color: 'var(--color-primary)', marginBottom: '15px' }} />
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent)', marginBottom: '10px' }} />
          <p style={styles.loadingText}>Analyzing tournament data, match fixtures, and current standings...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorArea}>
          <AlertCircle size={24} color="var(--danger)" />
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => fetchAnalysis()} style={styles.retryBtn}>Retry Analysis</button>
        </div>
      )}

      {analysis && (
        <div style={styles.contentArea}>
          {loading && (
            <div style={styles.refreshOverlay}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '8px' }}>Updating Analysis...</span>
            </div>
          )}
          <div 
            style={styles.markdownContent}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(analysis) }}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '28px',
    borderRadius: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sparkleIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    background: 'rgba(0, 240, 255, 0.05)',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
  loadingArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: '15px',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  errorArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '12px',
  },
  errorText: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  retryBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--bg-primary)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
  },
  contentArea: {
    position: 'relative',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 8, 20, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    borderRadius: '8px',
  },
  markdownContent: {
    fontSize: '0.95rem',
    lineHeight: '1.7',
    color: 'var(--text-main)',
  },
};
