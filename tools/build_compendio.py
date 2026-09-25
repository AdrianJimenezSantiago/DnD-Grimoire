"""Genera web/public/data/compendio.json:
 - nombres oficiales y datos técnicos del Manual del Jugador 2024 (tools/manual_datos.json: solo datos, sin textos),
 - texto en inglés del SRD 5.2 (CC-BY 4.0, vía Open5e) cuando existe,
 - traducciones propias de tools/srd_traducciones.py.
"""
import json, re, sys, unicodedata, difflib
sys.path.insert(0, 'tools')
from srd_nombres import N
from srd_traducciones import T

def n(s): return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).strip()
facts = json.load(open('tools/manual_datos.json'))
srd = json.load(open('tools/srd52-spells-open5e.json'))
CLS = {'wizard':'Mago','sorcerer':'Hechicero','bard':'Bardo','druid':'Druida','cleric':'Clérigo','warlock':'Brujo','ranger':'Explorador','paladin':'Paladín'}
ESC = {'abjuration':'Abjuración','conjuration':'Conjuración','divination':'Adivinación','enchantment':'Encantamiento','evocation':'Evocación','illusion':'Ilusionismo','necromancy':'Nigromancia','transmutation':'Transmutación'}
FORZADOS = {'Shillelagh':'Shillelagh','Guidance':'Guía','True Strike':'Impacto certero','Mending':'Reparar','Enthrall':'Embelesar','Zone of Truth':'Zona de la verdad','Blink':'Desplazamiento',
            'Faithful Hound':'Mastín fiel de Mordenkainen','Transport via Plants':'Viajar mediante plantas'}
EN = {'Amistad':'Friends','Armadura de Agathys':'Armor of Agathys','Aura de pureza':'Aura of Purity','Aura de vitalidad':'Aura of Vitality','Brazos de Hadar':'Arms of Hadar',
 'Carcaj veloz':'Swift Quiver','Castigo abrumador':'Staggering Smite','Castigo atronador':'Thunderous Smite','Castigo cegador':'Blinding Smite','Castigo desterrador':'Banishing Smite',
 'Castigo furioso':'Wrathful Smite','Círculo de poder':'Circle of Power','Conjurar descarga de proyectiles':'Conjure Barrage','Conjurar lluvia de flechas':'Conjure Volley',
 'Cordón de flechas':'Cordon of Arrows','Duelo forzado':'Compelled Duel','Enredadera':'Grasping Vine','Estática sináptica':'Synaptic Static','Fingir muerte':'Feign Death',
 'Flecha de relámpago':'Lightning Arrow','Fragmento mental':'Mind Sliver','Fuente de luz lunar':'Fount of Moonlight','Golpe de viento acerado':'Steel Wind Strike',
 'Guardia de cuchillas':'Blade Ward','Hambre de Hadar':'Hunger of Hadar','Invocar autómata':'Summon Construct','Invocar bestia':'Summon Beast','Invocar celestial':'Summon Celestial',
 'Invocar elemental':'Summon Elemental','Invocar feérico':'Summon Fey','Invocar infernal':'Summon Fiend','Invocar muerto viviente':'Summon Undead','Invocar aberración':'Summon Aberration',
 'Látigo de espinas':'Thorn Whip','Manto del cruzado':"Crusader's Mantle",'Nube de dagas':'Cloud of Daggers','Ola destructora':'Destructive Wave',
 'Palabra de poder: fortalecer':'Power Word Fortify','Palabra de resplandor':'Word of Radiance','Presencia regia de Yolande':"Yolande's Regal Presence",'Puerta arcana':'Arcane Gate',
 'Rayo de hechicería':'Witch Bolt','Sentidos de la bestia':'Beast Sense','Tañido por los muertos':'Toll the Dead','Telepatía':'Telepathy','Tormenta de espinas':'Hail of Thorns',
 'Tormenta resplandeciente de Jallarzi':"Jallarzi's Storm of Radiance",'Tronar':'Thunderclap','Vigor arcano':'Arcane Vigor','Arma elemental':'Elemental Weapon',
 'Corona de la locura':'Crown of Madness','Caldero burbujeante de Tasha':"Tasha's Bubbling Cauldron"}

def dur(d):
    d = re.sub(r'^Concentración,\s*h', 'H', d.strip())
    d = re.sub(r'(\d+) minutos?', r'\1 min', d); d = re.sub(r'(\d+) horas?', r'\1 h', d)
    return d
def tiempo(t):
    t = t.split(',')[0].replace('adicionál', 'adicional'); t = re.sub(r'\s*Tiempo de lanzamiento:.*$', '', t)
    return t.strip()
def coste(m): return m if re.search(r'\d[\d.]*\s*po\b', m) else ''
def fields(f):
    return {'es': f['nombre'], 'l': f['nivel'], 'esc': f['escuela'], 't': tiempo(f['tiempo']), 'a': f['alcance'], 'du': dur(f['duracion']),
            'co': f['comp'], 'cs': coste(f['material']), 'ri': int(f['ritual']), 'c': int(f['conc']), 'cl': f['clases']}

byname = {(n(f['nombre']), f['nivel']): f for f in facts}
used, out = set(), []
srd_rows = [r['fields'] | {'pk': r['pk']} for r in srd]
pending = []
for x in srd_rows:
    f = None
    if x['name'] in FORZADOS: f = byname.get((n(FORZADOS[x['name']]), x['level']))
    if not f: f = byname.get((n(N.get(x['name'], x['name'])), x['level']))
    if f and id(f) not in used: used.add(id(f)); out.append((x, f))
    else: pending.append(x)
left = [f for f in facts if id(f) not in used]
for x in pending:
    cands = [f for f in left if f['nivel'] == x['level'] and f['escuela'] == ESC[x['school']]]
    best = max(cands, key=lambda f: difflib.SequenceMatcher(None, n(f['nombre']), n(N.get(x['name'], x['name']))).ratio())
    left.remove(best); out.append((x, best))
res = []
for x, f in out:
    e = {'k': x['pk'], 'en': x['name'], **fields(f), 'd': x['desc'].strip(), 'h': (x['higher_level'] or '').strip()}
    if x['name'] in T: e['dEs'], e['hEs'] = T[x['name']]
    res.append(e)
falta = [f['nombre'] for f in left if f['nombre'] not in EN]
assert not falta, f'sin nombre inglés: {falta}'
for f in left:
    slug = n(f['nombre']).replace(' ', '-')
    res.append({'k': 'phb-2024_' + slug, 'en': EN[f['nombre']], **fields(f), 'd': '', 'h': '', 'phb': 1})
res.sort(key=lambda e: (e['l'], n(e['es'])))
json.dump({'fuente': 'Nombres y datos técnicos: Manual del Jugador 2024. Textos en inglés: System Reference Document 5.2, Wizards of the Coast, CC-BY 4.0 (vía Open5e).', 'conjuros': res},
          open('web/public/data/compendio.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import os
print(len(res), 'conjuros;', sum(1 for e in res if e.get('phb')), 'solo del manual;', os.path.getsize('web/public/data/compendio.json') // 1024, 'KB')
chk = {e['en']: e for e in res}
for en in ['Shield', 'Counterspell', 'Tiny Hut', 'Mind Sliver', 'Toll the Dead', 'Cloud of Daggers', 'Fog Cloud', 'Blink', 'Shillelagh', 'Mending']:
    e = chk[en]; print(f"  {en:18} → {e['es']:28} {e['l']} {e['esc']:13} {e['t']:18} {e['a']:22} {e['du']:14} {e['co']} {'R' if e['ri'] else ''}{'C' if e['c'] else ''} {','.join(e['cl'])}")
print('tiempos', sorted({e['t'] for e in res})); print('duraciones', sorted({e['du'] for e in res}))
