import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const started=Date.now();await page.goto(process.env.COCKPIT_URL||'http://127.0.0.1:3000',{waitUntil:'domcontentloaded'});
await page.locator('.cockpit-top-two button').first().waitFor({timeout:60000});
await page.locator('.region-sidebar details').first().waitFor({timeout:60000});
const loaded=Date.now()-started;
for(const width of [375,390,430,768,1024,1280,1366,1440,1920]){
  await page.setViewportSize({width,height:width<769?844:768});await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:`outputs/cockpit-${width}.png`});
  console.log(JSON.stringify({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),height:await page.locator('.election-cockpit').evaluate(e=>e.getBoundingClientRect().height)}));
}
await page.setViewportSize({width:1366,height:768});
await page.getByLabel('Selecionar estado no mapa').selectOption('pb');
await page.getByLabel('Selecionar município no mapa').selectOption('20516');
await page.locator('.context-panel h2').filter({hasText:'JOÃO PESSOA'}).waitFor();
await page.waitForTimeout(1500);await page.screenshot({path:'outputs/cockpit-joao-pessoa.png'});
console.log(JSON.stringify({initialMs:loaded,errors,dom:await page.locator('*').count(),canvases:await page.locator('canvas').count(),zones:await page.locator('.zones-list').innerText()}));
await browser.close();
