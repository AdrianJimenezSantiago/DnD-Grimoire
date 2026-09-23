/** Hoja original de Theo, nivel 6 (formato antiguo v1; se convierte al cargar). */
export const HOJA_THEO = {
  meta:{nombre:'Theo', sub:'Mago adivino, nivel 6', cd:'15', ataque:'+7', mod:'+4', maxprep:'10', recup:'3'},
  levels:[
    {level:0, title:'Trucos', slots:0, spells:[
      {es:'Descarga de fuego', en:'Fire Bolt', escuela:'Evocación', tiempo:'Acción', alcance:'36 m', duracion:'Instantánea', comp:'V S', coste:'', fuente:'Mago', gratis:'', efecto:'Ataque de conjuro, 2d10 de fuego; prende objetos inflamables'},
      {es:'Astilla mental', en:'Mind Sliver', escuela:'Encantamiento', tiempo:'Acción', alcance:'18 m', duracion:'1 asalto', comp:'V', coste:'', fuente:'Mago', gratis:'', efecto:'Salv. INT, 2d6 psíquico; resta 1d4 a su próxima salvación'},
      {es:'Prestidigitación', en:'Prestidigitation', escuela:'Transmutación', tiempo:'Acción', alcance:'3 m', duracion:'Hasta 1 h', comp:'V S', coste:'', fuente:'Mago', gratis:'', efecto:'Pequeños efectos mágicos inofensivos'},
      {es:'Ilusión menor', en:'Minor Illusion', escuela:'Ilusión', tiempo:'Acción', alcance:'9 m', duracion:'1 min', comp:'S M', coste:'', fuente:'Mago (nivel 4)', gratis:'', efecto:'Sonido o imagen en un cubo de 1,5 m; Investigación para descubrirla'},
      {es:'Mano de mago', en:'Mage Hand', escuela:'Conjuración', tiempo:'Acción', alcance:'9 m', duracion:'1 min', comp:'V S', coste:'', fuente:'Iniciado en la magia', gratis:'', efecto:'Mano espectral; manipula hasta 5 kg'},
      {es:'Doblar por los muertos', en:'Toll the Dead', escuela:'Nigromancia', tiempo:'Acción', alcance:'18 m', duracion:'Instantánea', comp:'V S', coste:'', fuente:'Iniciado en la magia', gratis:'', efecto:'Salv. SAB, 2d8 necrótico (2d12 si ya está herido)'}
    ]},
    {level:1, title:'Nivel 1', slots:4, spells:[
      {es:'Escudo', en:'Shield', escuela:'Abjuración', tiempo:'Reacción', alcance:'Propio', duracion:'1 asalto', comp:'V S', coste:'', fuente:'Libro', gratis:'', prep:true, efecto:'+5 CA hasta tu próximo turno; anula Proyectil mágico'},
      {es:'Armadura de mago', en:'Mage Armor', escuela:'Abjuración', tiempo:'Acción', alcance:'Toque', duracion:'8 h', comp:'V S M', coste:'', fuente:'Libro', gratis:'', prep:true, efecto:'CA base 13 + DES (15 para Theo)'},
      {es:'Encontrar familiar', en:'Find Familiar', escuela:'Conjuración', tiempo:'1 hora', alcance:'3 m', duracion:'Instantánea', comp:'V S M', coste:'Incienso, 10 po (se consume)', fuente:'Libro', gratis:'', ritual:true, efecto:'Invoca a Juno; ves y oyes a través de ella'},
      {es:'Proyectil mágico', en:'Magic Missile', escuela:'Evocación', tiempo:'Acción', alcance:'36 m', duracion:'Instantánea', comp:'V S', coste:'', fuente:'Libro', gratis:'', efecto:'3 dardos de 1d4+1 fuerza que siempre impactan; +1 dardo por nivel'},
      {es:'Alarma', en:'Alarm', escuela:'Abjuración', tiempo:'1 minuto', alcance:'9 m', duracion:'8 h', comp:'V S M', coste:'', fuente:'Libro', gratis:'', ritual:true, efecto:'Alarma mental o audible en un cubo de 6 m'},
      {es:'Dormir', en:'Sleep', escuela:'Encantamiento', tiempo:'Acción', alcance:'18 m', duracion:'Hasta 1 min', comp:'V S M', coste:'', fuente:'Libro', gratis:'', conc:true, efecto:'Esfera de 1,5 m; salv. SAB: Incapacitado, y si vuelve a fallar, Inconsciente'},
      {es:'Detectar magia', en:'Detect Magic', escuela:'Adivinación', tiempo:'Acción', alcance:'Propio', duracion:'Hasta 10 min', comp:'V S', coste:'', fuente:'Iniciado en la magia', gratis:'1/DL', always:true, ritual:true, conc:true, efecto:'Percibes magia a 9 m y su escuela'},
      {es:'Caída de pluma', en:'Feather Fall', escuela:'Transmutación', tiempo:'Reacción', alcance:'18 m', duracion:'1 min', comp:'V M', coste:'', fuente:'Libro', gratis:'', efecto:'Hasta 5 criaturas caen despacio y sin daño'},
      {es:'Nube de niebla', en:'Fog Cloud', escuela:'Conjuración', tiempo:'Acción', alcance:'36 m', duracion:'Hasta 1 h', comp:'V S', coste:'', fuente:'Libro', gratis:'', conc:true, efecto:'Esfera de 6 m muy oscurecida; +6 m por nivel superior'},
      {es:'Bendecir', en:'Bless', escuela:'Encantamiento', tiempo:'Acción', alcance:'9 m', duracion:'Hasta 1 min', comp:'V S M', coste:'Símbolo sagrado, 5 po (no se consume)', fuente:'Fey Touched', gratis:'1/DL', always:true, conc:true, efecto:'Hasta 3 criaturas: +1d4 a ataques y salvaciones'}
    ]},
    {level:2, title:'Nivel 2', slots:3, spells:[
      {es:'Detectar pensamientos', en:'Detect Thoughts', escuela:'Adivinación', tiempo:'Acción', alcance:'Propio', duracion:'Hasta 1 min', comp:'V S M', coste:'', fuente:'Libro', gratis:'', conc:true, efecto:'Lees pensamientos superficiales a 9 m; sondeo con salv. SAB'},
      {es:'Augurio', en:'Augury', escuela:'Adivinación', tiempo:'1 minuto', alcance:'Propio', duracion:'Instantánea', comp:'V S M', coste:'Tabas o varillas marcadas, 25 po (no se consumen)', fuente:'Experto en adivinación', gratis:'', ritual:true, efecto:'Presagio sobre un plan en los próximos 30 min; 25 % de fallo acumulado si repites antes de un DL'},
      {es:'Ver invisibilidad', en:'See Invisibility', escuela:'Adivinación', tiempo:'Acción', alcance:'Propio', duracion:'1 h', comp:'V S M', coste:'', fuente:'Experto en adivinación', gratis:'', efecto:'Ves criaturas y objetos invisibles, y el Plano Etéreo'},
      {es:'Telaraña', en:'Web', escuela:'Conjuración', tiempo:'Acción', alcance:'18 m', duracion:'Hasta 1 h', comp:'V S M', coste:'', fuente:'Libro', gratis:'', prep:true, conc:true, efecto:'Cubo de 6 m; salv. DES o Apresado; terreno difícil e inflamable'},
      {es:'Sugestión', en:'Suggestion', escuela:'Encantamiento', tiempo:'Acción', alcance:'9 m', duracion:'Hasta 8 h', comp:'V M', coste:'', fuente:'Libro', gratis:'', prep:true, conc:true, efecto:'Salv. SAB o Hechizado; sigue un curso de acción de hasta 25 palabras'},
      {es:'Nube de dagas', en:'Cloud of Daggers', escuela:'Conjuración', tiempo:'Acción', alcance:'18 m', duracion:'Hasta 1 min', comp:'V S M', coste:'', fuente:'Libro', gratis:'', conc:true, efecto:'Cubo de 1,5 m: 4d4 cortante al entrar o empezar turno; se mueve 9 m como acción'},
      {es:'Imagen múltiple', en:'Mirror Image', escuela:'Ilusión', tiempo:'Acción', alcance:'Propio', duracion:'1 min', comp:'V S', coste:'', fuente:'Libro', gratis:'', prep:true, efecto:'3 duplicados ilusorios que desvían ataques'},
      {es:'Paso brumoso', en:'Misty Step', escuela:'Conjuración', tiempo:'Acción adicional', alcance:'Propio', duracion:'Instantánea', comp:'V', coste:'', fuente:'Fey Touched', gratis:'1/DL', always:true, efecto:'Te teletransportas hasta 9 m a un espacio que veas'}
    ]},
    {level:3, title:'Nivel 3', slots:3, spells:[
      {es:'Clarividencia', en:'Clairvoyance', escuela:'Adivinación', tiempo:'10 minutos', alcance:'1,5 km', duracion:'Hasta 10 min', comp:'V S M', coste:'Foco de 100 po: cuerno enjoyado u ojo de cristal (no se consume)', fuente:'Experto en adivinación', gratis:'', conc:true, efecto:'Sensor invisible para ver u oír en un lugar que conozcas'},
      {es:'Contraconjuro', en:'Counterspell', escuela:'Abjuración', tiempo:'Reacción', alcance:'18 m', duracion:'Instantánea', comp:'S', coste:'', fuente:'Libro', gratis:'', prep:true, efecto:'El lanzador hace salv. CON; si falla, su conjuro no surte efecto'},
      {es:'Patrón hipnótico', en:'Hypnotic Pattern', escuela:'Ilusión', tiempo:'Acción', alcance:'36 m', duracion:'Hasta 1 min', comp:'S M', coste:'', fuente:'Libro', gratis:'', prep:true, conc:true, efecto:'Cubo de 9 m; salv. SAB: Hechizado, Incapacitado y velocidad 0'},
      {es:'Disipar magia', en:'Dispel Magic', escuela:'Abjuración', tiempo:'Acción', alcance:'36 m', duracion:'Instantánea', comp:'V S', coste:'', fuente:'Libro', gratis:'', prep:true, efecto:'Acaba conjuros de nivel 3 o menos; los mayores, prueba CD 10 + nivel'},
      {es:'Diminuta cabaña de Leomund', en:"Leomund's Tiny Hut", escuela:'Evocación', tiempo:'1 minuto', alcance:'Propio (3 m)', duracion:'8 h', comp:'V S M', coste:'', fuente:'Libro', gratis:'', ritual:true, efecto:'Cúpula para 9 criaturas; frena conjuros de nivel 3 o menos'}
    ]}
  ]
};
