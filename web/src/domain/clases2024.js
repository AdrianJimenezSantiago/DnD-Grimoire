import { norm } from '../core/util.js';
import { competencia, modOf, nivelDe } from './reglas2024.js';
import { varianteDe } from './variantes.js';
import { cdManiobras, dadoSupremacia } from './maniobras.js';

const ASI = 'Mejora de característica', EPICO = 'Don épico', SUB = 'Rasgo de subclase';

export const CLASES_INFO = {
  'Bárbaro': { dg: 12, salv: ['fue', 'con'], prio: ['fue', 'con', 'des', 'sab', 'car', 'int'], rasgos: {
    1: ['Defensa sin armadura', 'Furia', 'Maestría con armas'], 2: ['Ataque temerario', 'Sentir el peligro'], 3: ['Conocimiento primigenio', 'Subclase de bárbaro'],
    4: [ASI], 5: ['Ataque adicional', 'Movimiento rápido'], 6: [SUB], 7: ['Instinto salvaje', 'Salto instintivo'], 8: [ASI], 9: ['Golpe brutal'], 10: [SUB],
    11: ['Furia implacable'], 12: [ASI], 13: ['Golpe brutal mejorado'], 14: [SUB], 15: ['Furia persistente'], 16: [ASI], 17: ['Golpe brutal mejorado'],
    18: ['Poderío indómito'], 19: [EPICO], 20: ['Campeón primordial'] } },
  'Bardo': { dg: 8, salv: ['des', 'car'], prio: ['car', 'des', 'con', 'sab', 'int', 'fue'], rasgos: {
    1: ['Inspiración bárdica', 'Lanzamiento de conjuros'], 2: ['Aprendiz de mucho', 'Pericia'], 3: ['Subclase de bardo'], 4: [ASI], 5: ['Fuente de inspiración'],
    6: [SUB], 7: ['Contraencantamiento'], 8: [ASI], 9: ['Pericia'], 10: ['Secretos mágicos'], 12: [ASI], 14: [SUB], 16: [ASI], 18: ['Inspiración superior'],
    19: [EPICO], 20: ['Palabras de creación'] } },
  'Brujo': { dg: 8, salv: ['sab', 'car'], prio: ['car', 'con', 'des', 'sab', 'int', 'fue'], rasgos: {
    1: ['Invocaciones sobrenaturales', 'Magia del pacto'], 2: ['Astucia mágica'], 3: ['Subclase de brujo'], 4: [ASI], 6: [SUB], 8: [ASI], 9: ['Contactar patrón'],
    10: [SUB], 11: ['Arcanum místico (nivel 6)'], 12: [ASI], 13: ['Arcanum místico (nivel 7)'], 14: [SUB], 15: ['Arcanum místico (nivel 8)'], 16: [ASI],
    17: ['Arcanum místico (nivel 9)'], 19: [EPICO], 20: ['Maestro sobrenatural'] } },
  'Clérigo': { dg: 8, salv: ['sab', 'car'], prio: ['sab', 'con', 'fue', 'car', 'des', 'int'], rasgos: {
    1: ['Lanzamiento de conjuros', 'Orden divina'], 2: ['Canalizar divinidad'], 3: ['Subclase de clérigo'], 4: [ASI], 5: ['Abrasar muertos vivientes'], 6: [SUB],
    7: ['Golpes benditos'], 8: [ASI], 10: ['Intercesión divina'], 12: [ASI], 14: ['Golpes benditos mejorados'], 16: [ASI], 17: [SUB], 19: [EPICO],
    20: ['Intercesión divina mayor'] } },
  'Druida': { dg: 8, salv: ['int', 'sab'], prio: ['sab', 'con', 'des', 'int', 'car', 'fue'], rasgos: {
    1: ['Druídico', 'Lanzamiento de conjuros', 'Orden primigenia'], 2: ['Compañero salvaje', 'Forma salvaje'], 3: ['Subclase de druida'], 4: [ASI],
    5: ['Resurgimiento salvaje'], 6: [SUB], 7: ['Furia elemental'], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB], 15: ['Furia elemental mejorada'], 16: [ASI],
    18: ['Conjurar como bestia'], 19: [EPICO], 20: ['Archidruida'] } },
  'Explorador': { dg: 10, salv: ['fue', 'des'], prio: ['des', 'sab', 'con', 'fue', 'int', 'car'], rasgos: {
    1: ['Enemigo predilecto', 'Lanzamiento de conjuros', 'Maestría con armas'], 2: ['Estilo de combate', 'Explorador hábil'], 3: ['Subclase de explorador'],
    4: [ASI], 5: ['Ataque adicional'], 6: ['Errante'], 7: [SUB], 8: [ASI], 9: ['Pericia'], 10: ['Infatigable'], 11: [SUB], 12: [ASI], 13: ['Cazador persistente'],
    14: ['Velo de la naturaleza'], 15: [SUB], 16: [ASI], 17: ['Cazador preciso'], 18: ['Sentidos salvajes'], 19: [EPICO], 20: ['Azote de enemigos'] } },
  'Guerrero': { dg: 10, salv: ['fue', 'con'], prio: ['fue', 'con', 'des', 'sab', 'int', 'car'], rasgos: {
    1: ['Estilo de combate', 'Maestría con armas', 'Tomar aliento'], 2: ['Acción súbita (un uso)', 'Mente táctica'], 3: ['Subclase de guerrero'], 4: [ASI],
    5: ['Ataque adicional', 'Desplazamiento táctico'], 6: [ASI], 7: [SUB], 8: [ASI], 9: ['Indómito', 'Maestro táctico'], 10: [SUB], 11: ['Dos ataques adicionales'],
    12: [ASI], 13: ['Ataques estudiados', 'Indómito (dos usos)'], 14: [ASI], 15: [SUB], 16: [ASI], 17: ['Acción súbita (dos usos)', 'Indómito (tres usos)'],
    18: [SUB], 19: [EPICO], 20: ['Tres ataques adicionales'] } },
  'Hechicero': { dg: 6, salv: ['con', 'car'], prio: ['car', 'con', 'des', 'sab', 'int', 'fue'], rasgos: {
    1: ['Hechicería innata', 'Lanzamiento de conjuros'], 2: ['Fuente de magia', 'Metamagia'], 3: ['Subclase de hechicero'], 4: [ASI], 5: ['Recuperación mágica'],
    6: [SUB], 7: ['Encarnación mágica'], 8: [ASI], 10: ['Metamagia'], 12: [ASI], 14: [SUB], 16: [ASI], 17: ['Metamagia'], 18: [SUB], 19: [EPICO],
    20: ['Apoteosis arcana'] } },
  'Mago': { dg: 6, salv: ['int', 'sab'], prio: ['int', 'con', 'des', 'sab', 'car', 'fue'], rasgos: {
    1: ['Adepto en rituales', 'Lanzamiento de conjuros', 'Recuperación arcana'], 2: ['Académico'], 3: ['Subclase de mago'], 4: [ASI], 5: ['Memorizar conjuro'],
    6: [SUB], 8: [ASI], 10: [SUB], 12: [ASI], 14: [SUB], 16: [ASI], 18: ['Maestría sobre conjuros'], 19: [EPICO], 20: ['Conjuros característicos'] } },
  'Monje': { dg: 8, salv: ['fue', 'des'], prio: ['des', 'sab', 'con', 'fue', 'int', 'car'], rasgos: {
    1: ['Artes marciales', 'Defensa sin armadura'], 2: ['Concentración de monje', 'Metabolismo asombroso', 'Movimiento sin armadura'],
    3: ['Desviar ataques', 'Subclase de monje'], 4: ['Caída lenta', ASI], 5: ['Ataque adicional', 'Golpe aturdidor'], 6: ['Golpes potenciados', SUB], 7: ['Evasión'],
    8: [ASI], 9: ['Movimiento acrobático'], 10: ['Autorrestablecimiento', 'Concentración agudizada'], 11: [SUB], 12: [ASI], 13: ['Desviar energía'],
    14: ['Superviviente disciplinado'], 15: ['Concentración perfecta'], 16: [ASI], 17: [SUB], 18: ['Defensa superior'], 19: [EPICO], 20: ['Cuerpo y mente'] } },
  'Paladín': { dg: 10, salv: ['sab', 'car'], prio: ['fue', 'car', 'con', 'sab', 'des', 'int'], rasgos: {
    1: ['Imponer las manos', 'Lanzamiento de conjuros', 'Maestría con armas'], 2: ['Castigo de paladín', 'Estilo de combate'], 3: ['Canalizar divinidad', 'Subclase de paladín'],
    4: [ASI], 5: ['Ataque adicional', 'Corcel fiel'], 6: ['Aura de protección'], 7: [SUB], 8: [ASI], 9: ['Abjurar de los enemigos'], 10: ['Aura de coraje'],
    11: ['Golpes radiantes'], 12: [ASI], 14: ['Toque reparador'], 15: [SUB], 16: [ASI], 18: ['Expansión de aura'], 19: [EPICO], 20: [SUB] } },
  'Pícaro': { dg: 8, salv: ['des', 'int'], prio: ['des', 'con', 'sab', 'int', 'car', 'fue'], rasgos: {
    1: ['Ataque furtivo', 'Jerga de ladrones', 'Maestría con armas', 'Pericia'], 2: ['Acción astuta'], 3: ['Puntería certera', 'Subclase de pícaro'], 4: [ASI],
    5: ['Esquiva asombrosa', 'Golpe astuto'], 6: ['Pericia'], 7: ['Evasión', 'Talentos fiables'], 8: [ASI], 9: [SUB], 10: [ASI], 11: ['Golpe astuto mejorado'],
    12: [ASI], 13: [SUB], 14: ['Golpes taimados'], 15: ['Mente escurridiza'], 16: [ASI], 17: [SUB], 18: ['Elusivo'], 19: [EPICO], 20: ['Golpe de suerte'] } },
};

const PHB = 'Manual del Jugador', HF = 'Héroes de Faerûn';
export const SUBCLASES = {
  'Bárbaro': [
    { nombre: 'Senda del Árbol del Mundo', re: /arbol/, libro: PHB, rasgos: { 3: ['Vitalidad del árbol'], 6: ['Ramas del árbol'], 10: ['Raíces apaleadoras'], 14: ['Viajar por el árbol'] } },
    { nombre: 'Senda del berserker', re: /berserk/, libro: PHB, rasgos: { 3: ['Frenesí'], 6: ['Furia irracional'], 10: ['Represalia'], 14: ['Presencia intimidante'] } },
    { nombre: 'Senda del corazón salvaje', re: /corazon/, libro: PHB, rasgos: { 3: ['Portavoz de los animales', 'Furia de lo salvaje'], 6: ['Aspecto de lo salvaje'], 10: ['Hablante de la naturaleza'], 14: ['Poder de lo salvaje'] },
      conjuros: { 3: ['Hablar con los animales', 'Sentidos de la bestia'], 10: ['Comunión con la naturaleza'] }, ritual: true },
    { nombre: 'Senda del fanático', re: /fanatic/, libro: PHB, rasgos: { 3: ['Furia divina', 'Guerrero de los dioses'], 6: ['Foco fanático'], 10: ['Presencia ferviente'], 14: ['Furia de los dioses'] } },
  ],
  'Bardo': [
    { nombre: 'Colegio de la danza', re: /danza/, libro: PHB, rasgos: { 3: ['Juego de pies deslumbrante'], 6: ['Juego de pies conjunto', 'Movimiento inspirador'], 14: ['Evasión dirigida'] } },
    { nombre: 'Colegio del conocimiento', re: /conocimiento/, libro: PHB, rasgos: { 3: ['Competencias adicionales', 'Palabras cortantes'], 6: ['Descubrimientos mágicos'], 14: ['Habilidad sin parangón'] } },
    { nombre: 'Colegio del glamour', re: /glamour/, libro: PHB, rasgos: { 3: ['Magia cautivadora', 'Manto de inspiración'], 6: ['Manto de majestad'], 14: ['Majestad inquebrantable'] },
      conjuros: { 3: ['Hechizar persona', 'Imagen múltiple'], 6: ['Orden imperiosa'] } },
    { nombre: 'Colegio del valor', re: /valor/, libro: PHB, rasgos: { 3: ['Entrenamiento marcial', 'Inspiración en combate'], 6: ['Ataque adicional'], 14: ['Magia de batalla'] } },
    { nombre: 'Colegio de la luna', re: /luna/, libro: HF, rasgos: { 3: ['Conocimientos primigenios', 'Inspiración lunar'], 6: ['Bendición de la luz lunar'], 14: ['Esplendor del ocaso'] },
      conjuros: { 6: ['Rayo de luna'] }, trucoExtra: { lista: 'Druida', fuente: 'Conocimientos primigenios' } },
  ],
  'Brujo': [
    { nombre: 'Patrón celestial', re: /celestial/, libro: PHB, rasgos: { 3: ['Conjuros del celestial', 'Luz sanadora'], 6: ['Alma radiante'], 10: ['Resiliencia celestial'], 14: ['Venganza ardiente'] },
      conjuros: { 3: ['Auxilio', 'Curar heridas', 'Llama sagrada', 'Luz', 'Restablecimiento menor', 'Saeta guía'], 5: ['Luz del día', 'Revivir'], 7: ['Guardián de la fe', 'Muro de fuego'], 9: ['Invocar celestial', 'Restablecimiento mayor'] } },
    { nombre: 'Patrón feérico', re: /feeric/, libro: PHB, rasgos: { 3: ['Conjuros del señor feérico', 'Pasos feéricos'], 6: ['Escape brumoso'], 10: ['Defensas seductoras'], 14: ['Magia embrujadora'] },
      conjuros: { 3: ['Calmar emociones', 'Dormir', 'Fuego feérico', 'Fuerza fantasmal', 'Paso brumoso'], 5: ['Crecimiento vegetal', 'Desplazamiento'], 7: ['Dominar bestia', 'Invisibilidad mejorada'], 9: ['Apariencia', 'Dominar persona'] } },
    { nombre: 'Patrón infernal', re: /infernal/, libro: PHB, rasgos: { 3: ['Bendición del Oscuro', 'Conjuros del infernal'], 6: ['La suerte del Oscuro'], 10: ['Resistencia infernal'], 14: ['Arrastrar por el infierno'] },
      conjuros: { 3: ['Manos ardientes', 'Orden imperiosa', 'Rayo abrasador', 'Sugestión'], 5: ['Bola de fuego', 'Nube apestosa'], 7: ['Escudo de fuego', 'Muro de fuego'], 9: ['Geas', 'Plaga de insectos'] } },
    { nombre: 'Patrón primigenio', re: /primigenio/, libro: PHB, rasgos: { 3: ['Conjuros del primigenio', 'Conjuros psíquicos', 'Mente iluminada'], 6: ['Combatiente clarividente'], 10: ['Escudo mental', 'Maleficio sobrenatural'], 14: ['Crear siervo'] },
      conjuros: { 3: ['Detectar pensamientos', 'Fuerza fantasmal', 'Risa horrible de Tasha', 'Susurros discordantes'], 5: ['Clarividencia', 'Hambre de Hadar'], 7: ['Confusión', 'Invocar aberración'], 9: ['Alterar los recuerdos', 'Telequinesis'] } },
  ],
  'Clérigo': [
    { nombre: 'Dominio de la guerra', re: /guerra/, libro: PHB, rasgos: { 3: ['Conjuros del dominio de la guerra', 'Golpe guiado', 'Sacerdote guerrero'], 6: ['Bendición del dios de la guerra'], 17: ['Avatar de la batalla'] },
      conjuros: { 3: ['Arma espiritual', 'Arma mágica', 'Escudo de fe', 'Saeta guía'], 5: ['Espíritus guardianes', 'Manto del cruzado'], 7: ['Escudo de fuego', 'Libertad de movimiento'], 9: ['Golpe de viento acerado', 'Inmovilizar monstruo'] } },
    { nombre: 'Dominio de la luz', re: /\bluz\b/, libro: PHB, rasgos: { 3: ['Conjuros del dominio de la luz', 'Fulgor protector', 'Resplandor del amanecer'], 6: ['Fulgor protector mejorado'], 17: ['Halo de luz'] },
      conjuros: { 3: ['Fuego feérico', 'Manos ardientes', 'Rayo abrasador', 'Ver invisibilidad'], 5: ['Bola de fuego', 'Luz del día'], 7: ['Muro de fuego', 'Ojo arcano'], 9: ['Escudriñar', 'Golpe flamígero'] } },
    { nombre: 'Dominio de la vida', re: /vida/, libro: PHB, rasgos: { 3: ['Conjuros del dominio de la vida', 'Discípulo de la vida', 'Preservar vida'], 6: ['Sanador bendito'], 17: ['Sanación suprema'] },
      conjuros: { 3: ['Auxilio', 'Bendición', 'Curar heridas', 'Restablecimiento menor'], 5: ['Palabra de curación en masa', 'Revivir'], 7: ['Aura de vida', 'Guarda contra la muerte'], 9: ['Curar heridas en masa', 'Restablecimiento mayor'] } },
    { nombre: 'Dominio del engaño', re: /engano/, libro: PHB, rasgos: { 3: ['Bendición del embaucador', 'Conjuros del dominio del engaño', 'Invocar duplicidad'], 6: ['Transposición del embaucador'], 17: ['Duplicidad mejorada'] },
      conjuros: { 3: ['Disfrazarse', 'Hechizar persona', 'Invisibilidad', 'Pasar sin rastro'], 5: ['Indetectable', 'Patrón hipnótico'], 7: ['Confusión', 'Puerta dimensional'], 9: ['Alterar los recuerdos', 'Dominar persona'] } },
    { nombre: 'Dominio del conocimiento', re: /conocimiento/, libro: HF, rasgos: { 3: ['Bendiciones del conocimiento', 'Conjuros del dominio del conocimiento', 'Magia mental'], 6: ['Mente ilimitada'], 17: ['Precognición divina'] },
      conjuros: { 3: ['Clavo mental', 'Detectar magia', 'Detectar pensamientos', 'Entender idiomas', 'Identificar', 'Orden imperiosa'], 5: ['Disipar magia', 'Don de lenguas', 'Indetectable'], 7: ['Confusión', 'Destierro', 'Ojo arcano'], 9: ['Conocer las leyendas', 'Escudriñar', 'Estática sináptica'] } },
  ],
  'Druida': [
    { nombre: 'Círculo de la luna', re: /luna/, libro: PHB, rasgos: { 3: ['Conjuros del círculo de la luna', 'Formas del círculo'], 6: ['Formas del círculo mejoradas'], 10: ['Paso de la luz lunar'], 14: ['Forma lunar'] },
      conjuros: { 3: ['Curar heridas', 'Rayo de luna', 'Voluta estelar'], 5: ['Conjurar animales'], 7: ['Fuente de luz lunar'], 9: ['Curar heridas en masa'] } },
    { nombre: 'Círculo de la tierra', re: /tierra/, libro: PHB, rasgos: { 3: ['Conjuros del círculo de la tierra', 'Ayuda de la tierra'], 6: ['Recuperación natural'], 10: ['Protección de la naturaleza'], 14: ['Santuario de la naturaleza'] },
      conjuros: { 3: ['Contorno borroso', 'Descarga de fuego', 'Manos ardientes'], 5: ['Bola de fuego'], 7: ['Marchitar'], 9: ['Muro de piedra'] },
      terrenos: {
        'Árido': { 3: ['Contorno borroso', 'Descarga de fuego', 'Manos ardientes'], 5: ['Bola de fuego'], 7: ['Marchitar'], 9: ['Muro de piedra'] },
        'Polar': { 3: ['Inmovilizar persona', 'Nube de oscurecimiento', 'Rayo de escarcha'], 5: ['Tormenta de aguanieve'], 7: ['Tormenta de hielo'], 9: ['Cono de frío'] },
        'Templado': { 3: ['Agarre electrizante', 'Dormir', 'Paso brumoso'], 5: ['Relámpago'], 7: ['Libertad de movimiento'], 9: ['Paso arbóreo'] },
        'Tropical': { 3: ['Rayo nauseabundo', 'Salpicadura ácida', 'Telaraña'], 5: ['Nube apestosa'], 7: ['Polimorfar'], 9: ['Plaga de insectos'] },
      } },
    { nombre: 'Círculo de las estrellas', re: /estrella/, libro: PHB, rasgos: { 3: ['Forma estelar', 'Mapa estelar'], 6: ['Presagio cósmico'], 10: ['Constelaciones centelleantes'], 14: ['Colmado de luz estelar'] },
      conjuros: { 3: ['Guía', 'Saeta guía'] } },
    { nombre: 'Círculo del mar', re: /\bmar\b/, libro: PHB, rasgos: { 3: ['Conjuros del círculo del mar', 'Ira de los mares'], 6: ['Afinidad acuática'], 10: ['Nacido de la tempestad'], 14: ['Obsequio oceánico'] },
      conjuros: { 3: ['Hacer añicos', 'Nube de oscurecimiento', 'Ola atronadora', 'Ráfaga de viento', 'Rayo de escarcha'], 5: ['Relámpago', 'Respirar bajo el agua'], 7: ['Controlar agua', 'Tormenta de hielo'], 9: ['Conjurar elemental', 'Inmovilizar monstruo'] } },
  ],
  'Explorador': [
    { nombre: 'Acechador en la penumbra', re: /acechador|penumbra/, libro: PHB, rasgos: { 3: ['Conjuros de acechador en la penumbra', 'Emboscador pavoroso', 'Visión en la umbra'], 7: ['Mente de hierro'], 11: ['Oleada del acechador'], 15: ['Esquiva de las sombras'] },
      conjuros: { 3: ['Disfrazarse'], 5: ['Truco de la cuerda'], 9: ['Terror'], 13: ['Invisibilidad mejorada'], 17: ['Apariencia'] } },
    { nombre: 'Cazador', re: /cazador/, libro: PHB, rasgos: { 3: ['El cazador y la presa', 'Sabiduría del cazador'], 7: ['Tácticas defensivas'], 11: ['El cazador experto y la presa'], 15: ['Defensa de cazador experto'] } },
    { nombre: 'Errante feérico', re: /errante/, libro: PHB, rasgos: { 3: ['Conjuros de errante feérico', 'Glamur sobrenatural', 'Golpes pavorosos'], 7: ['Giro seductor'], 11: ['Refuerzos feéricos'], 15: ['Errante brumoso'] },
      conjuros: { 3: ['Hechizar persona'], 5: ['Paso brumoso'], 9: ['Invocar feérico'], 13: ['Puerta dimensional'], 17: ['Engañar'] } },
    { nombre: 'Señor de las bestias', re: /bestias/, libro: PHB, rasgos: { 3: ['Compañero primigenio'], 7: ['Entrenamiento excepcional'], 11: ['Furia bestial'], 15: ['Compartir conjuros'] } },
    { nombre: 'Caminante invernal', re: /invernal/, libro: HF, rasgos: { 3: ['Conjuros de caminante invernal', 'Escarcha del cazador', 'Explorador gélido'], 7: ['Alma fortalecedora'], 11: ['Represalia escalofriante'], 15: ['Espectro congelado'] },
      conjuros: { 3: ['Cuchillo de hielo'], 5: ['Inmovilizar persona'], 9: ['Levantar maldición'], 13: ['Tormenta de hielo'], 17: ['Cono de frío'] } },
  ],
  'Guerrero': [
    { nombre: 'Caballero arcano', re: /arcan/, libro: PHB, prio: ['fue', 'int', 'con', 'des', 'sab', 'car'], rasgos: { 3: ['Lanzamiento de conjuros', 'Vínculo de guerra'], 7: ['Magia de guerra'], 10: ['Golpe sobrenatural'], 15: ['Carga arcana'], 18: ['Magia de guerra mejorada'] } },
    { nombre: 'Campeón', re: /campeon/, libro: PHB, rasgos: { 3: ['Atleta sobresaliente', 'Crítico mejorado'], 7: ['Estilo de combate adicional'], 10: ['Guerrero heroico'], 15: ['Crítico superior'], 18: ['Superviviente'] } },
    { nombre: 'Guerrero psiónico', re: /psionic/, libro: PHB, prio: ['fue', 'con', 'int', 'des', 'sab', 'car'], rasgos: { 3: ['Poder psiónico'], 7: ['Adepto telequinético'], 10: ['Mente robusta'], 15: ['Bastión de fuerza'], 18: ['Maestro telequinético'] } },
    { nombre: 'Maestro del combate', re: /maestro del combate|batalla/, libro: PHB, rasgos: { 3: ['Estudioso de la guerra', 'Supremacía en combate'], 7: ['Conoce a tu enemigo'], 10: ['Supremacía en combate mejorada'], 15: ['Incansable'], 18: ['Supremacía en combate definitiva'] } },
    { nombre: 'Abanderado', re: /abanderad/, libro: HF, prio: ['fue', 'con', 'car', 'des', 'sab', 'int'], rasgos: { 3: ['Caballero emisario', 'Recuperación grupal'], 7: ['Tácticas de equipo'], 10: ['Arenga súbita'], 15: ['Resistencia compartida'], 18: ['Comandante inspirador'] },
      conjuros: { 3: ['Entender idiomas'] }, ritual: true },
  ],
  'Hechicero': [
    { nombre: 'Hechicería aberrante', re: /aberrant/, libro: PHB, rasgos: { 3: ['Conjuros psiónicos', 'Habla telepática'], 6: ['Defensas psíquicas', 'Hechicería psiónica'], 14: ['Revelación en carne'], 18: ['Implosión deformadora'] },
      conjuros: { 3: ['Brazos de Hadar', 'Calmar emociones', 'Detectar pensamientos', 'Fragmento mental', 'Susurros discordantes'], 5: ['Hambre de Hadar', 'Recado'], 7: ['Invocar aberración', 'Tentáculos negros de Evard'], 9: ['Enlace telepático de Rary', 'Telequinesis'] } },
    { nombre: 'Hechicería de magia salvaje', re: /salvaje/, libro: PHB, rasgos: { 3: ['Mareas del caos', 'Sobrecarga de magia salvaje'], 6: ['Doblegar la suerte'], 14: ['Caos controlado'], 18: ['Sobrecarga domada'] } },
    { nombre: 'Hechicería dracónica', re: /dracon/, libro: PHB, rasgos: { 3: ['Conjuros dracónicos', 'Resistencia dracónica'], 6: ['Afinidad elemental'], 14: ['Alas de dragón'], 18: ['Compañero dragón'] },
      conjuros: { 3: ['Aliento de dragón', 'Alterar el propio aspecto', 'Orbe cromático', 'Orden imperiosa'], 5: ['Terror', 'Volar'], 7: ['Hechizar monstruo', 'Ojo arcano'], 9: ['Conocer las leyendas', 'Invocar dragón'] } },
    { nombre: 'Hechicería mecánica', re: /mecanic/, libro: PHB, rasgos: { 3: ['Conjuros mecánicos', 'Restablecer equilibrio'], 6: ['Bastión de la ley'], 14: ['Trance de orden'], 18: ['Cabalgata mecánica'] },
      conjuros: { 3: ['Alarma', 'Auxilio', 'Protección contra el bien y el mal', 'Restablecimiento menor'], 5: ['Disipar magia', 'Protección contra energía'], 7: ['Invocar autómata', 'Libertad de movimiento'], 9: ['Muro de fuerza', 'Restablecimiento mayor'] } },
    { nombre: 'Hechicería del fuego mágico', re: /fuego magico/, libro: HF, rasgos: { 3: ['Conjuros del fuego mágico', 'Ráfaga de fuego mágico'], 6: ['Absorber conjuros'], 14: ['Fuego mágico perfeccionado'], 18: ['Corona de fuego mágico'] },
      conjuros: { 3: ['Curar heridas', 'Rayo abrasador', 'Restablecimiento menor', 'Saeta guía'], 5: ['Aura de vitalidad', 'Disipar magia'], 6: ['Contrahechizo'], 7: ['Escudo de fuego', 'Muro de fuego'], 9: ['Golpe flamígero', 'Restablecimiento mayor'] } },
  ],
  'Mago': [
    { nombre: 'Abjurador', re: /abjur/, libro: PHB, escuela: 'Abjuración', rasgos: { 3: ['Experto en abjuración', 'Salvaguarda arcana'], 6: ['Salvaguarda proyectada'], 10: ['Rompeconjuros'], 14: ['Resistencia a conjuros'] } },
    { nombre: 'Adivino', re: /adivin|divin/, libro: PHB, escuela: 'Adivinación', rasgos: { 3: ['Experto en adivinación', 'Presagio'], 6: ['Adivino avezado'], 10: ['El tercer ojo'], 14: ['Presagio mayor'] } },
    { nombre: 'Evocador', re: /evoca/, libro: PHB, escuela: 'Evocación', rasgos: { 3: ['Experto en evocación', 'Truco potente'], 6: ['Esculpir conjuros'], 10: ['Evocación potenciada'], 14: ['Sobrecanalizar'] } },
    { nombre: 'Ilusionista', re: /ilusion/, libro: PHB, escuela: 'Ilusionismo', rasgos: { 3: ['Experto en ilusionismo', 'Ilusiones mejoradas'], 6: ['Criaturas fantasmales'], 10: ['Yo ilusorio'], 14: ['Realidad ilusoria'] },
      conjuros: { 3: ['Ilusión menor'], 6: ['Invocar bestia', 'Invocar feérico'] } },
    { nombre: 'Hojacantante', re: /hojacantante|cantante/, libro: HF, prio: ['int', 'des', 'con', 'sab', 'car', 'fue'], rasgos: { 3: ['Canción de la hoja', 'Entrenarse en la guerra y la canción'], 6: ['Ataque adicional'], 10: ['Canción de defensa'], 14: ['Canción de la victoria'] } },
  ],
  'Monje': [
    { nombre: 'Guerrero de la mano abierta', re: /mano abierta/, libro: PHB, rasgos: { 3: ['Técnica de la mano abierta'], 6: ['Plenitud de cuerpo'], 11: ['Paso veloz'], 17: ['Palma estremecedora'] } },
    { nombre: 'Guerrero de la misericordia', re: /misericordia/, libro: PHB, rasgos: { 3: ['Instrumentos de misericordia', 'Mano de aflicción', 'Mano de curación'], 6: ['Toque de galeno'], 11: ['Ráfaga de curación y aflicción'], 17: ['Mano de misericordia suprema'] } },
    { nombre: 'Guerrero de la sombra', re: /sombra/, libro: PHB, rasgos: { 3: ['Artes sombrías'], 6: ['Paso entre sombras'], 11: ['Paso entre sombras mejorado'], 17: ['Capa de sombras'] },
      conjuros: { 3: ['Ilusión menor', 'Oscuridad'] } },
    { nombre: 'Guerrero de los elementos', re: /elementos/, libro: PHB, rasgos: { 3: ['Armonía con los elementos', 'Manipular los elementos'], 6: ['Explosión elemental'], 11: ['Paso de los elementos'], 17: ['Paradigma elemental'] },
      conjuros: { 3: ['Elementalismo'] } },
  ],
  'Paladín': [
    { nombre: 'Juramento de entrega', re: /entrega|devoci/, libro: PHB, rasgos: { 3: ['Arma sagrada', 'Conjuros del juramento de entrega'], 7: ['Aura de entrega'], 15: ['Castigo protector'], 20: ['Halo sagrado'] },
      conjuros: { 3: ['Escudo de fe', 'Protección contra el bien y el mal'], 5: ['Auxilio', 'Zona de la verdad'], 9: ['Disipar magia', 'Señal de esperanza'], 13: ['Guardián de la fe', 'Libertad de movimiento'], 17: ['Comunión', 'Golpe flamígero'] } },
    { nombre: 'Juramento de gloria', re: /gloria/, libro: PHB, rasgos: { 3: ['Atleta sin parangón', 'Castigo inspirador', 'Conjuros del juramento de gloria'], 7: ['Aura de celeridad'], 15: ['Defensa gloriosa'], 20: ['Leyenda viviente'] },
      conjuros: { 3: ['Heroísmo', 'Saeta guía'], 5: ['Arma mágica', 'Potenciar característica'], 9: ['Acelerar', 'Protección contra energía'], 13: ['Compulsión', 'Libertad de movimiento'], 17: ['Conocer las leyendas', 'Presencia regia de Yolande'] } },
    { nombre: 'Juramento de los antiguos', re: /antiguos/, libro: PHB, rasgos: { 3: ['Conjuros del juramento de los antiguos', 'Ira de la naturaleza'], 7: ['Aura de salvaguarda'], 15: ['Centinela imperecedero'], 20: ['Campeón ancestral'] },
      conjuros: { 3: ['Golpe apresador', 'Hablar con los animales'], 5: ['Paso brumoso', 'Rayo de luna'], 9: ['Crecimiento vegetal', 'Protección contra energía'], 13: ['Piel pétrea', 'Tormenta de hielo'], 17: ['Comunión con la naturaleza', 'Paso arbóreo'] } },
    { nombre: 'Juramento de venganza', re: /venganza/, libro: PHB, rasgos: { 3: ['Conjuros del juramento de venganza', 'Voto de enemistad'], 7: ['Vengador implacable'], 15: ['Espíritu vengativo'], 20: ['Ángel vengador'] },
      conjuros: { 3: ['Marca del cazador', 'Perdición'], 5: ['Inmovilizar persona', 'Paso brumoso'], 9: ['Acelerar', 'Protección contra energía'], 13: ['Destierro', 'Puerta dimensional'], 17: ['Escudriñar', 'Inmovilizar monstruo'] } },
    { nombre: 'Juramento de los genios nobles', re: /genios/, libro: HF, rasgos: { 3: ['Castigo elemental', 'Conjuros de genio', 'Esplendor del genio'], 7: ['Aura de escudo elemental'], 15: ['Represalia elemental'], 20: ['Vástago noble'] },
      conjuros: { 3: ['Castigo atronador', 'Elementalismo', 'Orbe cromático'], 5: ['Fuerza fantasmal', 'Imagen múltiple'], 9: ['Forma gaseosa', 'Volar'], 13: ['Conjurar elementales menores', 'Invocar elemental'], 17: ['Castigo desterrador', 'Contactar con otro plano'] } },
  ],
  'Pícaro': [
    { nombre: 'Asesino', re: /asesin/, libro: PHB, rasgos: { 3: ['Asesinar', 'Herramientas de asesino'], 9: ['Pericia en infiltrarse'], 13: ['Envenenar armas'], 17: ['Golpe mortal'] } },
    { nombre: 'Embaucador arcano', re: /arcan/, libro: PHB, prio: ['des', 'int', 'con', 'sab', 'car', 'fue'], rasgos: { 3: ['Lanzamiento de conjuros', 'Destreza con mano de mago'], 9: ['Emboscada mágica'], 13: ['Embaucador versátil'], 17: ['Ladrón de conjuros'] },
      conjuros: { 3: ['Mano de mago'] } },
    { nombre: 'Ladrón', re: /ladron/, libro: PHB, rasgos: { 3: ['Balconero', 'Manos rápidas'], 9: ['Sigilo supremo'], 13: ['Usar objetos mágicos'], 17: ['Reflejos de ladrón'] } },
    { nombre: 'Rebanaalmas', re: /rebanaalmas|cuchilla|alma/, libro: PHB, rasgos: { 3: ['Cuchillas psíquicas', 'Poder psiónico'], 9: ['Cuchillas del alma'], 13: ['Velo psíquico'], 17: ['Desgarro mental'] } },
    { nombre: 'Vástago de los Tres', re: /vastago|tres/, libro: HF, prio: ['des', 'int', 'con', 'sab', 'car', 'fue'], rasgos: { 3: ['Lealtad aterradora', 'Sed de sangre'], 9: ['Golpe terrorífico'], 13: ['Aura de maldad'], 17: ['Encarnación del terror'] },
      conjuros: { 3: ['Guardia de cuchillas'] } },
  ],
};

const CONJUROS_CLASE = {
  'Druida': { 1: [['Hablar con los animales', 'Druídico', '']] },
  'Explorador': { 1: [['Marca del cazador', 'Enemigo predilecto', '']] },
  'Paladín': { 2: [['Castigo divino', 'Castigo de paladín', '']], 5: [['Hallar corcel', 'Corcel fiel', '']] },
};

export function subclaseDe(ch) {
  const n = norm(ch.subclase || ''); if (!n) return null;
  return (SUBCLASES[ch.clase] || []).find(s => norm(s.nombre) === n) || (SUBCLASES[ch.clase] || []).find(s => s.re.test(n)) || null;
}

export function rasgosEnNivel(ch, L) {
  const info = CLASES_INFO[ch.clase]; if (!info) return [];
  const sc = subclaseDe(ch), out = [];
  for (const r of info.rasgos[L] || []) {
    if (r === SUB) { if (sc?.rasgos[L]) out.push(...sc.rasgos[L]); else if (!sc) out.push(SUB); }
    else out.push(r);
  }
  if (sc && L === 3) out.push(...(sc.rasgos[3] || []));
  return [...new Set(out)];
}

export function progresion(ch, hasta = nivelDe(ch)) {
  const sc = subclaseDe(ch), subs = new Set(Object.values(sc?.rasgos || {}).flat()), out = [];
  for (let L = 1; L <= hasta; L++) for (const nombre of rasgosEnNivel(ch, L)) out.push({ nivel: L, nombre, origen: subs.has(nombre) ? 'subclase' : 'clase' });
  return out;
}

export function conjurosAutomaticos(ch, hasta = nivelDe(ch)) {
  const out = [], sc = subclaseDe(ch);
  for (const [L, lista] of Object.entries(CONJUROS_CLASE[ch.clase] || {})) if (hasta >= +L) lista.forEach(([nombre, fuente, gratis]) => out.push({ nombre, nivel: +L, fuente, gratis, ritual: false }));
  if (sc?.conjuros) {
    const fuente = (sc.rasgos[3] || []).find(r => /^Conjuros/.test(r)) || sc.nombre;
    for (const [L, lista] of Object.entries(sc.conjuros)) if (hasta >= +L) lista.forEach(nombre => out.push({ nombre, nivel: +L, fuente, gratis: '', ritual: !!sc.ritual }));
  }
  return out;
}

// Golpes benditos (clérigo) y Furia elemental (druida): lo que da la variante elegida
function furiaOGolpes(ch, nombre, mejorado) {
  const v = varianteDe(ch, ch.clase), dado = mejorado ? '2d8' : '1d8';
  if (!v) return { nombre, valor: 'Sin elegir', nota: 'Elige la variante tocando el rasgo en «En juego»' };
  if (v.ef === 'golpe') return { nombre, valor: `${dado} ${v.tipos.replace(/^de /, '')}`, nota: `${v.nombre}: una vez por turno al impactar con un arma` };
  return { nombre, valor: `+${modOf(ch.stats?.sab)} a trucos`, nota: `${v.nombre}: Sabiduría al daño de tus trucos` };
}
const byLvl = (L, pairs) => pairs.reduce((v, [from, val]) => (L >= from ? val : v), pairs[0][1]);
export function escalas(ch) {
  const L = nivelDe(ch), info = CLASES_INFO[ch.clase]; if (!info) return [];
  const con = modOf(ch.stats?.con), out = [];
  const pg = info.dg + con + (L - 1) * (info.dg / 2 + 1 + con);
  out.push({ nombre: 'Puntos de golpe (media)', valor: String(Math.max(L, pg)), nota: `d${info.dg} por nivel${con ? `, ${con > 0 ? '+' : ''}${con} de Constitución` : ''}` });
  out.push({ nombre: 'Dado de golpe', valor: `${L}d${info.dg}` });
  out.push({ nombre: 'Competencia', valor: '+' + competencia(L) });
  out.push({ nombre: 'Salvaciones', valor: info.salv.map(k => ({ fue: 'Fuerza', des: 'Destreza', con: 'Constitución', int: 'Inteligencia', sab: 'Sabiduría', car: 'Carisma' })[k]).join(' y ') });
  const maestria = n => out.push({ nombre: 'Maestría con armas', valor: `${n} tipos de arma` });
  switch (ch.clase) {
    case 'Bárbaro': out.push({ nombre: 'Daño por furia', valor: '+' + byLvl(L, [[1, 2], [9, 3], [16, 4]]) }); maestria(byLvl(L, [[1, 2], [4, 3], [10, 4]]));
      if (L >= 9) out.push({ nombre: 'Golpe brutal', valor: L >= 17 ? '2d10' : '1d10' }); break;
    case 'Bardo': out.push({ nombre: 'Dado de inspiración', valor: byLvl(L, [[1, 'd6'], [5, 'd8'], [10, 'd10'], [15, 'd12']]) }); break;
    case 'Brujo': out.push({ nombre: 'Invocaciones', valor: String(byLvl(L, [[1, 1], [2, 3], [5, 5], [7, 6], [9, 7], [12, 8], [15, 9], [18, 10]])) });
      if (L >= 11) out.push({ nombre: 'Arcanum místico', valor: [6, 7, 8, 9].filter(n => L >= 2 * n - 1).map(n => `nivel ${n}`).join(', ') }); break;
    case 'Clérigo': if (L >= 7) out.push(furiaOGolpes(ch, 'Golpes benditos', L >= 14)); break;
    case 'Druida': if (L >= 2) out.push({ nombre: 'Forma salvaje', valor: `VD ${L >= 8 ? 1 : L >= 4 ? '1/2' : '1/4'}${L >= 8 ? ', vuela' : L >= 4 ? ', nada' : ''}`, nota: `Formas conocidas: ${byLvl(L, [[2, 4], [4, 6], [8, 8]])}` });
      if (L >= 7) out.push(furiaOGolpes(ch, 'Furia elemental', L >= 15)); break;
    case 'Explorador': maestria(2); break;
    case 'Guerrero': maestria(byLvl(L, [[1, 3], [4, 4], [10, 5], [16, 6]])); out.push({ nombre: 'Ataques por acción', valor: String(byLvl(L, [[1, 1], [5, 2], [11, 3], [20, 4]])) });
      if (L >= 3 && /maestro del combate|batalla/i.test(ch.subclase || '')) out.push({ nombre: 'Dado de supremacía', valor: dadoSupremacia(L), nota: `CD de las maniobras ${cdManiobras(ch)}` }); break;
    case 'Hechicero': if (L >= 2) out.push({ nombre: 'Opciones de metamagia', valor: String(byLvl(L, [[2, 2], [10, 4], [17, 6]])) }); break;
    case 'Monje': out.push({ nombre: 'Artes marciales', valor: byLvl(L, [[1, 'd6'], [5, 'd8'], [11, 'd10'], [17, 'd12']]) });
      if (L >= 2) out.push({ nombre: 'Movimiento sin armadura', valor: '+' + byLvl(L, [[2, '3'], [6, '4,5'], [10, '6'], [14, '7,5'], [18, '9']]) + ' m' }); break;
    case 'Paladín': maestria(2); if (L >= 6) out.push({ nombre: 'Aura de protección', valor: `+${Math.max(1, modOf(ch.stats?.car))} a salvaciones, ${L >= 18 ? 9 : 3} m` }); break;
    case 'Pícaro': out.push({ nombre: 'Ataque furtivo', valor: `${Math.ceil(L / 2)}d6` }); maestria(2); break;
  }
  return out;
}

export const TEMAS = {
  clase: {
    'Bárbaro': [12, 78, 'barbaro'], 'Bardo': [318, 62, 'bardo'], 'Brujo': [272, 58, 'brujo'], 'Clérigo': [44, 80, 'clerigo'],
    'Druida': [105, 48, 'druida'], 'Explorador': [150, 45, 'explorador'], 'Guerrero': [205, 30, 'guerrero'], 'Hechicero': [352, 70, 'hechicero'],
    'Mago': [222, 68, 'mago'], 'Monje': [172, 52, 'monje'], 'Paladín': [196, 66, 'paladin'], 'Pícaro': [240, 20, 'picaro'],
  },
  sub: {
    'Senda del Árbol del Mundo': [95, 40, 'arbol'], 'Senda del berserker': [0, 80, 'berserker'], 'Senda del corazón salvaje': [28, 62, 'corazon'], 'Senda del fanático': [45, 70, 'fanatico'],
    'Colegio de la danza': [338, 64, 'danza'], 'Colegio del conocimiento': [265, 45, 'saber'], 'Colegio del glamour': [300, 70, 'glamour'], 'Colegio del valor': [350, 58, 'valor'], 'Colegio de la luna': [215, 50, 'lunabardo'],
    'Patrón celestial': [48, 82, 'celestial'], 'Patrón feérico': [150, 58, 'feerico'], 'Patrón infernal': [4, 70, 'infernal'], 'Patrón primigenio': [182, 40, 'primigenio'],
    'Dominio de la guerra': [0, 58, 'guerra'], 'Dominio de la luz': [52, 90, 'luz'], 'Dominio de la vida': [140, 48, 'vida'], 'Dominio del engaño': [300, 45, 'engano'], 'Dominio del conocimiento': [210, 55, 'conocimiento'],
    'Círculo de la luna': [230, 42, 'luna'], 'Círculo de la tierra': [92, 44, 'tierra'], 'Círculo de las estrellas': [248, 55, 'estrellas'], 'Círculo del mar': [192, 60, 'mar'],
    'Acechador en la penumbra': [255, 25, 'acechador'], 'Cazador': [120, 40, 'cazador'], 'Errante feérico': [165, 60, 'errante'], 'Señor de las bestias': [35, 50, 'bestias'], 'Caminante invernal': [200, 45, 'invernal'],
    'Caballero arcano': [235, 45, 'caballero'], 'Campeón': [25, 45, 'campeon'], 'Guerrero psiónico': [280, 40, 'psionico'], 'Maestro del combate': [210, 20, 'maestro'], 'Abanderado': [355, 55, 'abanderado'],
    'Hechicería aberrante': [290, 45, 'aberrante'], 'Hechicería de magia salvaje': [325, 75, 'salvaje'], 'Hechicería dracónica': [8, 74, 'draconica'], 'Hechicería mecánica': [38, 36, 'mecanica'], 'Hechicería del fuego mágico': [16, 88, 'fuegomagico'],
    'Abjurador': [205, 62, 'abjurador'], 'Adivino': [40, 78, 'adivino'], 'Evocador': [18, 80, 'evocador'], 'Ilusionista': [285, 52, 'ilusionista'], 'Hojacantante': [172, 58, 'hojacantante'],
    'Guerrero de la mano abierta': [185, 45, 'manoabierta'], 'Guerrero de la misericordia': [158, 40, 'misericordia'], 'Guerrero de la sombra': [240, 30, 'sombra'], 'Guerrero de los elementos': [22, 65, 'elementos'],
    'Juramento de entrega': [50, 70, 'entrega'], 'Juramento de gloria': [42, 92, 'gloria'], 'Juramento de los antiguos': [110, 50, 'antiguos'], 'Juramento de venganza': [356, 68, 'venganza'], 'Juramento de los genios nobles': [185, 70, 'genios'],
    'Asesino': [0, 35, 'asesino'], 'Embaucador arcano': [265, 50, 'embaucador'], 'Ladrón': [30, 30, 'ladron'], 'Rebanaalmas': [300, 35, 'rebanaalmas'], 'Vástago de los Tres': [340, 45, 'vastago'],
  },
};
