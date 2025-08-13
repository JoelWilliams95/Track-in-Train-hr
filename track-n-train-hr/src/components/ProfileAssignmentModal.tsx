"use client";
import React, { useState, useEffect } from 'react';
import { getColors } from '@/lib/colors';

interface User {
  fullName: string;
  cin?: string;
  poste: string;
  zone: string;
  subZone?: string;
  address?: string;
  trajectoryCode?: string;
  phoneNumber?: string;
  status: string;
}

interface PickupPoint {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  trajectoryCode?: string;
  currentUsers: number;
  maxCapacity: number;
  assignedUsers?: User[];
}

interface ProfileAssignmentModalProps {
  darkMode: boolean;
  onClose: () => void;
  pickupPoint: PickupPoint;
  allUsers: User[];
  onAssignProfile: (user: User, pickupPoint: PickupPoint) => void;
}

export default function ProfileAssignmentModal({ 
  darkMode, 
  onClose, 
  pickupPoint, 
  allUsers, 
  onAssignProfile 
}: ProfileAssignmentModalProps) {
  const colors = getColors(darkMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(user =>
        user && // Check if user exists
        user.fullName && // Check if fullName exists
        typeof user.fullName === 'string' && // Check if fullName is a string
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.trajectoryCode // Only show users without trajectory codes
      ).slice(0, 8); // Show more suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, allUsers]);

  const handleAssignUser = async (user: User) => {
    if (isAssigning) return;

    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate user data
    if (!user || !user.fullName) {
      setErrorMessage('Invalid user data. Please try selecting a different profile.');

      // Clear error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return;
    }

    setIsAssigning(true);
    try {
      await onAssignProfile(user, pickupPoint);
      setSuccessMessage(`Successfully assigned ${user.fullName} to ${pickupPoint.name}`);
      setSearchTerm('');
      setShowSuggestions(false);

      // Close modal after showing success message briefly
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error assigning user:', error);
      let errorMsg = 'Failed to assign profile. Please try again.';

      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      }

      setErrorMessage(errorMsg);

      // Clear error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '100vh',
        minHeight: '170px',
        overflowY: 'auto',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        color: darkMode ? '#f9fafb' : '#1e293b'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: darkMode ? '#10b981' : '#059669'
          }}>
            Assign Profile
          </h2>
          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              onClose();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: darkMode ? '#374151' : '#f8fafc',
              color: darkMode ? '#f9fafb' : '#374151',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>

        {/* Pickup Point Info */}
        <div style={{
          backgroundColor: darkMode ? '#374151' : '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
            📍 {pickupPoint.name}
          </h3>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            <strong>Address:</strong> {pickupPoint.location.address}
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            <strong>Capacity:</strong> {pickupPoint.currentUsers}/{pickupPoint.maxCapacity}
          </p>
          {pickupPoint.trajectoryCode && (
            <p style={{ margin: '0', fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              <strong>Trajectory Code:</strong> {pickupPoint.trajectoryCode}
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            backgroundColor: darkMode ? '#7f1d1d' : '#fef2f2',
            border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div style={{
              color: darkMode ? '#fca5a5' : '#dc2626',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ❌ Assignment Failed
            </div>
            <div style={{
              color: darkMode ? '#fca5a5' : '#991b1b',
              fontSize: '14px',
              marginTop: '4px'
            }}>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            backgroundColor: darkMode ? '#064e3b' : '#f0fdf4',
            border: `1px solid ${darkMode ? '#10b981' : '#bbf7d0'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div style={{
              color: darkMode ? '#34d399' : '#059669',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✅ Assignment Successful
            </div>
            <div style={{
              color: darkMode ? '#34d399' : '#047857',
              fontSize: '14px',
              marginTop: '4px'
            }}>
              {successMessage}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
            Search for Profile
          </h3>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type profile name..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1e293b',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
              }}>
                {suggestions.map((user, index) => (
                  <div
                    key={index}
                    onClick={() => handleAssignUser(user)}
                    style={{
                      padding: '12px',
                      cursor: isAssigning ? 'not-allowed' : 'pointer',
                      borderBottom: index < suggestions.length - 1 ? (darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb') : 'none',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s',
                      opacity: isAssigning ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isAssigning) {
                        e.currentTarget.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{user.fullName || 'Unknown Name'}</div>
                    <div style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>
                      {user.poste || 'Unknown Position'} - {user.zone || 'Unknown Zone'} {user.subZone ? `(${user.subZone})` : ''}
                    </div>
                    {user.cin && (
                      <div style={{ fontSize: '12px', color: darkMode ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                        CIN: {user.cin}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {showSuggestions && suggestions.length === 0 && searchTerm.trim() && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '8px',
                marginTop: '4px',
                padding: '16px',
                textAlign: 'center',
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                No profiles found matching "{searchTerm}"
                <br />
                <small>Only profiles without trajectory codes are shown</small>
              </div>
            )}
          </div>

          {/* Help text */}
          <p style={{
            marginTop: '12px',
            fontSize: '14px',
            color: darkMode ? '#9ca3af' : '#6b7280',
            fontStyle: 'italic'
          }}>
            💡 Start typing to search for profiles. Only profiles without existing trajectory codes will be shown.
          </p>
        </div>

        {/* Loading indicator */}
        {isAssigning && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px'
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1f2937' : '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: darkMode ? '#f9fafb' : '#1e293b'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderTop: `2px solid ${darkMode ? '#10b981' : '#059669'}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Assigning profile...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
