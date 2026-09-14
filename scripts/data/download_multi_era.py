"""Download hash-pinned public mirrors of Oracle's Elixir annual CSVs."""
from pathlib import Path
import concurrent.futures, hashlib, json, shutil, urllib.request, zipfile
BASE=Path(__file__).resolve().parents[2]/'data/research/multi-era'
RAW=BASE/'raw'
RAW.mkdir(parents=True,exist_ok=True)
URLS={
2014:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2014_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2015:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2015_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2016:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2016_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2018:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2018_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2019:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2019_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2020:'https://raw.githubusercontent.com/AdamLewis73/League-of-Legends-Stats-Analyzer/main/2020_LoL_esports_match_data_from_OraclesElixir_20210710.csv',
2021:'https://www.kaggle.com/api/v1/datasets/download/arthur1511/lol-esports-2021?datasetVersionNumber=1',
2022:'https://raw.githubusercontent.com/twodotone/finalLOL/main/data/csv/2022_LoL_esports_match_data_from_OraclesElixir.csv',
2023:'https://raw.githubusercontent.com/twodotone/finalLOL/main/data/csv/2023_LoL_esports_match_data_from_OraclesElixir.csv',
2024:'https://drive.usercontent.google.com/download?id=1IjIEhLc9n8eLKeY-yh_YigKVWbhgGBsN&export=download&confirm=t',
2025:'https://raw.githubusercontent.com/cbplexiglass/LoL-Esports-Regional-Analyses/main/2025_LoL_esports_match_data_from_OraclesElixir.csv'}
ARCHIVE_MEMBERS={2021:'2021_LoL_esports_match_data_from_OraclesElixir_20220201.csv'}
def get(item):
    year,url=item;path=RAW/f'oe-{year}.csv'
    if not path.exists():
        temp=path.with_suffix('.partial')
        if year in ARCHIVE_MEMBERS:
            archive=RAW/f'oe-{year}.download.partial';urllib.request.urlretrieve(url,archive)
            with zipfile.ZipFile(archive) as zf:
                member=ARCHIVE_MEMBERS[year];assert zf.namelist()==[member],f'{year}: unexpected archive contents'
                with zf.open(member) as source,temp.open('wb') as target:shutil.copyfileobj(source,target)
            archive.unlink()
        else:urllib.request.urlretrieve(url,temp)
        temp.replace(path)
    with path.open('rb') as f:
        first=f.read(100)
        assert first.lstrip(b'\xef\xbb\xbf').startswith(b'gameid,'),f'{year}: not CSV'
        f.seek(0);digest=hashlib.file_digest(f,'sha256').hexdigest()
    previous=BASE/'downloads.json'
    if previous.exists():
        pinned=json.loads(previous.read_text()).get(str(year))
        if pinned: assert pinned['sha256']==digest,f'{year}: source hash changed; review before updating.'
    print(year,path.stat().st_size,digest,flush=True)
    direct=year==2024
    accessed='2026-09-13' if year in (2014,2016,2018,2021) else '2026-09-10' if year==2025 else '2026-09-09' if year==2024 else '2026-09-07'
    note="The publisher's public Drive file (ID 1v6LRphp2kYciU4SXp0PCjEMuev1bDejc; advertised as 79,169,638 bytes) was quota-limited. This 79,130,187-byte mirror is hash-pinned but not independently authenticated against that later Drive revision. Raw CSV ignored; normalized snapshots committed." if year==2025 else "The publisher's public Drive file (ID 1fzwTTz77hcnYjOnO9ONeoPrkWCoOSecA; advertised as 109,765,213 bytes) was quota-limited. This 91,999,784-byte Kaggle snapshot from 2022-02-01 is hash-pinned but not independently authenticated against that later Drive revision. Raw CSV ignored; normalized snapshots committed." if year==2021 else 'Public source is hash-pinned; normalized snapshots are committed and raw CSVs are ignored.' if direct else 'Mirrors preserve attributed data but are not independently authenticated by the publisher. Raw CSVs ignored; normalized snapshots committed.'
    return str(year),dict(url=url,sha256=digest,bytes=path.stat().st_size,publisher="Oracle's Elixir public Google Drive" if direct else "Oracle's Elixir; third-party public mirror",originalPublisher='https://lol.timsevenhuysen.com/matchdata/',accessedAt=accessed,note=note)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:result=dict(pool.map(get,URLS.items()))
(BASE/'downloads.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
