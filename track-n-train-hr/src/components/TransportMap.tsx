"use client";
// Updated coordinates version 2.0 - 2025-08-07

import React, { useEffect, useRef, useState, useCallback } from 'react';
let L: typeof import('leaflet') | undefined = undefined;
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, Polyline: any, GeoJSON: any, useMap: any, useMapEvents: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  const reactLeaflet = require('react-leaflet');
  MapContainer = reactLeaflet.MapContainer;
  TileLayer = reactLeaflet.TileLayer;
  Marker = reactLeaflet.Marker;
  Popup = reactLeaflet.Popup;
  Polyline = reactLeaflet.Polyline;
  GeoJSON = reactLeaflet.GeoJSON;
  useMap = reactLeaflet.useMap;
  useMapEvents = reactLeaflet.useMapEvents;
}
import { 
  TransportRoute, 
  PickupPoint, 
  Location,
  TransportOptimizationService,
  LeafletMapUtils,
  OpenRouteService
} from '@/lib/leaflet-maps';
import { RELATS } from '@/lib/locations';

// Import Leaflet CSS only on client
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

// Fix for default markers in Leaflet (client only)
if (typeof window !== 'undefined' && L) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface TransportMapProps {
  selectedRoute: TransportRoute | null;
  darkMode: boolean;
  onRouteSelect?: (route: TransportRoute) => void;
  onPickupPointSelect?: (pickupPoint: PickupPoint) => void;
  onPickupPointClick?: (pickupPoint: PickupPoint) => void;
  newUserMode?: boolean;
  newUserData?: {
    fullName: string;
    address: string;
    email: string;
    userId: string;
  };
  onUserAssigned?: (pickupPointId: string, userId: string) => void;
}

// Helper to fetch POIs from Overpass API
type POI = {
  id: number;
  lat: number;
  lon: number;
  tags?: { [key: string]: string };
};

// Add more POI types: gas stations, monuments, and Tangier key locations
async function fetchPOIs(
  bbox: [number, number, number, number],
  types = [
    'cafe', 'restaurant', 'fast_food', 'bar', 'pub', 'supermarket', 'convenience', 'bakery', 'pharmacy', 'bank', 'atm', 'bus_station', 'school', 'university', 'hospital', 'cinema', 'theatre', 'library', 'hotel', 'hostel', 'marketplace', 'mall', 'shop',
    'fuel', // gas stations
    'monument' // monuments
  ]
): Promise<POI[]> {
  // Build Overpass QL query for amenities and tourism, including node, way, and relation
  const amenityTypes = types.filter(t => t !== 'monument');
  const typeQuery = amenityTypes.map(type => `node[amenity=${type}](${bbox.join(',')});way[amenity=${type}](${bbox.join(',')});relation[amenity=${type}](${bbox.join(',')});`).join('');
  // Add monuments (tourism=monument)
  const monumentQuery = `node[tourism=monument](${bbox.join(',')});way[tourism=monument](${bbox.join(',')});relation[tourism=monument](${bbox.join(',')});`;
  const query = `[out:json][timeout:25];(${typeQuery}${monumentQuery});out body center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // Convert way/relation to POI with center coordinates
  const elements = data.elements.map((el: any) => {
    if (el.type === 'node') {
      return el;
    } else if (el.type === 'way' || el.type === 'relation') {
      // Use center if available
      if (el.center) {
        return { id: el.id, lat: el.center.lat, lon: el.center.lon, tags: el.tags };
      }
    }
    return null;
  }).filter(Boolean);
  // Add hardcoded key locations in Tangier (e.g., Grand Socco, Kasbah Museum, etc.)
  const tangierKeyLocations: POI[] = [
    { id: 100001, lat: 35.7831, lon: -5.8136, tags: { name: 'Grand Socco', type: 'key_location' } },
    { id: 100002, lat: 35.7891, lon: -5.8126, tags: { name: 'Kasbah Museum', type: 'key_location' } },
    { id: 100003, lat: 35.7802, lon: -5.8085, tags: { name: 'American Legation', type: 'key_location' } },
    { id: 100004, lat: 35.7672, lon: -5.7996, tags: { name: 'Cap Spartel', type: 'key_location' } },
    { id: 100005, lat: 35.7767, lon: -5.8340, tags: { name: 'Tangier Beach', type: 'key_location' } }
  ];
  return [...elements, ...tangierKeyLocations];
}

// Map click handler component
function MapClickHandler({ addPickupMode, onMapClick }: { addPickupMode: boolean; onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: (e) => {
      if (addPickupMode) {
        onMapClick(e);
      }
    },
  });
  return null;
}

// Map initialization handler
function MapInitHandler({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      // Ensure map is properly initialized
      map.whenReady(() => {
        onMapReady(map);
      });
    }
  }, [map, onMapReady]);
  
  return null;
}

function POIMarkers() {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [zoom, setZoom] = useState<number>(0);
  const map = useMap();

  // Use a bounding box for Tangier and its sub-areas, but not as far as Tetouan
  // Covers Tangier, suburbs, and industrial zones, but not Tetouan (which is east of -5.6)
  const tangierBounds: [number, number, number, number] = [35.68, -5.95, 35.88, -5.65];
  useEffect(() => {
    fetchPOIs(tangierBounds).then(setPOIs);
  }, []);

  useEffect(() => {
    if (!map) return;
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    setZoom(map.getZoom());
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  // Custom icon with pin and label as a single Leaflet divIcon, label only if showLabel is true
  const getPOIIcon = (poi: POI, showLabel: boolean) => {
    const amenity = poi.tags?.amenity;
    const tourism = poi.tags?.tourism;
    const type = poi.tags?.type;
    // Bolder, more visible SVG icons for each type
    const icons: Record<string, string> = {
      pharmacy: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#00BCD4" stroke-width="3"/><rect x="9" y="6" width="4" height="16" rx="2" fill="#00BCD4"/><rect x="4" y="12" width="14" height="4" rx="2" fill="#00BCD4"/></svg>`,
      hospital: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#E53935" stroke-width="3"/><rect x="5" y="8" width="12" height="12" rx="2" fill="#E53935"/><rect x="10" y="12" width="2" height="4" fill="#fff"/><rect x="8" y="14" width="6" height="2" fill="#fff"/></svg>`,
      fuel: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#FF9800" stroke-width="3"/><rect x="7" y="8" width="8" height="12" rx="2" fill="#FF9800"/><rect x="10" y="12" width="2" height="4" fill="#fff"/></svg>`,
      mall: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="10" rx="8" ry="5" fill="#fff" stroke="#8E24AA" stroke-width="3"/><rect x="4" y="10" width="14" height="10" rx="2" fill="#8E24AA"/></svg>`,
      supermarket: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#43A047" stroke-width="3"/><rect x="5" y="10" width="12" height="8" rx="2" fill="#43A047"/><rect x="8" y="14" width="6" height="2" fill="#fff"/></svg>`,
      convenience: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#43A047" stroke-width="3"/><rect x="7" y="10" width="8" height="8" rx="2" fill="#43A047"/></svg>`,
      monument: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#FABB05" stroke-width="3"/><polygon points="11,4 4,24 18,24" fill="#FABB05"/></svg>`,
      bank: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="10" rx="8" ry="5" fill="#fff" stroke="#607D8B" stroke-width="3"/><rect x="4" y="14" width="14" height="8" rx="2" fill="#607D8B"/></svg>`,
      atm: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#607D8B" stroke-width="3"/><rect x="8" y="12" width="6" height="6" rx="2" fill="#607D8B"/></svg>`,
      bakery: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#FFB300" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#FFB300"/></svg>`,
      cafe: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#6D4C41" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#6D4C41"/></svg>`,
      restaurant: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="10" rx="8" ry="5" fill="#fff" stroke="#FF7043" stroke-width="3"/><rect x="10" y="10" width="2" height="10" fill="#FF7043"/><ellipse cx="11" cy="10" rx="4" ry="2" fill="#FF7043"/></svg>`,
      bar: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#8D6E63" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#8D6E63"/></svg>`,
      pub: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#A1887F" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#A1887F"/></svg>`,
      bus_station: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#1976D2" stroke-width="3"/><rect x="7" y="10" width="8" height="8" rx="2" fill="#1976D2"/></svg>`,
      school: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#FFD600" stroke-width="3"/><rect x="5" y="12" width="12" height="8" rx="2" fill="#FFD600"/></svg>`,
      university: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#0288D1" stroke-width="3"/><rect x="5" y="10" width="12" height="8" rx="2" fill="#0288D1"/></svg>`,
      cinema: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#607D8B" stroke-width="3"/><rect x="7" y="14" width="8" height="4" rx="2" fill="#607D8B"/></svg>`,
      theatre: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#D84315" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#D84315"/></svg>`,
      library: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#5D4037" stroke-width="3"/><rect x="7" y="14" width="8" height="4" rx="2" fill="#5D4037"/></svg>`,
      hotel: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="14" rx="10" ry="13" fill="#fff" stroke="#3949AB" stroke-width="3"/><rect x="7" y="10" width="8" height="8" rx="2" fill="#3949AB"/></svg>`,
      hostel: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#039BE5" stroke-width="3"/><rect x="7" y="14" width="8" height="4" rx="2" fill="#039BE5"/></svg>`,
      marketplace: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#FF7043" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#FF7043"/></svg>`,
      shop: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#A142F4" stroke-width="3"/><rect x="7" y="14" width="8" height="4" rx="2" fill="#A142F4"/></svg>`,
      key_location: `<svg width="22" height="28" viewBox="0 0 22 28" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="16" rx="8" ry="5" fill="#fff" stroke="#34A853" stroke-width="3"/><ellipse cx="11" cy="16" rx="6" ry="3" fill="#34A853"/></svg>`
    };
    // Pick icon by amenity, tourism, or type
    let iconSvg = icons[amenity || tourism || type || ''] || icons['shop'];
    // Use only French name if available, else fallback
    const label = poi.tags?.['name:fr'] || poi.tags?.name || amenity || tourism || type || '';
    const html = showLabel
      ? `<div style="display:flex;align-items:center;gap:4px;">
          <span style="display:inline-block;vertical-align:middle;">${iconSvg}</span>
          <span style="background:rgba(255,255,255,0.98);color:#111;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.12);white-space:nowrap;">${label}</span>
        </div>`
      : iconSvg;
    return L ? L.divIcon({ html, className: 'custom-marker', iconSize: [showLabel ? (label.length * 7 + 28) : 22, 28], iconAnchor: [11, 27] }) : undefined;
  };

  return (
    <>
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lon]}
          icon={getPOIIcon(poi, zoom >= 16)}
        >
          {zoom < 16 && (
            <Popup>
              <span style={{ fontSize: 11, fontWeight: 500 }}>
                {poi.tags?.['name:fr'] || poi.tags?.name || poi.tags?.amenity || poi.tags?.tourism || poi.tags?.type}
              </span>
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
}

export default function TransportMap({
  selectedRoute,
  darkMode,
  onRouteSelect,
  onPickupPointSelect,
  onPickupPointClick,
  newUserMode = false,
  newUserData,
  onUserAssigned
}: TransportMapProps) {
  // Prevent SSR errors: only render map if window is defined
  if (typeof window === 'undefined' || !L || !MapContainer) {
    return null;
  }
  // All hooks at the top, before any conditional returns
  const [isLoading, setIsLoading] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [mapKey, setMapKey] = useState(0); // Force re-render when dark mode changes
  const [addPickupMode, setAddPickupMode] = useState(false);
  const [newPickup, setNewPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingPickup, setPendingPickup] = useState<{
    lat: number; 
    lng: number; 
    address?: string;
    suggestedOrder?: number;
  } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  // New user mode states
  const [newUserLocation, setNewUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState<TransportRoute[]>([]);
  const [pickupAssignmentModal, setPickupAssignmentModal] = useState(false);

  // Relats, Tangier coordinates (default map center) - Corrected to actual Tangier Free Zone location
  // Use centralized location constant
  const RELATS_CENTER: Location = RELATS;

  useEffect(() => {
    // Force map re-render when dark mode changes
    setMapKey(prev => prev + 1);
  }, [darkMode]);

  useEffect(() => {
    const loadRouteGeometry = async () => {
      if (!selectedRoute) {
        setRouteGeometry(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log('🚌 Loading route geometry for:', selectedRoute.name);
      
      try {
        // Create a complete route including start point, all pickup points, and end point
        const allRoutePoints = [
          selectedRoute.startPoint,
          ...selectedRoute.pickupPoints.map(pp => pp.location),
          selectedRoute.endPoint
        ];
        
        console.log('📍 Route points to connect:', allRoutePoints.map(p => ({ lat: p.lat, lng: p.lng, addr: p.address.split(',')[0] })));
        
        // Get road-following route from OpenRouteService
        const routeData = await OpenRouteService.getOptimizedRoute(
          allRoutePoints.slice(0, -1), // All except last point (endPoint is passed separately)
          selectedRoute.endPoint
        );

        if (routeData) {
          console.log('✅ Route geometry loaded successfully');
          console.log('📊 Geometry info:', {
            type: routeData.type,
            features: routeData.features?.length,
            coordinates: routeData.features?.[0]?.geometry?.coordinates?.length,
            firstCoord: routeData.features?.[0]?.geometry?.coordinates?.[0],
            lastCoord: routeData.features?.[0]?.geometry?.coordinates?.slice(-1)?.[0]
          });
          setRouteGeometry(routeData);
        } else {
          console.log('⚠️ No route data received, using fallback visualization');
          setRouteGeometry(null);
        }
      } catch (error) {
        console.error('🚨 Error loading route geometry:', error);
        setRouteGeometry(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRouteGeometry();
  }, [selectedRoute]);

  // Handle map ready and bounds fitting
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);
  
  // Note: Automatic bounds fitting is disabled to prevent Leaflet initialization errors
  // Users can manually zoom/pan to see the route

  

  // Reverse geocoding function to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Nominatim reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }, []);

  // Calculate optimal insertion order for pickup point
  const calculateInsertionOrder = useCallback((newLat: number, newLng: number, route: TransportRoute): number => {
    if (!route.pickupPoints.length) return 0;
    
    const distances = route.pickupPoints.map((pickup, index) => {
      const distance = Math.sqrt(
        Math.pow(newLat - pickup.location.lat, 2) + 
        Math.pow(newLng - pickup.location.lng, 2)
      );
      return { index, distance };
    });
    
    // Sort by distance and return the index of the closest pickup point
    distances.sort((a, b) => a.distance - b.distance);
    const closestIndex = distances[0].index;
    
    // Insert after the closest point, unless it's better to insert before
    return closestIndex + 1;
  }, []);

  // Handler for map click in add pickup mode
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    if (addPickupMode && selectedRoute) {
      setAddPickupMode(false);
      setLoadingAddress(true);
      
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Get address for the clicked location
      const address = await reverseGeocode(lat, lng);
      
      // Calculate suggested insertion order
      const suggestedOrder = calculateInsertionOrder(lat, lng, selectedRoute);
      
      setPendingPickup({
        lat,
        lng,
        address,
        suggestedOrder
      });
      
      setLoadingAddress(false);
      setConfirmationModal(true);
    }
  }, [addPickupMode, selectedRoute, reverseGeocode, calculateInsertionOrder]);

  // Confirm and add pickup point
  const confirmAddPickupPoint = useCallback(() => {
    if (pendingPickup && selectedRoute && onRouteSelect) {
      const newPickupPoint: PickupPoint = {
        id: `pickup-new-${Date.now()}`,
        name: `New Pickup Point ${selectedRoute.pickupPoints.length + 1}`,
        location: {
          lat: pendingPickup.lat,
          lng: pendingPickup.lng,
          address: pendingPickup.address || `${pendingPickup.lat.toFixed(5)}, ${pendingPickup.lng.toFixed(5)}`
        },
        currentUsers: 0,
        maxCapacity: 15 // Default capacity
      };
      
      // Create updated route with new pickup point inserted at calculated position
      const newPickupPoints = [...selectedRoute.pickupPoints];
      const insertIndex = Math.min(pendingPickup.suggestedOrder || 0, newPickupPoints.length);
      newPickupPoints.splice(insertIndex, 0, newPickupPoint);
      
      const updatedRoute: TransportRoute = {
        ...selectedRoute,
        pickupPoints: newPickupPoints,
        route: [
          selectedRoute.startPoint,
          ...newPickupPoints.map(pp => pp.location),
          selectedRoute.endPoint
        ]
      };
      
      // Update the route
      onRouteSelect(updatedRoute);
      
      // Clear state
      setPendingPickup(null);
      setConfirmationModal(false);
      
      console.log(`✅ Added pickup point "${newPickupPoint.name}" at position ${insertIndex + 1}`);
    }
  }, [pendingPickup, selectedRoute, onRouteSelect]);

  // Cancel adding pickup point
  const cancelAddPickupPoint = useCallback(() => {
    setPendingPickup(null);
    setConfirmationModal(false);
  }, []);

  function handleMarkerClick(pickupPoint: PickupPoint) {
    onPickupPointSelect?.(pickupPoint);
    onPickupPointClick?.(pickupPoint);
  }

  function createCustomIcon(type: 'start' | 'pickup' | 'end') {
    const icons = {
      start: `<div style="background: #10B981; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(16,185,129,0.4); border: 3px solid white;">🚌</div>`,
      pickup: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 6px rgba(59,130,246,0.4); border: 2px solid white;">📍</div>`,
      end: `<div style="background: #EF4444; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 10px rgba(239,68,68,0.4); border: 3px solid white;">🏢</div>`
    };
    const sizes = {
      start: [32, 32],
      pickup: [28, 28],
      end: [36, 36]
    };
    const anchors = {
      start: [16, 32],
      pickup: [14, 28],
      end: [18, 36]
    };
    return L ? L.divIcon({
      html: icons[type],
      className: 'custom-marker transport-marker',
      iconSize: sizes[type],
      iconAnchor: anchors[type]
    }) : undefined;
  }

  // Calculate bounding box for POI search
  // bounds not needed for POIMarkers anymore
  const bounds = null;

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderTop: `3px solid ${darkMode ? '#60a5fa' : '#3b82f6'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            color: darkMode ? '#d1d5db' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Loading route...
          </span>
        </div>
      </div>
    );
  }

  // If selectedRoute is present, center on its endPoint (Relats), else use RELATS_CENTER
  // Always provide a [number, number] tuple for center
  const initialCenter: [number, number] = selectedRoute?.endPoint && typeof selectedRoute.endPoint.lat === 'number' && typeof selectedRoute.endPoint.lng === 'number'
    ? [selectedRoute.endPoint.lat, selectedRoute.endPoint.lng]
    : [RELATS_CENTER.lat, RELATS_CENTER.lng];

  // (removed duplicate handleMapClick, now defined as function above)

  // Attach click handler after map is ready (only once)
  

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          key={mapKey}
          center={initialCenter}
          zoom={selectedRoute ? 14 : 13}
          maxZoom={19}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={true}
          ref={mapRef as any}
        >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Map initialization handler */}
        <MapInitHandler onMapReady={handleMapReady} />
        {/* Map click handler for adding pickup points */}
        <MapClickHandler addPickupMode={addPickupMode} onMapClick={handleMapClick} />

        {/* Pending Pickup Point Marker (with confirmation) */}
        {pendingPickup && (
          <Marker 
            position={[pendingPickup.lat, pendingPickup.lng]} 
            icon={L.divIcon({ 
              html: `<div style="background: #f59e0b; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(245,158,11,0.5); border: 3px solid white; animation: pulse 2s infinite;">❓</div>`, 
              className: 'custom-marker pending-marker', 
              iconSize: [32, 32], 
              iconAnchor: [16, 32] 
            })}
          >
            <Popup>
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '16px', fontWeight: '600' }}>
                  ⏳ Point de ramassage en attente
                </h4>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                  <strong>Adresse:</strong> {pendingPickup.address || 'Récupération en cours...'}
                </p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  <strong>Position suggérée:</strong> {(pendingPickup.suggestedOrder || 0) + 1}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Legacy New Pickup Point Marker (if selected) */}
        {newPickup && (
          <Marker position={[newPickup.lat, newPickup.lng]} icon={L.divIcon({ html: '📍', className: 'custom-marker', iconSize: [30, 30], iconAnchor: [15, 30] })}>
            <Popup>
              <span style={{ fontWeight: 500 }}>Nouveau point de ramassage</span>
              <br />
              {newPickup.lat.toFixed(5)}, {newPickup.lng.toFixed(5)}
            </Popup>
          </Marker>
        )}

        {selectedRoute && (
          <>
            {/* Start Point Marker (Shuttle Depot) */}
            <Marker
              position={[selectedRoute.startPoint.lat, selectedRoute.startPoint.lng]}
              icon={createCustomIcon('start')}
            >
              <Popup>
                <div style={{ padding: '8px', minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                    🚌 Shuttle Depot
                  </h3>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                    <strong>Address:</strong> {selectedRoute.startPoint.address}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    <strong>Route:</strong> {selectedRoute.name}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Pickup Point Markers */}
            {selectedRoute.pickupPoints.map((pickupPoint, index) => (
              <Marker
                key={pickupPoint.id}
                position={[pickupPoint.location.lat, pickupPoint.location.lng]}
                icon={createCustomIcon('pickup')}
                eventHandlers={{
                  click: () => handleMarkerClick(pickupPoint)
                }}
              >
                <Popup>
                  <div style={{ padding: '8px', minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                      {pickupPoint.name}
                    </h3>
                    <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                      <strong>Address:</strong> {pickupPoint.location.address}
                    </p>
                    <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                      <strong>Users:</strong> {pickupPoint.currentUsers}/{pickupPoint.maxCapacity}
                    </p>
                    <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
                      <strong>Route:</strong> {selectedRoute.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPickupPointClick?.(pickupPoint);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }}
                    >
                      👤 Assign Profile
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* End Point Marker */}
            <Marker
              position={[selectedRoute.endPoint.lat, selectedRoute.endPoint.lng]}
              icon={createCustomIcon('end')}
            >
              <Popup>
                <div style={{ padding: '8px', minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
                    🏢 Relats, Tangier
                  </h3>
                  <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>
                    <strong>Address:</strong> {selectedRoute.endPoint.address}
                  </p>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    <strong>Total Users:</strong> {selectedRoute.totalUsers}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Route Visualization - Road Following Trajectories */}
            {routeGeometry ? (
              // Use GeoJSON from OpenRouteService (follows real roads)
              <>
                <GeoJSON
                  key={`route-geojson-${selectedRoute.id}`}
                  data={routeGeometry}
                  style={{
                    color: darkMode ? '#60a5fa' : '#2563eb',
                    weight: 6,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                  onEachFeature={(feature, layer) => {
                    if (feature.properties) {
                      const distance = feature.properties.summary?.distance || 0;
                      const duration = feature.properties.summary?.duration || 0;
                      
                      layer.bindPopup(
                        `<div style="padding: 8px;">
                          <strong>Route: ${selectedRoute.name}</strong><br/>
                          Distance: ${(distance / 1000).toFixed(1)} km<br/>
                          Duration: ${Math.round(duration / 60)} min
                        </div>`
                      );
                    }
                  }}
                />
                {/* Debug info overlay */}
                {typeof window !== 'undefined' && localStorage.getItem('debug') === 'true' && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 1000
                  }}>
                    ✅ Road-following route active<br/>
                    Coordinates: {routeGeometry.features?.[0]?.geometry?.coordinates?.length}
                  </div>
                )}
              </>
            ) : (
              // Fallback: Dashed polyline to indicate this is NOT following roads
              <>
                <Polyline
                  key={`route-fallback-${selectedRoute.id}`}
                  positions={[
                    [selectedRoute.startPoint.lat, selectedRoute.startPoint.lng],
                    ...selectedRoute.pickupPoints.map(pp => [pp.location.lat, pp.location.lng] as [number, number]),
                    [selectedRoute.endPoint.lat, selectedRoute.endPoint.lng]
                  ]}
                  color={darkMode ? '#fbbf24' : '#f59e0b'}
                  weight={4}
                  opacity={0.7}
                  dashArray="10, 8"
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Warning overlay */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: 'rgba(251, 191, 36, 0.9)',
                  color: '#92400e',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  zIndex: 1000,
                  border: '2px solid #f59e0b'
                }}>
                  ⚠️ Showing approximate route<br/>
                  <small>Real roads not available</small>
                </div>
              </>
            )}
          </>
        )}
      </MapContainer>
      </div>
      <button
        style={{
          marginTop: 12,
          padding: '10px 18px',
          background: addPickupMode ? '#2563eb' : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: addPickupMode ? '0 2px 8px rgba(37,99,235,0.18)' : '0 1px 4px rgba(0,0,0,0.08)',
          transition: 'background 0.2s'
        }}
        onClick={() => setAddPickupMode(v => !v)}
        disabled={false}
      >
        {addPickupMode ? 'Cliquez sur la carte...' : 'Ajouter un point de ramassage'}
      </button>

      {/* Address Loading Overlay */}
      {loadingAddress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `3px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              borderTop: `3px solid #3b82f6`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{
              color: darkMode ? '#d1d5db' : '#374151',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Récupération de l'adresse...
            </span>
          </div>
        </div>
      )}

      {/* Pickup Point Confirmation Modal */}
      {confirmationModal && pendingPickup && selectedRoute && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: darkMode
              ? '0 25px 50px rgba(0,0,0,0.8)'
              : '0 25px 50px rgba(0,0,0,0.15)',
            border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: darkMode ? '#f9fafb' : '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📍 Confirmer le nouveau point de ramassage
            </h3>
            
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: darkMode ? '#374151' : '#f9fafb',
              borderRadius: '8px',
              border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#d1d5db' : '#6b7280'
              }}>
                Adresse détectée:
              </p>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '15px',
                color: darkMode ? '#f9fafb' : '#1f2937',
                lineHeight: '1.5'
              }}>
                {pendingPickup.address}
              </p>
              <p style={{
                margin: '0',
                fontSize: '13px',
                color: darkMode ? '#9ca3af' : '#6b7280'
              }}>
                Coordonnées: {pendingPickup.lat.toFixed(5)}, {pendingPickup.lng.toFixed(5)}
              </p>
            </div>

            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: darkMode ? '#065f46' : '#f0fdf4',
              borderRadius: '8px',
              border: darkMode ? '1px solid #059669' : '1px solid #22c55e'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#86efac' : '#16a34a'
              }}>
                Ordre de ramassage suggéré:
              </p>
              <p style={{
                margin: '0',
                fontSize: '15px',
                color: darkMode ? '#d1fae5' : '#15803d'
              }}>
                Position {(pendingPickup.suggestedOrder || 0) + 1} sur {selectedRoute.pickupPoints.length + 1} points
              </p>
              {pendingPickup.suggestedOrder !== undefined && pendingPickup.suggestedOrder > 0 && (
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '13px',
                  color: darkMode ? '#a7f3d0' : '#166534',
                  fontStyle: 'italic'
                }}>
                  Ce point sera inséré après "{selectedRoute.pickupPoints[pendingPickup.suggestedOrder - 1]?.name}"
                </p>
              )}
              {pendingPickup.suggestedOrder === 0 && (
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '13px',
                  color: darkMode ? '#a7f3d0' : '#166534',
                  fontStyle: 'italic'
                }}>
                  Ce point sera le premier point de ramassage
                </p>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelAddPickupPoint}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#6b7280' : '#d1d5db'}`,
                  background: darkMode ? '#374151' : '#f9fafb',
                  color: darkMode ? '#d1d5db' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? '#4b5563' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? '#374151' : '#f9fafb';
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmAddPickupPoint}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#22c55e',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(34,197,94,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#16a34a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34,197,94,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#22c55e';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.2)';
                }}
              >
                ✅ Confirmer l'ajout
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
          font-size: 24px;
          text-align: center;
          line-height: 30px;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          background: ${darkMode ? '#1f2937' : '#ffffff'};
          color: ${darkMode ? '#f9fafb' : '#1f2937'};
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-tip {
          background: ${darkMode ? '#1f2937' : '#ffffff'};
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .pending-marker {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}