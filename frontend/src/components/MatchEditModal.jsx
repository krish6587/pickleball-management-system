import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Loader2 } from 'lucide-react';

const MatchEditModal = ({ match, onClose, onSubmit }) => {
  const [scheduledTime, setScheduledTime] = useState('');
  const [courtNumber, setCourtNumber] = useState('');
  const [status, setStatus] = useState('Scheduled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (match) {
      if (match.scheduledTime) {
        // Convert to YYYY-MM-DDThh:mm for datetime-local input
        const d = new Date(match.scheduledTime);
        const formatted = d.toISOString().slice(0, 16);
        setScheduledTime(formatted);
      } else {
        setScheduledTime('');
      }
      setCourtNumber(match.courtNumber || '');
      setStatus(match.status || 'Scheduled');
    }
  }, [match]);

  if (!match) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(match._id, {
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : null,
        courtNumber,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update match details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div className="glass-card animate-fade-in" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Edit Match Details</h3>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="badge badge-danger" style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label">Scheduled Time</label>
            <div style={styles.inputContainer}>
              <Calendar size={18} color="var(--text-muted)" style={styles.icon} />
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="text-input"
                style={styles.input}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Court Number</label>
            <div style={styles.inputContainer}>
              <MapPin size={18} color="var(--text-muted)" style={styles.icon} />
              <input
                type="text"
                value={courtNumber}
                onChange={(e) => setCourtNumber(e.target.value)}
                placeholder="e.g. Court 3"
                className="text-input"
                style={styles.input}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Match Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-input"
              style={styles.select}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} className="secondary-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="neon-btn" style={{ color: '#052e16' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1.5rem',
  },
  modal: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid var(--border-color)',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.75rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  error: {
    width: '100%',
    textAlign: 'center',
    padding: '0.5rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
  },
  select: {
    appearance: 'none',
    backgroundPosition: 'right 12px center',
    backgroundRepeat: 'no-repeat',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1rem',
  },
};

export default MatchEditModal;
