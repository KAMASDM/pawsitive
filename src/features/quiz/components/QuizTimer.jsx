import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * Circular countdown timer.
 * Props: total (seconds), remaining (seconds), warning threshold (default 5s)
 */
export default function QuizTimer({ remaining, total = 10, warning = 5 }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const fraction = remaining / total;
  const dashOffset = circumference * (1 - fraction);
  const isWarning = remaining <= warning;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 absolute inset-0">
        {/* Background circle */}
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" stroke={isWarning ? "#fecaca" : "#ede9fe"} />
        {/* Progress arc */}
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          strokeWidth="4"
          stroke={isWarning ? "#ef4444" : "#7c3aed"}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>
      <motion.span
        key={remaining}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`relative text-base font-black ${isWarning ? "text-red-500" : "text-violet-700"}`}
      >
        {remaining}
      </motion.span>
    </div>
  );
}
