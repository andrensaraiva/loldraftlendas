"""Download only missing public source files; verify pinned hashes; no scraping or retries."""
import urllib.request
from build_worlds_2017 import OUT, RAW, sha
import json
sources=json.loads((OUT/'sources.json').read_text(encoding='utf-8'))
for sid in ['oe-2017', 'oe-worlds-mirror', 'ddragon-7.18.1']:
    source=sources[sid]
    path=OUT/source['localFile']
    if not path.exists():
        print('Downloading',sid,flush=True)
        urllib.request.urlretrieve(source['url'],path)
    if sha(path)!=source['sha256']:
        raise SystemExit(f'{sid}: SHA-256 mismatch. Review upstream changes before regenerating.')
    print(sid,'verified')
