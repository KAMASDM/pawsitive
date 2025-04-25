// src/hooks/useResponsive.js
import { useState, useEffect } from 'react';

/**
 * A hook that returns responsive breakpoint indicators and screen dimensions
 * @returns {Object} Object containing responsive indicators and dimensions
 */
const useResponsive = () => {
  // Initialize with default window dimensions or fallback values for SSR
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    // Exit early if window is not defined (SSR)
    if (typeof window === 'undefined') return;

    // Handler to call on window resize
    const handleResize = () => {
      // Update dimensions
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  // Return dimensions and responsive breakpoint indicators
  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile: dimensions.width < 640,
    isTablet: dimensions.width >= 640 && dimensions.width < 1024,
    isDesktop: dimensions.width >= 1024,
    isLargeDesktop: dimensions.width >= 1280,
    // Breakpoints matching Tailwind CSS defaults
    breakpoints: {
      sm: dimensions.width >= 640,
      md: dimensions.width >= 768,
      lg: dimensions.width >= 1024,
      xl: dimensions.width >= 1280,
      '2xl': dimensions.width >= 1536,
    },
  };
};

export default useResponsive;