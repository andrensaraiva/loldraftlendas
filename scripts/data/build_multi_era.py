"""Reproducible multi-era research. Original 2017 release is an immutable input.

Full CSVs are cached/ignored; compact normalized snapshots are committed for offline builds.
Use --year and --region for inspection batches; production always calibrates the full release.
"""
from pathlib import Path
from collections import defaultdict, Counter
import argparse, csv, json, math, statistics as st, re, urllib.request
from build_worlds_2017 import ROOT, ROLES, NUMBERS, METRICS, WEIGHTS, aggregate, avg, write, sha

OUT = ROOT/'data/research/multi-era'
RAW = OUT/'raw'
VERSION = 'multi-era-v1.0.0'
CONFIG = {
 2015: ('10-01', 73, '5.18.1', {'LCK':['SK Telecom T1','ROX Tigers','KT Rolster'], 'LPL':['EDward Gaming','Invictus Gaming','LGD Gaming'], 'EU LCS':['Fnatic','Origen','H2k-Gaming'], 'NA LCS':['Cloud9','Counter Logic Gaming','Team SoloMid']}),
 2017: ('10-05', 80, '7.18.1', {'LCK':['SK Telecom T1','Samsung Galaxy','Longzhu Gaming'], 'LPL':['Royal Never Give Up','Team WE','EDward Gaming'], 'EU LCS':['Fnatic','G2 Esports','Misfits Gaming'], 'NA LCS':['Cloud9','Team SoloMid','Immortals']}),
 2019: ('10-12', 77, '9.19.1', {'LCK':['SK Telecom T1','Griffin','DAMWON Gaming'], 'LPL':['FunPlus Phoenix','Invictus Gaming','Royal Never Give Up'], 'LEC':['G2 Esports','Fnatic','Splyce'], 'LCS':['Team Liquid','Cloud9','Clutch Gaming']}),
 2020: ('10-03', 76, '10.19.1', {'LCK':['DAMWON Gaming','DRX','Gen.G'], 'LPL':['Top Esports','JD Gaming','Suning','LGD Gaming'], 'LEC':['G2 Esports','Fnatic','Rogue'], 'LCS':['Team SoloMid','Team Liquid','FlyQuest']}),
 2022: ('10-07', 80, '12.18.1', {'LCK':['Gen.G','T1','Dplus Kia','DRX'], 'LPL':['JD Gaming','Top Esports','EDward Gaming','Royal Never Give Up'], 'LEC':['Rogue','G2 Esports','Fnatic'], 'LCS':['Cloud9','100 Thieves','Evil Geniuses']}),
 2023: ('10-19', 79, '13.19.1', {'LCK':['Gen.G','T1','KT Rolster','Dplus Kia'], 'LPL':['JD Gaming','Bilibili Gaming','LNG Esports','Weibo Gaming'], 'LEC':['G2 Esports','Fnatic','MAD Lions KOI','Team BDS'], 'LCS':['NRG','Cloud9','Team Liquid']}),
}
SHORT = {'SK Telecom T1':'SKT','Samsung Galaxy':'SSG','Longzhu Gaming':'LZ','ROX Tigers':'KOO','KT Rolster':'KT','EDward Gaming':'EDG','Invictus Gaming':'IG','LGD Gaming':'LGD','Fnatic':'FNC','Origen':'OG','H2k-Gaming':'H2K','Cloud9':'C9','Counter Logic Gaming':'CLG','Team SoloMid':'TSM','Royal Never Give Up':'RNG','Team WE':'WE','G2 Esports':'G2','Misfits Gaming':'MSF','Immortals':'IMT','Griffin':'GRF','DAMWON Gaming':'DWG','FunPlus Phoenix':'FPX','Splyce':'SPY','Team Liquid':'TL','Clutch Gaming':'CG','Top Esports':'TES','JD Gaming':'JDG','Suning':'SN','FlyQuest':'FLY','Rogue':'RGE','Dplus Kia':'DK','Gen.G':'GEN','100 Thieves':'100T','Evil Geniuses':'EG','Bilibili Gaming':'BLG','LNG Esports':'LNG','Weibo Gaming':'WBG','MAD Lions KOI':'MAD','Team BDS':'BDS'}
ALIASES = {(2015,'ROX Tigers'):'KOO Tigers', (2022,'Dplus Kia'):'DWG KIA', (2023,'MAD Lions KOI'):'MAD Lions'}

def ingest(year, snapshot):
    target = OUT/f'matches-{year}.json'
    if snapshot or not (RAW/f'oe-{year}.csv').exists() and year != 2017:
        coverage=json.loads((OUT/f'coverage-{year}.json').read_text(encoding='utf-8'))
        assert sha(target)==coverage['matchesSha256'],f'{year}: normalized snapshot hash mismatch.'
        return json.loads(target.read_text(encoding='utf-8'))
    path = ROOT/f'data/research/worlds-2017/raw/oe-2017.csv' if year==2017 else RAW/f'oe-{year}.csv'
    manifest=ROOT/'data/research/worlds-2017/sources.json' if year==2017 else OUT/'downloads.json'
    if manifest.exists():
        source=json.loads(manifest.read_text(encoding='utf-8'))['oe-2017' if year==2017 else str(year)]
        assert sha(path)==source['sha256'],f'{year}: raw source hash mismatch.'
    start, _, _, regions = CONFIG[year]
    rows=[]
    with path.open(encoding='utf-8-sig',newline='') as f:
        for line,r in enumerate(csv.DictReader(f),2):
            if r['position'] not in ROLES: continue
            date=r['date']; league=r['league']; split=r['split']
            if year==2015 and league=='LTC': league='LCK'
            world=league in ('WCS','WLDs') and f'{year}-{start}'<=date<f'{year}-11-30'
            domestic=league in regions and date<f'{year}-{start}' and split in ('Summer','Spring','Winter','')
            msi=league=='MSI' or league=='WCS' and f'{year}-05-01'<=date<f'{year}-06-01'
            if not (world or domestic or msi):continue
            phase='WORLDS' if world else 'MSI' if msi else f'{league}_{split.upper() or "QUALIFIER"}'
            row={k:r.get(k,'') for k in ['gameid','date','champion','side','patch','url']}
            row.update(playername=r.get('playername',r.get('player')),teamname=r.get('teamname',r.get('team')))
            if row['teamname']=='TSM':row['teamname']='Team SoloMid'
            row.update({k:float(r[k]) if r.get(k) not in ('',None) else None for k in NUMBERS})
            row.update(event=f'{phase}_{year}',role=ROLES[r['position']],stage='main-event' if world else 'playoffs' if r['playoffs']=='1' else 'regular',sourceId=f'oe-{year}',sourceLine=line)
            rows.append(row)
    rows.sort(key=lambda r:(r['date'],r['gameid'],r['teamname'],r['role']))
    assert len({(r['gameid'],r['side'],r['role']) for r in rows})==len(rows)
    worlds=[r for r in rows if r['event']==f'WORLDS_{year}']
    assert len(worlds)==CONFIG[year][1]*10,(year,len(worlds))
    write(target,rows,True)
    return rows

def build_year(year, snapshot=False):
    rows=ingest(year,snapshot)
    patch=CONFIG[year][2]; cp=RAW/f'ddragon-{patch}.json'
    if not cp.exists():urllib.request.urlretrieve(f'https://ddragon.leagueoflegends.com/cdn/{patch}/data/en_US/champion.json',cp)
    champs=json.loads(cp.read_text(encoding='utf-8'))['data']
    names={c['name']:c['id'] for c in champs.values()};names.update({'Nunu & Willump':'Nunu','Wukong':'MonkeyKing',"Kai'Sa":'Kaisa',"K'Sante":'KSante','Renata Glasc':'Renata'})
    by_player,by_champ,by_role=defaultdict(list),defaultdict(list),defaultdict(list)
    for r in rows:
        base=(r['event'],r['role']);key=base+(r['teamname'],r['playername'])
        by_role[base].append(r);by_player[key].append(r);by_champ[key+(r['champion'],)].append(r)
    aggregates={k:aggregate(v) for k,v in by_player.items()}
    champ_aggs={k:aggregate(v) for k,v in by_champ.items()}
    adjusted=['dpm','damageshare','golddiffat15','csdiffat15','xpdiffat15'];offsets={}
    for base,rs in by_role.items():
        means={m:avg(r[m] for r in rs) for m in adjusted}
        for champion in sorted({r['champion'] for r in rs}):
            sub=[r for r in rs if r['champion']==champion]
            for m in adjusted:
                valid=[r[m] for r in sub if r[m] is not None]
                offsets[base+(champion,m)]=(avg(valid)-means[m])*len(valid)/(len(valid)+12) if valid and means[m] is not None else 0
    def features(rs):
        a=aggregate(rs)
        for m in adjusted:a[m]=avg(r[m]-offsets[(r['event'],r['role'],r['champion'],m)] for r in rs if r[m] is not None)
        return {m:a[m] for m in METRICS}
    pf={k:features(v) for k,v in by_player.items()};baselines={}
    for base in by_role:
        baselines[base]={}
        for m in METRICS:
            vals=[f[m] for k,f in pf.items() if k[:2]==base and f[m] is not None]
            baselines[base][m]={'mean':avg(vals),'sd':st.pstdev(vals) if vals else None,'players':len(vals)}
    def score(rs):
        base=(rs[0]['event'],rs[0]['role']);f=features(rs);norm={}
        for m,w in WEIGHTS[base[1]].items():
            b=baselines[base][m]
            if f[m] is not None and b['mean'] is not None:
                z=(f[m]-b['mean'])/b['sd'] if b['sd'] else 0
                norm[m]=50*(1+math.erf(max(-3,min(3,z))/math.sqrt(2)))
        coverage=sum(WEIGHTS[base[1]][m] for m in norm)
        return sum(WEIGHTS[base[1]][m]*v for m,v in norm.items())/coverage if coverage else 50,coverage
    players=[];evidence={};rosters=[];missing=[]
    frozen=json.loads((ROOT/'src/data/worlds-2017.json').read_text(encoding='utf-8'))
    frozen_ev=json.loads((ROOT/'data/research/worlds-2017/evidence.json').read_text(encoding='utf-8'))
    for league,teams in CONFIG[year][3].items():
        region={'EU LCS':'LEC','NA LCS':'LCS'}.get(league,league)
        for team in teams:
            for role in ROLES.values():
                candidates=sorted([(k,a) for k,a in aggregates.items() if k[:3]==(f'WORLDS_{year}',role,team)],key=lambda x:(-x[1]['games'],x[0][3]))
                assert candidates,(year,team,role)
                key,overall=candidates[0];player=key[3];short=SHORT.get(team,team)
                pid=f'{player.lower()}-{year}-{short.lower()}'
                for k,a in candidates:rosters.append(dict(player=k[3],team=ALIASES.get((year,team),team),rawTeam=team,role=role,region=region,historicalLeague=league,playable=k==key,games=a['games'],selection='Most main-event games; name breaks ties.'))
                selected=sorted([k for k in by_champ if k[:4]==key],key=lambda k:(-champ_aggs[k]['games'],champ_aggs[k]['firstAppearance'],k[-1]))[:5]
                selected.sort(key=lambda k:(champ_aggs[k]['firstAppearance'],k[-1]))
                for phase in [f'{league}_SUMMER',f'{league}_QUALIFIER','MSI',f'{league}_SPRING',f'{league}_WINTER']:
                    fallback=[k for k in by_champ if k[0]==f'{phase}_{year}' and k[1:4]==key[1:4] and k[-1] not in {s[-1] for s in selected}]
                    fallback.sort(key=lambda k:(-champ_aggs[k]['games'],-int(champ_aggs[k]['lastAppearance'][:10].replace('-','')),k[-1]))
                    selected+=fallback[:max(0,5-len(selected))]
                supplements = json.loads((OUT/'season-supplement-2015.json').read_text(encoding='utf-8'))['players'].get(player,[]) if year==2015 and league=='LPL' else []
                if len(selected)+len(supplements)<5:
                    missing.append(dict(playerId=pid,region=region,role=role,observed=len(selected),reason='Fewer than five documented unique champions in available Worlds/season records.'))
                    continue
                ar,ac=score(by_player[key]);A=50+overall['games']/(overall['games']+5)*ac*(ar-50)
                slots=[]
                fp=next((p for p in frozen if year==2017 and p['id']==pid),None)
                for i,ck in enumerate(selected,1):
                    rs=by_champ[ck];stats=champ_aggs[ck].copy();stats['sourceId']=f'oe-{year}'
                    season=ck[0]!=f'WORLDS_{year}';perf,coverage=score(rs)
                    confidence=stats['games']/(stats['games']+5)*coverage*(.65 if season else 1)
                    B=A+confidence*(perf-A);share=stats['games']/aggregates[ck[:4]]['games'];C=100*min(1,math.sqrt(share/.5))*(.5 if season else 1)
                    hs=.35*A+.5*B+.15*C;eid=f'{pid}-g{i}';cid=names[ck[-1]]
                    if fp:
                        fs=fp['championPool'][i-1];assert fs['championId']==cid,(pid,i,cid,fs)
                        hs=frozen_ev[fs['evidenceId']]['score']
                    evidence[eid]=dict(playerId=pid,championId=cid,historicalScore=hs,role=role,year=year,region=region,event=ck[0],stats=stats,confidenceScore=confidence,availableWeight=coverage,components=dict(A=A,B=B,C=C),firstAppearance=stats['firstAppearance'],sourceId=f'oe-{year}',sourceLines=[r['sourceLine'] for r in rs],methodVersion='worlds-2017-v1.0.0' if fp else VERSION)
                    season_name=ck[0].replace('_SUMMER_',' Summer ').replace('_SPRING_',' Spring ').replace('_QUALIFIER_',' Regional Qualifiers ').replace('_WINTER_',' Winter ').replace('MSI_','MSI ')
                    source_url='https://gol.gg/tournament/tournament-stats/'+urllib.parse.quote(season_name)+'/' if season else event_url(year)
                    slots.append(dict(game=i,championId=cid,rating=0,gameRating=0,historicalScore=hs,source='SEASON_DATA' if season else 'WORLDS_DATA',evidenceId=eid,stats=dict(games=stats['games'],winRate=stats['winRate'],kda=stats['kda'],confidence=confidence,event=ck[0],sourceUrl=source_url)))
                for extra in supplements[:5-len(slots)]:
                    i=len(slots)+1;eid=f'{pid}-g{i}';cid=extra['championId'];share=extra['games']/extra['seasonGames'] if extra['seasonGames'] else 0
                    C=50*min(1,math.sqrt(share/.5));hs=.85*A+.15*C
                    stats=dict(games=extra['games'],winRate=extra['wins']/extra['games'],kda=extra['kda'],confidence=0,event='LPL_SEASON_2015',sourceUrl=extra['sourceUrl'])
                    evidence[eid]=dict(playerId=pid,championId=cid,historicalScore=hs,role=role,year=year,region=region,event='LPL_SEASON_2015',stats=stats,confidenceScore=0,availableWeight=0,components=dict(A=A,B=A,C=C),sourceId='golgg-supplement-2015',methodVersion=VERSION,observation=extra,firstAppearance=extra['firstAppearance'],note='Aggregate-only or partial season evidence: no inferred match metrics; B=A. Selection among documented available champions.')
                    slots.append(dict(game=i,championId=cid,rating=0,gameRating=0,historicalScore=hs,source='SEASON_DATA',evidenceId=eid,stats=stats))
                players.append(dict(id=pid,playerName=player,team=short,teamName=ALIASES.get((year,team),team),region=region,historicalLeague=league,worldsYear=year,role=role,profile=f"{overall['games']} jogos no Worlds",worldsStats=dict(games=overall['games'],winRate=overall['winRate'],kda=overall['kda']),championPool=slots))
    write(OUT/f'evidence-{year}.json',evidence,True)
    write(OUT/f'rosters-{year}.json',rosters)
    write(OUT/f'normalization-{year}.json',dict(weights=WEIGHTS,baselines=[dict(event=k[0],role=k[1],metrics=v) for k,v in sorted(baselines.items())],offsets=[dict(event=k[0],role=k[1],champion=k[2],metric=k[3],offset=v) for k,v in sorted(offsets.items())]),True)
    write(OUT/f'coverage-{year}.json',dict(players=len(players),slots=len(players)*5,missing=missing,worldsGames=CONFIG[year][1],matchesSha256=sha(OUT/f'matches-{year}.json'),missingMetrics={m:sum(r[m] is None for r in rows) for m in NUMBERS}))
    print(json.dumps({'year':year,'players':len(players),'missing':missing}),flush=True)
    return players

def event_url(year):
    event=f'Worlds%20Main%20Event%20{year}' if year==2023 else f'World%20Championship%20{year}'
    return f'https://gol.gg/tournament/tournament-stats/{event}/'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--snapshot',action='store_true');parser.add_argument('--year',type=int,choices=CONFIG);parser.add_argument('--region',choices=['LCK','LPL','LEC','LCS']);args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True);RAW.mkdir(parents=True,exist_ok=True)
    players=[]
    for year in ([args.year] if args.year else CONFIG):players+=build_year(year,args.snapshot)
    if args.year or args.region:
        write(OUT/'batch-preview.json',[p for p in players if not args.region or p['region']==args.region]);return
    # One fixed role-normalized transform across ALL years/regions; no named-player overrides.
    calibration={}
    for role in ROLES.values():
        values=[s['historicalScore'] for p in players if p['role']==role for s in p['championPool']]
        calibration[role]=dict(mean=st.mean(values),sd=st.pstdev(values),n=len(values),center=84.5,spread=5)
    for p in players:
        b=calibration[p['role']]
        for s in p['championPool']:s['rating']=s['gameRating']=max(70,min(99,math.floor(84.5+5*(s['historicalScore']-b['mean'])/b['sd']+.5)))
    write(OUT/'calibration.json',dict(version=VERSION,formula='round(clamp(84.5 + 5 * (historicalScore - pooledRoleMean) / pooledRoleSD, 70, 99))',parameters=calibration,frozen2017Sha256=sha(ROOT/'src/data/worlds-2017.json')))
    matrix=[dict(year=y,region=r,role=role,count=sum(p['worldsYear']==y and p['region']==r and p['role']==role for p in players)) for y in CONFIG for r in ['LCK','LPL','LEC','LCS'] for role in ROLES.values()]
    write(OUT/'eligibility.json',matrix)
    assert all(x['count']>=3 for x in matrix),[x for x in matrix if x['count']<3]
    write(ROOT/'src/data/multi-era.json',players)
    print(f'Production: {len(players)} players, {len(players)*5} slots, {len(matrix)} valid pools.')

if __name__=='__main__':main()
