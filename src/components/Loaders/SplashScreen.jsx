import React from "react";
import { motion } from "framer-motion";
import logo from "../../images/logo.png";

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #6b5aad 0%, #4a3d7d 55%, #2e2550 100%)",
      }}
    >
      {/* Radial centre glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 38% at 50% 46%, rgba(185,175,219,0.22) 0%, transparent 70%)",
        }}
      />

      {/* Decorative blobs */}
      <div
        className="absolute top-[10%] left-[8%] w-44 h-44 rounded-full blur-3xl"
        style={{ background: "rgba(162,148,207,0.25)" }}
      />
      <div
        className="absolute bottom-[12%] right-[6%] w-56 h-56 rounded-full blur-3xl"
        style={{ background: "rgba(93,77,155,0.35)" }}
      />

      {/* --- Content group: springs in as one unit --- */}
      <motion.div
        initial={{ scale: 0.78, opacity: 0, y: 20 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 24 },
        }}
        className="relative flex flex-col items-center"
      >
        {/* Logo — object-contain so the full circle + text inside is visible */}
        <div
          style={{
            width: 136,
            height: 136,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 0 0 6px rgba(255,255,255,0.18), 0 20px 56px rgba(0,0,0,0.32)",
            overflow: "hidden",
          }}
        >
          <img
            src={logo}
            alt="Pawppy"
            style={{
              width: "88%",
              height: "88%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* App name — visible immediately, no extra delay */}
        <p
          style={{
            marginTop: 22,
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.07em",
            lineHeight: 1,
          }}
        >
          pawppy
        </p>

        {/* Tagline — visible immediately */}
        <p
          style={{
            marginTop: 6,
            color: "#d1cae7",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Pet Resources Finder
        </p>
      </motion.div>

      {/* Loading dots */}
      <div className="absolute flex gap-2" style={{ bottom: 72 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              display: "block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.45)",
            }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1.25, 0.75] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default SplashScreen;
