import {readFile,readdir} from 'node:fs/promises';
const key=(await readFile('../Apikey.txt','utf8')).trim();let leaks=0;
async function scan(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','.git'].includes(e.name))continue;const p=dir+'/'+e.name;if(e.isDirectory())await scan(p);else if((await readFile(p)).includes(Buffer.from(key)))leaks++;}}
await scan('.');console.log('Credential occurrences in project: '+leaks);if(leaks)process.exitCode=1;
for(const p of ['/Apikey.txt','/../Apikey.txt','/data/hdro.json','/scripts/hdro.mjs'])console.log('Private path HTTP status: '+(await fetch('http://127.0.0.1:4173'+p)).status);
