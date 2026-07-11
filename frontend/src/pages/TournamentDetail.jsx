import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import MatchList from '../components/MatchList';
import StandingsTable from '../components/StandingsTable';
import BracketView from '../components/BracketView';
import MatchScoreModal from '../components/MatchScoreModal';
import MatchEditModal from '../components/MatchEditModal';
import AITournamentAnalysis from '../components/AITournamentAnalysis';
import {
  Trophy,
  Users,
  Calendar,
  Grid,
  ChevronRight,
  Shield,
  Activity,
  Edit2,
  CheckCircle,
  FileText,
  UserPlus,
  Download,
  AlertCircle
} from 'lucide-react';

const TournamentDetail = () => {
  const { id } = useParams();
  const { user, token, API_URL } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  // Modals state
  const [selectedMatchForScore, setSelectedMatchForScore] = useState(null);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState(null);

  // Form states for Setup Mode
  const [setupGroups, setSetupGroups] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Editor Assignment form states
  const [editorEmail, setEditorEmail] = useState('');
  const [editorAccessType, setEditorAccessType] = useState('Tournament Editor');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [assigningEditor, setAssigningEditor] = useState(false);

  const fetchTournamentData = useCallback(async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/tournaments/${id}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch tournament data');
      }
      const json = await res.json();
      setData(json);
      setError('');

      if (json.tournament.categories && json.tournament.categories.length > 0) {
        setSelectedCategoryFilter(prev => prev || json.tournament.categories[0]);
      } else {
        setSelectedCategoryFilter(prev => prev || 'Default');
      }

      // If in Setup mode, initialize the groups/teams setup form structure
      if (json.tournament.status === 'Setup') {
        setSetupGroups((prevGroups) => {
          if (prevGroups.length > 0) return prevGroups;

          const categoriesToSetup = (json.tournament.categories && json.tournament.categories.length > 0) 
            ? json.tournament.categories 
            : ['Default'];

          const initialCategoryGroups = [];
          
          categoriesToSetup.forEach(cat => {
            const isSingles = cat.toLowerCase().includes('singles');
            const catSettings = json.tournament.categorySettings?.find(s => s.category === cat) || {};
            const numGroups = catSettings.numGroups || json.tournament.numGroups || 1;
            const teamsPerGroup = catSettings.teamsPerGroup || json.tournament.teamsPerGroup || 4;
            
            const groups = [];
            for (let g = 0; g < numGroups; g++) {
              const groupName = `Group ${String.fromCharCode(65 + g)}`;
              const teams = [];
              for (let t = 0; t < teamsPerGroup; t++) {
                teams.push({
                  name: isSingles ? '' : `${groupName} Team ${t + 1}`,
                  players: isSingles ? [''] : ['', ''],
                });
              }
              groups.push({ groupName, teams });
            }
            initialCategoryGroups.push({ category: cat, groups });
          });

          return initialCategoryGroups;
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, API_URL]);

  // 5-Second Interval HTTP Polling for live score updates
  useEffect(() => {
    // Reset setup groups when changing tournaments
    setSetupGroups([]);

    fetchTournamentData();
    const interval = setInterval(() => {
      fetchTournamentData();
    }, 5000);

    return () => clearInterval(interval);
  }, [id, fetchTournamentData]);

  if (loading && !data) return <Spinner />;
  if (error && !data) return <div className="container" style={{ paddingTop: '3rem' }}><div className="badge badge-danger">{error}</div></div>;
  if (!data) return <div className="container" style={{ paddingTop: '3rem' }}>Tournament not found</div>;

  const { tournament, groups, teams, matches, standings } = data;

  const availableCategories = tournament.categories && tournament.categories.length > 0 ? tournament.categories : ['Default'];
  
  const filteredGroups = groups.filter(g => !g.category || g.category === selectedCategoryFilter || (g.category === 'Default' && selectedCategoryFilter === 'Default'));
  const filteredTeams = teams.filter(t => !t.category || t.category === selectedCategoryFilter || (t.category === 'Default' && selectedCategoryFilter === 'Default'));
  const filteredMatches = matches.filter(m => !m.category || m.category === selectedCategoryFilter || (m.category === 'Default' && selectedCategoryFilter === 'Default'));
  const filteredStandings = standings.filter(s => !s.category || s.category === selectedCategoryFilter || (s.category === 'Default' && selectedCategoryFilter === 'Default'));
  
  const isCreator = user && tournament.creator && (user._id === tournament.creator._id || user._id === tournament.creator);
  const isSystemAdmin = user && user.role === 'Admin';
  const isAssignedEditor = user && tournament.editors && tournament.editors.some(e => e.user?._id === user._id || e.user === user._id);
  
  const canEdit = isSystemAdmin || isCreator || isAssignedEditor;
  const isAdminOrCreator = isSystemAdmin || isCreator;

  // Handle changes in Setup form
  const handleSetupTeamNameChange = (catIdx, gIdx, tIdx, name) => {
    const nextCategories = [...setupGroups];
    nextCategories[catIdx].groups[gIdx].teams[tIdx].name = name;
    setSetupGroups(nextCategories);
  };

  const handleSetupPlayerChange = (catIdx, gIdx, tIdx, pIdx, name) => {
    const nextCategories = [...setupGroups];
    nextCategories[catIdx].groups[gIdx].teams[tIdx].players[pIdx] = name;
    setSetupGroups(nextCategories);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tournaments/${tournament._id}/setup-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryGroupsData: setupGroups }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Failed to setup tournament');
      }
      
      await fetchTournamentData();
      setActiveTab('Overview');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Match score
  const handleScoreSubmit = async (matchId, gamesScore) => {
    const res = await fetch(`${API_URL}/matches/${matchId}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ games: gamesScore }),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message || 'Failed to submit score');
    }

    await fetchTournamentData();
  };

  // Submit Match details edit (time/court)
  const handleEditSubmit = async (matchId, matchDetails) => {
    const res = await fetch(`${API_URL}/matches/${matchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(matchDetails),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.message || 'Failed to update match');
    }

    await fetchTournamentData();
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    setAssigningEditor(true);

    try {
      const res = await fetch(`${API_URL}/tournaments/${tournament._id}/assign-editor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editorEmail,
          accessType: editorAccessType,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to send OTP');

      setAssignSuccess('OTP sent successfully to ' + editorEmail);
      setOtpSent(true);
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigningEditor(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    setAssigningEditor(true);

    try {
      const res = await fetch(`${API_URL}/tournaments/${tournament._id}/verify-editor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editorEmail,
          otp,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to verify editor');

      setAssignSuccess('Editor assigned successfully!');
      setOtpSent(false);
      setEditorEmail('');
      setOtp('');
      
      await fetchTournamentData(); // Refresh to see updated editors
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssigningEditor(false);
    }
  };

  // Client-side CSV Exporters
  const exportScheduleCSV = () => {
    const headers = ['Match ID', 'Stage', 'Team A', 'Team B', 'Status', 'Court Number', 'Scheduled Time'];
    const rows = matches.map(m => [
      m._id.substring(18),
      m.stage,
      m.teamA?.name || 'TBD',
      m.teamB?.name || 'TBD',
      m.status,
      m.courtNumber || 'TBD',
      m.scheduledTime ? new Date(m.scheduledTime).toLocaleString() : 'TBD'
    ]);
    downloadCSV('Tournament_Schedule.csv', headers, rows);
  };

  const exportStandingsCSV = () => {
    const headers = ['Group', 'Rank', 'Team/Player', 'Played', 'Won', 'Lost', 'Points For', 'Points Against', 'Diff', 'Points'];
    const rows = standings.map(s => {
      const g = groups.find(gp => gp._id === s.groupId);
      return [
        g ? g.name : 'TBD',
        s.rank,
        s.teamId?.name || 'TBD',
        s.played,
        s.wins,
        s.losses,
        s.pointsFor,
        s.pointsAgainst,
        s.pointDifference,
        s.points
      ];
    });
    downloadCSV('Group_Standings.csv', headers, rows);
  };

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tabs layout
  const tabs = ['Overview', 'Teams & Groups', 'Fixtures', 'Standings', 'Brackets', 'AI Analysis'];

  // Calculate quick dashboard stats
  const totalTeamsCount = teams.length;
  const totalMatchesCount = matches.length;
  const ongoingMatchesCount = matches.filter((m) => m.status === 'In Progress').length;
  const completedMatchesCount = matches.filter((m) => m.status === 'Completed').length;

  return (
    <div className="container" style={styles.container}>
      {error && (
        <div className="badge badge-danger" style={{ marginBottom: '1rem', width: '100%', display: 'block', textAlign: 'center' }}>
          Connection issue: {error}. Retrying...
        </div>
      )}
      {/* Header Info */}
      <header style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.breadcrumbs}>
            <Link to="/" style={styles.breadLink}>Tournaments</Link>
            <ChevronRight size={14} color="var(--text-dark)" />
            <span style={{ color: 'var(--color-primary)' }}>{tournament.name}</span>
          </div>
          <h1 style={styles.title}>{tournament.name}</h1>
          <div style={styles.metaRow}>
            <span className="badge badge-info">{tournament.type}</span>
            <span className="badge badge-success">{tournament.status}</span>
            <span style={styles.metaLabel}>Creator: {tournament.creator?.username}</span>
          </div>
        </div>
      </header>

      {/* SETUP MODE SCREEN FOR ADMINS */}
      {tournament.status === 'Setup' ? (
        <div className="glass-card animate-fade-in" style={styles.setupCard}>
          <div style={styles.setupHeader}>
            <Shield size={32} color="var(--color-primary)" />
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Tournament Setup Mode</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Only you, the tournament creator/assigned editor, can enter team names and initialize the group stage.
              </p>
            </div>
          </div>

          {!canEdit ? (
            <div style={styles.nonAdminSetupMessage}>
              <p>Setup has not been completed by the tournament administrator. Please check back later when matches are generated!</p>
            </div>
          ) : (
            <form onSubmit={handleSetupSubmit}>
              {setupGroups.map((catGroup, catIdx) => {
                const isSingles = catGroup.category.toLowerCase().includes('singles');
                return (
                <div key={catIdx} style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    {catGroup.category} Setup
                  </h3>
                  {catGroup.groups.map((group, gIdx) => (
                    <div key={gIdx} style={styles.setupGroupSection}>
                      <h3 style={styles.setupGroupTitle}>{group.groupName}</h3>
                      <div style={styles.setupTeamsGrid}>
                        {group.teams.map((team, tIdx) => (
                          <div key={tIdx} style={styles.setupTeamCard}>
                            <div className="input-group">
                              <label className="input-label">
                                {isSingles ? `Player ${tIdx + 1} Name` : `Team ${tIdx + 1} Name`}
                              </label>
                              <input
                                type="text"
                                required={isSingles}
                                value={team.name}
                                onChange={(e) => handleSetupTeamNameChange(catIdx, gIdx, tIdx, e.target.value)}
                                placeholder={isSingles ? "e.g. Rohit Sharma" : "e.g. Smashers (Optional)"}
                                className="text-input"
                              />
                            </div>

                            {/* Player Inputs */}
                            {!isSingles && team.players.map((player, pIdx) => (
                              <div className="input-group" key={pIdx} style={{ marginBottom: '0.5rem' }}>
                                <label className="input-label" style={{ fontSize: '0.75rem' }}>
                                  Player {pIdx + 1}
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={player}
                                  onChange={(e) => handleSetupPlayerChange(catIdx, gIdx, tIdx, pIdx, e.target.value)}
                                  placeholder={`Player ${pIdx + 1} Name`}
                                  className="text-input"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )})}
              
              <div style={styles.setupActions}>
                <button type="submit" className="neon-btn" style={{ color: '#052e16' }}>
                  Generate Fixtures & Start Tournament
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* NORMAL TOURNAMENT BOARD TABS VIEW */
        <>
          <div style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  ...styles.tabBtn,
                  borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {availableCategories.length > 1 && (
            <div style={{ padding: '0 2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <label style={{ marginRight: '1rem', color: 'var(--text-muted)' }}>Category:</label>
              <select 
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-input"
                style={{ width: '200px', backgroundColor: 'var(--bg-tertiary)' }}
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.tabContent}>
            {/* 1. OVERVIEW / DASHBOARD TAB */}
            {activeTab === 'Overview' && (
              <div className="animate-fade-in" style={styles.dashboardGrid}>
                {/* Stats cards */}
                <div style={styles.dashboardStatsRow}>
                  <div className="glass-card" style={styles.dashboardStatCard}>
                    <Users size={24} color="var(--color-primary)" />
                    <div>
                      <h4 style={styles.dashStatVal}>{totalTeamsCount}</h4>
                      <span style={styles.dashStatLabel}>Total Teams</span>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.dashboardStatCard}>
                    <FileText size={24} color="var(--color-accent)" />
                    <div>
                      <h4 style={styles.dashStatVal}>{totalMatchesCount}</h4>
                      <span style={styles.dashStatLabel}>Total Matches</span>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.dashboardStatCard}>
                    <Activity size={24} color="var(--warning)" />
                    <div>
                      <h4 style={styles.dashStatVal}>{ongoingMatchesCount}</h4>
                      <span style={styles.dashStatLabel}>Live / In Progress</span>
                    </div>
                  </div>
                  <div className="glass-card" style={styles.dashboardStatCard}>
                    <CheckCircle size={24} color="var(--success)" />
                    <div>
                      <h4 style={styles.dashStatVal}>{completedMatchesCount}</h4>
                      <span style={styles.dashStatLabel}>Completed</span>
                    </div>
                  </div>
                </div>

                {/* Tournament Overview Text & Exports card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="glass-card" style={styles.overviewTextCard}>
                    <h3 style={styles.overviewCardTitle}>Tournament Status: <span style={{ color: 'var(--color-primary)' }}>{tournament.status}</span></h3>
                    <div style={styles.infoGrid}>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Location:</span>
                        <span style={styles.infoValue}>{tournament.location || 'Main Court'}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Contact Person:</span>
                        <span style={styles.infoValue}>{tournament.contactPerson || 'N/A'}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Admin Contact:</span>
                        <span style={styles.infoValue}>{tournament.adminPhone || 'N/A'}</span>
                      </div>
                      <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Ruleset:</span>
                        <span style={styles.infoValue}>{tournament.ruleset}</span>
                      </div>
                    </div>

                    <div style={styles.exportSection}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Download Reports</h4>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={exportScheduleCSV} className="secondary-btn" style={styles.exportBtn}>
                          <Download size={14} /> Schedule (CSV)
                        </button>
                        <button onClick={exportStandingsCSV} className="secondary-btn" style={styles.exportBtn}>
                          <Download size={14} /> Standings (CSV)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Box (If role is Player) */}
                  {user && user.role === 'Player' && (
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <h3 style={styles.overviewCardTitle}>Your Personal Stats</h3>
                      <div style={styles.infoGrid}>
                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Matches Played:</span>
                          <span style={styles.infoValue}>
                            {matches.filter(m => m.status === 'Completed' && (m.teamA?.players.includes(user.username) || m.teamB?.players.includes(user.username))).length}
                          </span>
                        </div>
                        <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Total Wins:</span>
                          <span style={styles.infoValue}>
                            {matches.filter(m => m.status === 'Completed' && m.winner?.players.includes(user.username)).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editor Assignment Panel (visible to admin/creator) */}
                {isAdminOrCreator && (
                  <div className="glass-card" style={styles.editorPanel}>
                    <h3 style={styles.overviewCardTitle}><UserPlus size={18} color="var(--color-primary)" /> Assign Editor Access</h3>
                    
                    {assignSuccess && <div className="badge badge-success" style={{ marginBottom: '1rem' }}>{assignSuccess}</div>}
                    {assignError && <div className="badge badge-danger" style={{ marginBottom: '1rem' }}>{assignError}</div>}

                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} style={styles.editorForm}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                            <label className="input-label">Editor Email</label>
                            <input
                              type="email"
                              required
                              value={editorEmail}
                              onChange={(e) => setEditorEmail(e.target.value)}
                              placeholder="editor@example.com"
                              className="text-input"
                            />
                          </div>

                          <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                            <label className="input-label">Access Level</label>
                            <select
                              value={editorAccessType}
                              onChange={(e) => setEditorAccessType(e.target.value)}
                              className="text-input"
                            >
                              <option value="Tournament Editor">Tournament Editor (Just this one)</option>
                              <option value="Category Editor">Category Editor (Selected Category)</option>
                              <option value="Full Editor">Full Editor (All tournaments)</option>
                            </select>
                          </div>
                        </div>

                        <button type="submit" className="primary-btn" disabled={assigningEditor} style={{ marginTop: '1rem' }}>
                          {assigningEditor ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} style={styles.editorForm}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                            <label className="input-label">Enter 6-digit OTP sent to {editorEmail}</label>
                            <input
                              type="text"
                              required
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="123456"
                              className="text-input"
                              maxLength={6}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                          <button type="submit" className="primary-btn" disabled={assigningEditor}>
                            {assigningEditor ? 'Verifying...' : 'Verify OTP'}
                          </button>
                          <button type="button" className="secondary-btn" onClick={() => setOtpSent(false)} disabled={assigningEditor}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {/* List of current editors */}
                    {tournament.editors && tournament.editors.length > 0 && (
                      <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Current Editors</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {tournament.editors.map((ed) => (
                            <li key={ed._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                              <span style={{ color: 'var(--text-main)' }}>User ID: {ed.user?.substring ? ed.user.substring(18) : 'Unknown'}</span>
                              <span className="badge badge-info">{ed.accessType}</span>
                              <span className="badge badge-success">Verified</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}


                  </div>
                )}
              </div>
            )}

            {/* 2. TEAMS & GROUPS TAB */}
            {activeTab === 'Teams & Groups' && (
              <div className="animate-fade-in" style={styles.groupsGrid}>
                {filteredGroups.map((group) => (
                  <div key={group._id} className="glass-card" style={styles.groupCard}>
                    <h3 style={styles.groupHeader}>{group.name}</h3>
                    <ul style={styles.teamsList}>
                      {group.teams.map((team, idx) => (
                        <li key={team._id} style={styles.teamListItem}>
                          <span style={styles.teamIndex}>{idx + 1}.</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{team.name}</div>
                            <div style={styles.teamPlayersSmall}>
                              {team.players.join(' & ')}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* 3. FIXTURES TAB */}
            {activeTab === 'Fixtures' && (
              <div className="animate-fade-in">
                <div style={styles.fixturesSplit}>
                  <div>
                    <h3 style={styles.stageTitle}>Group Stage Matches</h3>
                    <MatchList
                      matches={filteredMatches.filter((m) => m.stage === 'Group')}
                      canEdit={canEdit}
                      onOpenScoreModal={setSelectedMatchForScore}
                      onOpenEditModal={setSelectedMatchForEdit}
                    />
                  </div>
                  <div>
                    <h3 style={styles.stageTitle}>Knockout Stage Matches</h3>
                    <MatchList
                      matches={filteredMatches.filter((m) => m.stage !== 'Group')}
                      canEdit={canEdit}
                      onOpenScoreModal={setSelectedMatchForScore}
                      onOpenEditModal={setSelectedMatchForEdit}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. STANDINGS TAB */}
            {activeTab === 'Standings' && (
              <div className="animate-fade-in">
                {filteredGroups.map((group) => {
                  const groupStandings = filteredStandings.filter((s) => s.groupId === group._id);
                  return (
                    <StandingsTable
                      key={group._id}
                      standings={groupStandings}
                      groupName={group.name}
                    />
                  );
                })}
              </div>
            )}

            {/* 5. BRACKETS TAB */}
            {activeTab === 'Brackets' && (
              <div className="animate-fade-in">
                {!filteredMatches.some(m => m.stage !== 'Group') ? (
                  <div className="glass-card" style={styles.bracketsTbd}>
                    <Trophy size={48} color="var(--text-dark)" />
                    <h3>Knockout Bracket Unavailable</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Brackets will automatically generate once all Group Stage round-robin matches are completed for this category.
                    </p>
                  </div>
                ) : (
                  <BracketView matches={filteredMatches} />
                )}
              </div>
            )}

            {/* 6. AI ANALYSIS TAB */}
            {activeTab === 'AI Analysis' && (
              <AITournamentAnalysis tournamentId={tournament._id} />
            )}
          </div>
        </>
      )}

      {/* MODALS */}
      {selectedMatchForScore && (
        <MatchScoreModal
          match={selectedMatchForScore}
          onClose={() => setSelectedMatchForScore(null)}
          onSubmit={handleScoreSubmit}
        />
      )}

      {selectedMatchForEdit && (
        <MatchEditModal
          match={selectedMatchForEdit}
          onClose={() => setSelectedMatchForEdit(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    paddingTop: '2rem',
    paddingBottom: '4rem',
  },
  header: {
    marginBottom: '2rem',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  breadLink: {
    textDecoration: 'none',
    color: 'var(--text-muted)',
    transition: 'var(--transition-smooth)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  metaLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  setupCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '2rem',
  },
  setupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '1.25rem',
  },
  nonAdminSetupMessage: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1rem',
  },
  setupGroupSection: {
    marginBottom: '2.5rem',
  },
  setupGroupTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1.25rem',
    color: 'var(--color-primary)',
    borderLeft: '4px solid var(--color-primary)',
    paddingLeft: '0.75rem',
  },
  setupTeamsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  setupTeamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  setupActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1.5rem',
    marginTop: '1.5rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '2rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '2rem',
    overflowX: 'auto',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '0.75rem 0.5rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  tabContent: {},
  dashboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  dashboardStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
  },
  dashboardStatCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
  },
  dashStatVal: {
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  dashStatLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  overviewTextCard: {
    padding: '1.5rem',
  },
  overviewCardTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem 1.5rem',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.4rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  infoLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  infoValue: {
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  exportSection: {
    marginTop: '1.5rem',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '1rem',
  },
  exportBtn: {
    padding: '0.4rem 0.8rem',
    fontSize: '0.8rem',
    gap: '0.35rem',
  },
  editorPanel: {
    padding: '1.5rem',
  },
  editorForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  editorsList: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '1rem',
  },
  editorsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  editorBadge: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '0.8rem',
  },
  editorBadgeDetail: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  groupCard: {
    padding: '1.5rem',
  },
  groupHeader: {
    fontSize: '1.1rem',
    fontWeight: 700,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    color: 'var(--color-primary)',
  },
  teamsList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  teamListItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  teamIndex: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  teamPlayersSmall: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  fixturesSplit: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2.5rem',
  },
  stageTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '1.25rem',
    borderLeft: '3px solid var(--color-accent)',
    paddingLeft: '0.5rem',
  },
  bracketsTbd: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
};

export default TournamentDetail;
