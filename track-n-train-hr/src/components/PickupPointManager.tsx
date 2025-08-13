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
  trajectoryCode: string;
  currentUsers: number;
  maxCapacity: number;
  assignedUsers: User[];
}

interface PickupPointManagerProps {
  darkMode: boolean;
  onClose: () => void;
  pickupPoint: PickupPoint;
  allUsers: User[];
  onUpdatePickupPoint: (updatedPoint: PickupPoint) => void;
}

export default function PickupPointManager({ 
  darkMode, 
  onClose, 
  pickupPoint, 
  allUsers, 
  onUpdatePickupPoint 
}: PickupPointManagerProps) {
  const colors = getColors(darkMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !pickupPoint.assignedUsers.some(assigned => assigned.fullName === user.fullName)
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, allUsers, pickupPoint.assignedUsers]);

  const handleAddUser = async (user: User) => {
    if (pickupPoint.assignedUsers.length >= pickupPoint.maxCapacity) {
      alert('Pickup point is at maximum capacity');
      return;
    }

    // Update user's trajectory code
    const updatedUser = { ...user, trajectoryCode: pickupPoint.trajectoryCode };
    
    // Update pickup point
    const updatedPickupPoint = {
      ...pickupPoint,
      assignedUsers: [...pickupPoint.assignedUsers, updatedUser],
      currentUsers: pickupPoint.currentUsers + 1
    };

    // Update the user in the database
    try {
      const response = await fetch('/api/personnel-records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user.fullName,
          trajectoryCode: pickupPoint.trajectoryCode
        })
      });

      if (response.ok) {
        onUpdatePickupPoint(updatedPickupPoint);
        setSearchTerm('');
        setSelectedUser(null);
        setShowSuggestions(false);
      } else {
        alert('Failed to update user trajectory code');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user trajectory code');
    }
  };

  const handleRemoveUser = async (user: User) => {
    // Remove trajectory code from user
    const updatedUser = { ...user, trajectoryCode: '' };
    
    // Update pickup point
    const updatedPickupPoint = {
      ...pickupPoint,
      assignedUsers: pickupPoint.assignedUsers.filter(u => u.fullName !== user.fullName),
      currentUsers: pickupPoint.currentUsers - 1
    };

    // Update the user in the database
    try {
      const response = await fetch('/api/personnel-records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user.fullName,
          trajectoryCode: ''
        })
      });

      if (response.ok) {
        onUpdatePickupPoint(updatedPickupPoint);
      } else {
        alert('Failed to remove user trajectory code');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Error removing user trajectory code');
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
        borderRadius: '20px',
        padding: '32px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '100vh',
        minHeight: '170px',
        overflowY: 'auto',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        color: darkMode ? '#f9fafb' : '#1e293b'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '700',
            color: darkMode ? '#10b981' : '#059669'
          }}>
            {pickupPoint.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: darkMode ? '#374151' : '#f8fafc',
              color: darkMode ? '#f9fafb' : '#374151',
              cursor: 'pointer',
              fontSize: 20,
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
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '16px' }}>
            <div><strong>Location:</strong> {pickupPoint.location.address}</div>
            <div><strong>Trajectory Code:</strong> {pickupPoint.trajectoryCode}</div>
            <div><strong>Capacity:</strong> {pickupPoint.currentUsers}/{pickupPoint.maxCapacity}</div>
            <div><strong>Available Spots:</strong> {pickupPoint.maxCapacity - pickupPoint.currentUsers}</div>
          </div>
        </div>

        {/* Add User Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Add User to Pickup Point</h3>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                backgroundColor: darkMode ? '#374151' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1e293b',
                fontSize: '16px'
              }}
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
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10
              }}>
                {suggestions.map((user, index) => (
                  <div
                    key={index}
                    onClick={() => handleAddUser(user)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? (darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb') : 'none',
                      backgroundColor: 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{user.fullName}</div>
                    <div style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                      {user.poste} - {user.zone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Users List */}
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Assigned Users ({pickupPoint.assignedUsers.length})
          </h3>
          
          {pickupPoint.assignedUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: darkMode ? '#9ca3af' : '#6b7280',
              fontSize: '16px'
            }}>
              No users assigned to this pickup point yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pickupPoint.assignedUsers.map((user, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: darkMode ? '#374151' : '#f8fafc',
                    borderRadius: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{user.fullName}</div>
                    <div style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
                      {user.poste} - {user.zone} {user.subZone ? `(${user.subZone})` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(user)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: darkMode ? '#dc2626' : '#ef4444',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
