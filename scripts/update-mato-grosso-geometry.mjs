import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='outputs/mt-official-2024/MT_Municipios_2024',dbf=fs.readFileSync(base+'.dbf'),shp=fs.readFileSync(base+'.shp');
const fields=[];let fieldOffset=1;
for(let offset=32;dbf[offset]!==13;offset+=32){const name=dbf.subarray(offset,offset+11).toString().replace(/\0.*$/,'');const length=dbf[offset+16];fields.push({name,length,offset:fieldOffset});fieldOffset+=length;}
const records=[];
for(let i=0;i<dbf.readUInt32LE(4);i++){const start=dbf.readUInt16LE(8)+i*dbf.readUInt16LE(10),record={};for(const f of fields)record[f.name]=dbf.subarray(start+f.offset,start+f.offset+f.length).toString('utf8').trim();records.push(record);}
const raw=[];
for(let offset=100,index=0;offset<shp.length;index++){
 const length=shp.readInt32BE(offset+4)*2,start=offset+8;
 if(shp.readInt32LE(start)!==5)throw new Error('Expected official Polygon record');
 const parts=shp.readInt32LE(start+36),points=shp.readInt32LE(start+40),pointStart=start+44+parts*4,rings=[];
 for(let p=0;p<parts;p++){const from=shp.readInt32LE(start+44+p*4),to=p+1<parts?shp.readInt32LE(start+48+p*4):points,ring=[];for(let n=from;n<to;n++)ring.push([shp.readDoubleLE(pointStart+n*16),shp.readDoubleLE(pointStart+n*16+8)]);rings.push(ring);}
 raw.push({properties:records[index],rings});offset=start+length;
}
const national=JSON.parse(fs.readFileSync('data/geography/br-ufs.geojson'));
const polys=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
const points=national.features.flatMap(f=>polys(f).flat(2)),lat=points.map(p=>p[1]),reference=(Math.min(...lat)+Math.max(...lat))/2;
const project=([x,y])=>[x*Math.cos(reference*Math.PI/180),-y],projected=points.map(project),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),xmin=Math.min(...xs),ymin=Math.min(...ys),scale=Math.min(640/(Math.max(...xs)-xmin),630/(Math.max(...ys)-ymin));
const screen=p=>{const[x,y]=project(p);return[+(20+(x-xmin)*scale).toFixed(3),+(20+(y-ymin)*scale).toFixed(3)];};
function simplify(points,tolerance=.01){
 const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];
 while(stack.length){const[first,last]=stack.pop(),a=points[first],b=points[last],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let max=tolerance*tolerance,at=-1;
 for(let i=first+1;i<last;i++){const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0,d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;if(d>max){max=d;at=i;}}
 if(at>=0){keep.add(at);stack.push([first,at],[at,last]);}}
 const result=[...keep].sort((a,b)=>a-b).map(i=>points[i]);return result.length>=4?result:points;
}
const cacheUrl='https://resultados.tse.jus.br/oficial/ele2026/6257/config/mun-e006257-cm.json';
const catalog=JSON.parse(JSON.parse(fs.readFileSync('.cache/tse/'+createHash('sha256').update(cacheUrl).digest('hex')+'.json')).body),towns=catalog.abr.find(a=>a.cd==='mt').mu;
const shapes=raw.map(f=>{const town=towns.find(t=>t.cdi===f.properties.CD_MUN);if(!town)throw new Error('Unmatched official locality '+f.properties.CD_MUN);const rings=f.rings.map(r=>simplify(r).map(screen)),coords=rings.flat(),px=coords.map(p=>p[0]),py=coords.map(p=>p[1]),bounds=[Math.min(...px),Math.min(...py),Math.max(...px),Math.max(...py)];return{ibge:town.cdi,code:town.cd,name:town.nm,uf:'mt',zones:town.z??[],bounds,label:[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2],path:rings.map(r=>r.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join('')+'Z').join('')};});
if(shapes.length!==142||!shapes.some(s=>s.code==='73709'))throw new Error('Incomplete updated Mato Grosso geometry');
fs.copyFileSync('public/maps/mt.json','outputs/mt-before-official-update.json');
fs.writeFileSync('public/maps/mt.json',JSON.stringify({source:'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2024/UFs/MT/MT_Municipios_2024.zip',projection:'Equirectangular with central-latitude correction',simplificationDegrees:.01,shapes}));
console.log(JSON.stringify({shapes:shapes.length,vertices:shapes.reduce((n,s)=>n+(s.path.match(/[ML]/g)?.length??0),0),bytes:fs.statSync('public/maps/mt.json').size}));
