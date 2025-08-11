// Test the database adapter directly
process.env.DATABASE_TYPE = 'mongodb';

async function testAdapterDirect() {
  try {
    console.log('🔧 Testing Database Adapter Directly');
    console.log('==========================================');
    
    // Import the adapter (this might fail due to TypeScript)
    console.log('Importing database adapter...');
    
    // Test comments
    console.log('\n📝 Testing Comments Adapter');
    console.log('------------------------------------------');
    
    // We'll test this by making HTTP requests to the API instead
    const fetch = require('node-fetch');
    
    console.log('Testing comments API for hihcam...');
    const commentsResponse = await fetch('http://localhost:3000/api/comments?fullName=hihcam');
    console.log('Response status:', commentsResponse.status);
    console.log('Response headers:', Object.fromEntries(commentsResponse.headers));
    
    if (commentsResponse.ok) {
      const comments = await commentsResponse.json();
      console.log('✅ Comments API returned:', comments);
    } else {
      const errorText = await commentsResponse.text();
      console.log('❌ Comments API error:', errorText);
    }
    
    // Test notifications
    console.log('\n🔔 Testing Notifications Adapter');
    console.log('------------------------------------------');
    
    console.log('Testing notifications API for SuperAdmin...');
    const notificationsResponse = await fetch('http://localhost:3000/api/notifications/get?userId=SuperAdmin');
    console.log('Response status:', notificationsResponse.status);
    
    if (notificationsResponse.ok) {
      const result = await notificationsResponse.json();
      console.log('✅ Notifications API returned:', result);
    } else {
      const errorText = await notificationsResponse.text();
      console.log('❌ Notifications API error:', errorText);
    }
    
    // Test with Super Admin (with space)
    console.log('\nTesting notifications API for "Super Admin"...');
    const notificationsResponse2 = await fetch('http://localhost:3000/api/notifications/get?userId=Super%20Admin');
    console.log('Response status:', notificationsResponse2.status);
    
    if (notificationsResponse2.ok) {
      const result2 = await notificationsResponse2.json();
      console.log('✅ Notifications API (Super Admin) returned:', result2);
    } else {
      const errorText2 = await notificationsResponse2.text();
      console.log('❌ Notifications API (Super Admin) error:', errorText2);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdapterDirect().catch(console.error);
