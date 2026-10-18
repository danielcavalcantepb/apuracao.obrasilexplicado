import fs from 'node:fs';
import {chromium} from 'playwright';
let browser;const guard=setTimeout(()=>{console.error('Municipal verification exceeded 75 seconds');process.exit(1);},75000);
const origin=process.env.VERIFY_URL??'http://127.0.0.1:3000';
const report={origin,checks:[],errors:[]};
const assert=(condition,message)=>{if(!condition)throw new Error(message);report.checks.push(message);};
try{
 browser=await chromium.launch({channel:'msedge',headless:true,timeout:10000});
 const page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>report.errors.push(error.message));
 for(const[width,height]of[[1366,768],[1440,900],[390,844]]){
  await page.setViewportSize({width,height});
  await page.goto(origin+'/?view=municipalities',{timeout:25000});
  await page.locator('#conteudo[data-ready="true"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.map-coverage')?.textContent?.includes('5571 de 5571'),{},{timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('.region-sidebar details').length===5,{},{timeout:30000});
  assert(await page.locator('canvas').getAttribute('data-visible-shapes')==='5571',`${width}×${height}: 5.571 geometrias municipais`);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}×${height}: sem transbordamento horizontal`);
  await page.screenshot({path:`outputs/municipal-complete-${width}x${height}.png`});
 }
 const response=await page.request.get(origin+'/api/election/president/municipalities?state=br',{timeout:20000});
 assert(response.ok(),'API municipal nacional disponível');
 const data=await response.json();report.available=data.available;report.total=data.total;
 assert(data.available===5571&&data.total===5571,'5.571 resultados oficiais recebidos');
 assert(new Set(data.results.map(m=>m.uf)).size===27,'Cobertura das 27 UFs');
 assert(new Set(data.results.map(m=>m.uf+m.code)).size===5571,'Nenhum município duplicado');
 assert(data.results.some(m=>m.code==='73709'&&m.uf==='mt'),'Boa Esperança do Norte incluída');
 assert(report.errors.length===0,'Sem erros JavaScript no navegador');
 console.log(JSON.stringify(report,null,2));
}finally{
 fs.writeFileSync('outputs/municipal-complete-validation.json',JSON.stringify(report,null,2));
 await browser?.close();clearTimeout(guard);
}
