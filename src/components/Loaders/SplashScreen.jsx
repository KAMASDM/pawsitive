import React from "react";
import { motion } from "framer-motion";
import logo from "../../images/logo.png";

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(145deg, #5d4d9b 0%, #4a3d7d 50%, #372c5e 100%)",
      }}
    >
      {/* Radial glow behind logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 48%, rgba(162,148,207,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Decorative blurred blobs */}
      <div
        className="absolute top-[12%] left-[10%] w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: "#b9afdb" }}
      />
      <div
        className="absolute bottom-[14%] right-[8%] w-52 h-52 rounded-full opacity-15 blur-3xl"
        style={{ background: "#8b79c3" }}
      />

      {/* Logo card */}
      <motion.div
        initial={{ scale: 0.72, opacity: 0, y: 24 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 320, damping: 26, delay: 0.06 },
        }}
        className="relative flex flex-col items-center"
      >
        {/* Logo image in a glowing white ring */}
        <div
          className="rounded-full p-1.5"
          style={{
            background: "rgba(255,255,255,0.12)",
            boxShadow:
              "0 0 0 1.5px rgba(255,255,255,0.25), 0 16px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          <img
            src={logo}
            alt="Pawppy"
            className="w-28 h-28 rounded-full object-cover"
            style={{ background: "#fff" }}
          />
        </div>

        {/* App name */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.28, duration: 0.3, ease: "easeOut" },
          }}
          className="mt-5 text-white font-display font-semibold text-2xl tracking-wide"
          style={{ letterSpacing: "0.06em" }}
        >
          pawppy
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { delay: 0.42, duration: 0.3 },
          }}
          className="mt-1 text-lavender-200 text-[13px] tracking-widest uppercase font-medium"
          style={{ letterSpacing: "0.18em", color: "#d1cae7" }}
        >
          Pet Resources Finder
        </motion.p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.55 } }}
        className="absolute bottom-16 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.5)" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
