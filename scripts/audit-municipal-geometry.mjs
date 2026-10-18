import fs from 'node:fs';
import {createHash} from 'node:crypto';
const url='https://resultados.tse.jus.br/oficial/ele2026/6257/config/mun-e006257-cm.json';
const geography=JSON.parse(JSON.parse(fs.readFileSync('.cache/tse/'+createHash('sha256').update(url).digest('hex')+'.json')).body);
const report={generatedAt:new Date().toISOString(),states:[],total:0,matched:0,vertices:0,bytes:0,missing:[]};
for(const region of geography.abr.filter(r=>r.cd!=='zz')){
 const file=`public/maps/${region.cd}.json`,geometry=JSON.parse(fs.readFileSync(file)),codes=new Set(geometry.shapes.map(s=>s.code));
 const vertices=geometry.shapes.reduce((n,s)=>n+(s.path.match(/[ML]/g)?.length??0),0),bytes=fs.statSync(file).size;
 const missing=region.mu.filter(m=>!codes.has(m.cd)).map(m=>({uf:region.cd,code:m.cd,name:m.nm}));
 report.states.push({uf:region.cd,source:geometry.source,shapes:geometry.shapes.length,vertices,bytes});report.total+=geometry.shapes.length;report.vertices+=vertices;report.bytes+=bytes;report.matched+=region.mu.length-missing.length;report.missing.push(...missing);
}
fs.writeFileSync('outputs/municipal-geometry-audit.json',JSON.stringify(report,null,2));
if(report.missing.length||report.total!==5571||report.matched!==5571)throw new Error('Incomplete national geometry');
console.log(JSON.stringify({total:report.total,matched:report.matched,vertices:report.vertices,bytes:report.bytes}));
