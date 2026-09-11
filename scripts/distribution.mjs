// All derived observations require a common country and observation year.
export function deriveDistribution(indicators){
 const get=id=>indicators.find(i=>i.id===id);
 const specs=[
  {id:'DERIVED_BOTTOM40',name:'Bottom 40% income / consumption share',unit:'% of survey welfare',direction:'higher',inputs:['SI.DST.FRST.20','SI.DST.02ND.20'],formula:'bottom 20% share + second 20% share',calc:v=>v[0]+v[1]},
  {id:'DERIVED_PALMA',name:'Palma ratio',unit:'Top 10% share / bottom 40% share',direction:'lower',inputs:['SI.DST.10TH.10','SI.DST.FRST.20','SI.DST.02ND.20'],formula:'top 10% share / (bottom 20% share + second 20% share)',calc:v=>v[1]+v[2]>0?v[0]/(v[1]+v[2]):null},
  {id:'DERIVED_BOTTOM40_MEAN',name:'Bottom 40% mean relative to national mean',unit:'% of national survey mean',direction:'higher',inputs:['SI.DST.FRST.20','SI.DST.02ND.20'],formula:'(bottom 20% share + second 20% share) / 40 × 100',calc:v=>(v[0]+v[1])/40*100},
  {id:'DERIVED_PREMIUM',name:'Shared prosperity premium',unit:'Percentage points of annualised growth',direction:'higher',inputs:['SI.SPR.PC40.ZG','SI.SPR.PCAP.ZG'],formula:'bottom 40% real welfare growth − national mean real welfare growth, over the same survey interval',calc:v=>v[0]-v[1],interval:true},
  {id:'DERIVED_HDI_LOSS',name:'Human development loss due to inequality',unit:'% loss relative to HDI',direction:'lower',inputs:['UNDP_HDI','UNDP_IHDI'],formula:'(1 − inequality-adjusted HDI / HDI) × 100',calc:v=>v[0]>0?(1-v[1]/v[0])*100:null}
 ];
 return specs.map(s=>{
  const inputs=s.inputs.map(get),observations=[];
  if(inputs.every(Boolean))for(const a of inputs[0].observations){const matches=inputs.map(i=>i.observations.find(o=>o.country===a.country&&o.year===a.year));if(matches.some(o=>!o))continue;
   if(s.interval){const intervals=matches.map(o=>o.footnote?.match(/period of (\d{4})[–-](\d{4})/i)?.[0]);if(intervals.some(x=>!x)||new Set(intervals).size!==1||matches.some(o=>!o.footnote.match(/(?:income|consumption) data/i))||new Set(matches.map(o=>(o.footnote.match(/(?:income|consumption) data/i)||[])[0]?.toLowerCase())).size!==1)continue;}
   const value=s.calc(matches.map(o=>o.value));if(value===null||!Number.isFinite(value))continue;
   observations.push({country:a.country,year:a.year,value,footnote:`Derived: ${s.formula}. Inputs: ${s.inputs.join(', ')}. ${[...new Set(matches.map(o=>o.footnote).filter(Boolean))].join(' ')}`});
  }
  return {id:s.id,name:s.name,officialName:s.name,category:'Shared prosperity',unit:s.unit,direction:s.direction,source:'Derived',definition:`Calculated from published source observations, not a new official GDP series. Formula: ${s.formula}. Income-based and consumption-based survey distributions are not directly equivalent. This is a distribution measure, not a wealth or social-class census.`,organisation:'Dashboard calculation from World Bank / UNDP observations',url:s.id==='DERIVED_HDI_LOSS'?'https://hdr.undp.org/inequality-adjusted-human-development-index':'https://pip.worldbank.org/',apiUrl:inputs[0]?.apiUrl,sourceUpdated:'See input observations',retrievedAt:inputs.map(i=>i?.retrievedAt).filter(Boolean).sort()[0],status:inputs.some(i=>!i||i.status==='unavailable')?'unavailable':inputs.some(i=>i.status==='cached')?'cached':'ok',observations,inputs:s.inputs};
 });
}

