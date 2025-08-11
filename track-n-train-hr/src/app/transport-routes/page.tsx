"use client";
// Cache bust: 2025-08-07-12:30:00

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getColors } from '@/lib/colors';
import dynamic from 'next/dynamic';
const TransportMap = dynamic(() => import('@/components/TransportMap'), { ssr: false });
import { 
  Location,
  TransportOptimizationService 
} from '@/lib/leaflet-maps';
import { TransportRoute, PickupPoint } from '@/models';
import { RELATS } from '@/lib/locations';

// Cookie utility function
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

interface TrajectoryData {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: string[];
  userCount: number;
  coordinates: {
    lat: number;
    lng: number;
  }[];
}

export default function TransportRoutesPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const colors = getColors(darkMode);

  // Enhanced transport routes with realistic pickup points and optimized trajectories
  const mockTransportRoutes: TransportRoute[] = [
    {
      id: 'route-1',
      name: 'Tangier Center - Relats',
      startPoint: { lat: 35.7598, lng: -5.8345, address: 'Place de France Depot, Tangier Center, Morocco' },
      pickupPoints: [
        {
          id: 'pickup-1-1',
          name: 'Place de France',
          location: { lat: 35.7595, lng: -5.8340, address: 'Place de France, Tangier, Morocco' },
          currentUsers: 14,
          maxCapacity: 22
        },
        {
          id: 'pickup-1-2',
          name: 'Boulevard Pasteur',
          location: { lat: 35.7612, lng: -5.8298, address: 'Boulevard Pasteur, Tangier, Morocco' },
          currentUsers: 9,
          maxCapacity: 16
        },
        {
          id: 'pickup-1-3',
          name: 'Grand Socco',
          location: { lat: 35.7831, lng: -5.8136, address: 'Grand Socco (Place du 9 Avril), Tangier, Morocco' },
          currentUsers: 11,
          maxCapacity: 18
        },
        {
          id: 'pickup-1-4',
          name: 'Port of Tangier',
          location: { lat: 35.7731, lng: -5.8006, address: 'Port of Tangier, Tangier, Morocco' },
          currentUsers: 8,
          maxCapacity: 15
        },
        {
          id: 'pickup-1-5',
          name: 'Tangier Med Entrance',
          location: { lat: 35.7220, lng: -5.8850, address: 'Tangier Med Port Entrance, Tangier, Morocco' },
          currentUsers: 7,
          maxCapacity: 12
        },
        {
          id: 'pickup-1-6',
          name: 'Free Zone Access Road',
          location: { lat: 35.7150, lng: -5.9100, address: 'Tanger Free Zone Access Road, Tangier, Morocco' },
          currentUsers: 5,
          maxCapacity: 10
        }
      ],
      endPoint: RELATS,
      totalUsers: 54,
      route: [
        { lat: 35.7595, lng: -5.8340, address: 'Place de France' },
        { lat: 35.7612, lng: -5.8298, address: 'Boulevard Pasteur' },
        { lat: 35.7831, lng: -5.8136, address: 'Grand Socco' },
        { lat: 35.7731, lng: -5.8006, address: 'Port of Tangier' },
        { lat: 35.7220, lng: -5.8850, address: 'Tangier Med Entrance' },
        { lat: 35.7150, lng: -5.9100, address: 'Free Zone Access Road' },
        { lat: 35.7267, lng: -5.7500, address: 'Relats, Tanger Free Zone' }
      ]
    },
    {
      id: 'route-2',
      name: 'Airport - University Route',
      startPoint: { lat: 35.7269, lng: -5.9167, address: 'Ibn Battuta Airport Terminal, Tangier, Morocco' },
      pickupPoints: [
        {
          id: 'pickup-2-1',
          name: 'Airport Terminal',
          location: { lat: 35.7269, lng: -5.9167, address: 'Ibn Battuta Airport Terminal, Tangier, Morocco' },
          currentUsers: 12,
          maxCapacity: 20
        },
        {
          id: 'pickup-2-2',
          name: 'Airport Hotels Area',
          location: { lat: 35.7285, lng: -5.9100, address: 'Airport Hotels Zone, Tangier, Morocco' },
          currentUsers: 6,
          maxCapacity: 12
        },
        {
          id: 'pickup-2-3',
          name: 'Abdelmalek Essaadi University',
          location: { lat: 35.7500, lng: -5.8700, address: 'Université Abdelmalek Essaâdi, Tangier, Morocco' },
          currentUsers: 15,
          maxCapacity: 25
        },
        {
          id: 'pickup-2-4',
          name: 'ENCGT Engineering School',
          location: { lat: 35.7450, lng: -5.8650, address: 'ENCGT, Tangier, Morocco' },
          currentUsers: 8,
          maxCapacity: 14
        },
        {
          id: 'pickup-2-5',
          name: 'Boukhalef Business District',
          location: { lat: 35.7320, lng: -5.8950, address: 'Boukhalef Business District, Tangier, Morocco' },
          currentUsers: 4,
          maxCapacity: 10
        }
      ],
      endPoint: RELATS,
      totalUsers: 45,
      route: [
        { lat: 35.7269, lng: -5.9167, address: 'Ibn Battuta Airport' },
        { lat: 35.7285, lng: -5.9100, address: 'Airport Hotels Area' },
        { lat: 35.7500, lng: -5.8700, address: 'Abdelmalek Essaadi University' },
        { lat: 35.7450, lng: -5.8650, address: 'ENCGT Engineering School' },
        { lat: 35.7320, lng: -5.8950, address: 'Boukhalef Business District' },
        { lat: 35.7267, lng: -5.7500, address: 'Relats, Tanger Free Zone' }
      ]
    },
    {
      id: 'route-3',
      name: 'Coastal - Residential Route',
      startPoint: { lat: 35.7808, lng: -5.7735, address: 'Malabata Residential Complex, Tangier, Morocco' },
      pickupPoints: [
        {
          id: 'pickup-3-1',
          name: 'Malabata Neighborhood',
          location: { lat: 35.7812, lng: -5.7738, address: 'Malabata Residential Area, Tangier, Morocco' },
          currentUsers: 10,
          maxCapacity: 18
        },
        {
          id: 'pickup-3-2',
          name: 'Corniche Mohamed VI',
          location: { lat: 35.7750, lng: -5.8000, address: 'Corniche Mohamed VI, Tangier, Morocco' },
          currentUsers: 7,
          maxCapacity: 14
        },
        {
          id: 'pickup-3-3',
          name: 'California Neighborhood',
          location: { lat: 35.7650, lng: -5.8100, address: 'California District, Tangier, Morocco' },
          currentUsers: 8,
          maxCapacity: 15
        },
        {
          id: 'pickup-3-4',
          name: 'Boubana District',
          location: { lat: 35.7400, lng: -5.8200, address: 'Boubana Residential District, Tangier, Morocco' },
          currentUsers: 6,
          maxCapacity: 12
        },
        {
          id: 'pickup-3-5',
          name: 'Industrial Zone Mghogha',
          location: { lat: 35.7250, lng: -5.8750, address: 'Mghogha Industrial Zone, Tangier, Morocco' },
          currentUsers: 4,
          maxCapacity: 8
        }
      ],
      endPoint: RELATS,
      totalUsers: 35,
      route: [
        { lat: 35.7812, lng: -5.7738, address: 'Malabata Neighborhood' },
        { lat: 35.7750, lng: -5.8000, address: 'Corniche Mohamed VI' },
        { lat: 35.7650, lng: -5.8100, address: 'California Neighborhood' },
        { lat: 35.7400, lng: -5.8200, address: 'Boubana District' },
        { lat: 35.7250, lng: -5.8750, address: 'Industrial Zone Mghogha' },
        { lat: 35.7267, lng: -5.7500, address: 'Relats, Tanger Free Zone' }
      ]
    },
    {
      id: 'route-4',
      name: 'Industrial - Business Zone Route',
      startPoint: { lat: 35.7600, lng: -5.8500, address: 'Tangier Ville Railway Station, Tangier, Morocco' },
      pickupPoints: [
        {
          id: 'pickup-4-1',
          name: 'Tangier Train Station',
          location: { lat: 35.7600, lng: -5.8500, address: 'Gare ONCF Tangier Ville, Tangier, Morocco' },
          currentUsers: 9,
          maxCapacity: 16
        },
        {
          id: 'pickup-4-2',
          name: 'CTM Bus Terminal',
          location: { lat: 35.7650, lng: -5.8200, address: 'CTM Bus Terminal, Tangier, Morocco' },
          currentUsers: 6,
          maxCapacity: 12
        },
        {
          id: 'pickup-4-3',
          name: 'Morocco Mall Tangier',
          location: { lat: 35.7400, lng: -5.8400, address: 'Marjane Tangier, Commercial Center, Morocco' },
          currentUsers: 8,
          maxCapacity: 15
        },
        {
          id: 'pickup-4-4',
          name: 'Dradeb Industrial Area',
          location: { lat: 35.7300, lng: -5.8300, address: 'Dradeb Industrial Zone, Tangier, Morocco' },
          currentUsers: 5,
          maxCapacity: 10
        },
        {
          id: 'pickup-4-5',
          name: 'Gzenaya Logistics Hub',
          location: { lat: 35.7200, lng: -5.8600, address: 'Gzenaya Logistics Platform, Tangier, Morocco' },
          currentUsers: 7,
          maxCapacity: 14
        }
      ],
      endPoint: RELATS,
      totalUsers: 35,
      route: [
        { lat: 35.7600, lng: -5.8500, address: 'Tangier Train Station' },
        { lat: 35.7650, lng: -5.8200, address: 'CTM Bus Terminal' },
        { lat: 35.7400, lng: -5.8400, address: 'Morocco Mall Tangier' },
        { lat: 35.7300, lng: -5.8300, address: 'Dradeb Industrial Area' },
        { lat: 35.7200, lng: -5.8600, address: 'Gzenaya Logistics Hub' },
        { lat: 35.7267, lng: -5.7500, address: 'Relats, Tanger Free Zone' }
      ]
    }
  ];

  // New user assignment states
  const [newUserMode, setNewUserMode] = useState(false);
  const [newUserData, setNewUserData] = useState<any>(null);
  const [showNewUserBanner, setShowNewUserBanner] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024); // Default width for SSR

  useEffect(() => {
    // Check dark mode preference from multiple sources
    const cookieDark = getCookie('darkMode') === 'true';
    const localDark = localStorage.getItem('darkMode') === 'true';
    const classDark = document.documentElement.classList.contains('dark');
    const themeDark = localStorage.getItem('theme') === 'dark';

    const isDark = cookieDark || localDark || classDark || themeDark;

    console.log('🎨 Theme Detection:', {
      cookieDark,
      localDark,
      classDark,
      themeDark,
      finalDark: isDark
    });

    setDarkMode(isDark);

    // Apply theme class to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check for new user mode
    const urlParams = new URLSearchParams(window.location.search);
    const isNewUserMode = urlParams.get('newUser') === 'true';
    
    if (isNewUserMode) {
      // Get new user data from sessionStorage
      const userData = sessionStorage.getItem('newUserForTransport');
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          console.log('👤 New user detected for transport assignment:', parsedUserData);
          setNewUserMode(true);
          setNewUserData(parsedUserData);
          setShowNewUserBanner(true);
          
          // Clean up URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        } catch (error) {
          console.error('Error parsing new user data:', error);
        }
      }
    }

    // Initialize transport optimization service
    TransportOptimizationService.initializeRoutes(mockTransportRoutes);
    
    // Load routes (mock data for now)
    setRoutes(mockTransportRoutes);
    setLoading(false);
    
    // Set initial window width and add resize listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRouteSelect = (route: TransportRoute) => {
    setSelectedRoute(route);
  };

  // Handle user assignment to pickup point
  const handleUserAssignment = (pickupPointId: string, userId: string) => {
    console.log('👤 Assigning user', userId, 'to pickup point', pickupPointId);
    // In a real app, this would make an API call to update the user's transport assignment
    
    // Clear new user session data
    sessionStorage.removeItem('newUserForTransport');
    setNewUserMode(false);
    setNewUserData(null);
    setShowNewUserBanner(false);
    
    // Show success message or redirect
    alert('User successfully assigned to transport route!');
  };

  // Geocode new user address to coordinates
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    if (!address) return null;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.BACKGROUND,
      color: colors.TEXT,
      transition: 'background-color 0.2s ease'
    }}>
      {/* Top bar with title and Back to HR button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: colors.TEXT,
            margin: 0
          }}>
            🚌 Transport Routes
          </h1>
        </div>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: '0.2s',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
            transform: 'translateY(0px)'
          }}
          onClick={() => {
            // Navigate to the profiles page (main HR interface)
            router.push('/profiles');
          }}
        >
           Back to Profiles
        </button>
      </div>
      {/* New User Assignment Banner */}
      {showNewUserBanner && newUserData && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px 20px 20px'
        }}>
          <div style={{
            background: darkMode ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: darkMode ? '2px solid #3b82f6' : '2px solid #2563eb',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: darkMode ? '0 8px 25px rgba(59,130,246,0.25)' : '0 8px 25px rgba(59,130,246,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: darkMode ? '#ffffff' : '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 New User Transport Assignment
                </h3>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  color: darkMode ? '#e5e7eb' : '#1e40af',
                  lineHeight: '1.5'
                }}>
                  <strong>{newUserData.fullName}</strong> has been successfully created and needs to be assigned to a transport route.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '8px 16px',
                  fontSize: '14px',
                  color: darkMode ? '#d1d5db' : '#475569'
                }}>
                  <span><strong>📧 Email:</strong></span>
                  <span>{newUserData.email}</span>
                  <span><strong>📍 Address:</strong></span>
                  <span>{newUserData.address || 'Not provided'}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowNewUserBanner(false);
                  // Don't clear the mode, just hide the banner
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                  color: darkMode ? '#ffffff' : '#1e40af',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '36px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Hide banner"
              >
                ✕
              </button>
            </div>
            
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)',
              borderRadius: '12px',
              fontSize: '14px',
              color: darkMode ? '#f3f4f6' : '#374151',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              💡 <strong>Instructions:</strong> Select a route below to view its pickup points on the map, then click on a pickup point to assign this user to it.
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        minHeight: 'calc(100vh - 72px)', // Account for sticky header
        maxWidth: '1400px',
        margin: '0 auto',
        padding: windowWidth <= 576 ? '10px' : windowWidth <= 768 ? '15px' : '20px',
        gap: windowWidth <= 576 ? '15px' : windowWidth <= 768 ? '18px' : '20px'
      }}>
        
        {/* Left Sidebar - Trajectory List */}
        <div style={{
          width: windowWidth <= 768 ? '100%' : '350px',
          minWidth: windowWidth <= 576 ? 'auto' : '300px',
          backgroundColor: darkMode ? colors.SURFACE : colors.SURFACE,
          borderRadius: windowWidth <= 576 ? '8px' : '12px',
          padding: windowWidth <= 576 ? '15px' : windowWidth <= 768 ? '18px' : '20px',
          boxShadow: darkMode
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
          border: darkMode ? `1px solid ${colors.BORDER}` : `1px solid ${colors.BORDER}`,
          height: 'fit-content'
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: '20px',
            color: colors.TEXT
          }}>
            Available Routes
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              Loading routes...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {routes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  style={{
                    padding: '16px',
                    backgroundColor: selectedRoute?.id === route.id
                      ? (darkMode ? '#1e40af' : '#dbeafe')
                      : (darkMode ? '#374151' : '#f8fafc'),
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: selectedRoute?.id === route.id
                      ? `2px solid ${darkMode ? '#3b82f6' : '#2563eb'}`
                      : `1px solid ${colors.BORDER}`,
                    boxShadow: selectedRoute?.id === route.id
                      ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                      : '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoute?.id !== route.id) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#4b5563' : '#f1f5f9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoute?.id !== route.id) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#374151' : '#f8fafc';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }
                  }}
                >
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    color: selectedRoute?.id === route.id 
                      ? (darkMode ? '#ffffff' : '#1e40af')
                      : colors.TEXT
                  }}>
                    {route.name}
                  </h3>
                  
                  <div style={{
                    fontSize: 14,
                    color: selectedRoute?.id === route.id 
                      ? (darkMode ? '#e5e7eb' : '#64748b')
                      : colors.TEXT_SECONDARY,
                    marginBottom: '8px'
                  }}>
                    {route.pickupPoints[0]?.name} → {route.endPoint.address.split(',')[0]}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: selectedRoute?.id === route.id 
                      ? (darkMode ? '#d1d5db' : '#6b7280')
                      : colors.TEXT_SECONDARY
                  }}>
                    <span>{route.pickupPoints.length} pickup points</span>
                    <span style={{
                      backgroundColor: selectedRoute?.id === route.id
                        ? (darkMode ? '#1e40af' : '#3b82f6')
                        : (darkMode ? '#059669' : '#10b981'),
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      fontWeight: 600,
                      fontSize: 12,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {route.totalUsers} users
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Map Area */}
        <div style={{
          flex: 1,
          width: windowWidth <= 768 ? '100%' : 'auto',
          backgroundColor: darkMode ? colors.SURFACE : colors.SURFACE,
          borderRadius: windowWidth <= 576 ? '8px' : '12px',
          padding: windowWidth <= 576 ? '15px' : windowWidth <= 768 ? '18px' : '20px',
          boxShadow: darkMode
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
          border: darkMode ? `1px solid ${colors.BORDER}` : `1px solid ${colors.BORDER}`,
          position: 'relative'
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: '20px',
            color: colors.TEXT
          }}>
            Tangier Transport Map
          </h2>

          {/* Interactive Google Map */}
          <div style={{
            width: '100%',
            height: windowWidth <= 576 ? '300px' : windowWidth <= 768 ? '400px' : '500px',
            marginBottom: windowWidth <= 576 ? '15px' : '20px',
            borderRadius: windowWidth <= 576 ? '8px' : '10px',
            overflow: 'hidden'
          }}>
            <TransportMap
              selectedRoute={selectedRoute}
              darkMode={darkMode}
              onRouteSelect={handleRouteSelect}
            />
          </div>

          {/* Route Details */}
          {selectedRoute && (
            <div style={{
              backgroundColor: darkMode ? '#374151' : '#f8fafc',
              borderRadius: '10px',
              padding: '24px',
              border: darkMode ? `1px solid ${colors.BORDER}` : '1px solid #e2e8f0',
              boxShadow: darkMode
                ? '0 4px 12px rgba(0,0,0,0.2)'
                : '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: '16px',
                color: colors.TEXT
              }}>
                Route Details: {selectedRoute.name}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '8px', color: colors.TEXT }}>
                    Route Information
                  </h4>
                  <div style={{ fontSize: 14, color: colors.TEXT_SECONDARY, lineHeight: 1.6 }}>
                    <div><strong>Start:</strong> {selectedRoute.pickupPoints[0]?.name}</div>
                    <div><strong>End:</strong> {selectedRoute.endPoint.address.split(',')[0]}</div>
                    <div><strong>Total Users:</strong> {selectedRoute.totalUsers}</div>
                    <div><strong>Pickup Points:</strong> {selectedRoute.pickupPoints.length}</div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: '8px', color: colors.TEXT }}>
                    Pickup Points
                  </h4>
                  <div style={{ fontSize: 14, color: colors.TEXT_SECONDARY }}>
                    {selectedRoute.pickupPoints.map((pickupPoint, index) => (
                      <div key={pickupPoint.id} style={{
                        padding: '6px 0',
                        borderLeft: index < selectedRoute.pickupPoints.length - 1
                          ? `2px solid ${darkMode ? '#60a5fa' : '#3b82f6'}`
                          : 'none',
                        paddingLeft: '16px',
                        marginLeft: '8px',
                        position: 'relative',
                        fontSize: 14,
                        fontWeight: index === 0 ? 600 : 500
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '-7px',
                          top: '10px',
                          width: '12px',
                          height: '12px',
                          backgroundColor: index === 0
                            ? (darkMode ? '#10b981' : '#059669')  // First pickup - green
                            : (darkMode ? '#60a5fa' : '#3b82f6'), // Regular pickup - blue
                          borderRadius: '50%',
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} />
                        <span style={{ color: colors.TEXT }}>
                          {pickupPoint.name} ({pickupPoint.currentUsers})
                        </span>
                      </div>
                    ))}
                    <div style={{
                      padding: '6px 0',
                      paddingLeft: '16px',
                      marginLeft: '8px',
                      position: 'relative',
                      fontSize: 14,
                      fontWeight: 600
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '-7px',
                        top: '10px',
                        width: '12px',
                        height: '12px',
                        backgroundColor: (darkMode ? '#ef4444' : '#dc2626'), // End point - red
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} />
                      <span style={{ color: (darkMode ? '#fca5a5' : '#dc2626') }}>
                        {selectedRoute.endPoint.address.split(',')[0]} 🏢
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: darkMode ? colors.SURFACE : '#f8fafc',
        padding: '24px 0',
        borderTop: darkMode ? `1px solid ${colors.BORDER}` : '1px solid #e2e8f0',
        textAlign: 'center',
        color: colors.TEXT_SECONDARY,
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          fontSize: 14,
          fontWeight: 500
        }}>
          © 2025 Track-IN-Train HR - Transport Route Management System
        </div>
      </footer>
    </div>
  );
}
