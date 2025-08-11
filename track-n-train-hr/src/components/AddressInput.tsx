"use client";

import React, { useEffect, useRef, useState } from 'react';
import { GeocodingService, Location } from '@/lib/leaflet-maps';

interface AddressInputProps {
  value: string;
  onChange: (address: string, location?: Location) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  darkMode?: boolean;
  disabled?: boolean;
  onGeocodeSuccess?: (location: Location) => void;
  onGeocodeError?: (error: string) => void;
}

export default function AddressInput({
  value,
  onChange,
  placeholder = "Enter address",
  label = "Address",
  required = false,
  darkMode = false,
  disabled = false,
  onGeocodeSuccess,
  onGeocodeError
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geocodedLocation, setGeocodedLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Tangier address suggestions
  const tangierAddresses = [
    'Tangier Center, Tangier, Morocco',
    'Grand Socco, Tangier, Morocco',
    'Kasbah, Tangier, Morocco',
    'Port Area, Tangier, Morocco',
    'Free Zone, Tangier, Morocco',
    'Industrial Zone, Tangier, Morocco',
    'Ibn Battuta Airport, Tangier, Morocco',
    'University, Tangier, Morocco',
    'Train Station, Tangier, Morocco',
    'Malabata Beach, Tangier, Morocco',
    'Corniche, Tangier, Morocco',
    'Hotel District, Tangier, Morocco',
    'Medina, Tangier, Morocco',
    'Relats, Tangier, Morocco'
  ];

  useEffect(() => {
    // Filter suggestions based on input
    if (value.trim()) {
      const filtered = tangierAddresses.filter(addr => 
        addr.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleManualGeocode = async () => {
    if (!value.trim()) return;

    setIsLoading(true);
    try {
      const location = await GeocodingService.geocodeAddress(value);
      
      if (location) {
        setGeocodedLocation(location);
        onChange(value, location);
        onGeocodeSuccess?.(location);
      } else {
        onGeocodeError?.('Could not find this address. Please try a more specific address.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      onGeocodeError?.('Failed to geocode address. Please check the address and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear geocoded location if address changes
    if (geocodedLocation && newValue !== geocodedLocation.address) {
      setGeocodedLocation(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    // Auto-geocode the selected suggestion
    handleManualGeocode();
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontSize: '16px',
        fontWeight: '600',
        color: darkMode ? '#f9fafb' : '#374151'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
            background: darkMode ? '#374151' : '#ffffff',
            color: darkMode ? '#f9fafb' : '#1e293b',
            fontSize: '16px',
            outline: 'none',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.6 : 1
          }}
          onFocus={(e) => {
            setShowSuggestions(suggestions.length > 0);
            e.target.style.borderColor = darkMode ? '#60a5fa' : '#3b82f6';
            e.target.style.boxShadow = `0 0 0 3px ${darkMode ? '#60a5fa20' : '#3b82f620'}`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
            e.target.style.boxShadow = 'none';
            // Delay hiding suggestions to allow clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            border: `2px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderTop: `2px solid ${darkMode ? '#60a5fa' : '#3b82f6'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        
        {geocodedLocation && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#10b981',
            fontSize: '16px'
          }}>
            ✓
          </div>
        )}

        {/* Address Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            border: darkMode ? '1px solid #374151' : '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: index < suggestions.length - 1 
                    ? (darkMode ? '1px solid #374151' : '1px solid #e5e7eb')
                    : 'none',
                  color: darkMode ? '#f9fafb' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual geocode button */}
      {value.trim() && !geocodedLocation && !isLoading && (
        <button
          type="button"
          onClick={handleManualGeocode}
          disabled={disabled}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '6px',
            border: 'none',
            background: darkMode ? '#374151' : '#f3f4f6',
            color: darkMode ? '#d1d5db' : '#6b7280',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = darkMode ? '#4b5563' : '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = darkMode ? '#374151' : '#f3f4f6';
            }
          }}
        >
          Verify Address
        </button>
      )}

      {/* Geocoded location info */}
      {geocodedLocation && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          background: darkMode ? '#065f46' : '#ecfdf5',
          border: `1px solid ${darkMode ? '#047857' : '#a7f3d0'}`,
          fontSize: '12px',
          color: darkMode ? '#d1fae5' : '#065f46'
        }}>
          <strong>Verified:</strong> {geocodedLocation.address}
          <br />
          <span style={{ fontSize: '11px', opacity: 0.8 }}>
            Coordinates: {geocodedLocation.lat.toFixed(6)}, {geocodedLocation.lng.toFixed(6)}
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 