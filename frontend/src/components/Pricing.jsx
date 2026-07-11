import React from "react";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Player",
      price: "Free",
      desc: "For players who want to join tournaments.",
      features: ["Join unlimited tournaments", "Live bracket tracking", "Match notifications"],
    },
    {
      name: "Club",
      price: "Free (Beta)",
      desc: "For clubs running regular tournaments during beta.",
      features: ["Everything in Player", "Bracket builder", "Smart scheduling", "Up to 200 players"],
      featured: true,
    },
    {
      name: "Federation",
      price: "Contact Us",
      desc: "For large-scale, multi-club events.",
      features: ["Everything in Club", "Unlimited players", "Dedicated support", "Custom branding"],
    },
  ];

  const handleSignup = () => {
    navigate("/register");
  };

  return (
    <section className="pricing-page" style={{ position: "relative", zIndex: 2, padding: "80px 24px" }}>
      <div className="section-head" style={{ textAlign: "center", marginBottom: "50px" }}>
        <span className="eyebrow" style={{ color: "var(--neon-cyan)" }}>Pricing</span>
        <h2 style={{ fontSize: "36px", fontWeight: 700 }}>Simple plans for every club</h2>
        <p style={{ color: "var(--ink-muted)" }}>Start free. Upgrade when you're ready to run bigger tournaments.</p>
      </div>

      <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        {plans.map((p, i) => (
          <div 
            className={`pricing-card glass-card ${p.featured ? "featured" : ""}`} 
            key={i}
            style={{ 
              position: "relative",
              padding: "40px 30px",
              border: p.featured ? "1px solid var(--primary) !important" : "1px solid var(--glass-border) !important",
              boxShadow: p.featured ? "0 8px 30px rgba(190, 242, 100, 0.1)" : "var(--glass-shadow)"
            }}
          >
            {p.featured && (
              <span 
                className="pricing-badge" 
                style={{ 
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "var(--primary)",
                  color: "var(--canvas)",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "20px"
                }}
              >
                Most popular
              </span>
            )}
            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)" }}>{p.name}</h3>
            <div className="price" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: "20px 0 10px" }}>{p.price}</div>
            <p className="pricing-desc" style={{ color: "var(--ink-muted)", fontSize: "13px", lineHeight: 1.5, marginBottom: "25px" }}>{p.desc}</p>
            
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 35px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--ink-muted)" }}>
              {p.features.map((f, j) => (
                <li key={j} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="ti ti-check" style={{ color: p.featured ? "var(--primary)" : "var(--neon-cyan)" }} /> {f}
                </li>
              ))}
            </ul>
            
            <button 
              className="signup-btn full-width" 
              onClick={handleSignup}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "var(--radius-pill)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: p.featured ? "var(--primary)" : "rgba(255,255,255,0.05)",
                color: p.featured ? "var(--canvas)" : "#fff",
                transition: "all 0.3s"
              }}
            >
              Sign up
              <i className="ti ti-arrow-right" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
