// Letra de "Every breath you take" (The Police) en formato LRC: [mm:ss.cc] inglés | español.
// Lo que va después de "|" es la traducción: sale abajo, más chiquita, como en las películas subtituladas
// (solo en esta canción; ver "traduccion" en window.SUB_ESPECIAL). Una línea sin texto oculta el subtítulo.
// Para re-sincronizar usa sincronizar.html.
// (El audio dura 3:49 y se desvanece desde ~3:40: las líneas que seguían en la versión de 4:13 ya no se alcanzan.)
// La escena reacciona a palabras en inglés de estas líneas (ver reaccionar() en js/escena-police.js).
window.LETRA_POLICE_LRC = `
[00:15.37] Every breath you take | Cada vez que respiras
[00:19.17] And every move you make | Y cada movimiento que haces
[00:23.23] Every bond you break, every step you take | Cada lazo que rompes, cada paso que das
[00:27.30] I'll be watching you | Te estaré mirando
[00:31.73] Every single day | Todos los días
[00:35.50] And every word you say | Y cada palabra que dices
[00:39.62] Every game you play, every night you stay | Cada juego que juegas, cada noche que te quedas
[00:43.73] I'll be watching you | Te estaré mirando
[00:48.14] Oh, can't you see | Oh, ¿no te das cuenta
[00:52.14] You belong to me? | de que eres mía?
[00:56.11] How my poor heart aches | Cómo me duele el corazón
[01:00.16] With every step you take | con cada paso que das
[01:04.58] Every move you make | Cada movimiento que haces
[01:08.26] And every vow you break | Y cada promesa que rompes
[01:12.40] Every smile you fake, every claim you stake | Cada sonrisa que finges, cada cosa que reclamas
[01:16.47] I'll be watching you | Te estaré mirando
[01:19.68]
[01:22.35] Since you've gone, I've been lost without a trace | Desde que te fuiste ando perdido, sin dejar rastro
[01:26.78] I dream at night, I can only see your face | Sueño de noche y solo veo tu cara
[01:30.84] I look around, but it's you I can't replace | Miro a mi alrededor, pero a ti nadie te reemplaza
[01:34.92] I feel so cold, and I long for your embrace | Tengo tanto frío y extraño tu abrazo
[01:38.92] I keep crying, baby, baby, please | No dejo de llorar, nena, nena, por favor
[01:46.63]
[02:13.98] Oh, can't you see | Oh, ¿no te das cuenta
[02:18.07] You belong to me? | de que eres mía?
[02:22.24] How my poor heart aches | Cómo me duele el corazón
[02:26.06] With every step you take | con cada paso que das
[02:30.35] Every move you make | Cada movimiento que haces
[02:34.14] And every vow you break | Y cada promesa que rompes
[02:38.30] Every smile you fake, every claim you stake | Cada sonrisa que finges, cada cosa que reclamas
[02:42.36] I'll be watching you | Te estaré mirando
[02:46.41] Every move you make, every step you take | Cada movimiento que haces, cada paso que das
[02:50.57] I'll be watching you | Te estaré mirando
[02:53.83]
[02:59.03] I'll be watching you | Te estaré mirando
[03:00.88] (Every breath you take, every move you make) | (Cada vez que respiras, cada movimiento que haces)
[03:04.91] (Every bond you break, every step you take) I'll be watching you | (Cada lazo que rompes, cada paso que das) te estaré mirando
[03:08.94] Every single day, every word you say | Todos los días, cada palabra que dices
[03:13.02] (Every game you play, every night you stay) I'll be watching you | (Cada juego que juegas, cada noche que te quedas) te estaré mirando
[03:17.11] Every move you make, every vow you break | Cada movimiento que haces, cada promesa que rompes
[03:21.26] (Every smile you fake, every claim you stake) I'll be watching you | (Cada sonrisa que finges, cada cosa que reclamas) te estaré mirando
[03:25.26] (Every single day, every word you say) ooh-ooh | (Todos los días, cada palabra que dices) uh-uh
[03:29.45] (Every game you play, every night you stay) I'll be watching you | (Cada juego que juegas, cada noche que te quedas) te estaré mirando
[03:33.51] Every breath you take, every move you make | Cada vez que respiras, cada movimiento que haces
[03:37.57] (Every bond you break, every step you take) I'll be watching you | (Cada lazo que rompes, cada paso que das) te estaré mirando
[03:41.72] Every single day, every word you say | Todos los días, cada palabra que dices
[03:45.79] (Every game you play, every night you stay) I'll be watching you | (Cada juego que juegas, cada noche que te quedas) te estaré mirando
`;

// Partes de la canción (en segundos) para la tipografía de los subtítulos:
// "verso" se escribe a máquina, "coro" va en letras art déco, "puente" en tiras de telegrama y "final" mezcla las dos.
// La escena además reacciona a lo que dice cada línea (ver js/escena-police.js).
window.SECCIONES_POLICE = [
  { desde: 0,     tipo: 'intro' },
  { desde: 15,    tipo: 'verso' },
  { desde: 47.8,  tipo: 'coro' },
  { desde: 64.3,  tipo: 'verso' },
  { desde: 82,    tipo: 'puente' },
  { desde: 106,   tipo: 'intro' },
  { desde: 133.7, tipo: 'coro' },
  { desde: 150,   tipo: 'verso' },
  { desde: 178.5, tipo: 'final' }
];
