"use client";
import React, { useState } from 'react';
import { COLORS, getColors, BUTTON_COLORS } from '@/lib/colors';
import { useResponsive } from '@/hooks/useResponsive';
import { useModal } from '@/contexts/ModalContext';

interface AddUserButtonProps {
  darkMode: boolean;
}

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  zone: string;
  position: string;
  phoneNumber: string;
  address: string;
}

export default function AddUserButton({ darkMode }: AddUserButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { openModal, closeModal, canOpenModal } = useModal();
  const isDisabled = !canOpenModal();
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    password: '',
    zone: '',
    position: '',
    phoneNumber: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const colors = getColors(darkMode);

  const zones = ['Textile', 'Self-Closing', 'Customizing', 'Heat-Shield', 'Coating', 'Maintenance', 'Quality', 'Logistics'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'User' // Always set role as User for new users
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        setSuccess('User added successfully!');
        
        // Store new user data for transport assignment
        sessionStorage.setItem('newUserForTransport', JSON.stringify({
          fullName: formData.fullName,
          address: formData.address,
          email: formData.email,
          userId: userData.userId // Assuming the API returns the created user ID
        }));
        
        setFormData({
          fullName: '',
          email: '',
          password: '',
          zone: '',
          position: '',
          phoneNumber: '',
          address: ''
        });
        
        // Redirect to transport routes for pickup assignment
        setTimeout(() => {
          setShowModal(false);
          setSuccess('');
          closeModal('add-user');
          // Use router to navigate to transport routes
          window.location.href = '/transport-routes?newUser=true';
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add user');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Add User Button */}
      <button
        onClick={isDisabled ? undefined : () => {
          if (openModal('add-user')) {
            setShowModal(true);
          }
        }}
        className="responsive-floating-secondary"
        style={{
          borderRadius: '50%',
          background: isDisabled ? '#6b7280' : COLORS.GREEN,
          border: 'none',
          color: COLORS.WHITE,
          fontSize: '24px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.6 : 1,
          boxShadow: `0 4px 20px ${COLORS.GREEN}66`,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = `0 6px 25px ${COLORS.GREEN}99`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 20px ${COLORS.GREEN}66`;
        }}
        title="Add New User"
      >
        👤+
      </button>

      {/* Add User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(28,28,28,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div
            className="responsive-modal-content"
            style={{
              background: darkMode ? '#1e293b' : COLORS.WHITE,
              borderRadius: window.innerWidth <= 576 ? '12px' : '20px',
              padding: window.innerWidth <= 576 ? '20px' : window.innerWidth <= 768 ? '30px' : '40px',
              width: '100%',
              maxWidth: window.innerWidth <= 576 ? 'calc(100vw - 20px)' : window.innerWidth <= 768 ? '500px' : '600px',
              maxHeight: '100vh', // Set to 100vh as requested
              minHeight: '170px', // Set to 170px as requested
              overflowY: 'auto',
              boxShadow: darkMode
                ? '0 25px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)'
                : '0 25px 80px rgba(28,28,28,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid #334155' : `1px solid #e5e7eb`,
              margin: window.innerWidth <= 576 ? '10px' : '20px'
            }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                  backgroundImage: `linear-gradient(135deg, ${COLORS.GREEN} 0%, ${COLORS.BLUE} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Add New User
                </h2>
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  fontStyle: 'italic'
                }}>
                  All new users will be created with "User" role
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  closeModal('add-user');
                }}
                style={{
                  background: darkMode ? COLORS.ULTIMATE_GREY : '#f3f4f6',
                  border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                  fontSize: '18px',
                  color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '36px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? '#ef4444' : '#fee2e2';
                  e.currentTarget.style.color = darkMode ? COLORS.WHITE : '#dc2626';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? COLORS.ULTIMATE_GREY : '#f3f4f6';
                  e.currentTarget.style.color = darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY;
                  e.currentTarget.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Zone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Zone *
                </label>
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Software Engineer, Manager, etc."
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Address */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkMode ? '#f1f5f9' : '#374151',
                  marginBottom: '8px'
                }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: darkMode ? `2px solid ${COLORS.ULTIMATE_GREY}` : '2px solid #e5e7eb',
                    background: darkMode ? '#334155' : '#f9fafb',
                    color: darkMode ? COLORS.WHITE : COLORS.ULTIMATE_GREY,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.GREEN;
                    e.target.style.background = darkMode ? '#475569' : COLORS.WHITE;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.GREEN}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = darkMode ? COLORS.ULTIMATE_GREY : '#e5e7eb';
                    e.target.style.background = darkMode ? '#334155' : '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div style={{
                  color: darkMode ? '#fca5a5' : '#DC2626',
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: darkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
                  borderRadius: '8px',
                  border: darkMode ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca'
                }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{
                  color: darkMode ? '#86efac' : COLORS.GREEN,
                  fontSize: '14px',
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : `${COLORS.GREEN}20`,
                  borderRadius: '8px',
                  border: darkMode ? '1px solid rgba(34, 197, 94, 0.3)' : `1px solid ${COLORS.GREEN}40`
                }}>
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting
                    ? (darkMode ? '#4b5563' : '#d1d5db')
                    : COLORS.GREEN,
                  color: COLORS.WHITE,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '8px',
                  boxShadow: isSubmitting
                    ? 'none'
                    : `0 4px 12px ${COLORS.GREEN}40`
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#3BD67A';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.GREEN}50`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = COLORS.GREEN;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.GREEN}40`;
                  }
                }}
              >
                {isSubmitting ? 'Adding User...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
