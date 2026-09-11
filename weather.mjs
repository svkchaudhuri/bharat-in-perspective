export const locations={delhi:{name:'New Delhi, India',lat:28.61,lon:77.21},kolkata:{name:'Kolkata, India',lat:22.57,lon:88.36},mumbai:{name:'Mumbai, India',lat:19.08,lon:72.88},chennai:{name:'Chennai, India',lat:13.08,lon:80.27},bengaluru:{name:'Bengaluru, India',lat:12.97,lon:77.59},guwahati:{name:'Guwahati, India',lat:26.14,lon:91.74},singapore:{name:'Singapore',lat:1.35,lon:103.82},tokyo:{name:'Tokyo, Japan',lat:35.68,lon:139.69},beijing:{name:'Beijing, China',lat:39.90,lon:116.40},newyork:{name:'New York, United States',lat:40.71,lon:-74.01},copenhagen:{name:'Copenhagen, Denmark',lat:55.68,lon:12.57},oslo:{name:'Oslo, Norway',lat:59.91,lon:10.75},stockholm:{name:'Stockholm, Sweden',lat:59.33,lon:18.07},helsinki:{name:'Helsinki, Finland',lat:60.17,lon:24.94},reykjavik:{name:'Reykjavik, Iceland',lat:64.15,lon:-21.94}};
const cache=new Map(),pending=new Map();
export async function weather(id){
 const city=locations[id];if(!city)throw Error('Choose a supported weather location');
 const old=cache.get(id);if(old&&Date.now()-old.time<900000)return old.data;
 if(pending.has(id))return pending.get(id);
 const job=(async()=>{try{
 const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:city.lat,longitude:city.lon,current:'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',timezone:'auto',forecast_days:'7',past_days:'7'});
 const r=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'error'});if(!r.ok)throw Error('Weather provider unavailable');const raw=await r.json();
 if(!raw.current?.time||!Array.isArray(raw.daily?.time))throw Error('Weather response incomplete');
 const data={...raw,location:city,retrievedAt:new Date().toISOString(),status:'ok',source:'https://open-meteo.com/en/docs'};cache.set(id,{time:Date.now(),data});return data;
 }catch{if(old)return {...old.data,status:'cached',error:'Latest weather retrieval failed'};throw Error('Weather unavailable; no substitute observations supplied');}finally{pending.delete(id);}})();pending.set(id,job);return job;
}
