/* Pure comparison rules shared by the browser and the tests. */
(function(root){
 function observation(indicator,country,year='latest'){
  const rows=indicator.observations.filter(o=>o.country===country&&(year==='latest'||o.year===Number(year)));
  return rows.sort((a,b)=>b.year-a.year)[0]||null;
 }
 function commonYear(indicator,ids){
  if(!ids.length)return null;
  const years=[...new Set(indicator.observations.map(o=>o.year))].sort((a,b)=>b-a);
  return years.find(y=>ids.every(c=>indicator.observations.some(o=>o.country===c&&o.year===y)))??null;
 }
 function csvCell(value){return '"'+String(value??'').replace(/"/g,'""')+'"';}
 root.ObservatoryModel={observation,commonYear,csvCell};
})(globalThis);
