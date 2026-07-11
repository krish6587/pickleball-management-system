import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import liveCardImg from "../assets/live_card.png";
import upcomingCardImg from "../assets/upcoming_card.png";
import registeringCardImg from "../assets/registering_card.png";
import heroPaddleImg from "../assets/hero_paddle.png";

// Canvas Particle background overlay for high-tech aesthetic
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 600);

    const particles = [];
    const particleCount = 40;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 2 + 1;
        const colors = ["#00f0ff", "#3b82f6", "#ff5d00", "#ffffff"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // connection line logic
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = "#00f0ff";
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

// Automatic cycling gallery carousel
const GalleryCarousel = () => {
  const [index, setIndex] = useState(0);
  const slides = [
    { title: "Championship Ground", img: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80", subtitle: "DinkSync Arenas" },
    { title: "Advanced Match Serving", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80", subtitle: "Court Performance" },
    { title: "Match Highlights Live", img: "https://images.unsplash.com/photo-1617083934382-73602123512b?w=600&q=80", subtitle: "Tournament Action" },
    { title: "Victory Ceremony Awards", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80", subtitle: "Podium Standings" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="gallery-carousel glass-card" style={{ height: "300px", position: "relative" }}>
      <div 
        className="gallery-track" 
        style={{ 
          transform: `translateX(-${index * (100 / slides.length)}%)`, 
          display: 'flex', 
          width: `${slides.length * 100}%`,
          height: '100%'
        }}
      >
        {slides.map((s, i) => (
          <div 
            key={i} 
            className="gallery-slide" 
            style={{ 
              backgroundImage: `url(${s.img})`,
              width: `${100 / slides.length}%`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%',
              position: 'relative'
            }}
          >
            <div className="gallery-overlay" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '30px' }}>
              <span className="eyebrow" style={{ color: 'var(--neon-cyan)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.subtitle}</span>
              <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: 700, marginTop: '5px' }}>{s.title}</h3>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: '20px', right: '30px', display: 'flex', gap: '8px', zIndex: 5 }}>
        {slides.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setIndex(i)}
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: index === i ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default function Home({ onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHeroAction = () => {
    if (user && user.role === "Admin") {
      navigate("/create-tournament");
    } else {
      navigate("/register");
    }
  };

  const cards = [
    {
      title: "Live Match Action",
      desc: "Watch real-time matches play out, track live scoreboard dynamics, and support your home team.",
      img: liveCardImg,
      badge: "LIVE",
      badgeColor: "#00f0ff"
    },
    {
      title: "Indore Open & Upcoming Slams",
      desc: "Step onto the court where energy, excitement, and community come together. Register for the upcoming events today.",
      img: upcomingCardImg,
      badge: "UPCOMING",
      badgeColor: "#bef264",
      featured: true,
    },
    {
      title: "Join the Club & Start Playing",
      desc: "Whether you're a beginner or a pro, everyone is welcome. Get registering and secure your spot now.",
      img: registeringCardImg,
      badge: "REGISTERING",
      badgeColor: "#ff5d00"
    },
  ];

  const stats = [
    { icon: "ti-users", title: "Friendly community", desc: "Meet players, make friends, and grow together." },
    { icon: "ti-trophy", title: "Tournaments", desc: "Participate in exciting events and win big." },
    { icon: "ti-whistle", title: "Expert coaching", desc: "Learn from the best and improve your game." },
    { icon: "ti-calendar-event", title: "Easy booking", desc: "Book courts online quickly and easily." },
  ];

  const leaderboard = [
    { rank: 1, name: "Aarav Mehta", wins: 42, rate: "89%", points: 1250, medal: "gold" },
    { rank: 2, name: "Vikram Malhotra", wins: 38, rate: "84%", points: 1100, medal: "silver" },
    { rank: 3, name: "Rohan Sharma", wins: 35, rate: "81%", points: 1020, medal: "bronze" },
    { rank: 4, name: "Sneha Iyer", wins: 31, rate: "76%", points: 950, medal: "none" },
    { rank: 5, name: "Aditi Rao", wins: 28, rate: "74%", points: 880, medal: "none" }
  ];

  return (
    <div className="home" style={{ position: "relative", overflow: "hidden" }}>
      {/* Animated 3D Perspective Court Floor */}
      <div className="animated-grid" />

      {/* Hero Section Redesign */}
      <section className="hero-redesign">
        <ParticleCanvas />
        <div className="hero-text" style={{ position: "relative", zIndex: 2 }}>
          <span className="eyebrow" style={{ color: "var(--neon-cyan)", textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
            NEXT-GEN SPORTS PLATFORM
          </span>
          <h1 className="hero-title" style={{ fontSize: "58px", fontWeight: 800, lineHeight: 1.1, marginTop: "10px" }}>
            <span className="gradient-text-cyan">Manage Pickleball</span><br />
            <span className="gradient-text-orange">Tournaments Like a Pro</span>
          </h1>
          <p className="hero-desc" style={{ fontSize: "16px", color: "var(--ink-muted)", marginTop: "20px", maxWidth: "540px", lineHeight: 1.6 }}>
            Organize tournaments, manage players, generate fixtures, track live scores, and view rankings—all from one powerful dashboard.
          </p>
          <div className="hero-actions" style={{ marginTop: "30px" }}>
            <button className="btn btn-primary" onClick={handleHeroAction} style={{ boxShadow: "0 0 15px rgba(0, 240, 255, 0.4)" }}>
              <i className="ti ti-plus" />
              Create Tournament
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate("tournament")} style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
              <i className="ti ti-trophy" />
              View Tournaments
            </button>
          </div>
        </div>

        {/* 3D Visual Scene replaced with the user's sunset pickleball image */}
        <div className="hero-visual">
          <div className="glow-circle" />
          <motion.img 
            src={heroPaddleImg} 
            alt="DinkSync Pickleball Court and Paddle"
            style={{ 
              maxWidth: "100%", 
              maxHeight: "380px", 
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 240, 255, 0.15)",
              objectFit: "cover",
              zIndex: 2
            }}
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </div>
      </section>

      {/* Stats Quick Strip */}
      <section className="stat-strip" style={{ position: "relative", zIndex: 2, background: "rgba(10,12,10,0.8)", borderTop: "1px solid var(--hairline)" }}>
        {stats.map((s, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-icon" style={{ background: "rgba(0, 240, 255, 0.08)", color: "var(--neon-cyan)" }}>
              <i className={`ti ${s.icon}`} />
            </span>
            <div>
              <h4 style={{ fontWeight: 600, color: "var(--ink)" }}>{s.title}</h4>
              <p style={{ color: "var(--ink-muted)", fontSize: "12px" }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Redesigned Cards Section (Utilizing Cropped Screenshot Cards) */}
      <section className="home-cards-section" style={{ padding: "80px 24px", position: "relative", zIndex: 2 }}>
        <div className="section-head" style={{ textAlign: "center", marginBottom: "50px" }}>
          <span className="eyebrow" style={{ color: "var(--neon-orange)" }}>EVENT BRACKETS</span>
          <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Featured Match Operations</h2>
          <p style={{ color: "var(--ink-muted)" }}>Explore live, setup, and upcoming matches across active brackets.</p>
        </div>

        <div className="hero-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", flexDirection: "row" }}>
          {cards.map((c, i) => (
            <div key={i} className={`hero-card glass-card ${c.featured ? "featured" : ""}`} style={{ padding: "0px" }}>
              <div 
                className="hero-card-img" 
                style={{ 
                  backgroundImage: `url(${c.img})`, 
                  height: "200px", 
                  borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative"
                }}
              >
                {/* Overlay Badge */}
                <span 
                  style={{ 
                    position: "absolute", 
                    top: "15px", 
                    left: "15px", 
                    background: "#080a08",
                    border: `1px solid ${c.badgeColor}`,
                    color: c.badgeColor,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", background: c.badgeColor, borderRadius: "50%" }}></span>
                  {c.badge}
                </span>
                <span className="card-heart">
                  <i className="ti ti-heart" />
                </span>
              </div>
              <div style={{ padding: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)" }}>{c.title}</h3>
                <p style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "8px", lineHeight: 1.5 }}>{c.desc}</p>
                {c.featured && (
                  <button className="swipe-link" onClick={() => onNavigate("tournament")} style={{ marginTop: "16px" }}>
                    View Brackets <i className="ti ti-arrow-right" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Futuristic Dashboard Preview Mockup Section */}
      <section className="dashboard-preview-section" style={{ padding: "40px 24px 80px", position: "relative", zIndex: 2 }}>
        <div className="section-head" style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="eyebrow" style={{ color: "var(--neon-cyan)" }}>ANALYTICS PREVIEW</span>
          <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Futuristic Club Dashboard</h2>
          <p style={{ color: "var(--ink-muted)" }}>Control fixtures, match calendars, and statistics dynamically.</p>
        </div>

        <div className="dashboard-preview-widget">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="ti ti-device-gamepad-2" style={{ fontSize: "20px", color: "var(--neon-cyan)" }} />
              <span style={{ fontWeight: 600, fontSize: "15px" }}>Live Bracket Management console</span>
            </div>
            <div className="live-indicator">LIVE FEED</div>
          </div>

          <div className="widget-grid">
            {/* Main chart widget */}
            <div className="widget-main">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--ink-muted)" }}>Player Signups Growth</span>
                <span style={{ fontSize: "12px", color: "var(--neon-cyan)" }}>+24% this week</span>
              </div>
              <div className="chart-container-mock">
                <div className="chart-bar-mock" style={{ height: "40%" }} />
                <div className="chart-bar-mock" style={{ height: "65%" }} />
                <div className="chart-bar-mock accent-bar" style={{ height: "85%" }} />
                <div className="chart-bar-mock" style={{ height: "50%" }} />
                <div className="chart-bar-mock" style={{ height: "70%" }} />
                <div className="chart-bar-mock" style={{ height: "95%" }} />
                <div className="chart-bar-mock accent-bar" style={{ height: "80%" }} />
              </div>
            </div>

            {/* Sidebar widgets */}
            <div className="widget-sidebar">
              <div className="mini-widget">
                <span style={{ fontSize: "11px", color: "var(--ink-subtle)", textTransform: "uppercase" }}>Total Prize Pools</span>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginTop: "5px" }}>₹1,50,000</div>
              </div>
              <div className="mini-widget">
                <span style={{ fontSize: "11px", color: "var(--ink-subtle)", textTransform: "uppercase" }}>Active Courts</span>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--neon-cyan)", marginTop: "5px" }}>12 Courts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings Leaderboard Section */}
      <section id="rankings" className="rankings-section" style={{ padding: "80px 24px", position: "relative", zIndex: 2, background: "rgba(10,12,10,0.4)" }}>
        <div className="section-head" style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>LEADERBOARD</span>
          <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Top Club Standings</h2>
          <p style={{ color: "var(--ink-muted)" }}>Rankings are recalculated instantly after every bracket submission.</p>
        </div>

        <div style={{ maxWidth: "700px", margin: "0 auto" }} className="glass-card">
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.01)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Active Player Standings</h3>
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div className="ranking-list-mock">
              {leaderboard.map((player) => (
                <div className="ranking-item-mock" key={player.rank}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span className={`rank-badge ${
                      player.medal === 'gold' ? 'rank-gold' : 
                      player.medal === 'silver' ? 'rank-silver' : 
                      player.medal === 'bronze' ? 'rank-bronze' : 'rank-normal'
                    }`}>
                      {player.medal !== 'none' ? <i className="ti ti-trophy" /> : player.rank}
                    </span>
                    <span style={{ fontWeight: 500 }}>{player.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "13px" }}>
                    <span style={{ color: "var(--ink-muted)" }}>{player.wins} Wins</span>
                    <span style={{ color: "var(--neon-cyan)" }}>{player.rate} WR</span>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>{player.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section" style={{ padding: "80px 24px", position: "relative", zIndex: 2 }}>
        <div className="section-head" style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="eyebrow" style={{ color: "var(--neon-cyan)" }}>GALLERY</span>
          <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Arena Action Shots</h2>
          <p style={{ color: "var(--ink-muted)" }}>Moments captured live from championship tournaments.</p>
        </div>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <GalleryCarousel />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section" style={{ padding: "80px 24px", position: "relative", zIndex: 2 }}>
        <div className="section-head" style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="eyebrow" style={{ color: "var(--neon-orange)" }}>TESTIMONIALS</span>
          <h2 style={{ fontSize: "36px", fontWeight: 700 }}>What Players Say</h2>
          <p style={{ color: "var(--ink-muted)" }}>Stories of competition, passion, and seamless coordination.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "30px" }}>
            <div style={{ display: "flex", color: "#fbbf24", gap: "4px", marginBottom: "15px" }}>
              {[...Array(5)].map((_, i) => <i key={i} className="ti ti-star-filled" />)}
            </div>
            <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.6 }}>
              "DinkSync completely changed how we run our weekly mixers. Brackets are ready in seconds and players love the live scoring system."
            </p>
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)" }} />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 600 }}>Kabir Malhotra</h4>
                <span style={{ fontSize: "11px", color: "var(--ink-subtle)" }}>Indore Pickleball Club Organizer</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "30px" }}>
            <div style={{ display: "flex", color: "#fbbf24", gap: "4px", marginBottom: "15px" }}>
              {[...Array(5)].map((_, i) => <i key={i} className="ti ti-star-filled" />)}
            </div>
            <p style={{ fontStyle: "italic", fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.6 }}>
              "As a player, being able to track brackets live from my phone courtside is amazing. No more guessing when my next round starts."
            </p>
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #bef264 0%, #84cc16 100%)" }} />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 600 }}>Riya Sharma</h4>
                <span style={{ fontSize: "11px", color: "var(--ink-subtle)" }}>Tournament Player</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Footer Section */}
      <footer id="contact" style={{ background: "rgba(10,12,10,0.95)", borderTop: "1px solid var(--hairline)", padding: "60px 40px 30px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "var(--primary)", fontSize: "22px" }}><i className="ti ti-ball-tennis" /></span>
              <span style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "1px" }}>DinkSync</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-subtle)", marginTop: "15px", lineHeight: 1.6 }}>
              Next-generation tournament management built to synchronize pickleball play.
            </p>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 600, marginBottom: "15px" }}>Quick Links</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <li><button onClick={() => onNavigate("home")} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0 }}>Home</button></li>
              <li><button onClick={() => onNavigate("features")} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0 }}>Features</button></li>
              <li><button onClick={() => onNavigate("tournament")} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0 }}>Tournaments</button></li>
              <li><button onClick={() => onNavigate("pricing")} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0 }}>Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 600, marginBottom: "15px" }}>Contact Info</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "var(--ink-muted)" }}>
              <li><i className="ti ti-mail" /> support@dinksync.com</li>
              <li><i className="ti ti-map-pin" /> Indore, MP, India</li>
              <li><i className="ti ti-phone" /> +91 98765 43210</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#fff", fontWeight: 600, marginBottom: "15px" }}>Newsletter</h4>
            <p style={{ fontSize: "12px", color: "var(--ink-subtle)", marginBottom: "12px" }}>Stay updated on local slammings & tournament alerts.</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="email" placeholder="Your email" className="text-input" style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" }} />
              <button className="btn btn-primary" style={{ padding: "8px 16px" }}><i className="ti ti-arrow-right" /></button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "40px", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1200px", margin: "40px auto 0", fontSize: "12px", color: "var(--ink-tertiary)" }}>
          <span>© {new Date().getFullYear()} DinkSync. All rights reserved.</span>
          <div style={{ display: "flex", gap: "15px" }}>
            <a href="#" style={{ color: "var(--ink-tertiary)" }}><i className="ti ti-brand-twitter" /></a>
            <a href="#" style={{ color: "var(--ink-tertiary)" }}><i className="ti ti-brand-instagram" /></a>
            <a href="#" style={{ color: "var(--ink-tertiary)" }}><i className="ti ti-brand-facebook" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
