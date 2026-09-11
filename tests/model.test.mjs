import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import '../model.js';
const {observation,commonYear,csvCell}=globalThis.ObservatoryModel;
const sample={observations:[{country:'IND',year:2022,value:0},{country:'IND',year:2024,value:5},{country:'USA',year:2022,value:2},{country:'USA',year:2023,value:3}]};
test('latest value preserves its actual year',()=>assert.deepEqual(observation(sample,'USA'),{country:'USA',year:2023,value:3}));
test('missing year is not backfilled',()=>assert.equal(observation(sample,'USA',2024),null));
test('a valid zero is preserved',()=>assert.equal(observation(sample,'IND',2022).value,0));
test('common year requires every country',()=>assert.equal(commonYear(sample,['IND','USA']),2022));
test('no common year produces no comparison',()=>assert.equal(commonYear(sample,['IND','JPN']),null));
test('empty selection has no common year',()=>assert.equal(commonYear(sample,[]),null));
test('CSV escapes quotes and preserves newlines',()=>assert.equal(csvCell('a,"b"\nc'),'"a,""b""\nc"'));
const d=JSON.parse(await readFile(new URL('../data/snapshot.json',import.meta.url),'utf8'));
test('snapshot has unique, finite observations and valid country codes',()=>{
 const ids=new Set(d.countries.map(c=>c.id));
 for(const i of d.indicators){const keys=new Set();for(const o of i.observations){const key=o.country+':'+o.year;assert.ok(ids.has(o.country),i.id);assert.ok(Number.isFinite(o.value));assert.ok(o.year>=2000&&o.year<=new Date().getFullYear());assert.ok(!keys.has(key),i.id+' duplicate '+key);keys.add(key);}}
});
test('successful series have original metadata and retrieval dates',()=>{for(const i of d.indicators.filter(i=>i.status==='ok')){assert.ok(i.officialName);assert.equal(typeof i.definition,'string');assert.ok(['hdrdata.org','api.worldbank.org','hdr.undp.org','ghoapi.azureedge.net','files.worldhappiness.report','dashboards.sdgindex.org'].includes(new URL(i.apiUrl).hostname));assert.ok(Number.isFinite(Date.parse(i.retrievedAt)));}});
test('common-year selection is valid for all available series',()=>{const ids=d.countries.map(c=>c.id);for(const i of d.indicators){const y=commonYear(i,ids);if(y!==null)for(const c of ids)assert.equal(observation(i,c,y).year,y);}});


import {parseCSV} from '../scripts/secondary.mjs';
test('UNDP CSV parser preserves escaped quotes, commas and multiline fields',()=>assert.deepEqual(parseCSV('id,name\r\nIND,"a,""b""\nc"\r\n'),[['id','name'],['IND','a,"b"\nc']]));
test('UNDP CSV parser rejects malformed quoted fields',()=>assert.throws(()=>parseCSV('a,"unterminated')));
test('UNDP HDI snapshot matches the downloaded India reference',()=>assert.equal(observation(d.indicators.find(i=>i.id==='UNDP_HDI'),'IND',2023).value,0.685));
test('WHO second-edition capacity is not mixed with the old instrument',()=>{const i=d.indicators.find(i=>i.id==='IHRSPAR2_C13');assert.ok(i.observations.length);for(const o of i.observations){assert.ok(o.year>=2021);assert.ok(o.value>=0&&o.value<=100);}});

import {deriveDistribution} from '../scripts/distribution.mjs';
const fixture=(id,rows)=>({id,status:'ok',observations:rows,apiUrl:'https://api.worldbank.org/',retrievedAt:'2026-09-11T00:00:00Z'});
test('Palma matches published same-year shares for India',()=>{const i=d.indicators.find(i=>i.id==='DERIVED_PALMA');assert.ok(Math.abs(observation(i,'IND',2022).value-22.1/24.6)<1e-10);});
test('normalised bottom 40 mean preserves the group denominator',()=>assert.ok(Math.abs(observation(d.indicators.find(i=>i.id==='DERIVED_BOTTOM40_MEAN'),'IND',2022).value-61.5)<1e-10));
test('derived shares do not mix survey years',()=>{const result=deriveDistribution([fixture('SI.DST.FRST.20',[{country:'IND',year:2020,value:10}]),fixture('SI.DST.02ND.20',[{country:'IND',year:2022,value:14}])]);assert.equal(result.find(i=>i.id==='DERIVED_BOTTOM40').observations.length,0);});
test('growth premium refuses mismatched intervals',()=>{const result=deriveDistribution([fixture('SI.SPR.PC40.ZG',[{country:'USA',year:2024,value:2,footnote:'Estimated from income data. Growth rates are for the period of 2019-2024.'}]),fixture('SI.SPR.PCAP.ZG',[{country:'USA',year:2024,value:1,footnote:'Estimated from income data. Growth rates are for the period of 2020-2024.'}])]);assert.equal(result.find(i=>i.id==='DERIVED_PREMIUM').observations.length,0);});
test('growth premium is not fabricated for India',()=>assert.equal(observation(d.indicators.find(i=>i.id==='DERIVED_PREMIUM'),'IND'),null));
test('happiness observations preserve uncertainty bounds',()=>{for(const o of d.indicators.find(i=>i.id==='WHR_LIFE').observations){if(o.low!==null&&o.high!==null)assert.ok(o.low<=o.value&&o.high>=o.value);else assert.ok(o.low===null&&o.high===null);assert.ok(o.value>=0&&o.value<=10);}});
test('all 17 goals exist for each country with bounded scores',()=>{for(const c of d.editions.sdg){assert.equal(c.goals.length,17);assert.equal(new Set(c.goals.map(g=>g.number)).size,17);for(const g of c.goals)for(const o of g.history)assert.ok(o.value>=0&&o.value<=100);}});
test('DST category sums reconcile with source totals within rounding',()=>{for(const b of Object.values(d.editions.research).filter(v=>v?.rows)){assert.ok(Math.abs(b.rows.reduce((s,r)=>s+r.value,0)-b.total)<.05);}});
test('DST discipline headcounts reconcile by gender',()=>{const b=d.editions.research.disciplines;for(const r of b.rows)assert.equal(r.male+r.female,r.value);assert.match(b.exclusion,/excluding higher education/i);});


import {parseRows} from '../scripts/hdro.mjs';
test('HDRO parser preserves missing data, rejects duplicates and retains source notes',()=>{
 const row={countryIsoCode:'IND',indicatorCode:'hdi',year:'2023',yearStr:'2023',value:'0.685',note:'Source note'};
 assert.equal(parseRows([row],'hdi')[0].value,0.685);
 assert.match(parseRows([row],'hdi')[0].footnote,/Source note/);
 assert.deepEqual(parseRows([{...row,value:'..'}],'hdi'),[]);
 assert.throws(()=>parseRows([row,row],'hdi'),/Duplicate/);
});
test('HDRO inequality loss reconciles within publication rounding',()=>{
 for(const c of d.countries){const value=id=>d.indicators.find(i=>i.id===id)?.observations.find(o=>o.country===c.id&&o.year===2023)?.value;
 const h=value('HDRO_HDI'),i=value('HDRO_IHDI'),loss=value('HDRO_LOSS');if(h&&i&&loss!==undefined)assert.ok(Math.abs(100*(1-i/h)-loss)<0.2);}
});

