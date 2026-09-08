"""Pin Riot's period square art and extract splash art from historical archives.
Uses only allowlisted archive members; never extracts archive paths directly.
"""
import concurrent.futures, json, tarfile, urllib.request, argparse
from build_multi_era import ROOT, OUT, RAW, CONFIG, write, sha

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--splash',action='store_true');args=parser.parse_args()
    players=json.loads((ROOT/'src/data/multi-era.json').read_text(encoding='utf-8'))
    old=json.loads((ROOT/'src/data/historical-assets.json').read_text(encoding='utf-8'))
    mapping={};assets=[]
    for year in CONFIG:
        for cid in sorted({s['championId'] for p in players if p['worldsYear']==year for s in p['championPool']}):
            patch=CONFIG[year][2];square=f'/assets/{year}/champions/{cid}.png';splash=f'/assets/{year}/splash/{cid}.jpg'
            mapping.setdefault(cid,{})[str(year)]=dict(square=square,splash=splash if (ROOT/f'public{splash}').exists() else square,patch=patch)
    def square_job(item):
        cid,year,art=item;path=ROOT/f"public{art['square']}";path.parent.mkdir(parents=True,exist_ok=True)
        url=f"https://ddragon.leagueoflegends.com/cdn/{art['patch']}/img/champion/{cid}.png"
        if not path.exists():urllib.request.urlretrieve(url,path)
        return dict(championId=cid,year=int(year),kind='square',url=url,localFile=path.relative_to(ROOT).as_posix(),sha256=sha(path))
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        assets=list(pool.map(square_job,[(cid,year,art) for cid,years in mapping.items() for year,art in years.items()]))
    write(ROOT/'src/data/multi-era-assets.json',mapping)
    write(OUT/'asset-manifest.json',dict(publisher='Riot Games',note='Copyright Riot Games; no endorsement. Period squares used as explicit fallback until archived splashes are present.',assets=assets))
    print(f'{len(assets)} historical square assets ready.',flush=True)
    if not args.splash:return
    def archive_job(year):
        patch=CONFIG[year][2];url=f'https://ddragon.leagueoflegends.com/cdn/dragontail-{patch}.tgz'
        archive=ROOT/'data/research/worlds-2017/raw/dragontail-7.18.1.tgz' if year==2017 else RAW/f'dragontail-{patch}.tgz'
        if not archive.exists():
            temp=archive.with_suffix('.partial');urllib.request.urlretrieve(url,temp);temp.replace(archive)
        ids={cid for cid,years in mapping.items() if str(year) in years}
        targets={f'img/champion/splash/{cid}_0.jpg'.casefold():cid for cid in ids};found=[]
        with tarfile.open(archive,'r|gz') as tar:
            for member in tar:
                name=member.name.removeprefix('./')
                if name.casefold() not in targets or not member.isfile():continue
                cid=targets[name.casefold()];path=ROOT/f'public/assets/{year}/splash/{cid}.jpg';path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(tar.extractfile(member).read())
                mapping[cid][str(year)]['splash']=f'/assets/{year}/splash/{cid}.jpg'
                found.append(dict(championId=cid,year=year,kind='splash',archivePath=name,localFile=path.relative_to(ROOT).as_posix(),sha256=sha(path)))
        assert len(found)==len(ids),(year,len(found),len(ids))
        print(f'{year}: {len(found)} archived splashes extracted.',flush=True)
        return dict(year=year,url=url,sha256=sha(archive),bytes=archive.stat().st_size),found
    archives=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for metadata,found in pool.map(archive_job,CONFIG):archives.append(metadata);assets+=found
    write(ROOT/'src/data/multi-era-assets.json',mapping)
    write(OUT/'asset-manifest.json',dict(publisher='Riot Games',note='Copyright Riot Games. Versioned official distributions; no endorsement. Existing frozen 2017 manifest remains unchanged.',archives=archives,assets=assets))

if __name__=='__main__':main()
