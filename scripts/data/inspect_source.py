import csv, collections, json, sys
from datetime import datetime
path = sys.argv[1] if len(sys.argv)>1 else 'data/research/worlds-2017/raw/oe-worlds-2017-mirror.csv'
with open(path,encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
print('Rows',len(rows),'Leagues',collections.Counter(r['league'] for r in rows))
def date(r):
    for fmt in ('%m/%d/%Y %H:%M','%Y-%m-%d %H:%M:%S','%Y-%m-%d %H:%M'):
        try:return datetime.strptime(r['date'],fmt)
        except ValueError:pass
    raise ValueError(r['date'])
worlds=[r for r in rows if r['league'] in ('WCS','WLDs') and r['position']!='team' and date(r)>=datetime(2017,10,5)]
print('Main event',len(worlds),'players',len(set(r['playername'] for r in worlds)),'matches',len(set(r['gameid'] for r in worlds)))
print('Teams',sorted(set(r['teamname'] for r in worlds)))
kr=[r for r in worlds if r['teamname'] in ('SK Telecom T1','Samsung Galaxy','Longzhu Gaming')]
for name in sorted(set(r['playername'] for r in kr)):
    rs=sorted([r for r in kr if r['playername']==name],key=lambda r:(date(r),int(r['game'])))
    first=list(dict.fromkeys(r['champion'] for r in rs))
    print(name,len(rs),'wins',sum(int(r['result']) for r in rs), 'first',first,'counts',dict(collections.Counter(r['champion'] for r in rs)))
print('Missing main metrics', {k:sum(not r.get(k) for r in worlds) for k in ['dpm','damageshare','golddiffat15','xpdiffat15','csdiffat15','kills','deaths','assists']})
