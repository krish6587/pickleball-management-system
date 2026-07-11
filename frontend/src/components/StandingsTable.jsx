import React from 'react';
import { Award } from 'lucide-react';

const StandingsTable = ({ standings, groupName, category }) => {
  if (!standings || standings.length === 0) {
    return <div style={styles.empty}>No standings available yet.</div>;
  }

  const isSingles = (category || '').toLowerCase().includes('singles');

  return (
    <div className="glass-card" style={styles.container}>
      <h3 style={styles.header}>
        <Award size={20} color="var(--color-primary)" />
        <span>{groupName} - Standings</span>
      </h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thRank}>Rank</th>
              <th style={styles.thTeam}>{isSingles ? 'Player Name' : 'Team Name'}</th>
              {!isSingles && <th style={styles.thTeam}>Player 1</th>}
              {!isSingles && <th style={styles.thTeam}>Player 2</th>}
              <th style={styles.th}>Played</th>
              <th style={styles.th}>Wins</th>
              <th style={styles.th}>Losses</th>
              <th style={styles.th}>Points</th>
              <th style={styles.th}>Rally Points</th>
              <th style={styles.th}>Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, idx) => {
              const team = row.teamId || {};
              const teamName = team.teamName || team.name || 'Unknown Team';
              const playerName = team.playerName || team.name || 'Unknown Player';
              
              const p1 = team.player1 || (team.players && team.players[0]) || '';
              const p2 = team.player2 || (team.players && team.players[1]) || '';

              return (
                <tr key={row._id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.tdRank}>
                    <span style={getRankBadgeStyle(row.rank)}>
                      {row.rank}
                    </span>
                  </td>
                  <td style={styles.tdTeam}>
                    <div style={styles.teamCol}>
                      <span style={styles.teamName}>{isSingles ? playerName : teamName}</span>
                    </div>
                  </td>
                  {!isSingles && <td style={styles.tdTeam}><span style={styles.players}>{p1}</span></td>}
                  {!isSingles && <td style={styles.tdTeam}><span style={styles.players}>{p2}</span></td>}
                  <td style={styles.td}>{row.played}</td>
                  <td style={{ ...styles.td, color: 'var(--success)', fontWeight: 600 }}>{row.wins}</td>
                  <td style={{ ...styles.td, color: 'var(--danger)', fontWeight: 600 }}>{row.losses}</td>
                  <td style={{ ...styles.td, color: 'var(--color-accent)', fontWeight: 700 }}>{row.points}</td>
                  <td style={styles.td}>{row.pointsFor} - {row.pointsAgainst}</td>
                  <td style={{
                    ...styles.td,
                    color: row.pointDifference > 0 ? 'var(--success)' : row.pointDifference < 0 ? 'var(--danger)' : 'var(--text-main)',
                    fontWeight: 600
                  }}>
                    {row.pointDifference > 0 ? `+${row.pointDifference}` : row.pointDifference}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getRankBadgeStyle = (rank) => {
  const base = {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  };
  
  if (rank === 1) {
    return { ...base, backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: '1px solid #eab308' };
  } else if (rank === 2) {
    return { ...base, backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid #cbd5e1' };
  }
  return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' };
};

const styles = {
  container: {
    padding: '1.5rem',
    borderRadius: '16px',
    marginBottom: '2rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '1rem',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRank: {
    padding: '0.75rem 1rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    width: '60px',
  },
  thTeam: {
    padding: '0.75rem 1rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
  },
  th: {
    padding: '0.75rem 1rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tdRank: {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle',
  },
  tdTeam: {
    padding: '0.75rem 1rem',
    verticalAlign: 'middle',
  },
  td: {
    padding: '0.75rem 1rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    verticalAlign: 'middle',
  },
  trEven: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  trOdd: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  teamCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  teamName: {
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  players: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
};

export default StandingsTable;
