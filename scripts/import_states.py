import json,re,hashlib,datetime
from pathlib import Path
from openpyxl import load_workbook
P=Path('data/sources');pages=json.loads((P/'mpi2023-pages.json').read_text())
# Table 1 uses one row per state; preserve published changes rather than recalculate rounded endpoints.
rows=[]
for line in pages[351].splitlines():
 m=re.match(r'^(.+?)\s+(-?\d+\.\d+%.*)$',line)
 if m:
  vals=[float(x) for x in re.findall(r'-?\d+\.\d+',m[2])]
  if len(vals)==9:rows.append((m[1].strip(),vals))
assert len(rows)==37,len(rows)
coords={'Andhra Pradesh':[16.51,80.52],'Arunachal Pradesh':[27.10,93.62],'Assam':[26.14,91.74],'Bihar':[25.61,85.14],'Chhattisgarh':[21.25,81.63],'Goa':[15.49,73.83],'Gujarat':[23.22,72.65],'Haryana':[29.69,76.98],'Himachal Pradesh':[31.10,77.17],'Jharkhand':[23.34,85.31],'Karnataka':[12.97,77.59],'Kerala':[8.52,76.94],'Madhya Pradesh':[23.26,77.41],'Maharashtra':[19.08,72.88],'Manipur':[24.82,93.94],'Meghalaya':[25.58,91.88],'Mizoram':[23.73,92.72],'Nagaland':[25.67,94.11],'Odisha':[20.30,85.82],'Punjab':[30.90,75.86],'Rajasthan':[26.91,75.79],'Sikkim':[27.33,88.61],'Tamil Nadu':[13.08,80.27],'Telangana':[17.39,78.49],'Tripura':[23.83,91.29],'Uttar Pradesh':[26.85,80.95],'Uttarakhand':[30.32,78.03],'West Bengal':[22.57,88.36],'Andaman & Nicobar Islands':[11.67,92.74],'Chandigarh':[30.73,76.78],'Dadra & Nagar Haveli & Daman & Diu':[20.40,72.83],'Delhi':[28.61,77.21],'Jammu & Kashmir':[34.08,74.80],'Ladakh':[34.15,77.58],'Lakshadweep':[10.57,72.64],'Puducherry':[11.94,79.81]}
labels=['Nutrition deprivation','Child & adolescent mortality deprivation','Maternal health deprivation','Years of schooling deprivation','School attendance deprivation','Cooking fuel deprivation','Sanitation deprivation','Drinking water deprivation','Electricity deprivation','Housing deprivation','Asset deprivation','Bank account deprivation']
states=[]
for idx,(name,v) in enumerate(rows):
 if name=='India':continue
 assert name in coords,name
 indicators=[]
 for k,page in enumerate(pages[354:357]):
  line=next(l for l in page.splitlines() if l.startswith(name+' '))
  nums=[float(x) for x in re.findall(r'(-?\d+\.\d+)%',line)]
  assert len(nums)==12,(name,nums)
  for j in range(4):indicators.append({'name':labels[k*4+j],'baseline':nums[3*j],'value':nums[3*j+1],'change':nums[3*j+2],'pdfPage':355+k})
 states.append({'id':name,'name':name,'kind':'State' if idx<28 else 'Union territory','lat':coords[name][0],'lon':coords[name][1],'poverty':{'baseline':v[0],'value':v[1],'change':v[2],'intensity':v[4],'mpi':v[7]},'deprivations':indicators})
assert len(states)==36
lookup={s['name'].upper():s['name'] for s in states};lookup.update({'CHATTISGARH':'Chhattisgarh','UTTARAKHAND':'Uttarakhand','OTHER TERRITORY':'Other Territory'})
w=load_workbook(P/'eway2024.xlsx',data_only=True)
mat=list(w.worksheets[0].values);heads=mat[1];flows=[]
for row in mat[3:]:
 if row[1] not in lookup:continue
 destination=lookup[row[1]]
 for j,head in enumerate(heads):
  if head not in lookup:continue
  origin=lookup[head];value=row[j]
  if origin!=destination and isinstance(value,(int,float)):
   assert value>=0;flows.append({'from':origin,'to':destination,'value':value})
for si,direction in [(2,'outward'),(3,'inward')]:
 data=list(w.worksheets[si].values);headers=data[1]
 for s in states:
  sourceName=next((n for n,v in lookup.items() if v==s['name'] and n in headers),None)
  if sourceName is None:s[direction]=None;continue
  j=headers.index(sourceName);goods=[];total=None
  for row in data[2:]:
   if isinstance(row[1],str) and re.fullmatch(r'\d{1,2}',row[1]):
    if isinstance(row[j],(int,float)):goods.append({'code':row[1].zfill(2),'name':row[2],'value':row[j]})
   elif isinstance(row[1],str) and 'VALUE' in row[1]:total=row[j]
  assert total is not None
  assert abs(sum(g['value'] for g in goods)-total)<.01
  mapped=sum(f['value'] for f in flows if f['from' if direction=='outward' else 'to']==s['name'])
  assert abs(mapped-total)<.01,(s['name'],direction,mapped,total)
  s[direction]={'total':total,'goods':sorted(goods,key=lambda g:g['value'],reverse=True)}
source={'mpi':'https://niti.gov.in/sites/default/files/2023-07/National-Multidimentional-Poverty-Index-2023-Final-17th-July.pdf','road':'https://www.dgciskol.gov.in/writereaddata/Downloads/Road_EwayBill_2023_24.xlsx','roadNotes':'https://www.dgciskol.gov.in/writereaddata/Downloads/20260116130259Draft_Final_report_23_24.pdf','export':'https://www.niti.gov.in/sites/default/files/2026-01/Export_Preparedness_Index_2024.pdf','tradeHome':'https://www.dgciskol.gov.in/pub_inland.aspx'}
# Link each available international-export state profile without substituting domestic goods for foreign exports.
epi=json.loads((P/'epi2024-pages.json').read_text())
for s in states:
 match=next((i+1 for i,t in enumerate(epi) if re.search(r'5\.\d+\.\d+\s+'+re.escape(s['name']),t)),None)
 s['internationalProfilePage']=match
out={'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'states':states,'flows':flows,'sources':source,'periods':{'human':'2019-21','baseline':'2015-16','trade':'2023-24'},'provenance':[{ 'file':n,'sha256':hashlib.sha256((P/n).read_bytes()).hexdigest()} for n in ['mpi2023.pdf','eway2024.xlsx','epi2024.pdf']]}
Path('data/states.json').write_text(json.dumps(out,ensure_ascii=True),encoding='utf-8')
print('Imported',len(states),'states/UTs,',len(flows),'directed all-goods links;',sum(s['outward'] is not None for s in states),'separate trade profiles')
