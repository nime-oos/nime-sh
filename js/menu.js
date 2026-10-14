// Menú de canciones: "portaditas" de crayón pegadas con cinta en la esquina.
// Al elegir una, un borrón de crayón tapa la pantalla con el título de la canción, se cambia
// la escena, la letra y el audio, y el borrón se va. Al terminar una canción sigue la otra.
(function () {
  var audio = document.getElementById('bg-music');
  var C = window.Crayon;
  if (!audio || !C || !window.cargarLetra) return;

  window.Escenas = window.Escenas || {};
  window.Escenas.nada = window.Escenas.nada || { el: document.getElementById('escena'), activar: function () {}, desactivar: function () {} };

  var CANCIONES = [
    { id: 'nada', lado: 'lado A', titulo: 'No digas nada', src: 'musica/LATIN MAFIA - No digas nada (LYRIC VIDEO).mp3',
      lrc: window.LETRA_LRC, secciones: window.SECCIONES,
      borron: ['#2ba6ea', '#3ab4f0', '#1f93dc', '#5cc4f4', '#25a58c', '#34b58b'], base: '#2fa9ea', tinta: '#ebe6da', sombra: '#1f8fd6' },
    { id: 'humano', lado: 'lado B', titulo: 'Más humano', src: 'musica/LATIN MAFIA Más humano (Audio Oficial).mp3',
      lrc: window.LETRA_HUMANO_LRC, secciones: window.SECCIONES_HUMANO,
      borron: ['#121a15', '#1e2c1e', '#1f7a5a', '#3d6a9a', '#b06a3a', '#0c110f'], base: '#101612', tinta: '#ebe6da', sombra: '#e07a35' },
    { id: 'alvafro', enlace: 'piensas-en-mi', lado: 'lado C', titulo: 'Piensas en mí', src: 'musica/Fred again.., LATIN MAFIA - Piensas En Mi.mp3',
      lrc: window.LETRA_ALVAFRO_LRC, secciones: window.SECCIONES_ALVAFRO,
      borron: ['#ecebe6', '#dcdcd6', '#b5c2c9', '#8fa3b0', '#f6f5f0', '#6f8796'], base: '#e4e3dd', tinta: '#c8332a', sombra: '#6f8796' },
    { id: 'luna', lado: 'lado D', titulo: 'Luna', src: 'musica/Zoé - Luna (MTV Unplugged).mp3',
      lrc: window.LETRA_LUNA_LRC, secciones: window.SECCIONES_LUNA,
      borron: ['#0d1a3a', '#12244f', '#1b3570', '#2b5fb8', '#e8892e', '#2a1f4f'], base: '#0f1b3d', tinta: '#f3e9b8', sombra: '#e8892e' },
    { id: 'labios', enlace: 'labios-rotos', lado: 'lado E', titulo: 'Labios rotos', src: 'musica/Labios Rotos - Zoé Letra. ♡.mp3',
      lrc: window.LETRA_LABIOS_LRC, secciones: window.SECCIONES_LABIOS,
      borron: ['#e8243f', '#c81d3a', '#f03a50', '#3a1a22', '#ff5a6a', '#1e1418'], base: '#d81e3a', tinta: '#ffe0e4', sombra: '#3a1a22' },
    { id: 'sone', enlace: 'sone', lado: 'lado F', titulo: 'Soñé', src: 'musica/Soñé (Unplugged) - Zoé Letra.mp3',
      lrc: window.LETRA_SONE_LRC, secciones: window.SECCIONES_SONE,
      borron: ['#1a1c48', '#2e2a68', '#4a3480', '#8a6ad8', '#e8a0b0', '#141a3a'], base: '#22245a', tinta: '#f8e8ff', sombra: '#e8506a' },
    { id: 'luz', enlace: 'luz-de-dia', lado: 'lado G', titulo: 'Luz de día', src: 'musica/Enanitos Verdes - Luz de Día (Letra Lyrics).mp3',
      lrc: window.LETRA_LUZ_LRC, secciones: window.SECCIONES_LUZ,
      borron: ['#14121c', '#2a2236', '#f08a2a', '#6a2a8a', '#f6d98a', '#1e3a2a'], base: '#14121c', tinta: '#f6d98a', sombra: '#f08a2a' },
    { id: 'ciudad', enlace: 'ciudad-de-las-luces', lado: 'lado H', titulo: 'Ciudad de las luces', src: 'musica/ciudad de las luces; latin mafia letra.mp3',
      lrc: window.LETRA_CIUDAD_LRC, secciones: window.SECCIONES_CIUDAD,
      borron: ['#100c30', '#2a1660', '#ff3aa0', '#3ae8ff', '#6a1a6a', '#ffd23a'], base: '#100c30', tinta: '#ffd2ea', sombra: '#ff3aa0' },
    { id: 'ayer', enlace: 'igual-que-ayer', lado: 'lado I', titulo: 'Igual que ayer', src: 'musica/Igual que ayer - Enanitos verdes Letra.mp3',
      lrc: window.LETRA_AYER_LRC, secciones: window.SECCIONES_AYER,
      borron: ['#121a3c', '#24305e', '#5a4a7a', '#ffd36a', '#3e5070', '#8a7a90'], base: '#121a3c', tinta: '#fff0c0', sombra: '#ffb03a' },
    { id: 'porti', enlace: 'es-por-ti', lado: 'lado J', titulo: 'Es por ti', src: 'musica/Juanes - Es Por Ti (Official Music Video).mp3',
      lrc: window.LETRA_PORTI_LRC, secciones: window.SECCIONES_PORTI,
      borron: ['#08283a', '#0e4a68', '#ff7a2a', '#c8342a', '#1a7ab8', '#ffc04a'], base: '#0b3448', tinta: '#fff0c0', sombra: '#ff5a7a' },
    { id: 'cinta', enlace: 'just-the-way-you-are', lado: 'lado K', titulo: 'Just the way you are', src: 'musica/Bruno Mars - Just The Way You Are Sub. Español + Lyrics.mp3',
      lrc: window.LETRA_CINTA_LRC, secciones: window.SECCIONES_CINTA,
      borron: ['#e8d6b4', '#d8c09a', '#24160f', '#3a2416', '#efe2c8', '#8a5a3a'], base: '#e8d6b4', tinta: '#24160f', sombra: '#e2a94a' },
    { id: 'mirada', enlace: 'cant-take-my-eyes-off-you', lado: 'lado L', titulo: "Can't take my eyes off you", src: "musica/Frankie Valli - Can't take my eyes off of you (I Love You Baby)-[traducida sub. español].mp3",
      lrc: window.LETRA_MIRADA_LRC, secciones: window.SECCIONES_MIRADA,
      borron: ['#120a24', '#2a1650', '#5c2a6e', '#f07a1a', '#ffd27a', '#1c1232'], base: '#1c1232', tinta: '#ff9a3a', sombra: '#5c2a6e' },
    { id: 'brillas', enlace: 'brillas', lado: 'lado M', titulo: 'Brillas', src: 'musica/León Larregui - Brillas (Letra).mp3',
      lrc: window.LETRA_BRILLAS_LRC, secciones: window.SECCIONES_BRILLAS,
      borron: ['#140830', '#2a0f5a', '#8a2f86', '#ff9ad8', '#ffd27a', '#5ad8f0'], base: '#1d0b48', tinta: '#ffd27a', sombra: '#ff5ab8' },
    { id: 'virgen', enlace: 'virgen', lado: 'lado N', titulo: 'Virgen', src: "musica/Adolescent's Orquesta - Virgen (Audio Oficial).mp3",
      lrc: window.LETRA_VIRGEN_LRC, secciones: window.SECCIONES_VIRGEN,
      borron: ['#2a0a1e', '#5a0f2e', '#d81e4a', '#f2c46a', '#8a1a3a', '#1a0612'], base: '#2a0a1e', tinta: '#f2c46a', sombra: '#d81e4a' },
    { id: 'mixtape', enlace: 'alvafro', lado: 'lado O', titulo: 'Alvafro', src: 'musica/LATIN MAFIA, Fred again.. - Alvafro.mp3',
      lrc: window.LETRA_MIXTAPE_LRC, secciones: window.SECCIONES_MIXTAPE,
      borron: ['#0b1430', '#14244a', '#1e3a6a', '#3ad8ff', '#ff4ab8', '#c8955a'], base: '#0e1a36', tinta: '#f4efe6', sombra: '#ff4ab8' }
  ];

  // mini portadas dibujadas con marcador
  var MINI = {
    nada: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#2fa9ea"/>' +
      '<path d="M12 40 C14 26 24 22 40 20 C62 18 80 19 88 24 C94 30 92 70 84 78 C70 86 36 86 20 82 C10 78 8 54 12 40Z" fill="#27a88e" stroke="#161616" stroke-width="4"/>' +
      '<path d="M26 44 C26 34 46 32 48 44Z M54 44 C54 34 76 34 76 46Z" fill="none" stroke="#161616" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M28 58 C44 54 64 54 80 58 C80 70 70 76 54 76 C40 76 28 72 28 58Z" fill="none" stroke="#161616" stroke-width="3.5"/>' +
      '<path d="M22 56 C16 52 16 46 20 45 C23 44 24 47 24 48 C25 45 29 45 29 49 C29 52 26 54 22 56Z M82 62 C76 58 76 52 80 51 C83 50 84 53 84 54 C85 51 89 51 89 55 C89 58 86 60 82 62Z" fill="#d13a22"/>' +
      '</svg>',
    humano: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#101612"/>' +
      '<path d="M0 0 H100 V40 H0Z" fill="#18241b"/><circle cx="30" cy="22" r="9" fill="#fff4dc" opacity=".55"/>' +
      '<rect x="0" y="40" width="100" height="16" fill="#c8743c" opacity=".55"/><rect x="0" y="56" width="100" height="10" fill="#2a5a30"/>' +
      '<path d="M20 38 L100 37 L100 42 L20 43Z" fill="#1f9a6e" stroke="#161616" stroke-width="2"/>' +
      '<rect x="40" y="45" width="18" height="3" fill="#fff"/>' +
      '<path d="M34 43 V68 M72 42 V68" stroke="#8fa0a6" stroke-width="3"/>' +
      '<path d="M36 66 H72" stroke="#a39d8e" stroke-width="3"/><circle cx="41" cy="58" r="2.6" fill="#d9a27a"/><path d="M38 61 H44 V66 H38Z" fill="#2d3f35"/><path d="M38 66 H44 V70" stroke="#3f6fae" stroke-width="2.4" fill="none"/>' +
      '<rect x="0" y="70" width="100" height="4" fill="#3a2420"/>' +
      '<path d="M0 80 H100 M0 88 H100 M0 95 H100" stroke="#5b8fc4" stroke-width="3" opacity=".7"/><path d="M0 84 H100 M0 92 H100" stroke="#b06a3a" stroke-width="3" opacity=".7"/>' +
      '</svg>',
    alvafro: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0d0b0a"/><rect y="0" width="100" height="12" fill="#3a2a1e"/>' +
      '<rect y="78" width="100" height="22" fill="#5a554e"/>' +
      '<path d="M20 14 H82 V76 H20Z" fill="#ecebe6" stroke="#161616" stroke-width="2"/>' +
      '<path d="M30 60 C26 40 44 26 62 32 C76 38 76 58 60 64" fill="none" stroke="#8fa3b0" stroke-width="6" opacity=".6"/>' +
      '<rect x="27" y="22" width="9" height="9" fill="#5aa8b0"/><rect x="37" y="21" width="9" height="9" fill="#4a8a96"/><rect x="28" y="32" width="9" height="9" fill="#27a88e"/>' +
      '<rect x="50" y="50" width="10" height="12" fill="#b0646a"/><rect x="61" y="48" width="5" height="5" fill="#c9a48a"/><rect x="67" y="48" width="5" height="5" fill="#8a6a5a"/><rect x="73" y="48" width="5" height="5" fill="#d8c3b0"/>' +
      '<rect x="61" y="54" width="5" height="5" fill="#6a7f8a"/><rect x="67" y="54" width="5" height="5" fill="#b07a6a"/><rect x="73" y="54" width="5" height="5" fill="#9ab0a8"/>' +
      '<rect x="61" y="60" width="5" height="5" fill="#a89a7a"/><rect x="67" y="60" width="5" height="5" fill="#7a8aa0"/><rect x="73" y="60" width="5" height="5" fill="#c9a48a"/>' +
      '<path d="M62 20 H78" stroke="#c8332a" stroke-width="2"/>' +
      '<path d="M86 30 L90 86 M94 30 L98 86 M87 44 H95 M88 58 H96 M89 72 H97" stroke="#a7adb2" stroke-width="2"/>' +
      '<path d="M84 18 H100 V50 C96 52 90 50 84 52Z" fill="#e9e8e2" opacity=".8"/>' +
      '<path d="M0 84 C10 78 26 80 30 88 V100 H0Z" fill="#c9cdcd"/>' +
      '</svg>',
    luna: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0f1b3d"/>' +
      '<path d="M20 62 V14 M50 62 V40 M80 62 V14" stroke="#2b5fb8" stroke-width="7" opacity=".45"/>' +
      '<rect y="62" width="100" height="38" fill="#1c2333"/>' +
      '<path d="M0 76 L30 72 L42 100 H0Z" fill="#8a2a22"/><path d="M56 80 L100 76 V100 H62Z" fill="#2f3478"/>' +
      '<path d="M60 86 Q66 82 72 86 T84 86 T96 86" stroke="#e8d6a8" stroke-width="1.5" fill="none"/>' +
      '<circle cx="50" cy="20" r="12" fill="#f3e9b8" stroke="#161616" stroke-width="2"/><circle cx="45" cy="16" r="2.6" fill="#d9c98a"/><circle cx="55" cy="25" r="2" fill="#d9c98a"/>' +
      '<path d="M10 28 V62 M89 36 V62" stroke="#3a3f4a" stroke-width="1.5"/><circle cx="10" cy="24" r="6" fill="#f2a03a" stroke="#161616" stroke-width="1.2"/><circle cx="89" cy="32" r="5" fill="#f2a03a" stroke="#161616" stroke-width="1.2"/>' +
      '<path d="M58 66 L56 86 M66 66 L68 86" stroke="#8a9095" stroke-width="2"/><ellipse cx="62" cy="66" rx="8" ry="2.6" fill="#e8892e" stroke="#161616" stroke-width="1"/>' +
      '<path d="M56 46 H68 L70 65 H54Z" fill="#1e2230"/><circle cx="62" cy="41" r="5" fill="#d9a27a"/><path d="M56 42 C54 33 70 33 68 42 C66 38 58 38 56 42Z" fill="#1a1412"/>' +
      '<path d="M50 56 L32 48" stroke="#3a2418" stroke-width="2.5"/>' +
      '<path d="M48 56 C48 50 56 50 58 53 C61 49 71 51 71 57 C71 63 61 64 58 61 C56 64 48 63 48 56Z" fill="#d89a52" stroke="#161616" stroke-width="1.2"/>' +
      '</svg>',
    labios: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#170f12"/>' +
      '<circle cx="42" cy="44" r="40" fill="#e8243f"/><circle cx="36" cy="36" r="22" fill="#ff5a6a" opacity=".4"/>' +
      '<path d="M36 74 C34 60 34 40 30 18 M36 74 C40 56 46 38 50 16 M36 74 C30 62 22 52 16 44" stroke="#1c0a0f" stroke-width="2" fill="none" opacity=".85"/>' +
      '<circle cx="30" cy="16" r="9" fill="#1c0a0f" opacity=".85"/><circle cx="50" cy="14" r="9" fill="#1c0a0f" opacity=".85"/><circle cx="16" cy="42" r="10" fill="#1c0a0f" opacity=".85"/>' +
      '<path d="M26 100 C24 90 28 84 34 82 L46 82 C52 86 52 92 50 100Z" fill="#1c0a0f" opacity=".85"/>' +
      '<path d="M60 84 C58 66 54 48 54 34 M60 84 C64 70 70 58 78 50 M60 84 C56 72 46 64 40 60" stroke="#2a1418" stroke-width="2" fill="none"/>' +
      '<circle cx="54" cy="32" r="8" fill="#f8c8cc" stroke="#161616" stroke-width="1.5"/><circle cx="54" cy="32" r="2.6" fill="#5a1420"/>' +
      '<circle cx="78" cy="48" r="6.5" fill="#f4b0b8" stroke="#161616" stroke-width="1.5"/><circle cx="78" cy="48" r="2" fill="#5a1420"/>' +
      '<circle cx="40" cy="60" r="6" fill="#a8182e" stroke="#161616" stroke-width="1.5"/>' +
      '<path d="M52 84 C50 90 48 94 49 100 L71 100 C72 94 70 90 68 84Z" fill="#f2a8b0" stroke="#161616" stroke-width="1.8"/><ellipse cx="60" cy="84" rx="8" ry="2" fill="#f6c2c8" stroke="#161616" stroke-width="1.2"/>' +
      '</svg>',
    sone: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#22245a"/><rect y="70" width="100" height="30" fill="#9a5a98" opacity=".7"/>' +
      '<circle cx="12" cy="10" r="1.8" fill="#fff6c8"/><circle cx="60" cy="8" r="1.6" fill="#fff"/><circle cx="40" cy="90" r="1.6" fill="#fff6c8"/>' +
      '<path d="M88 4 A8 8 0 1 0 88 20 A4 8 0 1 1 88 4Z" fill="#f6eec8" stroke="#161616" stroke-width="1"/>' +
      '<path d="M-2 26 Q50 46 102 26" stroke="#161616" stroke-width="1.6" fill="none"/>' +
      '<circle cx="18" cy="32" r="1.8" fill="#ffd36a"/><circle cx="50" cy="37" r="1.8" fill="#ff9ab8"/><circle cx="82" cy="32" r="1.8" fill="#bfe0ff"/>' +
      [[20, 31, -6, '#a8c4bc', '#161418'], [50, 36, 0, '#ebe8e1', '#8e3a28'], [80, 31, 6, '#f8c8d8', '#f6f3ec']].map(function (p) {
        return '<g transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')"><rect x="' + (p[0] - 13) + '" y="' + (p[1] + 1) + '" width="26" height="32" fill="#f6f3ec" stroke="#161616" stroke-width="1.2"/>' +
          '<rect x="' + (p[0] - 11) + '" y="' + (p[1] + 3) + '" width="22" height="22" fill="' + p[3] + '"/>' +
          '<path d="M' + (p[0] - 7) + ' ' + (p[1] + 25) + ' C' + (p[0] - 8) + ' ' + (p[1] + 12) + ' ' + (p[0] - 6) + ' ' + (p[1] + 5) + ' ' + p[0] + ' ' + (p[1] + 5) + ' C' + (p[0] + 6) + ' ' + (p[1] + 5) + ' ' + (p[0] + 8) + ' ' + (p[1] + 12) + ' ' + (p[0] + 7) + ' ' + (p[1] + 25) + 'Z" fill="#140d0a"/>' +
          '<path d="M' + (p[0] - 7) + ' ' + (p[1] + 25) + ' C' + (p[0] - 6) + ' ' + (p[1] + 21) + ' ' + (p[0] + 6) + ' ' + (p[1] + 21) + ' ' + (p[0] + 7) + ' ' + (p[1] + 25) + 'Z" fill="' + p[4] + '"/>' +
          '<ellipse cx="' + p[0] + '" cy="' + (p[1] + 13) + '" rx="4.2" ry="5" fill="#e4b08c"/>' +
          '<circle cx="' + (p[0] - 2) + '" cy="' + (p[1] + 13) + '" r="1.8" fill="none" stroke="#c8a070" stroke-width=".6"/><circle cx="' + (p[0] + 2) + '" cy="' + (p[1] + 13) + '" r="1.8" fill="none" stroke="#c8a070" stroke-width=".6"/>' +
          '<rect x="' + (p[0] - 1.2) + '" y="' + (p[1] - 3) + '" width="2.4" height="6" fill="#d8b07a"/></g>';
      }).join('') +
      '</svg>',
    luz: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#100e22"/>' +
      '<circle cx="60" cy="40" r="30" fill="#f6d98a" stroke="#161616" stroke-width="1.6"/>' +
      '<path d="M20 100 C26 84 38 70 50 66 C60 63 70 62 80 64 C88 66 92 72 90 78 C88 84 82 84 81 80" stroke="#161616" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 63 L54 42 M50 63 L50 46 M52 46 L52 38" stroke="#121016" stroke-width="2.4"/><ellipse cx="52" cy="35" rx="3.6" ry="4.4" fill="#f4f1e8" stroke="#161616" stroke-width=".8"/>' +
      '<circle cx="50.6" cy="34.4" r=".9" fill="#121016"/><circle cx="53.4" cy="34.4" r=".9" fill="#121016"/>' +
      '<path d="M66 63 L64 54 L72 54 L70 63Z" fill="#6a8ab8"/><path d="M64 54 L66 46 L70 46 L72 54Z" fill="#4a6a9a"/><circle cx="68" cy="43" r="3" fill="#c8d8ec"/><path d="M65 41 C66 38 70 38 71 41 C72 46 74 48 73 52" fill="#b8322a"/>' +
      '<path d="M55 48 L65 49" stroke="#121016" stroke-width="1.4"/>' +
      '<path d="M2 100 C10 92 40 92 48 100Z" fill="#1c1626"/><path d="M14 84 C6 84 6 98 14 98 C22 98 22 84 14 84Z" fill="#f08a2a" stroke="#161616" stroke-width="1.2"/>' +
      '<path d="M10 88 l2 2 l2 -2 M16 88 l2 2 l2 -2 M10 93 Q14 96 18 93" stroke="#ffd35a" stroke-width="1.2" fill="none"/>' +
      '<path d="M24 20 c-2 -3 -6 -3 -9 -1 c2 1 2 2 1 4 c3 -1 5 -1 8 0 c3 -1 5 -1 8 0 c-1 -2 -1 -3 1 -4 c-3 -2 -7 -2 -9 1Z" fill="#121016"/>' +
      '</svg>',
    ciudad: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#100c30"/>' +
      '<path d="M0 74 V44 H12 V74 M14 74 V32 H26 V74 M76 74 V36 H88 V74 M90 74 V50 H100 V74" fill="#16142a" stroke="#161616" stroke-width="1"/>' +
      '<rect x="4" y="50" width="3" height="4" fill="#ffd23a"/><rect x="18" y="40" width="3" height="4" fill="#ff9ad0"/><rect x="80" y="44" width="3" height="4" fill="#9ae8ff"/><rect x="93" y="58" width="3" height="4" fill="#ffd23a"/>' +
      '<path d="M50 42 L36 74 M50 42 L64 74" stroke="#8a86a0" stroke-width="3"/>' +
      '<circle cx="50" cy="42" r="26" fill="none" stroke="#e8e4f0" stroke-width="2.4"/>' +
      '<path d="M50 16 V68 M24 42 H76 M32 24 L68 60 M68 24 L32 60" stroke="#c8c4d8" stroke-width="1.2"/>' +
      ['#ff3aa0', '#3ae8ff', '#ffd23a', '#a05aff', '#5aff9a', '#ff7a3a', '#ff3aa0', '#3ae8ff'].map(function (c, i) {
        var a = i / 8 * Math.PI * 2, x = 50 + Math.cos(a) * 26, y = 42 + Math.sin(a) * 26;
        return '<rect x="' + (x - 4).toFixed(1) + '" y="' + (y + 1).toFixed(1) + '" width="8" height="7" rx="1.5" fill="' + c + '" stroke="#161616" stroke-width=".8"/>';
      }).join('') +
      '<circle cx="50" cy="42" r="3.5" fill="#ff3aa0" stroke="#161616" stroke-width=".8"/>' +
      '<rect y="76" width="100" height="24" fill="#0e1640"/><path d="M0 74 H100" stroke="#3a3654" stroke-width="3"/>' +
      '<path d="M10 86 q6 -2 12 0 M40 92 q6 -2 12 0 M70 84 q6 -2 12 0" stroke="#9af4ff" stroke-width="1.2" fill="none"/>' +
      '<circle cx="84" cy="12" r="6" fill="#f6eec8" stroke="#161616" stroke-width=".8"/>' +
      '</svg>',
    ayer: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#121a3c"/>' +
      '<circle cx="16" cy="16" r="8" fill="#eef0f6" stroke="#161616" stroke-width=".8"/>' +
      '<path d="M8 78 L14 62 L30 58 L60 57 L86 60 L92 70 L94 80Z" fill="#5a4058" stroke="#161616" stroke-width="1"/>' +
      '<path d="M20 60 V44 H46 V60Z M54 60 V40 H60 V60Z M64 60 V34 H72 V60Z M76 60 V44 H82 V60Z" fill="#8a7a90" stroke="#161616" stroke-width=".8"/>' +
      '<path d="M19 45 L22 38 L44 37 L47 45Z M53 40 L57 26 L61 40Z M63 34 L68 16 L73 34Z M75 44 L79 32 L83 44Z" fill="#3e5070" stroke="#161616" stroke-width=".8"/>' +
      '<path d="M40 50 V30 C40 28 50 28 50 30 V50Z" fill="#8a7a90" stroke="#161616" stroke-width=".8"/><path d="M39 31 L45 10 L51 31Z" fill="#3e5070" stroke="#161616" stroke-width=".8"/>' +
      '<rect x="23" y="49" width="2" height="4" fill="#ffd36a"/><rect x="28" y="49" width="2" height="4" fill="#ffd36a"/><rect x="33" y="49" width="2" height="4" fill="#ffd36a"/><rect x="38" y="49" width="2" height="4" fill="#ffd36a"/>' +
      '<rect x="44" y="36" width="2" height="3" fill="#ffd36a"/><rect x="67" y="40" width="2" height="3" fill="#ffd36a"/>' +
      '<rect y="80" width="100" height="20" fill="#141a40"/><path d="M10 86 h10 M40 90 h14 M70 86 h10" stroke="#c8d8ff" stroke-width="1.2"/>' +
      '<rect x="84" y="22" width="3" height="8" fill="#f4ecd6"/><path d="M85.5 22 c-1 -2 1 -3 0 -5" stroke="#ffc04a" stroke-width="1.4" fill="none"/>' +
      '</svg>',
    porti: '<svg viewBox="0 0 100 100"><rect width="100" height="56" fill="#c8342a"/><rect width="100" height="22" fill="#5a1a48"/><rect y="40" width="100" height="16" fill="#ff8a3a"/>' +
      '<circle cx="46" cy="54" r="9" fill="#ff4a2a" stroke="#161616" stroke-width=".8"/>' +
      '<rect y="56" width="100" height="18" fill="#a83a2a"/><path d="M40 60 h12 M36 64 h20 M32 69 h28" stroke="#ffb040" stroke-width="1.4"/>' +
      '<path d="M0 72 L100 71 L100 77 L0 78Z" fill="#c8d0d8" stroke="#161616" stroke-width=".8"/><rect y="78" width="100" height="22" fill="#3a4452"/>' +
      '<path d="M8 92 h14 M36 92 h14 M64 92 h14" stroke="#e8ecf0" stroke-width="1.4"/>' +
      '<circle cx="20" cy="83" r="5" fill="#1a1a22"/><circle cx="38" cy="83" r="5" fill="#1a1a22"/><path d="M14 75 L24 77 L28 72 C32 70 38 72 42 76 L40 80 L24 81Z" fill="#2a4ab8" stroke="#161616" stroke-width=".6"/><path d="M38 72 L41 69 L42 75Z" fill="#9ad0f0" stroke="#161616" stroke-width=".4"/><path d="M24 78 L40 78" stroke="#e8c83a" stroke-width="1"/>' +
      '<path d="M62 50 h6 v30 h-6Z" fill="#b8c43a" stroke="#161616" stroke-width=".6"/><circle cx="65" cy="47" r="3.6" fill="#7a4a2a"/>' +
      '<path d="M70 58 h6 l2 22 h-10Z" fill="#d83a2a" stroke="#161616" stroke-width=".6"/><path d="M70 52 h6 v7 h-6Z" fill="#1e1c26"/><circle cx="73" cy="49" r="3.2" fill="#3aa898"/>' +
      '<circle cx="88" cy="36" r="5" fill="#d82a2a" stroke="#161616" stroke-width=".6"/><circle cx="88" cy="36" r="3.4" fill="#2a4ab8"/><path d="M88 41 V78" stroke="#a8b0bc" stroke-width="1.2"/>' +
      '</svg>',
    cinta: '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#ead8b6"/><path d="M0 30 C30 28 60 34 100 31 M0 64 C40 62 70 68 100 65" stroke="#c8a878" stroke-width=".8" fill="none"/>' +
      '<g transform="translate(8 62) rotate(-8)"><rect width="40" height="26" rx="2.5" fill="#33373e" stroke="#16181c" stroke-width=".8"/><rect x="3" y="3" width="34" height="13" rx="1.5" fill="#f4ecd8"/>' +
      '<rect x="3" y="3" width="34" height="2.4" fill="#e2a94a"/><rect x="10" y="9" width="20" height="6" rx="1.5" fill="#1a1c20"/><circle cx="14" cy="12" r="2" fill="#f2f2ee"/><circle cx="26" cy="12" r="2" fill="#f2f2ee"/></g>' +
      '<path d="M40 86 C50 90 56 82 52 76 C48 70 54 64 60 66" stroke="#24160f" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 66 C62 58 58 50 58 40 C58 26 66 18 72 18 C80 18 88 26 87 40 C87 50 84 58 86 66" stroke="#24160f" stroke-width="1.6" fill="none"/>' +
      '<path d="M64 36 C66 28 78 26 82 36 M66 40 c2 -1 4 -1 6 0 M76 40 c2 -1 4 -1 6 0 M70 50 c2 1.6 6 1.6 8 0" stroke="#24160f" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<path d="M56 30 c-3 4 -2 10 1 14 M90 30 c3 4 2 10 -1 14 M58 46 c-3 2 -2 6 0 8 M88 46 c3 2 2 6 0 8" stroke="#24160f" stroke-width="1.3" fill="none"/>' +
      '</svg>',
    mirada: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mnH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a24"/><stop offset=".7" stop-color="#5c2a6e"/><stop offset="1" stop-color="#f08a4a"/></linearGradient></defs>' +
      '<rect width="100" height="100" fill="url(#mnH)"/><circle cx="66" cy="34" r="22" fill="#ffe6a8"/><circle cx="60" cy="28" r="4" fill="#ecc788" opacity=".6"/><circle cx="74" cy="40" r="5" fill="#ecc788" opacity=".6"/>' +
      '<path d="M22 6 l3 2 l-3 2 M12 16 h2" stroke="#fff" stroke-width=".8"/>' +
      '<path d="M30 70 L30 46 L36 40 L42 46 L42 52 L58 52 L58 46 L64 30 L70 46 L70 70Z" fill="#2c2048" stroke="#120a1e" stroke-width=".8"/>' +
      '<rect x="33" y="54" width="4" height="6" fill="#ffb84a"/><rect x="46" y="56" width="4" height="6" fill="#ffb84a"/><rect x="62" y="50" width="4" height="6" fill="#ffb84a"/><rect x="62" y="60" width="4" height="6" fill="#2a1e44"/>' +
      '<path d="M0 72 C30 64 70 66 100 70 L100 100 L0 100Z" fill="#1a1230"/>' +
      '<path d="M4 80 v-8 M10 80 v-8 M16 80 v-8 M22 80 v-8 M0 76 h26" stroke="#0c0614" stroke-width="1.2"/>' +
      '<path d="M40 84 v-10 a5 5 0 0 1 10 0 v10Z" fill="#7a70a0" stroke="#120a1e" stroke-width=".8"/>' +
      '<ellipse cx="78" cy="86" rx="11" ry="9" fill="#f0801c" stroke="#3a1406" stroke-width=".8"/><path d="M73 84 l2 -3 l2 3Z M79 84 l2 -3 l2 3Z M72 89 q6 4 12 0" fill="#ffd84a" stroke="#ffd84a" stroke-width=".6"/>' +
      '<path d="M78 77 q1 -3 3 -3" stroke="#4a5a22" stroke-width="1.6" fill="none"/>' +
      '<path d="M20 24 c-2 -2 -5 -2 -7 0 c2 0 2 2 1 3 c2 -1 4 -1 6 0 c2 -1 4 -1 6 0 c-1 -1 -1 -3 1 -3 c-2 -2 -5 -2 -7 0Z" fill="#100818"/>' +
      '<ellipse cx="10" cy="90" rx="2.4" ry="1.6" fill="#ffd84a"/><ellipse cx="16" cy="90" rx="2.4" ry="1.6" fill="#ffd84a"/>' +
      '</svg>',
    brillas: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mnB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0522"/><stop offset=".45" stop-color="#4a1670"/><stop offset=".8" stop-color="#d8607e"/><stop offset="1" stop-color="#f2967a"/></linearGradient>' +
      '<radialGradient id="mnBL" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="#c8b4e8"/></radialGradient></defs>' +
      '<rect width="100" height="100" fill="url(#mnB)"/><circle cx="50" cy="42" r="22" fill="#ffe8f8" opacity=".25"/><circle cx="50" cy="42" r="13" fill="url(#mnBL)"/>' +
      '<path d="M50 42 m-30 0 c0 -26 30 -30 40 -14 c8 12 -2 26 -14 22 c-10 -4 -8 -16 2 -16" stroke="#ffd27a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 42 m30 0 c0 26 -30 30 -40 14 c-8 -12 2 -26 14 -22 c10 4 8 16 -2 16" stroke="#6ae8ff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="20" cy="42" r="3" fill="#fff6d8"/><circle cx="80" cy="42" r="3" fill="#e8fcff"/>' +
      '<path d="M14 14 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2Z M84 12 l.8 2 l2 .8 l-2 .8 l-.8 2 l-.8 -2 l-2 -.8 l2 -.8Z M70 24 l.6 1.4 l1.4 .6 l-1.4 .6 l-.6 1.4 l-.6 -1.4 l-1.4 -.6 l1.4 -.6Z" fill="#fff"/>' +
      '<path d="M0 80 C14 72 26 74 36 78 C48 70 60 68 72 76 C82 72 92 72 100 76 L100 100 L0 100Z" fill="#2a1240"/><rect y="88" width="100" height="12" fill="#1a0a2e"/>' +
      '<rect x="44" y="90" width="12" height="1.4" rx=".7" fill="#ffe8f8" opacity=".7"/><rect x="46" y="94" width="8" height="1.2" rx=".6" fill="#ffe8f8" opacity=".5"/>' +
      '</svg>',
    virgen: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mnV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10030f"/><stop offset=".6" stop-color="#3e0f30"/><stop offset="1" stop-color="#6a1c38"/></linearGradient>' +
      '<linearGradient id="mnVO" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c0"/><stop offset=".5" stop-color="#c8902a"/><stop offset="1" stop-color="#f6d88a"/></linearGradient></defs>' +
      '<rect width="100" height="100" fill="url(#mnV)"/><path d="M12 4 l-3 12 M30 10 l-3 12 M82 6 l-3 12 M66 14 l-3 12 M8 40 l-3 12 M92 36 l-3 12" stroke="#c8d4ff" stroke-width="1" opacity=".5"/>' +
      '<path d="M50 76 C49 84 51 92 50 100" stroke="#2f6b34" stroke-width="3"/><path d="M50 88 C40 84 34 86 30 90 C38 92 44 92 50 88Z" fill="#2f7a38"/>' +
      '<circle cx="50" cy="48" r="26" fill="#3a1028"/><circle cx="50" cy="48" r="26" fill="none" stroke="url(#mnVO)" stroke-width="5"/>' +
      '<circle cx="50" cy="48" r="14" fill="#a8123a"/><circle cx="50" cy="48" r="10.5" fill="#d81e4a"/><circle cx="50" cy="48" r="7" fill="#f0406a"/><circle cx="50" cy="48" r="3.6" fill="#ff7a96"/>' +
      '<path d="M44 44 C46 40 54 40 56 45 M46 52 C50 55 54 53 55 50" stroke="#7a0a26" stroke-width="1.2" fill="none"/>' +
      '<circle cx="28" cy="70" r="6" fill="#d81e4a"/><circle cx="28" cy="70" r="3" fill="#ff7a96"/><circle cx="72" cy="70" r="6" fill="#ea5a8a"/><circle cx="72" cy="70" r="3" fill="#ffb8cc"/>' +
      '<path d="M44 21 C38 18 38 13 43 13 C46 13 48 16 50 18 C52 16 54 13 57 13 C62 13 62 18 56 21Z" fill="url(#mnVO)"/>' +
      '</svg>',
    mixtape: '<svg viewBox="0 0 100 100"><defs><linearGradient id="mnM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d24"/><stop offset=".7" stop-color="#16285a"/><stop offset="1" stop-color="#2a3a6a"/></linearGradient></defs>' +
      '<rect width="100" height="100" fill="url(#mnM)"/><path d="M30 76 C40 70 52 72 60 68 C70 66 84 70 100 66 V80 H30Z" fill="#0a1220"/>' +
      '<circle cx="70" cy="46" r="19" fill="none" stroke="#3ad8ff" stroke-width="2.2"/><circle cx="70" cy="46" r="13" fill="none" stroke="#ff4ab8" stroke-width="1.6"/>' +
      '<path d="M70 27 V65 M51 46 H89 M57 33 L83 59 M83 33 L57 59" stroke="#bfefff" stroke-width=".8" opacity=".8"/><path d="M70 46 L62 74 M70 46 L78 74" stroke="#6a7a9a" stroke-width="1.6"/>' +
      '<path d="M48 22 V80 M66 4 V80 M84 4 V80" stroke="#1a1410" stroke-width="2"/><path d="M30 48 H100 M30 64 H100" stroke="#1a1410" stroke-width="1.4"/>' +
      '<path d="M0 0 H86 L30 50 L0 42Z" fill="#c8955a"/><path d="M8 8 L60 2 M4 20 L44 14 M2 32 L30 28" stroke="#a87440" stroke-width="1" opacity=".7"/>' +
      '<path d="M86 0 L30 50" stroke="#7a3a22" stroke-width="4"/>' +
      '<path d="M0 40 L30 50 V82 L0 100Z" fill="#ece6da"/>' +
      '<path d="M15 60 C9 54 5 58 8 63 C10 67 15 70 15 72 C15 70 20 67 22 63 C25 58 21 54 15 60Z" fill="#7aa8d8" stroke="#3a6aa8" stroke-width=".8"/>' +
      '<rect x="4" y="50" width="5" height="6" fill="#5a8ac8" transform="skewY(15)"/><rect x="21" y="52" width="5" height="6" fill="#ff8ab8" transform="skewY(15)"/>' +
      '<rect x="0" y="80" width="100" height="20" fill="#7a5a3a"/><path d="M52 84 C62 78 84 78 100 82 V100 H48Z" fill="#f2efe8"/>' +
      '<path d="M8 88 l8 -2 l2 5 l-8 2Z M26 92 l9 -1 l1 5 l-9 1Z" fill="#e8e4dc"/>' +
      '<path d="M36 100 L44 58 M50 100 L44 58 M38 90 H48 M40 80 H47 M42 70 H46" stroke="#c8ccd2" stroke-width="1.6"/><rect x="41" y="55" width="7" height="3" fill="#ff7a2a"/>' +
      '<path d="M41 54 L40 40 H47 L47 54Z" fill="#e04a7a"/><circle cx="43.5" cy="37" r="3.2" fill="#2a1e1a"/><path d="M40 42 L30 30" stroke="#c89a7a" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>'
  };
  // la escena de "Alvafro" pega estas portaditas en su muro de collage y escribe la lista de canciones a mano
  window.MiniPortadas = MINI;
  window.ListaCanciones = CANCIONES.map(function (c) { return { id: c.id, lado: c.lado, titulo: c.titulo }; });

  // ---- menú ----
  var menu = document.createElement('nav');
  menu.id = 'discos';
  menu.setAttribute('aria-label', 'Canciones');
  menu.innerHTML = '<div class="discos-titulo" role="button" tabindex="0" aria-expanded="true">canciones <span class="ecualizador"><i></i><i></i><i></i></span>' +
    '<span class="discos-ver">ver todas</span></div>';
  var botones = {};
  CANCIONES.forEach(function (c, i) {
    var b = document.createElement('button');
    b.className = 'disco';
    b.type = 'button';
    b.style.setProperty('--rot', [-5, 4, -3, 5][i % 4] + 'deg');
    b.innerHTML = '<span class="cinta"></span><span class="portadita">' + MINI[c.id] + '</span>' +
      '<span class="disco-lado">' + c.lado + '</span><span class="disco-nombre">' + c.titulo + '</span>' +
      '<svg class="circulo" viewBox="0 0 120 150" aria-hidden="true"><path pathLength="1" d="M60 6 C100 4 116 30 114 76 C112 122 96 146 58 144 C18 142 4 118 6 72 C8 30 26 8 66 10" fill="none" stroke="#d13a22" stroke-width="6" stroke-linecap="round"/></svg>';
    b.addEventListener('click', function () {
      // recogido solo queda la portadita de la canción que suena: tocarla vuelve a pegar las demás
      if (menu.classList.contains('recogido') || menu.classList.contains('cayendo')) return desplegar();
      if (c.id === actual) return recoger();
      if (elegir(c.id)) recoger(c.id);
    });
    menu.appendChild(b);
    botones[c.id] = b;
  });
  document.body.appendChild(menu);
  var tituloMenu = menu.querySelector('.discos-titulo');
  function alternarMenu() { if (menu.classList.contains('recogido') || menu.classList.contains('cayendo')) desplegar(); else recoger(); }
  tituloMenu.addEventListener('click', alternarMenu);
  tituloMenu.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarMenu(); }
  });

  // con tantas canciones el menú ya no cabe en pantallas angostas: se encoge lo justo (en celular va en dos filas)
  function acomodarMenu() {
    menu.style.transform = '';
    if (innerWidth <= 480) return;
    var r = menu.getBoundingClientRect(), titulo = menu.querySelector('.discos-titulo');
    var k = Math.min(1, (innerWidth - r.left - 16) / (r.width + 10 + titulo.offsetWidth));
    if (k < 1) menu.style.transform = 'scale(' + k.toFixed(3) + ')';
  }
  acomodarMenu();
  window.addEventListener('resize', acomodarMenu);
  if (document.fonts) document.fonts.ready.then(acomodarMenu);

  // ---- portaditas que se caen: al elegir una canción las demás se despegan de la cinta y caen; la elegida se
  // queda sola en la esquina. Tocarla (o el letrero "canciones") las vuelve a pegar. ----
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tMenu = null, quedaId = null;
  function escalaMenu() { return menu.getBoundingClientRect().width / (menu.offsetWidth || 1) || 1; }
  function limpiarCaida() {
    CANCIONES.forEach(function (o) {
      var b = botones[o.id];
      b.classList.remove('cae', 'vuelve');
      b.style.transformOrigin = '';
    });
  }
  function saltaTitulo() {
    tituloMenu.classList.remove('salta');
    void tituloMenu.offsetWidth;
    tituloMenu.classList.add('salta');
  }
  // la portadita que se queda viaja desde donde estaba hasta su lugar nuevo (así no brinca)
  function deslizar(b, antes) {
    if (!b || !antes) return;
    var ahora = b.getBoundingClientRect(), k = escalaMenu();
    b.classList.remove('desliza');
    b.classList.add('fijo');
    b.style.setProperty('--fx', ((antes.left - ahora.left) / k).toFixed(1) + 'px');
    b.style.setProperty('--fy', ((antes.top - ahora.top) / k).toFixed(1) + 'px');
    void b.offsetWidth;
    b.classList.remove('fijo');
    b.classList.add('desliza');
    b.style.setProperty('--fx', '0px');
    b.style.setProperty('--fy', '0px');
    setTimeout(function () { b.classList.remove('desliza'); }, 700);
  }
  // datos de cada caída: lo que baja hasta salir de la pantalla, hacia qué lado y cuánto gira
  function rumbo(b, i, iQueda, k, lejosPrimero) {
    var r = b.getBoundingClientRect(), lado = Math.random() < .5 ? -1 : 1, orden = Math.abs(i - iQueda);
    b.style.setProperty('--caer', ((innerHeight - r.top + 80) / k).toFixed(0) + 'px');
    b.style.setProperty('--dx', (lado * (20 + Math.random() * 80)).toFixed(0) + 'px');
    b.style.setProperty('--giro', (lado * (40 + Math.random() * 110)).toFixed(0) + 'deg');
    b.style.setProperty('--pelar', (lado * (12 + Math.random() * 16)).toFixed(0) + 'deg');
    b.style.setProperty('--tarda', ((lejosPrimero ? CANCIONES.length - orden : orden) * 40 + Math.random() * 90).toFixed(0) + 'ms');
    b.style.transformOrigin = lado < 0 ? '88% 0' : '12% 0'; // queda colgando de una esquina de la cinta
  }
  function recoger(idQueda) {
    idQueda = idQueda || actual;
    if (menu.classList.contains('recogido') || menu.classList.contains('cayendo') || !botones[idQueda]) return;
    var k = escalaMenu(), ids = CANCIONES.map(function (o) { return o.id; }), iQ = ids.indexOf(idQueda);
    quedaId = idQueda;
    CANCIONES.forEach(function (o) { botones[o.id].classList.toggle('queda', o.id === idQueda); });
    menu.classList.add('cayendo');
    tituloMenu.setAttribute('aria-expanded', 'false');
    CANCIONES.forEach(function (o, i) {
      if (o.id === idQueda) return;
      rumbo(botones[o.id], i, iQ, k, false);
      botones[o.id].classList.add('cae');
    });
    clearTimeout(tMenu);
    tMenu = setTimeout(function () {
      var b = botones[quedaId], antes = b.getBoundingClientRect();
      menu.classList.remove('cayendo');
      menu.classList.add('recogido');
      limpiarCaida();
      acomodarMenu();
      deslizar(b, antes);
      saltaTitulo();
    }, quieto ? 0 : 1650);
  }
  function desplegar() {
    if (!menu.classList.contains('recogido') && !menu.classList.contains('cayendo')) return;
    clearTimeout(tMenu);
    var b = botones[quedaId] || botones[actual], antes = b && b.getBoundingClientRect();
    menu.classList.remove('recogido', 'cayendo');
    limpiarCaida();
    acomodarMenu();
    tituloMenu.setAttribute('aria-expanded', 'true');
    deslizar(b, antes);
    saltaTitulo();
    if (quieto) return;
    var k = escalaMenu(), ids = CANCIONES.map(function (o) { return o.id; }), iQ = ids.indexOf(quedaId);
    CANCIONES.forEach(function (o, i) {
      if (o.id === quedaId) return;
      rumbo(botones[o.id], i, iQ, k, false);
      botones[o.id].classList.add('vuelve');
    });
    tMenu = setTimeout(limpiarCaida, 1500);
  }

  // ---- borrón de crayón para la transición ----
  var borron = document.createElement('canvas');
  borron.id = 'borron';
  document.body.appendChild(borron);

  function cubrir(c, listo) {
    var w = borron.width = innerWidth, h = borron.height = innerHeight, ctx = borron.getContext('2d');
    borron.classList.remove('fuera');
    borron.style.display = 'block';
    var trazos = [], n = 26, alto = h / n;
    for (var i = 0; i < n; i++) {
      // zigzag de crayón grueso de lado a lado, de arriba hacia abajo
      trazos.push(C.rayado(null, -60, i * alto - alto, .04 + C.rnd(-.03, .03), w + 120, 4, alto * .55, alto * 1.1, C.pick(c.borron), .95));
    }
    var hechos = 0, porCuadro = 4;
    (function paso() {
      for (var k = 0; k < porCuadro && hechos < trazos.length; k++, hechos++) C.trazar(ctx, trazos[hechos], 4);
      if (hechos < trazos.length) return setTimeout(paso, 40); // a saltitos, como animación dibujada
      // tapa los huecos que hayan quedado y escribe el título encima
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = c.base; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      C.grano(ctx, w, h, w * h / 90, .12);
      var tam = Math.min(w * .11, h * .14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 ' + (tam * .38) + 'px "Gochi Hand", cursive';
      ctx.fillStyle = c.tinta;
      ctx.fillText(c.lado, w / 2, h / 2 - tam * .75);
      ctx.font = '700 ' + tam + 'px Fredoka, "Arial Rounded MT Bold", sans-serif';
      ctx.lineJoin = 'round';
      ctx.lineWidth = tam * .12;
      ctx.strokeStyle = '#161616';
      ctx.save();
      ctx.translate(w / 2, h / 2 + tam * .15);
      ctx.rotate(-.04);
      ctx.fillStyle = c.sombra;
      ctx.fillText(c.titulo, tam * .06, tam * .08);
      ctx.strokeText(c.titulo, 0, 0);
      ctx.fillStyle = '#eef2f3';
      ctx.fillText(c.titulo, 0, 0);
      ctx.restore();
      listo();
    })();
  }
  function destapar() {
    borron.classList.add('fuera');
    setTimeout(function () { borron.style.display = 'none'; }, 700);
  }

  // ---- cambiar de canción ----
  var actual = null, cambiando = false;
  function aplicar(c) {
    CANCIONES.forEach(function (o) {
      var esc = window.Escenas[o.id];
      if (!esc || !esc.el) return;
      var on = o.id === c.id;
      esc.el.style.display = on ? '' : 'none';
      esc.el.classList.toggle('visible', on);
      if (on) esc.activar(); else esc.desactivar();
      botones[o.id].classList.toggle('activo', on);
      botones[o.id].setAttribute('aria-pressed', on);
    });
    // con el menú recogido, la portadita que se queda es la de la canción nueva (al terminar una sigue la otra)
    if (menu.classList.contains('recogido') && quedaId !== c.id) {
      var nb = botones[c.id];
      CANCIONES.forEach(function (o) { botones[o.id].classList.toggle('queda', o.id === c.id); });
      quedaId = c.id;
      nb.classList.remove('pega');
      void nb.offsetWidth;
      nb.classList.add('pega');
    }
    CANCIONES.forEach(function (o) { document.body.classList.remove('cancion-' + o.id); });
    document.body.classList.add('cancion-' + c.id);
    window.cargarLetra(c.lrc, c.secciones);
    actual = c.id;
    try { history.replaceState(null, '', '#' + (c.enlace || c.id)); } catch (e) {}
  }
  function elegir(id, sinTransicion) {
    var c = CANCIONES.filter(function (o) { return o.id === id; })[0];
    if (!c || cambiando || id === actual) return false;
    var sonando = !audio.paused || document.body.classList.contains('empezo');
    function cambiar() {
      document.body.classList.add('cambiando');
      aplicar(c);
      audio.pause();
      audio.src = c.src;
      if (sonando) { audio.currentTime = 0; audio.play().catch(function () {}); }
      requestAnimationFrame(function () { document.body.classList.remove('cambiando'); });
    }
    if (sinTransicion) { cambiar(); return true; }
    cambiando = true;
    cubrir(c, function () {
      cambiar();
      setTimeout(function () { destapar(); cambiando = false; }, 650);
    });
    return true;
  }

  // la música ya arrancó con el botón "Presioname": a partir de ahí el cambio también cambia el audio
  audio.addEventListener('play', function () { document.body.classList.add('empezo', 'sonando'); });
  audio.addEventListener('pause', function () { document.body.classList.remove('sonando'); });
  audio.addEventListener('ended', function () {
    var i = CANCIONES.map(function (o) { return o.id; }).indexOf(actual);
    elegir(CANCIONES[(i + 1) % CANCIONES.length].id);
  });

  // canción inicial: la del enlace (#humano, #piensas-en-mi, #luna, #labios-rotos, #sone, #luz-de-dia, #ciudad-de-las-luces, #igual-que-ayer, #es-por-ti, #just-the-way-you-are, #cant-take-my-eyes-off-you, #brillas, #virgen, #alvafro) o la del lado A.
  // Primero se busca por enlace y luego por id: #alvafro es la canción "Alvafro" (id "mixtape"), no "Piensas en mí" (id "alvafro").
  var hash = decodeURIComponent(location.hash.replace('#', ''));
  var porEnlace = CANCIONES.filter(function (o) { return o.enlace === hash; })[0] || CANCIONES.filter(function (o) { return o.id === hash; })[0];
  var inicial = porEnlace ? porEnlace.id : 'nada';
  if (inicial === 'nada') { aplicar(CANCIONES[0]); } else { elegir(inicial, true); }
})();
