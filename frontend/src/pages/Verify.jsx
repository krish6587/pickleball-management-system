import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, ShieldCheck, Mail, Loader2, ArrowLeft } from 'lucide-react';

const Verify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, API_URL } = useAuth();

  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [simulatedEmailToken, setSimulatedEmailToken] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Read route state passed from registration or login redirect
    if (location.state) {
      if (location.state.email) setEmail(location.state.email);
      if (location.state.mobileNumber) setMobileNumber(location.state.mobileNumber);
      if (location.state.otpCode) setSimulatedOtp(location.state.otpCode);
      if (location.state.emailVerificationToken) setSimulatedEmailToken(location.state.emailVerificationToken);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      setSuccess('Account verified successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <ShieldCheck size={48} color="var(--color-primary)" />
          <h2 style={styles.title}>Account Verification</h2>
          <p style={styles.subtitle}>Enter the 6-digit OTP code sent to your mobile</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className="badge badge-success" style={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Verification Code (OTP)</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-input"
              style={styles.otpInput}
            />
          </div>

          <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading || !email}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        {/* Sandbox Dev simulation panel */}
        {(simulatedOtp || simulatedEmailToken) && (
          <div style={styles.simulationPanel}>
            <div style={styles.simulationTitle}>🛠️ Developer Simulation Box</div>
            
            {simulatedOtp && (
              <div style={styles.simulationItem}>
                <span>SMS OTP Received: </span>
                <strong style={{ color: 'var(--color-primary)' }}>{simulatedOtp}</strong>
                <button
                  type="button"
                  style={styles.applyBtn}
                  onClick={() => setOtpCode(simulatedOtp)}
                >
                  Autofill OTP
                </button>
              </div>
            )}

            {simulatedEmailToken && (
              <div style={styles.simulationItem}>
                <span>Email Verification: </span>
                <a
                  href={`${API_URL}/auth/verify-email?token=${simulatedEmailToken}`}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.verifyLink}
                >
                  Verify via Email Link ↗
                </a>
              </div>
            )}
            
            <p style={styles.simulationNotice}>
              In production, these would be delivered to {mobileNumber || 'your phone'} & {email || 'your email'}.
            </p>
          </div>
        )}

        <div style={styles.footer}>
          <Link to="/login" style={styles.link}>
            <ArrowLeft size={16} />
            <span>Back to Login</span>
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
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginTop: '1rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
    textAlign: 'center',
  },
  error: {
    width: '100%',
    textAlign: 'center',
    padding: '0.5rem',
    marginBottom: '1.5rem',
  },
  success: {
    width: '100%',
    textAlign: 'center',
    padding: '0.5rem',
    marginBottom: '1.5rem',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: '1.75rem',
    letterSpacing: '0.5em',
    paddingLeft: '0.5em',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '0.85rem',
    marginBottom: '1.5rem',
  },
  simulationPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
  },
  simulationTitle: {
    fontWeight: 'bold',
    color: 'var(--color-primary)',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  simulationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '0.5rem 0',
  },
  applyBtn: {
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  verifyLink: {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  simulationNotice: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '0.5rem',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  link: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};

export default Verify;
