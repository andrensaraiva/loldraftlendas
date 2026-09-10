"""Check complete offline multi-era reconstruction without touching the frozen release."""
import subprocess, sys
from build_multi_era import ROOT, OUT, CONFIG, sha, write
files=[
    ROOT/'src/data/multi-era.json',
    ROOT/'src/data/draft-region-groups.json',
    ROOT/'src/data/featured-player.json',
    ROOT/'src/data/player-index.json',
    OUT/'calibration.json',
    OUT/'eligibility.json',
]
for year in CONFIG:
    files += [OUT/f'{name}-{year}.json' for name in ['matches','evidence','rosters','normalization','coverage']]
    files.append(ROOT/f'src/data/years/{year}.json')
before={p.relative_to(ROOT).as_posix():sha(p) for p in files}
subprocess.run([sys.executable,str(ROOT/'scripts/data/build_multi_era.py'),'--snapshot'],cwd=ROOT,check=True)
after={p.relative_to(ROOT).as_posix():sha(p) for p in files}
assert before==after,'Multi-era reconstruction changed bytes.'
write(OUT/'reproducibility.json',dict(passed=True,mode='offline normalized snapshots',files=after))
print(f'{len(files)} multi-era files reproduced byte-for-byte.')
