// Frases de las tiradas de combate (iniciativa, ataques, salvación contra la muerte y concentración), por tramo
// del resultado: muyMal (1 natural), mal, normal, bien y muyBien (20 natural). En segunda persona y sin género.
export const FRASES_COMBATE = {
  iniciativa: {
    muyMal: ['Aún estás buscando tu arma cuando la batalla ya ha empezado.', 'Te pilla con la boca llena y una pierna dentro de la bota.', 'Te enteras del combate cuando ya va por el segundo asalto.', 'Bostezas justo cuando suena el grito de guerra.', 'Desenvainas… la cuchara.'],
    mal: ['Reaccionas tarde: todos se han movido antes que tú.', 'Tardas un instante de más en entender lo que pasa.', 'El enemigo te gana la mano.', 'Te despistas y la iniciativa se te escapa.', 'Llegas al combate con medio paso de retraso.'],
    normal: ['Desenvainas a la vez que los demás.', 'Te pones en guardia a tiempo.', 'Ni el primero ni el último: en tu sitio.', 'Respiras hondo y entras en la refriega.', 'Tus sentidos se afilan cuando empieza la lucha.'],
    bien: ['Tu arma ya está en la mano antes del primer grito.', 'Te mueves antes de que el enemigo termine de pensar.', 'Reaccionas como un resorte.', 'Tomas la delantera con un movimiento rápido.', 'El combate empieza a tu ritmo.'],
    muyBien: ['Ya estás actuando cuando los demás todavía parpadean.', 'Te mueves como el relámpago: el enemigo ni te ha visto venir.', 'La batalla aún no ha empezado y ya llevas ventaja.', 'Tus reflejos son tan rápidos que parecen premonición.', 'El tiempo se detiene y solo tú te mueves.'],
  },
  ataque: {
    muyMal: ['El arma se te escapa de las manos y sale volando hacia tus aliados.', 'Golpeas con todas tus fuerzas… el aire. Y casi te caes.', 'Tropiezas en mitad del ataque y acabas dando un traspié ridículo.', 'Tu enemigo sonríe; tú no.', 'El golpe va tan desviado que hasta tu rival se aparta por educación.'],
    mal: ['El golpe va desviado y tu rival lo esquiva sin esfuerzo.', 'Tu ataque se estrella contra el escudo.', 'Te falta un palmo para alcanzarlo.', 'Atacas con prisas y sin precisión.', 'Tu enemigo lee el movimiento antes de que lo hagas.'],
    normal: ['Un ataque correcto que busca el hueco en la guardia.', 'Lanzas el golpe con decisión.', 'Tu arma silba en dirección al enemigo.', 'Atacas con la técnica de siempre.', 'Un movimiento firme, sin florituras.'],
    bien: ['Encuentras el hueco en su defensa y atacas sin dudar.', 'Tu golpe es rápido, preciso y peligroso.', 'Fintas, giras y atacas donde menos lo espera.', 'Tu arma busca su punto débil con hambre.', 'Un ataque digno de un maestro de armas.'],
    muyBien: ['Tu arma encuentra el punto exacto donde la armadura no protege.', 'Un golpe tan perfecto que los bardos lo cantarán.', 'El mundo se ralentiza y ves la abertura con total claridad.', 'Atacas con la furia de los héroes antiguos.', 'Tu enemigo entiende demasiado tarde que acaba de perder.'],
  },
  ataqueConjuro: {
    muyMal: ['El conjuro se tuerce en tus manos y estalla en chispas inofensivas.', 'Apuntas con cuidado y el rayo sale hacia el techo.', 'Te equivocas de gesto y el hechizo se deshace en humo.', 'La magia se escurre entre tus dedos como agua.', 'El Tejido te devuelve un chasquido burlón.'],
    mal: ['El hechizo pasa rozando a tu objetivo.', 'Tu proyectil arcano se desvía en el último momento.', 'La magia sale débil y torcida.', 'El conjuro se estrella contra una protección.', 'Fallas por un suspiro.'],
    normal: ['Trazas el gesto y la magia vuela hacia tu objetivo.', 'El conjuro sale limpio y decidido.', 'Tu foco brilla y la energía se libera.', 'Apuntas y lanzas sin vacilar.', 'El Tejido responde a tu llamada.'],
    bien: ['La magia vuela recta y certera hacia su destino.', 'Tu conjuro encuentra el hueco en sus defensas.', 'La energía arcana sigue tu voluntad como un perro de caza.', 'Tu puntería mágica es impecable.', 'El hechizo brilla con una intensidad especial.'],
    muyBien: ['El conjuro encuentra su blanco como si lo guiaran los dioses.', 'La magia ruge al salir de tus manos y golpea donde más duele.', 'El Tejido entero parece vibrar con tu hechizo.', 'Tu conjuro atraviesa todas sus defensas como si no existieran.', 'Hasta los archimagos aplaudirían esta precisión.'],
  },
  muerte: {
    muyMal: ['La oscuridad te abraza y algo tira de ti hacia el otro lado.', 'Sientes cómo se te escapa la vida a borbotones.', 'Una voz fría pronuncia tu nombre desde muy lejos.', 'El frío sube por tus manos hacia el corazón.', 'La Reina Cuervo extiende la mano hacia ti.'],
    mal: ['Tu respiración se hace más débil.', 'La luz se aleja un poco más.', 'El latido se ralentiza.', 'Te hundes en la negrura un paso más.', 'Tu cuerpo pierde la batalla, poco a poco.'],
    normal: ['Te aferras a la vida con lo último que te queda.', 'Un aliento ronco: aún sigues aquí.', 'Tu corazón late, débil pero tozudo.', 'Resistes un momento más.', 'La muerte tendrá que esperar.'],
    bien: ['Tu voluntad empuja la oscuridad hacia atrás.', 'Un recuerdo querido te ancla a este mundo.', 'Tu corazón late con más fuerza.', 'Te niegas a irte, y tu cuerpo te hace caso.', 'La luz vuelve a acercarse.'],
    muyBien: ['Abres los ojos de golpe: ¡aún no es tu hora!', 'Te levantas tambaleante, pero con vida en los ojos.', 'La muerte retrocede ante tu terquedad.', 'Un soplo de vida te devuelve a la batalla.', 'Los dioses no te quieren todavía: vuelves.'],
  },
  concentracion: {
    muyMal: ['El dolor te arranca el hechizo de la mente como un viento furioso.', 'Pierdes el hilo del conjuro y se deshace entre tus dedos.', 'El golpe hace añicos tu concentración.', 'La magia se escapa como agua por un cesto.', 'Tu mente queda en blanco y el hechizo se apaga.'],
    mal: ['Tu concentración se tambalea peligrosamente.', 'Cuesta mantener el hilo con este dolor.', 'El conjuro parpadea, a punto de apagarse.', 'Te distraes un instante de más.', 'Aguantas a duras penas el embate.'],
    normal: ['Aprietas los dientes y mantienes el conjuro.', 'El dolor no rompe tu enfoque.', 'Sigues sosteniendo el hilo de la magia.', 'Respiras hondo y el hechizo se mantiene.', 'Tu mente se aferra al conjuro.'],
    bien: ['Tu concentración es una roca en mitad del caos.', 'Ni el dolor ni el ruido te apartan del hechizo.', 'El conjuro brilla con más fuerza que antes.', 'Sostienes la magia sin pestañear.', 'Tu enfoque es absoluto.'],
    muyBien: ['El mundo podría acabarse y tu conjuro seguiría en pie.', 'Tu mente es un templo en calma en mitad de la tormenta.', 'Sonríes mientras la magia sigue fluyendo sin un temblor.', 'El golpe ni siquiera roza tu concentración.', 'El hechizo vibra, más firme que nunca.'],
  },
};
