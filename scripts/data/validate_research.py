"""Independent checks of source coverage, raw mirror, observed facts and deterministic outputs."""
import csv, json, math
from datetime import datetime
from build_worlds_2017 import OUT, RAW, ROLES, write

def read(file):
    return json.loads((OUT/file).read_text(encoding='utf-8'))

checks = read('crosschecks.json')
players = read('player-stats.json')
champions = read('player-champion-stats.json')
differences = []
for p, games, wins, kda, dpm, kp in checks['players']:
    actual = next(r for r in players if r['event']=='WORLDS_2017' and r['player']==p)
    for field, expected, tolerance in [('games',games,0), ('wins',wins,0), ('kda',kda,.06), ('dpm',dpm,1), ('kp',kp,.001)]:
        if abs(actual[field]-expected) > tolerance:
            differences.append(dict(player=p, field=field, expected=expected, actual=actual[field]))
for expected in checks['champions']:
    actual = next(r for r in champions if all(r[k]==expected[k] for k in ['event','player','champion']))
    for field in ['games','wins','kda']:
        if abs(actual[field]-expected[field]) > (.06 if field=='kda' else 0):
            differences.append(dict(player=expected['player'],champion=expected['champion'],field=field,expected=expected[field],actual=actual[field]))
rows = [r for r in read('matches.json') if r['event']=='WORLDS_2017']
mirror = {}
with (RAW/'oe-worlds-2017-mirror.csv').open(encoding='utf-8-sig',newline='') as f:
    for r in csv.DictReader(f):
        if r['position']=='team': continue
        d = datetime.strptime(r['date'], '%m/%d/%Y %H:%M')
        if d >= datetime(2017,10,5):
            mirror[(r['gameid'],r['side'],ROLES[r['position']])]=r
assert len(mirror)==800
mirror_differences=[]
aliases=set()
team_aliases=set()
for r in rows:
    other=mirror[(r['gameid'],r['side'],r['role'])]
    if r['playername']!=other['playername']: aliases.add((r['playername'],other['playername']))
    if r['teamname']!=other['teamname']: team_aliases.add((r['teamname'],other['teamname']))
    for k in ['champion','side']:
        if r[k]!=other[k]: mirror_differences.append([r['gameid'],r['playername'],k])
    for k in ['result','kills','deaths','assists','dpm','damageshare','golddiffat15','csdiffat15','xpdiffat15']:
        if not math.isclose(r[k],float(other[k]),rel_tol=1e-7,abs_tol=1e-7):
            mirror_differences.append([r['gameid'],r['playername'],k,r[k],other[k]])
result=dict(playerFactsChecked=len(checks['players'])*6, championFactsChecked=len(checks['champions'])*3,
            golggDifferences=differences, mirrorPlayerRows=800, mirrorDifferences=mirror_differences, playerAliases=sorted(aliases), teamAliases=sorted(team_aliases))
write(OUT/'validation.json',result)
print(json.dumps(result))
assert not differences and not mirror_differences
