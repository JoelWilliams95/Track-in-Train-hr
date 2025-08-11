import { Loader } from '@googlemaps/js-api-loader';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Initialize Google Maps loader
export const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry']
});

// Types for transport optimization
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface PickupPoint {
  id: string;
  location: Location;
  name: string;
  currentUsers: number;
  maxCapacity: number;
}

export interface TransportRoute {
  id: string;
  name: string;
  pickupPoints: PickupPoint[];
  endPoint: Location;
  totalUsers: number;
  route: Location[];
}

export interface EmployeeProfile {
  id: string;
  fullName: string;
  address: string;
  location?: Location;
  assignedRoute?: string;
  assignedPickupPoint?: string;
  distanceToPickup?: number; // in meters
}

// Geocoding service
export class GeocodingService {
  private static geocoder: google.maps.Geocoder | null = null;

  static async initialize(): Promise<void> {
    if (!this.geocoder) {
      await loader.load();
      this.geocoder = new google.maps.Geocoder();
    }
  }

  static async geocodeAddress(address: string): Promise<Location | null> {
    try {
      await this.initialize();
      
      if (!this.geocoder) {
        throw new Error('Geocoder not initialized');
      }

      const result = await this.geocoder.geocode({ address });
      
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
          address: result.results[0].formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}

// Distance calculation service
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

    return R * c; // Distance in meters
  }

  static isWithinRange(point1: Location, point2: Location, maxDistance: number = 1000): boolean {
    const distance = this.calculateDistance(point1, point2);
    return distance <= maxDistance;
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
    // This would implement more sophisticated optimization algorithms
    // For now, return the current routes
    return this.routes;
  }

  static getRouteById(routeId: string): TransportRoute | undefined {
    return this.routes.find(route => route.id === routeId);
  }

  static getPickupPointById(pickupPointId: string): PickupPoint | undefined {
    return this.pickupPoints.find(point => point.id === pickupPointId);
  }
}

// Map utilities for visualization
export class MapUtils {
  static createMap(element: HTMLElement, center: Location, zoom: number = 12): google.maps.Map {
    return new google.maps.Map(element, {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      styles: this.getMapStyles(),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
  }

  static createMarker(
    map: google.maps.Map,
    position: Location,
    title: string,
    icon?: string
  ): google.maps.Marker {
    return new google.maps.Marker({
      position: { lat: position.lat, lng: position.lng },
      map: map,
      title: title,
      icon: icon
    });
  }

  static createPolyline(
    map: google.maps.Map,
    path: Location[],
    color: string = '#3B82F6',
    weight: number = 3
  ): google.maps.Polyline {
    return new google.maps.Polyline({
      path: path.map(loc => ({ lat: loc.lat, lng: loc.lng })),
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: weight,
      map: map
    });
  }

  static createInfoWindow(content: string): google.maps.InfoWindow {
    return new google.maps.InfoWindow({
      content: content
    });
  }

  private static getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }
} 