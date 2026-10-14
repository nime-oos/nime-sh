// Subtítulos de "Alvafro" (LATIN MAFIA, Fred again..) en formato LRC: [mm:ss.cc] texto.
// Una línea sin texto oculta el subtítulo. Para re-sincronizar usa sincronizar.html.
// (El id de la canción es "mixtape" porque "alvafro" ya lo usan los archivos de "Piensas en mí".)
window.LETRA_MIXTAPE_LRC = `
[00:18.84]¿Dónde está
[00:25.83]Todo eso?
[00:31.19]Si tú lo quieres, pues yo te lo entrego todo
[00:34.59]Si no lo pides, te lo doy de todos modos
[00:39.79]
[00:43.09]¿Dónde estaba eso que me habías pedido?
[00:50.06]¿Dónde está lo nuestro?
[00:57.16]¿Dónde queda eso?
[01:00.43]Lo que habíamos sido, oh
[01:07.54]Mientes tanto y duele
[01:11.14]Cada que te escucho
[01:14.52]Mientes tanto y duele
[01:25.54]
[01:37.47]Ya no me pierdo
[01:40.58]Con lo que me dices
[01:44.50]Ya no recuerdo
[01:47.54]Pero hay cicatrices
[01:51.30]Si estás aquí, no está tan mal
[01:58.37]Si estás aquí, no está tan mal
[02:05.16]Si estás aquí, no está tan mal (uh, uh)
[02:12.18]Si estás aquí, no está tan mal
[02:19.17]No sé cómo se siente lo que me pasa (si estás aquí, no está tan mal)
[02:26.33]Cuando llamo y no me dices nada (si estás aquí, no está tan mal)
[02:33.20]No sé cómo se siente lo que me pasa (si estás aquí, no está tan mal)
[02:40.13]Cuando llamas y no me dices nada (si estás aquí, no está tan mal)
[02:47.00]No, no duele ya
[02:50.52]No, no duele ya
[02:53.93]No, no duele ya
[02:57.44]No, no (y no me dices nada)
[03:00.94]No sé cómo
[03:04.31]Se siente lo que me pasa
[03:07.96]Cuando llamas
[03:12.48]Y no me dices nada
[03:16.53]
[03:28.76]Si estás aquí, no está tan mal
[03:35.79]Si estás aquí, no está tan mal
[03:42.57]
`;

// Partes de la canción (en segundos) para la tipografía de los subtítulos:
// "verso" son subtítulos de video casero (minúsculas, como los letreros de Fred again..);
// "coro" son mensajes de chat ("si estás aquí, no está tan mal", las llamadas y "no duele ya").
// La escena además reacciona a lo que dice cada línea (ver js/escena-mixtape.js).
window.SECCIONES_MIXTAPE = [
  { desde: 0,      tipo: 'intro' },
  { desde: 18.5,   tipo: 'verso' },
  { desde: 111,    tipo: 'coro' },
  { desde: 180.5,  tipo: 'verso' },
  { desde: 208.5,  tipo: 'coro' }
];
