import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ active, onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { id: "home", label: "Home" },
    { id: "features", label: "Features" },
    { id: "tournament", label: "Tournaments" },
    { id: "rankings", label: "Rankings" },
    { id: "pricing", label: "Pricing" },
    { id: "contact", label: "Contact" },
  ];

  const handleLinkClick = (id) => {
    if (id === "rankings" || id === "contact") {
      if (onNavigate) {
        onNavigate("home");
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        navigate("/", { state: { activeTab: "home", scrollTo: id } });
      }
      return;
    }

    if (onNavigate) {
      onNavigate(id);
    } else {
      // Cross-page navigation back to landing page with target tab in state
      navigate("/", { state: { activeTab: id } });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBrandClick = () => {
    if (onNavigate) {
      onNavigate("home");
    } else {
      navigate("/");
    }
  };

  return (
    <header className="navbar navbar-glass-overlay">
      <div className="navbar-inner">
        <div className="brand" onClick={handleBrandClick}>
          <span className="brand-mark">
            <i className="ti ti-ball-tennis" />
          </span>
          <div className="brand-text">
            <span className="brand-name">DinkSync</span>
            <span className="brand-sub">Pickleball Tournament Management</span>
          </div>
        </div>

        {!user && (
          <nav className={`nav-links ${isOpen ? "open" : ""}`}>
            {links.map((link) => (
              <button
                key={link.id}
                className={`nav-link ${active === link.id ? "active" : ""}`}
                onClick={() => {
                  handleLinkClick(link.id);
                  setIsOpen(false);
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {!user && (
          <button className="mobile-nav-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            <i className={isOpen ? "ti ti-x" : "ti ti-menu-2"} />
          </button>
        )}

        {user ? (
          <div className="profile-section-nav">
            <div className="profile-info-nav">
              <i className="ti ti-user" style={{ fontSize: '16px', color: 'var(--text-muted)' }} />
              <span className="username-nav">{user.username}</span>
              <span className={`badge ${user.role === 'Admin' ? 'badge-open' : 'badge-closed'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                {user.role}
              </span>
            </div>

            {user.role === 'Admin' && (
              <button 
                className="btn btn-sm" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigate("/create-tournament")}
              >
                <i className="ti ti-plus" />
                Create
              </button>
            )}

            <button 
              className="signup-btn" 
              style={{ padding: '8px 14px', background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(185, 28, 28, 0.2)', boxShadow: 'none' }}
              onClick={handleLogout}
            >
              <i className="ti ti-logout" />
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="nav-link" 
              style={{ fontWeight: 700 }}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button className="signup-btn" onClick={() => navigate("/register")}>
              Sign up
              <i className="ti ti-arrow-right" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
