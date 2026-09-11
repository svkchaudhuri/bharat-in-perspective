import urllib.request,urllib.parse,zipfile
from pathlib import Path
u='https://www.dgciskol.gov.in/writereaddata/Downloads/202602271256048_Inter-Intra_state Movements of Goods By Air during 2024-25 (Quantity in Tonnes).zip'
p=Path('data/sources/rail2025.zip');p.write_bytes(urllib.request.urlopen(urllib.parse.quote(u,safe=':/'),timeout=120).read())
z=zipfile.ZipFile(p)
print('\n'.join(z.namelist()))
for name in z.namelist():
 if name.lower().endswith(('.xlsx','.xls','.pdf')):
  dest=p.parent/Path(name).name;dest.write_bytes(z.read(name))
