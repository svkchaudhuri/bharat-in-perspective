import {readFile,writeFile} from 'node:fs/promises';
import {deriveDistribution} from './distribution.mjs';
export async function enrich(snapshot){
 const editions=JSON.parse(await readFile(new URL('../data/editions.json',import.meta.url),'utf8'));
 const gini=snapshot.indicators.find(i=>i.id==='SI.POV.GINI');if(gini)gini.name='Income / consumption inequality (Gini)';
 let hdro;try{hdro=JSON.parse(await readFile(new URL('../data/hdro.json',import.meta.url),'utf8'));}catch{}
 const base=snapshot.indicators.filter(i=>!i.id.startsWith('DERIVED_')&&(!hdro||!i.id.startsWith('HDRO_'))&&!editions.series.some(e=>e.id===i.id));
 snapshot.indicators=[...base,...(hdro?.indicators||[]),...editions.series,...deriveDistribution(base)];
 snapshot.pending=snapshot.pending.filter(i=>!['Life evaluation / happiness','SDG index and targets'].includes(i.name));
 snapshot.editions={sdg:editions.sdg,research:editions.research,provenance:editions.provenance};
 return snapshot;
}
if(process.argv.includes('--existing')){
 const snapshot=await enrich(JSON.parse(await readFile(new URL('../data/snapshot.json',import.meta.url),'utf8')));
 await writeFile(new URL('../data/snapshot.json',import.meta.url),JSON.stringify(snapshot));
 await writeFile(new URL('../data/snapshot.js',import.meta.url),'window.OBSERVATORY_DATA='+JSON.stringify(snapshot).replace(/</g,'\\u003c')+';');
 console.log('Saved',snapshot.indicators.length,'series.');
}

