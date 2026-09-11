import urllib.request,concurrent.futures
from pathlib import Path
from pypdf import PdfReader
sources={'mpi2023':'https://niti.gov.in/sites/default/files/2023-07/National-Multidimentional-Poverty-Index-2023-Final-17th-July.pdf','epi2024':'https://www.niti.gov.in/sites/default/files/2026-01/Export_Preparedness_Index_2024.pdf','interstate2017':'https://www.indiabudget.gov.in/budget2017-2018/es2016-17/echap11.pdf'}
def job(item):
 name,url=item;p=Path('data/sources')/(name+'.pdf')
 if not p.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=90) as r:p.write_bytes(r.read())
 pages=[page.extract_text() or '' for page in PdfReader(p).pages]
 import json
 (p.parent/(name+'-pages.json')).write_text(json.dumps(pages),encoding='utf-8');print(name,len(pages))
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(job,sources.items()))
