import {weather} from './weather.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
let eventsCache=null,eventPromise=null;
async function events(){
 if(eventsCache&&Date.now()-eventsCache.fetched<300000)return eventsCache.data;
 if(eventPromise)return eventPromise;
 eventPromise=(async()=>{try{const r=await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`USGS HTTP ${r.status}`);const feed=await r.json();if(!Array.isArray(feed.features))throw Error('Invalid USGS feed');const data={...feed,retrievedAt:new Date().toISOString(),status:'ok'};eventsCache={fetched:Date.now(),data};return data;}catch(e){if(eventsCache)return {...eventsCache.data,status:'cached',error:e.message};throw e;}finally{eventPromise=null;}})();return eventPromise;
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');
 try{
  if(req.method!=='GET'){res.writeHead(405);return res.end('Method not allowed');}
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/weather'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(await weather(url.searchParams.get('city')||'delhi')));}
  if(url.pathname==='/api/events'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(await events()));}
  const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const target=path.resolve(root,'.'+requested);
  if(!target.startsWith(root)||!/^\/(assets\/india-landscape\.png|index\.html|app\.js|regional\.js|data\/states\.json|extensions\.js|model\.js|style\.css|data\/snapshot\.(js|json)|vendor\/[\w.-]+)$/.test(requested)){res.writeHead(404);return res.end('Not found');}
  const content=await readFile(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(content);
 }catch(e){res.writeHead(req.url.startsWith('/api/')?502:404,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'unavailable',error:e.message}));}
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('India World Observatory: http://127.0.0.1:4173'));




