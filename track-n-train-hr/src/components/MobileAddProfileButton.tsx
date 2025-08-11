"use client";
import React from 'react';
import { getColors } from '@/lib/colors';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileAddProfileButtonProps {
  darkMode: boolean;
  onClick: () => void;
}

export default function MobileAddProfileButton({ darkMode, onClick }: MobileAddProfileButtonProps) {
  const colors = getColors(darkMode);
  const { isMobile, isTablet, isMediumDesktop } = useResponsive();

  // Show on mobile, tablet, and medium desktop (≤1293px) - hide on large desktop only
  if (!isMobile && !isTablet && !isMediumDesktop) {
    return null;
  }

  // Add pulsing animation to draw attention
  const pulseStyle = {
    animation: 'mobilePulse 3s ease-in-out infinite 2s' // Start pulsing after 2 seconds
  };

  return (
    <button
      onClick={onClick}
      className="mobile-add-profile-floating"
      style={{
        position: 'fixed',
        bottom: 'clamp(20px, 5vw, 30px)',
        left: 'clamp(15px, 4vw, 25px)',
        width: 'auto',
        minWidth: '120px',
        height: 'clamp(50px, 12vw, 60px)',
        borderRadius: 'clamp(25px, 6vw, 30px)',
        border: 'none',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        fontSize: 'clamp(12px, 3vw, 14px)',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(4px, 1vw, 6px)',
        padding: '0 clamp(12px, 3vw, 16px)',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
        zIndex: 1001, // Above everything including scrollable content
        transition: 'all 0.3s ease',
        transform: 'scale(1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        ...pulseStyle
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.4)';
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      aria-label="Add new profile"
    >
      <span style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}>👤</span>
      <span>Add Profile</span>
    </button>
  );
}
