// Test the actual API endpoints used by the application
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('🔄 Testing API Endpoints...');
  console.log('==========================================');

  // Test 1: Add User via API
  console.log('\n📋 TEST 1: Add User via API');
  console.log('------------------------------------------');
  
  try {
    const userData = {
      fullName: 'API Test User',
      email: 'apitest@example.com',
      password: 'testpass123',
      role: 'hr',
      zone: 'Textile'
    };

    const userResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (userResponse.ok) {
      const userResult = await userResponse.json();
      console.log('✅ User API working:', userResult.success ? 'Success' : 'Failed');
      console.log('   Response:', userResult.message || 'User created');
    } else {
      const errorText = await userResponse.text();
      console.log('❌ User API failed:', userResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ User API error:', error.message);
  }

  // Test 2: Add Personnel Record via API
  console.log('\n📋 TEST 2: Add Personnel Record via API');
  console.log('------------------------------------------');
  
  try {
    const personnelData = {
      fullName: 'API Test Personnel',
      cin: 'API123456',
      zone: 'Textile',
      poste: 'Test Position',
      status: 'Recruit',
      dateAdded: new Date().toISOString().slice(0, 10),
      recruitDate: new Date().toISOString().slice(0, 10)
    };

    const personnelResponse = await fetch(`${BASE_URL}/api/personnel-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personnelData)
    });

    if (personnelResponse.ok) {
      const personnelResult = await personnelResponse.json();
      console.log('✅ Personnel API working: Success');
      console.log('   Full Name:', personnelResult.fullName);
      console.log('   Zone:', personnelResult.zone);
    } else {
      const errorText = await personnelResponse.text();
      console.log('❌ Personnel API failed:', personnelResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Personnel API error:', error.message);
  }

  // Test 3: Add Comment via API
  console.log('\n📋 TEST 3: Add Comment via API');
  console.log('------------------------------------------');
  
  try {
    const commentData = {
      fullName: 'API Test Personnel',
      comment: {
        author: 'API Test User',
        text: '@SuperAdmin This is an API test comment with tagging',
        date: new Date().toLocaleString()
      }
    };

    const commentResponse = await fetch(`${BASE_URL}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    });

    if (commentResponse.ok) {
      const commentResult = await commentResponse.json();
      console.log('✅ Comment API working:', commentResult.success ? 'Success' : 'Failed');
    } else {
      const errorText = await commentResponse.text();
      console.log('❌ Comment API failed:', commentResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Comment API error:', error.message);
  }

  // Test 4: Send Notification via API (Tagging)
  console.log('\n📋 TEST 4: Send Notification via API (Tagging)');
  console.log('------------------------------------------');
  
  try {
    const notificationData = {
      type: 'tag',
      targetUsers: ['SuperAdmin'],
      message: 'API Test User tagged you in a comment on API Test Personnel\'s profile',
      data: {
        taggerName: 'API Test User',
        profileName: 'API Test Personnel',
        profileId: 'API Test Personnel',
        comment: '@SuperAdmin This is an API test comment with tagging',
        actionType: 'view_profile'
      }
    };

    const notificationResponse = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });

    if (notificationResponse.ok) {
      const notificationResult = await notificationResponse.json();
      console.log('✅ Notification API working:', notificationResult.success ? 'Success' : 'Failed');
    } else {
      const errorText = await notificationResponse.text();
      console.log('❌ Notification API failed:', notificationResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Notification API error:', error.message);
  }

  // Test 5: Get Notifications via API
  console.log('\n📋 TEST 5: Get Notifications via API');
  console.log('------------------------------------------');
  
  try {
    const getNotificationsResponse = await fetch(`${BASE_URL}/api/notifications/get?userId=SuperAdmin`);

    if (getNotificationsResponse.ok) {
      const notificationsResult = await getNotificationsResponse.json();
      console.log('✅ Get Notifications API working: Success');
      console.log('   Notifications count:', notificationsResult.notifications?.length || 0);
      console.log('   Unread count:', notificationsResult.unreadCount || 0);
    } else {
      const errorText = await getNotificationsResponse.text();
      console.log('❌ Get Notifications API failed:', getNotificationsResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Get Notifications API error:', error.message);
  }

  console.log('\n🎉 API Endpoint Tests Completed!');
  console.log('==========================================');
}

// Run the API tests
testAPIEndpoints().catch(console.error);
