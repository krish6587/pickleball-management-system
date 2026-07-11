import React from 'react';
import { Calendar, MapPin, Play, Edit3, Award } from 'lucide-react';

const MatchList = ({ matches, canEdit, onOpenScoreModal, onOpenEditModal }) => {
  if (!matches || matches.length === 0) {
    return <div style={styles.empty}>No matches scheduled yet.</div>;
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD';
    const date = new Date(timeStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
      case 'Not Started':
        return <span className="badge badge-warning">Scheduled</span>;
      case 'Ongoing':
      case 'In Progress':
        return <span className="badge badge-info">Ongoing</span>;
      case 'Completed':
        return <span className="badge badge-success">Completed</span>;
      default:
        return null;
    }
  };

  const getTeamDisplay = (team, matchCategory) => {
    if (!team) return { title: 'To Be Decided', subtitle: null };
    const category = matchCategory || team.category || '';
    const isSingles = category.toLowerCase().includes('singles');

    if (isSingles) {
      return {
        title: team.playerName || team.name || 'Unknown Player',
        subtitle: null
      };
    } else {
      const title = team.teamName || team.name || 'Unknown Team';
      let subtitle = null;
      if (team.player1 && team.player2) {
        subtitle = `${team.player1} / ${team.player2}`;
      } else if (team.players && team.players.length === 2) {
        subtitle = `${team.players[0]} / ${team.players[1]}`;
      }
      return { title, subtitle };
    }
  };

  return (
    <div style={styles.list}>
      {matches.map((match) => {
        const teamA = getTeamDisplay(match.teamA, match.category);
        const teamB = getTeamDisplay(match.teamB, match.category);
        const isCompleted = match.status === 'Completed';

        const isWinnerA = isCompleted && match.winner?._id === match.teamA?._id;
        const isWinnerB = isCompleted && match.winner?._id === match.teamB?._id;

        return (
          <div key={match._id} className="glass-card" style={styles.matchCard}>
            <div style={styles.matchHeader}>
              <div style={styles.metadata}>
                <span style={styles.matchId}>ID: {match._id.substring(18)}</span>
                {match.category && match.category !== 'Default' && <span className="badge badge-secondary" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>{match.category}</span>}
                {match.stage && <span className="badge badge-info">{match.stage}</span>}
                {getStatusBadge(match.status)}
              </div>
              <div style={styles.location}>
                <div style={styles.metaItem}>
                  <Calendar size={14} />
                  <span>{formatTime(match.scheduledTime)}</span>
                </div>
                {match.courtNumber && (
                  <div style={styles.metaItem}>
                    <MapPin size={14} />
                    <span>Court {match.courtNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.vsSection}>
              <div style={{ ...styles.teamRow, opacity: isCompleted && !isWinnerA ? 0.5 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ ...styles.teamName, fontWeight: isWinnerA ? 700 : 500 }}>
                      {teamA.title}
                    </span>
                    {isWinnerA && <Award size={16} color="var(--color-primary)" style={{ marginLeft: '4px' }} />}
                  </div>
                  {teamA.subtitle && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {teamA.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.vsDivider}>VS</div>

              <div style={{ ...styles.teamRow, opacity: isCompleted && !isWinnerB ? 0.5 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ ...styles.teamName, fontWeight: isWinnerB ? 700 : 500 }}>
                      {teamB.title}
                    </span>
                    {isWinnerB && <Award size={16} color="var(--color-primary)" style={{ marginLeft: '4px' }} />}
                  </div>
                  {teamB.subtitle && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {teamB.subtitle}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scores section for Best of 3 */}
            {isCompleted && match.games && match.games.length > 0 && (
              <div style={styles.scoresContainer}>
                <span style={styles.scoresLabel}>Games:</span>
                <div style={styles.gamesList}>
                  {match.games.map((game, index) => {
                    const highlightA = game.scoreA > game.scoreB;
                    const highlightB = game.scoreB > game.scoreA;
                    // Skip printing empty games if the match was won in 2 straight games
                    if (index === 2 && game.scoreA === 0 && game.scoreB === 0) return null;
                    
                    return (
                      <span key={index} style={styles.gameScore}>
                        G{index + 1}: <strong style={{ color: highlightA ? 'var(--color-primary)' : 'inherit' }}>{game.scoreA}</strong>
                        -
                        <strong style={{ color: highlightB ? 'var(--color-primary)' : 'inherit' }}>{game.scoreB}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            {canEdit && (
              <div style={styles.actions}>
                <button
                  onClick={() => onOpenEditModal(match)}
                  className="secondary-btn"
                  style={styles.actionBtn}
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </button>
                <button
                  onClick={() => onOpenScoreModal(match)}
                  className="neon-btn"
                  style={styles.actionBtn}
                  disabled={!match.teamA || !match.teamB}
                >
                  <Play size={14} />
                  <span>{isCompleted ? 'Edit Score' : 'Enter Score'}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '2rem',
  },
  matchCard: {
    padding: '1.25rem',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '0.75rem',
  },
  metadata: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  matchId: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  vsSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.5rem 0',
  },
  teamRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },
  teamName: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  vsDivider: {
    fontSize: '0.75rem',
    fontWeight: 800,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    color: 'var(--text-muted)',
  },
  scoresContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '0.5rem',
    borderRadius: '6px',
  },
  scoresLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  gamesList: {
    display: 'flex',
    gap: '1rem',
  },
  gameScore: {
    fontSize: '0.85rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  actionBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    gap: '0.25rem',
  },
};

export default MatchList;
