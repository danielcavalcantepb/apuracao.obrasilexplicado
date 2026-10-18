import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {TseClient}=require('../outputs/municipal-runtime/client.js');
const {FileBackedCache}=require('../outputs/municipal-runtime/cache.js');
const {CONFIG_URL,discoverElection,normalizeGeography}=require('../outputs/municipal-runtime/config.js');
const {geographyUrl,resultUrl}=require('../outputs/municipal-runtime/urls.js');
const {normalizeResult}=require('../outputs/municipal-runtime/normalizers.js');
const {candidateColor}=require('../outputs/municipal-runtime/candidate-colors.js');
const client=new TseClient(new FileBackedCache('.cache/tse'));
const config=(await client.restore(CONFIG_URL,discoverElection))?.value;
if(!config)throw new Error('Validated official configuration required');
const geography=(await client.restore(geographyUrl(config),normalizeGeography))?.value;
if(!geography)throw new Error('Validated official geography required');
const results=[];
for(const region of geography.filter(g=>g.code!=='zz'))for(const town of region.municipalities){
 const scope={type:'municipality',state:region.code,code:town.code,name:town.name},url=resultUrl(config,scope),s=(await client.restore(url,raw=>normalizeResult(raw,config,scope,url)))?.value;
 if(!s)throw new Error('Missing official result: '+region.code+town.code);
 results.push({code:s.scope.code,name:s.scope.name,uf:s.scope.state,version:s.version,updatedAt:s.progress.totaledAt??s.progress.generatedAt,counted:s.progress.percentageCounted,validVotes:s.progress.validVotes,stale:true,candidates:s.candidates.map(c=>({id:c.id,number:c.number,name:c.ballotName,votes:c.votes,percentage:c.percentage,color:candidateColor(c)}))});
}
await fs.mkdir('data/tse',{recursive:true});
await fs.writeFile('data/tse/municipal-baseline.json',JSON.stringify({source:'https://resultados.tse.jus.br',election:config.election,generatedAt:new Date().toISOString(),results}));
console.log(JSON.stringify({available:results.length,ufs:new Set(results.map(m=>m.uf)).size}));
