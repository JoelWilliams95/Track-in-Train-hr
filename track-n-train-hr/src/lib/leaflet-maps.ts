import type { TransportRoute, PickupPoint, EmployeeProfile } from '../models';
// Location type for map coordinates and address
export type Location = {
  lat: number;
  lng: number;
  address: string;
};
// Do not import Leaflet at the top level to avoid SSR errors

// OpenRouteService API configuration
const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY || '';
const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org/v2';

// Types for transport optimization
// Leaflet map utilities for visualization
export class LeafletMapUtils {
  static createMap(element: HTMLElement, center: Location, zoom: number = 12): any {
    const L = require('leaflet');
    return L.map(element, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
      attributionControl: true
    });
  }


  static createGeoJSONRoute(
    map: any,
    geojsonData: any,
    color: string = '#3B82F6',
    weight: number = 3
  ): any {
    const L = require('leaflet');
    return L.geoJSON(geojsonData, {
      style: {
        color: color,
        weight: weight,
        opacity: 0.8
      }
    }).addTo(map);
  }

  static createInfoWindow(content: string): any {
    const L = require('leaflet');
    return L.popup({
      maxWidth: 300,
      className: 'custom-popup'
    }).setContent(content);
  }

  static createCustomIcon(type: 'start' | 'pickup' | 'end' | 'employee'): any {
    const L = require('leaflet');
    const icons = {
      start: '🚌',
      pickup: '📍',
      end: '🏢',
      employee: '👤'
    };
    return L.divIcon({
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      html: icons[type]
    });
  }

  static addTileLayer(map: any, darkMode: boolean = false): void {
    const L = require('leaflet');
    const tileLayer = darkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    L.tileLayer(tileLayer, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
  }

  static createMarker(
    map: any,
    position: Location,
    title: string
  ): any {
    const L = require('leaflet');
    return L.marker([position.lat, position.lng])
      .addTo(map)
      .bindPopup(title);
  }
}

export class DistanceService {
  static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Geocoding service
export class GeocodingService {
  static async geocodeAddress(address: string): Promise<Location | null> {
    // Simple mock geocoding for development
    // In production, you'd use a real geocoding service
    console.log('Geocoding address:', address);
    
    // Return a mock location near Tangier center
    return {
      lat: 35.7595 + (Math.random() - 0.5) * 0.01,
      lng: -5.8340 + (Math.random() - 0.5) * 0.01,
      address: address
    };
  }
}

// OpenRouteService API for route optimization
export class OpenRouteService {
  static async getRoute(coordinates: [number, number][]): Promise<any> {
    const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
    if (!OPENROUTE_API_KEY) {
      console.log('OpenRouteService API key missing, using fallback route generation');
      return null;
    }

    // Ensure we have at least 2 coordinates
    if (coordinates.length < 2) {
      console.error('Need at least 2 coordinates for routing');
      return null;
    }

    try {
      console.log('🗺️ Requesting route with coordinates:', coordinates);
      
      const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
        method: 'POST',
        headers: {
          'Authorization': OPENROUTE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/geo+json'
        },
        body: JSON.stringify({
          coordinates: coordinates,
          preference: 'shortest', // Prioritize shorter routes
          geometry: true,
          instructions: false,
          elevation: false,
          options: {
            avoid_features: ['ferries'],
            avoid_borders: 'controlled'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🚨 OpenRouteService error: ${response.status} ${response.statusText}`, errorText);
        return null;
      }

      const data = await response.json();
      console.log('✅ OpenRouteService route data received:', {
        features: data.features?.length,
        coordinates: data.features?.[0]?.geometry?.coordinates?.length
      });
      
      // Validate the response structure
      if (!data.features || !data.features[0] || !data.features[0].geometry) {
        console.error('❌ Invalid route data structure received');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('🚨 OpenRouteService request failed:', error);
      return null;
    }
  }

  static async getOptimizedRoute(pickupPoints: Location[], endPoint: Location): Promise<any> {
    try {
      // Create coordinates array for the route
      const coordinates: [number, number][] = [
        ...pickupPoints.map(point => [point.lng, point.lat] as [number, number]),
        [endPoint.lng, endPoint.lat]
      ];

      console.log('Requesting route with coordinates:', coordinates);

      const result = await this.getRoute(coordinates);
      
      // If OpenRouteService fails, create a simple fallback GeoJSON
      if (!result && coordinates.length >= 2) {
        console.log('OpenRouteService failed, creating fallback route');
        return this.createFallbackRoute(coordinates);
      }

      return result;
    } catch (error) {
      console.error('Route optimization error:', error);
      return null;
    }
  }

  // Create a simple straight-line route as fallback
  static createFallbackRoute(coordinates: [number, number][]): any {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          },
          properties: {
            segments: [{
              distance: 0,
              duration: 0,
              steps: []
            }],
            summary: {
              distance: 0,
              duration: 0
            },
            way_points: [0, coordinates.length - 1]
          }
        }
      ]
    };
  }
}

// Transport optimization service
export class TransportOptimizationService {
  private static routes: TransportRoute[] = [];
  private static pickupPoints: PickupPoint[] = [];

  static initializeRoutes(routes: TransportRoute[]): void {
    this.routes = routes;
    this.pickupPoints = routes.flatMap(route => route.pickupPoints);
  }

  static async assignEmployeeToRoute(employee: EmployeeProfile): Promise<{
    assignedRoute: string;
    assignedPickupPoint: string;
    distanceToPickup: number;
    pickupPointLocation: Location;
  } | null> {
    try {
      // Geocode employee address if not already done
      let employeeLocation = employee.location;
      if (!employeeLocation) {
        const geocodedLocation = await GeocodingService.geocodeAddress(employee.address);
        if (!geocodedLocation) {
          throw new Error('Could not geocode employee address');
        }
        employeeLocation = geocodedLocation;
      }

      // Find the best pickup point for this employee
      const bestAssignment = this.findBestPickupPoint(employeeLocation);
      
      if (!bestAssignment) {
        throw new Error('No suitable pickup point found within 1km');
      }

      return bestAssignment;
    } catch (error) {
      console.error('Error assigning employee to route:', error);
      return null;
    }
  }

  private static findBestPickupPoint(employeeLocation: Location): {
    assignedRoute: string;
    assignedPickupPoint: string;
    distanceToPickup: number;
    pickupPointLocation: Location;
  } | null {
    let bestAssignment: {
      assignedRoute: string;
      assignedPickupPoint: string;
      distanceToPickup: number;
      pickupPointLocation: Location;
    } | null = null;
    let minDistance = Infinity;

    // Check all pickup points
    for (const route of this.routes) {
      for (const pickupPoint of route.pickupPoints) {
        const distance = DistanceService.calculateDistance(employeeLocation, pickupPoint.location);
        
        // Check if within 1km and has capacity
        if (distance <= 1000 && pickupPoint.currentUsers < pickupPoint.maxCapacity) {
          // Prefer closer pickup points
          if (distance < minDistance) {
            minDistance = distance;
            bestAssignment = {
              assignedRoute: route.id,
              assignedPickupPoint: pickupPoint.id,
              distanceToPickup: distance,
              pickupPointLocation: pickupPoint.location
            };
          }
        }
      }
    }

    return bestAssignment;
  }

  static async optimizeRoutes(): Promise<TransportRoute[]> {
    // Get optimized routes from OpenRouteService
    const optimizedRoutes = await Promise.all(
      this.routes.map(async (route) => {
        try {
          const routeData = await OpenRouteService.getOptimizedRoute(
            route.pickupPoints.map(pp => pp.location),
            route.endPoint
          );

          if (routeData) {
            return {
              ...route,
              routeGeometry: routeData.features?.[0]?.geometry || null
            };
          }
        } catch (error) {
          console.error(`Error optimizing route ${route.id}:`, error);
        }
        
        return route;
      })
    );

    return optimizedRoutes.filter(route => route !== null);
  }

  static getRouteById(routeId: string): TransportRoute | undefined {
    return this.routes.find(route => route.id === routeId);
  }

  static getPickupPointById(pickupPointId: string): PickupPoint | undefined {
    return this.pickupPoints.find(point => point.id === pickupPointId);
  }
}
