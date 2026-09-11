export const secondaryIndicators = [
 {id:'UNDP_HDI',column:'hdi',name:'Human Development Index',category:'People & equity',unit:'Index, 0–1',direction:'higher',definition:'UNDP composite of longevity, education and income, using the geometric mean of the three dimension indices. It does not capture every dimension of wellbeing.'},
 {id:'UNDP_IHDI',column:'ihdi',name:'Inequality-adjusted HDI',category:'People & equity',unit:'Index, 0–1',direction:'higher',definition:'Human Development Index adjusted for inequality in the distribution of achievements in health, education and income. Interpret alongside the unadjusted HDI.'},
 {id:'UNDP_GII',column:'gii',name:'Gender Inequality Index',category:'People & equity',unit:'Index, 0–1',direction:'lower',definition:'UNDP composite reflecting gender inequalities in reproductive health, empowerment and labour market participation. Lower values indicate less measured inequality.'},
 {id:'UNDP_EYS',column:'eys',name:'Expected years of schooling',category:'Education',unit:'Years',direction:'higher',definition:'Schooling years a child entering school can expect if prevailing age-specific enrolment patterns persist. This is not a measure of learning quality.'},
 {id:'UNDP_MYS',column:'mys',name:'Mean years of schooling',category:'Education',unit:'Years',direction:'higher',definition:'Average completed years of education among adults aged 25 and older. This is not a measure of learning quality.'}
].map(i=>({...i,source:'UNDP',url:'https://hdr.undp.org/data-center/documentation-and-downloads',organisation:'UNDP Human Development Report Office',officialName:i.name,edition:'Human Development Report 2025'}));
export const foodIndicator={id:'IHRSPAR2_C13',name:'Food safety capacity (SPAR)',officialName:'Food safety, IHR SPAR second edition (C13)',category:'Food safety',unit:'Capacity score, 0–100',direction:'higher',source:'WHO',organisation:'World Health Organization / National IHR Focal Points',url:'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/food-safety-ihr',definition:'Self-reported attainment of food-safety core capacity under the IHR SPAR second edition. Measures preparedness and capacity, not food contamination prevalence or foodborne illness incidence. This dashboard uses the second-edition series only (2021 onward) and does not join it to the first edition.'};
export const secondaryCatalog=[...secondaryIndicators,foodIndicator];
export const undpURL='https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv';
// RFC 4180-style fields, including escaped quotes and embedded newlines.
export function parseCSV(text){
 const rows=[];let row=[],value='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let n=0;n<text.length;n++){const c=text[n];if(c==='"'){if(quoted&&text[n+1]==='"'){value+='"';n++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[n+1]==='\n')n++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}
 if(quoted)throw Error('Unterminated quoted CSV field');
 if(value||row.length){row.push(value);rows.push(row);}return rows;
}
async function request(url,json=true){let error;for(let n=0;n<3;n++)try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return json?await r.json():await r.text();}catch(e){error=e;}throw error;}
export async function collectSecondary(countries,previous){
 const ids=new Set(countries.map(c=>c.id));
 const fallback=(i,error)=>{const old=previous?.indicators?.find(o=>o.id===i.id);return {...i,...(old||{}),status:old?'cached':'unavailable',error:error.message,observations:old?.observations||[]};};
 const [undp,food]=await Promise.all([
  (async()=>{try{
   const csv=await request(undpURL,false),[headers,...rows]=parseCSV(csv),iso=headers.indexOf('iso3');if(iso<0)throw Error('UNDP ISO3 column missing');
   const selected=rows.filter(r=>ids.has(r[iso]));if(selected.length!==countries.length)throw Error('UNDP country coverage changed');
   return secondaryIndicators.map(i=>{
    const columns=headers.map((h,index)=>({h,index})).filter(c=>new RegExp(`^${i.column}_20[0-9]{2}$`).test(c.h));if(!columns.length)throw Error('UNDP series missing: '+i.column);
    const observations=[];
    for(const row of selected)for(const {h,index} of columns){const raw=(row[index]||'').trim();if(!raw||raw==='..')continue;const value=Number(raw);if(!Number.isFinite(value))throw Error('Unexpected UNDP numeric value');observations.push({country:row[iso],year:Number(h.slice(-4)),value,footnote:'HDR 2025 edition; historical values can be revised between editions.'});}
    return {...i,status:'ok',sourceUpdated:'HDR 2025 edition',retrievedAt:new Date().toISOString(),apiUrl:undpURL,observations};
   });
  }catch(e){return secondaryIndicators.map(i=>fallback(i,e));}})(),
  (async()=>{try{
   const url='https://ghoapi.azureedge.net/api/IHRSPAR2_C13';let payload=await request(url),values=[...payload.value];
   while(payload['@odata.nextLink']){const next=new URL(payload['@odata.nextLink']);if(next.hostname!=='ghoapi.azureedge.net')throw Error('Unexpected WHO pagination host');payload=await request(next.href);values.push(...payload.value);}
   const rows=values.filter(r=>r.SpatialDimType==='COUNTRY'&&ids.has(r.SpatialDim)&&r.TimeDim>=2021&&r.NumericValue!==null&&Number.isFinite(r.NumericValue));if(!rows.length)throw Error('WHO food capacity data missing');
   return {...foodIndicator,status:'ok',sourceUpdated:'Not supplied as a dataset timestamp',retrievedAt:new Date().toISOString(),apiUrl:url,observations:rows.map(r=>({country:r.SpatialDim,year:r.TimeDim,value:r.NumericValue,footnote:r.Comments||''}))};
  }catch(e){return fallback(foodIndicator,e);}})()
 ]);
 return [...undp,food];
}
