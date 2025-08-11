import { useState, useEffect } from 'react';

interface ScreenSize {
  isMobile: boolean;
  isTablet: boolean;
  isMediumDesktop: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export function useResponsive(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isMediumDesktop: false,
    isDesktop: true,
    width: 1200,
    height: 800
  });

  useEffect(() => {
    function updateScreenSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        isMobile: width <= 576,
        isTablet: width > 576 && width <= 768,
        isMediumDesktop: width > 768 && width <= 1293,
        isDesktop: width > 1293,
        width,
        height
      });
    }

    // Set initial size
    updateScreenSize();

    // Add event listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}
