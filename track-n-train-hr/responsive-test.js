// Responsive Testing Script for Track-n-Train HR
// Run this in your browser console on localhost:3000 to test responsiveness

console.log('🔧 Track-n-Train HR - Responsiveness Testing Script');
console.log('===============================================');

// Common mobile device dimensions
const testDevices = [
  { name: 'iPhone 5/SE', width: 320, height: 568 },
  { name: 'iPhone 6/7/8', width: 375, height: 667 },
  { name: 'iPhone 6/7/8 Plus', width: 414, height: 736 },
  { name: 'iPhone X/11 Pro', width: 375, height: 812 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Samsung Galaxy S8', width: 360, height: 740 },
  { name: 'Samsung Galaxy S21', width: 384, height: 854 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad', width: 820, height: 1180 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  { name: 'Small Laptop', width: 1024, height: 768 },
  { name: 'Medium Laptop', width: 1366, height: 768 },
  { name: 'Large Desktop', width: 1920, height: 1080 }
];

// Function to simulate viewport resize
function testViewport(device) {
  return new Promise((resolve) => {
    console.log(`📱 Testing: ${device.name} (${device.width}x${device.height})`);
    
    // Resize window (only works in some development environments)
    if (window.resizeTo) {
      window.resizeTo(device.width, device.height);
    }
    
    // Alternative: Change the body style to simulate viewport
    document.body.style.width = device.width + 'px';
    document.body.style.height = device.height + 'px';
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    setTimeout(() => {
      const results = analyzeCurrentLayout(device);
      console.log(`✅ ${device.name}: ${results.status}`);
      
      if (results.issues.length > 0) {
        console.warn(`⚠️  Issues found:`, results.issues);
      }
      
      resolve(results);
    }, 500); // Wait for layout to settle
  });
}

// Analyze current layout for responsive issues
function analyzeCurrentLayout(device) {
  const results = {
    device: device.name,
    viewport: { width: device.width, height: device.height },
    status: 'Good',
    issues: [],
    elements: {}
  };
  
  // Check for horizontal overflow
  const bodyWidth = document.body.scrollWidth;
  const windowWidth = window.innerWidth;
  
  if (bodyWidth > windowWidth + 5) { // 5px tolerance
    results.issues.push(`Horizontal overflow: ${bodyWidth}px content in ${windowWidth}px viewport`);
    results.status = 'Issues Found';
  }
  
  // Check header responsiveness
  const header = document.querySelector('header');
  if (header) {
    const headerRect = header.getBoundingClientRect();
    results.elements.header = {
      width: headerRect.width,
      height: headerRect.height,
      overflowing: headerRect.width > windowWidth
    };
    
    if (headerRect.width > windowWidth) {
      results.issues.push('Header overflowing viewport');
      results.status = 'Issues Found';
    }
  }
  
  // Check table responsiveness
  const tables = document.querySelectorAll('table');
  if (tables.length > 0) {
    tables.forEach((table, index) => {
      const tableRect = table.getBoundingClientRect();
      const isScrollable = table.parentElement?.style.overflowX === 'auto' || 
                          table.parentElement?.classList.contains('responsive-table-container');
      
      results.elements[`table_${index}`] = {
        width: tableRect.width,
        height: tableRect.height,
        hasHorizontalScroll: isScrollable,
        overflowing: tableRect.width > windowWidth
      };
      
      if (tableRect.width > windowWidth && !isScrollable) {
        results.issues.push(`Table ${index} overflowing without scroll`);
        results.status = 'Issues Found';
      }
    });
  }
  
  // Check button sizes for touch targets
  const buttons = document.querySelectorAll('button');
  let smallButtons = 0;
  
  buttons.forEach(button => {
    const rect = button.getBoundingClientRect();
    if (rect.height < 44 || rect.width < 44) {
      smallButtons++;
    }
  });
  
  if (smallButtons > 0) {
    results.issues.push(`${smallButtons} buttons smaller than 44px touch target`);
    if (device.width <= 768) { // Only flag as issue on mobile/tablet
      results.status = 'Issues Found';
    }
  }
  
  // Check font readability
  const textElements = document.querySelectorAll('p, span, div:not(:has(*)), h1, h2, h3, h4, h5, h6');
  let tinyText = 0;
  
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const fontSize = parseFloat(styles.fontSize);
    
    if (fontSize < 14 && device.width <= 768) { // Check only on mobile/tablet
      tinyText++;
    }
  });
  
  if (tinyText > 10) { // Threshold to avoid flagging minor elements
    results.issues.push(`${tinyText} text elements smaller than 14px on mobile`);
    results.status = 'Issues Found';
  }
  
  // Check for responsive classes usage
  const elementsWithResponsiveClasses = document.querySelectorAll('[class*="responsive-"], [class*="mobile-"], [class*="tablet-"], [class*="desktop-"]');
  results.elements.responsiveElements = elementsWithResponsiveClasses.length;
  
  return results;
}

// Test specific responsive features
function testResponsiveFeatures() {
  console.log('\n🔍 Testing Responsive Features:');
  console.log('===============================');
  
  // Test useResponsive hook values (if available)
  try {
    const width = window.innerWidth;
    const isMobile = width <= 576;
    const isTablet = width > 576 && width <= 768;
    const isDesktop = width > 768;
    
    console.log(`📏 Current viewport: ${width}px`);
    console.log(`📱 Device detection: Mobile=${isMobile}, Tablet=${isTablet}, Desktop=${isDesktop}`);
  } catch (e) {
    console.log('❌ Could not access responsive hook values');
  }
  
  // Test responsive CSS classes
  const responsiveElements = {
    containers: document.querySelectorAll('.responsive-container').length,
    cards: document.querySelectorAll('.responsive-card').length,
    buttons: document.querySelectorAll('.responsive-button').length,
    tables: document.querySelectorAll('.responsive-table').length,
    modals: document.querySelectorAll('.responsive-modal').length
  };
  
  console.log('📋 Responsive elements found:', responsiveElements);
  
  // Test mobile-specific components
  const mobileElements = {
    mobileButtons: document.querySelectorAll('.mobile-add-profile-floating').length,
    hiddenOnDesktop: document.querySelectorAll('.tablet-hide, .mobile-only').length,
    mobileSpecific: document.querySelectorAll('[class*="mobile-"]').length
  };
  
  console.log('📱 Mobile-specific elements:', mobileElements);
}

// Run comprehensive test
async function runFullResponsivenessTest() {
  console.log('\n🚀 Starting Full Responsiveness Test...\n');
  
  const results = [];
  
  for (const device of testDevices) {
    try {
      const result = await testViewport(device);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error testing ${device.name}:`, error);
    }
  }
  
  // Test responsive features at current size
  testResponsiveFeatures();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const goodResults = results.filter(r => r.status === 'Good').length;
  const issueResults = results.filter(r => r.status === 'Issues Found').length;
  
  console.log(`✅ Devices with good responsiveness: ${goodResults}/${results.length}`);
  console.log(`⚠️  Devices with issues: ${issueResults}/${results.length}`);
  
  if (issueResults === 0) {
    console.log('🎉 EXCELLENT! All tested devices show good responsiveness!');
  } else if (issueResults <= 3) {
    console.log('👍 GOOD! Minor issues found on some devices.');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT: Multiple responsiveness issues detected.');
  }
  
  // Detailed issues
  const allIssues = results.flatMap(r => r.issues);
  const uniqueIssues = [...new Set(allIssues)];
  
  if (uniqueIssues.length > 0) {
    console.log('\n🔧 Issues to address:');
    uniqueIssues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  return results;
}

// Quick test function for current viewport
function quickResponsivenessCheck() {
  console.log('\n⚡ Quick Responsiveness Check:');
  console.log('=============================');
  
  const device = {
    name: 'Current Viewport',
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  const results = analyzeCurrentLayout(device);
  
  console.log(`📏 Viewport: ${device.width}x${device.height}`);
  console.log(`📊 Status: ${results.status}`);
  
  if (results.issues.length > 0) {
    console.log('🔧 Issues found:');
    results.issues.forEach(issue => console.log(`   • ${issue}`));
  } else {
    console.log('✅ No responsiveness issues detected!');
  }
  
  testResponsiveFeatures();
  
  return results;
}

// Export functions for manual testing
window.responsiveTest = {
  runFull: runFullResponsivenessTest,
  quick: quickResponsivenessCheck,
  testDevice: testViewport,
  testFeatures: testResponsiveFeatures,
  devices: testDevices
};

console.log('\n💡 Usage:');
console.log('  responsiveTest.quick()           - Quick test current viewport');
console.log('  responsiveTest.runFull()         - Test all device sizes');
console.log('  responsiveTest.testFeatures()    - Test responsive features');
console.log('  responsiveTest.testDevice(device) - Test specific device');
console.log('\n🏁 Ready to test! Run responsiveTest.quick() to start.');
