import { useState, useEffect } from "react";

const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: dimensions.width < 640,
    isTablet: dimensions.width >= 640 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    isLargeDesktop: dimensions.width >= 1280,
    breakpoints: {
      sm: dimensions.width >= 640,
      md: dimensions.width >= 768,
      lg: dimensions.width >= 1024,
      xl: dimensions.width >= 1280,
      "2xl": dimensions.width >= 1536,
    },
  };
};

export default useResponsive;