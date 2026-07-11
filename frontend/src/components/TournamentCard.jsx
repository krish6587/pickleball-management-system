import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Activity, ExternalLink } from 'lucide-react';

const TournamentCard = ({ tournament }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Setup':
        return 'badge-warning';
      case 'Group Stage':
        return 'badge-info';
      case 'Knockout Stage':
        return 'badge-success';
      case 'Completed':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={styles.card}>
      <div style={styles.header}>
        <span className={`badge ${getStatusBadgeClass(tournament.status)}`}>
          {tournament.status}
        </span>
        <span style={styles.creatorInfo}>
          <Shield size={12} style={{ marginRight: '4px' }} />
          Creator: {tournament.creator?.username || 'System'}
        </span>
      </div>

      <h3 style={styles.title}>{tournament.name}</h3>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <Activity size={16} color="var(--color-accent)" />
          <span>Type: {tournament.type}</span>
        </div>
        <div style={styles.detailItem}>
          <Users size={16} color="var(--color-primary)" />
          <span>
            {tournament.numGroups} Groups • {tournament.teamsPerGroup} Teams/Group
          </span>
        </div>
      </div>

      <div style={styles.actions}>
        <Link to={`/tournaments/${tournament._id}`} className="neon-btn" style={styles.btn}>
          <span>View Details</span>
          <ExternalLink size={16} />
        </Link>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1.25rem',
    borderRadius: '16px',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  creatorInfo: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-main)',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
  },
  actions: {
    marginTop: '0.5rem',
  },
  btn: {
    width: '100%',
    justifyContent: 'center',
    textDecoration: 'none',
  },
};

export default TournamentCard;
