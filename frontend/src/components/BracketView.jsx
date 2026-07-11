import React from 'react';
import { Trophy, HelpCircle } from 'lucide-react';

const BracketView = ({ matches }) => {
  // Filter matches by stage
  const r64Matches = matches.filter(m => m.stage === 'Round of 64').sort((a, b) => a.matchIndex - b.matchIndex);
  const r32Matches = matches.filter(m => m.stage === 'Round of 32').sort((a, b) => a.matchIndex - b.matchIndex);
  const r16Matches = matches.filter(m => m.stage === 'Round of 16').sort((a, b) => a.matchIndex - b.matchIndex);
  const qfMatches = matches.filter(m => m.stage === 'Quarterfinal').sort((a, b) => a.matchIndex - b.matchIndex);
  const sfMatches = matches.filter(m => m.stage === 'Semifinal').sort((a, b) => a.matchIndex - b.matchIndex);
  const finalMatch = matches.find(m => m.stage === 'Final');

  const getWinnerName = (match) => {
    if (match && match.status === 'Completed' && match.winner) {
      return match.winner.name;
    }
    return null;
  };

  const getTeamDisplay = (team, category) => {
    if (!team) return { title: 'TBD', subtitle: null };
    const isSingles = (category || '').toLowerCase().includes('singles');
    if (isSingles) {
      return { title: team.playerName || team.name || 'Unknown Player', subtitle: null };
    } else {
      let title = team.teamName || team.name || 'Unknown Team';
      let subtitle = null;
      if (team.player1 && team.player2) {
        subtitle = `${team.player1} / ${team.player2}`;
      } else if (team.players && team.players.length === 2) {
        subtitle = `${team.players[0]} / ${team.players[1]}`;
      }
      return { title: subtitle || title, subtitle: null };
    }
  };

  const renderTeam = (team, score, isWinner, isCompleted, category) => {
    const display = getTeamDisplay(team, category);
    return (
      <div style={{
        ...styles.team,
        backgroundColor: isWinner ? 'rgba(163, 230, 53, 0.08)' : 'transparent',
        borderLeft: isWinner ? '3px solid var(--color-primary)' : '3px solid transparent'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            ...styles.teamName,
            fontWeight: isWinner ? 700 : 400,
            color: team ? 'var(--text-main)' : 'var(--text-dark)',
            fontSize: display.title && display.title.includes('/') ? '0.75rem' : '0.85rem'
          }}>
            {display.title}
          </span>
        </div>
        {isCompleted && (
          <span style={{
            ...styles.score,
            color: isWinner ? 'var(--color-primary)' : 'var(--text-muted)',
            fontWeight: 700
          }}>
            {score}
          </span>
        )}
      </div>
    );
  };

  const renderBracketMatch = (match, label) => {
    if (!match) {
      return (
        <div style={styles.matchNode}>
          <div style={styles.matchMeta}>TBD</div>
          <div style={styles.teamsContainer}>
            <div style={styles.team}>
              <span style={{ ...styles.teamName, color: 'var(--text-dark)' }}>TBD</span>
            </div>
            <div style={styles.team}>
              <span style={{ ...styles.teamName, color: 'var(--text-dark)' }}>TBD</span>
            </div>
          </div>
        </div>
      );
    }

    const isCompleted = match.status === 'Completed';
    // Count won games for final bracket score representation
    let gamesA = 0;
    let gamesB = 0;
    if (isCompleted && match.games) {
      match.games.forEach(g => {
        if (g.scoreA > g.scoreB) gamesA++;
        else if (g.scoreB > g.scoreA) gamesB++;
      });
    }

    const isWinnerA = isCompleted && match.winner?._id === match.teamA?._id;
    const isWinnerB = isCompleted && match.winner?._id === match.teamB?._id;

    return (
      <div style={styles.matchNode}>
        <div style={styles.matchMeta}>
          <span>Match {match.matchIndex + 1}</span>
          {match.courtNumber && <span style={styles.metaCourt}> • Court {match.courtNumber}</span>}
        </div>
        <div style={styles.teamsContainer}>
          {renderTeam(match.teamA, gamesA, isWinnerA, isCompleted, match.category)}
          <div style={styles.divider}></div>
          {renderTeam(match.teamB, gamesB, isWinnerB, isCompleted, match.category)}
        </div>
      </div>
    );
  };

  const hasR64 = r64Matches.length > 0;
  const hasR32 = r32Matches.length > 0;
  const hasR16 = r16Matches.length > 0;
  const hasQF = qfMatches.length > 0;
  const hasSF = sfMatches.length > 0;
  const champion = finalMatch && finalMatch.status === 'Completed' ? finalMatch.winner : null;

  const getChampionDisplay = (champion) => {
    if (!champion) return null;
    const cat = champion.category || '';
    const isSingles = cat.toLowerCase().includes('singles');
    if (isSingles) {
      return { name: champion.playerName || champion.name, players: null };
    } else {
      let playersStr = '';
      if (champion.player1 && champion.player2) {
        playersStr = `${champion.player1} & ${champion.player2}`;
      } else if (champion.players && champion.players.length > 0) {
        playersStr = champion.players.join(' & ');
      }
      return { name: champion.teamName || champion.name, players: playersStr };
    }
  };
  const champDisplay = getChampionDisplay(champion);

  return (
    <div style={styles.wrapper}>
      <div style={styles.bracketContainer}>
        {/* Round of 64 */}
        {hasR64 && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Round of 64</h4>
            <div style={styles.roundNodes}>
              {r64Matches.map((m) => renderBracketMatch(m))}
            </div>
          </div>
        )}

        {/* Round of 32 */}
        {hasR32 && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Round of 32</h4>
            <div style={styles.roundNodes}>
              {r32Matches.map((m) => renderBracketMatch(m))}
            </div>
          </div>
        )}

        {/* Round of 16 */}
        {hasR16 && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Round of 16</h4>
            <div style={styles.roundNodes}>
              {r16Matches.map((m) => renderBracketMatch(m))}
            </div>
          </div>
        )}

        {/* Quarterfinals */}
        {hasQF && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Quarterfinals</h4>
            <div style={styles.roundNodes}>
              {qfMatches.map((m) => renderBracketMatch(m))}
            </div>
          </div>
        )}

        {/* Semifinals */}
        {hasSF && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Semifinals</h4>
            <div style={styles.roundNodes}>
              {/* If we have QF, Semifinals need custom vertical alignment / spacing */}
              {sfMatches.map((m) => renderBracketMatch(m))}
            </div>
          </div>
        )}

        {/* Finals */}
        {finalMatch && (
          <div style={styles.roundColumn}>
            <h4 style={styles.roundTitle}>Finals</h4>
            <div style={styles.roundNodes}>
              {renderBracketMatch(finalMatch)}
            </div>
          </div>
        )}

        {/* Champion */}
        <div style={styles.roundColumn}>
          <h4 style={styles.roundTitle}>Champion</h4>
          <div style={styles.championContainer}>
            {champion && champDisplay ? (
              <div className="glass-card animate-fade-in" style={styles.championCard}>
                <Trophy size={48} color="var(--color-primary)" style={styles.championTrophy} />
                <span style={styles.championLabel}>Tournament Winner</span>
                <h3 style={styles.championName}>{champDisplay.name}</h3>
                {champDisplay.players && (
                  <span style={styles.championPlayers}>{champDisplay.players}</span>
                )}
              </div>
            ) : (
              <div style={styles.tbdChampion}>
                <HelpCircle size={40} color="var(--text-dark)" />
                <span style={{ color: 'var(--text-dark)', fontWeight: 600, fontSize: '0.9rem' }}>TBD</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    width: '100%',
    overflowX: 'auto',
    padding: '2rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
  },
  bracketContainer: {
    display: 'flex',
    minWidth: '780px',
    justifyContent: 'space-between',
    gap: '2.5rem',
  },
  roundColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '1.5rem',
  },
  roundTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    textAlign: 'center',
  },
  roundNodes: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    flexGrow: 1,
    gap: '2rem',
  },
  matchNode: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  matchMeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '0.25rem 0.75rem',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
  },
  metaCourt: {
    color: 'var(--color-accent)',
  },
  teamsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  team: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    height: '36px',
  },
  teamName: {
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '130px',
  },
  score: {
    fontSize: '0.85rem',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  championContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  championCard: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1.5rem',
    border: '2px solid var(--color-primary)',
    boxShadow: '0 10px 30px -10px rgba(163, 230, 53, 0.15), var(--shadow-neon)',
    borderRadius: '16px',
  },
  championTrophy: {
    marginBottom: '1rem',
    filter: 'drop-shadow(0 0 8px rgba(163, 230, 53, 0.4))',
  },
  championLabel: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  championName: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
  },
  championPlayers: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  tbdChampion: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    border: '2px dashed var(--border-color)',
    padding: '2.5rem 2rem',
    borderRadius: '16px',
  },
};

export default BracketView;
