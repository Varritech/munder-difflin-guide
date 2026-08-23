const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport to 1200x1200 (will be scaled by CSS which is 2400x2400)
  await page.setViewportSize({ width: 1200, height: 1200 });
  
  await page.goto('file://' + process.cwd() + '/post.html', { 
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for fonts to load
  await page.waitForTimeout(2000);
  
  await page.screenshot({ 
    path: 'post.png', 
    type: 'png',
    clip: { x: 0, y: 0, width: 2400, height: 2400 }
  });
  
  await browser.close();
  console.log('✅ Image rendered: post.png');
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
