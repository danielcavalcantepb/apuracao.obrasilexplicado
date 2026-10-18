import { readFile, writeFile, mkdir } from 'node:fs/promises';
const states = JSON.parse(await readFile('data/geography/ufs.json', 'utf8'));
const national = JSON.parse(await readFile('data/geography/br-ufs.geojson', 'utf8'));
const polys = f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
const points = national.features.flatMap(f => polys(f).flat(2));
const lat = points.map(p => p[1]);
const reference = (Math.min(...lat) + Math.max(...lat)) / 2;
const project = ([x,y]) => [x * Math.cos(reference * Math.PI/180), -y];
const projected = points.map(project);
const xs=projected.map(p=>p[0]), ys=projected.map(p=>p[1]);
const xmin=Math.min(...xs), ymin=Math.min(...ys);
const scale=Math.min(640/(Math.max(...xs)-xmin),630/(Math.max(...ys)-ymin));
const screen=p=>{const [x,y]=project(p);return [+(20+(x-xmin)*scale).toFixed(3),+(20+(y-ymin)*scale).toFixed(3)];};
const catalog=await (await fetch('https://resultados.tse.jus.br/oficial/ele2026/6257/config/mun-e006257-cm.json')).json();
await mkdir('public/maps',{recursive:true});
let count=0;
for(const state of states){
  const uf=state.sigla.toLowerCase();
  const url=`https://servicodados.ibge.gov.br/api/v3/malhas/estados/${state.id}?intrarregiao=municipio&formato=application%2Fvnd.geo%2Bjson&qualidade=minima`;
  const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
  if(!response.ok) throw new Error(`${uf}: ${response.status}`);
  const geometry=await response.json();
  const towns=catalog.abr.find(a=>a.cd===uf)?.mu??[];
  const shapes=geometry.features.map(f=>{
    const town=towns.find(t=>t.cdi===f.properties.codarea);
    const rings=polys(f).map(poly=>poly.map(ring=>ring.map(screen)));
    const coords=rings.flat(2);const px=coords.map(p=>p[0]),py=coords.map(p=>p[1]);
    const bounds=[Math.min(...px),Math.min(...py),Math.max(...px),Math.max(...py)];
    return {ibge:f.properties.codarea,code:town?.cd??null,name:town?.nm??f.properties.codarea,uf,
      zones:town?.z??[],bounds,label:[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2],
      path:rings.flat(1).map(ring=>ring.map((p,i)=>`${i?'L':'M'}${p[0]},${p[1]}`).join('')+'Z').join('')};
  });
  count+=shapes.length;
  await writeFile(`public/maps/${uf}.json`,JSON.stringify({source:url,projection:'Equirectangular with central-latitude correction',shapes}));
  console.log(`${uf}: ${shapes.length} municípios, ${shapes.filter(s=>s.code).length} códigos TSE associados`);
}
console.log(`Total: ${count} geometrias reais. Sem correspondência oficial: áreas neutras.`);
