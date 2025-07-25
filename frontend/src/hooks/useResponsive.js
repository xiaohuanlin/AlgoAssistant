import { useState, useEffect } from 'react';
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export const useResponsive = () => {
  const breakpoints = useBreakpoint();

  // Mobile-first approach
  const isMobile = breakpoints.xs && !breakpoints.sm;
  const isTablet = breakpoints.sm || breakpoints.md;
  const isDesktop = breakpoints.lg || breakpoints.xl || breakpoints.xxl;

  // Layout mode detection
  const getLayoutMode = () => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  };

  // Responsive dimensions
  const getChartHeight = () => {
    if (isMobile) return 200;
    if (isTablet) return 250;
    return 300;
  };

  // Grid gutter based on screen size
  const getCardGutter = () => {
    if (isMobile) return [12, 12];
    if (isTablet) return [16, 16];
    return [24, 24];
  };

  // Touch target sizes
  const getTouchTargetSize = () => ({
    minHeight: isMobile ? 44 : 32,
    minWidth: isMobile ? 44 : 32
  });

  // Container padding
  const getContainerPadding = () => {
    if (isMobile) return 16;
    if (isTablet) return 20;
    return 24;
  };

  return {
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    layoutMode: getLayoutMode(),
    chartHeight: getChartHeight(),
    cardGutter: getCardGutter(),
    touchTargetSize: getTouchTargetSize(),
    containerPadding: getContainerPadding()
  };
};

export const useViewportSize = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Hook for detecting if component is visible (for lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetRef, setTargetRef] = useState(null);

  useEffect(() => {
    if (!targetRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      ...options
    });

    observer.observe(targetRef);

    return () => observer.disconnect();
  }, [targetRef, options]);

  return [setTargetRef, isVisible];
};
