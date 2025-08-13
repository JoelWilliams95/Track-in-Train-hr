"use client";
import React from 'react';
import { getColors } from '@/lib/colors';
import { useModal } from '@/contexts/ModalContext';

interface FloatingAddProfileButtonProps {
  darkMode: boolean;
  onClick: () => void;
}

export default function FloatingAddProfileButton({ darkMode, onClick }: FloatingAddProfileButtonProps) {
  const colors = getColors(darkMode);
  const { canOpenModal } = useModal();
  const isDisabled = !canOpenModal();

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      className="floating-add-profile-button"
      style={{
        position: 'fixed',
        bottom: 'clamp(20px, 5vw, 30px)',
        left: 'clamp(20px, 5vw, 30px)',
        width: 'auto',
        minWidth: '140px',
        height: 'clamp(55px, 12vw, 65px)',
        borderRadius: 'clamp(27px, 6vw, 32px)',
        border: 'none',
        background: isDisabled
          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        fontSize: 'clamp(13px, 3vw, 15px)',
        fontWeight: '600',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(6px, 1.5vw, 8px)',
        padding: '0 clamp(16px, 4vw, 20px)',
        boxShadow: '0 6px 25px rgba(16, 185, 129, 0.4)',
        zIndex: 1002, // Higher than other floating buttons
        transition: 'all 0.3s ease',
        transform: 'scale(1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        // Pulsing animation to draw attention
        animation: 'addProfilePulse 3s ease-in-out infinite 2s'
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.4)';
        }
      }}
      onTouchStart={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      }}
      onTouchEnd={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      aria-label="Add new profile"
      title="Add New Profile"
    >
      <span style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>👤</span>
      <span>Add Profile</span>
    </button>
  );
}
