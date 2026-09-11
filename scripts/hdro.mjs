import {readFile,writeFile,rename} from 'node:fs/promises';
import {countries} from '../catalog.mjs';
export const specs=[
 ['hdi','Human Development Index','Index, 0–1','higher','Geometric mean of health, education and income dimension indices.'],
 ['ihdi','Inequality-adjusted HDI','Index, 0–1','higher','HDI discounted for inequality in health, education and income. Compare with HDI from this same API snapshot and year.'],
 ['loss','Human development lost to inequality','%','lower','Percentage loss between HDI and inequality-adjusted HDI, as published by HDRO. Not a GDP growth rate.'],
 ['ineq_inc','Inequality in income','%','lower','Atkinson-based inequality measure for the income dimension. This is not the Gini coefficient.'],
 ['ineq_edu','Inequality in education','%','lower','Inequality in the distribution of years of schooling used in the IHDI.'],
 ['ineq_le','Inequality in life expectancy','%','lower','Inequality in the distribution of length of life used in the IHDI.'],
 ['gdi','Gender Development Index','Female / male HDI ratio','context','Ratio of female to male HDI. Proximity to 1 indicates parity, which can occur at different development levels.'],
 ['hdi_f','Female Human Development Index','Index, 0–1','higher','HDI calculated for women; compare with the male index for the same year.'],
 ['hdi_m','Male Human Development Index','Index, 0–1','higher','HDI calculated for men; compare with the female index for the same year.'],
 ['phdi','Planetary pressures-adjusted HDI','Index, 0–1','higher','Experimental adjustment of HDI for production-based carbon dioxide emissions and material footprint per capita. Not a carbon-neutrality score.'],
 ['diff_hdi_phdi','HDI reduction for planetary pressures','%','lower','Percentage difference between HDI and PHDI as published by HDRO. It does not measure progress toward a net-zero commitment.'],
 ['mf','Material footprint per person','Tonnes per capita','lower','Raw materials extracted worldwide to satisfy domestic final demand, expressed per person.']
];
export function parseRows(rows,code){
 if(!Array.isArray(rows))throw Error('Unexpected HDRO response');
 const seen=new Set();return rows.filter(r=>r.indicatorCode===code).flatMap(r=>{
 const raw=String(r.value??'').trim(),year=Number(r.year),value=Number(raw);
 if(!raw||raw==='..')return [];
 if(!countries.some(c=>c.id===r.countryIsoCode)||!Number.isInteger(year)||!Number.isFinite(value))throw Error('Invalid HDRO observation');
 const id=r.countryIsoCode+':'+year;if(seen.has(id))throw Error('Duplicate HDRO observation');seen.add(id);
 return [{country:r.countryIsoCode,year,value,footnote:[r.note,r.yearStr!==r.year?'Source reference: '+r.yearStr:'','HDRO API snapshot; historical estimates may be revised.'].filter(Boolean).join(' ')}];
 });
}
export async function refreshHDRO(){
 let key=process.env.HDRO_API_KEY?.trim();if(!key)key=(await readFile(new URL('../../Apikey.txt',import.meta.url),'utf8')).trim();
 if(!key)throw Error('HDRO credential unavailable');
 const rows=[];
 // Bound responses to one country at a time; never log authenticated URLs or raw errors.
 for(const c of countries){
 const url=new URL('https://hdrdata.org/api/CompositeIndices/query-detailed');
 url.search=new URLSearchParams({apikey:key,countryOrAggregation:c.id,year:Array.from({length:new Date().getUTCFullYear()-1999},(_,i)=>2000+i).join(','),indicator:specs.map(s=>s[0]).join(',')});
 let data;for(let attempt=0;attempt<3;attempt++)try{const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error();const body=(await r.text()).split(key).join('[REDACTED]');data=JSON.parse(body);if(!Array.isArray(data)||!data.length)throw Error();break;}catch{if(attempt===2)throw Error('HDRO request failed; previous snapshot preserved.');}
 rows.push(...data);console.log('HDRO received '+c.id);
 }
 const retrievedAt=new Date().toISOString();const indicators=specs.map(([code,name,unit,direction,definition])=>({id:'HDRO_'+code.toUpperCase(),name:name+' (HDRO API)',officialName:rows.find(r=>r.indicatorCode===code)?.indicator||name,unit,direction,definition,category:['phdi','diff_hdi_phdi','mf'].includes(code)?'Environment':'People & equity',source:'UNDP',organisation:'UNDP Human Development Report Office',url:'https://hdr.undp.org/data-center/documentation-and-downloads',apiUrl:'https://hdrdata.org/api/CompositeIndices/query-detailed',sourceUpdated:'HDRO API snapshot '+retrievedAt.slice(0,10)+'; publication edition not supplied',retrievedAt,status:'ok',observations:parseRows(rows,code)}));
 if(indicators.some(i=>!i.observations.length))throw Error('Incomplete HDRO response; previous snapshot preserved.');
 const path=new URL('../data/hdro.json',import.meta.url);await writeFile(new URL('../data/hdro.json.tmp',import.meta.url),JSON.stringify({retrievedAt,indicators}));await rename(new URL('../data/hdro.json.tmp',import.meta.url),path);
 console.log('Saved '+indicators.length+' HDRO series without credentials.');
}
if(process.argv.includes('--refresh'))try{await refreshHDRO();}catch{console.error('HDRO refresh failed. Check credential and connectivity; previous data preserved.');process.exitCode=1;}
