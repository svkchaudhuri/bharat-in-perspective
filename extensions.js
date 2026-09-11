window.createObservatoryExtensions=function({D,state,obs,num,esc,link,selectMetric,chosen}){
 const $=id=>document.getElementById(id),charts={};let selectedGoal=null;
 const get=id=>D.indicators.find(i=>i.id===id);
 const colors=['#edaa62','#68d1be','#7dafe8','#ad99e8','#f08c9e','#ddd080','#77bc9d'];
 const sign=n=>(n>0?'+':'')+num(n);
 const summary=(label,value,sub)=>`<article class="summary-card"><span class="micro">${esc(label)}</span><b>${esc(value)}</b><small>${esc(sub)}</small></article>`;
 function card(id){const i=get(id);if(!i)return '';const o=obs(i,state.focus);return `<article class="library-card"><div class="eyebrow">${esc(i.category)}</div><h3>${esc(i.name)}</h3><div class="special-number">${o?num(o.value):'Not available'}</div><p>${esc(i.unit)} · ${o?o.year:'No observation for the selected period'}</p>${o?.low!==undefined&&o?.low!==null?`<div class="interval">95% interval ${num(o.low)}–${num(o.high)} · three-year average</div>`:''}<button data-explore="${i.id}">Explore series ↗</button></article>`;}
 function bind(){document.querySelectorAll('[data-explore]').forEach(b=>b.onclick=()=>selectMetric(b.dataset.explore));}
 function chart(id,type,labels,datasets,extra={}){if(!window.Chart)return;charts[id]?.destroy();const css=getComputedStyle(document.body);charts[id]=new Chart($(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:datasets.length>1,position:'bottom',labels:{boxWidth:8,font:{size:10}}}},scales:{x:{grid:{color:css.getPropertyValue('--line')},ticks:{color:css.getPropertyValue('--muted')}},y:{grid:{color:css.getPropertyValue('--line')},ticks:{color:css.getPropertyValue('--muted')}}}},...extra});}
 function drawLine(id,rows,label,color='#edaa62'){const sorted=[...rows].sort((a,b)=>a.year-b.year);chart(id,'line',sorted.map(o=>o.year),[{label,data:sorted.map(o=>o.value),borderColor:color,pointRadius:2,tension:0}]);}
 function prosperity(){
  $('hdro-cards').innerHTML=['HDRO_HDI','HDRO_IHDI','HDRO_LOSS','HDRO_INEQ_INC','HDRO_INEQ_EDU','HDRO_INEQ_LE','HDRO_GDI','HDRO_HDI_F','HDRO_HDI_M'].map(card).join('');
  const h=get('HDRO_HDI'),a=h&&obs(h,state.focus),b=get('HDRO_IHDI')&&obs(get('HDRO_IHDI'),state.focus);
  $('hdro-context').textContent=a&&b&&a.year===b.year?`In ${a.year}, HDI is ${num(a.value)} and inequality-adjusted HDI is ${num(b.value)}: a ${(100*(1-b.value/a.value)).toFixed(1)}% loss in measured human development. This discounts unequal health, education and income outcomes; it is not an adjusted GDP or a growth rate.`:'Choose a year with both HDI and IHDI to compare the inequality adjustment.';

  $('prosperity-cards').innerHTML=['SI.POV.GINI','DERIVED_PALMA','DERIVED_BOTTOM40_MEAN','SI.SPR.PC40.ZG','DERIVED_PREMIUM','DERIVED_HDI_LOSS'].map(card).join('');
  const i=get('DERIVED_BOTTOM40'),o=obs(i,state.focus),ratio=obs(get('DERIVED_BOTTOM40_MEAN'),state.focus);
  $('prosperity-summary').textContent=o?`In ${o.year}, the bottom 40% received ${num(o.value)}% of measured household income or consumption. Their group mean was ${num(ratio?.value)}% of the national survey mean. ${state.focus==='IND'?'India uses consumption here; this is not an income or wealth share.':''}`:'No matched distribution observations for this period.';
  const rows=i.observations.filter(o=>o.country===state.focus);drawLine('distribution-chart',rows,'Bottom 40% share (%)');
 }
 function planet(){$('planet-cards').innerHTML=['HDRO_PHDI','HDRO_DIFF_HDI_PHDI','HDRO_MF','WHR_LIFE','EN.GHG.CO2.PC.CE.AR5','EN.ATM.PM25.MC.M3','SH.H2O.SMDW.ZS','SH.STA.SMSS.ZS','EG.FEC.RNEW.ZS'].map(card).join('');}
 const status={green:'SDG achieved',yellow:'Challenges remain',orange:'Significant challenges',red:'Major challenges',grey:'Data unavailable'};
 const trends={'↑':'On track or maintaining achievement','➚':'Moderately improving','→':'Stagnating','↓':'Decreasing'};
 const statusColor={green:'#77bc9d',yellow:'#ddd080',orange:'#edaa62',red:'#f08c9e',grey:'#a1afbe'};
 function sdg(){
  const c=D.editions.sdg.find(c=>c.country===state.focus);if(!c){$('sdg-title').textContent='SDG country data unavailable';return;}
  $('sdg-title').textContent=D.countries.find(c=>c.id===state.focus).name+"'s SDG progress";
  const history=c.history.filter(o=>o.year>=2015).sort((a,b)=>a.year-b.year),base=history.find(o=>o.year===2015),latest=history.at(-1);
  $('sdg-summary').innerHTML=summary('2026 report score',num(c.score),'Report assessment · underlying years vary')+summary('2026 report rank',String(c.rank),'SDSN assessment · not an official UN ranking')+summary('Change since 2015',base&&latest?sign(latest.value-base.value)+' points':'Not available',`Backdated series: 2015–${latest?.year??'—'}`)+summary('Latest backdated score',latest?num(latest.value):'Not available',`Reference year ${latest?.year??'—'} · same edition`);
  drawLine('sdg-chart',history,'Backdated SDG Index');
  $('sdg-history').innerHTML='<table><thead><tr><th>Year</th><th>Backdated score</th></tr></thead><tbody>'+history.map(o=>`<tr><td>${o.year}</td><td>${num(o.value)}</td></tr>`).join('')+'</tbody></table>';
  $('sdg-goals').innerHTML=c.goals.map(g=>{const h=[...g.history].sort((a,b)=>a.year-b.year),last=h.at(-1),start=h.find(o=>o.year===2015),delta=last&&start?last.value-start.value:null;return `<button class="goal-card" data-goal="${g.number}" style="--goal-color:${statusColor[g.status]||statusColor.grey}"><span class="goal-number">GOAL ${g.number}</span><h3>${esc(g.name)}</h3><span class="goal-score">${last?num(last.value):'—'} <small class="micro">/100</small></span><span class="goal-caption">Backdated ${last?.year??'—'} · ${delta===null?'No 2015 baseline':sign(delta)+' points since 2015'}</span><span class="goal-caption">2026: ${esc(status[g.status]||'Data unavailable')}</span><span class="goal-caption">${esc(trends[g.trend]||'Trend unavailable')} ↗</span></button>`;}).join('');
  $('sdg-goals').querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedGoal=Number(b.dataset.goal);goalDetail(c);$('sdg-detail').scrollIntoView({behavior:'smooth',block:'start'});});
  if(selectedGoal)goalDetail(c);
 }
 function safeLink(url,label){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))return esc(label);return link(u.href,label);}catch{return esc(label);}}
 function goalDetail(c){const g=c.goals.find(g=>g.number===selectedGoal);if(!g)return;
  $('sdg-detail').innerHTML=`<div class="eyebrow accent">GOAL ${g.number}</div><h3>${esc(g.name)}</h3><p class="micro">Publisher's 2026 indicator assessment. Some inputs are projections or estimates. Source years, definitions and imputation flags below are retained from the workbook. Blanks are not zero.</p><div class="table-wrap"><table class="compact-table"><thead><tr><th>Indicator</th><th>Value</th><th>Year</th><th>Imputed flag</th><th>Source and definition</th></tr></thead><tbody>${g.indicators.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.value===null?'Not available':num(i.value)}</td><td>${esc(i.year??'—')}</td><td>${esc(i.imputed??'Not flagged')}</td><td>${safeLink(i.url,i.source||'Source unavailable')}<details><summary>Definition</summary>${esc(i.definition||'Not supplied')}</details></td></tr>`).join('')}</tbody></table></div>`;
 }
 function research(){const r=D.editions.research,key=$('research-breakdown').value,b=r[key];
  const title={disciplines:'R&D personnel by discipline',sectors:'R&D expenditure by institutional sector',states:'R&D expenditure by state government'}[key];
  $('research-title').textContent=title;
  $('research-note').textContent=`${b.reference} · ${b.unit}. ${b.exclusion||'Disjoint institutional and industrial categories; includes both public and private higher education. Shares use the reported national total.'}`;
  const rows=[...b.rows].sort((a,b)=>b.value-a.value);
  $('research-chart').parentElement.classList.toggle('states',key==='states');
  chart('research-chart','bar',rows.map(r=>r.name),[{label:b.unit,data:rows.map(r=>r.value),backgroundColor:rows.map((_,n)=>colors[n%colors.length]),borderRadius:3}],{options:{responsive:true,maintainAspectRatio:false,animation:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{callback:v=>num(v)}},y:{ticks:{font:{size:10}}}}}});
  $('research-table').innerHTML=`<table><thead><tr><th>Category</th><th>${esc(b.unit)}</th><th>% of table total</th>${key==='disciplines'?'<th>Women</th><th>Men</th>':''}</tr></thead><tbody>${rows.map(o=>`<tr><td>${esc(o.name)}</td><td>${num(o.value)}</td><td>${num(o.value/b.total*100)}%</td>${key==='disciplines'?`<td>${num(o.female)}</td><td>${num(o.male)}</td>`:''}</tr>`).join('')}<tr><th>Total</th><th>${num(b.total)}</th><th>100%</th>${key==='disciplines'?'<th>61,122</th><th>207,501</th>':''}</tr></tbody></table>`;
  $('research-source').innerHTML=link(r.url+'#page='+b.pdfPage,`DST 2025–26, Table ${b.table}, PDF page ${b.pdfPage} [9]`)+` · Source retrieved ${esc(new Date(r.retrievedAt).toLocaleDateString())}. Numbers reflect the reference period, not 2026.`;
  $('research-links').innerHTML=['GB.XPD.RSDV.GD.ZS','SP.POP.SCIE.RD.P6','SP.POP.TECH.RD.P6','IP.JRN.ARTC.SC','IP.PAT.RESD'].map(id=>{const i=get(id);return `<article class="library-card"><h3>${esc(i.name)}</h3><p>${esc(i.unit)}</p><button data-explore="${id}">Compare countries ↗</button></article>`;}).join('');
  $('research-export').onclick=()=>{const cells=window.ObservatoryModel.csvCell;const data=[['category','value','unit','share_percent','reference','source','table','exclusion'],...rows.map(o=>[o.name,o.value,b.unit,o.value/b.total*100,b.reference,r.url,b.table,b.exclusion||''])];const blob=new Blob(['\uFEFF'+data.map(r=>r.map(cells).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`india-research-${key}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
 }
 $('research-breakdown').onchange=()=>{research();bind();};
 function render(){if(!D.editions)return;if(state.view==='prosperity')prosperity();if(state.view==='planet')planet();if(state.view==='sdg')sdg();if(state.view==='research')research();bind();}
 return {render};
};



