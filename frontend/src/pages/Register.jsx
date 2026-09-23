import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, User, Loader2, Phone, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { sendOtpEmail, verifyOtpEmail, completeProfile } = useAuth();

  // Wizard state: 1 = Email Input, 2 = OTP Verification, 3 = Profile Details
  const [step, setStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Admin');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // Password strength check
  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score, label: 'None', color: 'transparent' };
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Very Weak', color: '#ef4444' };
      case 2:
        return { score, label: 'Weak', color: '#f97316' };
      case 3:
        return { score, label: 'Fair', color: '#eab308' };
      case 4:
        return { score, label: 'Good', color: '#22c55e' };
      case 5:
        return { score, label: 'Strong', color: '#10b981' };
      default:
        return { score, label: 'None', color: 'transparent' };
    }
  };

  const strength = checkPasswordStrength(password);

  // Submit step 1: Email entry
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (email.toLowerCase().endsWith('@gm.com') || email.toLowerCase().endsWith('@gmal.com')) {
      setError('Did you mean @gmail.com? Please enter your full email address.');
      return;
    }

    setLoading(true);

    try {
      const data = await sendOtpEmail(email);
      if (data && data.otpCode) {
        setSimulatedOtp(data.otpCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit step 2: OTP verify
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtpEmail(email, otpCode);
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        setSuccess('');
        setStep(3);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Submit step 3: Complete profile details
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (strength.score < 5) {
      setError('Password must satisfy all strong password criteria (uppercase, lowercase, number, special char, and min 8 chars).');
      return;
    }

    setLoading(true);

    try {
      await completeProfile({
        email,
        mobileNumber,
        username,
        password,
        role,
      });
      setSuccess('Profile completed successfully! Welcome.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to complete profile registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <Trophy size={48} color="var(--color-primary)" />
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Step {step} of 3: {step === 1 ? 'Email Verification' : step === 2 ? 'Verify OTP' : 'Complete Profile'}</p>
        </div>

        {/* Progress indicators */}
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressStep, backgroundColor: step >= 1 ? 'var(--color-primary)' : 'var(--bg-tertiary)' }} />
          <div style={{ ...styles.progressStep, backgroundColor: step >= 2 ? 'var(--color-primary)' : 'var(--bg-tertiary)' }} />
          <div style={{ ...styles.progressStep, backgroundColor: step >= 3 ? 'var(--color-primary)' : 'var(--bg-tertiary)' }} />
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

        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Email Address</label>
              <div style={styles.inputContainer}>
                <Mail size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                'Send Verification OTP'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">6-Digit Verification Code</label>
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
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify & Proceed'
              )}
            </button>

            <button
              type="button"
              style={styles.backBtn}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Change Email Address
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleProfileSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address (Verified)</label>
              <div style={styles.inputContainer}>
                <Mail size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="text-input"
                  style={{ ...styles.input, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Username</label>
              <div style={styles.inputContainer}>
                <User size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="pickler123"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Mobile Number</label>
              <div style={styles.inputContainer}>
                <Phone size={18} color="var(--text-muted)" style={styles.icon} />
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="text-input"
                  style={styles.input}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '0.5rem' }}>
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

            {/* Password strength meter */}
            <div style={styles.strengthContainer}>
              <div style={styles.strengthBarBg}>
                <div
                  style={{
                    ...styles.strengthBarFill,
                    width: `${(strength.score / 5) * 100}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
              <div style={styles.strengthText}>
                <span>Strength: <strong style={{ color: strength.color }}>{strength.label}</strong></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required: A-Z, a-z, 0-9, special, min 8 chars</span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label">Select Role</label>
              <div style={styles.roleSelectionGrid}>
                {['Editor', 'Admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      ...styles.roleGridBtn,
                      backgroundColor: role === r ? 'rgba(163, 230, 53, 0.15)' : 'var(--bg-tertiary)',
                      borderColor: role === r ? 'var(--color-primary)' : 'var(--border-color)',
                      color: role === r ? 'var(--color-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="neon-btn" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering Profile...</span>
                </>
              ) : (
                'Complete & Sign In'
              )}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <span>Already have an account? </span>
          <Link to="/login" style={styles.link}>
            Log in here
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
    maxWidth: '440px',
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
  progressContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  progressStep: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    transition: 'background-color 0.3s ease',
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
  otpInput: {
    textAlign: 'center',
    fontSize: '1.75rem',
    letterSpacing: '0.4em',
    paddingLeft: '0.4em',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    padding: '0.85rem',
    marginBottom: '1rem',
  },
  backBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'underline',
    marginTop: '0.5rem',
  },
  roleSelectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  roleGridBtn: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'var(--font-main)',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'var(--transition-smooth)',
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
  strengthContainer: {
    marginTop: '0.5rem',
    marginBottom: '1.25rem',
  },
  strengthBarBg: {
    height: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
  },
  strengthText: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.25rem',
    fontSize: '0.8rem',
    color: 'var(--text-main)',
  },
};

export default Register;
