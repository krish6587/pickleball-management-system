import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass-card" style={styles.card}>
        <div style={styles.iconContainer}>
          <AlertTriangle size={64} color="var(--warning)" style={styles.icon} />
        </div>
        <h1 style={styles.title}>404</h1>
        <h2 style={styles.subtitle}>Page Not Found</h2>
        <p style={styles.text}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div style={styles.actions}>
          <button onClick={() => window.history.back()} className="btn-white" style={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
          <Link to="/" className="signup-btn" style={styles.homeBtn}>
            <Home size={18} />
            <span>Home Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '2rem 1rem',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '3rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  iconContainer: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    padding: '1.5rem',
    borderRadius: '50%',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    animation: 'pulse 2s infinite',
  },
  title: {
    fontSize: '6rem',
    fontWeight: 900,
    lineHeight: 1,
    background: 'linear-gradient(to right, var(--color-primary), var(--neon-cyan))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
    fontFamily: 'Outfit, sans-serif',
  },
  subtitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--text-main)',
  },
  text: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  backBtn: {
    flex: '1 1 180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '30px',
    cursor: 'pointer',
    border: '1px solid var(--border-color)',
    backgroundColor: 'transparent',
    color: '#fff',
    transition: 'all 0.3s',
  },
  homeBtn: {
    flex: '1 1 180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '30px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s',
  },
};

export default NotFound;
