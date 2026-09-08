"""Generate reviewable tables and companion manifests from frozen research outputs."""
import ast, json, statistics as st
from build_worlds_2017 import ROOT, OUT, TEAMS, WEIGHTS, write

def read(file): return json.loads((OUT/file).read_text(encoding='utf-8'))
players=json.loads((ROOT/'src/data/worlds-2017.json').read_text(encoding='utf-8'))
evidence, sources, sim, roster = [read(f) for f in ['evidence.json','sources.json','simulation.json','rosters.json']]
stats=read('player-stats.json')
all_champions=read('player-champion-stats.json')
names={p['id']:p['playerName'] for p in players}
def link(sid, label=None):
    return f"[{label or sid}]({sources[sid]['url']})"
def fmt(n): return f'{n:.2f}'
def table(headers, rows):
    return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']+
                     ['| '+' | '.join(map(str,row))+' |' for row in rows])+'\n\n'

# Manually reviewed interpretations of the archived kits; neither official tags nor rating inputs.
reasons={
 'Ashe':'Ataques físicos e ultimate de iniciação/pick; controle por lentidão.',
 'Braum':'Escudo, interrupção de projéteis e controle favorecem proteção e linha de frente.',
 'Caitlyn':'Alcance e armadilhas sustentam pressão inicial e dano físico à distância.',
 'Camille':'Mobilidade e isolamento no ultimate favorecem pick e pressão lateral.',
 'Cassiopeia':'Dano mágico sustentado, miasma e ultimate de controle; escala como carry.',
 'Chogath':'Vida acumulada, silêncio e knock-up sustentam tanque e controle; dano mágico relevante.',
 'Elise':'Cocoon cria picks; forma aranha favorece pressão inicial e dano mágico.',
 'Fizz':'Mobilidade, evasão e ultimate de alvo favorecem assassinato e pick mágico.',
 'Galio':'Taunt, entrada com ultimate e proteção de aliado no kit 7.18; iniciação coletiva e linha de frente.',
 'Gnar':'Forma Mega inicia lutas e oferece resistência; forma Mini aplica dano físico.',
 'Gragas':'Deslocamentos, colisão e resistência permitem iniciar ou afastar ameaças de aliados.',
 'Janna':'Escudo, tornado e ultimate priorizam proteção e desengage; dano não é fonte principal.',
 'JarvanIV':'Combo de entrada e arena favorecem engage, teamfight e dano físico na linha de frente.',
 'Jax':'Ataques repetidos e resistência no duelo favorecem escala e pressão lateral.',
 'Jayce':'Forma canhão e aceleração permitem poke físico; pressão de rota e lateral.',
 'Karma':'Escudo e aceleração protegem aliados; projéteis sustentam poke mágico.',
 'Kennen':'Entrada móvel e ultimate em área favorecem engage e teamfight mágico.',
 'Khazix':'Isolamento, salto e invisibilidade favorecem picks e dano físico de carry.',
 'KogMaw':'Amplificação de ataques e alcance favorecem carry de escala; composição considera sua fonte física sustentada.',
 'LeeSin':'Mobilidade e deslocamento do ultimate criam picks e pressão inicial.',
 'Leona':'Múltiplos controles e resistência favorecem iniciação e linha de frente.',
 'Lulu':'Escudo, polimorfia e crescimento do aliado priorizam peel e escala de carries; AP_DAMAGE removido.',
 'Malzahar':'Supressão cria picks; zonas e dano mágico sustentam controle.',
 'Maokai':'Root, deslocamento e ultimate de área favorecem engage, controle e proteção.',
 'Nasus':'Acúmulo no Q, resistência e pressão em estruturas favorecem escala e lateral.',
 'Orianna':'Bola, escudo e ultimate em área sustentam controle, escala e teamfight mágico.',
 'Rakan':'Avanço, charm e escudos permitem iniciação coletiva e proteção móvel.',
 'RekSai':'Kit após atualização de 2017 mantém entrada, knock-up e pressão física inicial; não usa o antigo ultimate global.',
 'Ryze':'Dano mágico escalável e root favorecem controle e pressão lateral.',
 'Sejuani':'Resistência e controles encadeados favorecem engage e tanque coletivo.',
 'Shen':'Proteção global, taunt e bloqueio de ataques conectam lateral e ajuda ao time.',
 'Syndra':'Esferas, stun e dano concentrado favorecem controle e pick mágico.',
 'Taliyah':'Parede e deslocamentos limitam caminhos e criam picks mágicos.',
 'Taric':'Cura, escudo, stun e invulnerabilidade favorecem proteção e lutas coletivas.',
 'Thresh':'Gancho, lanterna e deslocamento sustentam pick, peel e controle.',
 'Tristana':'Alcance crescente, salto e ataques físicos favorecem carry de escala.',
 'Trundle':'Pilar cria bloqueio e proteção; roubo de resistências e ataques favorecem linha de frente e lateral.',
 'Twitch':'Invisibilidade e ataques atravessando alvos favorecem carry físico de lutas coletivas.',
 'Varus':'Projéteis e ultimate de enraizamento favorecem poke físico e controle.',
 'Xayah':'Ataques e penas favorecem dano físico em área, escala e carry.',
}
definitions={}
for line in (ROOT/'src/data/champions.ts').read_text(encoding='utf-8').splitlines():
    if line.strip().startswith("['"):
        cid,name,tags=ast.literal_eval(line.strip().rstrip(','))
        definitions[cid]=(name,tags)
reviews=[]
new={'Chogath','Maokai','Trundle','Khazix','RekSai','Fizz','KogMaw','Twitch','Janna','Taric','Shen','Nasus','Jax','Karma'}
for cid, reason in sorted(reasons.items()):
    kit=read(f'champion-kits/{cid}.json')['data'][cid]
    reviews.append(dict(championId=cid, patch='7.18.1', tags=definitions[cid][1],
        change='added champion' if cid in new else 'removed AP_DAMAGE' if cid=='Lulu' else 'reviewed; retained',
        rationale=reason, sourceUrl=f'https://ddragon.leagueoflegends.com/cdn/7.18.1/data/en_US/champion/{cid}.json',
        localSource=f'data/research/worlds-2017/champion-kits/{cid}.json', abilities=[s['name'] for s in kit['spells']],
        note='Editorial composition interpretation; not an official Riot classification or a rating input.'))
write(OUT/'tag-review.json', reviews)
old=json.loads((ROOT/'public/assets/portrait-credits.json').read_text(encoding='utf-8'))
portraits=json.loads((ROOT/'src/data/portraits.json').read_text(encoding='utf-8'))
write(OUT/'portrait-manifest.json', [dict(player=p['playerName'], playerId=p['id'], requestedYear=2017,
    status='historical portrait unavailable / not validated', selectedAsset=None, selectedCredit='Riot Games (champion fallback)',
    fallback=f"/assets/2017/splash/{p['championPool'][0]['championId']}.jpg",
    source=next((x['licensePage'] for x in old if x['name']==p['playerName']),None),
    knownArchiveFile=portraits.get(p['playerName']), knownArchiveYear={'Faker':2020,'Huni':2018}.get(p['playerName']),
    knownArchiveCredit={'Faker':'Fomos Esports','Huni':'Echo Fox'}.get(p['playerName']),
    usageNote='Existing archive retained in fixtures with its prior credits; not selected as a 2017 portrait. No new photograph downloaded.') for p in players])

claims=[
    dict(id='main-event-scope', claim='80 Main Event games; 800 player rows; patch 7.18; no play-ins.', kind='observed', sourceIds=['oe-2017','golgg-event'], confidence='high', limitation='The main OE download was discovered through a third-party configuration.'),
    dict(id='rosters-and-substitutes', claim='15 primary versions selected by most games per team/role; Blank 9, Haru 1, Rascal 1 retained in research.', kind='observed + selection rule', sourceIds=['oe-2017','golgg-players'], confidence='high', limitation='Administrative non-playing roster registrations were not fully revalidated.'),
    dict(id='summer-fallbacks', claim='Six fallback associations are observed in LCK Summer 2017, independently checked.', kind='observed', sourceIds=['oe-2017']+[f'golgg-summer-{p}' for p in ['Peanut','Cuzz','Ruler','CoreJJ','PraY']], confidence='high', limitation='Our cohort includes playoffs; consulted pages separate them. Selected fallback picks have identical counts.'),
    dict(id='kp-zero-kills', claim='KP includes zero for a team with zero kills; aggregated facts agree within display rounding.', kind='definition + validated observation', sourceIds=['oe-2017','golgg-players'], confidence='high', limitation='Mean per-game KP differs from aggregate K+A/team kills.'),
    dict(id='historical-art', claim='All 40 playable champions have base art and icons extracted from the official 7.18.1 archive.', kind='observed', sourceIds=['ddragon-7.18.1'], localEvidence='asset-manifest.json', confidence='high', limitation='Public distribution does not imply an unrestricted reuse license.'),
    dict(id='portraits', claim='2017 photos were not validated; champion art fallback is used for all 15 versions.', kind='implementation + evidence gap', sourceIds=[], localEvidence='portrait-manifest.json', confidence='high for implemented fallback; historical-photo availability unresolved', limitation='Absence of a verified photo here does not mean no historical photo exists.'),
    dict(id='ratings', claim='Ratings are descriptive estimates using explicit role/event normalization and sample regression; no official or reputation-based scores.', kind='model design', sourceIds=['oe-2017'], localEvidence='normalization.json', confidence='experimental', limitation='No held-out predictive calibration, opposition-strength model or direct utility metrics.'),
    dict(id='simulation', claim='10,000 campaigns with fixed seed and production engine; balance dominance is reported without modifying ratings.', kind='local simulation', sourceIds=[], localEvidence='simulation.json', confidence='reproducible under fixed model', limitation='Uniform bot choices and only three opponent rosters; not human preference or historical title probability.'),
]
for eid,e in evidence.items():
    claims.append(dict(id=eid, claim=f"{e['player']} / {e['champion']}: {e['stats']['games']} observed games in {e['event']}; derived rating {e['rating']}.",
        kind='observed association + derived estimate', sourceIds=e['sourceIds'], localEvidence=f'evidence.json#{eid}',
        confidence=e['confidenceScore'], limitation='Confidence is a shrinkage weight, not probability that the rating is correct.'))
write(OUT/'claim-ledger.json',dict(accessedAt='2026-09-07', claims=claims,
    sources={sid:dict(title=sid, publisher=s['publisher'], publicationDate=s.get('publicationDate'),url=s['url'], accessNotes=s.get('note','')) for sid,s in sources.items()},
    internalResearchReferences={'golgg-event':['turn33view0'],'golgg-players':['turn34view0','turn35view1'],
       'golgg-Faker':['turn33view1'],'golgg-summer-Peanut':['turn35view2'],'golgg-summer-Ruler':['turn36view0'],
       'golgg-summer-CoreJJ':['turn36view1'],'golgg-summer-Cuzz':['turn36view2'],'golgg-summer-PraY':['turn37view0']},
    stoppingReason='All requested playable slots have observed evidence; independent aggregate/fallback checks and official versioned assets obtained. Remaining limits concern historical photos and causal/predictive rating calibration; further broad searches would not resolve those within this model.'))

report=(ROOT/'docs/research/worlds-2017-methodology.md').read_text(encoding='utf-8')+'\n'
report+='## Elencos e participação efetiva\n\n'
report+=table(['Equipe','Posição','Jogador','Jogos','Vitórias','Versão inicial'],
    [(r['team'],r['role'],r['player'],r['games'],r['wins'],'Sim' if r['playable'] else 'Substituto documentado') for r in roster])
report+='## Estatísticas gerais dos 15 jogadores\n\nValores observados agregados do Main Event; dano relativo e KP em porcentagem. Fonte das linhas: '+link('oe-2017',"Oracle’s Elixir, snapshot")+'.\n\n'
report+=table(['Jogador','J/V/D','K/D/A','KDA','DPM','Dano %','KP %','GD15','CSD15','XPD15'],[
    (p['playerName'],f"{a['games']}/{a['wins']}/{a['losses']}",f"{a['kills']}/{a['deaths']}/{a['assists']}",fmt(a['kda']),fmt(a['dpm']),fmt(a['damageshare']*100),fmt(a['kp']*100),fmt(a['golddiffat15']),fmt(a['csdiffat15']),fmt(a['xpdiffat15']))
    for p in players for a in stats if a['event']=='WORLDS_2017' and a['player']==p['playerName']])
report+='## Pools jogáveis e evidência por slot\n\nWR e KDA referem-se ao evento da linha. “W” é a contagem de jogos no Worlds; complementos têm W=0 e mostram a amostra Summer em N. Confiança é o peso de regressão, não certeza histórica. Todos os cálculos completos estão em `evidence.json`; o ID é `playerId-gN`.\n\n'
for p in players:
    report+=f"### {p['playerName']} — {p['team']} — {p['role']} — Worlds 2017\n\n"
    report+=f"Versão `{p['id']}`. Conferência geral: {link('golgg-'+p['playerName'],'Games of Legends')}.\n\n"
    cells=[]
    for slot in p['championPool']:
        e=evidence[slot['evidenceId']]; s=e['stats']; conf=e['confidenceScore']
        label='Alta' if conf>=.6 else 'Média' if conf>=.35 else 'Baixa'
        cells.append((f"G{slot['game']}",e['champion'],e['firstAppearance'][:10],e['worldsGames'],s['games'],f"{100*s['winRate']:.1f}%",fmt(s['kda']),fmt(s['golddiffat15']),slot['rating'],f'{label} ({conf:.3f})',slot['source']))
    report+=table(['Slot','Campeão','1ª aparição','W','N','WR','KDA','GD15','Rating','Confiança','Fonte'],cells)
    excluded=[a['champion'] for a in all_champions if a['event']=='WORLDS_2017' and a['player']==p['playerName'] and a['champion'] not in [evidence[s['evidenceId']]['champion'] for s in p['championPool']]]
    if excluded: report+='Picks do Worlds fora dos cinco selecionados: '+', '.join(excluded)+'. Permanecem na pesquisa; exclusão pela regra de frequência/desempate.\n\n'
    if any(s['source']=='SEASON_DATA' for s in p['championPool']): report+='Complementos conferidos em '+link('golgg-summer-'+p['playerName'],'Games of Legends — Summer')+'.\n\n'

balance='# Draft Lendas — balanceamento e simulação de 2017\n\nResultados do método `worlds-2017-v1.0.0`. Números gerados localmente pelo motor do projeto; não representam probabilidades históricas. Nenhum rating foi alterado em função destes resultados.\n\n'
balance+='## Comparação por posição\n\nG1, média de G1–G3 e média de G1–G5 usam os ratings individuais. DP é o desvio populacional dos cinco slots, não incerteza estatística da nota.\n\n'
for role in WEIGHTS:
    balance+=f'### {role}\n\n'
    balance+=table(['Jogador','G1','BO3','BO5','DP','Mais forte','Mais fraco'],[(p['player'],p['g1'],fmt(p['bo3']),fmt(p['bo5']),fmt(p['sd']),', '.join(definitions[c][0] for c in p['strongest']),', '.join(definitions[c][0] for c in p['weakest'])) for p in sim['comparisons'] if p['role']==role])
balance+='## Dominância individual\n\nA domina B quando não é inferior em G1, média BO3 e média BO5, e é superior em pelo menos uma dessas medidas. Isso não implica vencer cada G isolado nem ser melhor em toda composição.\n\n'
balance+=table(['Jogador','Domina nas três medidas'],[(names[r['playerId']],', '.join(names[i] for i in r['dominates']) or 'Nenhum') for r in sim['dominance']])
balance+='Pelas notas individuais, CuVee, Ambition, Bdd, PraY e CoreJJ dominam as outras duas opções da própria posição. Portanto, a hipótese de haver sempre uma troca clara entre G1 e séries longas **não foi confirmada** neste recorte. A inclusão de tags modifica parte dessa conclusão.\n\n'
balance+='## Efeito da composição: enumeração exaustiva\n\nPara cada posição, mantivemos todas as 81 combinações possíveis das outras quatro posições. Trocamos apenas o jogador da posição examinada e calculamos a força real de equipe (80% rating, 20% composição). Cada célula informa quantos contextos o jogador lidera estritamente; empates na liderança aparecem entre parênteses. São comparações de força média, não cálculos exatos de chance de ganhar uma série.\n\n'
balance+=table(['Jogador','G1 / 81','BO3 / 81','BO5 / 81'],[(names[r['playerId']],*[f"{r['strictBest'][k]} ({r['tiedBest'][k]} emp.)" for k in ['g1','bo3','bo5']]) for r in sim['compositionContexts']])
balance+='Faker lidera 36/81 contextos de G1 e 24/81 de BO5, apesar da dominância individual de Bdd. Khan também pode superar CuVee com a composição. CoreJJ lidera todos os contextos de G1 e BO3; PraY lidera todos os de BO3. Huni, Crown, Bang e Wolf não lideram nenhum dos três horizontes nos contextos enumerados. Isso sinaliza opções pouco competitivas nesta versão; não justifica editar suas estatísticas.\n\n'
balance+='## 10.000 campanhas completas\n\n'
balance+=f"Seed `{sim['seed']}`; escolhas uniformes e independentes entre as três opções de cada posição. O motor real foi executado até eliminação ou título, incluindo recap e seu consumo de RNG: {sim['seriesTotal']:,} séries e {sim['gamesTotal']:,} partidas. Oponentes são SKT, SSG e LZ; voltam ao sorteio após esgotar os três elencos.\n\n"
balance+=table(['Métrica','Resultado'],[(f'Força média G{i+1}',fmt(x)) for i,x in enumerate(sim['averageByGame'])]+[
    ('Força média BO3',fmt(sim['averageBO3'])),('Força média BO5 / equipe',fmt(sim['averageBO5'])),
    ('Força média dos jogos efetivamente disputados',fmt(sim['averageActuallyPlayed'])),
    ('Taxa de título',f"{sim['championshipRate']*100:.2f}%"),
    ('Margem binomial aproximada de 95% na taxa de título',f"±{sim['binomial95HalfWidth']*100:.2f} ponto percentual")])
balance+='A margem representa apenas erro Monte Carlo sob esse modelo fixo. Não inclui incerteza de ratings, dados, dependência entre jogadores ou hipóteses do jogo. G1–G5 e médias BO3/BO5 são calculados para cada draft antes do torneio, incluindo jogos que talvez não sejam disputados.\n\n'
balance+=table(['Resultado','Campanhas'],sim['outcomes'].items())
balance+='## Ofertas e escolhas\n\nTodas as versões são oferecidas em 100% dos drafts da posição, porque há apenas um ano/região e três opções fixas. A seleção fica próxima de um terço por construção; não demonstra preferência humana. Títulos condicionais mostram somente as campanhas aleatórias em que aquela versão foi escolhida.\n\n'
balance+=table(['Jogador','Ofertado','Selecionado','Aparição','Títulos se escolhido'],[(names[r['playerId']],r['offered'],r['selected'],f"{r['appearanceRate']*100:.2f}%",f"{r['conditionalTitleRate']*100:.2f}%") for r in sim['players']])
balance+='Reprodução: `npm run data:simulate`. Dados completos: `data/research/worlds-2017/simulation.json`. Método, fontes e pools: [relatório de pesquisa](worlds-2017-lck-research.md). A simulação não modifica dados de produção.\n'
(ROOT/'docs/worlds-2017-balance.md').write_text(balance,encoding='utf-8')
report+='## Balanceamento e simulação\n\n'+balance[balance.index('## Comparação por posição'):].replace('[relatório de pesquisa](worlds-2017-lck-research.md)','este relatório')+'\n'
report+='## Verificação e trilha de auditoria\n\n'
validation=read('validation.json')
report+=f"Conferidos {validation['playerFactsChecked']} fatos de agregados e {validation['championFactsChecked']} fatos de associações com gol.gg, sem divergência nas tolerâncias declaradas. O espelho OE coincide nas 800 linhas para os campos numéricos conferidos. Os testes históricos também validam integridade dos assets, cronologia, origem de cada pick e elencos.\n\n"
report+='Comandos e resultados finais de verificação ficam em `data/research/worlds-2017/build-verification.json`. Para alterações futuras, os comandos precisam ser executados novamente; este registro descreve o snapshot entregue.\n\n'
report+=table(['Arquivo','Finalidade'],[
    ('matches.json','Recorte congelado para reprodução offline'),('player-stats.json','Agregados por jogador/evento'),
    ('player-champion-stats.json','Todos os picks, não só os cinco selecionados'),('evidence.json','Componentes, rating, confiança e IDs de partidas de cada slot'),
    ('normalization.json','Pesos e referências por evento/posição/campeão'),('rosters.json','Titulares e substitutos que jogaram'),
    ('crosschecks.json / validation.json','Conferência independente e diferenças de aliases'),('sources.json','URLs, editoras e hashes dos originais'),
    ('asset-manifest.json / champion-kits/','Arquivo histórico e itens extraídos'),('portrait-manifest.json','Lacunas, fotos de arquivo e fallback'),
    ('tag-review.json','Interpretações de composição dos kits 7.18'),('simulation.json','10.000 campanhas e todas as comparações'),
    ('claim-ledger.json','Afirmações, fontes e limitações')])
report+='## Referências rastreáveis\n\nConsulta em 7 de setembro de 2026; data de publicação dos snapshots estatísticos não informada. Estatísticas correspondem à temporada 2017. URLs individuais de Worlds servem como referência de auditoria; a validação completa de agregados foi feita pela tabela geral, e todos os complementos pelas páginas Summer indicadas.\n\n'
report+=table(['ID','Editora / fonte','URL','Observação'],[(sid,s['publisher'],link(sid,'Abrir'),s.get('note','')) for sid,s in sources.items() if sid!='riot-rosters'])
(ROOT/'docs/worlds-2017-lck-research.md').write_text(report,encoding='utf-8')
print(f'Wrote research report ({len(report.split())} words), balance report, tag and portrait manifests.')
