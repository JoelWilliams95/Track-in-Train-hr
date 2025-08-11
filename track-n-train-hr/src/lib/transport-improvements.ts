// Enhanced Transport System with Performance and Feature Improvements
import L from 'leaflet';
import { Location } from './leaflet-maps';

// Enhanced types with additional features
export interface EnhancedLocation {
  id?: string;
  lat: number;
  lng: number;
  address: string;
  type?: 'pickup' | 'destination' | 'waypoint';
  estimatedTime?: number; // minutes
  priority?: number; // 1-5 scale
}

export interface RouteSchedule {
  id: string;
  routeId: string;
  departureTime: string;
  estimatedArrival: string;
  driverId?: string;
  vehicleId?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  actualDepartureTime?: string;
  actualArrivalTime?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
  type: 'bus' | 'van' | 'car';
  status: 'available' | 'in_use' | 'maintenance';
  fuelLevel?: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  status: 'available' | 'driving' | 'off_duty';
  assignedVehicle?: string;
  rating?: number;
}

export interface TransportAnalytics {
  routeId: string;
  totalTrips: number;
  averageOccupancy: number;
  onTimePerformance: number;
  fuelConsumption: number;
  costPerKm: number;
  employeeSatisfaction: number;
}

// Enhanced caching system
export class TransportCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clear(): void {
    this.cache.clear();
  }

  static has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Enhanced geocoding with better address suggestions
class EnhancedGeocodingService {
  private static readonly TANGIER_ADDRESSES = [
    // City Center
    { name: 'Grand Socco', lat: 35.7889, lng: -5.8138, type: 'landmark' },
    { name: 'Place de France', lat: 35.7595, lng: -5.8340, type: 'landmark' },
    { name: 'Kasbah Museum', lat: 35.7891, lng: -5.8126, type: 'landmark' },
    { name: 'American Legation', lat: 35.7802, lng: -5.8085, type: 'landmark' },
    
    // Residential Areas
    { name: 'Malabata', lat: 35.7800, lng: -5.7800, type: 'residential' },
    { name: 'California', lat: 35.7650, lng: -5.8100, type: 'residential' },
    { name: 'Boubana', lat: 35.7400, lng: -5.8200, type: 'residential' },
    { name: 'Dradeb', lat: 35.7300, lng: -5.8300, type: 'residential' },
    
    // Industrial Areas
    { name: 'Free Zone', lat: 35.7400, lng: -5.9200, type: 'industrial' },
    { name: 'Industrial Zone Gzenaya', lat: 35.7350, lng: -5.9300, type: 'industrial' },
    { name: 'Port of Tangier', lat: 35.7731, lng: -5.8006, type: 'industrial' },
    
    // Transportation Hubs
    { name: 'Ibn Battuta Airport', lat: 35.7269, lng: -5.9167, type: 'transport' },
    { name: 'Tangier Train Station', lat: 35.7600, lng: -5.8500, type: 'transport' },
    { name: 'CTM Bus Station', lat: 35.7650, lng: -5.8200, type: 'transport' },
    
    // Universities & Schools
    { name: 'Abdelmalek Essaadi University', lat: 35.7500, lng: -5.8700, type: 'education' },
    { name: 'ENCGT', lat: 35.7450, lng: -5.8650, type: 'education' },
    { name: 'ENSA Tangier', lat: 35.7480, lng: -5.8680, type: 'education' },
    
    // Hotels & Tourism
    { name: 'Hotel Continental', lat: 35.7847, lng: -5.8063, type: 'hotel' },
    { name: 'Hilton Garden Inn', lat: 35.7600, lng: -5.8300, type: 'hotel' },
    { name: 'Cap Spartel', lat: 35.7672, lng: -5.7996, type: 'tourism' },
    
    // Shopping & Commercial
    { name: 'Socco Chico', lat: 35.7847, lng: -5.8063, type: 'commercial' },
    { name: 'City Center Tangier', lat: 35.7550, lng: -5.8250, type: 'commercial' },
    { name: 'Marjane Tangier', lat: 35.7400, lng: -5.8400, type: 'commercial' }
  ];

  static async geocodeAddress(address: string): Promise<EnhancedLocation | null> {
    const cacheKey = `geocode_${address}`;
    const cached = TransportCache.get(cacheKey);
    if (cached) return cached;

    try {
      // First try OpenRouteService
      const orsResult = await this.geocodeWithOpenRouteService(address);
      if (orsResult) {
        TransportCache.set(cacheKey, orsResult, 60); // Cache for 1 hour
        return orsResult;
      }

      // Fallback to local database
      const localResult = this.geocodeWithLocalDatabase(address);
      if (localResult) {
        TransportCache.set(cacheKey, localResult, 30); // Cache for 30 minutes
        return localResult;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return this.geocodeWithLocalDatabase(address);
    }
  }

  private static async geocodeWithOpenRouteService(address: string): Promise<EnhancedLocation | null> {
    const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
    if (!OPENROUTE_API_KEY) return null;

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTE_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=MA&size=1`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.geometry.coordinates;
        
        return {
          id: `geocoded_${Date.now()}`,
          lat,
          lng,
          address: feature.properties.label || address,
          type: 'waypoint'
        };
      }
    } catch (error) {
      console.error('OpenRouteService geocoding error:', error);
    }

    return null;
  }

  private static geocodeWithLocalDatabase(address: string): EnhancedLocation | null {
    const lowerAddress = address.toLowerCase();
    
    // Find best match
    const matches = this.TANGIER_ADDRESSES.filter(addr => 
      lowerAddress.includes(addr.name.toLowerCase()) ||
      addr.name.toLowerCase().includes(lowerAddress)
    );

    if (matches.length > 0) {
      const bestMatch = matches[0];
      return {
        id: `local_${bestMatch.name.replace(/\s+/g, '_')}`,
        lat: bestMatch.lat,
        lng: bestMatch.lng,
        address: `${bestMatch.name}, Tangier, Morocco`,
        type: 'waypoint'
      };
    }

    // Default to Tangier center
    return {
      id: 'default_tangier',
      lat: 35.7595,
      lng: -5.8340,
      address: 'Tangier Center, Morocco',
      type: 'waypoint'
    };
  }

  static getAddressSuggestions(query: string, limit: number = 10): Array<{name: string, type: string}> {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return this.TANGIER_ADDRESSES
      .filter(addr => addr.name.toLowerCase().includes(lowerQuery))
      .slice(0, limit)
      .map(addr => ({ name: addr.name, type: addr.type }));
  }
}

// Enhanced route optimization with multiple algorithms
class EnhancedRouteOptimizer {
  static async optimizeRoute(
    pickupPoints: EnhancedLocation[],
    endPoint: EnhancedLocation,
    algorithm: 'nearest_neighbor' | 'genetic' | 'openroute' = 'openroute'
  ): Promise<{
    optimizedOrder: EnhancedLocation[];
    totalDistance: number;
    estimatedTime: number;
    fuelCost: number;
  }> {
    const cacheKey = `route_${pickupPoints.map(p => p.id).join('_')}_${endPoint.id}_${algorithm}`;
    const cached = TransportCache.get(cacheKey);
    if (cached) return cached;

    let result;
    
    switch (algorithm) {
      case 'genetic':
        result = await this.geneticAlgorithmOptimization(pickupPoints, endPoint);
        break;
      case 'nearest_neighbor':
        result = await this.nearestNeighborOptimization(pickupPoints, endPoint);
        break;
      default:
        result = await this.openRouteServiceOptimization(pickupPoints, endPoint);
    }

    TransportCache.set(cacheKey, result, 15); // Cache for 15 minutes
    return result;
  }

  private static async openRouteServiceOptimization(
    pickupPoints: EnhancedLocation[],
    endPoint: EnhancedLocation
  ): Promise<any> {
    try {
      const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
      if (!OPENROUTE_API_KEY) {
        return this.nearestNeighborOptimization(pickupPoints, endPoint);
      }

      const coordinates = [
        ...pickupPoints.map(p => [p.lng, p.lat]),
        [endPoint.lng, endPoint.lat]
      ];

      const response = await fetch('https://api.openrouteservice.org/optimization', {
        method: 'POST',
        headers: {
          'Authorization': OPENROUTE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobs: pickupPoints.map((p, i) => ({
            id: i,
            location: [p.lng, p.lat]
          })),
          vehicles: [{
            id: 0,
            start: [pickupPoints[0].lng, pickupPoints[0].lat],
            end: [endPoint.lng, endPoint.lat]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Process OpenRouteService response
        return this.processOptimizationResult(data, pickupPoints, endPoint);
      }
    } catch (error) {
      console.error('OpenRouteService optimization error:', error);
    }

    // Fallback to nearest neighbor
    return this.nearestNeighborOptimization(pickupPoints, endPoint);
  }

  private static async nearestNeighborOptimization(
    pickupPoints: EnhancedLocation[],
    endPoint: EnhancedLocation
  ): Promise<any> {
    const unvisited = [...pickupPoints];
    const optimizedOrder: EnhancedLocation[] = [];
    let currentLocation = pickupPoints[0];
    let totalDistance = 0;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      unvisited.forEach((point, index) => {
        const distance = this.calculateDistance(currentLocation, point);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nearestPoint = unvisited.splice(nearestIndex, 1)[0];
      optimizedOrder.push(nearestPoint);
      totalDistance += nearestDistance;
      currentLocation = nearestPoint;
    }

    // Add distance to end point
    totalDistance += this.calculateDistance(currentLocation, endPoint);

    return {
      optimizedOrder,
      totalDistance,
      estimatedTime: Math.ceil(totalDistance / 1000 * 2.5), // Rough estimate: 2.5 minutes per km
      fuelCost: totalDistance / 1000 * 0.08 * 15 // Rough estimate: 8L/100km * 15 MAD/L
    };
  }

  private static async geneticAlgorithmOptimization(
    pickupPoints: EnhancedLocation[],
    endPoint: EnhancedLocation
  ): Promise<any> {
    // Simplified genetic algorithm implementation
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;

    let population = this.generateInitialPopulation(pickupPoints, populationSize);
    
    for (let gen = 0; gen < generations; gen++) {
      const fitness = population.map(individual => 
        1 / this.calculateRouteDistance(individual, endPoint)
      );
      
      const newPopulation = [];
      
      for (let i = 0; i < populationSize; i++) {
        const parent1 = this.selectParent(population, fitness);
        const parent2 = this.selectParent(population, fitness);
        let child = this.crossover(parent1, parent2);
        
        if (Math.random() < mutationRate) {
          child = this.mutate(child);
        }
        
        newPopulation.push(child);
      }
      
      population = newPopulation;
    }

    // Find best solution
    const bestSolution = population.reduce((best, current) => {
      const bestDistance = this.calculateRouteDistance(best, endPoint);
      const currentDistance = this.calculateRouteDistance(current, endPoint);
      return currentDistance < bestDistance ? current : best;
    });

    const totalDistance = this.calculateRouteDistance(bestSolution, endPoint);

    return {
      optimizedOrder: bestSolution,
      totalDistance,
      estimatedTime: Math.ceil(totalDistance / 1000 * 2.5),
      fuelCost: totalDistance / 1000 * 0.08 * 15
    };
  }

  private static generateInitialPopulation(points: EnhancedLocation[], size: number): EnhancedLocation[][] {
    const population: EnhancedLocation[][] = [];
    
    for (let i = 0; i < size; i++) {
      const shuffled = [...points].sort(() => Math.random() - 0.5);
      population.push(shuffled);
    }
    
    return population;
  }

  private static selectParent(population: EnhancedLocation[][], fitness: number[]): EnhancedLocation[] {
    const totalFitness = fitness.reduce((sum, f) => sum + f, 0);
    let random = Math.random() * totalFitness;
    
    for (let i = 0; i < population.length; i++) {
      random -= fitness[i];
      if (random <= 0) {
        return population[i];
      }
    }
    
    return population[population.length - 1];
  }

  private static crossover(parent1: EnhancedLocation[], parent2: EnhancedLocation[]): EnhancedLocation[] {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;
    
    const child = new Array(parent1.length);
    const segment = parent1.slice(start, end);
    
    // Copy segment from parent1
    for (let i = start; i < end; i++) {
      child[i] = parent1[i];
    }
    
    // Fill remaining positions with parent2 order
    let parent2Index = 0;
    for (let i = 0; i < parent1.length; i++) {
      if (child[i] === undefined) {
        while (segment.some(p => p.id === parent2[parent2Index].id)) {
          parent2Index++;
        }
        child[i] = parent2[parent2Index];
        parent2Index++;
      }
    }
    
    return child;
  }

  private static mutate(individual: EnhancedLocation[]): EnhancedLocation[] {
    const mutated = [...individual];
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);
    
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    
    return mutated;
  }

  private static calculateRouteDistance(route: EnhancedLocation[], endPoint: EnhancedLocation): number {
    let totalDistance = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.calculateDistance(route[i], route[i + 1]);
    }
    
    // Add distance to end point
    totalDistance += this.calculateDistance(route[route.length - 1], endPoint);
    
    return totalDistance;
  }

  private static calculateDistance(point1: EnhancedLocation, point2: EnhancedLocation): number {
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

  private static processOptimizationResult(data: any, pickupPoints: EnhancedLocation[], endPoint: EnhancedLocation): any {
    // Process the OpenRouteService optimization result
    // This is a simplified version - you'd need to adapt based on actual API response
    return {
      optimizedOrder: pickupPoints, // Placeholder
      totalDistance: 0,
      estimatedTime: 0,
      fuelCost: 0
    };
  }
}

// Real-time tracking service
class RealTimeTrackingService {
  private static connections = new Map<string, WebSocket>();
  private static trackingData = new Map<string, any>();

  static startTracking(routeId: string, callback: (data: any) => void): void {
    // In a real implementation, this would connect to a WebSocket server
    // For now, we'll simulate real-time updates
    const interval = setInterval(() => {
      const mockData = {
        routeId,
        currentLocation: {
          lat: 35.7595 + (Math.random() - 0.5) * 0.01,
          lng: -5.8340 + (Math.random() - 0.5) * 0.01
        },
        speed: Math.random() * 60 + 20, // 20-80 km/h
        nextStop: 'Grand Socco',
        estimatedArrival: new Date(Date.now() + Math.random() * 600000).toISOString(),
        passengerCount: Math.floor(Math.random() * 30) + 10
      };
      
      callback(mockData);
    }, 5000); // Update every 5 seconds

    // Store interval for cleanup
    this.trackingData.set(routeId, interval);
  }

  static stopTracking(routeId: string): void {
    const interval = this.trackingData.get(routeId);
    if (interval) {
      clearInterval(interval);
      this.trackingData.delete(routeId);
    }
  }
}

// Analytics service
class TransportAnalyticsService {
  static async generateRouteAnalytics(routeId: string, dateRange: { start: Date; end: Date }): Promise<TransportAnalytics> {
    // In a real implementation, this would query the database
    // For now, we'll return mock data
    return {
      routeId,
      totalTrips: Math.floor(Math.random() * 100) + 50,
      averageOccupancy: Math.random() * 0.4 + 0.6, // 60-100%
      onTimePerformance: Math.random() * 0.2 + 0.8, // 80-100%
      fuelConsumption: Math.random() * 20 + 80, // 80-100 L
      costPerKm: Math.random() * 2 + 8, // 8-10 MAD/km
      employeeSatisfaction: Math.random() * 1 + 4 // 4-5 stars
    };
  }

  static async generateCostAnalysis(routeId: string): Promise<{
    fuelCosts: number;
    maintenanceCosts: number;
    driverCosts: number;
    totalCosts: number;
    costPerEmployee: number;
    suggestions: string[];
  }> {
    return {
      fuelCosts: Math.random() * 2000 + 3000,
      maintenanceCosts: Math.random() * 1000 + 500,
      driverCosts: Math.random() * 3000 + 5000,
      totalCosts: Math.random() * 6000 + 8500,
      costPerEmployee: Math.random() * 200 + 300,
      suggestions: [
        'Consider route optimization to reduce fuel consumption',
        'Implement carpooling for low-occupancy routes',
        'Schedule maintenance during off-peak hours',
        'Use fuel-efficient vehicles for longer routes'
      ]
    };
  }
}

// Notification service for transport updates
class TransportNotificationService {
  static async sendRouteUpdate(
    routeId: string,
    message: string,
    type: 'delay' | 'cancellation' | 'route_change' | 'info'
  ): Promise<void> {
    // In a real implementation, this would send notifications to all employees on the route
    console.log(`Transport notification for route ${routeId}: ${message}`);
    
    // You could integrate with the existing notification system
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'transport',
          targetUsers: ['all'], // Or specific users on the route
          message: `🚌 Transport Update: ${message}`,
          data: {
            routeId,
            type,
            timestamp: new Date().toISOString()
          }
        }),
      });
    } catch (error) {
      console.error('Failed to send transport notification:', error);
    }
  }

  static async sendDelayNotification(routeId: string, delayMinutes: number): Promise<void> {
    const message = `Route delayed by ${delayMinutes} minutes. New estimated arrival time will be updated shortly.`;
    await this.sendRouteUpdate(routeId, message, 'delay');
  }

  static async sendCancellationNotification(routeId: string, reason: string): Promise<void> {
    const message = `Route cancelled due to ${reason}. Please arrange alternative transportation.`;
    await this.sendRouteUpdate(routeId, message, 'cancellation');
  }
}

// Export all services
export {
  EnhancedGeocodingService,
  EnhancedRouteOptimizer,
  RealTimeTrackingService,
  TransportAnalyticsService,
  TransportNotificationService
};
