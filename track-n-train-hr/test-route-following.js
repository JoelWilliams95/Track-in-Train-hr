#!/usr/bin/env node

/**
 * Test Script: Verify Route Following Functionality
 * 
 * This script tests if the OpenRouteService integration is working
 * and routes are following real Tangier roads instead of straight lines.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API key from .env.local file
function getApiKey() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_OPENROUTE_API_KEY=(.+)/);  
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

const OPENROUTE_API_KEY = getApiKey();

console.log('🧪 Testing Route Following Functionality\n');
console.log('=' .repeat(50));

// Test coordinates - realistic Tangier route
const testCoordinates = [
  [-5.8340, 35.7595], // Place de France (start)
  [-5.8298, 35.7612], // Boulevard Pasteur
  [-5.8136, 35.7831], // Grand Socco
  [-5.8006, 35.7731], // Port of Tangier
  [-5.9500, 35.7100]  // Relats (end)
];

async function testOpenRouteService() {
  console.log('1️⃣ Testing OpenRouteService API Connection...');
  
  if (!OPENROUTE_API_KEY) {
    console.log('❌ FAILED: OpenRouteService API key not found');
    console.log('   Please add NEXT_PUBLIC_OPENROUTE_API_KEY to .env.local');
    return false;
  }
  
  console.log('✅ API key found:', OPENROUTE_API_KEY.substring(0, 20) + '...');
  
  const requestData = JSON.stringify({
    coordinates: testCoordinates,
    preference: 'shortest',
    geometry: true,
    instructions: false,
    elevation: false,
    options: {
      avoid_features: ['ferries', 'tollways'],
      avoid_borders: 'controlled',
      vehicle_type: 'driving'
    }
  });
  
  const options = {
    hostname: 'api.openrouteservice.org',
    port: 443,
    path: '/v2/directions/driving-car/geojson',
    method: 'POST',
    headers: {
      'Authorization': OPENROUTE_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/geo+json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };
  
  return new Promise((resolve, reject) => {
    console.log('2️⃣ Making API request to OpenRouteService...');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log(`📡 Response status: ${res.statusCode}`);
          
          if (res.statusCode !== 200) {
            console.log('❌ API Request failed with status:', res.statusCode);
            console.log('Response:', data);
            resolve(false);
            return;
          }
          
          const routeData = JSON.parse(data);
          
          console.log('✅ API request successful!');
          console.log('📊 Route Analysis:');
          console.log('   Type:', routeData.type);
          console.log('   Features:', routeData.features?.length || 0);
          
          if (routeData.features && routeData.features[0]) {
            const geometry = routeData.features[0].geometry;
            const properties = routeData.features[0].properties;
            
            console.log('   Geometry type:', geometry?.type);
            console.log('   Coordinate points:', geometry?.coordinates?.length || 0);
            
            if (properties && properties.summary) {
              console.log('   Distance:', (properties.summary.distance / 1000).toFixed(1), 'km');
              console.log('   Duration:', Math.round(properties.summary.duration / 60), 'minutes');
            }
            
            // Test if route follows roads (should have many coordinate points)
            const coordCount = geometry?.coordinates?.length || 0;
            if (coordCount > 20) {
              console.log('✅ ROADS BEING FOLLOWED: Route has', coordCount, 'coordinate points');
              console.log('   This indicates the route follows real roads, not straight lines');
            } else if (coordCount > 5) {
              console.log('⚠️  PARTIAL ROAD FOLLOWING: Route has', coordCount, 'coordinate points');
              console.log('   This may indicate some road following but could be improved');
            } else {
              console.log('❌ STRAIGHT LINES: Route has only', coordCount, 'coordinate points');
              console.log('   This suggests straight-line routing, not road following');
            }
            
            resolve(coordCount > 20);
          } else {
            console.log('❌ No route features found in response');
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve(false);
    });
    
    req.write(requestData);
    req.end();
  });
}

async function testCoordinateValidation() {
  console.log('\n3️⃣ Testing Coordinate Validation...');
  
  for (let i = 0; i < testCoordinates.length; i++) {
    const [lng, lat] = testCoordinates[i];
    
    // Check if coordinates are in Tangier area
    const isValidLng = lng >= -6.0 && lng <= -5.7;
    const isValidLat = lat >= 35.7 && lat <= 35.8;
    
    const locationName = [
      'Place de France',
      'Boulevard Pasteur', 
      'Grand Socco',
      'Port of Tangier',
      'Relats'
    ][i];
    
    if (isValidLng && isValidLat) {
      console.log(`✅ ${locationName}: (${lat}, ${lng}) - Valid Tangier coordinates`);
    } else {
      console.log(`❌ ${locationName}: (${lat}, ${lng}) - Invalid coordinates for Tangier`);
      return false;
    }
  }
  
  return true;
}

function printTroubleshootingTips() {
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('=' .repeat(50));
  console.log('If routes are not following roads:');
  console.log('');
  console.log('1. Check API Key:');
  console.log('   • Verify NEXT_PUBLIC_OPENROUTE_API_KEY in .env.local');
  console.log('   • Confirm key is active on openrouteservice.org');
  console.log('   • Check daily quota (2,000 requests free)');
  console.log('');
  console.log('2. Check Browser Console:');
  console.log('   • Open DevTools → Console');
  console.log('   • Look for "🗺️ Requesting route" messages');
  console.log('   • Look for "✅ Route geometry loaded" messages');
  console.log('');
  console.log('3. Enable Debug Mode:');
  console.log('   • In browser console: localStorage.setItem("debug", "true")');
  console.log('   • Refresh page and select a route');
  console.log('   • Should show debug info overlay on map');
  console.log('');
  console.log('4. Check Network Tab:');
  console.log('   • Look for calls to api.openrouteservice.org');
  console.log('   • Check if requests are succeeding (200 status)');
  console.log('   • Verify response contains geometry data');
  console.log('');
  console.log('5. Restart Development Server:');
  console.log('   • Stop with Ctrl+C');
  console.log('   • Run: npm run dev');
  console.log('   • Clear browser cache');
}

async function main() {
  try {
    // Test coordinate validation
    const coordsValid = await testCoordinateValidation();
    if (!coordsValid) {
      console.log('❌ Coordinate validation failed');
      return;
    }
    
    // Test OpenRouteService API
    const apiWorking = await testOpenRouteService();
    
    console.log('\n🏁 Test Results Summary:');
    console.log('=' .repeat(50));
    
    if (apiWorking) {
      console.log('✅ SUCCESS: Routes should follow real Tangier roads!');
      console.log('');
      console.log('Your transport trajectories will now:');
      console.log('• Follow actual streets and highways');
      console.log('• Avoid impossible paths (water crossings, etc.)');
      console.log('• Provide accurate distances and travel times');
      console.log('• Show realistic curved routes on the map');
    } else {
      console.log('❌ FAILED: Routes will show as straight lines');
      console.log('');
      console.log('This means:');
      console.log('• Routes won\'t follow real roads');
      console.log('• Trajectories will be straight lines');
      console.log('• Distance calculations will be inaccurate');
      console.log('• Navigation will be unrealistic');
    }
    
    printTroubleshootingTips();
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

main();
