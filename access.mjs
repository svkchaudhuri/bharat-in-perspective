import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const equal=(a,b)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
export function accessGate({enabled,password,secure=false,publicOrigin}){
 const key=randomBytes(32), attempts=new Map(), lifetime=86400;
 const sign=s=>createHmac('sha256',key).update(s).digest('hex');
 const cookie=(v,age)=>`bip_session=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`;
 const page=error=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private preview | Bharat in Perspective</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#edf1ed;color:#172c2b;font:17px system-ui}main{width:100%;max-width:430px;background:white;padding:32px;border-radius:20px;box-shadow:0 15px 55px #14302c18}small{color:#576f69}h1{font-size:29px;line-height:1.15}label{display:block;margin:24px 0 8px}input,button{width:100%;padding:14px;border-radius:9px;font:inherit}input{border:1px solid #7a8f88}button{background:#145c4f;color:white;border:0;margin-top:16px;cursor:pointer}.error{color:#a02b22}</style><main><small>PRIVATE PREVIEW</small><h1>Bharat in Perspective</h1><p>Enter the shared password to explore the dashboard.</p>${error?'<p class="error" role="alert">'+error+'</p>':''}<form method="post" action="/login"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button>Open dashboard</button></form></main></html>`;
 return async(req,res,url)=>{
  if(!enabled)return false;
  res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  if(!password){res.writeHead(503);res.end('Private preview is not configured.');return true;}
  if(url.pathname==='/logout'){res.setHeader('Set-Cookie',cookie('',0));res.writeHead(303,{Location:'/'});res.end();return true;}
  if(url.pathname==='/login'&&req.method==='POST'){
   // Embedded browsers can submit an opaque (null) origin. This shared-password gate has no user-specific account to switch.
   if(req.headers.origin&&req.headers.origin!=='null'&&req.headers.origin!==(publicOrigin||`${secure?'https':'http'}://${req.headers.host}`)){res.writeHead(403);res.end('Forbidden');return true;}
   // Trust Render's appended client address, never a caller-supplied first entry.
   const ip=secure?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim():req.socket.remoteAddress;
   const now=Date.now();for(const [k,v]of attempts)if(v.until<=now)attempts.delete(k);
   const entry=attempts.get(ip)||{count:0,until:now+900000};
   if(entry.count>=10){res.writeHead(429,{'Retry-After':String(Math.ceil((entry.until-now)/1000)),'Content-Type':'text/html; charset=utf-8'});res.end(page('Too many attempts. Please try again in 15 minutes.'));return true;}
   let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>2048){res.writeHead(413);res.end('Request too large');return true;}body+=chunk;}
   if(equal(new URLSearchParams(body).get('password')||'',password)){
    attempts.delete(ip);const exp=String(Math.floor(now/1000)+lifetime);res.setHeader('Set-Cookie',cookie(exp+'.'+sign(exp),lifetime));res.writeHead(303,{Location:'/'});res.end();return true;
   }
   entry.count++;if(attempts.size<10000||attempts.has(ip))attempts.set(ip,entry);
   res.writeHead(401,{'Content-Type':'text/html; charset=utf-8'});res.end(page('Incorrect password. Please try again.'));return true;
  }
  const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bip_session='))?.slice(12)||'';
  const [exp,mac]=value.split('.');
  if(/^\d+$/.test(exp||'')&&Number(exp)>Date.now()/1000&&equal(mac||'',sign(exp)))return false;
  res.writeHead(url.pathname==='/'?200:401,{'Content-Type':'text/html; charset=utf-8'});res.end(page(''));return true;
 };
}
