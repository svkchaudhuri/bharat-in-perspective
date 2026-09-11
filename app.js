(() => {
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=window.OBSERVATORY_DATA;
if(!D){$('snapshot-status').textContent='Data snapshot unavailable. Run npm run refresh in the project folder, then reload.';return;}
const {observation,commonYear,csvCell}=window.ObservatoryModel;
const state={focus:'IND',selected:new Set(['IND','SGP','JPN','CHN','USA','DNK','NOR','SWE']),metric:'SP.DYN.LE00.IN',period:'latest',view:'overview'};
let extension;
let charts={},eventData=null,eventTimer=null,land=null;
const currentYear=new Date().getFullYear();
const compact=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
const num=v=>v===null||v===undefined?'Not available':Math.abs(v)>=1e6?compact.format(v):new Intl.NumberFormat('en-US',{maximumFractionDigits:Math.abs(v)<1?3:Math.abs(v)<10?2:1}).format(v);
const date=s=>s?new Date(s).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Not available';
const chosen=()=>D.countries.filter(c=>state.selected.has(c.id));
const getMetric=()=>D.indicators.find(i=>i.id===state.metric);
function comparisonYear(i){return state.period==='common'?commonYear(i,chosen().map(c=>c.id)):state.period;}
function obs(i,c){const y=comparisonYear(i);return y===null?null:observation(i,c,y);}
function link(url,label){return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;}
const statusLabel=i=>i.status==='ok'?'Retrieved':i.status==='cached'?'Cached · last fetch failed':'Unavailable';
function renderChips(){
 $('countries').innerHTML=D.countries.map(c=>`<label class="country-chip"><input type="checkbox" value="${c.id}" ${state.selected.has(c.id)?'checked':''} ${c.id===state.focus?'disabled':''}><span class="dot" style="background:${c.color};margin:0"></span>${esc(c.name)}</label>`).join('');
 $('countries').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{el.checked?state.selected.add(el.value):state.selected.delete(el.value);render();}));
}
const sectionCopy={
 overview:['OVERVIEW','Progress, in context.','A clearer view of how India lives, grows and compares.'],
 indicators:['INDICATOR LIBRARY','Explore the evidence.','Search the full library and compare countries, years and definitions.'],
 prosperity:['SHARED PROSPERITY','Who shares in progress?','Look beyond national averages to inequality, gender and human development.'],
 planet:['PLANET & WELLBEING','Living well, within limits.','Life evaluation, clean air, water and the environmental cost of development.'],
 sdg:['SDG PROGRESS','The path to 2030.','Explore all 17 goals, changes over time and the indicators behind them.'],
 research:['RESEARCH LANDSCAPE','Where knowledge takes shape.','India’s research workforce, spending and institutional distribution.'],
 states:['STATES OF INDIA','Many states. Connected futures.','Explore human development, goods moving in and out, and state trading partners.'],
 events:['LIVE CONTEXT','A world in motion.','Weather models, near-real-time earthquakes and measured demographic change.'],
 sources:['SOURCES & METHODS','Know what the numbers mean.','Trace each measure to its source, observation year and limitations.']
};
function setView(view){
 if(!sectionCopy[view])view='overview';state.view=view;
 const [eyebrow,title,description]=sectionCopy[view];
 $('section-eyebrow').textContent=eyebrow;$('section-title').textContent=title;$('section-description').textContent=description;
 document.body.dataset.section=view;document.title=eyebrow+' | Bharat in Perspective';
 $('filters').classList.toggle('focus-only',view==='sdg');
 document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==view);
 document.querySelectorAll('.nav').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-current',b.dataset.view===view?'page':'false');});
 $('filters').hidden=['sources','events','research','states'].includes(view);$('export').hidden=!['overview','indicators'].includes(view);
 $('snapshot-status').parentElement.hidden=view!=='overview';
 if(view==='overview')renderCharts();
 if(view==='events'){if(!eventData)loadEvents();if(!eventTimer)eventTimer=setInterval(loadEvents,300000);}else{clearInterval(eventTimer);eventTimer=null;}
 extension?.render();window.dispatchEvent(new CustomEvent('observatory:view',{detail:view}));
 const heading=$('section-title');heading.focus({preventScroll:true});
 document.querySelector('.intro').scrollIntoView({behavior:'instant',block:'start'});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$(view).animate([{opacity:.3,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}
function renderKpis(){
 const ids=['NY.GDP.PCAP.PP.KD','UNDP_HDI','SP.DYN.LE00.IN','IHRSPAR2_C13','WHR_LIFE','EN.GHG.CO2.PC.CE.AR5','SI.POV.GINI','SDSN_INDEX'];
 $('focus-label').textContent=D.countries.find(c=>c.id===state.focus).name;
 $('kpis').innerHTML=ids.map(id=>{const i=D.indicators.find(x=>x.id===id),o=obs(i,state.focus);return `<button class="kpi" data-metric="${id}" aria-label="Explore ${esc(i.name)}"><div class="kpi-label">${esc(i.name)}</div><div class="kpi-value">${o?num(o.value):'—'}</div><div class="kpi-unit">${esc(i.unit)}</div><div class="kpi-bottom"><span>${o?`${i.source==='WHR'?'Survey average '+(o.year-2)+'–'+o.year:'Observed '+o.year}${currentYear-o.year>3?' · older data':''}`:'No observation for this period'}${i.status==='cached'?' · cached':''}</span><span class="kpi-arrow">↗</span></div></button>`;}).join('');
 $('kpis').querySelectorAll('button').forEach(b=>b.onclick=()=>selectMetric(b.dataset.metric));
}
function selectMetric(id){state.metric=id;$('metric').value=id;setView('overview');render();document.querySelector('.explorer').scrollIntoView({behavior:'smooth',block:'start'});}
function renderMetric(){
 const i=getMetric(),year=comparisonYear(i),rows=chosen().map(c=>({c,o:obs(i,c.id)}));
 $('metric-title').textContent=i.name;$('unit').textContent=i.unit;
 $('metric-description').textContent=`${i.category} · ${i.direction==='context'?'Interpret in context':i.direction==='higher'?'Higher generally indicates a better outcome':'Lower generally indicates a better outcome'} · ${i.source==='WHR'?'World Happiness Report 2026':i.source==='SDSN'?'SDSN · SDR 2026':i.source==='Derived'?'Calculated from matched source observations':i.id.startsWith('HDRO_')?'UNDP HDRO API; edition unspecified':i.source==='UNDP'?'UNDP · HDR 2025 edition':i.source==='WHO'?'WHO · SPAR second edition':i.source===3?'Worldwide Governance Indicators':'World Development Indicators'}`;
 const available=rows.filter(r=>r.o),years=[...new Set(available.map(r=>r.o.year))];
 let note=state.period==='latest'?`Latest available observations. ${years.length>1?'Mixed years: '+Math.min(...years)+'–'+Math.max(...years)+'. Cross-country gaps may partly reflect timing.':years.length?'All available values are for '+years[0]+'.':'No observations available.'}`:state.period==='common'?(year?`Same-year comparison: ${year}. This is the latest year shared by every selected country for this indicator.`:'No common year exists for all selected countries. Choose fewer countries or switch to latest available.'):`Fixed-year comparison: ${state.period}. Missing observations are left blank.`;
 if(available.length<rows.length)note+=` Coverage: ${available.length}/${rows.length} selected countries.`;
 if(i.source==='WHR')note+=' Each observation is a three-year average ending in the labelled year; confidence intervals are in the provenance panel.';
 if(i.source==='SDSN')note+=' Backdated estimates from SDR 2026; this is not a UN-issued score.';
 if(i.category==='Shared prosperity'||i.id==='SI.POV.GINI')note+=' Income and consumption surveys differ. India uses consumption in its distribution estimates. Growth series refer to survey intervals, not single years.';
 if(i.source==='WHO')note+=' Self-reported preparedness, not contamination or illness rates; second edition only.';
 if(i.status!=='ok')note+=` Source ${statusLabel(i).toLowerCase()}.`;
 $('comparison-note').textContent=note;
 $('comparison-table').innerHTML=rows.map(({c,o})=>`<tr class="${c.id===state.focus?'focus-row':''}"><td><span class="dot" style="background:${c.color}"></span>${esc(c.name)}${c.id===state.focus?' · focus':''}</td><td>${o?num(o.value):'Not available'}</td><td>${o?o.year:'—'}</td><td class="${o&&currentYear-o.year>3?'age-old':''}">${o?`${currentYear-o.year} years${currentYear-o.year>3?' · older data':''}`:'—'}</td></tr>`).join('');
 $('definition-content').innerHTML=`<p><b>Official indicator:</b> ${esc(i.officialName||i.name)} (${esc(i.id)})</p><p>${esc(i.definition||'The source did not supply a definition in this response. Consult the original source documentation before interpreting this series.')}</p><p><b>Original provider:</b> ${esc(i.organisation||'Not available')}</p><p><b>Source dataset updated:</b> ${esc(i.sourceUpdated||'Not available')} · <b>Retrieved:</b> ${esc(date(i.retrievedAt))} · ${esc(statusLabel(i))}</p><p>${link(i.url,'Open indicator source ['+(i.source==='WHR'?7:i.source==='SDSN'?8:i.source==='Derived'?10:i.source==='UNDP'?2:i.source==='WHO'?3:1)+']')}${i.apiUrl?' · '+link(i.apiUrl,'Download original source data ['+(i.source==='WHR'?7:i.source==='SDSN'?8:i.source==='Derived'?10:i.source==='UNDP'?2:i.source==='WHO'?3:1)+']'):''}</p>${rows.filter(r=>r.o?.footnote).map(r=>`<p><b>${esc(r.c.name)} ${r.o.year}:</b> ${esc(r.o.footnote)}</p>`).join('')}<p>Historical lines retain missing years as gaps. The comparison-period control selects the comparison values; the history chart always shows the available series from the chosen start year.</p>`;
}
function renderCharts(){
 if(!window.Chart){$('chart-fallback').hidden=false;return;}
 const i=getMetric();if(!i)return;
 Object.values(charts).forEach(c=>c.destroy());charts={};
 const cs=getComputedStyle(document.body),text=cs.getPropertyValue('--muted').trim(),grid=cs.getPropertyValue('--line').trim();
 Chart.defaults.color=text;Chart.defaults.font.family='Segoe UI, Arial, sans-serif';Chart.defaults.font.size=10;
 const rows=chosen().map(c=>({c,o:obs(i,c.id)}));
 const plugins={legend:{display:false},tooltip:{callbacks:{label:ctx=>`${num(ctx.parsed.x)} ${i.unit} · ${rows[ctx.dataIndex].o?.year??'No observation'}`}}};
 charts.bars=new Chart($('bars'),{type:'bar',data:{labels:rows.map(r=>r.c.name),datasets:[{label:i.name,data:rows.map(r=>r.o?.value??null),backgroundColor:rows.map(r=>r.c.color+(r.c.id===state.focus?'':'99')),borderColor:rows.map(r=>r.c.color),borderWidth:1,borderRadius:3,barThickness:14}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:false,plugins,scales:{x:{beginAtZero:true,grid:{color:grid},ticks:{callback:v=>num(v)}},y:{grid:{display:false},ticks:{color:text}}}}});
 const start=Number($('start-year').value),series=i.observations.filter(o=>state.selected.has(o.country)&&o.year>=start),end=series.length?Math.max(...series.map(o=>o.year)):currentYear;
 const years=Array.from({length:Math.max(1,end-start+1)},(_,n)=>start+n);
 charts.trend=new Chart($('trend'),{type:'line',data:{labels:years,datasets:chosen().map(c=>({label:c.name,data:years.map(y=>observation(i,c.id,y)?.value??null),borderColor:c.color,backgroundColor:c.color,borderWidth:c.id===state.focus?3:1.5,pointRadius:c.id===state.focus?2:1,pointHoverRadius:5,tension:0,spanGaps:false}))},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,padding:10,font:{size:9}}},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${num(ctx.parsed.y)} ${i.unit}`}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{grid:{color:grid},ticks:{callback:v=>num(v)}}}}});
}
function renderLibrary(){
 const q=$('search').value.toLowerCase().trim(),cat=$('category').value;
 const matches=i=>(cat==='All categories'||i.category===cat)&&`${i.name} ${i.category} ${i.id||''}`.toLowerCase().includes(q);
 const connected=D.indicators.filter(matches),pending=D.pending.filter(matches);
 $('library-count').textContent=`${connected.length} series · ${pending.length} planned integrations`;
 $('library').innerHTML=connected.map(i=>{const o=obs(i,state.focus),coverage=new Set(i.observations.map(o=>o.country)).size;return `<article class="library-card"><div class="eyebrow">${esc(i.category)}</div><h3>${esc(i.name)}</h3><div class="number">${o?num(o.value):'—'}</div><p>${esc(i.unit)} · ${o?o.year:'No observation for this period'}<br>${coverage}/${D.countries.length} countries with history · ${esc(statusLabel(i))}</p><button data-metric="${i.id}">Explore series ↗</button></article>`;}).join('')+pending.map(i=>`<article class="library-card pending"><div class="eyebrow">${esc(i.category)}</div><h3>${esc(i.name)}</h3><span class="badge">NOT CONNECTED</span><p>${esc(i.reason)}</p><p>${link(i.url,i.source+' source ↗')}</p></article>`).join('');
 if(!connected.length&&!pending.length)$('library').innerHTML='<p>No indicators match these filters.</p>';
 $('library').querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>selectMetric(b.dataset.metric));
}
function render(){renderKpis();renderMetric();renderLibrary();if(state.view==='overview')renderCharts();extension?.render();}
function exportCSV(){
 const list=state.view==='indicators'?D.indicators.filter(i=>($('category').value==='All categories'||i.category===$('category').value)&&`${i.name} ${i.category} ${i.id}`.toLowerCase().includes($('search').value.toLowerCase().trim())):[getMetric()];
 const rows=[['indicator','official_name','code','country','iso3','comparison_period','value','observation_year','unit','source','retrieved_at','source_status','footnote']];
 for(const i of list)for(const c of chosen()){const o=obs(i,c.id);rows.push([i.name,i.officialName,i.id,c.name,c.id,state.period,o?.value??'',o?.year??'',i.unit,i.url,i.retrievedAt,i.status,o?.footnote??'']);}
 const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`india-world-comparison-${state.period}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
async function loadEvents(){
 $('refresh-events').disabled=true;$('event-status').textContent='Retrieving the official USGS feed…';
 try{
  const url=location.protocol==='file:'?'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson':'/api/events';
  const response=await fetch(url,{signal:AbortSignal.timeout(22000)});if(!response.ok)throw Error(`HTTP ${response.status}`);const payload=await response.json();if(!Array.isArray(payload.features))throw Error('Invalid feed');eventData={...payload,retrievedAt:payload.retrievedAt||new Date().toISOString()};
  if(!land){try{const r=await fetch('vendor/land.json');if(r.ok)land=await r.json();}catch{}}
  renderEvents();
 }catch(e){$('event-status').textContent=`USGS unavailable: ${e.message}. ${eventData?'Showing the last successful response from '+date(eventData.retrievedAt)+'.':'No substitute events are shown. Start the local server if viewing as a file.'}`;}
 finally{$('refresh-events').disabled=false;}
}
function renderEvents(){
 if(!eventData)return;
 const boxes={asia:[25,180,-10,80],india:[67,98,5,38],europe:[-25,45,34,72],america:[-170,-50,5,85]},box=boxes[$('event-region').value];
 const features=eventData.features.filter(f=>{const [x,y]=f.geometry?.coordinates||[];return Number.isFinite(x)&&Number.isFinite(y)&&(!box||(x>=box[0]&&x<=box[1]&&y>=box[2]&&y<=box[3]));}).sort((a,b)=>b.properties.time-a.properties.time);
 const stale=Date.now()-Number(eventData.metadata?.generated)>15*60000;
 $('event-status').textContent=`${eventData.status==='cached'?'Cached · last request failed':stale?'Feed timestamp is older than 15 minutes':'Connected to USGS'} · ${features.length} events in this region · Feed generated ${date(eventData.metadata?.generated)} · Retrieved ${date(eventData.retrievedAt)}`;
 const project=([x,y])=>[(x+180)/360*1000,(90-y)/180*500];
 let geometry='';
 if(land)for(const f of land.features){const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const polygon of polygons){geometry+=`<path d="${polygon.map(ring=>ring.map((p,n)=>`${n?'L':'M'}${project(p).map(v=>v.toFixed(1)).join(',')}`).join(' ')+'Z').join(' ')}" fill="var(--panel2)" stroke="var(--line)" stroke-width="0.6"/>`;}}
 const grid=Array.from({length:11},(_,n)=>`<path d="M${n*100},0V500" stroke="var(--line)" stroke-width=".5"/>`).join('')+Array.from({length:6},(_,n)=>`<path d="M0,${n*100}H1000" stroke="var(--line)" stroke-width=".5"/>`).join('');
 const safeURL=u=>{try{const parsed=new URL(u);return parsed.protocol==='https:'&&parsed.hostname==='earthquake.usgs.gov'?u:'https://earthquake.usgs.gov/';}catch{return 'https://earthquake.usgs.gov/';}};
 $('event-map').innerHTML=grid+geometry+features.map(f=>{const [x,y]=project(f.geometry.coordinates);return `<a href="${esc(safeURL(f.properties.url))}" target="_blank" rel="noopener"><circle cx="${x}" cy="${y}" r="${Math.max(3,(f.properties.mag||4)-1)}" fill="#edaa62" fill-opacity=".65" stroke="#edaa62"><title>${esc(f.properties.title)}</title></circle></a>`;}).join('');
 $('event-list').innerHTML=features.length?features.slice(0,30).map(f=>`<article class="event-card"><span class="event-mag">M ${num(f.properties.mag)}</span><h3>${link(safeURL(f.properties.url),f.properties.place||f.properties.title)}</h3><p>${esc(date(f.properties.time))}<br>Depth: ${num(f.geometry.coordinates[2])} km · USGS</p></article>`).join(''):'<div class="notice">No magnitude 4.5+ events reported in this geographic box in the feed period.</div>';
 if(features.length>30)$('event-list').insertAdjacentHTML('beforeend',`<p class="micro">Showing the 30 most recent of ${features.length} events. All are plotted on the map.</p>`);
}
$('focus').innerHTML=D.countries.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
const categories=[...new Set([...D.indicators,...D.pending].map(i=>i.category))];
$('category').innerHTML+=[...categories].map(c=>`<option>${esc(c)}</option>`).join('');
$('metric').innerHTML=categories.map(c=>`<optgroup label="${esc(c)}">${D.indicators.filter(i=>i.category===c).map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('')}</optgroup>`).join('');$('metric').value=state.metric;
const maxYear=Math.max(...D.indicators.flatMap(i=>i.observations.map(o=>o.year)));
$('period').innerHTML+=Array.from({length:maxYear-1999},(_,n)=>`<option value="${maxYear-n}">${maxYear-n}</option>`).join('');
$('focus').onchange=e=>{state.focus=e.target.value;state.selected.add(state.focus);renderChips();render();};
$('period').onchange=e=>{state.period=e.target.value;render();};$('metric').onchange=e=>{state.metric=e.target.value;render();};$('start-year').onchange=renderCharts;
$('search').oninput=renderLibrary;$('category').onchange=renderLibrary;
$('export').onclick=exportCSV;
$('export-history').onclick=()=>{
 const i=getMetric(),start=Number($('start-year').value);
 const rows=[['indicator','code','country','iso3','year','value','unit','source','retrieved_at','source_status','footnote']];
 for(const c of chosen())for(const o of i.observations.filter(o=>o.country===c.id&&o.year>=start).sort((a,b)=>a.year-b.year))rows.push([i.name,i.id,c.name,c.id,o.year,o.value,i.unit,i.url,i.retrievedAt,i.status,o.footnote]);
 const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`india-world-history-${i.id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
};$('refresh-events').onclick=loadEvents;$('event-region').onchange=renderEvents;
$('theme').onclick=()=>{document.body.classList.toggle('light');$('theme').textContent=document.body.classList.contains('light')?'Dark theme':'Light theme';if(state.view==='overview')renderCharts();extension?.render();};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
for(const b of document.querySelectorAll('[data-open]'))b.onclick=()=>setView(b.dataset.open);
for(const b of document.querySelectorAll('[data-preset]'))b.onclick=()=>{const extra=b.dataset.preset==='core'?[]:b.dataset.preset==='scandinavia'?['DNK','NOR','SWE']:['DNK','NOR','SWE','FIN','ISL'];state.selected=new Set(['IND','SGP','JPN','CHN','USA',state.focus,...extra]);renderChips();render();};
const ok=D.indicators.filter(i=>i.status==='ok').length,withData=D.indicators.filter(i=>i.observations.length).length;
$('snapshot-status').textContent=`Snapshot refresh completed ${date(D.updatedAt)} · ${D.indicators.filter(i=>i.source!=='Derived'&&i.status==='ok').length} source series ready · ${D.indicators.filter(i=>i.source==='Derived').length} calculated measures`;
$('sidebar-coverage').textContent=`${withData} series with data · ${D.countries.length} economies · ${categories.length} dimensions`;
$('source-health').innerHTML='<table><thead><tr><th>Indicator</th><th>State</th><th>Source updated</th><th>Retrieved</th></tr></thead><tbody>'+D.indicators.map(i=>`<tr><td>${link(i.url,i.name)}</td><td>${esc(statusLabel(i))}${i.error?': '+esc(i.error):''}</td><td>${esc(i.sourceUpdated||'—')}</td><td>${esc(date(i.retrievedAt))}</td></tr>`).join('')+'</tbody></table>';
extension=window.createObservatoryExtensions({D,state,obs,num,esc,link,selectMetric,chosen});
renderChips();render();
})();









