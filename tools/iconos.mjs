// Extrae de game-icons.net (CC BY 3.0, vía @iconify-json/game-icons) solo los iconos que usa la app.
// Uso: node tools/iconos.mjs  → web/src/ui/gameIcons.js
import fs from 'node:fs';
import { createRequire } from 'node:module';
const ic = createRequire(import.meta.url)('@iconify-json/game-icons/icons.json');
const USO = {
  // tipos de daño
  acido: 'acid', contundente: 'hammer-drop', cortante: 'broadsword', frio: 'frozen-orb', fuego: 'fire', fuerza: 'magic-swirl',
  necrotico: 'death-skull', perforante: 'arrowhead', psiquico: 'brain', radiante: 'sun-radiations', relampago: 'lightning-arc',
  trueno: 'sound-waves', veneno: 'poison-bottle', curacion: 'heart-plus',
  // clases
  barbaro: 'crossed-axes', bardo: 'lyre', brujo: 'warlock-eye', clerigo: 'holy-symbol', druida: 'oak-leaf', explorador: 'bow-arrow',
  guerrero: 'crossed-swords', hechicero: 'bolt-spell-cast', mago: 'wizard-staff', monje: 'fist', paladin: 'sword-brandish', picaro: 'hood',
  // subclases con motivo propio
  adivino: 'crystal-ball', evocador: 'fire-bowl', abjurador: 'shield-reflect', ilusionista: 'shadow-follower', draconica: 'dragon-head',
  mecanica: 'cog', aberrante: 'tentacle-strike', salvaje: 'sparkles', celestial: 'angel-wings', infernal: 'pentagram-rose', feerico: 'fairy-wand',
  luz: 'sun', vida: 'heart-plus', luna: 'night-sky', estrellas: 'night-sky', tierra: 'tree-branch', sombra: 'shadow-follower',
  // interfaz
  // objetos mágicos (por tipo), biblioteca y bestiario
  o_arma: 'sword-hilt', o_armadura: 'breastplate', o_anillo: 'ring', o_baston: 'bo', o_maravilloso: 'gem-pendant', o_pergamino: 'tied-scroll',
  o_pocion: 'potion-ball', o_vara: 'orb-wand', o_varita: 'crystal-wand', sintonia: 'linked-rings', cofre: 'open-treasure-chest',
  biblioteca: 'bookshelf', dote: 'laurel-crown', trasfondo: 'knapsack', subclase: 'upgrade', bestia: 'beast-eye', criatura: 'spiked-dragon-head',
  eficaz: 'target-arrows', inmune: 'checked-shield', vulnerable: 'cracked-shield',
  d20: 'dice-twenty-faces-twenty', dados: 'rolling-dices', libro: 'spell-book', vela: 'candle-light', glosario: 'scroll-unfurled', ojo: 'all-seeing-eye',
};
const out = {};
for (const [k, n] of Object.entries(USO)) { if (!ic.icons[n]) throw new Error('No existe ' + n); out[k] = ic.icons[n].body; }
fs.writeFileSync(new URL('../web/src/ui/gameIcons.js', import.meta.url),
  `// Generado por tools/iconos.mjs. Iconos de game-icons.net (Lorc, Delapouite y otros), licencia CC BY 3.0.\nexport const GI = ${JSON.stringify(out)};\n`);
console.log(Object.keys(out).length, 'iconos,', Math.round(fs.statSync(new URL('../web/src/ui/gameIcons.js', import.meta.url)).size / 1024), 'kB');
