import { NextRequest, NextResponse } from 'next/server';
import { 
  TransportOptimizationService, 
  GeocodingService,
  Location 
} from '@/lib/leaflet-maps';
import { EmployeeProfile } from '@/models';
import { withMiddlewares } from '@/lib/api-middleware';

export const POST = withMiddlewares(async (request: NextRequest) => {
  try {
    const data = await request.json();
    const { employeeAddress, employeeName } = data;

    if (!employeeAddress) {
      return NextResponse.json({ 
        error: 'Employee address is required' 
      }, { status: 400 });
    }

    // Create employee profile
    const employee: EmployeeProfile = {
      id: `emp-${Date.now()}`,
      fullName: employeeName || 'Unknown Employee',
      address: employeeAddress
    };

    // Assign employee to optimal route and pickup point
    const assignment = await TransportOptimizationService.assignEmployeeToRoute(employee);

    if (!assignment) {
      return NextResponse.json({ 
        error: 'No suitable pickup point found within 1km of the employee address',
        distance: 'No pickup points within range'
      }, { status: 404 });
    }

    // Get route and pickup point details
    const route = TransportOptimizationService.getRouteById(assignment.assignedRoute);
    const pickupPoint = TransportOptimizationService.getPickupPointById(assignment.assignedPickupPoint);

    if (!route || !pickupPoint) {
      return NextResponse.json({ 
        error: 'Route or pickup point not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment: {
        routeId: assignment.assignedRoute,
        routeName: route.name,
        pickupPointId: assignment.assignedPickupPoint,
        pickupPointName: pickupPoint.name,
        pickupPointAddress: pickupPoint.location.address,
        distanceToPickup: Math.round(assignment.distanceToPickup), // in meters
        distanceToPickupKm: (assignment.distanceToPickup / 1000).toFixed(2), // in km
        employeeLocation: employee.location,
        pickupPointLocation: assignment.pickupPointLocation
      },
      route: {
        id: route.id,
        name: route.name,
        totalUsers: route.totalUsers,
        pickupPoints: route.pickupPoints.map(pp => ({
          id: pp.id,
          name: pp.name,
          address: pp.location.address,
          currentUsers: pp.currentUsers,
          maxCapacity: pp.maxCapacity
        })),
        endPoint: route.endPoint
      }
    });

  } catch (error) {
    console.error('Transport optimization error:', error);
    return NextResponse.json({ 
      error: 'Failed to optimize transport route',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { rateLimit: { points: 30, duration: 60 } });

export const GET = withMiddlewares(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ 
        error: 'Address parameter is required' 
      }, { status: 400 });
    }

    // Geocode the address
    const location = await GeocodingService.geocodeAddress(address);

    if (!location) {
      return NextResponse.json({ 
        error: 'Could not geocode the provided address' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address
      }
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ 
      error: 'Failed to geocode address',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { rateLimit: { points: 60, duration: 60 } });
