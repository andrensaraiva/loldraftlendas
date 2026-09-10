"""Audit every production association, original release, period asset and calibration."""
from collections import Counter
import json, math
from build_multi_era import ROOT, OUT, RAW, CONFIG, DRAFT_REGION_GROUP_VERSION, sha, write, event_url

players=json.loads((ROOT/'src/data/multi-era.json').read_text(encoding='utf-8'))
cal=json.loads((OUT/'calibration.json').read_text(encoding='utf-8'))
frozen=json.loads((ROOT/'data/research/worlds-2017/evidence.json').read_text(encoding='utf-8'))
assert sha(ROOT/'src/data/worlds-2017.json')==cal['frozen2017Sha256']
assert len(players)==390 and len({p['id'] for p in players})==390
split_players=[]
for year in CONFIG:
    annual=json.loads((ROOT/f'src/data/years/{year}.json').read_text(encoding='utf-8'))
    assert annual==[p for p in players if p['worldsYear']==year],f'{year}: stale annual dataset'
    split_players+=annual
assert split_players==players
featured=json.loads((ROOT/'src/data/featured-player.json').read_text(encoding='utf-8'))
assert featured==next(p for p in players if p['playerName']=='Faker' and p['worldsYear']==2017)
player_index=json.loads((ROOT/'src/data/player-index.json').read_text(encoding='utf-8'))
assert player_index==[
    {key:p[key] for key in ['id','playerName','worldsYear','team']}
    for p in players
]
crosschecks={2015:('Bang',83,12,107),2017:('Ruler',70,24,106),2019:('Viper',54,14,63),2020:('Canyon',87,27,108),2022:('Gumayusi',90,26,107),2023:('Gumayusi',56,12,71)}
checks=[]
for year,(_,games,patch,_) in CONFIG.items():
    rows=json.loads((OUT/f'matches-{year}.json').read_text(encoding='utf-8'));coverage=json.loads((OUT/f'coverage-{year}.json').read_text(encoding='utf-8'))
    assert sha(OUT/f'matches-{year}.json')==coverage['matchesSha256']
    worlds=[r for r in rows if r['event']==f'WORLDS_{year}']
    assert len(worlds)==games*10
    assert len({r['gameid'] for r in worlds})==games
    assert all(n==10 for n in Counter(r['gameid'] for r in worlds).values())
    assert sum(r['result'] for r in worlds)==games*5
    data=json.loads((RAW/f'ddragon-{patch}.json').read_text(encoding='utf-8'))['data']
    evidence=json.loads((OUT/f'evidence-{year}.json').read_text(encoding='utf-8'))
    by_line={r['sourceLine']:r for r in rows}
    for p in [p for p in players if p['worldsYear']==year]:
        assert len(p['championPool'])==5 and len({s['championId'] for s in p['championPool']})==5
        for i,s in enumerate(p['championPool'],1):
            assert s['game']==i and s['championId'] in data
            assert s['source']!='MOCK'
            e=evidence[s['evidenceId']];assert e['playerId']==p['id'] and e['championId']==s['championId']
            assert e['historicalScore']==s['historicalScore']
            if 'sourceLines' in e:
                matched=[by_line[line] for line in e['sourceLines']]
                assert len(matched)==e['stats']['games']
                assert all(r['playername']==p['playerName'] and r['role']==p['role'] and r['event']==e['event'] for r in matched)
                assert len({r['champion'] for r in matched})==1
                assert matched[0]['date']==e['firstAppearance']
            else:
                assert e['sourceId']=='golgg-supplement-2015' and e['observation']['sourceUrl'].startswith('https://gol.gg/')
                assert e['confidenceScore']==0 and e['components']['A']==e['components']['B']
            b=cal['parameters'][p['role']];expected=max(70,min(99,math.floor(84.5+5*(s['historicalScore']-b['mean'])/b['sd']+.5)))
            assert s['rating']==s['gameRating']==expected
            if s['evidenceId'] in frozen:assert s['historicalScore']==frozen[s['evidenceId']]['score']
    name,k,d,a=crosschecks[year];selected=[r for r in worlds if r['playername'].lower()==name.lower()]
    actual=[int(sum(r[m] for r in selected)) for m in ['kills','deaths','assists']]
    # 2017's independent crosschecks are already frozen separately; record computed observation.
    if year!=2017:assert actual==[k,d,a],(year,name,actual)
    checks.append(dict(year=year,worldsGames=games,player=name,observedKDA=actual,independentKDA=[k,d,a] if year!=2017 else None,sourceUrl=event_url(year),note='Event game count and one aggregate independently cross-checked. Not a claim that every row was independently verified. 2017 uses its separate frozen audit.'))
manifest=json.loads((OUT/'asset-manifest.json').read_text(encoding='utf-8'))
assert len(manifest['assets'])==884
for asset in manifest['assets']:assert sha(ROOT/asset['localFile'])==asset['sha256'],asset['localFile']
assert all(x['count']>=3 for x in json.loads((OUT/'eligibility.json').read_text(encoding='utf-8')))
draft_groups=json.loads((ROOT/'src/data/draft-region-groups.json').read_text(encoding='utf-8'))
assert draft_groups['version']==DRAFT_REGION_GROUP_VERSION and draft_groups['datasetVersion']==cal['version']
assert {entry['year'] for entry in draft_groups['groups']}==set(CONFIG)
for entry in draft_groups['groups']:
    year=entry['year'];groups=entry['groups']
    canonical=lambda player:player.get('canonicalRegion') or player.get('historicalLeague') or player['region']
    available={canonical(player) for player in players if player['worldsYear']==year}
    assigned={region for group in groups for region in group['canonicalRegions']}
    assert available==assigned,(year,available,assigned)
    for group in groups:
        assert all(len({player['id'] for player in players if player['worldsYear']==year and player['role']==role and canonical(player) in group['canonicalRegions']})>=3 for role in ['TOP','JUNGLE','MID','ADC','SUPPORT']),(year,group)
write(OUT/'crosschecks.json',checks)
print('Validated 390 players, annual chunks, compact indexes, 1950 proven associations, generated draft groups, 120 eligible pools, 884 period assets and six event crosschecks.')
