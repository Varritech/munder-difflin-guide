import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 2400, height: 2400 });
  
  await page.goto('file://' + process.cwd() + '/post.html', { 
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ 
    path: 'post.png', 
    type: 'png'
  });
  
  await browser.close();
  console.log('✅ Image rendered: post.png');
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
