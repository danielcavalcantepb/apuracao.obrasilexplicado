import {chromium} from 'playwright';
import fs from 'node:fs';
let browser;
const watchdog=setTimeout(()=>{console.error('Performance check exceeded 50s');process.exit(1);},50000);
try{
  browser=await chromium.launch({channel:'msedge',headless:true,timeout:10000});
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(10000);
  await page.goto('http://127.0.0.1:3000/',{timeout:15000});
  await page.locator('#conteudo[data-ready="true"]').waitFor();
  await page.getByRole('button',{name:'Municípios',exact:true}).click();
  const initial=await page.locator('canvas').boundingBox();await page.mouse.move(initial.x+initial.width/2,initial.y+initial.height/2);
  if(!process.argv.includes('--national'))for(let i=0;i<4;i++)await page.mouse.wheel(0,-120);
  await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.visibleShapes)>1000,{},{timeout:15000});
  await page.evaluate(()=>new Promise(resolve=>{let last='',stable=performance.now();const start=stable;function check(){const value=document.querySelector('canvas').dataset.visibleShapes;if(value!==last){last=value;stable=performance.now();}if(performance.now()-stable>1500||performance.now()-start>8000)resolve();else requestAnimationFrame(check);}check();}));
  const box=await page.locator('canvas').boundingBox();
  const sampling=page.evaluate(()=>new Promise(resolve=>{
    const times=[],draws=[];
    function frame(t){times.push(t);draws.push(Number(document.querySelector('canvas').dataset.drawMs||0));if(times.length<120)requestAnimationFrame(frame);else{const intervals=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);resolve({frames:times.length,fps:119000/(times.at(-1)-times[0]),frameP95Ms:intervals[Math.floor(intervals.length*.95)],drawMaxMs:Math.max(...draws),visibleShapes:Number(document.querySelector('canvas').dataset.visibleShapes)});}}
    requestAnimationFrame(frame);
  }));
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  for(let i=0;i<40;i++){await page.mouse.move(box.x+box.width/2+Math.sin(i/5)*70,box.y+box.height/2+Math.cos(i/5)*50);await page.evaluate(()=>new Promise(requestAnimationFrame));}
  await page.mouse.up();for(let i=0;i<8;i++)await page.mouse.wheel(0,i%2?-40:40);
  const result={initialMunicipalPolygons:process.argv.includes('--national')?5570:undefined,environment:'Headless Microsoft Edge, 1440×900, 120 animation frames during drag and wheel',...await sampling};
  fs.writeFileSync(process.argv.includes('--national')?'outputs/map-national-performance.json':'outputs/map-navigation-performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{clearTimeout(watchdog);await browser?.close();}
