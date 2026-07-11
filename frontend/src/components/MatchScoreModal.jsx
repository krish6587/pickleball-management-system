import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Award, RotateCcw, ShieldAlert, Check, Trophy,
  Clock, Zap, ArrowLeftRight, AlertCircle, ChevronRight,
  Users, User, Play, SkipForward, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   SCORING LOGIC UTILITIES (Pure functions)
───────────────────────────────────────────── */

const isDoubles = (stage) =>
  stage === 'Doubles' || stage === 'Mixed Doubles';

/** Determine which player is on Right/Left side based on score parity */
const getPositions = (scoreA, scoreB, p1A, p2A, p1B, p2B) => {
  const aRight = scoreA % 2 === 0 ? p1A : p2A;
  const aLeft  = scoreA % 2 === 0 ? p2A : p1A;
  const bRight = scoreB % 2 === 0 ? p1B : p2B;
  const bLeft  = scoreB % 2 === 0 ? p2B : p1B;
  return { aRight, aLeft, bRight, bLeft };
};

/** Given current state, compute who is serving and who is receiving */
const computeServerReceiver = (games, gameIdx, servingTeam, serverNum, p1A, p2A, p1B, p2B) => {
  const { scoreA, scoreB } = games[gameIdx];
  const { aRight, aLeft, bRight, bLeft } = getPositions(scoreA, scoreB, p1A, p2A, p1B, p2B);

  let serverName, serverSide, receiverName, receiverSide;

  if (servingTeam === 'A') {
    // In doubles: server 1 = right side player
    if (isDoubles) {
      serverName = serverNum === 1 ? aRight : aLeft;
      serverSide = serverNum === 1 ? 'Right' : 'Left';
    } else {
      serverName = p1A;
      serverSide = scoreA % 2 === 0 ? 'Right' : 'Left';
    }
    // Receiver is diagonally opposite
    receiverName = serverSide === 'Right' ? bRight : bLeft;
    receiverSide = serverSide === 'Right' ? 'Right' : 'Left';
  } else {
    if (isDoubles) {
      serverName = serverNum === 1 ? bRight : bLeft;
      serverSide = serverNum === 1 ? 'Right' : 'Left';
    } else {
      serverName = p1B;
      serverSide = scoreB % 2 === 0 ? 'Right' : 'Left';
    }
    receiverName = serverSide === 'Right' ? aRight : aLeft;
    receiverSide = serverSide === 'Right' ? 'Right' : 'Left';
  }

  return { serverName, serverSide, receiverName, receiverSide };
};

/** Check if a game score meets win condition (win score + win by 2) */
const checkGameWinner = (scoreA, scoreB, winScore) => {
  const minLead = 2;
  if (scoreA >= winScore && scoreA - scoreB >= minLead) return 'A';
  if (scoreB >= winScore && scoreB - scoreA >= minLead) return 'A' !== 'A' ? 'A' : 
    (scoreB >= winScore && scoreB - scoreA >= minLead ? 'B' : null);
  if (scoreA >= winScore && scoreA - scoreB >= minLead) return 'A';
  if (scoreB >= winScore && scoreB - scoreA >= minLead) return 'B';
  return null;
};

/** Count game wins */
const countWins = (games, winScore) => {
  let wA = 0, wB = 0;
  games.forEach(g => {
    const w = checkGameWinner(g.scoreA, g.scoreB, winScore);
    if (w === 'A') wA++;
    else if (w === 'B') wB++;
  });
  return { wA, wB };
};

/* ─────────────────────────────────────────────
   PLAYER CARD — click-to-serve, editable name
───────────────────────────────────────────── */
const PlayerCard = ({ name, side, isServer, isReceiver, onNameChange, onSelectServer, disabled, placeholder, isDoubles }) => {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef(null);

  const handleCardClick = () => {
    if (disabled) return;
    if (!editing && isDoubles && onSelectServer) {
      onSelectServer();
    }
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    if (!disabled) setEditing(true);
  };

  React.useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const stateColor = isServer ? '#00f0ff' : isReceiver ? '#f59e0b' : '#595e70';

  return (
    <div
      role={isDoubles && !disabled ? 'button' : undefined}
      onClick={handleCardClick}
      style={{
        ...pStyles.playerCard,
        ...(isServer ? pStyles.serverGlow : {}),
        ...(isReceiver ? pStyles.receiverGlow : {}),
        cursor: isDoubles && !disabled ? 'pointer' : 'default',
      }}
    >
      {/* Position pill — LEFT side */}
      <div style={{ ...pStyles.positionPill, borderColor: stateColor + '55', color: stateColor }}>
        {side || '—'}
      </div>

      {/* Name — click to edit */}
      <div style={pStyles.playerMid}>
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={e => onNameChange && onNameChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            onClick={e => e.stopPropagation()}
            placeholder={placeholder}
            style={pStyles.nameInput}
          />
        ) : (
          <span
            onClick={handleNameClick}
            style={{
              ...pStyles.playerName,
              color: isServer ? '#00f0ff' : isReceiver ? '#f59e0b' : '#c5c9d6',
              fontWeight: (isServer || isReceiver) ? 700 : 500,
            }}
            title="Click name to edit"
          >
            {name || <span style={{ color: '#595e70', fontStyle: 'italic' }}>{placeholder}</span>}
          </span>
        )}
        {isDoubles && !disabled && (
          <span style={pStyles.tapHint}>tap to serve</span>
        )}
      </div>

      {/* Badges — RIGHT side */}
      <div style={pStyles.badges}>
        {isServer && (
          <span style={pStyles.serverBadge}><Zap size={10} /> SERVER</span>
        )}
        {isReceiver && (
          <span style={pStyles.receiverBadge}><ChevronRight size={10} /> RECV</span>
        )}
      </div>
    </div>
  );
};

const pStyles = {
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #1b2138',
    background: '#0e111f',
    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
    minHeight: '48px',
    userSelect: 'none',
  },
  serverGlow: {
    border: '1px solid rgba(0,240,255,0.55)',
    background: 'rgba(0,240,255,0.07)',
    boxShadow: '0 0 18px rgba(0,240,255,0.2), inset 0 0 12px rgba(0,240,255,0.04)',
  },
  receiverGlow: {
    border: '1px solid rgba(245,158,11,0.55)',
    background: 'rgba(245,158,11,0.07)',
    boxShadow: '0 0 18px rgba(245,158,11,0.2), inset 0 0 12px rgba(245,158,11,0.04)',
  },
  positionPill: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
    flexShrink: 0,
    width: '32px',
    textAlign: 'center',
  },
  playerMid: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  playerName: {
    fontSize: '13px',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },
  tapHint: {
    fontSize: '9px',
    color: '#595e70',
    letterSpacing: '0.04em',
  },
  nameInput: {
    width: '100%',
    background: '#161b2e',
    border: '1px solid rgba(0,240,255,0.3)',
    borderRadius: '5px',
    padding: '3px 7px',
    color: '#c5c9d6',
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  serverBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#00f0ff',
    background: 'rgba(0,240,255,0.12)',
    border: '1px solid rgba(0,240,255,0.3)',
    borderRadius: '4px',
    padding: '2px 5px',
  },
  receiverBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#f59e0b',
    background: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '4px',
    padding: '2px 5px',
  },
};

/* ─────────────────────────────────────────────
   MATCH SUMMARY POPUP
───────────────────────────────────────────── */
const MatchSummary = ({ match, games, winScore, teamAWins, teamBWins, timerSecs, onClose, onNewMatch }) => {
  const winner = teamAWins > teamBWins ? match.teamA?.name : match.teamB?.name;
  const totalPoints = games.reduce((s, g) => s + g.scoreA + g.scoreB, 0);
  const mins = Math.floor(timerSecs / 60);
  const secs = timerSecs % 60;
  return (
    <div style={sumStyles.overlay}>
      <div style={sumStyles.card}>
        <div style={sumStyles.trophy}><Trophy size={40} style={{ color: '#f59e0b' }} /></div>
        <div style={sumStyles.winnerLabel}>MATCH WINNER</div>
        <div style={sumStyles.winnerName}>{winner}</div>
        <div style={sumStyles.scoreRow}>
          {games.map((g, i) => (
            <div key={i} style={sumStyles.gameScore}>
              <div style={sumStyles.gameNum}>G{i + 1}</div>
              <div style={sumStyles.gameScoreVal}>{g.scoreA}–{g.scoreB}</div>
            </div>
          ))}
        </div>
        <div style={sumStyles.statsRow}>
          <div style={sumStyles.stat}>
            <div style={sumStyles.statVal}>{mins}:{String(secs).padStart(2,'0')}</div>
            <div style={sumStyles.statLabel}>Duration</div>
          </div>
          <div style={sumStyles.stat}>
            <div style={sumStyles.statVal}>{totalPoints}</div>
            <div style={sumStyles.statLabel}>Total Points</div>
          </div>
          <div style={sumStyles.stat}>
            <div style={sumStyles.statVal}>{teamAWins}–{teamBWins}</div>
            <div style={sumStyles.statLabel}>Games Won</div>
          </div>
        </div>
        <div style={sumStyles.actions}>
          <button onClick={onClose} style={sumStyles.closeBtn}>Close</button>
        </div>
      </div>
    </div>
  );
};

const sumStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(6,8,20,0.92)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  card: {
    background: 'linear-gradient(145deg, #0e111f 0%, #161b2e 100%)',
    border: '1px solid rgba(0,240,255,0.25)',
    boxShadow: '0 0 60px rgba(0,240,255,0.12), 0 30px 60px rgba(0,0,0,0.5)',
    borderRadius: '20px',
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: '380px',
    width: '90%',
  },
  trophy: { marginBottom: '12px' },
  winnerLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#595e70',
    marginBottom: '8px',
    textTransform: 'uppercase',
    fontFamily: "'Outfit', sans-serif",
  },
  winnerName: {
    fontSize: '28px',
    fontWeight: 900,
    color: '#ffffff',
    fontFamily: "'Outfit', sans-serif",
    marginBottom: '24px',
    background: 'linear-gradient(135deg, #00f0ff, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  scoreRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  gameScore: {
    background: '#0e111f',
    border: '1px solid #1b2138',
    borderRadius: '10px',
    padding: '10px 16px',
    minWidth: '64px',
  },
  gameNum: { fontSize: '10px', color: '#595e70', fontWeight: 600, marginBottom: '4px' },
  gameScoreVal: { fontSize: '16px', fontWeight: 700, color: '#c5c9d6', fontFamily: "'Outfit', sans-serif" },
  statsRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  stat: {
    flex: 1,
    background: '#0e111f',
    border: '1px solid #1b2138',
    borderRadius: '10px',
    padding: '12px 8px',
  },
  statVal: { fontSize: '18px', fontWeight: 700, color: '#ffffff', fontFamily: "'Outfit', sans-serif" },
  statLabel: { fontSize: '10px', color: '#595e70', marginTop: '4px', fontWeight: 500 },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center' },
  closeBtn: {
    padding: '10px 28px',
    borderRadius: '8px',
    border: '1px solid rgba(0,240,255,0.3)',
    background: 'rgba(0,240,255,0.08)',
    color: '#00f0ff',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const MatchScoreModal = ({ match, onClose, onSubmit }) => {
  const { token, API_URL } = useAuth();

  /* ── Mode ── */
  const [scorerMode, setScorerMode] = useState('simple');

  /* ── Game scores (3 games) ── */
  const [games, setGames] = useState([
    { scoreA: 0, scoreB: 0 },
    { scoreA: 0, scoreB: 0 },
    { scoreA: 0, scoreB: 0 },
  ]);

  /* ── Live scorer state ── */
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [servingTeam, setServingTeam] = useState('A');
  const [serverNumber, setServerNumber] = useState(1);

  const [p1A, setP1A] = useState(''); // Team A player 1 (Even)
  const [p2A, setP2A] = useState(''); // Team A player 2 (Odd)
  const [p1B, setP1B] = useState(''); // Team B player 1 (Even)
  const [p2B, setP2B] = useState(''); // Team B player 2 (Odd)

  /* ── Win score configuration ── */
  const [winScore, setWinScore] = useState(11);

  /* ── Timeouts (2 per team) ── */
  const [timeoutsA, setTimeoutsA] = useState([false, false]);
  const [timeoutsB, setTimeoutsB] = useState([false, false]);

  /* ── Match timer ── */
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  /* ── Rally counter ── */
  const [rally, setRally] = useState(0);

  /* ── UI state ── */
  const [submitting, setSubmitting] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [scoreAnim, setScoreAnim] = useState({ A: false, B: false });

  /* ────────────────────────────
     Derived state
  ──────────────────────────── */
  const doubles = match ? isDoubles(match.stage) : false;
  const { scoreA: curA, scoreB: curB } = games[currentGameIndex] || { scoreA: 0, scoreB: 0 };
  const { aRight, aLeft, bRight, bLeft } = getPositions(curA, curB, p1A, p2A, p1B, p2B);
  const { wA, wB } = countWins(games, winScore);

  /* Compute server & receiver */
  const getServerReceiver = useCallback(() => {
    if (!doubles) {
      // Singles
      const sName = servingTeam === 'A' ? (p1A || 'Player A') : (p1B || 'Player B');
      const rName = servingTeam === 'A' ? (p1B || 'Player B') : (p1A || 'Player A');
      const sScore = servingTeam === 'A' ? curA : curB;
      const sSide = sScore % 2 === 0 ? 'Right' : 'Left';
      return { serverName: sName, receiverName: rName, serverSide: sSide, receiverSide: sSide };
    }
    // Doubles
    let serverName, serverSide;
    if (servingTeam === 'A') {
      serverName = serverNumber === 1 ? aRight : aLeft;
      serverSide = serverNumber === 1 ? 'Right' : 'Left';
    } else {
      serverName = serverNumber === 1 ? bRight : bLeft;
      serverSide = serverNumber === 1 ? 'Right' : 'Left';
    }
    const receiverName = serverSide === 'Right'
      ? (servingTeam === 'A' ? bRight : aRight)
      : (servingTeam === 'A' ? bLeft : aLeft);
    const receiverSide = serverSide;
    return { serverName, receiverName, serverSide, receiverSide };
  }, [doubles, servingTeam, serverNumber, curA, curB, p1A, p2A, p1B, p2B, aRight, aLeft, bRight, bLeft]);

  const { serverName, receiverName, serverSide, receiverSide } = getServerReceiver();

  /* ────────────────────────────
     Timer
  ──────────────────────────── */
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  /* ────────────────────────────
     Sync match state from API
  ──────────────────────────── */
  const syncMatchState = useCallback((m) => {
    if (!m) return;
    if (m.games && m.games.length > 0) {
      const initialized = [0, 1, 2].map(idx => {
        const existing = m.games[idx];
        return { scoreA: existing?.scoreA ?? 0, scoreB: existing?.scoreB ?? 0 };
      });
      setGames(initialized);
      setCurrentGameIndex(m.currentGameIndex || 0);
      setServingTeam(m.servingTeam || 'A');
      setServerNumber(m.serverNumber || 1);
    }

    const pa1 = m.teamA_EvenPlayer || m.teamA?.player1 || m.teamA?.name || 'Player A1';
    const pa2 = m.teamA_OddPlayer  || m.teamA?.player2 || 'Player A2';
    const pb1 = m.teamB_EvenPlayer || m.teamB?.player1 || m.teamB?.name || 'Player B1';
    const pb2 = m.teamB_OddPlayer  || m.teamB?.player2 || 'Player B2';

    setP1A(pa1); setP2A(pa2); setP1B(pb1); setP2B(pb2);

    if (m.status === 'Completed') {
      setMatchEnded(true);
      setTimerRunning(false);
    }
  }, []);

  useEffect(() => {
    if (match) syncMatchState(match);
  }, [match, syncMatchState]);

  if (!match) return null;

  /* ────────────────────────────
     Score change (simple mode)
  ──────────────────────────── */
  const handleScoreChange = (gameIndex, teamKey, value) => {
    const nextGames = [...games];
    nextGames[gameIndex] = { ...nextGames[gameIndex], [teamKey]: Math.max(0, parseInt(value, 10) || 0) };
    setGames(nextGames);
  };

  /* ────────────────────────────
     Build save-point payload
  ──────────────────────────── */
  const buildPayload = (nextGames, nextServingTeam, nextServerNumber) => {
    const { serverName: nServer, receiverName: nReceiver, serverSide: nSS, receiverSide: nRS } =
      computeServerReceiver(nextGames, currentGameIndex, nextServingTeam, nextServerNumber, p1A, p2A, p1B, p2B);
    return {
      games: nextGames,
      currentGameIndex,
      servingTeam: nextServingTeam,
      serverNumber: nextServerNumber,
      currentServerName: nServer,
      currentReceiverName: nReceiver,
      serverSide: nSS,
      receiverSide: nRS,
      teamA_EvenPlayer: p1A,
      teamA_OddPlayer: p2A,
      teamB_EvenPlayer: p1B,
      teamB_OddPlayer: p2B,
    };
  };

  const callSavePoint = async (payload) => {
    const res = await fetch(`${API_URL}/matches/${match._id}/save-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save point');
    return data;
  };

  /* ────────────────────────────
     Score animation trigger
  ──────────────────────────── */
  const triggerScoreAnim = (team) => {
    setScoreAnim(prev => ({ ...prev, [team]: true }));
    setTimeout(() => setScoreAnim(prev => ({ ...prev, [team]: false })), 350);
  };

  /* ────────────────────────────
     ADD POINT
  ──────────────────────────── */
  const handleAddPoint = async (team) => {
    if (matchEnded || match.status === 'Completed') return;
    setError('');

    if (!timerRunning) setTimerRunning(true);

    const nextGames = games.map((g, i) =>
      i === currentGameIndex
        ? { ...g, scoreA: team === 'A' ? g.scoreA + 1 : g.scoreA, scoreB: team === 'B' ? g.scoreB + 1 : g.scoreB }
        : g
    );

    triggerScoreAnim(team);
    setRally(r => r + 1);

    // Pickleball serving rules after point
    let nextServingTeam = servingTeam;
    let nextServerNumber = serverNumber;

    if (team === servingTeam) {
      // Serving team wins → keep server, no rotation
    } else {
      // Receiving team wins → side out
      if (doubles) {
        if (serverNumber === 1) {
          nextServerNumber = 2;
        } else {
          nextServingTeam = servingTeam === 'A' ? 'B' : 'A';
          nextServerNumber = 1;
        }
      } else {
        nextServingTeam = servingTeam === 'A' ? 'B' : 'A';
        nextServerNumber = 1;
      }
    }

    // Check game winner
    const { scoreA: nA, scoreB: nB } = nextGames[currentGameIndex];
    const gameWinner = checkGameWinner(nA, nB, winScore);
    const newCounts = countWins(nextGames, winScore);
    const matchOver = newCounts.wA >= 2 || newCounts.wB >= 2;

    if (matchOver) {
      setMatchEnded(true);
      setTimerRunning(false);
    }

    try {
      const payload = buildPayload(nextGames, nextServingTeam, nextServerNumber);
      const data = await callSavePoint(payload);
      syncMatchState(data);
      if (matchOver) {
        setTimeout(() => setShowSummary(true), 600);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     SIDE OUT (manual)
  ──────────────────────────── */
  const handleSideOut = async () => {
    if (matchEnded || match.status === 'Completed') return;
    setError('');

    let nextServingTeam = servingTeam;
    let nextServerNumber = serverNumber;

    if (doubles) {
      if (serverNumber === 1) {
        nextServerNumber = 2;
      } else {
        nextServingTeam = servingTeam === 'A' ? 'B' : 'A';
        nextServerNumber = 1;
      }
    } else {
      nextServingTeam = servingTeam === 'A' ? 'B' : 'A';
      nextServerNumber = 1;
    }

    try {
      const payload = buildPayload([...games], nextServingTeam, nextServerNumber);
      const data = await callSavePoint(payload);
      syncMatchState(data);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     SERVER ROTATION (doubles)
  ──────────────────────────── */
  const handleServerRotation = async () => {
    if (!doubles || matchEnded || match.status === 'Completed') return;
    setError('');

    const nextServerNumber = serverNumber === 1 ? 2 : 1;
    try {
      const payload = buildPayload([...games], servingTeam, nextServerNumber);
      const data = await callSavePoint(payload);
      syncMatchState(data);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     UNDO LAST POINT
  ──────────────────────────── */
  const handleUndoPoint = async () => {
    setError('');
    setUndoLoading(true);
    try {
      const res = await fetch(`${API_URL}/matches/${match._id}/undo-point`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to undo point');
      syncMatchState(data);
      setMatchEnded(false);
      setRally(r => Math.max(0, r - 1));
    } catch (err) {
      setError(err.message);
    } finally {
      setUndoLoading(false);
    }
  };

  /* ────────────────────────────
     NEXT GAME
  ──────────────────────────── */
  const handleNextGame = async () => {
    if (currentGameIndex >= 2) return;
    const nextIdx = currentGameIndex + 1;
    setCurrentGameIndex(nextIdx);
    setRally(0);
    try {
      const payload = buildPayload([...games], servingTeam, serverNumber);
      payload.currentGameIndex = nextIdx;
      await callSavePoint(payload);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     RESET GAME
  ──────────────────────────── */
  const handleReset = async () => {
    if (!window.confirm('Reset current game score to 0–0?')) return;
    setError('');

    const nextGames = [...games];
    nextGames[currentGameIndex] = { scoreA: 0, scoreB: 0 };
    setTimeoutsA([false, false]);
    setTimeoutsB([false, false]);
    setRally(0);

    try {
      const payload = buildPayload(nextGames, 'A', 1);
      const data = await callSavePoint(payload);
      syncMatchState(data);
      setMatchEnded(false);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     SELECT SERVER BY TAP
  ──────────────────────────── */
  const handleSelectServer = async (team, playerName) => {
    if (matchEnded || match.status === 'Completed') return;
    setError('');

    // Determine serverNumber from the player's current position
    // Right-side player = Server 1, Left-side player = Server 2
    const rightA = curA % 2 === 0 ? p1A : p2A;
    const rightB = curB % 2 === 0 ? p1B : p2B;
    const isRightSide = team === 'A' ? (playerName === rightA) : (playerName === rightB);
    const nextServerNumber = isRightSide ? 1 : 2;

    try {
      const payload = buildPayload([...games], team, nextServerNumber);
      const data = await callSavePoint(payload);
      syncMatchState(data);
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     DISPUTE MATCH
  ──────────────────────────── */
  const handleDisputeMatch = async () => {
    if (!window.confirm('Mark this match as Disputed for Admin review?')) return;
    setError('');
    try {
      const res = await fetch(`${API_URL}/matches/${match._id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to dispute match');
      alert('Match marked as Disputed.');
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ────────────────────────────
     SUBMIT SCORE (simple mode)
  ──────────────────────────── */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(match._id, games);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────────────────
     Winner preview
  ──────────────────────────── */
  const getWinnerPreview = () => {
    if (wA > wB) return match.teamA?.name || 'Team A';
    if (wB > wA) return match.teamB?.name || 'Team B';
    return 'Tie';
  };

  /* ────────────────────────────
     Timer display
  ──────────────────────────── */
  const timerDisplay = () => {
    const m = Math.floor(timerSecs / 60);
    const s = timerSecs % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  /* ────────────────────────────
     Game winner banner
  ──────────────────────────── */
  const curGameWinner = checkGameWinner(curA, curB, winScore);

  return (
    <>
      {showSummary && (
        <MatchSummary
          match={match}
          games={games}
          winScore={winScore}
          teamAWins={wA}
          teamBWins={wB}
          timerSecs={timerSecs}
          onClose={() => { setShowSummary(false); onClose(); }}
          onNewMatch={() => { setShowSummary(false); onClose(); }}
        />
      )}

      <div style={s.backdrop}>
        <div style={s.modal}>
          {/* ── Header ── */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <Trophy size={18} style={{ color: '#f59e0b' }} />
              <span style={s.headerTitle}>Pickleball Scorekeeper</span>
              <span style={s.matchBadge}>
                {match.stage || 'Match'} {match.matchIndex ? `#${match.matchIndex}` : ''}
              </span>
            </div>
            <button onClick={onClose} style={s.closeBtn}><X size={18} /></button>
          </div>

          {/* ── Mode Tabs ── */}
          <div style={s.tabs}>
            {['simple', 'live'].map(mode => (
              <button
                key={mode}
                onClick={() => setScorerMode(mode)}
                style={{ ...s.tab, ...(scorerMode === mode ? s.tabActive : {}) }}
              >
                {mode === 'simple' ? 'Manual Sheet' : '⚡ Live Scorer'}
              </button>
            ))}
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div style={s.errorBar}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* ════════════════════════════════════
              SIMPLE MODE
          ════════════════════════════════════ */}
          {scorerMode === 'simple' && (
            <form onSubmit={handleSubmit} style={s.form}>
              {/* Team vs header */}
              <div style={s.matchTeams}>
                <div style={s.teamCol}>
                  <span style={s.teamLabel}>Team A</span>
                  <span style={{ ...s.teamName, color: servingTeam === 'A' ? 'var(--primary)' : 'var(--ink)' }}>
                    {match.teamA?.name}
                  </span>
                </div>
                <span style={s.vs}>VS</span>
                <div style={s.teamCol}>
                  <span style={s.teamLabel}>Team B</span>
                  <span style={{ ...s.teamName, color: servingTeam === 'B' ? 'var(--primary)' : 'var(--ink)' }}>
                    {match.teamB?.name}
                  </span>
                </div>
              </div>

              <div style={s.scoresGrid}>
                <div style={s.gridHeader}>
                  <span>Game</span>
                  <span>{match.teamA?.name}</span>
                  <span>{match.teamB?.name}</span>
                </div>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} style={s.gameRow}>
                    <span style={s.gameLabel}>Game {idx + 1}</span>
                    <input type="number" min="0" value={games[idx].scoreA}
                      onChange={(e) => handleScoreChange(idx, 'scoreA', e.target.value)}
                      className="text-input" style={s.scoreInput} required />
                    <input type="number" min="0" value={games[idx].scoreB}
                      onChange={(e) => handleScoreChange(idx, 'scoreB', e.target.value)}
                      className="text-input" style={s.scoreInput} required />
                  </div>
                ))}
              </div>

              <div style={s.previewContainer}>
                <Award size={16} color="var(--primary)" />
                <span>Winner Preview: <strong style={{ color: 'var(--primary)' }}>{getWinnerPreview()}</strong></span>
              </div>

              <div style={s.simpleActions}>
                <button type="button" onClick={handleDisputeMatch} className="secondary-btn"
                  style={{ borderColor: '#ef4444', color: '#ef4444', marginRight: 'auto' }}>
                  <ShieldAlert size={15} /> Dispute
                </button>
                <button type="button" onClick={onClose} className="secondary-btn" disabled={submitting}>Cancel</button>
                <button type="submit" className="neon-btn" style={{ color: '#060814' }} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Submit Score'}
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════════
              LIVE SCORER
          ════════════════════════════════════ */}
          {scorerMode === 'live' && (
            <div style={s.liveWrapper}>

              {/* ── Info Bar ── */}
              <div style={s.infoBar}>
                <div style={s.infoItem}>
                  <Clock size={12} style={{ color: '#595e70' }} />
                  <span style={{ ...s.infoVal, color: timerRunning ? '#00f0ff' : '#595e70',
                    fontVariantNumeric: 'tabular-nums' }}>{timerDisplay()}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Court</span>
                  <span style={s.infoVal}>{match.courtNumber || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Rally</span>
                  <span style={s.infoVal}>{rally}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Win To</span>
                  <select value={winScore} onChange={e => setWinScore(Number(e.target.value))}
                    style={s.winScoreSelect} disabled={matchEnded}>
                    {[11, 15, 21].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Games</span>
                  <span style={s.infoVal}>{wA}–{wB}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Game</span>
                  <span style={s.infoVal}>{currentGameIndex + 1}/3</span>
                </div>
              </div>

              {/* ── Game winner banner ── */}
              {curGameWinner && !matchEnded && (
                <div style={s.gameBanner}>
                  <Trophy size={14} style={{ color: '#f59e0b' }} />
                  <span>Game {currentGameIndex + 1} won by <strong>
                    {curGameWinner === 'A' ? match.teamA?.name : match.teamB?.name}
                  </strong> — advance to next game?</span>
                  {currentGameIndex < 2 && (
                    <button onClick={handleNextGame} style={s.advanceBtn}>
                      <SkipForward size={12} /> Next Game
                    </button>
                  )}
                </div>
              )}

              {/* ── Match ended banner ── */}
              {matchEnded && (
                <div style={s.matchEndBanner}>
                  <Trophy size={14} style={{ color: '#f59e0b' }} />
                  <span>Match Over — <strong>{wA >= 2 ? match.teamA?.name : match.teamB?.name}</strong> wins!</span>
                  <button onClick={() => setShowSummary(true)} style={s.summaryBtn}>
                    View Summary
                  </button>
                </div>
              )}

              {/* ── Singles player name setup ── */}
              {!doubles && (
                <div style={s.playerSetup}>
                  <div style={s.playerSetupTitle}>
                    <User size={12} style={{ color: '#595e70' }} />
                    <span>Player Names</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input value={p1A} onChange={e => setP1A(e.target.value)}
                      placeholder={match.teamA?.name || 'Player A'}
                      style={s.playerInput} disabled={matchEnded} />
                    <input value={p1B} onChange={e => setP1B(e.target.value)}
                      placeholder={match.teamB?.name || 'Player B'}
                      style={s.playerInput} disabled={matchEnded} />
                  </div>
                </div>
              )}

              {/* ── Doubles hint ── */}
              {doubles && !matchEnded && (
                <div style={s.doublesHint}>
                  <Zap size={11} style={{ color: '#00f0ff', flexShrink: 0 }} />
                  <span>Doubles: <strong>tap a player card</strong> to select them as server. Receiver highlights automatically. Click a name to edit it.</span>
                </div>
              )}

              {/* ── Court View (Vertical Layout) ── */}
              <div style={s.vLayout}>
                {/* 1. Teams Row */}
                <div style={s.vTeamsRow}>
                  <div style={s.vTeamCol}>
                    <div style={s.vTeamName}>{match.teamA?.name || 'Team A'}</div>
                    {doubles ? (
                      <>
                        <PlayerCard
                          name={aRight} side="Right"
                          isServer={servingTeam === 'A' && serverName === aRight}
                          isReceiver={servingTeam === 'B' && receiverName === aRight}
                          onNameChange={v => setP1A(curA % 2 === 0 ? v : p2A === aRight ? p2A : v)}
                          onSelectServer={() => handleSelectServer('A', aRight)}
                          disabled={matchEnded || match.status === 'Completed'}
                          placeholder="Player A1"
                          isDoubles={true}
                        />
                        <PlayerCard
                          name={aLeft} side="Left"
                          isServer={servingTeam === 'A' && serverName === aLeft}
                          isReceiver={servingTeam === 'B' && receiverName === aLeft}
                          onNameChange={v => setP2A(curA % 2 === 0 ? v : p1A === aLeft ? p1A : v)}
                          onSelectServer={() => handleSelectServer('A', aLeft)}
                          disabled={matchEnded || match.status === 'Completed'}
                          placeholder="Player A2"
                          isDoubles={true}
                        />
                      </>
                    ) : (
                      <PlayerCard
                        name={p1A} side={serverSide}
                        isServer={servingTeam === 'A'}
                        isReceiver={servingTeam === 'B'}
                        onNameChange={v => setP1A(v)}
                        disabled={matchEnded}
                        placeholder={match.teamA?.name || 'Player A'}
                        isDoubles={false}
                      />
                    )}
                  </div>
                  <div style={s.vTeamCol}>
                    <div style={s.vTeamName}>{match.teamB?.name || 'Team B'}</div>
                    {doubles ? (
                      <>
                        <PlayerCard
                          name={bRight} side="Right"
                          isServer={servingTeam === 'B' && serverName === bRight}
                          isReceiver={servingTeam === 'A' && receiverName === bRight}
                          onNameChange={v => setP1B(curB % 2 === 0 ? v : p2B === bRight ? p2B : v)}
                          onSelectServer={() => handleSelectServer('B', bRight)}
                          disabled={matchEnded || match.status === 'Completed'}
                          placeholder="Player B1"
                          isDoubles={true}
                        />
                        <PlayerCard
                          name={bLeft} side="Left"
                          isServer={servingTeam === 'B' && serverName === bLeft}
                          isReceiver={servingTeam === 'A' && receiverName === bLeft}
                          onNameChange={v => setP2B(curB % 2 === 0 ? v : p1B === bLeft ? p1B : v)}
                          onSelectServer={() => handleSelectServer('B', bLeft)}
                          disabled={matchEnded || match.status === 'Completed'}
                          placeholder="Player B2"
                          isDoubles={true}
                        />
                      </>
                    ) : (
                      <PlayerCard
                        name={p1B} side={receiverSide}
                        isServer={servingTeam === 'B'}
                        isReceiver={servingTeam === 'A'}
                        onNameChange={v => setP1B(v)}
                        disabled={matchEnded}
                        placeholder={match.teamB?.name || 'Player B'}
                        isDoubles={false}
                      />
                    )}
                  </div>
                </div>

                {/* 2. Big Scores Row */}
                <div style={s.vScoresRow}>
                  <button
                    onClick={() => handleAddPoint('A')}
                    disabled={matchEnded || match.status === 'Completed'}
                    style={{
                      ...s.vScoreBox,
                      ...(scoreAnim.A ? s.vScoreBoxAnim : {}),
                      ...(matchEnded ? s.scoreBoxDisabled : {}),
                    }}
                  >
                    <span style={s.vScoreNum}>{curA}</span>
                  </button>
                  <button
                    onClick={() => handleAddPoint('B')}
                    disabled={matchEnded || match.status === 'Completed'}
                    style={{
                      ...s.vScoreBox,
                      ...(scoreAnim.B ? s.vScoreBoxAnim : {}),
                      ...(matchEnded ? s.scoreBoxDisabled : {}),
                    }}
                  >
                    <span style={s.vScoreNum}>{curB}</span>
                  </button>
                </div>

                {/* 3. Serving Info Row */}
                <div style={s.vServingRow}>
                  <div style={servingTeam === 'A' ? s.vServingTextActive : s.vServingTextHidden}>
                    Serving: {serverName}
                  </div>
                  <div style={servingTeam === 'B' ? s.vServingTextActive : s.vServingTextHidden}>
                    Serving: {serverName}
                  </div>
                </div>

                {/* 4. Receiving Banner */}
                <div style={s.vReceivingBanner}>
                  <span style={s.vRecvLabel}>Receiving</span>
                  <span style={s.vRecvName}>
                    {receiverName} (Team {servingTeam === 'A' ? 'B' : 'A'})
                  </span>
                </div>

                {/* 5. Action Rows (Server num, Side Out, Reset) */}
                <div style={s.vActionRowsContainer}>
                  {/* Action Row 1 */}
                  <div style={s.vActionRowItem}>
                    <div style={s.vActionBox}>
                      <span style={s.vActionVal}>{serverNumber}</span>
                    </div>
                    <span style={s.vActionLabel}>Server number</span>
                    <button onClick={handleSideOut} disabled={matchEnded || match.status === 'Completed'} style={s.vSideOutBtn}>
                      Side out
                    </button>
                  </div>
                  
                  {/* Action Row 2 */}
                  <div style={s.vActionRowItem}>
                    <div style={s.vActionBox}>
                      <span style={s.vActionVal}>0</span>
                    </div>
                    <span style={s.vActionLabel}>Score at side out</span>
                    <button onClick={handleReset} disabled={matchEnded || match.status === 'Completed'} style={s.vResetBtn}>
                      <RotateCcw size={14} /> Reset
                    </button>
                  </div>
                </div>

                {/* 6. Extra Actions Grid (Undo, Next, Dispute) */}
                <div style={s.actionsGrid}>
                  <button onClick={handleUndoPoint}
                    disabled={undoLoading || !match.pointHistory?.length}
                    style={s.actionBtn}>
                    <RotateCcw size={15} />
                    {undoLoading ? 'Undoing…' : 'Undo Point'}
                  </button>

                  {doubles && (
                    <button onClick={handleServerRotation}
                      disabled={matchEnded || match.status === 'Completed'}
                      style={s.actionBtn}>
                      <Play size={15} />
                      Rotate Server
                    </button>
                  )}

                  {currentGameIndex < 2 && (
                    <button onClick={handleNextGame}
                      disabled={matchEnded}
                      style={s.actionBtn}>
                      <SkipForward size={15} />
                      Next Game
                    </button>
                  )}

                  <button onClick={handleDisputeMatch}
                    style={{ ...s.actionBtn, ...s.actionBtnDanger }}>
                    <ShieldAlert size={15} />
                    Dispute
                  </button>
                </div>

                {/* 7. Timeouts Section */}
                <div style={s.vTimeoutsSection}>
                  <div style={s.vToTitle}>Timeouts</div>
                  <div style={s.vToRow}>
                    <div style={s.vToGroup}>
                      {timeoutsA.map((used, i) => (
                        <button key={i} onClick={() => setTimeoutsA(t => t.map((v, idx) => idx === i ? !v : v))}
                          style={{ ...s.vToBtn, ...(used ? s.vToUsed : {}) }}>
                          {used ? <Check size={12} style={{ color: '#22c55e' }} /> : ''}
                        </button>
                      ))}
                    </div>
                    <div style={s.vToGroup}>
                      {timeoutsB.map((used, i) => (
                        <button key={i} onClick={() => setTimeoutsB(t => t.map((v, idx) => idx === i ? !v : v))}
                          style={{ ...s.vToBtn, ...(used ? s.vToUsed : {}) }}>
                          {used ? <Check size={12} style={{ color: '#22c55e' }} /> : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Finish Match ── */}
              <div style={s.finishRow}>
                <button onClick={handleSubmit}
                  disabled={submitting}
                  style={s.finishBtn}>
                  <Check size={16} />
                  {submitting ? 'Saving…' : 'Finish & Save Match'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score animation keyframe injection */}
      <style>{`
        @keyframes scoreFlash {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(0,240,255,0.18); }
          50%       { box-shadow: 0 0 30px rgba(0,240,255,0.4); }
        }
      `}</style>
    </>
  );
};

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const s = {
  /* Backdrop */
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(6,8,20,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
    overflowY: 'auto',
  },
  /* Modal */
  modal: {
    width: '100%', maxWidth: '700px',
    background: '#0e111f',
    borderRadius: '18px',
    border: '1px solid #1b2138',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,240,255,0.06)',
    display: 'flex', flexDirection: 'column',
    maxHeight: '90vh', overflow: 'hidden',
  },
  /* Header */
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #1b2138',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  headerTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '16px', fontWeight: 700, color: '#ffffff',
  },
  matchBadge: {
    fontSize: '11px', fontWeight: 600,
    color: '#595e70',
    background: '#161b2e',
    border: '1px solid #1b2138',
    borderRadius: '5px',
    padding: '2px 8px',
    letterSpacing: '0.04em',
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#595e70', cursor: 'pointer', padding: '4px',
    display: 'flex', alignItems: 'center',
    borderRadius: '6px',
    transition: 'color 0.2s',
  },
  /* Tabs */
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #1b2138',
    flexShrink: 0,
  },
  tab: {
    flex: 1, padding: '12px',
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    color: '#595e70',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600, fontSize: '13px',
    cursor: 'pointer', textAlign: 'center',
    transition: 'all 0.2s',
  },
  tabActive: {
    borderBottomColor: '#00f0ff',
    color: '#00f0ff',
    background: 'rgba(0,240,255,0.04)',
  },
  /* Error */
  errorBar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    margin: '12px 20px 0',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444',
    fontSize: '13px',
    flexShrink: 0,
  },
  /* Simple mode */
  form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' },
  matchTeams: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#161b2e', borderRadius: '10px',
    padding: '12px 16px', border: '1px solid #1b2138',
  },
  teamCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  teamLabel: { fontSize: '11px', color: '#595e70', marginBottom: '4px', fontWeight: 600 },
  teamName: { fontWeight: 700, fontSize: '14px', fontFamily: "'Outfit', sans-serif" },
  vs: { fontSize: '12px', fontWeight: 800, color: '#2b3452', padding: '0 12px' },
  scoresGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  gridHeader: {
    display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '12px', textAlign: 'center',
    fontSize: '11px', color: '#595e70', fontWeight: 600, padding: '0 4px',
  },
  gameRow: { display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', alignItems: 'center' },
  gameLabel: { fontSize: '13px', fontWeight: 600 },
  scoreInput: { textAlign: 'center' },
  previewContainer: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(0,240,255,0.04)',
    border: '1px solid rgba(0,240,255,0.12)',
    padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
  },
  simpleActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' },

  /* ── Live wrapper ── */
  liveWrapper: {
    overflowY: 'auto', padding: '16px 20px 20px',
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  /* Info bar */
  infoBar: {
    display: 'flex', alignItems: 'center', gap: '6px',
    flexWrap: 'wrap',
    padding: '8px 14px',
    background: '#161b2e',
    borderRadius: '10px',
    border: '1px solid #1b2138',
  },
  infoItem: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '3px 8px',
    borderRight: '1px solid #1b2138',
  },
  infoLabel: { fontSize: '10px', color: '#595e70', fontWeight: 600, textTransform: 'uppercase' },
  infoVal: { fontSize: '13px', color: '#c5c9d6', fontWeight: 700, fontFamily: "'Outfit', sans-serif" },
  winScoreSelect: {
    background: '#161b2e', border: '1px solid #2b3452',
    color: '#c5c9d6', borderRadius: '5px',
    padding: '1px 4px', fontSize: '12px', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", fontWeight: 600,
  },
  /* Banners */
  gameBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: '10px', fontSize: '13px', color: '#f59e0b',
  },
  advanceBtn: {
    marginLeft: 'auto',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 12px', borderRadius: '6px',
    background: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.3)',
    color: '#f59e0b', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
  matchEndBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: '10px', fontSize: '13px', color: '#22c55e',
  },
  summaryBtn: {
    marginLeft: 'auto',
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 12px', borderRadius: '6px',
    background: 'rgba(0,240,255,0.1)',
    border: '1px solid rgba(0,240,255,0.3)',
    color: '#00f0ff', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
  /* Player setup */
  playerSetup: {
    background: '#161b2e',
    border: '1px solid #1b2138',
    borderRadius: '10px', padding: '12px',
  },
  playerSetupTitle: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '11px', color: '#595e70', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '10px',
  },
  playerSetupGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  playerInput: {
    width: '100%', background: '#0e111f',
    border: '1px solid #1b2138', borderRadius: '7px',
    padding: '7px 10px', color: '#c5c9d6',
    fontSize: '12px', fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box',
  },
  /* ════════════════════════════════════
     VERTICAL LAYOUT STYLES
  ════════════════════════════════════ */
  vLayout: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    background: '#121626',
    borderRadius: '16px',
    padding: '24px 20px',
    border: '1px solid #1b2138',
  },
  /* Teams Row */
  vTeamsRow: {
    display: 'flex', gap: '20px',
  },
  vTeamCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
  },
  vTeamName: {
    fontSize: '15px', fontWeight: 800,
    fontFamily: "'Outfit', sans-serif", color: '#ffffff',
    textAlign: 'center', marginBottom: '4px',
  },
  /* Big Scores Row */
  vScoresRow: {
    display: 'flex', gap: '20px',
  },
  vScoreBox: {
    flex: 1, height: '110px',
    background: '#0e111f',
    border: '2px solid #1b2138',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', outline: 'none',
    transition: 'all 0.2s',
  },
  vScoreBoxAnim: {
    animation: 'scoreFlash 0.35s cubic-bezier(0.16,1,0.3,1)',
    background: 'rgba(0,240,255,0.08)',
    border: '2px solid rgba(0,240,255,0.4)',
    boxShadow: '0 0 32px rgba(0,240,255,0.25)',
  },
  scoreBoxDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },
  vScoreNum: {
    fontSize: '56px', fontWeight: 900,
    fontFamily: "'Outfit', sans-serif", color: '#ffffff',
    lineHeight: 1,
  },
  /* Serving Info Row */
  vServingRow: {
    display: 'flex', gap: '20px',
  },
  vServingTextActive: {
    flex: 1, color: '#00f0ff',
    fontSize: '13px', fontWeight: 700, textAlign: 'center',
  },
  vServingTextHidden: {
    flex: 1, color: 'transparent',
    fontSize: '13px', fontWeight: 700, textAlign: 'center',
  },
  /* Receiving Banner */
  vReceivingBanner: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1b2138',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '4px',
  },
  vRecvLabel: {
    fontSize: '11px', color: '#595e70', fontWeight: 600, textTransform: 'uppercase',
  },
  vRecvName: {
    fontSize: '15px', color: '#ffffff', fontWeight: 700,
  },
  /* Action Rows */
  vActionRowsContainer: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    marginTop: '8px',
  },
  vActionRowItem: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '0 10px',
  },
  vActionBox: {
    width: '64px', height: '48px',
    background: '#0e111f', border: '1px solid #1b2138',
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  vActionVal: {
    fontSize: '20px', fontWeight: 700, color: '#c5c9d6', fontFamily: "'Outfit', sans-serif",
  },
  vActionLabel: {
    flex: 1, fontSize: '13px', color: '#595e70', fontWeight: 500,
  },
  vSideOutBtn: {
    padding: '10px 24px', borderRadius: '8px',
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.3)',
    color: '#f59e0b', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s', width: '120px',
  },
  vResetBtn: {
    padding: '10px 24px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #2b3452',
    color: '#c5c9d6', fontSize: '14px', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    cursor: 'pointer', transition: 'all 0.2s', width: '120px',
  },
  /* Actions Grid */
  actionsGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
    marginTop: '12px', paddingTop: '16px', borderTop: '1px solid #1b2138',
  },
  actionBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px',
    background: '#0e111f', border: '1px solid #2b3452',
    color: '#c5c9d6', cursor: 'pointer',
    fontSize: '13px', fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s', outline: 'none',
  },
  actionBtnDanger: {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444',
  },
  /* Timeouts Section */
  vTimeoutsSection: {
    marginTop: '8px',
  },
  vToTitle: {
    fontSize: '12px', fontWeight: 700, color: '#595e70', marginBottom: '8px', paddingLeft: '4px',
  },
  vToRow: {
    display: 'flex', justifyContent: 'space-between',
  },
  vToGroup: {
    display: 'flex', gap: '8px',
  },
  vToBtn: {
    width: '40px', height: '40px', borderRadius: '8px',
    background: '#0e111f', border: '1px solid #1b2138',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  vToUsed: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  /* Finish row */
  finishRow: {
    display: 'flex', justifyContent: 'center',
    borderTop: '1px solid #1b2138',
    paddingTop: '20px', marginTop: '10px',
  },
  finishBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '14px 40px', borderRadius: '9px',
    background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
    border: 'none', color: '#060814',
    fontSize: '15px', fontWeight: 800,
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    boxShadow: '0 0 24px rgba(0,240,255,0.25)',
    transition: 'all 0.2s',
  },
  /* Doubles hint */
  doublesHint: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '10px 14px',
    background: 'rgba(0,240,255,0.06)',
    border: '1px solid rgba(0,240,255,0.15)',
    borderRadius: '8px',
    fontSize: '11px', color: '#c5c9d6',
    lineHeight: 1.4,
  }
};

export default MatchScoreModal;
