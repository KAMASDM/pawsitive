import React from "react";

const PawMark = ({ size = 96, color = "currentColor", className = "", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill={color}
    className={className}
    style={style}
    aria-hidden="true"
  >
    <ellipse cx="16" cy="14" rx="7" ry="9" />
    <ellipse cx="32" cy="10" rx="7" ry="9" />
    <ellipse cx="48" cy="14" rx="7" ry="9" />
    <ellipse cx="8" cy="28" rx="6" ry="8" />
    <path d="M32 56C14 56 10 38 14 30C18 22 46 22 50 30C54 38 50 56 32 56Z" />
  </svg>
);

export default PawMark;
