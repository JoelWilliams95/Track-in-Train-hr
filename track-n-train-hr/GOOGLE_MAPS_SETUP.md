# Google Maps API Setup for Transport Optimization

This guide will help you set up Google Maps API for the transport route optimization system.

## 🚀 Features Implemented

### 1. **Interactive Transport Map**
- Real-time route visualization with Google Maps
- Pickup point markers with capacity information
- Route polylines showing optimal paths
- Dark/light mode support
- Clickable markers with detailed information

### 2. **Address Input with Autocomplete**
- Google Places autocomplete for accurate address entry
- Automatic geocoding of addresses
- Address verification with coordinates
- Restricted to Morocco for better accuracy

### 3. **Transport Route Optimization**
- Automatic assignment of employees to optimal pickup points
- Distance calculation within 1km constraint
- Route capacity management
- Real-time optimization results

## 🔧 Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Directions API** (for future route optimization)

### Step 2: Create API Key

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### Step 3: Configure API Key Restrictions

For security, restrict your API key:

1. Click on the API key you just created
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain (e.g., `localhost:3000/*` for development)
4. Under "API restrictions", select "Restrict key"
5. Select the APIs you enabled in Step 1

### Step 4: Add API Key to Environment

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/transport-routes` to see the interactive map
3. Test the address input with autocomplete
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

1. **Geocode Employee Address:** Convert address to coordinates
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

### TransportMap
Interactive Google Map component showing routes, pickup points, and polylines.

### AddressInput
Enhanced input field with Google Places autocomplete and geocoding.

### TransportOptimizer
Complete optimization interface for assigning employees to routes.

## 🛠️ Customization

### Adding New Routes
1. Update the `mockTransportRoutes` array in `src/app/transport-routes/page.tsx`
2. Add pickup points with coordinates and capacity
3. Define the route path

### Modifying Optimization Logic
1. Edit `TransportOptimizationService` in `src/lib/google-maps.ts`
2. Adjust distance thresholds or add new criteria
3. Implement more sophisticated algorithms

### Styling
- All components support dark/light mode
- Colors and styling can be customized in the component files
- Map styles can be modified in the `MapUtils` class

## 🚨 Troubleshooting

### Common Issues

1. **"Google Maps API key is missing"**
   - Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
   - Restart the development server

2. **"Autocomplete not working"**
   - Ensure Places API is enabled
   - Check API key restrictions

3. **"Geocoding failed"**
   - Verify Geocoding API is enabled
   - Check if the address is valid

4. **"No pickup points found"**
   - Employee address is too far from all pickup points (>1km)
   - All pickup points are at capacity

### Debug Mode
Add this to your browser console to see detailed logs:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Performance Considerations

- API calls are cached where possible
- Geocoding results are stored to avoid duplicate requests
- Map components are optimized for React rendering
- Distance calculations use efficient algorithms

## 🔒 Security Notes

- API key is restricted to your domain
- Server-side validation of all inputs
- Rate limiting should be implemented for production
- Consider using environment-specific API keys

## 🎯 Next Steps

1. **Production Deployment:** Set up proper API key restrictions
2. **Database Integration:** Store routes and assignments in MongoDB
3. **Real-time Updates:** Implement WebSocket for live route updates
4. **Advanced Optimization:** Add traffic data and real-time route calculation
5. **Mobile App:** Create React Native version for drivers

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify API key and permissions
3. Test with a simple address first
4. Review the network tab for API call failures

---

**Note:** This implementation provides a solid foundation for transport optimization. The system can be extended with more sophisticated algorithms, real-time data, and additional features as needed. 