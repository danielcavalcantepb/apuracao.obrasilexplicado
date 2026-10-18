import fs from 'node:fs';import {chromium} from 'playwright';
let browser;const watchdog=setTimeout(()=>{console.error('Design audit exceeded 45s');process.exit(1);},45000);
try{
 browser=await chromium.launch({channel:'msedge',headless:true,timeout:10000});const page=await browser.newPage();page.setDefaultTimeout(10000);
 await page.goto('http://127.0.0.1:3000/',{timeout:15000});await page.locator('#conteudo[data-ready="true"]').waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.cockpit-top-two img')].every(img=>img.complete),{},{timeout:10000}).catch(()=>{});
 const results=[];
 for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[390,844]]){
  await page.setViewportSize({width,height});
  results.push(await page.evaluate(()=>{const style=s=>getComputedStyle(document.querySelector(s));return {viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,canvas:style('.election-cockpit').backgroundColor,panel:style('.race-panel').backgroundColor,radius:style('.race-panel').borderRadius,headlineFont:style('.panel-heading h1').fontFamily,numberFont:style('.cockpit-candidate>b').fontFamily,modeHeight:document.querySelector('.map-mode-switcher button').getBoundingClientRect().height,timelineAccent:style('.cockpit-timeline input').accentColor};}));
  await page.screenshot({path:`outputs/design-system-${width}x${height}.png`,timeout:10000});
 }
 fs.writeFileSync('outputs/design-system-audit.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 fs.copyFileSync('C:/Users/user/AppData/Local/Temp/codex-clipboard-7240ffc4-319c-4fa3-96e7-7f55e28aadd4.png','outputs/design-reference.png');
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Revisão do design system</title><style>body{background:#0b0b0a;color:#eeede8;font:14px Arial;margin:24px}h1,h2{font-family:Georgia;font-weight:400}p{color:#b6b5ae;max-width:1000px}section{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}figure{margin:0}img{width:100%;display:block}figcaption{padding:12px 0;color:#b6b5ae}</style><h1>Referência × design editorial</h1><p>Comparação da temperatura do preto, superfícies, tipografia, bordas e controles. A referência mostra detalhe municipal e inclui navegador; a implementação mostra a visão nacional. Dados, composição geográfica e branding não foram copiados.</p><section><figure><figcaption>Referência fornecida</figcaption><img src="design-reference.png"></figure><figure><figcaption>Implementação · 1440×900</figcaption><img src="design-system-1440x900.png"></figure></section><h2>Antes × depois</h2><section><figure><figcaption>Antes · navy técnico</figcaption><img src="cockpit-1440.png"></figure><figure><figcaption>Depois · preto/carvão editorial</figcaption><img src="design-system-1440x900.png"></figure></section><h2>Validação de densidade</h2>${[[1366,768],[1920,1080],[390,844]].map(([w,h])=>`<figure><figcaption>${w}×${h}</figcaption><img src="design-system-${w}x${h}.png"></figure>`).join('')}</html>`;
 fs.writeFileSync('outputs/design-system-comparison.html',html);
}finally{clearTimeout(watchdog);await browser?.close();}
