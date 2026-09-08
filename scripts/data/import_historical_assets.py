"""Extract allowlisted base art and champion kits from Riot's versioned archive.
Never extracts arbitrary archive paths. Reruns can use the checked-in assets/manifest offline.
"""
from pathlib import Path
import hashlib, json, tarfile, urllib.request, argparse
from build_worlds_2017 import ROOT, OUT, RAW, write, sha

URL = 'https://ddragon.leagueoflegends.com/cdn/dragontail-7.18.1.tgz'
parser = argparse.ArgumentParser()
parser.add_argument('--download', action='store_true')
args = parser.parse_args()
archive = RAW / 'dragontail-7.18.1.tgz'
if not archive.exists():
    if not args.download:
        raise SystemExit('Archive absent. Use --download explicitly to fetch the 722 MB official archive.')
    urllib.request.urlretrieve(URL, archive)
if (OUT/'asset-manifest.json').exists():
    previous = json.loads((OUT/'asset-manifest.json').read_text(encoding='utf-8'))
    assert sha(archive) == previous['archiveSha256'], 'Historical archive hash mismatch.'
players = json.loads((ROOT / 'src/data/worlds-2017.json').read_text(encoding='utf-8'))
ids = {s['championId'] for p in players for s in p['championPool']} | {'Ryze'}
targets = {}
for cid in ids:
    targets[f'7.18.1/img/champion/{cid}.png'] = ROOT / f'public/assets/2017/champions/{cid}.png'
    targets[f'img/champion/splash/{cid}_0.jpg'] = ROOT / f'public/assets/2017/splash/{cid}.jpg'
    targets[f'7.18.1/data/en_US/champion/{cid}.json'] = OUT / f'champion-kits/{cid}.json'
found = set()
with tarfile.open(archive, 'r|gz') as tar:
    for member in tar:
        name = member.name.removeprefix('./')
        if name in targets and member.isfile():
            content = tar.extractfile(member).read()
            target = targets[name]
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
            found.add(name)
assert found == set(targets), f'Missing {set(targets)-found}'
manifest = dict(patch='7.18.1', publisher='Riot Games', archiveUrl=URL, archiveSha256=sha(archive),
                archiveBytes=archive.stat().st_size,
                usageNote='Copyright Riot Games. Official static distribution; not a public-domain or open-license assertion. No endorsement.', assets=[])
mapping = {}
for cid in sorted(ids):
    mapping[cid] = dict(square=f'/assets/2017/champions/{cid}.png', splash=f'/assets/2017/splash/{cid}.jpg', patch='7.18.1')
    for archive_path, local in targets.items():
        if local.stem == cid:
            manifest['assets'].append(dict(championId=cid, archivePath=archive_path, localFile=local.relative_to(ROOT).as_posix(), sha256=sha(local)))
write(OUT/'asset-manifest.json', manifest)
write(ROOT/'src/data/historical-assets.json', mapping)
print(f'Extracted {len(found)} files for {len(ids)} champions from patch 7.18.1.')
