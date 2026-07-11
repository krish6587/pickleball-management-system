import React from "react";

export default function Features() {
  const features = [
    {
      icon: "ti-git-branch",
      title: "Bracket builder",
      desc: "Generate single, double elimination, or round-robin brackets in seconds.",
    },
    {
      icon: "ti-calendar-time",
      title: "Smart scheduling",
      desc: "Auto-assign match times and courts while avoiding player conflicts.",
    },
    {
      icon: "ti-chart-bar",
      title: "Live standings",
      desc: "Scores and rankings update in real time as matches finish.",
    },
    {
      icon: "ti-users",
      title: "Player registration",
      desc: "Online sign-ups, skill ratings, and team management in one place.",
    },
    {
      icon: "ti-bell-ringing",
      title: "Match notifications",
      desc: "Players get notified the moment their next match is ready.",
    },
    {
      icon: "ti-device-mobile",
      title: "Mobile friendly",
      desc: "Run an entire tournament from your phone, courtside.",
    },
  ];

  return (
    <section className="features-page" style={{ position: "relative", zIndex: 2, padding: "80px 24px" }}>
      <div className="section-head" style={{ textAlign: "center", marginBottom: "50px" }}>
        <span className="eyebrow" style={{ color: "var(--neon-cyan)" }}>Features</span>
        <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Everything you need to run a tournament</h2>
        <p style={{ color: "var(--ink-muted)" }}>DinkSync handles the logistics so you can focus on the game.</p>
      </div>

      <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {features.map((f, i) => (
          <div className="feature-card glass-card" key={i}>
            <span className="feature-icon-glass">
              <i className={`ti ${f.icon}`} />
            </span>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>{f.title}</h3>
            <p style={{ color: "var(--ink-muted)", fontSize: "13px", lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
