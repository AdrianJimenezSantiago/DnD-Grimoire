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
  // subclases: una por subclase del Manual del Jugador y de Héroes de Faerûn, todas distintas (ver domain/clases2024.js → TEMAS)
  arbol: 'tree-roots', berserker: 'axe-sword', corazon: 'bear-face', fanatico: 'thor-hammer',
  danza: 'ballerina-shoes', saber: 'scroll-quill', glamour: 'crown', valor: 'round-shield', lunabardo: 'moon-orbit',
  celestial: 'angel-wings', feerico: 'fairy-wand', infernal: 'pentagram-rose', primigenio: 'brain-tentacle',
  guerra: 'sword-clash', luz: 'sun', vida: 'heart-wings', engano: 'domino-mask', conocimiento: 'open-book',
  luna: 'wolf-howl', tierra: 'tree-branch', estrellas: 'star-formation', mar: 'big-wave',
  acechador: 'night-vision', cazador: 'archery-target', errante: 'fairy', bestias: 'wolf-head', invernal: 'snowflake-2',
  caballero: 'rune-sword', campeon: 'heavy-fighter', psionico: 'psychic-waves', maestro: 'chess-knight', abanderado: 'flying-flag',
  aberrante: 'tentacle-strike', salvaje: 'sparkles', draconica: 'dragon-head', mecanica: 'cog', fuegomagico: 'fire-silhouette',
  abjurador: 'shield-reflect', adivino: 'crystal-ball', evocador: 'fire-bowl', ilusionista: 'ghost-ally', hojacantante: 'sword-spin',
  manoabierta: 'open-palm', misericordia: 'hand-bandage', sombra: 'hooded-figure', elementos: 'fire-punch',
  entrega: 'holy-grail', gloria: 'laurels', antiguos: 'vine-flower', venganza: 'bleeding-eye', genios: 'whirlwind',
  asesino: 'cloak-dagger', embaucador: 'magic-palm', ladron: 'lockpicks', rebanaalmas: 'spectre', vastago: 'skull-crossed-bones',
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
