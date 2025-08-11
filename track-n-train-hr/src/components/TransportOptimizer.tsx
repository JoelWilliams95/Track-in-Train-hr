"use client";

import React, { useState } from 'react';
import AddressInput from './AddressInput';
import { Location } from '@/lib/leaflet-maps';

interface TransportOptimizerProps {
  darkMode: boolean;
  onOptimizationComplete?: (result: any) => void;
}

interface OptimizationResult {
  routeId: string;
  routeName: string;
  pickupPointId: string;
  pickupPointName: string;
  pickupPointAddress: string;
  distanceToPickup: number;
  distanceToPickupKm: string;
  employeeLocation: Location;
  pickupPointLocation: Location;
}

export default function TransportOptimizer({
  darkMode,
  onOptimizationComplete
}: TransportOptimizerProps) {
  const [employeeAddress, setEmployeeAddress] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geocodedLocation, setGeocodedLocation] = useState<Location | null>(null);

  const handleAddressChange = (address: string, location?: Location) => {
    setEmployeeAddress(address);
    setGeocodedLocation(location || null);
    setError(null);
    setOptimizationResult(null);
  };

  const handleOptimize = async () => {
    if (!employeeAddress.trim()) {
      setError('Please enter an employee address');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/transport-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeAddress: employeeAddress.trim(),
          employeeName: employeeName.trim() || 'Employee'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setOptimizationResult(result.assignment);
        onOptimizationComplete?.(result);
      } else {
        setError(result.error || 'Failed to optimize transport route');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setEmployeeAddress('');
    setEmployeeName('');
    setOptimizationResult(null);
    setError(null);
    setGeocodedLocation(null);
  };

  return (
    <div style={{
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
      boxShadow: darkMode
        ? '0 4px 20px rgba(0,0,0,0.25)'
        : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '20px',
        color: darkMode ? '#f9fafb' : '#1f2937'
      }}>
        🚌 Transport Route Optimizer
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Employee Name Input */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: darkMode ? '#f9fafb' : '#374151'
          }}>
            Employee Name
          </label>
          <input
            type="text"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Enter employee name"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
              background: darkMode ? '#374151' : '#ffffff',
              color: darkMode ? '#f9fafb' : '#1e293b',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = darkMode ? '#60a5fa' : '#3b82f6';
              e.target.style.boxShadow = `0 0 0 3px ${darkMode ? '#60a5fa20' : '#3b82f620'}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = darkMode ? '#4b5563' : '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Address Input */}
        <AddressInput
          value={employeeAddress}
          onChange={handleAddressChange}
          placeholder="Enter employee address"
          label="Employee Address"
          required={true}
          darkMode={darkMode}
          disabled={isOptimizing}
          onGeocodeSuccess={(location) => {
            setGeocodedLocation(location);
            setError(null);
          }}
          onGeocodeError={(error) => {
            setError(error);
          }}
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !employeeAddress.trim()}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isOptimizing || !employeeAddress.trim()
                ? (darkMode ? '#4b5563' : '#9ca3af')
                : (darkMode ? '#059669' : '#10b981'),
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isOptimizing || !employeeAddress.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isOptimizing || !employeeAddress.trim() ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isOptimizing && employeeAddress.trim()) {
                e.currentTarget.style.backgroundColor = darkMode ? '#047857' : '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOptimizing && employeeAddress.trim()) {
                e.currentTarget.style.backgroundColor = darkMode ? '#059669' : '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isOptimizing ? (
              <>
                <div style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }} />
                Optimizing...
              </>
            ) : (
              '🚌 Find Optimal Route'
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isOptimizing}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: darkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
              backgroundColor: 'transparent',
              color: darkMode ? '#d1d5db' : '#6b7280',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isOptimizing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isOptimizing) {
                e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!isOptimizing) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            Reset
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: darkMode ? '#991b1b' : '#fef2f2',
            border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`,
            color: darkMode ? '#fca5a5' : '#dc2626',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Optimization Result */}
        {optimizationResult && (
          <div style={{
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: darkMode ? '#065f46' : '#ecfdf5',
            border: `1px solid ${darkMode ? '#047857' : '#a7f3d0'}`,
            marginTop: '16px'
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '16px',
              color: darkMode ? '#d1fae5' : '#065f46'
            }}>
              ✅ Route Assignment Complete
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h5 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: darkMode ? '#d1fae5' : '#065f46'
                }}>
                  Assigned Route
                </h5>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#a7f3d0' : '#047857',
                  lineHeight: '1.6'
                }}>
                  <div><strong>Route:</strong> {optimizationResult.routeName}</div>
                  <div><strong>Pickup Point:</strong> {optimizationResult.pickupPointName}</div>
                  <div><strong>Address:</strong> {optimizationResult.pickupPointAddress}</div>
                </div>
              </div>

              <div>
                <h5 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: darkMode ? '#d1fae5' : '#065f46'
                }}>
                  Distance Information
                </h5>
                <div style={{
                  fontSize: '14px',
                  color: darkMode ? '#a7f3d0' : '#047857',
                  lineHeight: '1.6'
                }}>
                  <div><strong>Distance to Pickup:</strong> {optimizationResult.distanceToPickupKm} km</div>
                  <div><strong>Status:</strong> 
                    <span style={{
                      color: optimizationResult.distanceToPickup <= 1000 ? '#10b981' : '#f59e0b',
                      fontWeight: '600',
                      marginLeft: '4px'
                    }}>
                      {optimizationResult.distanceToPickup <= 1000 ? '✅ Within Range' : '⚠️ Outside Range'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#1e40af' : '#dbeafe',
              border: `1px solid ${darkMode ? '#3b82f6' : '#93c5fd'}`,
              fontSize: '12px',
              color: darkMode ? '#dbeafe' : '#1e40af'
            }}>
              <strong>💡 Optimization Logic:</strong> Employee assigned to the closest pickup point within 1km, 
              ensuring minimal travel distance while maintaining route efficiency.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 