import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TournamentCard from '../components/TournamentCard';
import Spinner from '../components/Spinner';
import { Trophy, Users, CheckCircle, Activity, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { token, user, API_URL } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    ongoingMatches: 0,
    completedMatches: 0,
  });

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/tournaments`, { headers });
        if (res.ok) {
          const data = await res.json();
          setTournaments(data);

          // Calculate global metrics for user dashboard
          let teamsCount = 0;
          let matchesCount = 0;
          let ongoingCount = 0;
          let completedCount = 0;

          // For detailed stats, we fetch information about the tournaments or calculate estimations
          // To be simple and robust, let's calculate based on the tournaments list
          // We can fetch details of each tournament created by the user, or calculate based on the list
          setStats({
            totalTournaments: data.length,
            adminTournaments: data.filter(t => t.creator?._id === user?._id).length,
          });
        }
      } catch (err) {
        console.error('Error fetching tournaments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [API_URL, user]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container" style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Pickleball Tournaments</h1>
          <p style={styles.subtitle}>Create, manage, and track real-time court brackets</p>
        </div>
        {user?.role === 'Admin' && (
          <Link to="/create-tournament" className="btn-white">
            <Plus size={18} />
            <span>Create Tournament</span>
          </Link>
        )}
      </header>

      {/* Admin stats summary */}
      {user?.role === 'Admin' && (
        <section style={styles.statsSection}>
          <div className="glass-card" style={styles.statCard}>
            <Trophy size={28} color="var(--color-primary)" />
            <div>
              <div style={styles.statVal}>{stats.totalTournaments}</div>
              <div style={styles.statLabel}>Total Tournaments</div>
            </div>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <Users size={28} color="var(--color-accent)" />
            <div>
              <div style={styles.statVal}>{stats.adminTournaments}</div>
              <div style={styles.statLabel}>Your Tournaments</div>
            </div>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <Activity size={28} color="var(--warning)" />
            <div>
              <div style={styles.statVal}>
                {tournaments.filter(t => t.status === 'Group Stage' || t.status === 'Knockout Stage').length}
              </div>
              <div style={styles.statLabel}>Active Tournaments</div>
            </div>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <CheckCircle size={28} color="var(--success)" />
            <div>
              <div style={styles.statVal}>{tournaments.filter(t => t.status === 'Completed').length}</div>
              <div style={styles.statLabel}>Completed Tournaments</div>
            </div>
          </div>
        </section>
      )}

      {/* Tournament List */}
      <section style={styles.listSection}>
        <h2 style={styles.sectionTitle}>All Tournaments</h2>
        {tournaments.length === 0 ? (
          <div style={styles.empty}>
            <Trophy size={48} color="var(--text-dark)" />
            <p>No tournaments created yet.</p>
            {user?.role === 'Admin' && (
              <Link to="/create-tournament" className="btn-white" style={{ marginTop: '1rem' }}>
                Create One Now
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {tournaments.map((t) => (
              <div key={t._id}>
                <TournamentCard tournament={t} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
    marginBottom: '3rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.5rem',
  },
  statVal: {
    fontSize: '1.75rem',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  listSection: {},
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '4rem 2rem',
    border: '2px dashed var(--border-color)',
    borderRadius: '16px',
    color: 'var(--text-muted)',
  },
};

export default Dashboard;
