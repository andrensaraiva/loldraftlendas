"""Download hash-pinned public mirrors of Oracle's Elixir annual CSVs."""
from pathlib import Path
import concurrent.futures, hashlib, json, urllib.request
BASE=Path(__file__).resolve().parents[2]/'data/research/multi-era'
RAW=BASE/'raw'
RAW.mkdir(parents=True,exist_ok=True)
URLS={
2015:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2015_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2019:'https://raw.githubusercontent.com/victoraccete/competitive-league-analysis/master/original_data/2019_LoL_esports_match_data_from_OraclesElixir_20201011.csv',
2020:'https://raw.githubusercontent.com/AdamLewis73/League-of-Legends-Stats-Analyzer/main/2020_LoL_esports_match_data_from_OraclesElixir_20210710.csv',
2022:'https://raw.githubusercontent.com/twodotone/finalLOL/main/data/csv/2022_LoL_esports_match_data_from_OraclesElixir.csv',
2023:'https://raw.githubusercontent.com/twodotone/finalLOL/main/data/csv/2023_LoL_esports_match_data_from_OraclesElixir.csv'}
def get(item):
    year,url=item;path=RAW/f'oe-{year}.csv'
    if not path.exists():
        temp=path.with_suffix('.partial');urllib.request.urlretrieve(url,temp);temp.replace(path)
    with path.open('rb') as f:
        first=f.read(100)
        assert first.lstrip(b'\xef\xbb\xbf').startswith(b'gameid,'),f'{year}: not CSV'
        f.seek(0);digest=hashlib.file_digest(f,'sha256').hexdigest()
    previous=BASE/'downloads.json'
    if previous.exists():
        pinned=json.loads(previous.read_text())[str(year)];assert pinned['sha256']==digest,f'{year}: source hash changed; review before updating.'
    print(year,path.stat().st_size,digest,flush=True)
    return str(year),dict(url=url,sha256=digest,bytes=path.stat().st_size,publisher="Oracle's Elixir; third-party public mirror",originalPublisher='https://lol.timsevenhuysen.com/matchdata/',accessedAt='2026-09-07',note='Mirrors preserve attributed data but are not independently authenticated by the publisher. Raw CSVs ignored; normalized snapshots committed.')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:result=dict(pool.map(get,URLS.items()))
(BASE/'downloads.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
