import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, HelpCircle, ArrowRight, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

const CreateTournament = () => {
  const { token, API_URL } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STEP 1: Basic Info State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Main Court Arena');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [ruleset, setRuleset] = useState('Pickleball Standard');

  // STEP 2: Categories Setup State
  const [baseCategories, setBaseCategories] = useState([
    "Men's Singles",
    "Men's Doubles",
    "Women's Singles",
    "Women's Doubles",
    "Mixed Doubles",
  ]);
  const [customCategory, setCustomCategory] = useState('');
  const [ageDivisions, setAgeDivisions] = useState(['Open']);

  const categories = React.useMemo(() => {
    if (ageDivisions.length === 0) return baseCategories;
    const result = [];
    baseCategories.forEach(bc => {
      ageDivisions.forEach(age => {
        result.push(age === 'Open' ? bc : `${bc} ${age}`);
      });
    });
    return result;
  }, [baseCategories, ageDivisions]);

  // STEP 3: Category Settings State
  const [categorySettings, setCategorySettings] = useState({});

  // STEP 4: Settings & Rules State
  const [winningPoints, setWinningPoints] = useState(11);
  const [minimumLead, setMinimumLead] = useState(2);
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [rallyScoring, setRallyScoring] = useState(false);
  const [tieBreakerRules, setTieBreakerRules] = useState('Head-to-head');

  useEffect(() => {
    setCategorySettings(prev => {
      const newSettings = { ...prev };
      let changed = false;
      categories.forEach(cat => {
        if (!newSettings[cat]) {
          newSettings[cat] = {
            numGroups: 2,
            teamsPerGroup: 4,
            topQualifiersPerGroup: 2,
            groupsConfig: [
              { groupName: 'Pool A', format: 'Round Robin', expectedTeams: 4 },
              { groupName: 'Pool B', format: 'Round Robin', expectedTeams: 4 },
            ]
          };
          changed = true;
        }
      });
      Object.keys(newSettings).forEach(cat => {
        if (!categories.includes(cat)) {
          delete newSettings[cat];
          changed = true;
        }
      });
      return changed ? newSettings : prev;
    });
  }, [categories]);

  const addCustomCategory = () => {
    if (customCategory.trim() && !baseCategories.includes(customCategory.trim())) {
      setBaseCategories([...baseCategories, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const removeBaseCategory = (idx) => {
    setBaseCategories(baseCategories.filter((_, i) => i !== idx));
  };

  const toggleAgeDivision = (age, checked) => {
    if (checked) {
      setAgeDivisions([...ageDivisions, age]);
    } else {
      setAgeDivisions(ageDivisions.filter(a => a !== age));
    }
  };

  const handleCatNumGroupsChange = (cat, val) => {
    const num = Math.max(1, Number(val));
    setCategorySettings(prev => {
      const nextCat = { ...prev[cat], numGroups: num };
      const updatedConfig = [...nextCat.groupsConfig];
      if (num > updatedConfig.length) {
        for (let i = updatedConfig.length; i < num; i++) {
          const charCode = 65 + i;
          updatedConfig.push({ groupName: `Pool ${String.fromCharCode(charCode)}`, format: 'Round Robin', expectedTeams: nextCat.teamsPerGroup });
        }
      } else if (num < updatedConfig.length) {
        updatedConfig.splice(num);
      }
      nextCat.groupsConfig = updatedConfig;
      return { ...prev, [cat]: nextCat };
    });
  };

  const handleCatTeamsPerGroupChange = (cat, val) => {
    const count = Math.max(2, Number(val));
    setCategorySettings(prev => {
      const nextCat = { ...prev[cat], teamsPerGroup: count };
      nextCat.groupsConfig = nextCat.groupsConfig.map(g => ({ ...g, expectedTeams: count }));
      return { ...prev, [cat]: nextCat };
    });
  };

  const handleCatTopQualifiersChange = (cat, val) => {
    setCategorySettings(prev => ({
      ...prev,
      [cat]: { ...prev[cat], topQualifiersPerGroup: Math.max(1, Number(val)) }
    }));
  };

  const updateCatGroupConfigName = (cat, index, name) => {
    setCategorySettings(prev => {
      const nextCat = { ...prev[cat] };
      const nextConfig = [...nextCat.groupsConfig];
      nextConfig[index].groupName = name;
      nextCat.groupsConfig = nextConfig;
      return { ...prev, [cat]: nextCat };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          location,
          startDate,
          endDate,
          contactPerson,
          adminPhone,
          adminEmail,
          ruleset,
          categories,
          categorySettings: Object.keys(categorySettings).map(cat => ({
            category: cat,
            numGroups: categorySettings[cat].numGroups,
            teamsPerGroup: categorySettings[cat].teamsPerGroup,
            topQualifiersPerGroup: categorySettings[cat].topQualifiersPerGroup,
          })),
          winningPoints,
          minimumLead,
          numberOfSets,
          rallyScoring,
          tieBreakerRules,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create tournament');
      }

      navigate(`/tournaments/${data._id}`);
    } catch (err) {
      setError(err.message || 'An error occurred during creation.');
      setActiveStep(1); // Go back to first step on error to review
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={styles.container}>
      <div className="glass-card animate-fade-in" style={styles.card}>
        <div style={styles.header}>
          <Trophy size={40} color="var(--color-primary)" />
          <h1 style={styles.title}>Create Tournament</h1>
          <p style={styles.subtitle}>Step {activeStep} of 4: {
            activeStep === 1 ? 'Basic Information' :
            activeStep === 2 ? 'Categories Setup' :
            activeStep === 3 ? 'Group & Division Setup' :
            'Rules & Settings'
          }</p>
        </div>

        {/* Horizontal step bar */}
        <div style={styles.stepBar}>
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              style={{
                ...styles.stepIndicator,
                backgroundColor: activeStep === stepNum ? 'var(--color-primary)' : activeStep > stepNum ? 'var(--success)' : 'var(--bg-tertiary)',
              }}
            />
          ))}
        </div>

        {error && <div className="badge badge-danger" style={styles.error}>{error}</div>}

        <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
          {/* STEP 1: Basic Info */}
          {activeStep === 1 && (
            <div style={styles.stepContent}>
              <div className="input-group">
                <label className="input-label">Tournament Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Pickleball Smash"
                  className="text-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Location / Venue</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. National Tennis Arena, Court 4"
                  className="text-input"
                />
              </div>

              <div style={styles.row}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-input"
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Contact Person</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="John Doe"
                  className="text-input"
                />
              </div>

              <div style={styles.row}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Admin Phone</label>
                  <input
                    type="tel"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="9876543210"
                    className="text-input"
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@dinksync.com"
                    className="text-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Ruleset Configuration</label>
                <select
                  value={ruleset}
                  onChange={(e) => setRuleset(e.target.value)}
                  className="text-input"
                >
                  <option value="Pickleball Standard">Pickleball Standard Rules</option>
                  <option value="USAPA Official">USAPA Official Ruleset</option>
                  <option value="Custom Modified">Custom Modified</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Categories Setup */}
          {activeStep === 2 && (
            <div style={styles.stepContent}>
              <label className="input-label">Base Categories</label>
              <p style={styles.hintText}>Tick or add the main event categories.</p>
              
              <div style={styles.categoriesList}>
                {baseCategories.map((cat, idx) => (
                  <div key={idx} style={styles.categoryItem}>
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => removeBaseCategory(idx)}
                      style={styles.removeCatBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.addCategoryRow}>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Juniors Singles"
                  className="text-input"
                  style={{ flexGrow: 1 }}
                />
                <button
                  type="button"
                  onClick={addCustomCategory}
                  className="neon-btn"
                  style={{ padding: '0.75rem 1rem', color: '#052e16' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <label className="input-label" style={{ marginTop: '1rem' }}>Age Divisions</label>
              <p style={styles.hintText}>Select age divisions to combine with the base categories above.</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {['Under 12', 'Under 14', 'Under 16', 'Under 18', 'Open', '35+', '50+'].map(age => (
                  <label key={age} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={ageDivisions.includes(age)}
                      onChange={(e) => toggleAgeDivision(age, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.85rem' }}>{age}</span>
                  </label>
                ))}
              </div>

              {categories.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                  <label className="input-label" style={{ fontSize: '0.85rem' }}>Generated Categories ({categories.length}):</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {categories.map(c => (
                      <span key={c} className="badge badge-info">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Groups Setup */}
          {activeStep === 3 && (
            <div style={styles.stepContent}>
              {categories.map((cat, catIdx) => {
                const settings = categorySettings[cat] || {};
                return (
                  <div key={cat} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--color-primary)' }}>{cat} Settings</h3>
                    
                    <div style={styles.row}>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Number of Groups</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={settings.numGroups || 1}
                          onChange={(e) => handleCatNumGroupsChange(cat, e.target.value)}
                          className="text-input"
                        />
                      </div>
                      <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Teams Per Group</label>
                        <input
                          type="number"
                          min="2"
                          required
                          value={settings.teamsPerGroup || 2}
                          onChange={(e) => handleCatTeamsPerGroupChange(cat, e.target.value)}
                          className="text-input"
                        />
                      </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                      <label className="input-label">Top Qualifiers (Advance to Knockout)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={settings.topQualifiersPerGroup || 1}
                        onChange={(e) => handleCatTopQualifiersChange(cat, e.target.value)}
                        className="text-input"
                      />
                      <span style={styles.hint}>Top X teams advancing from group stage in {cat}.</span>
                    </div>

                    <label className="input-label">Name Group Divisions</label>
                    <div style={styles.groupDivsList}>
                      {(settings.groupsConfig || []).map((g, idx) => (
                        <div key={idx} style={styles.groupNameRow}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Group #{idx + 1}:</span>
                          <input
                            type="text"
                            required
                            value={g.groupName}
                            onChange={(e) => updateCatGroupConfigName(cat, idx, e.target.value)}
                            className="text-input"
                            style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: Settings & Rules */}
          {activeStep === 4 && (
            <div style={styles.stepContent}>
              <div style={styles.row}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Winning Points</label>
                  <input
                    type="number"
                    required
                    value={winningPoints}
                    onChange={(e) => setWinningPoints(Number(e.target.value))}
                    className="text-input"
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Min Lead Needed</label>
                  <input
                    type="number"
                    required
                    value={minimumLead}
                    onChange={(e) => setMinimumLead(Number(e.target.value))}
                    className="text-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Number of Sets</label>
                <select
                  value={numberOfSets}
                  onChange={(e) => setNumberOfSets(Number(e.target.value))}
                  className="text-input"
                >
                  <option value={1}>1 Set (Single Game)</option>
                  <option value={3}>3 Sets (Best of 3)</option>
                  <option value={5}>5 Sets (Best of 5)</option>
                </select>
              </div>

              <div className="input-group" style={{ flexDirection: 'row', gap: '0.75rem', alignItems: 'center', margin: '1.25rem 0' }}>
                <input
                  type="checkbox"
                  id="rallyScoring"
                  checked={rallyScoring}
                  onChange={(e) => setRallyScoring(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="rallyScoring" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>Enable Rally Scoring?</label>
              </div>

              <div className="input-group">
                <label className="input-label">Tie-breaker Rules</label>
                <select
                  value={tieBreakerRules}
                  onChange={(e) => setTieBreakerRules(e.target.value)}
                  className="text-input"
                >
                  <option value="Head-to-head">Priority 1: Head-to-head, Priority 2: Point Diff, Priority 3: Points For</option>
                  <option value="Point-differential">Priority 1: Point Diff, Priority 2: Points For</option>
                  <option value="Points-for">Priority 1: Points For, Priority 2: Point Diff</option>
                </select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={styles.actions}>
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="secondary-btn"
                disabled={loading}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="secondary-btn"
                disabled={loading}
              >
                Cancel
              </button>
            )}

            {activeStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 1 && !name) {
                    setError('Please fill in the tournament name.');
                    return;
                  }
                  setError('');
                  setActiveStep(activeStep + 1);
                }}
                className="neon-btn"
                style={{ color: '#052e16' }}
              >
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="neon-btn"
                style={{ color: '#052e16' }}
                disabled={loading || !name}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Tournament...</span>
                  </>
                ) : (
                  <>
                    <span>Finish Setup</span>
                    <Trophy size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
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
    padding: '2rem 1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '580px',
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
    fontSize: '1.75rem',
    fontWeight: 800,
    marginTop: '0.75rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  stepBar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  stepIndicator: {
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  hint: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-dark)',
    marginTop: '0.4rem',
  },
  hintText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem',
  },
  categoriesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    maxHeight: '180px',
    overflowY: 'auto',
    padding: '0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-tertiary)',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.65rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  removeCatBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  addCategoryRow: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  groupDivsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '200px',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  },
  groupNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
  },
};

export default CreateTournament;
