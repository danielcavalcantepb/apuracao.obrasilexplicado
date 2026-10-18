// Finite, resumable prefetch using exactly the application's parser, cache and rate limiter.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const root=process.cwd(), runtime=path.join(root,'outputs','municipal-runtime');
await fs.mkdir(runtime,{recursive:true});
await fs.writeFile(path.join(runtime,'package.json'),'{"type":"commonjs"}');
for(const name of await fs.readdir(path.join(root,'src/lib/tse'))){
  if(!name.endsWith('.ts'))continue;
  const source=await fs.readFile(path.join(root,'src/lib/tse',name),'utf8');
  await fs.writeFile(path.join(runtime,name.replace(/\.ts$/,'.js')),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
}
const require=createRequire(import.meta.url);
const {TseClient}=require(path.join(runtime,'client.js'));
const {FileBackedCache}=require(path.join(runtime,'cache.js'));
const {CONFIG_URL,discoverElection,normalizeGeography}=require(path.join(runtime,'config.js'));
const {geographyUrl,resultUrl}=require(path.join(runtime,'urls.js'));
const {normalizeResult}=require(path.join(runtime,'normalizers.js'));
const client=new TseClient(new FileBackedCache(path.join(root,'.cache/tse')));
const deadline=Date.now()+35*60*1000;
const watchdog=setTimeout(()=>{console.error('Finite collector deadline reached; cache preserved.');process.exit(1);},35*60*1000);
const config=(await client.read(CONFIG_URL,discoverElection,3600000)).value;
if(!config)throw new Error('Official configuration unavailable');
const geography=(await client.read(geographyUrl(config),normalizeGeography,3600000)).value;
if(!geography)throw new Error('Official geography unavailable');
const regions=geography.filter(g=>g.code!=='zz');
const queue=[];
for(let i=0;i<Math.max(...regions.map(g=>g.municipalities.length));i++){
  for(const region of regions){const town=region.municipalities[i];if(town)queue.push({type:'municipality',state:region.code,code:town.code,name:town.name});}
}
let available=0,attempted=0,cached=0,position=0,failures=0;
const report=async(status)=>fs.writeFile(path.join(root,'outputs/municipal-collection.json'),JSON.stringify({status,total:queue.length,available,cached,attempted,failures,updatedAt:new Date().toISOString(),cooldownUntil:client.cooldownUntil},null,2));
// Skip durable, schema-valid results so interruptions do not restart the download.
const missing=[];
for(const scope of queue){const url=resultUrl(config,scope);if((await client.restore(url,raw=>normalizeResult(raw,config,scope,url)))?.value){available++;cached++;}else missing.push(scope);}
await report('running');
await Promise.all(Array.from({length:4},async()=>{
  while(position<missing.length&&Date.now()<deadline){
    if(client.cooldownUntil>Date.now()){await report('upstream-backoff');break;}
    const scope=missing[position++],url=resultUrl(config,scope);
    const result=await client.read(url,raw=>normalizeResult(raw,config,scope,url),3000);
    attempted++;if(result.value)available++;else failures++;
    if(attempted%25===0)await report('running');
  }
}));
await report(available===queue.length?'complete':'incomplete');
clearTimeout(watchdog);
process.exitCode=available===queue.length?0:1;
