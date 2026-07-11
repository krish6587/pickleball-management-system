import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Tournament({ onNavigate }) {
  const navigate = useNavigate();
  const { token, API_URL, user } = useAuth();
  
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fallbackTournaments = [
    {
      _id: "mock-1",
      name: "Indore Open Doubles",
      startDate: "2026-07-12",
      level: "Intermediate",
      status: "Setup",
      spots: 6,
      location: "Indore Club"
    },
    {
      _id: "mock-2",
      name: "City Championship Singles",
      startDate: "2026-07-20",
      level: "Advanced",
      status: "Setup",
      spots: 2,
      location: "City Stadium"
    },
    {
      _id: "mock-3",
      name: "Weekend Mixer Cup",
      startDate: "2026-07-26",
      level: "Beginner",
      status: "Setup",
      spots: 14,
      location: "Green Park Court"
    },
    {
      _id: "mock-4",
      name: "Summer Slam Finals",
      startDate: "2026-08-02",
      level: "All levels",
      status: "Knockout Stage",
      spots: 0,
      location: "Main Arena"
    },
  ];

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
          if (data && data.length > 0) {
            setTournaments(data);
          } else {
            setTournaments(fallbackTournaments);
          }
        } else {
          setTournaments(fallbackTournaments);
        }
      } catch (err) {
        console.error("Error fetching tournaments:", err);
        setTournaments(fallbackTournaments);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, [token, API_URL]);

  // Map backend status to filters:
  // "open" -> status === "Setup"
  // "closed" -> status in Group Stage, Knockout Stage, Completed
  const filtered = tournaments.filter((t) => {
    if (filter === "all") return true;
    const isOpen = t.status === "Setup";
    if (filter === "open") return isOpen;
    if (filter === "closed") return !isOpen;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRowClick = (id) => {
    if (id.startsWith("mock-")) {
      // Mock item, navigate to pricing
      onNavigate ? onNavigate("pricing") : navigate("/pricing");
    } else {
      navigate(`/tournaments/${id}`);
    }
  };

  const handleRegisterClick = (e, t) => {
    e.stopPropagation(); // Avoid triggering row click
    if (t._id.startsWith("mock-")) {
      onNavigate ? onNavigate("pricing") : navigate("/pricing");
    } else {
      navigate(`/tournaments/${t._id}`);
    }
  };

  return (
    <section className="tournament-page" style={{ position: "relative", zIndex: 2, padding: "80px 24px" }}>
      <div className="section-head" style={{ textAlign: "center", marginBottom: "50px" }}>
        <span className="eyebrow" style={{ color: "var(--neon-orange)" }}>Tournaments</span>
        <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Upcoming tournaments</h2>
        <p style={{ color: "var(--ink-muted)" }}>Find a tournament, check your bracket, and register a spot.</p>
      </div>

      <div className="filter-row" style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
        <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={filter === "open" ? "chip active" : "chip"} onClick={() => setFilter("open")}>
          Open
        </button>
        <button className={filter === "closed" ? "chip active" : "chip"} onClick={() => setFilter("closed")}>
          Closed
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner-ring"></div>
        </div>
      ) : (
        <div className="tournament-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          {filtered.map((t, i) => {
            const isSetup = t.status === "Setup";
            const level = t.level || (i % 3 === 0 ? "Intermediate" : i % 3 === 1 ? "Advanced" : "Beginner");
            const spots = t.spots !== undefined ? t.spots : (isSetup ? 8 : 0);
            
            // Cycle through beautiful sport backgrounds
            const bannerImages = [
              "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=400&q=80",
              "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80",
              "https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=400&q=80"
            ];
            const banner = bannerImages[i % bannerImages.length];
            const prize = t.prize || (i % 2 === 0 ? "₹15,000" : "₹10,000");

            return (
              <div 
                className="tournament-card-redesign glass-card" 
                key={t._id || i}
                onClick={() => handleRowClick(t._id)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative' }}
              >
                <div 
                  className="card-banner" 
                  style={{ 
                    backgroundImage: `url(${banner})`,
                    height: '160px',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}
                >
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px',
                      background: '#080a08',
                      color: isSetup ? 'var(--neon-lime)' : t.status === 'Completed' ? 'var(--ink-tertiary)' : 'var(--neon-orange)',
                      border: `1px solid ${isSetup ? 'var(--neon-lime)' : t.status === 'Completed' ? 'var(--hairline)' : 'var(--neon-orange)'}`,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {isSetup ? `${spots} spots left` : t.status === "Completed" ? "Finished" : "Live Bracket"}
                  </span>
                </div>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink)' }}>{t.name}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '15px 0', fontSize: '13px', color: 'var(--ink-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-calendar" style={{ color: 'var(--neon-cyan)' }} /> {formatDate(t.startDate)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-stairs-up" style={{ color: 'var(--neon-cyan)' }} /> Level: {level}
                    </span>
                    {t.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ti ti-map-pin" style={{ color: 'var(--neon-cyan)' }} /> {t.location}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--ink)' }}>
                      <i className="ti ti-award" style={{ color: 'var(--neon-orange)' }} /> Prize: {prize}
                    </span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-subtle)' }}>Bracket Phase</span>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => handleRegisterClick(e, t)}
                      style={{ 
                        boxShadow: isSetup ? '0 0 10px rgba(0, 240, 255, 0.25)' : '0 0 10px rgba(0, 240, 255, 0.12)',
                        background: isSetup ? 'var(--primary)' : 'transparent',
                        color: isSetup ? 'var(--canvas)' : '#ffffff',
                        border: '1px solid var(--primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {isSetup ? "Register" : "View Bracket"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
