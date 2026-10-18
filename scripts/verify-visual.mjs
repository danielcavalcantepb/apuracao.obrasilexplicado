import { chromium } from 'playwright';
let browser;
const watchdog=setTimeout(async()=>{console.error('Visual verification timed out after 55s');try{await browser?.close();}finally{process.exit(1);}},55000);
try{
  browser=await chromium.launch({channel:'msedge',headless:true,timeout:10000});
  const page=await browser.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});
  await page.locator('.election-cockpit').waitFor();
  await page.locator('.region-sidebar details').first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.cockpit-top-two img')].every(img=>img.complete),{},{timeout:10000}).catch(()=>{});
  for(const [width,height] of [[1366,768],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height});
    await page.screenshot({path:`outputs/cartographic-${width}x${height}.png`,timeout:10000});
    const result=await page.evaluate(()=>{
      const canvas=document.querySelector('canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let minY=canvas.height,maxY=0,minX=canvas.width,maxX=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(pixels[(y*canvas.width+x)*4+3]>0){minY=Math.min(minY,y);maxY=Math.max(maxY,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);}}const drawnHeightPercent=Math.round((maxY-minY)/canvas.height*100);

      const box=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};
      return {drawnHeightPercent,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,header:box('.cockpit-header'),race:box('.race-panel'),chart:box('.compact-chart'),map:box('.cockpit-map'),right:box('.context-panel'),timeline:box('.cockpit-timeline')};
    });console.log(JSON.stringify(result));
  }
  console.log(JSON.stringify({errors}));
}finally{clearTimeout(watchdog);await browser?.close();}

