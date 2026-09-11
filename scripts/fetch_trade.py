import urllib.request,concurrent.futures,json
from pathlib import Path
from pypdf import PdfReader
import re,html
base='https://www.dgciskol.gov.in/'
page=urllib.request.urlopen(base+'pub_inland.aspx',timeout=60).read().decode('utf-8')
for href,label in re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',page,re.S):
 if any(x in label.lower() for x in ['2024-25','excle']):print(re.sub('<[^>]+>','',label),html.unescape(href))
items={'eway2024.xlsx':base+'writereaddata/Downloads/Road_EwayBill_2023_24.xlsx','eway2024.pdf':base+'writereaddata/Downloads/20260116130259Draft_Final_report_23_24.pdf'}
def get(item):
 n,u=item;p=Path('data/sources')/n;p.write_bytes(urllib.request.urlopen(u,timeout=120).read());print(n,p.stat().st_size)
 if n.endswith('.pdf'):(p.parent/(p.stem+'-pages.json')).write_text(json.dumps([x.extract_text() for x in PdfReader(p).pages]),encoding='utf-8')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(get,items.items()))
