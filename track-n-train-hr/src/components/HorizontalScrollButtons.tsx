"use client";
import React, { useRef, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface HorizontalScrollButtonsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  darkMode: boolean;
}

export default function HorizontalScrollButtons({ containerRef, darkMode }: HorizontalScrollButtonsProps) {
  const { isMobile, isTablet } = useResponsive();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScrollState = () => {
    if (!containerRef.current) return;
    
    const element = containerRef.current;
    const hasOverflow = element.scrollWidth > element.clientWidth;
    const scrollLeft = element.scrollLeft;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    
    setIsScrollable(hasOverflow);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScrollLeft);
    
    console.log('📊 Scroll State:', {
      hasOverflow,
      scrollLeft,
      maxScrollLeft,
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < maxScrollLeft
    });
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    checkScrollState();

    const handleScroll = () => checkScrollState();
    const handleResize = () => checkScrollState();

    element.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Check again after a short delay to ensure table is rendered
    const timer = setTimeout(checkScrollState, 500);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [containerRef]);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Only show on mobile/tablet when scrollable
  if (!isScrollable || (!isMobile && !isTablet)) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      zIndex: 20,
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 10px'
    }}>
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          style={{
            pointerEvents: 'auto',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
          }}
          aria-label="Scroll left"
        >
          ◀
        </button>
      )}

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          style={{
            pointerEvents: 'auto',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(59, 130, 246, 0.9)',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s ease',
            transform: 'scale(1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(59, 130, 246, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.9)';
          }}
          aria-label="Scroll right"
        >
          ▶
        </button>
      )}
    </div>
  );
}
