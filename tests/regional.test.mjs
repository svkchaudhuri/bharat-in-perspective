import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {weather,locations} from '../weather.mjs';
const d=JSON.parse(await readFile(new URL('../data/states.json',import.meta.url),'utf8'));
test('all 28 states and 8 union territories have 12 validated deprivation measures',()=>{
 assert.equal(d.states.filter(s=>s.kind==='State').length,28);assert.equal(d.states.filter(s=>s.kind==='Union territory').length,8);
 assert.equal(new Set(d.states.map(s=>s.name)).size,36);
 for(const s of d.states){assert.equal(s.deprivations.length,12);assert.ok(s.poverty.value>=0&&s.poverty.value<=100);assert.ok(Math.abs(s.poverty.mpi-s.poverty.value*s.poverty.intensity/10000)<.001);
 for(const i of s.deprivations){assert.ok(i.value>=0&&i.value<=100);assert.ok(i.baseline>=0&&i.baseline<=100);assert.ok(Math.abs(i.value-i.baseline-i.change)<.025);}}
});
test('state trade matrix direction and commodity totals agree for every reported state',()=>{
 for(const s of d.states)for(const [direction,key] of [['inward','to'],['outward','from']]){const v=s[direction];if(!v)continue;assert.ok(Math.abs(v.total-v.goods.reduce((sum,g)=>sum+g.value,0))<.01);assert.ok(Math.abs(v.total-d.flows.filter(f=>f[key]===s.name).reduce((sum,f)=>sum+f.value,0))<.01);}
 const gujarat=d.states.find(s=>s.name==='Gujarat');assert.ok(Math.abs(gujarat.outward.total-1203072.99)<.01);assert.ok(Math.abs(gujarat.inward.total-818196.16)<.01);
});
test('flow datasets retain units, geography and no self links',()=>{
 for(const rows of [d.flows,d.rail.flows]){const keys=new Set();for(const f of rows){assert.notEqual(f.from,f.to);assert.ok(Number.isFinite(f.value)&&f.value>=0);const key=[f.from,f.to,f.commodity||'all'].join('|');assert.ok(!keys.has(key));keys.add(key);}}
 assert.equal(d.rail.unit,'Tonnes');assert.equal(d.rail.period,'2024-25');assert.equal(d.rail.commodities.length,66);assert.ok(d.rail.reconciledCells>1000);
});
test('rail coal matrix matches independent published Jharkhand outward total',()=>{
 const total=d.rail.flows.filter(f=>f.from==='Jharkhand'&&f.commodity==='COAL,COKE AND BRIQUETTES ETC').reduce((s,f)=>s+f.value,0);assert.ok(Math.abs(total/100000-1471.71)<.01);
});
test('small territories remain unavailable rather than assigned Other Territory values',()=>{
 for(const n of ['Ladakh','Lakshadweep','Andaman & Nicobar Islands','Dadra & Nagar Haveli & Daman & Diu']){const s=d.states.find(s=>s.name===n);assert.equal(s.inward,null);assert.equal(s.outward,null);}
 assert.ok(d.flows.some(f=>f.from==='Other Territory'));
});
test('weather accepts only configured points and refuses arbitrary URLs',async()=>{
 assert.equal(Object.keys(locations).length,15);await assert.rejects(weather('https://example.com'),/supported/);
});
