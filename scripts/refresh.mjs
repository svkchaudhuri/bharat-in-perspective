import {refreshHDRO} from './hdro.mjs';
import {mkdir,writeFile,rename,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {countries,indicators,pending} from '../catalog.mjs';
import {collectSecondary} from './secondary.mjs';
import {enrich} from './enrich.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export async function getJSON(url) {
  let error;
  for(let n=0;n<3;n++) {try {const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json();}catch(e){error=e;}}
  throw error;
}
export async function refresh(){
 await mkdir(root+'data',{recursive:true});
 let previous;try{previous=JSON.parse(await readFile(root+'data/snapshot.json','utf8'));}catch{}
 const results=[];let cursor=0;
 async function worker(){while(cursor<indicators.length){const indicator=indicators[cursor++];
  const url=`https://api.worldbank.org/v2/country/${countries.map(c=>c.id).join(';')}/indicator/${indicator.id}?source=${indicator.source}&date=2000:${new Date().getUTCFullYear()}&format=json&per_page=20000&footnote=y`;
  try{
   const [values,meta]=await Promise.all([getJSON(url),getJSON(`https://api.worldbank.org/v2/indicator/${indicator.id}?source=${indicator.source}&format=json`)]);
   if(!Array.isArray(values?.[1])||!meta?.[1]?.[0])throw Error('Source returned no valid series');
   if(Number(values[0].pages)>1)throw Error('Unexpected pagination; data not saved');
   const m=meta[1][0];
   results.push({...indicator,officialName:m.name,definition:m.sourceNote,organisation:m.sourceOrganization,sourceUpdated:values[0].lastupdated,retrievedAt:new Date().toISOString(),status:'ok',apiUrl:url,
    observations:values[1].filter(d=>d.value!==null&&Number.isFinite(d.value)).map(d=>({country:d.countryiso3code,year:Number(d.date),value:d.value,footnote:d.footnote||''}))});
   console.log(`OK ${indicator.id}`);
  }catch(e){const old=previous?.indicators?.find(x=>x.id===indicator.id);results.push({...indicator,...(old||{}),status:old?'cached':'unavailable',error:e.message,observations:old?.observations||[]});console.log(`UNAVAILABLE ${indicator.id}: ${e.message}`);}
 }}
 await Promise.all(Array.from({length:5},worker));
 const secondary=await collectSecondary(countries,previous);
 const snapshot={updatedAt:new Date().toISOString(),countries,pending,indicators:[...indicators.map(i=>results.find(r=>r.id===i.id)),...secondary]};
 try{await refreshHDRO();}catch{console.log('HDRO refresh unavailable; retaining previous API snapshot.');try{const p=root+'data/hdro.json';const h=JSON.parse(await readFile(p,'utf8'));h.indicators.forEach(i=>i.status='cached');await writeFile(p,JSON.stringify(h));}catch{}}
 await enrich(snapshot);
 await writeFile(root+'data/snapshot.json.tmp',JSON.stringify(snapshot));await rename(root+'data/snapshot.json.tmp',root+'data/snapshot.json');
 // Embedded snapshot allows opening index.html directly, including without internet.
 await writeFile(root+'data/snapshot.js.tmp',`window.OBSERVATORY_DATA=${JSON.stringify(snapshot).replace(/</g,'\\u003c')};`);await rename(root+'data/snapshot.js.tmp',root+'data/snapshot.js');
 console.log(`Saved ${snapshot.indicators.length} series; ${snapshot.indicators.filter(i=>i.status==='ok').length} fetched successfully.`);
 return snapshot;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await refresh();



