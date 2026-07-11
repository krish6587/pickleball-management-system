"use client";

import React from "react";
import { motion } from "framer-motion";
import SpotlightBackground from "@/components/ui/spotlight-background";

const DemoOne = () => {
  return (
    <SpotlightBackground>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="spotlight-inner"
      >
        <h1 className="spotlight-title">
          Spotlight Background
        </h1>
        <p className="spotlight-description">
          A dramatic and eye-catching animated background effect.
        </p>
        <button className="spotlight-button">
          Get Started
        </button>
      </motion.div>
    </SpotlightBackground>
  );
};

export default DemoOne;
