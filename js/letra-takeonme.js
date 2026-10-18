// Subtítulos de "Take on me" (a-ha) traducidos al español, en formato LRC: [mm:ss.cc] texto (mismos tiempos que la letra original).
// Una línea sin texto oculta el subtítulo. Para re-sincronizar usa sincronizar.html.
// (El audio dura 3:40: las últimas dos líneas caen en el desvanecido y la última ya no se alcanza a ver.)
// La escena reacciona a palabras de estas líneas (ver reaccionar() en js/escena-takeonme.js): si se cambia la
// traducción, hay que revisar esas palabras.
window.LETRA_TAKEONME_LRC = `
[00:33.92] Hablando sin parar
[00:37.23] No sé qué debo decir
[00:40.04] Lo diré de todos modos
[00:42.73] Hoy es otro día para encontrarte
[00:46.39] Tímida, te alejas
[00:48.89] Iré por tu amor, ¿okay?
[00:51.39] Tómame (tómame)
[00:56.96] Acéptame (tómame)
[01:02.56] Me iré
[01:07.34] En un día o dos
[01:13.74] Así que, ni hace falta decirlo
[01:16.95] Estoy hecho de retazos, pero soy yo
[01:19.52] Me voy tropezando
[01:22.57] Aprendiendo despacio que la vida está bien
[01:25.48] Repite conmigo
[01:28.60] "No es mejor ir a lo seguro que lamentarse"
[01:31.14] Tómame (tómame)
[01:37.00] Acéptame (tómame)
[01:42.67] Me iré
[01:47.36] En un día o dos
[01:55.97]
[02:33.27] Todas las cosas que dices, sí
[02:37.37] ¿Es la vida, o solo un juego para olvidar mis penas?
[02:42.23] Eres todo lo que tengo que recordar
[02:45.60] Tímida, te alejas
[02:48.53] Iré por ti de todos modos
[02:51.20] Tómame (tómame)
[02:55.72] Acéptame (tómame)
[03:01.93] Me iré
[03:06.74] En un día (tómame)
[03:11.74] Tómame (acéptame)
[03:17.31] Tómame
[03:19.36] Me iré (tómame, tómame)
[03:24.68] En un día (acéptame, tómame)
[03:30.76] Tómame (tómame)
[03:36.39] Acéptame (tómame)
[03:42.07] Tómame
[03:45.05]
`;

// Partes de la canción (en segundos) para la tipografía de los subtítulos:
// "verso" son recuadros de narración de cómic; "coro" son letras de onomatopeya sobre una explosión.
// La escena además reacciona a lo que dice cada línea (ver js/escena-takeonme.js).
window.SECCIONES_TAKEONME = [
  { desde: 0,      tipo: 'intro' },
  { desde: 33.5,   tipo: 'verso' },
  { desde: 51,     tipo: 'coro' },
  { desde: 73.5,   tipo: 'verso' },
  { desde: 91,     tipo: 'coro' },
  { desde: 153,    tipo: 'verso' },
  { desde: 171,    tipo: 'coro' }
];
