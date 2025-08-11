// Test the comments API directly
async function testCommentsAPI() {
  try {
    console.log('🔧 Testing Comments API');
    console.log('==========================================');
    
    // Test for a user we know has comments
    const testUsers = ['hihcam', 'Nawfal', 'test1', 'test2'];
    
    for (const user of testUsers) {
      console.log(`\n📝 Testing comments for: ${user}`);
      console.log('------------------------------------------');
      
      try {
        const response = await fetch(`http://localhost:3000/api/comments?fullName=${encodeURIComponent(user)}`);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers));
        
        if (response.ok) {
          const comments = await response.json();
          console.log('✅ Comments API returned:', comments);
          console.log('✅ Comments count:', Array.isArray(comments) ? comments.length : 'Not an array');
          
          if (Array.isArray(comments) && comments.length > 0) {
            console.log('✅ Sample comment:', {
              author: comments[0].author,
              text: comments[0].text?.substring(0, 50) + '...',
              date: comments[0].date
            });
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Comments API error:', errorText);
        }
      } catch (error) {
        console.log('❌ Error testing comments for', user, ':', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCommentsAPI().catch(console.error);
