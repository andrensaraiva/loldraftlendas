"""Deterministic research -> ratings -> production data. Python 3, standard library only."""
from pathlib import Path
from collections import Counter, defaultdict
import csv, hashlib, json, math, statistics as st

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'data/research/worlds-2017'
RAW = OUT / 'raw'
VERSION = 'worlds-2017-v1.0.0'
TEAMS = {'SK Telecom T1': 'SKT', 'Samsung Galaxy': 'SSG', 'Longzhu Gaming': 'LZ'}
ROLES = {'top': 'TOP', 'jng': 'JUNGLE', 'mid': 'MID', 'bot': 'ADC', 'sup': 'SUPPORT'}
IDS = dict(Huni=371, Peanut=392, Faker=48, Bang=100, Wolf=101, Blank=411,
           CuVee=216, Ambition=104, Crown=451, Ruler=685, CoreJJ=257, Haru=683,
           Khan=982, Cuzz=983, Bdd=650, PraY=221, GorillA=65, Rascal=1061)
NUMBERS = ['result', 'kills', 'deaths', 'assists', 'teamkills', 'dpm', 'damageshare',
           'golddiffat15', 'csdiffat15', 'xpdiffat15', 'gamelength', 'wpm', 'wcpm']
METRICS = ['efficiency', 'kp', 'dpm', 'damageshare', 'golddiffat15', 'csdiffat15', 'xpdiffat15', 'wpm', 'wcpm']
# No win-rate component: wins remain evidence, avoiding repeated team-success bonuses.
WEIGHTS = {
    'TOP': dict(efficiency=.25, kp=.15, dpm=.15, damageshare=.10, golddiffat15=.15, csdiffat15=.10, xpdiffat15=.10),
    'JUNGLE': dict(efficiency=.30, kp=.30, dpm=.10, damageshare=.05, golddiffat15=.10, xpdiffat15=.15),
    'MID': dict(efficiency=.25, kp=.20, dpm=.10, damageshare=.10, golddiffat15=.15, csdiffat15=.10, xpdiffat15=.10),
    'ADC': dict(efficiency=.25, kp=.15, dpm=.20, damageshare=.15, golddiffat15=.10, csdiffat15=.10, xpdiffat15=.05),
    'SUPPORT': dict(efficiency=.35, kp=.35, wpm=.15, wcpm=.15),
}

def write(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Preserve the frozen Windows release bytes on every OS (hashes include CRLF).
    path.write_text(json.dumps(value, ensure_ascii=False, indent=None if compact else 2, allow_nan=False) + '\n', encoding='utf-8', newline='\r\n')

def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def avg(values):
    values = [x for x in values if x is not None]
    return st.mean(values) if values else None

def stage(date):
    return ('groups' if date < '2017-10-19' else 'quarters' if date < '2017-10-28'
            else 'semis' if date < '2017-11-04' else 'final')

def ingest(use_snapshot=False):
    path = RAW / 'oe-2017.csv'
    if use_snapshot or not path.exists():
        return json.loads((OUT / 'matches.json').read_text(encoding='utf-8'))
    result = []
    with path.open(encoding='utf-8-sig', newline='') as f:
        for line, r in enumerate(csv.DictReader(f), 2):
            if r['position'] not in ROLES:
                continue
            world = r['league'] in ('WLDs', 'WCS') and '2017-10-05' <= r['date'] < '2017-11-05'
            summer = r['league'] == 'LCK' and r['split'] == 'Summer' and '2017-05-30' <= r['date'] < '2017-08-27'
            if not (world or summer):
                continue
            row = {k: r[k] for k in ['gameid', 'date', 'playername', 'teamname', 'champion', 'side', 'patch', 'url']}
            row.update({k: float(r[k]) if r[k] else None for k in NUMBERS})
            row.update(event='WORLDS_2017' if world else 'LCK_SUMMER_2017', role=ROLES[r['position']],
                       stage=stage(r['date']) if world else ('playoffs' if r['playoffs'] == '1' else 'regular'),
                       sourceId='oe-2017', sourceLine=line)
            result.append(row)
    result.sort(key=lambda x: (x['date'], x['gameid'], x['teamname'], x['role']))
    write(OUT / 'matches.json', result, compact=True)
    return result

def aggregate(rows):
    n = len(rows)
    kills, deaths, assists = [sum(r[k] for r in rows) for k in ['kills', 'deaths', 'assists']]
    wins = int(sum(r['result'] for r in rows))
    result = dict(games=n, wins=wins, losses=n-wins, winRate=wins/n, kills=int(kills), deaths=int(deaths),
                  assists=int(assists), kda=(kills+assists)/max(1, deaths),
                  kp=avg((r['kills']+r['assists'])/r['teamkills'] if r['teamkills'] else 0 for r in rows),
                  aggregateKp=(kills+assists)/max(1, sum(r['teamkills'] for r in rows)),
                  efficiency=avg(math.log1p((r['kills']+r['assists'])/(r['deaths']+1)) for r in rows),
                  firstAppearance=rows[0]['date'], lastAppearance=rows[-1]['date'],
                  stages=dict(Counter(r['stage'] for r in rows)), gameIds=[r['gameid'] for r in rows], sourceId='oe-2017')
    result.update({k: avg(r[k] for r in rows) for k in METRICS if k not in ('kp', 'efficiency')})
    return result

def main(use_snapshot=False):
    if (OUT/'sources.json').exists():
        pinned = json.loads((OUT/'sources.json').read_text(encoding='utf-8'))
        for sid in ['oe-2017', 'oe-worlds-mirror', 'ddragon-7.18.1']:
            source = pinned[sid]
            path = OUT/source['localFile']
            if path.exists():
                assert sha(path)==source['sha256'], f'{sid}: source changed; review provenance before updating the pinned hash.'
        if use_snapshot or not (RAW/'oe-2017.csv').exists():
            snapshot = json.loads((OUT/'coverage.json').read_text(encoding='utf-8'))
            assert sha(OUT/'matches.json')==snapshot['matchesSha256'], 'Frozen match snapshot changed.'
    rows = ingest(use_snapshot)
    worlds = [r for r in rows if r['event'] == 'WORLDS_2017']
    assert len(worlds) == 800 and len({r['gameid'] for r in worlds}) == 80
    assert {r['patch'] for r in worlds} == {'7.18'}
    assert len({(r['gameid'], r['side'], r['role']) for r in rows}) == len(rows)
    champions = json.loads((RAW / 'ddragon-7.18.1.json').read_text(encoding='utf-8'))['data']
    names = {c['name']: c['id'] for c in champions.values()}
    names['Nunu & Willump'] = 'Nunu'  # OE uses the modern display name for the historical ID.
    assert all(r['champion'] in names for r in rows)
    by_player, by_champion, by_role = defaultdict(list), defaultdict(list), defaultdict(list)
    for r in rows:
        base = (r['event'], r['role'])
        by_role[base].append(r)
        by_player[base + (r['teamname'], r['playername'])].append(r)
        by_champion[base + (r['teamname'], r['playername'], r['champion'])].append(r)
    aggregates = {k: aggregate(rs) for k, rs in by_player.items()}
    champ_aggs = {k: aggregate(rs) for k, rs in by_champion.items()}
    # Empirical champion adjustment, within event AND role, for damage and lane resource expectations.
    # This is archetype-aware without subjective Galio/tank bonuses. Prior = 12 role-average games.
    adjusted = ['dpm', 'damageshare', 'golddiffat15', 'csdiffat15', 'xpdiffat15']
    offsets = {}
    for base, rs in by_role.items():
        means = {m: avg(r[m] for r in rs) for m in adjusted}
        for champion in sorted({r['champion'] for r in rs}):
            sub = [r for r in rs if r['champion'] == champion]
            for m in adjusted:
                valid = [r[m] for r in sub if r[m] is not None]
                offsets[base + (champion, m)] = (avg(valid)-means[m])*len(valid)/(len(valid)+12) if valid and means[m] is not None else 0
    def features(rs):
        a = aggregate(rs)
        for m in adjusted:
            a[m] = avg(r[m]-offsets[(r['event'], r['role'], r['champion'], m)] for r in rs if r[m] is not None)
        return {m: a[m] for m in METRICS}
    player_features = {k: features(rs) for k, rs in by_player.items()}
    baselines = {}
    for base in by_role:
        baselines[base] = {}
        for m in METRICS:
            values = [f[m] for k, f in player_features.items() if k[:2] == base and f[m] is not None]
            baselines[base][m] = dict(mean=avg(values), sd=st.pstdev(values) if values else None, players=len(values))
    def score(rs):
        base = (rs[0]['event'], rs[0]['role'])
        f = features(rs)
        normalized = {}
        for m, weight in WEIGHTS[base[1]].items():
            b = baselines[base][m]
            if f[m] is not None and b['mean'] is not None:
                z = (f[m]-b['mean'])/b['sd'] if b['sd'] else 0
                normalized[m] = 50*(1+math.erf(max(-3, min(3, z))/math.sqrt(2)))
        weight_sum = sum(WEIGHTS[base[1]][m] for m in normalized)
        return (sum(WEIGHTS[base[1]][m]*v for m, v in normalized.items())/weight_sum if weight_sum else 50,
                normalized, weight_sum)
    output, evidence = [], {}
    roster = []
    for team, short in TEAMS.items():
        for role in ROLES.values():
            candidates = [(k, a) for k, a in aggregates.items() if k[0]=='WORLDS_2017' and k[1]==role and k[2]==team]
            candidates.sort(key=lambda x: (-x[1]['games'], x[0][3]))
            key, overall = candidates[0]
            player = key[3]
            for k, a in candidates:
                roster.append(dict(player=k[3], team=short, role=role, playable=k==key, games=a['games'], wins=a['wins'], sourceId=f'golgg-{k[3]}'))
            world_rows = by_player[key]
            all_picks = [k for k in champ_aggs if k[:4] == key]
            selected = sorted(all_picks, key=lambda k: (-champ_aggs[k]['games'], champ_aggs[k]['firstAppearance'], k[-1]))[:5]
            selected.sort(key=lambda k: (champ_aggs[k]['firstAppearance'], k[-1]))
            # All five incomplete pools are covered by Summer; fail instead of inventing more distant picks.
            if len(selected) < 5:
                season = [k for k in champ_aggs if k[0]=='LCK_SUMMER_2017' and k[1:4]==key[1:4] and k[-1] not in {s[-1] for s in selected}]
                season.sort(key=lambda k: (-champ_aggs[k]['games'], -int(champ_aggs[k]['lastAppearance'][:10].replace('-', '')), k[-1]))
                selected += season[:5-len(selected)]
            assert len(selected) == 5
            a_raw, a_metrics, a_coverage = score(world_rows)
            A = 50 + overall['games']/(overall['games']+5) * a_coverage * (a_raw-50)
            slots = []
            pid = f'{player.lower()}-2017-{short.lower()}'
            for i, ck in enumerate(selected, 1):
                rs, stats = by_champion[ck], champ_aggs[ck]
                season = ck[0] != 'WORLDS_2017'
                raw_performance, normalized, coverage = score(rs)
                confidence = stats['games']/(stats['games']+5)*coverage*(.65 if season else 1)
                B = A + confidence*(raw_performance-A)
                share = stats['games']/aggregates[ck[:4]]['games']
                C = 100*min(1, math.sqrt(share/.5))*(.5 if season else 1)
                combined = .35*A + .50*B + .15*C
                rating = min(99, max(70, math.floor(70+29*combined/100+.5)))
                eid = f'{pid}-g{i}'
                source = 'SEASON_DATA' if season else 'WORLDS_DATA'
                evidence[eid] = dict(playerId=pid, player=player, champion=ck[-1], championId=names[ck[-1]], role=role,
                    team=team, source=source, event=ck[0], methodVersion=VERSION, stats=stats,
                    worldsGames=0 if season else stats['games'], performanceScore=raw_performance,
                    confidenceScore=confidence, components=dict(A=A, B=B, C=C, D=None), score=combined, rating=rating,
                    normalizedMetrics=normalized, playerNormalizedMetrics=a_metrics,
                    availableWeight=coverage, sourceIds=['oe-2017', 'ddragon-7.18.1', f'golgg-{player}'],
                    firstAppearance=stats['firstAppearance'], selectionShare=share,
                    notes='Summer: separate event/role normalization, transfer factor 0.65.' if season else 'Main Event; empirical champion adjustment.')
                slots.append(dict(game=i, championId=names[ck[-1]], rating=rating, source=source, evidenceId=eid))
                if season:
                    evidence[eid]['sourceIds'].append(f'golgg-summer-{player}')
            output.append(dict(id=pid, playerName=player, team=short, region='LCK', worldsYear=2017, role=role,
                               profile=f"{overall['games']} jogos no Worlds · dados pesquisados", championPool=slots))
    write(ROOT / 'src/data/worlds-2017.json', output)
    write(OUT / 'evidence.json', evidence)
    write(OUT / 'rosters.json', roster)
    def table(items, champion=False):
        return [dict(event=k[0], role=k[1], team=k[2], player=k[3], **({'champion':k[4]} if champion else {}), **a) for k,a in sorted(items.items())]
    write(OUT / 'player-stats.json', table(aggregates))
    write(OUT / 'player-champion-stats.json', table(champ_aggs, True))
    write(OUT / 'normalization.json', dict(methodVersion=VERSION, roleWeights=WEIGHTS,
          baselines=[dict(event=k[0], role=k[1], metrics=v) for k,v in sorted(baselines.items())],
          championOffsets=[dict(event=k[0], role=k[1], champion=k[2], metric=k[3], offset=v) for k,v in sorted(offsets.items())]))
    sources = {
        'oe-2017': dict(publisher="Oracle's Elixir", url='https://drive.google.com/uc?export=download&id=11fx3nNjSYB0X8vKxLAbYOrS2Bu6avm9A',
            discovery='https://github.com/HerrKurz/Esports_Data_Pipeline/blob/master/config.py',
            note='Public download ID located in third-party configuration; publisher downloads page blocked. Archived bytes hashed; not independently authenticated by publisher.'),
        'oe-worlds-mirror': dict(publisher="Oracle's Elixir; mirror by ZD2525", url='https://raw.githubusercontent.com/ZD2525/Basic-Exploratory-Data-Analysis/main/2017_LoL_esports_match_data_from_OraclesElixir.csv', note='Same underlying statistical producer, not an independent source.'),
        'ddragon-7.18.1': dict(publisher='Riot Games', url='https://ddragon.leagueoflegends.com/cdn/7.18.1/data/en_US/champion.json'),
        'golgg-event': dict(publisher='Games of Legends', url='https://gol.gg/tournament/tournament-stats/World%20Championship%202017/'),
        'riot-rosters': dict(publisher='Riot Games', url='https://na.leagueoflegends.com/en/featured/worlds-2017-meet-the-teams/'),
        'golgg-players': dict(publisher='Games of Legends', url='https://gol.gg/players/list/season-ALL/split-ALL/tournament-World%20Championship%202017/'),
    }
    for player, identifier in IDS.items():
        sources[f'golgg-{player}'] = dict(publisher='Games of Legends', url=f'https://gol.gg/players/player-stats/{identifier}/season-ALL/split-ALL/tournament-World%20Championship%202017/', note='Independent aggregate/Worlds pick cross-check reference; not the source of per-match Summer metrics.')
    for player in ['Peanut', 'Cuzz', 'Ruler', 'CoreJJ', 'PraY']:
        sources[f'golgg-summer-{player}'] = dict(publisher='Games of Legends', url=f'https://gol.gg/players/player-stats/{IDS[player]}/season-ALL/split-ALL/tournament-LCK%20Summer%202017/', note='Independently checked all six fallback associations, games, wins and KDA. Page excludes playoffs; the chosen associations have no additional playoff games.')
    for source in sources.values():
        source.update(accessedAt='2026-09-07', publicationDate=None, dataPeriod='2017')
    for sid, filename in [('oe-2017','oe-2017.csv'), ('oe-worlds-mirror','oe-worlds-2017-mirror.csv'), ('ddragon-7.18.1','ddragon-7.18.1.json')]:
        p = RAW / filename
        if p.exists():
            sources[sid].update(sha256=sha(p), bytes=p.stat().st_size, localFile=f'raw/{filename}')
        elif (OUT/'sources.json').exists():
            old=json.loads((OUT/'sources.json').read_text(encoding='utf-8'))[sid]
            sources[sid].update({k:old[k] for k in ('sha256','bytes','localFile') if k in old})
    write(OUT/'sources.json', sources)
    write(OUT/'coverage.json', dict(events=dict(Counter(r['event'] for r in rows)), worldsGames=80,
          worldsPlayers=len({r['playername'] for r in worlds}), playablePlayers=len(output), slots=len(evidence),
          missing={k:sum(r[k] is None for r in rows) for k in NUMBERS}, matchesSha256=sha(OUT/'matches.json'),
          sourceCounts=dict(Counter(e['source'] for e in evidence.values()))))
    print(json.dumps(dict(players=len(output), slots=len(evidence), ratings=sorted(Counter(e['rating'] for e in evidence.values()).items()),
          season=[(e['player'], e['champion'],e['stats']['games']) for e in evidence.values() if e['source']=='SEASON_DATA'])))

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', action='store_true', help='Use frozen match records even when the full CSV is cached.')
    main(parser.parse_args().snapshot)
