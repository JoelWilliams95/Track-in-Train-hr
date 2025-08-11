# Leaflet.js & OpenRouteService Setup for Transport Optimization

This guide will help you set up Leaflet.js for map display and OpenRouteService API for route optimization.

## 🚀 Features Implemented

### 1. **Interactive Transport Map with Leaflet.js**
- Real-time route visualization with Leaflet.js
- Pickup point markers with capacity information
- Route polylines and GeoJSON from OpenRouteService
- Dark/light mode support with different tile layers
- Clickable markers with detailed information

### 2. **Smart Address Input**
- Custom address suggestions for Tangier locations
- Automatic geocoding with coordinate extraction
- Address verification with coordinates
- Local address database for better accuracy

### 3. **OpenRouteService Route Optimization**
- Real route calculation using OpenRouteService API
- GeoJSON route visualization
- Distance calculation within 1km constraint
- Route capacity management

## 🔧 Setup Instructions

### Step 1: Get OpenRouteService API Key

1. Go to [OpenRouteService](https://openrouteservice.org/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. The free tier includes 2,000 requests per day

### Step 2: Add API Key to Environment

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your OpenRouteService API key:

```env
NEXT_PUBLIC_OPENROUTE_API_KEY=your_openroute_api_key_here
```

### Step 3: Install Dependencies

The required packages are already installed:
- `leaflet` - Map library
- `react-leaflet` - React wrapper for Leaflet
- `@types/leaflet` - TypeScript definitions

### Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/transport-routes` to see the interactive map
3. Test the address input with suggestions
4. Try the transport optimization feature

## 📍 Transport Routes Configuration

The system includes three pre-configured routes in Tangier:

### Route 1: Tangier Center - Relats
- **Pickup Points:** 6 locations
- **Capacity:** 45 users
- **Route:** City Center → Grand Socco → Kasbah → Port Area → Free Zone → Industrial Zone → Relats

### Route 2: Airport - Relats
- **Pickup Points:** 5 locations
- **Capacity:** 32 users
- **Route:** Ibn Battuta Airport → Highway Junction → University → Train Station → City Center → Relats

### Route 3: Malabata - Relats
- **Pickup Points:** 5 locations
- **Capacity:** 28 users
- **Route:** Malabata Beach → Corniche → Hotel District → Grand Socco → Medina → Relats

## 🎯 Optimization Logic

The system uses the following algorithm to assign employees to routes:

1. **Geocode Employee Address:** Convert address to coordinates using local database
2. **Calculate Distances:** Measure distance to all pickup points
3. **Filter by Range:** Only consider pickup points within 1km
4. **Check Capacity:** Ensure pickup point has available capacity
5. **Select Optimal:** Choose the closest pickup point that meets criteria
6. **Assign Route:** Automatically assign to the route containing the pickup point

## 🔄 API Endpoints

### POST `/api/transport-optimization`
Assigns an employee to the optimal transport route.

**Request:**
```json
{
  "employeeAddress": "123 Main Street, Tangier, Morocco",
  "employeeName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "routeId": "route-1",
    "routeName": "Tangier Center - Relats",
    "pickupPointId": "pickup-1-2",
    "pickupPointName": "Grand Socco",
    "pickupPointAddress": "Grand Socco, Tangier, Morocco",
    "distanceToPickup": 450,
    "distanceToPickupKm": "0.45",
    "employeeLocation": { "lat": 35.7889, "lng": -5.8138, "address": "..." },
    "pickupPointLocation": { "lat": 35.7889, "lng": -5.8138, "address": "..." }
  }
}
```

### GET `/api/transport-optimization?address=...`
Geocodes an address to get coordinates.

## 🎨 Components

### TransportMap (Leaflet.js)
Interactive map component using Leaflet.js with:
- OpenStreetMap tiles (light mode)
- CartoDB Dark Matter tiles (dark mode)
- Custom markers for pickup points
- GeoJSON routes from OpenRouteService
- Popup information windows

### AddressInput
Enhanced input field with:
- Local address suggestions for Tangier
- Automatic geocoding
- Coordinate verification
- Dropdown suggestions

### TransportOptimizer
Complete optimization interface for assigning employees to routes.

## 🛠️ Customization

### Adding New Routes
1. Update the `mockTransportRoutes` array in `src/app/transport-routes/page.tsx`
2. Add pickup points with coordinates and capacity
3. Define the route path

### Modifying Optimization Logic
1. Edit `TransportOptimizationService` in `src/lib/leaflet-maps.ts`
2. Adjust distance thresholds or add new criteria
3. Implement more sophisticated algorithms

### Styling
- All components support dark/light mode
- Colors and styling can be customized in the component files
- Map styles can be modified in the `LeafletMapUtils` class

## 🚨 Troubleshooting

### Common Issues

1. **"OpenRouteService API key is missing"**
   - Check that `NEXT_PUBLIC_OPENROUTE_API_KEY` is set in `.env.local`
   - Restart the development server

2. **"Map not loading"**
   - Check if Leaflet CSS is imported
   - Verify internet connection for tile loading

3. **"Route calculation failed"**
   - Check OpenRouteService API key validity
   - Verify coordinates are within supported range
   - Check API rate limits

4. **"No pickup points found"**
   - Employee address is too far from all pickup points (>1km)
   - All pickup points are at capacity

### Debug Mode
Add this to your browser console to see detailed logs:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Performance Considerations

- OpenRouteService API calls are cached where possible
- Geocoding results are stored to avoid duplicate requests
- Map components are optimized for React rendering
- Distance calculations use efficient algorithms
- Local address database reduces API calls

## 🔒 Security Notes

- API key is restricted to your domain
- Server-side validation of all inputs
- Rate limiting should be implemented for production
- Consider using environment-specific API keys

## 💰 Cost Benefits

### OpenRouteService vs Google Maps
- **OpenRouteService:** Free tier with 2,000 requests/day
- **Google Maps:** $200/month for similar usage
- **Savings:** ~$2,400/year

### Leaflet.js vs Google Maps
- **Leaflet.js:** Completely free, open-source
- **Google Maps:** Requires API key and billing
- **Savings:** No ongoing costs

## 🎯 Next Steps

1. **Production Deployment:** Set up proper API key restrictions
2. **Database Integration:** Store routes and assignments in MongoDB
3. **Real-time Updates:** Implement WebSocket for live route updates
4. **Advanced Optimization:** Add traffic data and real-time route calculation
5. **Mobile App:** Create React Native version for drivers

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify OpenRouteService API key and permissions
3. Test with a simple address first
4. Review the network tab for API call failures
5. Check OpenRouteService documentation: https://openrouteservice.org/dev/#/api-docs

---

**Note:** This implementation provides a cost-effective solution using open-source technologies. The system can be extended with more sophisticated algorithms, real-time data, and additional features as needed. 