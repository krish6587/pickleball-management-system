import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Home from "../components/Home";
import Features from "../components/Features";
import Tournament from "../components/Tournament";
import Pricing from "../components/Pricing";

export default function Landing() {
  const [page, setPage] = useState("home");
  const location = useLocation();

  // Handle cross-page navigation triggers back to specific landing page tabs
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setPage(location.state.activeTab);
      if (location.state.scrollTo) {
        setTimeout(() => {
          const el = document.getElementById(location.state.scrollTo);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
      // Clear navigation state to avoid re-triggering on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="app">
      <Navbar active={page} onNavigate={setPage} />
      <main style={{ position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {page === "home" && <Home onNavigate={setPage} />}
            {page === "features" && <Features />}
            {page === "tournament" && <Tournament onNavigate={setPage} />}
            {page === "pricing" && <Pricing />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
