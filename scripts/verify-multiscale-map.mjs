import fs from 'node:fs';import {chromium} from 'playwright';
let browser;const guard=setTimeout(()=>{console.error('Cartographic validation exceeded 80s');process.exit(1);},80000);
const report={screenshots:[],checks:[],errors:[]};
const assert=(value,message)=>{if(!value)throw new Error(message);report.checks.push(message);};
try{
 browser=await chromium.launch({channel:'msedge',headless:true,timeout:10000});const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/',{timeout:15000});await page.locator('#conteudo[data-ready="true"]').waitFor();await page.waitForFunction(()=>document.querySelectorAll('.region-sidebar details').length===5,{},{timeout:20000});
 const map=page.locator('.cockpit-map'),canvas=page.locator('canvas');
 const capture=async name=>{await page.screenshot({path:`outputs/cartography-${name}.png`});report.screenshots.push(name);};
 const at=async shape=>map.evaluate((e,shape)=>{const r=e.getBoundingClientRect(),[x,y,w,h]=e.dataset.view.split(',').map(Number),scale=Math.min(r.width/w,r.height/h);return {x:r.x+(r.width-w*scale)/2+(shape.label[0]-x)*scale,y:r.y+(r.height-h*scale)/2+(shape.label[1]-y)*scale};},shape);
 const national=JSON.parse(fs.readFileSync('src/features/election/map/geometry.json','utf8'));
 await capture('brasil-estados');assert(Number(await canvas.getAttribute('data-visible-shapes'))===27,'Estados: 27 polígonos');
 for(const uf of ['ba','sp','pb']){const shape=national.states.find(s=>s.uf===uf),point=await at(shape);await page.mouse.move(point.x,point.y);await page.locator(`.electoral-tooltip[data-territory="${uf}"]`).waitFor();assert(await page.locator('.tooltip-candidate').count()===2,`Tooltip ${uf}: dois candidatos do território`);assert(await page.locator('.tooltip-candidate small').first().innerText()!=='—',`Tooltip ${uf}: identidade de partido/número`);if(uf==='ba')await capture('hover-estadual');}
 await page.mouse.move(5,5);await page.getByRole('button',{name:'Municípios',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('canvas').dataset.visibleShapes)===5571,{},{timeout:20000});
 assert((await map.getAttribute('data-zoom'))==='1.000','Municípios: todos os 5.570 polígonos no zoom 1x');
 report.municipalPolygons=Number(await canvas.getAttribute('data-visible-shapes'));report.coverage=await page.locator('.map-coverage').innerText();await capture('brasil-municipios');
 const jp=JSON.parse(fs.readFileSync('public/maps/pb.json','utf8')).shapes.find(s=>s.code==='20516');let point=await at(jp);await page.mouse.move(point.x,point.y);const before=page.url();
 for(let i=0;i<3;i++)await page.mouse.wheel(0,-120);await page.mouse.wheel(0,-25);await capture('nordeste-2x');
 for(let i=0;i<3;i++)await page.mouse.wheel(0,-120);await page.mouse.wheel(0,-25);await capture('nordeste-4x');assert(page.url()===before,'Zoom 2x/4x preserva seleção formal e URL');
 point=await at(jp);await page.mouse.move(point.x,point.y);await page.locator('.electoral-tooltip[data-territory="20516"]').waitFor();await page.waitForFunction(()=>document.querySelectorAll('.electoral-tooltip .tooltip-candidate').length===2,{},{timeout:15000});await capture('hover-municipal');
 const box=await page.locator('.electoral-tooltip').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=1440&&box.y+box.height<=900,'Tooltip municipal contido na viewport');
 const view=await map.getAttribute('data-view');await page.mouse.move(point.x+10,point.y+10);assert(await map.getAttribute('data-view')===view,'Hover não muda a câmera');
 await page.mouse.move(5,5);await page.getByRole('button',{name:'Enquadrar território'}).click();await page.waitForFunction(()=>document.querySelector('.cockpit-map').dataset.animating==='false');
 for(const mode of ['Apurado','Vantagem']){await page.getByRole('button',{name:mode,exact:true}).click();assert(await map.getAttribute('data-municipal')==='true',`${mode} mantém granularidade municipal`);await capture(mode.toLowerCase());}
 for(const [candidate,name] of [['22','candidato-flavio'],['13','candidato-lula']]){await page.goto(`http://127.0.0.1:3000/?candidate=${candidate}`,{timeout:15000});await page.locator('#conteudo[data-ready="true"]').waitFor();await page.waitForFunction(()=>Number(document.querySelector('canvas').dataset.visibleShapes)===5571,{},{timeout:20000});await page.locator('.map-candidate-legend').waitFor();assert(new URL(page.url()).searchParams.get('view')==='candidate',`Deep link ${candidate} ativa heatmap`);await capture(name);}
 assert(!report.errors.length,'Sem erros JavaScript');
 console.log(JSON.stringify(report));
}finally{clearTimeout(guard);fs.writeFileSync('outputs/cartography-validation.json',JSON.stringify(report,null,2));await browser?.close();}
