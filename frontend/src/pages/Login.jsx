import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, Loader2, Eye, EyeOff, Phone, HelpCircle, ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, verifyLoginOtp, verify2faAdmin, forgotPasswordRequest, forgotPasswordReset } = useAuth();

  // Mode state: 'password' (normal), 'otp' (passwordless), '2fa' (admin otp), 'forgot' (forgot password)
  const [mode, setMode] = useState('password');

  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Simulation/state backups
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [adminEmail2fa, setAdminEmail2fa] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Login Submit
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      if (data && data.requires2fa) {
        setAdminEmail2fa(data.email);
        setSimulatedOtp(data.otpCode || '');
        setMode('2fa');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // OTP Login Step 1: Send Login OTP
  const handleOtpLoginRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await login({ loginWithOtp: true, email });
      if (data.otpCode) {
        setSimulatedOtp(data.otpCode);
      }
      setOtpSent(true);
      setSuccess('OTP sent successfully to your email!');
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to send login OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP Login Step 2: Verify Login OTP
  const handleOtpLoginVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyLoginOtp(email, otpCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Admin 2FA OTP Verify Submit
  const handle2faVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2faAdmin(adminEmail2fa, otpCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Admin 2FA code verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Request Password Reset OTP
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await forgotPasswordRequest(email);
      if (data.otpCode) {
        setSimulatedOtp(data.otpCode);
      }
      setOtpSent(true);
      setSuccess('Reset OTP sent successfully!');
    } catch (err) {
      setError(err.message || 'Failed to request reset OTP');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 2: Verify OTP and Reset
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await forgotPasswordReset(email, otpCode, newPassword);
      setSuccess('Password reset successfully! Please log in now.');
      setTimeout(() => {
        setSuccess('');
        setMode('password');
        setOtpSent(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Reset password verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <Trophy size={48} color="var(--color-primary)" />
          <h2 style={styles.title}>
            {mode === 'password' && 'Welcome back'}
            {mode === 'otp' && 'Login via OTP'}
            {mode === '2fa' && 'Admin Verification'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p style={styles.subtitle}>
            {mode === 'password' && 'Pickleball Tournament Management'}
            {mode === 'otp' && 'Enter email address for passwordless login'}
            {mode === '2fa' && 'Mandatory 2FA active for administrators'}
            {mode === 'forgot' && 'Enter email address to receive reset OTP'}
          </p>
        </div>

        {/* Tab Selection (only visible in password/otp modes) */}
        {(mode === 'password' || mode === 'otp') && (
          <div style={styles.tabs}>
            <button
              onClick={() => { setMode('password'); setError(''); setSuccess(''); setOtpSent(false); }}
              style={{ ...styles.tab, borderBottomColor: mode === 'password' ? 'var(--color-primary)' : 'transparent' }}
            >
              Password Login
            </button>
            <button
              onClick={() => { setMode('otp'); setError(''); setSuccess(''); setOtpSent(false); }}
              style={{ ...styles.tab, borderBottomColor: mode === 'otp' ? 'var(--color-primary)' : 'transparent' }}
            >
              OTP Login
            </button>
          </div>
        )}

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

        {/* Password Login */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={styles.inputContainer}>
                <Mail size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dinksync.com"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Password</label>
              <div style={styles.inputContainer}>
                <Lock size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-input"
                  style={{ ...styles.input, paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleBtn}
                >
                  {showPassword ? <EyeOff size={18} color="var(--text-muted)" /> : <Eye size={18} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            <div style={styles.forgotContainer}>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); setOtpSent(false); }}
                style={styles.forgotLink}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Log In'}
            </button>
          </form>
        )}

        {/* OTP Passwordless Login */}
        {mode === 'otp' && (
          <form onSubmit={otpSent ? handleOtpLoginVerify : handleOtpLoginRequest}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Email Address</label>
              <div style={styles.inputContainer}>
                <Mail size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            {otpSent && (
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">6-Digit Login OTP</label>
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
            )}

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : otpSent ? (
                'Verify & Log In'
              ) : (
                'Send Login OTP'
              )}
            </button>

            {otpSent && (
              <button
                type="button"
                style={styles.backBtn}
                onClick={() => { setOtpSent(false); setSimulatedOtp(''); setOtpCode(''); }}
              >
                Change Email Address
              </button>
            )}
          </form>
        )}

        {/* Admin 2FA View */}
        {mode === '2fa' && (
          <form onSubmit={handle2faVerifySubmit}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">6-Digit 2FA Code</label>
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

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify 2FA'}
            </button>
          </form>
        )}

        {/* Forgot Password View */}
        {mode === 'forgot' && (
          <form onSubmit={otpSent ? handleForgotReset : handleForgotRequest}>
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Registered Email Address</label>
              <div style={styles.inputContainer}>
                <Mail size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  required
                  disabled={otpSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label">6-Digit Reset OTP</label>
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
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (strong)"
                    className="text-input"
                  />
                </div>
              </>
            )}

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : otpSent ? (
                'Reset Password'
              ) : (
                'Send Reset OTP'
              )}
            </button>

            <button
              type="button"
              style={styles.backBtn}
              onClick={() => { setMode('password'); setOtpSent(false); setSimulatedOtp(''); setOtpCode(''); }}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}


        {mode !== 'forgot' && mode !== '2fa' && (
          <div style={styles.footer}>
            <span>Don't have an account? </span>
            <Link to="/register" style={styles.link}>
              Register here
            </Link>
          </div>
        )}
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
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
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
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.75rem',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-main)',
    fontFamily: 'var(--font-main)',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '0.9rem',
    transition: 'var(--transition-smooth)',
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
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '12px',
  },
  input: {
    paddingLeft: '2.5rem',
    width: '100%',
  },
  forgotContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '1.5rem',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'underline',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '0.85rem',
  },
  backBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    marginTop: '1rem',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: '1.75rem',
    letterSpacing: '0.4em',
    paddingLeft: '0.4em',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  simulationPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0.75rem',
    marginTop: '1.25rem',
    fontSize: '0.85rem',
  },
  simulationTitle: {
    fontWeight: 'bold',
    color: 'var(--color-primary)',
    marginBottom: '0.25rem',
    textAlign: 'center',
  },
  simulationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyBtn: {
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  link: {
    color: 'var(--color-primary)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  toggleBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Login;
