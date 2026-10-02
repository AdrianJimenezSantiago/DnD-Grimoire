// Genera docs/auditoria-clases.md: cada rasgo de cada clase y subclase (2024) con lo que hace la app.
// Uso: node tools/auditoria-clases.mjs
import fs from 'node:fs';
import { CLASES_INFO, SUBCLASES } from '../web/src/domain/clases/clases2024.js';

// A = la app lo aplica sola · P = en parte (contador, número o botón; el resto lo decides tú) · T = se consulta (texto en «En juego»)
const E = {
  // Comunes
  'Mejora de característica': ['A', 'Asistente de subida de nivel: +2/+1 o dote.'], 'Don épico': ['A', 'Asistente de subida de nivel.'],
  'Lanzamiento de conjuros': ['A', 'Espacios, CD, ataque, trucos y preparados por nivel (multiclase incluida).'],
  'Maestría con armas': ['A', 'Cupo por nivel; la maestría se aplica al atacar (Derribar, Hendir, Mella, Rozar…).'],
  'Estilo de combate': ['A', 'Se elige como dote; Defensa, Tiro con arco y Duelo suman solos; los demás salen en el ataque.'],
  'Estilo de combate adicional': ['A', 'Pide un segundo estilo.'], 'Pericia': ['A', 'Cupo de pericias por clase y nivel.'],
  'Ataque adicional': ['A', 'Ataques por acción en combate.'], 'Dos ataques adicionales': ['A', '3 ataques por acción.'], 'Tres ataques adicionales': ['A', '4 ataques por acción.'],
  'Defensa sin armadura': ['A', 'CA 10 + Des + Con (bárbaro, con escudo) o + Sab (monje, sin escudo).'],
  'Evasión': ['T', ''], 'Canalizar divinidad': ['A', 'Contador (recupera 1 en descanso corto, todos en largo).'],
  // Bárbaro
  'Furia': ['A', 'Usos por nivel (1 en descanso corto); al gastarla pone el efecto (ventaja Fue, daño por furia en ataques de Fuerza), rompe la concentración y avisa si llevas armadura pesada.'],
  'Ataque temerario': ['A', 'Se activa en «En juego»: ventaja en ataques de Fuerza este turno.'], 'Sentir el peligro': ['A', 'Ventaja en salvaciones de Destreza salvo incapacitado.'],
  'Conocimiento primigenio': ['A', 'Pide una habilidad más de la lista del bárbaro.'], 'Movimiento rápido': ['A', '+3 m sin armadura pesada.'],
  'Instinto salvaje': ['A', 'Ventaja en iniciativa.'], 'Golpe brutal': ['P', 'Número del dado (1d10, 2d10 a nivel 17).'], 'Golpe brutal mejorado': ['P', 'Número del dado.'],
  'Furia implacable': ['P', 'Muestra la CD de partida (10, +5 por uso).'], 'Furia persistente': ['A', 'Al tirar iniciativa recuperas todas las Furias (1 vez por descanso largo).'],
  'Poderío indómito': ['A', 'En pruebas y salvaciones de Fuerza el total no baja de tu Fuerza.'], 'Campeón primordial': ['A', '+4 Fue y Con (máx. 25) al subir a nivel 20.'],
  'Vitalidad del árbol': ['A', 'Al entrar en furia ganas PG temporales iguales a tu nivel.'], 'Frenesí': ['A', 'Al impactar en furia: +Nd6 (N = daño por furia) una vez por turno.'],
  'Furia irracional': ['A', 'Inmune a asustado y hechizado mientras dure la furia.'], 'Presencia intimidante': ['A', 'Contador; se recupera gastando una Furia.'],
  'Furia de lo salvaje': ['A', 'Opción (Oso, Águila, Lobo) que se marca cada vez que te enfureces.'], 'Aspecto de lo salvaje': ['A', 'Opción (Búho, Pantera, Salmón); se avisa en el descanso largo.'],
  'Poder de lo salvaje': ['A', 'Opción (Halcón, León, Carnero) al enfurecerte.'], 'Portavoz de los animales': ['A', 'Conjuros como rituales, siempre preparados.'], 'Hablante de la naturaleza': ['A', 'Comunión con la naturaleza como ritual.'],
  'Furia divina': ['A', 'Al impactar en furia: +1d6 + mitad del nivel, una vez por turno.'], 'Guerrero de los dioses': ['A', 'Reserva de d12 (4 a 7); cada dado gastado se tira y te cura.'],
  'Presencia ferviente': ['A', 'Contador; se recupera gastando una Furia.'], 'Furia de los dioses': ['A', 'Contador de 1 uso por descanso largo.'],
  // Bardo
  'Inspiración bárdica': ['A', 'Usos = Car; dado d6→d12; descanso corto desde nivel 5; se recupera gastando un espacio (Fuente de inspiración).'],
  'Aprendiz de mucho': ['A', 'Mitad de competencia a pruebas de habilidad sin competencia (no a la iniciativa, regla de 2024).'],
  'Fuente de inspiración': ['A', 'Recarga en descanso corto y canje por espacio.'], 'Inspiración superior': ['A', 'Al tirar iniciativa recuperas hasta tener 2.'],
  'Palabras de creación': ['A', 'Palabra de poder: sanar y matar siempre preparadas.'], 'Secretos mágicos': ['T', ''], 'Contraencantamiento': ['T', 'Reacción.'],
   'Competencias adicionales': ['A', 'Pide 3 habilidades.'],
  'Magia cautivadora': ['A', 'Contador; canje por Inspiración bárdica.'], 'Manto de majestad': ['A', 'Contador; canje por espacio de nivel 3+.'], 'Majestad inquebrantable': ['A', 'Contador (descanso corto).'],
  'Entrenamiento marcial': ['A', 'Armadura media, escudo y armas marciales.'], 'Bendición de la luz lunar': ['A', 'Contador.'],
  // Brujo
  'Invocaciones sobrenaturales': ['P', 'Número de invocaciones por nivel; se eligen como dotes/notas.'], 'Magia del pacto': ['A', 'Espacios de pacto; vuelven en el descanso corto.'],
  'Astucia mágica': ['A', 'Al gastarla recupera la mitad de los espacios de pacto (todos a nivel 20).'], 'Contactar patrón': ['A', 'Contactar con otro plano siempre preparado y gratis 1/día.'],
  'Arcanum místico (nivel 6)': ['A', 'Uso gratis diario.'], 'Arcanum místico (nivel 7)': ['A', 'Uso gratis diario.'], 'Arcanum místico (nivel 8)': ['A', 'Uso gratis diario.'], 'Arcanum místico (nivel 9)': ['A', 'Uso gratis diario.'],
  'Maestro sobrenatural': ['A', 'Astucia mágica recupera todos los espacios.'], 'Luz sanadora': ['A', 'Reserva de d6; botón «Curarme».'], 'Alma radiante': ['A', 'Carisma a una tirada de daño radiante o de fuego.'],
  'Resiliencia celestial': ['A', 'PG temporales al terminar descansos y al usar Astucia mágica.'], 'Venganza ardiente': ['A', 'Contador.'],
  'Pasos feéricos': ['A', 'Paso brumoso gratis (Car usos).'], 'Escape brumoso': ['P', 'Usa los Pasos feéricos.'], 'Defensas seductoras': ['A', 'Inmune a hechizado; contador con canje por espacio de pacto.'],
  'La suerte del Oscuro': ['A', 'Contador (Car usos).'], 'Lealtad aterradora': ['A', 'Opción de dios (Bhaal, Myrkul, Perdición): cambia el truco siempre preparado y se avisa en el descanso largo.'],
  'Esplendor del genio': ['A', 'CA 10 + Des + Con sin armadura y una habilidad.'], 'Castigo elemental': ['A', 'Furia del ifrit al impactar (gasta Canalizar divinidad).'], 'Aura de escudo elemental': ['A', 'Opción de tipo de daño en cada turno.'],
'Escarcha del cazador': ['A', 'Al lanzar Marca del cazador ganas 1d10 + nivel PG temporales.'],
  'Conocimientos primigenios': ['A', 'Pide una habilidad; truco de druida.'], 'Mente ilimitada': ['A', 'Competencia en salvaciones de Inteligencia.'], 'Comandante inspirador': ['A', 'Inmune a asustado y hechizado.'],
  'Asesinar': ['A', 'Ventaja en iniciativa; en el primer asalto, Golpes sorprendentes suma tu nivel al Ataque furtivo.'], 'Juego de pies deslumbrante': ['A', 'CA 10 + Des + Car y Daño bárdico (dado de inspiración + Des) sin armadura ni escudo.'],
  'Mareas del caos': ['A', 'Contador; se restablece al lanzar un conjuro de hechicero con espacio y te avisa de la sobrecarga.'], 'Resistencia infernal': ['A', 'Opción de tipo de daño; se cambia en cada descanso.'], 'Arrastrar por el infierno': ['A', 'Contador con canje por espacio de pacto.'],
  'Combatiente clarividente': ['A', 'Contador (descanso corto) con canje por espacio de pacto.'], 'Maleficio sobrenatural': ['A', 'Maleficio siempre preparado; +1d6 al impactar.'],
  // Clérigo
  'Orden divina': ['A', 'Protector (armas marciales, armadura pesada) o Taumaturgo (truco + Sab a Arcanos/Religión).'], 'Golpes benditos': ['A', 'Variante: Golpe divino al impactar o Lanzamiento potente en trucos.'],
  'Golpes benditos mejorados': ['A', '2d8 o PG temporales.'], 'Intercesión divina': ['A', 'Contador diario.'], 'Abrasar muertos vivientes': ['T', ''],
  'Sacerdote guerrero': ['A', 'Contador (Sab, descanso corto).'], 'Golpe guiado': ['T', 'Canalizar divinidad.'], 'Fulgor protector': ['A', 'Contador (Sab; descanso corto desde nivel 6).'],
  'Halo de luz': ['A', 'Contador (Sab).'], 'Discípulo de la vida': ['A', '+2 + nivel del espacio a la curación de tus conjuros.'], 'Precognición divina': ['A', 'Contador; canje por espacio de nivel 6+.'],
  'Bendiciones del conocimiento': ['A', 'Pide 2 habilidades con pericia.'],
  // Druida
  'Druídico': ['A', 'Hablar con los animales siempre preparado.'], 'Orden primigenia': ['A', 'Guardián o Naturalista.'],
  'Forma salvaje': ['A', 'Usos (1 en descanso corto); al transformarte ganas PG temporales = nivel (×3 en la luna) y te dice la duración.'],
  'Compañero salvaje': ['A', 'Encontrar familiar gasta un uso de Forma salvaje.'], 'Resurgimiento salvaje': ['A', 'Contador y canje de espacio por Forma salvaje si no te quedan.'],
  'Furia elemental': ['A', 'Variante: Golpe primigenio o Lanzamiento potente.'], 'Furia elemental mejorada': ['A', '2d8 o alcance.'], 'Archidruida': ['A', 'Recupera Forma salvaje al tirar iniciativa si no te quedan; mago de la naturaleza como contador.'],
  'Conjuros del círculo de la tierra': ['A', 'Opción de terreno (Árido, Polar, Templado, Tropical): cambia los conjuros siempre preparados; se avisa en el descanso largo.'],
  'Recuperación natural': ['A', 'Recuperar espacios al terminar un descanso corto.'], 'Protección de la naturaleza': ['A', 'Inmune a envenenado.'],
  'Mapa estelar': ['A', 'Saeta guía gratis (Sab usos).'], 'Presagio cósmico': ['A', 'Contador.'], 'Forma estelar': ['A', 'Opción (Arquero, Cáliz, Dragón) al transformarte.'],
  'Paso de la luz lunar': ['A', 'Contador (Sab) con canje por espacio de nivel 2+.'], 'Formas del círculo': ['A', 'PG temporales ×3 y CA mínima al transformarte.'],
  // Explorador
  'Enemigo predilecto': ['A', 'Marca del cazador siempre preparada y gratis (2 a 6 usos).'], 'Explorador hábil': ['A', 'Pericia en una habilidad.'], 'Errante': ['A', '+3 m sin armadura pesada.'],
  'Infatigable': ['A', 'PG temporales 1d8 + Sab al gastarlo; baja el agotamiento en el descanso corto.'], 'Cazador persistente': ['A', 'El daño no rompe la concentración en Marca del cazador.'],
  'Velo de la naturaleza': ['A', 'Contador (Sab).'], 'Azote de enemigos': ['A', 'Marca del cazador hace 1d10.'], 'Cazador preciso': ['T', ''],
  'Emboscador pavoroso': ['A', 'Sabiduría a la iniciativa; Golpe pavoroso +2d6 al impactar (Sab usos).'], 'Mente de hierro': ['A', 'Competencia en salvaciones de Sabiduría.'],
  'El cazador y la presa': ['A', 'Opción Azote de colosos (+1d8 al impactar) o Destructor de hordas; se cambia en cada descanso.'], 'Tácticas defensivas': ['A', 'Opción; se cambia en cada descanso.'],
  'Glamur sobrenatural': ['A', 'Sabiduría a las pruebas de Carisma y una habilidad.'], 'Golpes pavorosos': ['A', '+1d4 psíquico al impactar (1d6 a nivel 11).'],
  'Refuerzos feéricos': ['A', 'Invocar feérico gratis 1/día.'], 'Errante brumoso': ['A', 'Paso brumoso gratis (Sab usos).'],
  'Alma fortalecedora': ['A', 'Contador.'], 'Represalia escalofriante': ['A', 'Contador.'], 'Espectro congelado': ['A', 'Contador con canje por espacio de nivel 4+.'],
  // Guerrero
  'Tomar aliento': ['A', 'Usos por nivel; al gastarlo se tira 1d10 + nivel y te cura.'], 'Acción súbita (un uso)': ['A', 'En combate te devuelve la acción.'], 'Acción súbita (dos usos)': ['A', '2 usos.'],
  'Indómito': ['A', 'Contador; muestra el bono (+nivel).'], 'Indómito (dos usos)': ['A', ''], 'Indómito (tres usos)': ['A', ''], 'Mente táctica': ['T', ''],
  'Atleta sobresaliente': ['A', 'Ventaja en iniciativa y Atletismo.'], 'Crítico mejorado': ['A', 'Crítico con 19-20 en tus ataques.'], 'Crítico superior': ['A', 'Crítico con 18-20.'],
  'Guerrero heroico': ['A', 'Al empezar tu turno ganas inspiración heroica si no la tienes.'], 'Superviviente': ['A', 'Ventaja en salvaciones contra muerte y +5 + Con al empezar el turno si estás maltrecho.'],
  'Poder psiónico': ['A', 'Dados de energía (1 en descanso corto); Golpe psiónico al impactar.'], 'Adepto telequinético': ['A', 'Contador con canje por dado.'],
  'Bastión de fuerza': ['A', 'Contador con canje por dado.'], 'Maestro telequinético': ['A', 'Telequinesis siempre preparada y gratis 1/día, con Inteligencia.'],
  'Supremacía en combate': ['A', 'Dados de supremacía, maniobras al impactar y Ataque de precisión al fallar.'], 'Estudioso de la guerra': ['A', 'Pide una habilidad.'],
  'Conoce a tu enemigo': ['A', 'Contador con canje por dado de supremacía.'], 'Supremacía en combate mejorada': ['A', 'd10.'], 'Supremacía en combate definitiva': ['A', 'd12.'],
  'Caballero emisario': ['A', 'Comprender idiomas y una habilidad.'], 'Recuperación grupal': ['A', 'Contador.'],
  // Hechicero
  'Hechicería innata': ['A', '2 usos; al gastarla: +1 a la CD de hechicero y ventaja en ataques de conjuro durante 1 minuto.'],
  'Fuente de magia': ['A', 'Puntos de hechicería; convertir espacio ↔ puntos desde «En juego».'], 'Metamagia': ['P', 'Número de opciones.'],
  'Recuperación mágica': ['A', 'Al gastarla recuperas hasta la mitad de tu nivel en puntos.'], 'Encarnación mágica': ['A', 'Hechicería innata se recupera con 2 puntos si no te quedan usos.'],
  'Resistencia dracónica': ['A', 'PG +1 por nivel y CA 10 + Des + Car.'], 'Afinidad elemental': ['A', 'Opción de tipo; Carisma a una tirada de daño de ese tipo.'],
  'Alas de dragón': ['A', 'Contador con canje por 3 puntos.'], 'Compañero dragón': ['A', 'Invocar dragón gratis 1/día.'],
  'Restablecer equilibrio': ['A', 'Contador (Car).'], 'Trance de orden': ['A', 'Contador con canje por 5 puntos.'], 'Cabalgata mecánica': ['A', 'Contador con canje por 7 puntos.'],
  'Implosión deformadora': ['A', 'Contador con canje por 5 puntos.'], 'Sobrecarga domada': ['A', 'Contador.'], 'Corona de fuego mágico': ['A', 'Contador con canje por 5 puntos.'],
  // Mago
  'Adepto en rituales': ['A', 'Rituales del libro sin prepararlos.'], 'Recuperación arcana': ['A', 'Recuperar espacios tras el descanso corto (mitad del nivel, hasta nivel 5).'],
  'Académico': ['A', 'Pericia en una habilidad.'], 'Memorizar conjuro': ['A', 'Aviso en el descanso corto.'], 'Conjuros característicos': ['A', 'Contador (descanso corto).'],
  'Salvaguarda arcana': ['A', 'Reserva de PG; se recarga sola al lanzar abjuración con espacio o gastando un espacio; absorbe daño con un botón al recibirlo.'], 'Rompeconjuros': ['A', 'Contrahechizo y Disipar magia siempre preparados.'],
  'Aura de salvaguarda': ['A', 'Resistencia a necrótico, psíquico y radiante en la lista de resistencias.'], 'Avatar de la batalla': ['A', 'Resistencia contundente, cortante y perforante.'],
  'Defensas psíquicas': ['A', 'Resistencia psíquica y ventaja contra asustado o hechizado.'], 'Escudo mental': ['A', 'Resistencia psíquica.'], 'Mente robusta': ['A', 'Resistencia psíquica.'],
  'Esquiva asombrosa': ['A', 'Botón al recibir daño: la mitad.'], 'Desviar ataques': ['A', 'Botón al recibir daño: resta 1d10 + Des + nivel.'], 'Golpe guiado': ['A', 'Al fallar un ataque, +10 gastando Canalizar divinidad.'],
  'Cazador preciso': ['A', 'Ventaja contra la criatura marcada mientras mantienes Marca del cazador.'], 'Explorador gélido': ['A', 'Golpes polares al impactar y resistencia al frío.'],
  'Sanación suprema': ['A', 'Los dados de curación de tus conjuros dan su máximo.'], 'Sanador bendito': ['A', 'Tras curar a otro con un conjuro, botón para recuperar 2 + nivel del espacio.'],
  'Truco potente': ['A', 'Tus trucos de salvación hacen la mitad de daño a quien la supere.'],
  'Resistencia a conjuros': ['A', 'Ventaja en salvaciones contra conjuros.'], 'Presagio': ['A', 'Dados d20 anotados tras el descanso largo.'], 'Adivino avezado': ['A', 'Al lanzar adivinación de nivel 2+ ofrece recuperar un espacio.'],
  'El tercer ojo': ['A', 'Contador (descanso corto).'], 'Presagio mayor': ['A', '3 dados.'], 'Evocación potenciada': ['A', 'Inteligencia a una tirada de daño de evocación.'],
  'Sobrecanalizar': ['A', 'Contador.'], 'Criaturas fantasmales': ['A', 'Invocar bestia/feérico siempre preparados y gratis.'], 'Yo ilusorio': ['A', 'Contador con canje por espacio de nivel 2+.'],
  'Canción de la hoja': ['A', 'Contador; al gastarla: +Int a CA, +3 m, ataques con Int y + Int a la concentración.'], 'Canción de la victoria': ['T', 'Tras lanzar un conjuro de acción, un ataque como acción adicional.'],
  // Monje
  'Artes marciales': ['A', 'Dado de artes marciales en golpes y armas de monje, con Des.'], 'Concentración de monje': ['A', 'Puntos (descanso corto) y su CD.'],
  'Metabolismo asombroso': ['A', 'Al tirar iniciativa recuperas los puntos y te curas nivel + dado (1/día).'], 'Movimiento sin armadura': ['A', 'Velocidad extra sin armadura ni escudo.'],
'Caída lenta': ['P', 'Número de reducción.'], 'Golpe aturdidor': ['A', 'Al impactar gasta 1 punto y da la CD.'],
  'Concentración perfecta': ['A', 'Al tirar iniciativa sube a 4 puntos si no usas Metabolismo.'], 'Superviviente disciplinado': ['A', 'Competencia en todas las salvaciones.'],
  'Defensa superior': ['A', 'Se activa en «En juego» gastando 3 puntos.'], 'Cuerpo y mente': ['A', '+4 Des y Sab al subir a nivel 20.'],
  'Plenitud de cuerpo': ['A', 'Contador; al gastarlo te cura dado + Sab.'], 'Mano de aflicción': ['A', 'Al impactar sin armas: 1 punto, + dado + Sab necrótico.'],
  'Ráfaga de curación y aflicción': ['A', 'Contador (Sab).'], 'Mano de misericordia suprema': ['A', 'Contador.'], 'Instrumentos de misericordia': ['A', 'Perspicacia y Medicina.'],
  'Artes sombrías': ['A', 'Oscuridad cuesta 1 punto; Ilusión menor; CD con Sabiduría.'], 'Armonía con los elementos': ['A', 'Elementalismo; CD con Sabiduría.'],
  // Paladín
  'Imponer las manos': ['A', 'Reserva de 5 × nivel; botón «Curarme».'], 'Castigo de paladín': ['A', 'Castigo divino siempre preparado, gratis 1/día y al impactar.'],
  'Corcel fiel': ['A', 'Hallar corcel siempre preparado y gratis.'], 'Aura de protección': ['A', '+Car a tus salvaciones salvo incapacitado.'], 'Aura de coraje': ['A', 'Inmune a asustado.'],
  'Golpes radiantes': ['A', '+1d8 radiante en cada impacto cuerpo a cuerpo.'], 'Expansión de aura': ['A', '9 m.'],
  'Arma sagrada': ['A', 'Se activa en «En juego» (gasta Canalizar divinidad): +Car al ataque.'], 'Aura de entrega': ['A', 'Inmune a hechizado.'],
  'Atleta sin parangón': ['A', 'Se activa en «En juego»: ventaja en Atletismo y Acrobacias.'], 'Aura de celeridad': ['A', '+3 m de velocidad.'],
  'Defensa gloriosa': ['A', 'Contador (Car).'], 'Centinela imperecedero': ['A', 'Contador.'], 'Voto de enemistad': ['A', 'Se activa en «En juego»: ventaja contra la criatura.'],
  'Represalia elemental': ['A', 'Contador (Car).'], 'Halo sagrado': ['A', 'Contador con canje por espacio de nivel 5.'], 'Leyenda viviente': ['A', 'Contador con canje por espacio de nivel 5.'],
  'Campeón ancestral': ['A', 'Contador con canje por espacio de nivel 5.'], 'Ángel vengador': ['A', 'Contador con canje por espacio de nivel 5.'], 'Vástago noble': ['A', 'Contador con canje por espacio de nivel 5.'],
  // Pícaro
  'Ataque furtivo': ['A', 'Al impactar con arma sutil o a distancia, una vez por turno.'], 'Acción astuta': ['A', 'Correr, Destrabarse y Esconderse como acción adicional.'],
  'Puntería certera': ['A', 'Se activa en «En juego»: ventaja y velocidad 0.'], 'Golpe astuto': ['P', 'Muestra la CD.'], 'Talentos fiables': ['A', 'En pruebas con competencia, un 9 o menos cuenta como 10.'],
  'Mente escurridiza': ['A', 'Competencia en salvaciones de Sabiduría y Carisma.'], 'Golpe de suerte': ['A', 'Contador (descanso corto).'], 
  'Cuchillas psíquicas': ['A', 'Dados de energía psiónica.'], 'Velo psíquico': ['A', 'Contador con canje por dado.'], 'Desgarro mental': ['A', 'Contador con canje por 3 dados.'],
  'Ladrón de conjuros': ['A', 'Contador.'], 'Destreza con mano de mago': ['A', 'Mano de mago siempre preparada.'], 'Sed de sangre': ['A', 'Contador.'],
};
const TXT = { A: 'Automático', P: 'En parte', T: 'Se consulta' };
const fila = (L, n) => { const [e, nota] = E[n] || (/^Conjuros? /.test(n) ? ['A', 'Conjuros siempre preparados por nivel.'] : /^Subclase de |^Rasgo de subclase$/.test(n) ? ['A', 'Se elige en la subida de nivel.'] : ['T', '']);
  return `| ${L} | ${n} | ${TXT[e]} | ${nota || 'La app muestra su texto en «En juego» (con el manual importado) para aplicarlo a mano.'} |`; };
let md = `# Auditoría de clases y subclases (reglas de 2024)

Generado por \`tools/auditoria-clases.mjs\`. Cada rasgo, nivel a nivel, con lo que hace la app:
**Automático** (la app lo aplica, gasta o recupera sola), **En parte** (la app lleva el contador o el número y tú decides cuándo) y
**Se consulta** (rasgos narrativos o de decisión en mesa: su texto sale en «En juego» si importas el manual).

Las pruebas \`tests/auditoria-*.test.js\` recorren todas las clases y subclases de nivel 1 a 20 y todas las multiclases de dos clases.
`;
const cuenta = { A: 0, P: 0, T: 0 };
for (const [clase, info] of Object.entries(CLASES_INFO)) {
  md += `\n## ${clase}\n\n| Nivel | Rasgo | Estado | Cómo lo aplica la app |\n|---|---|---|---|\n`;
  for (let L = 1; L <= 20; L++) for (const n of info.rasgos[L] || []) { md += fila(L, n) + '\n'; cuenta[(E[n] || ['T'])[0]]++; }
  for (const s of SUBCLASES[clase] || []) {
    md += `\n### ${s.nombre} (${s.libro})\n\n| Nivel | Rasgo | Estado | Cómo lo aplica la app |\n|---|---|---|---|\n`;
    for (const [L, rs] of Object.entries(s.rasgos)) for (const n of rs) { md += fila(L, n) + '\n'; cuenta[(E[n] || (/^Conjuros? /.test(n) ? ['A'] : ['T']))[0]]++; }
    if (s.conjuros) md += `\nConjuros siempre preparados: ${Object.entries(s.conjuros).map(([L, cs]) => `nivel ${L}: ${cs.join(', ')}`).join('; ')}.\n`;
    if (s.terrenos) md += `\nTerrenos: ${Object.entries(s.terrenos).map(([t, x]) => `${t} (${Object.values(x).flat().join(', ')})`).join('; ')}.\n`;
  }
}
md = md.replace('\n## ', `\nRecuento: ${cuenta.A} automáticos, ${cuenta.P} en parte y ${cuenta.T} de consulta.\n\n## `);
fs.writeFileSync(new URL('../docs/auditoria-clases.md', import.meta.url), md);
console.log(cuenta);
