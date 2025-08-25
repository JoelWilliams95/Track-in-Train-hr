"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS, BUTTON_COLORS } from "@/lib/colors";

export default function LoginFormClient() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop size

  // Check for dark mode and window size on component mount
  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);

    // Handle window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const response = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);

        // Store in sessionStorage as backup for immediate UI updates
        sessionStorage.setItem('userName', result.userName);

        // Dispatch custom event to notify header of login
        window.dispatchEvent(new CustomEvent('userLogin', {
          detail: { userName: result.userName }
        }));

        // Use window.location.href for full page reload to ensure server-side cookies are read
        setTimeout(() => {
          window.location.href = result.redirectTo || '/profiles';
        }, 800);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: darkMode ? `${COLORS.ULTIMATE_GREY}F0` : `${COLORS.WHITE}F5`,
      backdropFilter: 'blur(20px)',
      padding: windowWidth <= 576 ? '20px' : windowWidth <= 768 ? '30px' : '40px',
      borderRadius: windowWidth <= 576 ? '12px' : '16px',
      boxShadow: darkMode
        ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        : '0 20px 60px rgba(28, 28, 28, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      width: '100%',
      maxWidth: windowWidth <= 576 ? '90vw' : windowWidth <= 768 ? '400px' : '480px',
      display: 'flex',
      flexDirection: 'column',
      gap: windowWidth <= 576 ? '12px' : '16px',
      border: darkMode ? `1px solid ${COLORS.ULTIMATE_GREY}` : `1px solid ${COLORS.ULTIMATE_GREY}80`,
      margin: windowWidth <= 576 ? '10px' : '20px'
    }}>
      <h1 style={{
        fontSize: windowWidth <= 576 ? '24px' : windowWidth <= 768 ? '28px' : '32px',
        fontWeight: 'bold',
        marginBottom: windowWidth <= 576 ? '12px' : '16px',
        textAlign: 'center',
        color: darkMode ? COLORS.WHITE : COLORS.BLACK,
        backgroundImage: `linear-gradient(135deg, ${COLORS.ORANGE_RELATS} 0%, ${COLORS.ORANGE_2} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>User Login</h1>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        style={{
          border: darkMode ? `1px solid ${COLORS.ULTIMATE_GREY}` : `1px solid #e5e7eb`,
          borderRadius: '8px',
          padding: '12px 16px',
          backgroundColor: darkMode ? '#374151' : COLORS.WHITE,
          color: darkMode ? COLORS.WHITE : COLORS.BLACK,
          fontSize: '16px',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = COLORS.ORANGE_RELATS}
        onBlur={(e) => e.target.style.borderColor = COLORS.ULTIMATE_GREY}
        autoComplete="email"
        disabled={isLoading}
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        style={{
          border: darkMode ? `1px solid ${COLORS.ULTIMATE_GREY}` : `1px solid #e5e7eb`,
          borderRadius: '8px',
          padding: '12px 16px',
          backgroundColor: darkMode ? '#374151' : COLORS.WHITE,
          color: darkMode ? COLORS.WHITE : COLORS.BLACK,
          fontSize: '16px',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => e.target.style.borderColor = COLORS.ORANGE_RELATS}
        onBlur={(e) => e.target.style.borderColor = COLORS.ULTIMATE_GREY}
        autoComplete="current-password"
        disabled={isLoading}
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        style={{
          backgroundColor: BUTTON_COLORS.PRIMARY.BACKGROUND,
          color: BUTTON_COLORS.PRIMARY.TEXT,
          borderRadius: '8px',
          padding: '12px 16px',
          fontWeight: '600',
          fontSize: '16px',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = BUTTON_COLORS.PRIMARY.HOVER;
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = BUTTON_COLORS.PRIMARY.BACKGROUND;
          }
        }}
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        )}
        {isLoading ? 'Logging in...' : isSuccess ? 'Success! Redirecting...' : 'Login'}
      </button>

      {isSuccess && (
        <div style={{
          color: COLORS.GREEN,
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          ✓ Login successful! Redirecting...
        </div>
      )}

      {error && (
        <div style={{
          color: '#DC2626',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Sign-up message */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: darkMode
          ? 'rgba(30, 41, 59, 0.9)'
          : 'rgba(248, 250, 252, 0.95)',
        border: darkMode
          ? `2px solid rgba(59, 130, 246, 0.5)`
          : `2px solid rgba(59, 130, 246, 0.3)`,
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: darkMode
          ? '0 8px 25px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 8px 25px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{
          margin: 0,
          fontSize: '15px',
          color: darkMode ? '#f1f5f9' : '#1e293b',
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          For signing up, refer to{' '}
          <strong style={{
            color: darkMode ? '#60a5fa' : '#2563eb',
            fontWeight: '700'
          }}>
            Mr. Nawfal Ait Amran
          </strong>{' '}
          for him to create your user at{' '}
          <a
            href="mailto:naamran@relats.com"
            style={{
              color: darkMode ? '#60a5fa' : '#2563eb',
              textDecoration: 'underline',
              fontWeight: '600',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = darkMode ? '#93c5fd' : '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = darkMode ? '#60a5fa' : '#2563eb';
            }}
          >
            naamran@relats.com
          </a>
        </p>
      </div>
    </form>
  );
}