"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import LogsViewer from "./LogsViewer";
import { Logger } from "@/lib/logger";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

export default function Header({ userPhoto, userName: initialUserName }: { userPhoto?: string; userName?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const darkMode = (resolvedTheme === "dark");
  const router = useRouter();
  const [userName, setUserName] = useState<string | undefined>(initialUserName);
  const [mounted, setMounted] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [showLogs, setShowLogs] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  useEffect(() => setMounted(true), []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('[data-user-dropdown]')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  useEffect(() => {
    // Try to get userName from cookie, fallback to sessionStorage, only if it changes
    if (typeof window !== 'undefined') {
      const cookieName = getCookie('userName');
      if (cookieName && cookieName !== userName) {
        setUserName(decodeURIComponent(cookieName));
      } else if (!cookieName && sessionStorage.getItem('userName') && sessionStorage.getItem('userName') !== userName) {
        setUserName(sessionStorage.getItem('userName') || undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simplified user name detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkUserName = () => {
        const cookieName = getCookie('userName');
        const sessionName = sessionStorage.getItem('userName');

        // Priority: Cookie > SessionStorage > Clear
        if (cookieName && cookieName !== userName) {
          setUserName(decodeURIComponent(cookieName));
        } else if (!cookieName && sessionName && sessionName !== userName) {
          setUserName(sessionName);
        } else if (!cookieName && !sessionName && userName) {
          setUserName(undefined);
        }
      };

      // Handle custom login event for immediate UI updates
      const handleUserLogin = (e: CustomEvent) => {
        if (e.detail?.userName) {
          setUserName(e.detail.userName);
        }
      };

      // Check immediately on mount
      checkUserName();

      // Listen for login events
      window.addEventListener('userLogin', handleUserLogin as EventListener);

      return () => {
        window.removeEventListener('userLogin', handleUserLogin as EventListener);
      };
    }
  }, []); // Remove userName dependency to prevent loops

  // Add scroll effect for header opacity
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 300; // Distance to scroll before header becomes fully transparent
      const opacity = Math.max(0.3, 1 - (scrollY / maxScroll)); // Minimum opacity of 0.3
      setScrollOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    // Log logout before clearing session
    if (userName) {
      await Logger.userLogout(userName);
    }

    // Remove cookies (client-side, best effort)
    if (typeof document !== 'undefined') {
      document.cookie = 'isLoggedIn=; Max-Age=0; path=/; SameSite=lax;';
      document.cookie = 'userName=; Max-Age=0; path=/; SameSite=lax;';
      document.cookie = 'userRole=; Max-Age=0; path=/; SameSite=lax;';
      document.cookie = 'userZone=; Max-Age=0; path=/; SameSite=lax;';
      document.cookie = 'userPermissions=; Max-Age=0; path=/; SameSite=lax;';
    }

    // Remove sessionStorage fallback
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userName');
      sessionStorage.clear(); // Clear all session data
    }

    // Clear userName state immediately
    setUserName(undefined);

    // Use window.location for full page reload to ensure server recognizes logout
    window.location.href = '/login';
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Password changed successfully!');
        setShowChangePasswordModal(false);
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        alert(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    }
  };

  if (!mounted) return null;

  return (
    <header style={{
      width: '100%',
      padding: '0 32px',
      height: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: darkMode
        ? `rgba(24, 25, 26, ${scrollOpacity})`
        : `rgba(255, 255, 255, ${scrollOpacity})`,
      borderBottom: darkMode
        ? `1px solid rgba(51, 51, 51, ${scrollOpacity})`
        : `1px solid rgba(238, 238, 238, ${scrollOpacity})`,
      transition: 'background 0.2s ease-out, border-bottom 0.2s ease-out',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      {/* Left: New relats logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg
          width="80"
          height="25"
          viewBox="0 0 109 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            display: 'block',
            filter: darkMode ? 'none' : 'invert(1)',
            transition: 'filter 0.2s ease'
          }}
        >
          <g style={{ mixBlendMode: 'difference' }}>
            <path
              d="M16.0783 20.4569C17.4055 23.4623 20.4128 25.5601 23.9092 25.5601C25.8115 25.5601 27.3539 27.0976 27.3628 28.9975C27.3718 30.9177 25.7555 32.4768 23.8353 32.4678C16.6034 32.4338 10.6027 27.4355 8.95007 20.7048C8.94113 20.6678 8.93398 20.6309 8.92802 20.5933L8.90716 20.4574M2.01073 4.95418C2.01073 3.04651 3.55724 1.5 5.4649 1.5H15.7947C21.0296 1.5 25.2728 5.74382 25.2728 10.9781C25.2728 16.213 21.029 20.4563 15.7947 20.4563H8.90716M2.01073 4.95418V29.0518C2.01073 30.9565 3.55486 32.5 5.45894 32.5C7.36363 32.5 8.90716 30.9559 8.90716 29.0518V4.95417C8.90716 3.04949 7.36363 1.50595 5.45894 1.50595C3.55426 1.50595 2.01073 3.05009 2.01073 4.95418ZM8.90716 13.5491H15.7947C17.2142 13.5491 18.365 12.3983 18.365 10.9787C18.365 9.55914 17.2142 8.40834 15.7947 8.40834H8.90716M27.3634 29.0136C27.3634 30.9213 25.8169 32.4678 23.9093 32.4678C22.0016 32.4678 20.4551 30.9213 20.4551 29.0136C20.4551 27.106 22.0016 25.5595 23.9093 25.5595C25.8169 25.5601 27.3634 27.106 27.3634 29.0136ZM8.90717 4.95358C8.90717 6.86125 7.36065 8.40717 5.45358 8.40717C3.54592 8.40717 2 6.86065 2 4.95358C2 3.04651 3.54651 1.5 5.45358 1.5C7.36065 1.5 8.90717 3.04592 8.90717 4.95358Z"
              stroke="white"
              strokeWidth="2.21598"
              strokeMiterlimit="10"
            />
            <g clipPath="url(#clip0_1667_896)">
              <path
                d="M106.614 9.29794C105.666 9.29794 104.986 8.61764 104.986 7.67021C104.986 6.72279 105.666 6.04248 106.614 6.04248C107.561 6.04248 108.242 6.72279 108.242 7.67021C108.242 8.61764 107.561 9.29794 106.614 9.29794ZM106.614 8.95153C107.353 8.95153 107.883 8.4173 107.883 7.67021C107.883 6.92312 107.353 6.3889 106.614 6.3889C105.871 6.3889 105.341 6.92312 105.345 7.67021C105.341 8.4173 105.871 8.95153 106.614 8.95153ZM106.618 8.60929C106.096 8.60929 105.671 8.27957 105.671 7.66186C105.671 7.03999 106.109 6.71027 106.618 6.71027C107.11 6.71027 107.461 6.98573 107.511 7.40727H107.014C106.989 7.2278 106.831 7.11511 106.618 7.11511C106.355 7.11511 106.146 7.29876 106.146 7.66186C106.146 8.0208 106.355 8.20862 106.618 8.20862C106.835 8.20862 106.994 8.09175 107.031 7.91646H107.499C107.465 8.338 107.119 8.60929 106.618 8.60929Z"
                fill="white"
              />
              <path
                d="M46.5057 13.6073H44.5416C42.2413 13.6073 41.3271 15.5832 41.3271 18.4143V25.4331H37.6997V10.5698H41.3271V13.1944C42.0644 11.307 43.2145 10.5698 45.1314 10.5698H46.5057V13.6073Z"
                fill="white"
              />
              <path
                d="M57.6182 20.4787H61.1571C60.5968 23.6342 57.8247 25.6691 54.1678 25.6691C49.3018 25.6691 46.5887 21.8353 46.5887 17.9425C46.5887 14.0202 49.0069 10.3338 53.8729 10.3338C58.8569 10.3338 61.0982 13.9612 61.0982 17.5001C61.0982 18.0015 61.0687 18.4438 61.0392 18.7387H50.0686C50.334 21.1275 51.8675 22.661 54.1678 22.661C56.0257 22.661 57.2349 21.8942 57.6182 20.4787ZM53.8729 13.047C51.838 13.047 50.5404 14.1087 50.1571 16.35H57.4708C57.3233 14.4626 56.0257 13.047 53.8729 13.047Z"
                fill="white"
              />
              <path
                d="M62.6554 25.4331V6.08717H66.2533V25.4331H62.6554Z"
                fill="white"
              />
              <path
                d="M74.4868 10.3338C78.2616 10.3338 80.9158 12.5162 80.9158 15.8781V25.4331H77.3474V23.2213C76.7281 24.6959 75.0176 25.6691 72.8943 25.6691C69.9452 25.6691 67.9398 23.7817 67.9398 21.216C67.9398 18.3259 70.1811 16.5269 73.5136 16.5269H76.2562C76.9935 16.5269 77.3474 16.114 77.3474 15.5242C77.3474 14.0792 76.2267 13.047 74.3098 13.047C72.3929 13.047 71.2428 14.2561 71.1838 15.5832H67.9398C68.1168 12.6341 70.6235 10.3338 74.4868 10.3338ZM73.7495 22.9854C76.0203 22.9854 77.3474 21.3929 77.3474 19.1516V18.9157H74.0149C72.4814 18.9157 71.4492 19.7709 71.4492 21.0685C71.4492 22.2186 72.3929 22.9854 73.7495 22.9854Z"
                fill="white"
              />
              <path
                d="M84.3545 6.08716H87.9818V10.5698H92.1105V13.6073H87.9818V20.0953C87.9818 21.5993 88.7781 22.3661 90.1347 22.3661H92.1105V25.4331H89.7218C86.4778 25.4331 84.3545 23.5457 84.3545 20.2428V13.6073H81.4349V10.5698H84.3545V6.08716Z"
                fill="white"
              />
              <path
                d="M99.1559 25.6691C95.558 25.6691 93.1692 23.6637 92.9923 20.4787H96.2952C96.4427 21.8942 97.5339 22.779 99.1559 22.779C100.571 22.779 101.515 22.0712 101.515 21.1865C101.515 17.8835 93.3757 21.039 93.3757 14.7575C93.3757 12.1623 95.6465 10.3338 98.7135 10.3338C102.193 10.3338 104.582 12.2507 104.73 15.1408H101.427C101.22 13.7548 99.9521 13.047 98.802 13.047C97.5044 13.047 96.6491 13.6368 96.6491 14.6395C96.6491 17.854 104.907 14.3151 104.907 21.039C104.907 23.8406 102.636 25.6691 99.1559 25.6691Z"
                fill="white"
              />
            </g>
          </g>
          <defs>
            <clipPath id="clip0_1667_896">
              <rect width="70.5418" height="19.6263" fill="white" transform="translate(37.6997 6.04248)" />
            </clipPath>
          </defs>
        </svg>
      </div>
      {/* Center: Title */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: 1,
        color: darkMode ? '#fff' : '#222',
        pointerEvents: 'none' // Prevent interference with other elements
      }}>
        Track-IN-Train HR
      </div>
      {/* Right: User info, photo, dark mode toggle, logout, and logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>

        {userName && (
          <div data-user-dropdown style={{ position: 'relative', marginRight: 8 }}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                fontWeight: 600,
                fontSize: 16,
                color: darkMode ? '#fff' : '#222',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {userName}
              <span style={{ fontSize: '12px' }}>
                {showUserDropdown ? '▲' : '▼'}
              </span>
            </button>

            {showUserDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: darkMode ? '#1f2937' : '#ffffff',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '200px',
                zIndex: 1000,
                marginTop: '4px'
              }}>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowUserInfoModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderBottom: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? '#374151' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <div style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: darkMode ? '#f9fafb' : '#1e293b'
                  }}>
                    {userName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    marginTop: '2px'
                  }}>
                    {getCookie('userRole') || 'User'} • Click for details
                  </div>
                </button>

                {/* Dashboard option - Only for SuperAdmin and Admin */}
                {(getCookie('userRole') === 'SuperAdmin' || getCookie('userRole') === 'Admin') && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      router.push('/dashboard');
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: darkMode ? '#f9fafb' : '#1e293b',
                      transition: 'background 0.2s ease',
                      borderBottom: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? '#374151' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    📊 Dashboard
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowChangePasswordModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    transition: 'background 0.2s ease',
                    borderBottom: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? '#374151' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  🔒 Change Password
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: darkMode ? '#ef4444' : '#dc2626',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? '#374151' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        )}
        {userPhoto && (
          <img src={userPhoto} alt="User" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb' }} />
        )}
        <button
          onClick={() => setTheme(darkMode ? 'light' : 'dark')}
          style={{
            background: darkMode ? '#f3f4f6' : '#18191a',
            color: darkMode ? '#18191a' : '#fff',
            border: 'none',
            borderRadius: 20,
            width: 40,
            height: 40,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? '🌙' : '☀️'}
        </button>
        {(userName || (typeof window !== 'undefined' && (getCookie('isLoggedIn') === 'true' || sessionStorage.getItem('userName')))) && (
          <button
            onClick={handleLogout}
            style={{
              marginLeft: 8,
              background: darkMode ? '#ef4444' : '#fee2e2',
              color: darkMode ? '#fff' : '#b91c1c',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background 0.2s'
            }}
            aria-label="Log out"
          >
            Log out
          </button>
        )}

      </div>

      {/* Logs Viewer Modal */}
      <LogsViewer
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        darkMode={darkMode}
      />

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '120px',
          zIndex: 1001
        }}>
          <div
            className="responsive-modal-content"
            style={{
              background: darkMode ? '#1f2937' : '#ffffff',
              borderRadius: window.innerWidth <= 576 ? '8px' : '12px',
              padding: window.innerWidth <= 576 ? '20px' : window.innerWidth <= 768 ? '28px' : '32px',
              width: window.innerWidth <= 576 ? 'calc(100vw - 20px)' : '90%',
              maxWidth: window.innerWidth <= 576 ? 'none' : window.innerWidth <= 768 ? '350px' : '400px',
              maxHeight: '100vh', // Set to 100vh as requested
              minHeight: '170px', // Set to 170px as requested
              overflowY: 'auto', // Add scroll if content exceeds height
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              margin: window.innerWidth <= 576 ? '10px' : 'auto'
            }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Change Password
              </h2>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Current Password */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#f9fafb' : '#374151'
                }}>
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* New Password */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#f9fafb' : '#374151'
                }}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password (min 6 characters)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#f9fafb' : '#374151'
                }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    background: darkMode ? '#374151' : '#ffffff',
                    color: darkMode ? '#f9fafb' : '#1e293b',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: 'transparent',
                  color: darkMode ? '#f9fafb' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Info Modal */}
      {showUserInfoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '100px',
          zIndex: 1002
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '100vh', // Set to 100vh for consistency
            minHeight: '170px', // Set to 170px for consistency
            overflowY: 'auto', // Add scroll if content exceeds height
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                User Information
              </h2>
              <button
                onClick={() => setShowUserInfoModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Full Name
                </label>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f9fafb' : '#1e293b'
                }}>
                  {userName}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Email
                </label>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#d1d5db' : '#374151'
                }}>
                  {getCookie('userEmail') || 'Not available'}
                </div>
              </div>

              {/* Role/Position */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Position
                </label>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#d1d5db' : '#374151'
                }}>
                  {getCookie('userRole') || 'User'}
                </div>
              </div>

              {/* Zone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Zone
                </label>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#d1d5db' : '#374151'
                }}>
                  {getCookie('userZone') || 'Not assigned'}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => setShowUserInfoModal(false)}
                style={{
                  padding: '8px 24px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  background: darkMode ? '#374151' : '#f9fafb',
                  color: darkMode ? '#f9fafb' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}