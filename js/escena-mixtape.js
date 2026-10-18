// Escena "Alvafro" (LATIN MAFIA, Fred again..): "hour 31 of finishing our mixtape, mexico city".
// El estudio del video: una cabaña en A con techo de triplay, un ventanal de noche con la rueda de la fortuna
// iluminada, un muro de collage donde un chico en una escalera pega fotos, equipo con pantallas azules, lámparas
// de papel como nubes, sábanas blancas en el piso con gente tirada. Todo es un time-lapse de la madrugada:
// la gente cambia de lugar a saltos con el ritmo, las fotos van llenando un corazón en el muro y al final amanece.
//
// Lo que pasa con la letra:
//   "¿Dónde está todo eso?" → huecos vacíos en el muro y una linterna que busca.
//   "Si tú lo quieres, pues yo te lo entrego todo" → vuelan fotos al muro (en 3D) y papeles frente a la cámara.
//   "Eso que me habías pedido" → la cámara va al banquito: el mixtape (casete) "para ti".
//   "¿Dónde está lo nuestro?" → la cámara va al centro del corazón: la tira de fotos de los dos.
//   "Lo que habíamos sido" → película vieja en sepia. "Mientes tanto y duele" → falla de video y el corazón se rompe.
//   "Ya no recuerdo" → las fotos se borran. "Pero hay cicatrices" → cinta que cose la grieta.
//   "Si estás aquí, no está tan mal" → se prenden las lámparas, las lucecitas, dos se sientan juntos, el corazón se completa.
//   "Cuando llamo y no me dices nada" → el teléfono en el piso llama sin respuesta; luego entra una llamada en silencio.
//   "No, no duele ya" → la grieta se vuelve oro (kintsugi) y amanece en saltos; en el clímax todo va al ritmo.
//   Final: mañana, todos dormidos, el corazón completo con el sol, "we finished it ♡".
//
// Cómo está hecha: un cuarto en 3D de verdad con CSS (perspective + preserve-3d). Piso, techo y muro son planos
// rotados; las cosas de pie son "carteles" de frente a la cámara a su profundidad. Los carteles se dibujan al
// tamaño en que se ven (y se escalan al revés) para que no pesen. La cámara (mouse, pulso de mano, tomas) mueve
// el cuarto entero. Lo que reacciona al bajo usa su propio analizador conectado al audio (js/main.js).
(function () {
  var escena = document.getElementById('escena-mixtape');
  var audio = document.getElementById('bg-music');
  if (!escena || !audio) return;
  var SUBS = { letras: true, claves: /^(todo|duele|cicatrices|aquí|nada|nuestro|sido|escucho|mientes|recuerdo)$/ };
  var ESTADOS = ['inicio', 'creditos', 'donde', 'entrego', 'vuelo3d', 'cassette', 'nuestro', 'tira-on', 'sepia', 'mientes', 'escucho', 'roto', 'rompe', 'hyper',
    'olvido', 'cicatriz', 'aqui1', 'aqui2', 'juntos', 'completo', 'tel', 'tel-luz', 'tel-llama', 'tel-nadie', 'tel-entra', 'tel-habla',
    'tel-latido', 'kintsugi', 'dora', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'climax', 'rayos', 'flotan', 'manana', 'fin', 'blanco'];
  var LETREROS = [
    [0.4, 10.5, 'hour 31 of finishing our mixtape, mexico city'],
    [86, 93, 'hour 32'],
    [164.6, 171, 'hour 33'],
    [197, 205, 'hour 34'],
    [223, 999, 'we finished it ♡']
  ];

  var P = 1000, PISO = 430;
  var construida = false, activa = false, antes = {}, cuarto, toma, raton, mano, escenario, pulso;
  var elLetrero, elFlash, elFalla, elTel, haloRueda, elGiro, animsRueda = [], telReloj, telLlamada, ranuras = [], llenas = 0;
  var semilla = 11;
  function rnd(a, b) { semilla = (semilla * 9301 + 49297) % 233280; return a + semilla / 233280 * (b - a); }
  function f(n) { return (+n).toFixed(1); }
  function esc(Z) { return P / (P - Z); }
  function el(tag, clase, html, padre) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (html) e.innerHTML = html;
    (padre || escena).appendChild(e);
    return e;
  }
  function svg(vb, html, aspecto) {
    return '<svg viewBox="' + vb + '" preserveAspectRatio="' + (aspecto || 'none') + '">' + html + '</svg>';
  }
  function urlSvg(vb, html) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' + html + '</svg>');
  }

  function imagen(clase, vb, html, padre) {
    var im = el('img', 'mx-img ' + clase, '', padre);
    im.alt = '';
    im.src = urlSvg(vb, html);
    return im;
  }

  // ---- el cuarto en 3D ----
  // plano: centro (X, Y, Z) en el mundo, tamaño w x h en unidades del mundo, rotación y resolución q (px por unidad)
  function plano(clase, X, Y, Z, w, h, rot, q, html, vb) {
    var e = el('div', 'mx-p ' + clase, html ? svg(vb || ('0 0 ' + w + ' ' + h), html) : '', cuarto);
    var cw = w * q, ch = h * q;
    e.style.cssText = 'width:' + f(cw) + 'px;height:' + f(ch) + 'px;margin:' + f(-ch / 2) + 'px 0 0 ' + f(-cw / 2) + 'px;' +
      'transform:translate3d(' + f(X) + 'px,' + f(Y) + 'px,' + f(Z) + 'px) ' + (rot || '') + ' scale(' + (1 / q).toFixed(4) + ')';
    return e;
  }
  // cartel: de frente a la cámara, parado en Ybase (el piso si no se dice otra cosa); se dibuja al tamaño en que se ve
  function cartel(clase, X, Ybase, Z, w, h, html, vb, calidad) {
    return plano('mx-cartel ' + clase, X, Ybase - h / 2, Z, w, h, '', esc(Z) * (calidad || 1), html, vb);
  }

  // ---- fotos del collage ----
  var PAL = {
    cian: ['#0e2f5a', '#1f5a96', '#6aa2d6', '#dcebf6'],
    calida: ['#3a1e14', '#a8542e', '#e8a46a', '#fbe6c8'],
    gris: ['#1a1a1c', '#5a5a60', '#a8a8ae', '#efefec'],
    rosa: ['#3a1430', '#a8346a', '#f08ab0', '#fde4ee'],
    noche: ['#0a0f2a', '#24306a', '#ff4ab8', '#3ad8ff']
  };
  var MOTIVOS = {
    sol: function (c) {
      return '<rect width="100" height="80" fill="' + c[2] + '"/><rect y="50" width="100" height="30" fill="' + c[1] + '"/><circle cx="64" cy="44" r="13" fill="' + c[3] + '"/>' +
        '<path d="M0 60 C30 54 70 56 100 62 V80 H0Z" fill="' + c[0] + '"/><path d="M24 60 C22 44 25 30 32 20 M32 20 C24 19 16 23 11 30 M32 20 C38 15 46 17 50 22 M32 20 C28 13 20 11 13 14 M32 20 C36 12 44 10 50 12" stroke="' + c[0] + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    },
    rueda: function (c) {
      var h = '<rect width="100" height="80" fill="' + c[0] + '"/><circle cx="50" cy="36" r="24" fill="none" stroke="' + c[3] + '" stroke-width="2.4"/><circle cx="50" cy="36" r="16" fill="none" stroke="' + c[2] + '" stroke-width="1.6"/>';
      for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; h += '<path d="M50 36 L' + f(50 + Math.cos(a) * 24) + ' ' + f(36 + Math.sin(a) * 24) + '" stroke="' + c[3] + '" stroke-width=".8" opacity=".7"/><rect x="' + f(47 + Math.cos(a) * 24) + '" y="' + f(37 + Math.sin(a) * 24) + '" width="6" height="5" fill="' + c[2] + '"/>'; }
      return h + '<path d="M50 36 L40 76 M50 36 L60 76" stroke="' + c[1] + '" stroke-width="2"/><rect y="70" width="100" height="10" fill="' + c[1] + '"/>';
    },
    cara: function (c) {
      return '<rect width="100" height="80" fill="' + c[3] + '"/><path d="M58 80 C56 68 60 62 58 56 C54 54 52 50 54 46 C50 44 50 40 54 38 C52 34 54 30 56 28 C56 16 46 8 34 10 C20 12 14 26 18 40 C20 52 26 60 26 80Z" fill="' + c[1] + '"/>' +
        '<path d="M34 10 C20 10 10 22 12 40 C14 54 10 64 6 80 H26 C26 60 20 52 18 40" fill="' + c[0] + '"/><circle cx="74" cy="22" r="7" fill="' + c[2] + '" opacity=".6"/>';
    },
    pareja: function (c) {
      return '<rect width="100" height="80" fill="' + c[2] + '"/><circle cx="76" cy="18" r="9" fill="' + c[3] + '" opacity=".8"/>' +
        '<path d="M14 80 C14 60 22 52 34 50 C24 46 22 34 26 26 C30 16 46 14 52 24 C56 32 54 44 46 50 C54 52 58 56 60 62" fill="' + c[0] + '"/>' +
        '<path d="M44 80 C46 64 52 56 62 54 C54 50 52 40 56 32 C60 24 74 24 78 34 C82 44 76 52 70 54 C80 56 88 64 90 80Z" fill="' + c[1] + '"/>' +
        '<path d="M60 30 C56 22 64 16 72 18 C80 20 84 30 80 38 C78 30 70 26 60 30Z" fill="' + c[0] + '"/>';
    },
    flores: function (c) {
      var h = '<rect width="100" height="80" fill="' + c[3] + '"/>';
      [[26, 34, 11], [54, 26, 13], [78, 40, 10]].forEach(function (q) {
        h += '<path d="M' + q[0] + ' ' + (q[1] + q[2]) + ' C' + (q[0] - 2) + ' 60 ' + (q[0] + 4) + ' 70 ' + q[0] + ' 80" stroke="' + c[1] + '" stroke-width="2" fill="none"/>';
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; h += '<circle cx="' + f(q[0] + Math.cos(a) * q[2] * .6) + '" cy="' + f(q[1] + Math.sin(a) * q[2] * .6) + '" r="' + f(q[2] * .45) + '" fill="' + c[2] + '"/>'; }
        h += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + f(q[2] * .3) + '" fill="' + c[0] + '"/>';
      });
      return h;
    },
    ciudad: function (c) {
      var h = '<rect width="100" height="80" fill="' + c[0] + '"/><circle cx="78" cy="16" r="8" fill="' + c[3] + '"/>', x = 0;
      semilla = 5;
      while (x < 100) { var w = rnd(8, 16), alto = rnd(20, 50); h += '<rect x="' + f(x) + '" y="' + f(80 - alto) + '" width="' + f(w) + '" height="' + f(alto) + '" fill="' + c[1] + '"/>'; for (var v = 0; v < 4; v++) h += '<rect x="' + f(x + rnd(2, w - 4)) + '" y="' + f(80 - rnd(4, alto - 4)) + '" width="2" height="2.4" fill="' + c[2] + '"/>'; x += w + 1; }
      return h;
    },
    mar: function (c) {
      return '<rect width="100" height="80" fill="' + c[3] + '"/><rect y="40" width="100" height="40" fill="' + c[1] + '"/><path d="M0 50 Q12 46 25 50 T50 50 T75 50 T100 50 M0 60 Q12 56 25 60 T50 60 T75 60 T100 60 M0 70 Q12 66 25 70 T50 70 T75 70 T100 70" stroke="' + c[2] + '" stroke-width="1.6" fill="none"/>' +
        '<path d="M60 40 A14 14 0 0 1 88 40Z" fill="' + c[2] + '"/>';
    },
    consola: function (c) {
      var h = '<rect width="100" height="80" fill="' + c[0] + '"/>';
      for (var i = 0; i < 6; i++) for (var j = 0; j < 3; j++) h += '<circle cx="' + (12 + i * 15) + '" cy="' + (12 + j * 12) + '" r="4" fill="' + c[2] + '"/><path d="M' + (12 + i * 15) + ' ' + (12 + j * 12) + ' l2 -3" stroke="' + c[0] + '" stroke-width="1.2"/>';
      for (i = 0; i < 6; i++) h += '<rect x="' + (10 + i * 15) + '" y="50" width="4" height="26" fill="' + c[1] + '"/><rect x="' + (8 + i * 15) + '" y="' + (54 + (i * 7) % 16) + '" width="8" height="5" fill="' + c[3] + '"/>';
      return h;
    },
    luna: function (c) {
      return '<rect width="100" height="80" fill="' + c[0] + '"/><circle cx="56" cy="34" r="18" fill="' + c[3] + '"/><circle cx="50" cy="30" r="3" fill="' + c[2] + '"/><circle cx="62" cy="40" r="4" fill="' + c[2] + '"/>' +
        '<path d="M-4 62 C10 52 26 56 32 62 C42 54 60 56 66 64 C78 58 94 60 104 66 V80 H-4Z" fill="' + c[1] + '"/>';
    },
    corazon: function (c) {
      return '<rect width="100" height="80" fill="' + c[3] + '"/><path d="M50 66 C20 46 22 18 40 18 C46 18 50 24 50 28 C50 24 54 18 60 18 C78 18 80 46 50 66Z" fill="' + c[1] + '"/><path d="M38 26 C34 28 32 32 33 36" stroke="' + c[3] + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>';
    },
    camino: function (c) {
      return '<rect width="100" height="80" fill="' + c[2] + '"/><path d="M0 44 H100 V80 H0Z" fill="' + c[1] + '"/><path d="M40 44 L60 44 L96 80 L4 80Z" fill="' + c[0] + '"/><path d="M50 46 V52 M50 58 V66 M50 72 V80" stroke="' + c[3] + '" stroke-width="2"/>' +
        '<path d="M0 44 C20 30 30 34 44 40 C60 28 80 30 100 40 V44 H0Z" fill="' + c[1] + '" opacity=".7"/>';
    },
    gente: function (c) {
      var h = '<rect width="100" height="80" fill="' + c[0] + '"/><path d="M30 0 L10 80 M70 0 L90 80 M50 0 V80" stroke="' + c[2] + '" stroke-width="10" opacity=".25"/>';
      for (var i = 0; i < 12; i++) h += '<circle cx="' + (4 + i * 8.4) + '" cy="' + (62 + (i % 3) * 3) + '" r="5" fill="' + c[1] + '"/><path d="M' + (4 + i * 8.4) + ' 58 L' + (i % 2 ? 2 + i * 8.4 : 7 + i * 8.4) + ' ' + (36 + (i % 4) * 4) + '" stroke="' + c[1] + '" stroke-width="2.4" stroke-linecap="round"/>';
      return h + '<rect y="68" width="100" height="12" fill="' + c[1] + '"/>';
    }
  };
  var NOTAS = ['¿dónde está todo eso?', 'no está tan mal', '143', 'lado O', 'mx city ♡', 'te lo doy todo', 'si estás aquí', 'hora 31', 'cdmx 4:12 am', 'para ti'];

  // ---- dibujos ----
  // el chico de la gorra (de espaldas, mirando al muro). Con sombra=true sale en un solo color para la sombra del muro.
  function chico(sombra) {
    var S = sombra ? '#000' : null;
    var piel = S || '#c08262', pielS = S || '#9a6448', play = S || '#e2457a', playS = S || '#b62e5c', pant = S || '#2e2a26', pantS = S || '#1f1c19';
    function brazo(cl, hombro, codo, mano, extra) {
      if (sombra && cl !== 'p-pega') return '';
      return '<g class="br ' + cl + '">' +
        '<path d="M' + hombro + ' L' + codo + '" stroke="' + piel + '" stroke-width="25" stroke-linecap="round"/>' +
        '<path d="M' + codo + ' L' + mano + '" stroke="' + piel + '" stroke-width="20" stroke-linecap="round"/>' +
        (sombra ? '' : '<path d="M' + codo + ' L' + mano + '" stroke="#5a3a3a" stroke-width="2" stroke-dasharray="6 5" opacity=".55" transform="translate(3 2)"/>') +
        '<path d="M' + hombro + ' L' + codo + '" stroke="' + play + '" stroke-width="36" stroke-linecap="round" stroke-dasharray="44 400"/>' +
        '<circle cx="' + mano.split(' ')[0] + '" cy="' + mano.split(' ')[1] + '" r="12" fill="' + piel + '"/>' + (extra || '') + '</g>';
    }
    var foto = function (x, y, r) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-34" y="-28" width="68" height="54" fill="' + (S || '#f4f2ec') + '"/>' + (sombra ? '' : '<rect x="-30" y="-24" width="60" height="44" fill="#3a78b8"/><path d="M-30 6 C-14 -4 6 2 30 -6 V20 H-30Z" fill="#1f4e86"/>') + '</g>'; };
    var fajo = function (x, y) { return '<g transform="translate(' + x + ' ' + y + ') rotate(12)"><rect x="-22" y="-30" width="44" height="58" fill="' + (S || '#e8eef4') + '"/>' + (sombra ? '' : '<rect x="-18" y="-26" width="36" height="30" fill="#2f6aa8"/><rect x="-24" y="-24" width="44" height="58" fill="none" stroke="#cfd8e2" stroke-width="2"/>') + '</g>'; };
    return '<g class="cuerpo">' +
      // piernas: pantalón cargo holgado
      '<path d="M-48 -270 C-60 -190 -62 -110 -56 -28 L-16 -26 C-14 -104 -12 -190 -4 -262Z" fill="' + pantS + '"/>' +
      '<path d="M-8 -262 C0 -190 8 -108 16 -26 L56 -28 C56 -110 54 -190 48 -270Z" fill="' + pant + '"/>' +
      (sombra ? '' : '<path d="M24 -196 h28 l-2 42 h-24Z" fill="#26231f"/><path d="M-42 -150 C-32 -140 -26 -142 -22 -150 M26 -110 C34 -100 44 -102 50 -110 M-40 -80 C-32 -74 -26 -76 -22 -82" stroke="#171513" stroke-width="3" fill="none"/>') +
      // tenis
      '<path d="M-58 -30 C-76 -28 -86 -14 -82 -2 L-14 -2 C-12 -14 -14 -26 -18 -30Z" fill="' + (S || '#e6e0d4') + '"/>' +
      '<path d="M14 -28 C-2 -26 -10 -12 -6 -2 L58 -2 C60 -12 58 -24 54 -28Z" fill="' + (S || '#efe9de') + '"/>' +
      (sombra ? '' : '<path d="M-82 -7 H-14 V0 H-82Z M-6 -7 H58 V0 H-6Z" fill="#b8b0a2"/>') +
      '<path d="M-52 -274 H50 V-258 H-52Z" fill="' + (S || '#1a1816') + '"/>' +
      // playera rosa
      '<path d="M-66 -458 C-84 -420 -80 -330 -66 -262 L64 -262 C72 -330 74 -410 64 -458 C36 -478 -36 -478 -66 -458Z" fill="' + play + '"/>' +
      (sombra ? '' : '<path d="M-66 -458 C-84 -420 -80 -330 -66 -262 L-34 -262 C-44 -330 -46 -410 -38 -464Z" fill="' + playS + '"/>' +
        '<path d="M-28 -404 C-8 -394 12 -396 32 -408 M-34 -334 C-12 -326 14 -328 36 -338" stroke="#c83a68" stroke-width="4" fill="none" opacity=".75"/>' +
        '<path d="M40 -456 C58 -420 62 -330 56 -264" stroke="#ff7aa4" stroke-width="5" fill="none" opacity=".45"/>') +
      '<path d="M-14 -468 C-12 -486 12 -486 14 -468Z" fill="' + pielS + '"/>' +
      '</g>' +
      // brazos según la pose del time-lapse
      brazo('p-pega', '-54 -444', '-112 -546', '-128 -640', foto(-136, -664, -8)) +
      brazo('p-pega', '58 -446', '78 -366', '60 -300', fajo(52, -292)) +
      brazo('p-alisa', '-54 -444', '-120 -530', '-150 -606') +
      brazo('p-alisa', '58 -446', '20 -540', '-84 -628', foto(-118, -640, 4)) +
      brazo('p-baja', '-54 -444', '-108 -530', '-124 -622') +
      brazo('p-baja', '58 -446', '104 -390', '132 -320', foto(146, -300, 16)) +
      brazo('p-mira', '-54 -444', '-70 -370', '-62 -294') +
      brazo('p-mira', '58 -446', '72 -370', '62 -294') +
      // cabeza con gorra (de espaldas)
      '<g class="cabeza">' +
        '<ellipse cx="-2" cy="-512" rx="34" ry="38" fill="' + (S || '#1c1410') + '"/>' +
        '<ellipse cx="31" cy="-510" rx="7" ry="11" fill="' + piel + '"/>' +
        '<path d="M-38 -522 C-40 -568 34 -574 38 -524 C14 -514 -16 -514 -38 -522Z" fill="' + (S || '#5b6c84') + '"/>' +
        '<path d="M-38 -526 C-62 -526 -76 -520 -80 -512 C-62 -512 -48 -514 -36 -518Z" fill="' + (S || '#46566c') + '"/>' +
        (sombra ? '' : '<path d="M-12 -526 C-10 -542 8 -542 10 -526Z" fill="#1c1410"/><path d="M-13 -529 H11" stroke="#3a4658" stroke-width="3"/><path d="M0 -568 V-542" stroke="#4a5a70" stroke-width="2"/>' +
          '<path d="M14 -560 C26 -552 34 -540 36 -528" stroke="#7a8ca4" stroke-width="4" fill="none" opacity=".6"/>') +
      '</g>';
  }
  // el que le pasa las fotos (playera blanca de manga larga, pelo chino)
  function ayudante() {
    var pelo = '';
    [[-24, -500, 22], [0, -512, 26], [24, -498, 22], [-30, -476, 18], [30, -474, 18], [-8, -486, 26], [12, -476, 22], [-16, -530, 16], [14, -532, 16]].forEach(function (q) {
      pelo += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="#1a1310"/>';
    });
    var manga = function (cl, a, b, c, extra) {
      return '<g class="br ' + cl + '"><path d="M' + a + ' Q' + b + ' ' + c + '" stroke="#ece9e1" stroke-width="30" stroke-linecap="round" fill="none"/>' +
        '<circle cx="' + c.split(' ')[0] + '" cy="' + c.split(' ')[1] + '" r="11" fill="#8a5a3e"/>' + (extra || '') + '</g>';
    };
    return '<g class="cuerpo">' +
      '<path d="M-42 -252 C-48 -170 -48 -90 -44 -24 L-10 -24 C-8 -96 -6 -170 0 -246Z" fill="#2a2f35"/>' +
      '<path d="M0 -246 C4 -170 8 -96 12 -24 L46 -24 C48 -96 46 -170 42 -252Z" fill="#343a42"/>' +
      '<path d="M-52 -26 C-66 -24 -72 -12 -70 -2 L-10 -2 C-8 -12 -10 -22 -14 -26Z M10 -24 C-2 -22 -8 -10 -6 -2 L50 -2 C52 -12 50 -22 46 -24Z" fill="#1e1e22"/>' +
      '<path d="M-60 -432 C-72 -380 -68 -310 -58 -244 L58 -244 C66 -310 68 -380 58 -434 C32 -450 -34 -450 -60 -432Z" fill="#efece4"/>' +
      '<path d="M-60 -432 C-72 -380 -68 -310 -58 -244 L-30 -244 C-40 -310 -40 -380 -32 -440Z" fill="#cfcac0"/>' +
      '<path d="M-22 -380 C-4 -372 14 -374 30 -384" stroke="#d6d2c8" stroke-width="4" fill="none"/>' +
      '<path d="M-12 -444 C-10 -462 12 -462 14 -444Z" fill="#7a4e36"/>' +
      '</g>' +
      manga('p-sube', '-52 -420', '-84 -500', '-92 -584') +
      manga('p-sube', '52 -420', '34 -520', '-22 -606',
        '<g transform="translate(-58 -628) rotate(-8)"><rect x="-62" y="-46" width="124" height="92" fill="#f4f2ec"/><rect x="-56" y="-40" width="112" height="72" fill="#2f6aa8"/><path d="M-56 10 C-30 -4 0 4 56 -10 V32 H-56Z" fill="#1a4478"/><circle cx="24" cy="-18" r="10" fill="#cfe2f4"/></g>') +
      manga('p-revisa', '-52 -420', '-82 -364', '-74 -320') +
      manga('p-revisa', '52 -420', '64 -360', '24 -330',
        '<g transform="translate(-60 -334) rotate(-14)"><rect x="-36" y="-28" width="72" height="56" fill="#f4f2ec"/><rect x="-32" y="-24" width="64" height="40" fill="#5a8ec8"/></g>') +
      '<g class="cabeza">' + pelo + '<ellipse cx="34" cy="-484" rx="6" ry="10" fill="#8a5a3e"/></g>';
  }
  // de sudadera negra y gorro: agachado sobre una caja o parado viendo la ventana
  function encapuchado() {
    var rim = '#4a5a8a';
    return '<g class="p-agacha">' +
        '<path d="M-36 -250 L-46 -30 L-14 -28 L-4 -236Z M-4 -236 L14 -28 L44 -30 L30 -250Z" fill="#24242a"/>' +
        '<path d="M-58 -30 C-70 -26 -74 -12 -70 -2 H-12 V-30Z M10 -30 V-2 H52 C56 -12 52 -26 44 -30Z" fill="#e6e2da"/>' +
        '<path d="M-46 -262 C-56 -330 0 -378 86 -372 C128 -368 150 -340 140 -306 C110 -292 44 -262 -20 -228Z" fill="#1c1c22"/>' +
        '<path d="M-46 -262 C-56 -330 0 -378 86 -372 C128 -368 150 -340 140 -306" stroke="' + rim + '" stroke-width="4" fill="none" opacity=".8"/>' +
        '<path d="M104 -326 Q124 -270 132 -214" stroke="#18181e" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="133" cy="-204" r="12" fill="#d8a888"/>' +
        '<circle cx="156" cy="-322" r="32" fill="#121216"/><path d="M128 -340 C140 -362 176 -360 186 -336" stroke="' + rim + '" stroke-width="4" fill="none" opacity=".7"/>' +
      '</g>' +
      '<g class="p-parado">' +
        '<path d="M-42 -252 C-48 -170 -48 -90 -44 -24 L-10 -24 C-8 -96 -6 -170 0 -246Z M0 -246 C4 -170 8 -96 12 -24 L46 -24 C48 -96 46 -170 42 -252Z" fill="#24242a"/>' +
        '<path d="M-54 -26 C-68 -24 -72 -12 -70 -2 L-10 -2 V-26Z M10 -24 V-2 L52 -2 C54 -12 50 -22 46 -24Z" fill="#e6e2da"/>' +
        '<path d="M-70 -440 C-86 -380 -80 -300 -66 -236 L66 -236 C78 -300 84 -380 68 -442 C40 -460 -40 -460 -70 -440Z" fill="#1c1c22"/>' +
        '<path d="M-40 -446 C-36 -410 36 -410 40 -446 C20 -440 -20 -440 -40 -446Z" fill="#141418"/>' +
        '<path d="M68 -442 C82 -380 80 -300 66 -236" stroke="' + rim + '" stroke-width="4" fill="none" opacity=".8"/>' +
        '<path d="M-74 -420 Q-90 -340 -70 -280 M74 -420 Q90 -340 70 -280" stroke="#18181e" stroke-width="30" stroke-linecap="round" fill="none"/>' +
        '<circle cx="0" cy="-488" r="36" fill="#121216"/><path d="M-36 -484 C-30 -526 30 -526 36 -484" fill="#1a1a20"/>' +
        '<path d="M26 -514 C36 -504 38 -490 36 -478" stroke="' + rim + '" stroke-width="4" fill="none" opacity=".7"/>' +
        // audífonos alrededor del cuello
        '<path d="M-30 -448 C-30 -430 30 -430 30 -448" stroke="#e8e8ec" stroke-width="6" fill="none"/>' +
      '</g>';
  }
  // ella: sentada abrazando las rodillas, o acostada dormida
  function chica() {
    var pelo = '';
    [[16, -246, 26], [34, -230, 24], [22, -212, 22], [40, -206, 20], [2, -262, 20], [30, -262, 18], [46, -186, 16], [-4, -238, 18]].forEach(function (q) {
      pelo += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + q[2] + '" fill="#241a14"/>';
    });
    return '<g class="p-sentada">' +
        '<path d="M70 -12 C92 -80 82 -172 40 -214 C10 -226 -22 -210 -30 -186 C-20 -140 -10 -100 22 -58Z" fill="#f4f1ea"/>' +
        '<path d="M70 -12 C92 -80 82 -172 40 -214 C60 -170 64 -90 44 -20Z" fill="#d8d4cc"/>' +
        '<path d="M64 -8 C44 -60 -6 -152 -48 -152 C-70 -150 -82 -132 -78 -112 C-82 -62 -86 -32 -92 -6 L-52 -2 C-48 -40 -46 -80 -42 -100 C-12 -82 18 -40 28 -4Z" fill="#4e6e9e"/>' +
        '<path d="M-48 -150 C-20 -146 10 -118 30 -84" stroke="#3e5a86" stroke-width="5" fill="none"/>' +
        '<path d="M-98 -12 C-100 -2 -94 2 -84 2 H-50 C-48 -6 -50 -12 -56 -14Z" fill="#f2f0ec"/>' +
        '<path d="M14 -194 Q-24 -178 -54 -136" stroke="#f4f1ea" stroke-width="30" stroke-linecap="round" fill="none"/><circle cx="-60" cy="-130" r="11" fill="#d6a07c"/>' +
        '<g class="cabeza"><ellipse cx="0" cy="-226" rx="30" ry="34" fill="#d6a07c"/><path d="M-30 -226 C-32 -218 -30 -210 -26 -206" stroke="#b07a58" stroke-width="3" fill="none"/>' + pelo + '</g>' +
      '</g>' +
      '<g class="p-acostada">' +
        '<path d="M-150 -6 C-150 -40 -120 -54 -90 -56 L80 -60 C120 -60 150 -40 156 -10 Z" fill="#4e6e9e"/>' +
        '<path d="M-110 -10 C-112 -62 -60 -96 0 -94 C40 -92 56 -64 50 -10Z" fill="#f4f1ea"/>' +
        '<path d="M-110 -10 C-112 -40 -96 -60 -70 -70" stroke="#d8d4cc" stroke-width="10" fill="none"/>' +
        '<path d="M156 -12 C170 -14 176 -6 170 2 H140 V-10Z" fill="#f2f0ec"/>' +
        '<ellipse cx="-150" cy="-44" rx="30" ry="26" fill="#d6a07c"/>' +
        '<circle cx="-170" cy="-60" r="26" fill="#241a14"/><circle cx="-190" cy="-40" r="22" fill="#241a14"/><circle cx="-150" cy="-72" r="20" fill="#241a14"/><circle cx="-196" cy="-16" r="18" fill="#241a14"/>' +
      '</g>';
  }
  // el que se sienta junto a ella ("si estás aquí") y luego se duerme
  function amigo() {
    var rim = '#6a7ab0';
    return '<g class="p-sentado">' +
        // piernas cruzadas sobre la sábana y tenis
        '<path d="M-96 -6 C-100 -40 -60 -56 0 -56 C60 -56 100 -40 96 -6Z" fill="#2c2e36"/>' +
        '<path d="M-110 -10 C-118 -22 -100 -30 -84 -26 L-70 -8Z M110 -10 C118 -22 100 -30 84 -26 L70 -8Z" fill="#ecebe6"/>' +
        // espalda con la sudadera y la capucha
        '<path d="M-74 -40 C-84 -110 -70 -180 -36 -206 C-12 -220 22 -220 44 -204 C74 -178 84 -110 74 -40Z" fill="#30323c"/>' +
        '<path d="M-36 -204 C-30 -174 30 -174 38 -204 C18 -196 -18 -196 -36 -204Z" fill="#24262e"/>' +
        '<path d="M44 -204 C74 -178 84 -110 74 -40" stroke="' + rim + '" stroke-width="5" fill="none" opacity=".8"/>' +
        '<path d="M-40 -150 C-20 -140 20 -140 40 -150" stroke="#262830" stroke-width="5" fill="none"/>' +
        // brazo que la abraza (hacia la izquierda)
        '<path d="M-60 -170 Q-120 -176 -160 -150" stroke="#30323c" stroke-width="30" stroke-linecap="round" fill="none"/>' +
        // cabeza recargada hacia ella, con gorro
        '<g class="cabeza" transform="rotate(-20 -4 -214)"><circle cx="-4" cy="-252" r="36" fill="#1e1612"/><path d="M-40 -256 C-40 -300 32 -300 32 -256 C10 -264 -18 -264 -40 -256Z" fill="#c8322a"/>' +
          '<path d="M-40 -258 H32" stroke="#a8261e" stroke-width="7"/><ellipse cx="30" cy="-248" rx="7" ry="11" fill="#c08262"/></g>' +
      '</g>' +
      '<g class="p-dormido">' +
        '<path d="M-180 -8 C-180 -54 -136 -72 -90 -72 L100 -66 C140 -64 170 -44 168 -8Z" fill="#30323c"/>' +
        '<path d="M-90 -72 C-40 -80 60 -78 100 -66" stroke="' + rim + '" stroke-width="5" fill="none" opacity=".7"/>' +
        '<path d="M150 -14 C166 -24 186 -18 190 -6 H150Z" fill="#ecebe6"/>' +
        '<circle cx="-196" cy="-44" r="34" fill="#1e1612"/><path d="M-230 -50 C-226 -88 -168 -88 -164 -50 C-184 -58 -210 -58 -230 -50Z" fill="#c8322a"/>' +
      '</g>';
  }
  function escalera() {
    return '<path d="M206 22 L330 676 M232 24 L300 680" stroke="#8a9098" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M150 380 L292 360" stroke="#7a8088" stroke-width="6"/>' +
      '<path d="M44 680 L124 26 M176 680 L222 30" stroke="#b8bec6" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M48 676 L126 30" stroke="#eef0f2" stroke-width="4" opacity=".7"/>' +
      [545, 410, 275, 140].map(function (y) {
        var t = (680 - y) / 654, xl = 44 + 80 * t, xr = 176 + 46 * t;
        return '<path d="M' + f(xl - 4) + ' ' + y + ' L' + f(xr + 4) + ' ' + y + '" stroke="#a8aeb6" stroke-width="14"/><path d="M' + f(xl) + ' ' + (y - 6) + ' L' + f(xr) + ' ' + (y - 6) + '" stroke="#e4e8ec" stroke-width="3"/>';
      }).join('') +
      '<path d="M108 14 L246 14 L250 40 L112 40Z" fill="#f07a2a"/><path d="M112 34 L250 34 L250 40 L112 40Z" fill="#b85a1a"/>' +
      '<rect x="58" y="560" width="14" height="40" fill="#f2d23a" transform="rotate(7 64 580)"/><rect x="60" y="566" width="10" height="10" fill="#d83a2a" transform="rotate(7 64 580)"/>';
  }
  function lamparaNube(ancho, alto, cable) {
    var w = ancho / 2, h = alto / 2;
    var d = 'M' + -w + ' 0 C' + f(-w * 1.1) + ' ' + f(-h * .5) + ' ' + f(-w * .85) + ' ' + f(-h) + ' ' + f(-w * .55) + ' ' + f(-h * .92) +
      ' C' + f(-w * .45) + ' ' + f(-h * 1.35) + ' ' + f(-w * .1) + ' ' + f(-h * 1.42) + ' ' + f(w * .05) + ' ' + f(-h * 1.08) +
      ' C' + f(w * .2) + ' ' + f(-h * 1.42) + ' ' + f(w * .6) + ' ' + f(-h * 1.34) + ' ' + f(w * .7) + ' ' + f(-h * .92) +
      ' C' + f(w * 1) + ' ' + f(-h) + ' ' + f(w * 1.15) + ' ' + f(-h * .4) + ' ' + f(w) + ' 0' +
      ' C' + f(w * 1.15) + ' ' + f(h * .34) + ' ' + f(w * .9) + ' ' + f(h * .76) + ' ' + f(w * .6) + ' ' + f(h * .58) +
      ' C' + f(w * .45) + ' ' + f(h * .92) + ' ' + f(w * .1) + ' ' + f(h * .92) + ' ' + f(-w * .05) + ' ' + f(h * .66) +
      ' C' + f(-w * .25) + ' ' + f(h * .92) + ' ' + f(-w * .65) + ' ' + f(h * .84) + ' ' + f(-w * .75) + ' ' + f(h * .5) +
      ' C' + f(-w * 1.05) + ' ' + f(h * .58) + ' ' + f(-w * 1.15) + ' ' + f(h * .25) + ' ' + -w + ' 0Z';
    return '<defs><radialGradient id="mxNube" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f4ede0"/><stop offset="1" stop-color="#d8cfc0"/></radialGradient>' +
      '<radialGradient id="mxHaloN"><stop offset="0" stop-color="#ffe8c0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe8c0" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="halo" cx="0" cy="0" rx="' + f(w * 1.38) + '" ry="' + f(h * 1.7) + '" fill="url(#mxHaloN)"/>' +
      '<path d="M0 ' + f(-h * 1.3) + ' V' + -cable + '" stroke="#d8d4cc" stroke-width="3"/>' +
      '<path d="' + d + '" fill="url(#mxNube)"/>' +
      '<path d="M' + f(-w * .7) + ' ' + f(-h * .3) + ' C' + f(-w * .2) + ' ' + f(-h * .5) + ' ' + f(w * .3) + ' ' + f(-h * .5) + ' ' + f(w * .8) + ' ' + f(-h * .2) +
      ' M' + f(-w * .8) + ' ' + f(h * .2) + ' C' + f(-w * .2) + ' ' + f(h * .05) + ' ' + f(w * .3) + ' ' + f(h * .05) + ' ' + f(w * .85) + ' ' + f(h * .25) + '" stroke="#e6dccb" stroke-width="3" fill="none"/>';
  }

  function construir() {
    construida = true;
    semilla = 11;
    // capas fijas: cielo de fondo, el escenario 3D, y encima los efectos de cámara en 2D
    pulso = el('div', 'mx-pulso');
    escenario = el('div', 'mx-escenario', '', pulso);
    mano = el('div', 'mx-mano', '', escenario);
    raton = el('div', 'mx-raton', '', mano);
    toma = el('div', 'mx-toma', '', raton);
    cuarto = el('div', 'mx-cuarto', '', toma);

    // ---------- afuera: cielo, ciudad, rueda de la fortuna, árboles ----------
    var cielo = plano('mx-cielo', 2450, -1750, -9000, 10100, 7500, '', .1);
    ['noche', 'azul', 'alba', 'dia'].forEach(function (c) { el('div', 'cielo-' + c, '', cielo); });
    var est = '';
    semilla = 3;
    for (var i = 0; i < 60; i++) est += '<circle cx="' + f(rnd(0, 1010)) + '" cy="' + f(rnd(0, 480)) + '" r="' + f(rnd(.6, 1.5)) + '" fill="#e8eeff" opacity="' + f(rnd(.3, .9)) + '"/>';
    el('div', 'estrellas', svg('0 0 1010 480', est), cielo);
    el('div', 'sol', '', cielo);
    var nub = '';
    semilla = 8;
    for (i = 0; i < 9; i++) nub += '<ellipse cx="' + f(rnd(0, 1010)) + '" cy="' + f(rnd(20, 230)) + '" rx="' + f(rnd(90, 220)) + '" ry="' + f(rnd(8, 18)) + '" fill="#fff"/>';
    el('div', 'nubes', svg('0 0 1010 250', nub), cielo);

    var ciudad = '', ventanas = '';
    semilla = 21;
    ciudad += '<rect x="0" y="200" width="8600" height="700" fill="url(#mxBrillo)"/>';
    var x = 0;
    while (x < 8600) {
      var bw = rnd(160, 420), bh = rnd(300, 900) * (Math.abs(x - 4300) < 1200 ? 1.4 : 1);
      ciudad += '<rect class="edificio" x="' + f(x) + '" y="' + f(1800 - bh) + '" width="' + f(bw) + '" height="' + f(bh) + '" fill="#0a1028"/>';
      for (var v = 0; v < bh / 70; v++) {
        if (rnd(0, 1) < .45) ventanas += '<rect x="' + f(x + rnd(20, bw - 40)) + '" y="' + f(1800 - bh + 30 + v * 70) + '" width="22" height="26" fill="' + (rnd(0, 1) < .7 ? '#ffd98a' : '#cfe4ff') + '"/>';
      }
      if (bh > 1000) ciudad += '<circle cx="' + f(x + bw / 2) + '" cy="' + f(1800 - bh - 40) + '" r="22" fill="#ff3a3a"/><path d="M' + f(x + bw / 2) + ' ' + f(1800 - bh) + ' V' + f(1800 - bh - 40) + '" stroke="#0a1028" stroke-width="10"/>';
      x += bw + rnd(10, 60);
    }
    var elCiudad = plano('mx-ciudad', 1500, 900, -6000, 8600, 1800, '', 1 / 7);
    var defsCiudad = '<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a6a" stop-opacity="0"/><stop offset="1" stop-color="#ff9a6a" stop-opacity=".35"/></linearGradient>' +
      '<filter id="d"><feGaussianBlur stdDeviation="7"/></filter></defs>';
    ciudad = ciudad.replace('url(#mxBrillo)', 'url(#b)');
    imagen('de-noche', '0 0 8600 1800', defsCiudad + '<g filter="url(#d)">' + ciudad + ventanas + '</g>', elCiudad);
    imagen('de-dia', '0 0 8600 1800', defsCiudad + '<g filter="url(#d)">' + ciudad + '</g>', elCiudad);

    // la rueda de la fortuna: la estructura gira con una animación de CSS (no se redibuja) y cada cabina gira al
    // revés con la misma animación para quedar derecha; la velocidad se cambia con playbackRate (sin brincos)
    var elRueda = plano('mx-rueda', 960, 30, -3800, 1520, 2060, '', esc(-3800),
      '<path d="M760 760 L520 2060 M760 760 L1000 2060 M760 760 L600 2060 M760 760 L920 2060" stroke="#2a3048" stroke-width="22"/>' +
      '<path d="M560 1700 H960" stroke="#2a3048" stroke-width="16"/>', '0 0 1520 2060');
    haloRueda = el('div', 'halo-rueda', '', elRueda);
    elGiro = el('div', 'giro', '', elRueda);
    var aro = '<circle cx="620" cy="620" r="612" fill="none" stroke="#1e2238" stroke-width="18"/>', luces = ['', ''];
    for (i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2;
      aro += '<path class="rayo-r" d="M620 620 L' + f(620 + Math.cos(a) * 612) + ' ' + f(620 + Math.sin(a) * 612) + '" stroke="' + (i % 2 ? '#3ad8ff' : '#ff4ab8') + '" stroke-width="5" opacity=".75"/>';
    }
    aro += '<circle cx="620" cy="620" r="60" fill="#e8f4ff"/><circle cx="620" cy="620" r="30" fill="#ff4ab8"/>';
    // dos capas de foquitos con la fase cambiada: al turnarse parece que corren
    [[612, 'r1', '#3ad8ff', 14, 48], [470, 'r2', '#ff4ab8', 12, 42], [300, 'r3', '#b8f0ff', 8, 28]].forEach(function (q) {
      var largo = 2 * Math.PI * q[0];
      [0, 1].forEach(function (k) {
        luces[k] += '<circle class="' + q[1] + '" cx="620" cy="620" r="' + q[0] + '" fill="none" stroke="' + q[2] + '" stroke-width="' + q[3] + '" stroke-dasharray="' + f(q[4] / 2) + ' ' + f(q[4] / 2) + '" stroke-dashoffset="' + f(k * q[4] / 2) + '" pathLength="' + f(largo) + '"/>';
      });
    });
    el('div', 'aro', svg('0 0 1240 1240', aro), elGiro);
    el('div', 'luces luces-a', svg('0 0 1240 1240', luces[0]), elGiro);
    el('div', 'luces luces-b', svg('0 0 1240 1240', luces[1]), elGiro);
    var colCab = ['#ff4ab8', '#3ad8ff', '#ffd23a', '#9a6aff', '#5aff9a', '#ff7a3a'];
    for (i = 0; i < 16; i++) {
      a = i / 16 * Math.PI * 2;
      var cab = el('div', 'cabina', '', elGiro);
      cab.style.left = f(50 + 49.35 * Math.cos(a)) + '%';
      cab.style.top = f(50 + 49.35 * Math.sin(a)) + '%';
      el('div', 'cab', svg('-34 0 68 90', '<path d="M0 0 V36" stroke="#8a90a8" stroke-width="5"/><rect x="-34" y="34" width="68" height="56" rx="12" fill="' + colCab[i % 6] + '"/><rect x="-24" y="44" width="48" height="22" rx="5" fill="#fff6e0" opacity=".8"/>'), cab);
    }

    // árboles del parque detrás del ventanal, con farolitos
    var arb = '', faroles = '';
    semilla = 33;
    for (i = 0; i < 70; i++) arb += '<circle cx="' + f(rnd(0, 5000)) + '" cy="' + f(rnd(380, 760)) + '" r="' + f(rnd(110, 240)) + '" fill="' + ['#060b14', '#08101c', '#050912'][i % 3] + '"/>';
    arb += '<rect x="0" y="700" width="5000" height="900" fill="#050912"/>';
    for (i = 0; i < 18; i++) faroles += '<circle cx="' + f(rnd(0, 5000)) + '" cy="' + f(rnd(640, 900)) + '" r="' + f(rnd(10, 18)) + '" fill="#ffcf7a"/>';
    var elArboles = plano('mx-arboles', 800, 500, -2700, 5000, 1600, '', esc(-2700));
    var defsArb = '<defs><filter id="d"><feGaussianBlur stdDeviation="2.5"/></filter></defs>';
    imagen('de-noche', '0 0 5000 1600', defsArb + '<g filter="url(#d)">' + arb + faroles + '</g>', elArboles);
    imagen('de-dia', '0 0 5000 1600', defsArb + '<g filter="url(#d)">' + arb + '</g>', elArboles);
    // estelas de coches en el time-lapse: tiras que se deslizan (se mueven sin redibujarse)
    var estelas = plano('mx-estelas', 800, 445, -2650, 5000, 70, '', esc(-2650));
    el('i', 'roja', '', estelas);
    el('i', 'blanca', '', estelas);

    // ---------- el cuarto: piso, techo en A, ventanal ----------
    // ventanal (el triángulo del frente de la cabaña): marcos de fierro y reflejos
    var vid = '<defs><clipPath id="mxTri"><path d="M-720 430 L-720 -560 L200 -1600 L2000 430Z"/></clipPath>' +
      '<linearGradient id="mxReflejo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#cfe0ff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<g clip-path="url(#mxTri)"><rect x="-720" y="-1600" width="2720" height="2030" fill="#9ab8e8" opacity=".05"/>' +
      '<path d="M-200 -1600 L-720 -600 L-720 -300 L100 -1600Z M700 -1600 L-300 430 L-60 430 L940 -1600Z" fill="url(#mxReflejo)"/>';
    [-350, 20, 390, 760, 1500, 1870].forEach(function (mx) { vid += '<rect x="' + (mx - 9) + '" y="-1600" width="18" height="2030" fill="#15120f"/>'; });
    [-250, 130].forEach(function (my) { vid += '<rect x="-720" y="' + (my - 7) + '" width="2720" height="14" fill="#15120f"/>'; });
    vid += '<rect x="1110" y="-1600" width="44" height="2030" fill="#7a2e1c"/><rect x="1110" y="-1600" width="10" height="2030" fill="#9a4228"/>' +
      '<rect x="-720" y="404" width="2720" height="30" fill="#1c1712"/></g>' +
      '<path d="M-720 -560 L200 -1600 L2000 430" stroke="#6a2a1a" stroke-width="56" fill="none" stroke-linejoin="round"/>' +
      '<path d="M-720 -540 L200 -1572" stroke="#8a3a24" stroke-width="12" fill="none"/>';
    plano('mx-vidrio', 640, -585, -2000, 2720, 2030, '', esc(-2000), vid, '-720 -1600 2720 2030');

    // techo de triplay (dos aguas de la A) y la pared de la izquierda
    function triplay(w, h, base, sombra) {
      var t = '<defs><linearGradient id="mxTri' + base.slice(1) + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + base + '"/><stop offset="1" stop-color="' + sombra + '"/></linearGradient></defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="url(#mxTri' + base.slice(1) + ')"/>';
      semilla = 17;
      for (var yy = 0; yy < h; yy += 780) {
        for (var xx = 0; xx < w; xx += 390) {
          t += '<rect x="' + xx + '" y="' + yy + '" width="390" height="780" fill="' + (rnd(0, 1) < .5 ? '#fff' : '#3a1e0a') + '" opacity="' + f(rnd(.02, .07)) + '"/>';
          for (var g = 0; g < 7; g++) {
            var gx = xx + rnd(20, 370);
            t += '<path d="M' + f(gx) + ' ' + yy + ' C' + f(gx + rnd(-14, 14)) + ' ' + f(yy + 260) + ' ' + f(gx + rnd(-14, 14)) + ' ' + f(yy + 520) + ' ' + f(gx + rnd(-8, 8)) + ' ' + (yy + 780) + '" stroke="#7a4a24" stroke-width="' + f(rnd(1.5, 4)) + '" fill="none" opacity=".25"/>';
          }
          t += '<path d="M' + xx + ' ' + yy + ' V' + (yy + 780) + ' M' + xx + ' ' + yy + ' H' + (xx + 390) + '" stroke="#5a3418" stroke-width="4" opacity=".55"/>';
        }
      }
      return t;
    }
    var largoTecho = Math.hypot(920, 1040), angTecho = Math.atan2(1040, 920) * 180 / Math.PI;
    plano('mx-techo-izq', -260, -1080, -720, largoTecho, 2560, 'rotateZ(' + f(-angTecho) + 'deg) rotateX(-90deg)', .5, triplay(Math.round(largoTecho), 2560, '#c8935a', '#9a6a3c'));
    var largoDer = Math.hypot(1800, 2030);
    plano('mx-techo-der', 1100, -585, -720, largoDer, 2560, 'rotateZ(' + f(angTecho) + 'deg) rotateX(-90deg)', .4, triplay(Math.round(largoDer), 2560, '#a87a4a', '#6a4626'));
    plano('mx-pared', -800, -65, -720, 2560, 990, 'rotateY(90deg)', .3, '<rect width="2560" height="990" fill="#cfc8ba"/><rect width="2560" height="990" fill="#2a2018" opacity=".35"/>');

    // piso: papel kraft pegado con cinta, impresiones regadas, la sábana blanca y cables
    var piso = '<rect width="3200" height="2450" fill="#4a3426"/>';
    for (i = 0; i < 30; i++) piso += '<path d="M' + (i * 110) + ' 0 V2450" stroke="#3a281c" stroke-width="4"/>';
    semilla = 41;
    [[150, 900, 900, 700, -3], [700, 1300, 1100, 800, 4], [200, 1700, 1000, 900, 2], [1000, 1900, 900, 800, -5], [400, 600, 700, 500, 6], [1200, 1100, 600, 700, -2]].forEach(function (k) {
      piso += '<g transform="rotate(' + k[4] + ' ' + (k[0] + k[2] / 2) + ' ' + (k[1] + k[3] / 2) + ')"><rect x="' + k[0] + '" y="' + k[1] + '" width="' + k[2] + '" height="' + k[3] + '" fill="' + ['#a8814f', '#9c7646', '#b28a58'][k[0] % 3] + '"/>' +
        '<rect x="' + (k[0] - 20) + '" y="' + (k[1] - 12) + '" width="90" height="34" fill="#e8dcb0" opacity=".8"/><rect x="' + (k[0] + k[2] - 70) + '" y="' + (k[1] + k[3] - 22) + '" width="90" height="34" fill="#e8dcb0" opacity=".8"/></g>';
    });
    // salpicaduras de pintura y pegamento
    for (i = 0; i < 26; i++) piso += '<ellipse cx="' + f(rnd(100, 1500)) + '" cy="' + f(rnd(900, 2500)) + '" rx="' + f(rnd(8, 40)) + '" ry="' + f(rnd(6, 26)) + '" fill="#efece4" opacity="' + f(rnd(.3, .8)) + '"/>';
    // fotos y hojas regadas
    for (i = 0; i < 34; i++) {
      var fx = rnd(80, 1700), fy = rnd(700, 2550), azul = rnd(0, 1) < .6;
      piso += '<g transform="rotate(' + f(rnd(-40, 40)) + ' ' + f(fx) + ' ' + f(fy) + ')"><rect x="' + f(fx - 50) + '" y="' + f(fy - 40) + '" width="100" height="80" fill="' + (azul ? '#eef2f6' : '#f6f2ea') + '"/>' +
        (azul ? '<rect x="' + f(fx - 44) + '" y="' + f(fy - 34) + '" width="88" height="56" fill="' + ['#2f6aa8', '#5a8ec8', '#1f4e86'][i % 3] + '"/>' : '<path d="M' + f(fx - 40) + ' ' + f(fy - 20) + ' h70 M' + f(fx - 40) + ' ' + f(fy) + ' h60 M' + f(fx - 40) + ' ' + f(fy + 20) + ' h66" stroke="#8a8a90" stroke-width="3"/>') + '</g>';
    }
    // la sábana blanca (derecha) con sus pliegues
    piso += '<path d="M1400 1050 C1700 1000 2100 1020 3200 980 V2700 H1350 C1300 2300 1420 1800 1360 1500 C1340 1300 1380 1150 1400 1050Z" fill="#e8e6e0"/>';
    for (i = 0; i < 14; i++) { var px = rnd(1450, 3100), py = rnd(1100, 2600); piso += '<path d="M' + f(px) + ' ' + f(py) + ' C' + f(px + 120) + ' ' + f(py - 40) + ' ' + f(px + 220) + ' ' + f(py + 30) + ' ' + f(px + 360) + ' ' + f(py - 10) + '" stroke="#c8c6c0" stroke-width="' + f(rnd(6, 14)) + '" fill="none" stroke-linecap="round"/>'; }
    // cables del equipo
    piso += '<path d="M1300 520 C1200 900 900 1100 1000 1500 C1080 1800 1500 1900 1700 2300" stroke="#121214" stroke-width="10" fill="none"/>' +
      '<path d="M1500 500 C1600 800 1300 1000 1250 1300 C1200 1600 1100 2000 1240 2600" stroke="#1a1a1e" stroke-width="8" fill="none"/>' +
      '<path d="M900 560 C800 700 700 760 560 900" stroke="#121214" stroke-width="8" fill="none"/>';
    // charco de luz de la lámpara del piso
    piso += '<defs><radialGradient id="mxPozo"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".5"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="pozo" cx="750" cy="1970" rx="900" ry="700" fill="url(#mxPozo)"/>';
    // piso en dos partes: lo lejano con menos resolución, lo cercano con más (en celular se ve mucho piso)
    plano('mx-piso', 600, PISO, -775, 3200, 2450, 'rotateX(90deg)', .55, piso, '0 0 3200 2450');
    plano('mx-piso-cerca', 600, PISO, 660, 3200, 460, 'rotateX(90deg)', .6,
      '<rect width="3200" height="460" fill="#4a3426"/><rect x="200" y="0" width="1100" height="460" fill="#a8814f"/><rect x="1350" y="0" width="1850" height="460" fill="#e8e6e0"/>', '0 0 3200 460');
    // luz del amanecer que entra por el ventanal y se proyecta en el piso
    var manchas = '';
    for (i = 0; i < 6; i++) {
      for (var r = 0; r < 2; r++) {
        var x0 = 300 + i * 370, z0 = 0 + r * 420;
        manchas += '<path d="M' + (x0 + 20) + ' ' + (z0 + 10) + ' L' + (x0 + 340) + ' ' + (z0 + 10) + ' L' + (x0 + 200) + ' ' + (z0 + 400) + ' L' + (x0 - 120) + ' ' + (z0 + 400) + 'Z" fill="#ffc890"/>';
      }
    }
    plano('mx-luz-piso', 600, PISO - 2, -1300, 3200, 1400, 'rotateX(90deg)', .3, manchas, '0 0 3200 1400');

    // ---------- el muro del collage (un panel grande en diagonal) ----------
    var ANG = 55, ca = Math.cos(ANG * Math.PI / 180), sa = Math.sin(ANG * Math.PI / 180);
    var muro = plano('mx-muro', -760 + ca * 550, -65, 150 - sa * 550, 1100, 990, 'rotateY(' + ANG + 'deg)', 1);
    var fondo = '<defs><radialGradient id="mxLuzMuro" cx=".85" cy=".8" r=".9"><stop offset="0" stop-color="#fff8ea"/><stop offset=".5" stop-color="#e9e3d6"/><stop offset="1" stop-color="#b8b0a2"/></radialGradient></defs>' +
      '<rect width="1100" height="990" fill="url(#mxLuzMuro)"/>';
    semilla = 55;
    for (i = 0; i < 40; i++) { var rx = rnd(0, 1100); fondo += '<rect x="' + f(rx) + '" y="0" width="' + f(rnd(20, 70)) + '" height="990" fill="' + (i % 2 ? '#fff' : '#9a9284') + '" opacity="' + f(rnd(.03, .08)) + '"/>'; }
    for (i = 0; i < 12; i++) { var dx = rnd(30, 1070), dl = rnd(30, 160); fondo += '<path d="M' + f(dx) + ' 990 V' + f(990 - dl) + '" stroke="#d6d0c4" stroke-width="' + f(rnd(3, 7)) + '" stroke-linecap="round"/>'; }
    for (i = 0; i < 9; i++) fondo += '<ellipse cx="' + f(rnd(60, 1040)) + '" cy="' + f(rnd(80, 900)) + '" rx="' + f(rnd(40, 110)) + '" ry="' + f(rnd(30, 80)) + '" fill="#d8cfb8" opacity=".25"/>';
    // restos de carteles viejos en las orillas
    fondo += '<path d="M0 40 L70 34 L64 120 L0 130Z" fill="#e8d0a8" opacity=".7"/><path d="M1030 860 L1100 850 V990 H1040Z" fill="#c8d8e8" opacity=".7"/>' +
      '<path d="M0 0 H1100 V990 H0Z" fill="none" stroke="#8a8274" stroke-width="10"/>';
    el('div', 'muro-fondo', svg('0 0 1100 990', fondo), muro);

    // huecos del corazón (filas alternadas, como ladrillos)
    var CX = 620, CY = 470, A = 440, B = 340;
    function dentro(u, v) {
      var x = (u - CX) / A * 1.15, y = -(v - CY) / B * 1.15 + .15, q = x * x + y * y - 1;
      return q * q * q - x * x * y * y * y <= 0;
    }
    var fotos = [], fila = 0;
    semilla = 60;
    for (var vv = CY - B; vv <= CY + B + 40; vv += 84, fila++) {
      for (var uu = CX - A - 60 + (fila % 2 ? 46 : 0); uu <= CX + A + 60; uu += 92) {
        if (!dentro(uu, vv) || Math.hypot(uu - CX, vv - (CY - 10)) < 70) continue;
        fotos.push({ u: uu + rnd(-7, 7), v: vv + rnd(-6, 6) });
      }
    }
    // orden en que se pegan: empieza por el lóbulo izquierdo (donde está trabajando) y se va extendiendo
    fotos.forEach(function (p) { p.orden = Math.hypot(p.u - (CX - 260), p.v - (CY - 120)) + rnd(-60, 60); });
    fotos.sort(function (a, b) { return a.orden - b.orden; });
    var minis = window.MiniPortadas || {}, idsMini = Object.keys(minis), motivos = Object.keys(MOTIVOS), paletas = Object.keys(PAL);
    // resplandor con forma de corazón detrás del collage (cuando se completa)
    var hc = function (dx, dy) { return f(CX + dx * 1.18) + ' ' + f(CY + 10 + dy * 1.18); };
    imagen('', '0 0 1100 990',
      '<defs><radialGradient id="mxHaloC" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffd890" stop-opacity=".95"/><stop offset=".75" stop-color="#ffb860" stop-opacity=".7"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>' +
      '<filter id="mxDifuso" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter></defs>' +
      '<path d="M' + hc(0, B + 10) + ' C' + hc(-260, 170) + ' ' + hc(-A - 30, -20) + ' ' + hc(-A + 30, -B + 30) + ' C' + hc(-A + 120, -B - 100) + ' ' + hc(-60, -B - 80) + ' ' + hc(0, -B + 40) +
      ' C' + hc(60, -B - 80) + ' ' + hc(A - 120, -B - 100) + ' ' + hc(A - 30, -B + 30) + ' C' + hc(A + 30, -20) + ' ' + hc(260, 170) + ' ' + hc(0, B + 10) + 'Z" fill="url(#mxHaloC)" filter="url(#mxDifuso)"/>', el('div', 'halo-corazon', '', muro));
    var capaFotos = el('div', 'fotos', '', muro);
    capaFotos.addEventListener('animationend', function (ev) { ev.target.classList.remove('vuela'); });
    fotos.forEach(function (p, k) {
      var vertical = rnd(0, 1) < .3, w = vertical ? 72 : rnd(84, 98), h = vertical ? 96 : rnd(68, 78), src = '', tipo = 'img';
      if (k % 3 === 1 && idsMini.length) { src = urlSvg('0 0 100 100', minis[idsMini[(k / 3 | 0) % idsMini.length]].replace(/^<svg[^>]*>|<\/svg>$/g, '')); w = h = rnd(78, 86); }
      else if (k % 7 === 5) tipo = 'nota';
      else {
        var mot = motivos[(k * 5) % motivos.length], pal = PAL[paletas[(k * 3 + (k >> 2)) % paletas.length]];
        if (mot === 'rueda' || mot === 'ciudad' || mot === 'gente') pal = PAL.noche;
        src = urlSvg('0 0 100 80', MOTIVOS[mot](pal));
      }
      var d = el('div', 'mx-foto' + (p.u < CX - 4 ? ' izq' : ' der'), '', capaFotos);
      d.style.cssText = 'left:' + f(p.u - w / 2) + 'px;top:' + f(p.v - h / 2) + 'px;width:' + f(w) + 'px;height:' + f(h) + 'px;--r:' + f(rnd(-7, 7)) + 'deg;' +
        '--vx:' + f(rnd(-260, 260)) + 'px;--vy:' + f(rnd(-200, 160)) + 'px;--vr:' + f(rnd(-200, 200)) + 'deg;--k:' + (k % 7);
      if (tipo === 'nota') el('span', 'nota', NOTAS[k % NOTAS.length], d);
      else el('img', '', '', d).src = src;
      el('i', 'cinta-f', '', d);
      ranuras.push({ el: d, t: 0 });
    });
    // la tira de fotos de los dos, al centro ("¿dónde está lo nuestro?")
    var tira = el('div', 'mx-tira', '', capaFotos);
    tira.style.cssText = 'left:' + (CX - 34) + 'px;top:' + (CY - 96) + 'px;';
    var pareja = urlSvg('0 0 100 80', MOTIVOS.pareja(PAL.calida));
    for (i = 0; i < 3; i++) el('img', '', '', tira).src = pareja;
    el('span', 'tira-pie', 'tú y yo ♡', tira);
    el('i', 'cinta-f', '', tira);
    // cuándo se pega cada foto: unas cuantas al principio, ráfagas en "te lo entrego todo", y se completa en el cuarto "si estás aquí"
    var N = ranuras.length;
    function tramo(t0, t1, n0, n1) { return { t0: t0, t1: t1, n0: n0, n1: n1 }; }
    var TRAMOS = [tramo(-1, 0, 0, 6), tramo(13.5, 31.19, 6, 10), tramo(31.19, 34.4, 10, 22), tramo(34.59, 38.8, 22, 32),
      tramo(39.8, 131.5, 32, N - 5), tramo(132.18, 134.6, N - 5, N)];
    ranuras.forEach(function (rr, k) {
      for (var j = 0; j < TRAMOS.length; j++) {
        var T = TRAMOS[j];
        if (k < T.n1) { rr.t = T.t0 + (T.t1 - T.t0) * Math.max(0, (k - T.n0 + .5)) / Math.max(1, T.n1 - T.n0); break; }
      }
      if (k < 6) rr.t = -1;
    });
    // la sombra del chico y de la escalera que proyecta la lámpara del piso
    imagen('', '0 0 1100 990',
      '<defs><filter id="mxSombra" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter></defs><g filter="url(#mxSombra)">' +
      '<g transform="translate(1010 250) scale(1.15) translate(-180 0)">' + escalera().replace(/stroke="#[0-9a-f]{6}"/g, 'stroke="#000"').replace(/fill="#[0-9a-f]{6}"/g, 'fill="#000"') + '</g>' +
      '<g transform="translate(1030 690) scale(1.16)">' + chico(true) + '</g></g>', el('div', 'sombra-muro', '', muro));
    // grieta del corazón, la cinta que la cose y el oro (kintsugi)
    semilla = 77;
    var grieta = 'M' + CX + ' ' + (CY - B + 30), gy = CY - B + 30, gx = CX;
    while (gy < CY + B + 30) { gy += rnd(26, 44); gx = CX + rnd(-22, 22); grieta += ' L' + f(gx) + ' ' + f(gy); }
    var puntadas = '';
    for (i = 0; i < 9; i++) {
      var py2 = CY - B + 80 + i * 66;
      puntadas += '<g class="puntada" style="--k:' + i + '"><rect x="' + (CX - 46) + '" y="' + f(py2 - 11) + '" width="92" height="22" fill="#e6d8a8" opacity=".92" transform="rotate(' + f(rnd(-24, 24)) + ' ' + CX + ' ' + f(py2) + ')"/></g>';
    }
    el('div', 'grieta', svg('0 0 1100 990',
      '<defs><linearGradient id="mxOro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".3" stop-color="#e8b23a"/><stop offset=".6" stop-color="#fff0a0"/><stop offset="1" stop-color="#c88a1a"/></linearGradient></defs>' +
      '<path class="raja-papel" pathLength="1" d="' + grieta + '" stroke="#fbf8f0" stroke-width="26" fill="none" stroke-linejoin="round"/>' +
      '<path class="raja" pathLength="1" d="' + grieta + '" stroke="#1e1a22" stroke-width="11" fill="none" stroke-linejoin="round"/>' +
      '<g class="puntadas">' + puntadas + '</g>' +
      '<path class="oro" pathLength="1" d="' + grieta + '" stroke="url(#mxOro)" stroke-width="12" fill="none" stroke-linejoin="round"/>'), muro);
    el('div', 'oro-brillo', svg('0 0 1100 990', '<path d="' + grieta + '" stroke="#ffd86a" stroke-width="34" fill="none" stroke-linejoin="round"/>'), muro);
    // linterna que busca ("¿dónde está todo eso?"), luz sobre la tira ("lo nuestro") y brillo del corazón completo
    el('div', 'linterna', '', muro);
    el('div', 'foco-nuestro', '', muro).style.cssText = 'left:' + (CX - 220) + 'px;top:' + (CY - 260) + 'px';
    // la lista de canciones del mixtape, escrita a mano y pegada con cinta
    var lista = el('div', 'tracklist', '<b>mixtape ♡</b>', muro);
    // el mixtape termina en "Alvafro": las canciones que se agregaron después no van en su lista
    var pistas = window.ListaCanciones || [], ultima = pistas.map(function (c) { return c.id; }).indexOf('mixtape');
    (ultima >= 0 ? pistas.slice(0, ultima + 1) : pistas).forEach(function (c) {
      el('span', c.id === 'mixtape' ? 'pista esta' : 'pista', c.lado.replace('lado ', '') + ' · ' + c.titulo.toLowerCase(), lista);
    });
    el('i', 'cinta-f', '', lista);

    // ---------- equipo y gente al fondo, bajo el ventanal ----------
    var mesa = '<rect x="0" y="140" width="640" height="20" fill="#3a2a20"/><rect x="0" y="158" width="640" height="8" fill="#22180f"/>' +
      '<path d="M30 166 V380 M610 166 V380 M60 166 L50 380 M580 166 L590 380" stroke="#22180f" stroke-width="12"/>' +
      // computadoras con el programa de música abierto (clips de colores)
      '<path d="M70 40 L210 40 L206 132 L74 132Z" fill="#0c0e14"/><path class="pantalla" d="M78 46 L202 46 L199 126 L81 126Z" fill="#cfdcff"/>' +
      '<path d="M60 132 L220 132 L232 142 L48 142Z" fill="#9aa0aa"/>' +
      '<path d="M390 46 L520 46 L516 132 L394 132Z" fill="#0c0e14"/><path class="pantalla" d="M398 52 L512 52 L509 126 L401 126Z" fill="#cfdcff"/>' +
      '<path d="M380 132 L530 132 L542 142 L368 142Z" fill="#9aa0aa"/>';
    var clips = ['#ff6a8a', '#ffb84a', '#6ad8a0', '#6ab8ff', '#c88aff', '#ffe066'];
    semilla = 91;
    [[82, 200, 50, 122], [402, 508, 56, 122]].forEach(function (sc) {
      for (var row = 0; row < 6; row++) {
        var cx2 = sc[0] + 6;
        while (cx2 < sc[1] - 8) { var cw = rnd(10, 30); mesa += '<rect class="clip" x="' + f(cx2) + '" y="' + f(sc[2] + 6 + row * 11) + '" width="' + f(Math.min(cw, sc[1] - cx2 - 4)) + '" height="8" fill="' + clips[(row + (cx2 | 0)) % 6] + '"/>'; cx2 += cw + rnd(2, 10); }
      }
    });
    mesa += '<path class="onda" d="M84 118 Q100 106 116 118 T148 118 T180 118 T200 118" stroke="#ff2a4a" stroke-width="3" fill="none"/>' +
      '<path class="onda" d="M404 118 Q420 106 436 118 T468 118 T500 118 T508 118" stroke="#ff2a4a" stroke-width="3" fill="none"/>' +
      '<rect x="250" y="104" width="100" height="36" rx="4" fill="#c8322a"/><circle cx="272" cy="122" r="8" fill="#2a2a2e"/><circle cx="300" cy="122" r="8" fill="#2a2a2e"/><rect x="318" y="114" width="22" height="6" fill="#6aff9a"/>' +
      '<rect x="560" y="112" width="26" height="28" rx="3" fill="#efe9de"/><path d="M586 118 C596 118 596 132 586 132" stroke="#efe9de" stroke-width="4" fill="none"/>' +
      '<path d="M120 142 C130 200 90 260 140 380 M470 142 C480 220 520 280 500 380" stroke="#101012" stroke-width="5" fill="none"/>';
    var elMesa = cartel('mx-mesa', 380, PISO + 10, -1500, 640, 390, mesa, '0 0 640 390');
    var torres = '<rect x="20" y="40" width="280" height="10" fill="#2a2a30"/><path d="M40 50 V460 M280 50 V460" stroke="#2a2a30" stroke-width="10"/>';
    [[60, 140], [150, 140], [240, 140], [330, 140]].forEach(function (d2, k) {
      var y = d2[0];
      torres += '<rect x="30" y="' + y + '" width="260" height="70" rx="6" fill="#1c1d22"/><rect class="lcd" x="46" y="' + (y + 10) + '" width="90" height="26" rx="2" fill="#3a9cff"/>';
      for (var b = 0; b < 8; b++) torres += '<rect class="pad" style="--k:' + (b + k * 3) + '" x="' + (150 + (b % 4) * 32) + '" y="' + (y + 10 + (b >> 2) * 26) + '" width="24" height="20" rx="3" fill="' + ['#f2f2ee', '#ff8a3a', '#f2f2ee', '#3a9cff'][b % 4] + '"/>';
      for (b = 0; b < 4; b++) torres += '<circle cx="' + (58 + b * 22) + '" cy="' + (y + 52) + '" r="7" fill="#d8d8dc"/>';
    });
    var elTorres = cartel('mx-torres', 820, PISO + 10, -1560, 320, 470, torres, '0 0 320 470');
    function bocina() {
      return '<path d="M80 300 V560 M40 560 L80 520 L120 560" stroke="#18181c" stroke-width="10" fill="none"/>' +
        '<rect x="20" y="20" width="120" height="280" rx="10" fill="#141416"/><rect x="20" y="20" width="10" height="280" fill="#2a2a30"/>' +
        '<circle cx="80" cy="200" r="46" fill="#222228"/><circle class="cono" cx="80" cy="200" r="30" fill="#0c0c0e"/><circle cx="80" cy="80" r="18" fill="#222228"/><circle cx="80" cy="80" r="8" fill="#0c0c0e"/>' +
        '<circle class="led" cx="80" cy="270" r="4" fill="#3aff8a"/>';
    }
    var elBocina1 = cartel('mx-bocina', -80, PISO + 5, -1450, 160, 570, bocina(), '0 0 160 570');
    var elBocina2 = cartel('mx-bocina', 1220, PISO + 5, -1520, 160, 570, bocina(), '0 0 160 570');
    [elBocina1, elBocina2].forEach(function (b) { for (var k = 0; k < 3; k++) el('i', 'aro', '', b).style.setProperty('--k', k); });
    var luzRoja = cartel('mx-luz-roja', 1050, PISO + 5, -1680, 360, 640,

      '<path d="M180 150 V560 M180 560 L110 640 M180 560 L250 640 M180 560 L180 640" stroke="#2a2a30" stroke-width="8"/>' +
      '<rect x="140" y="80" width="80" height="70" rx="8" fill="#1c1c22"/><circle cx="180" cy="115" r="26" fill="#ff3a4a"/><circle cx="174" cy="108" r="8" fill="#ffb0b8"/>', '0 0 360 640');
    el('i', 'halo-rojo', '', luzRoja);
    cartel('mx-micro', 150, PISO + 5, -1350, 300, 520,
      '<path d="M150 520 V200 L60 120 M150 520 L100 520 M150 520 L200 520" stroke="#2a2a30" stroke-width="8" fill="none"/><rect x="34" y="96" width="34" height="56" rx="16" fill="#3a3a42" transform="rotate(-48 51 124)"/>', '0 0 300 520');
    cartel('mx-sofa', 1380, PISO + 5, -1860, 760, 300,
      '<path d="M20 120 C20 90 60 80 100 80 H660 C700 80 740 90 740 120 V280 H20Z" fill="#3a3a44"/><rect x="0" y="150" width="760" height="120" rx="30" fill="#4a4a56"/>' +
      '<rect x="80" y="110" width="150" height="90" rx="20" fill="#d8c8a8"/><rect x="520" y="104" width="160" height="96" rx="20" fill="#7a8aa8"/><path d="M40 270 V300 M720 270 V300" stroke="#1a1a20" stroke-width="12"/>', '0 0 760 300');
    // alguien en la compu, de audífonos (silueta contra el ventanal)
    cartel('mx-fondo-persona', 260, PISO + 5, -1430, 220, 580,
      '<path d="M70 580 L80 330 L150 330 L160 580Z" fill="#14161c"/><path d="M50 340 C40 260 50 190 110 180 C170 190 180 260 170 340Z" fill="#1a1c24"/>' +
      '<path d="M170 300 C170 240 160 200 130 186" stroke="#4a6aa8" stroke-width="4" fill="none" opacity=".8"/>' +
      '<path d="M150 230 Q210 250 214 290" stroke="#1a1c24" stroke-width="24" stroke-linecap="round" fill="none"/>' +
      '<circle cx="112" cy="140" r="38" fill="#16181e"/><path d="M76 132 C78 92 146 92 148 132" stroke="#e8e8ec" stroke-width="8" fill="none"/><rect x="66" y="126" width="18" height="30" rx="6" fill="#e8e8ec"/><rect x="140" y="126" width="18" height="30" rx="6" fill="#e8e8ec"/>', '0 0 220 580');
    // lucecitas que cuelgan de lado a lado ("si estás aquí", la segunda vez)
    var guir = '<defs><radialGradient id="mxFoco"><stop offset="0" stop-color="#ffd88a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient></defs>';
    var curva = function (x0, x1, y0, sag, n, off) {
      var h2 = '<path d="M' + x0 + ' ' + y0 + ' Q' + ((x0 + x1) / 2) + ' ' + (y0 + sag * 2) + ' ' + x1 + ' ' + y0 + '" stroke="#2a2420" stroke-width="3" fill="none"/>';
      for (var k = 1; k < n; k++) {
        var t = k / n, bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + x1) / 2 + t * t * x1, by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0;
        h2 += '<g class="foco" style="--k:' + (k + off) + '"><circle class="foco-halo" cx="' + f(bx) + '" cy="' + f(by + 14) + '" r="34" fill="url(#mxFoco)"/><circle class="foco-bulbo" cx="' + f(bx) + '" cy="' + f(by + 14) + '" r="9" fill="#6a5a44"/></g>';
      }
      return h2;
    };
    guir += curva(0, 900, 40, 70, 12, 0) + curva(900, 1800, 30, 60, 12, 12);
    cartel('mx-guirnalda', 700, -230, -1100, 1800, 280, guir, '0 0 1800 280');
    // lámparas de papel como nubes
    cartel('mx-nube n1', 1060, 30, -700, 700, 1090, lamparaNube(480, 300, 820), '-350 -820 700 1090');
    cartel('mx-nube n2', -40, -410, -1500, 420, 930, lamparaNube(300, 190, 760), '-210 -760 420 930');
    cartel('mx-nube n3', -230, -660, -1150, 350, 480, lamparaNube(250, 170, 330), '-175 -330 350 480');

    // ---------- al frente: escalera, el chico, el ayudante, lámpara, banquito con el casete ----------
    var elEscalera = cartel('mx-escalera', -50, PISO + 4, -552, 360, 690, escalera(), '0 0 360 690');
    var elChico = cartel('mx-chico', -40, 160 + 24, -544, 480, 760, '', '', 1);
    el('div', 'mx-chico-dentro', svg('-240 -736 480 760', chico(false)), elChico);
    cartel('mx-ayudante', 80, PISO + 24, -400, 420, 740, ayudante(), '-210 -716 420 740');
    cartel('mx-encapuchado', 300, PISO + 20, -960, 440, 620, encapuchado(), '-220 -600 440 620');
    cartel('mx-caja', 470, PISO + 4, -940, 200, 150,
      '<path d="M10 40 L190 40 L190 150 L10 150Z" fill="#a8845a"/><path d="M10 40 L40 10 L160 10 L190 40Z" fill="#c8a070"/><path d="M10 40 L-10 20 M190 40 L210 18" stroke="#c8a070" stroke-width="10"/><path d="M60 80 H140" stroke="#7a5a3a" stroke-width="4"/>', '0 0 200 150');
    // la sábana amontonada con almohadas, ella, el amigo y alguien dormido
    cartel('mx-sabanas', 860, PISO + 6, -520, 980, 300,
      '<path d="M0 300 C20 230 80 190 160 180 C220 120 330 100 420 130 C500 80 640 90 700 140 C800 130 920 170 960 240 L980 300Z" fill="#eceae4"/>' +
      '<path d="M160 180 C220 200 260 240 280 300 M420 130 C430 190 470 240 520 300 M700 140 C720 200 760 250 830 300" stroke="#cfccc6" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<path d="M500 160 C540 140 610 140 650 170 C620 200 540 200 500 160Z" fill="#f8f6f2"/><path d="M0 300 C200 290 700 286 980 300" stroke="#b8b6b0" stroke-width="8" fill="none"/>', '0 0 980 300');
    cartel('mx-chica', 700, PISO - 92, -470, 420, 360, chica(), '-210 -340 420 360');
    cartel('mx-amigo', 860, PISO - 96, -455, 460, 340, amigo(), '-230 -330 460 340');
    var corsJ = el('div', 'mx-corazones', '', cartel('mx-cor-juntos', 780, 80, -470, 420, 560, '', '0 0 420 560'));
    for (i = 0; i < 7; i++) el('i', '', svg('-16 -14 32 26', '<path d="M0 10 C-18 -2 -12 -16 0 -8 C12 -16 18 -2 0 10Z" fill="' + ['#ff5a8a', '#ffd27a', '#ff8ab0'][i % 3] + '"/>'), corsJ).style.cssText = 'left:' + (12 + i * 12) + '%;--w:-' + f(i * .55) + 's';
    cartel('mx-dormido', 820, PISO + 6, -70, 680, 220,
      '<path d="M40 210 C40 120 140 80 260 84 C380 88 470 110 520 150 C560 170 600 190 620 214Z" fill="#f2f0ea"/><path d="M120 120 C200 110 300 130 380 120 M200 170 C300 160 400 180 500 170" stroke="#d4d2cc" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path d="M500 168 C560 160 640 170 680 196 L676 216 H540Z" fill="#4e6e9e"/><path d="M660 186 C680 180 694 192 688 214 H660Z" fill="#f2f0ec"/>' +
      '<path d="M-10 214 C-14 184 10 168 60 166 L170 170 C196 176 200 200 192 216Z" fill="#f8f6f0"/><path d="M0 200 C40 196 120 198 180 204" stroke="#dedad2" stroke-width="6" fill="none"/>' +
      '<ellipse cx="96" cy="160" rx="34" ry="28" fill="#c89070"/><path d="M70 168 C76 174 86 176 96 174" stroke="#8a5a40" stroke-width="3" fill="none"/><path d="M84 156 C88 160 94 160 98 156" stroke="#5a3a2a" stroke-width="2.4" fill="none"/>' +
      '<path d="M120 150 C124 112 86 104 66 122 C52 134 54 150 62 156 C70 140 96 132 120 150Z" fill="#2a1e16"/><path d="M120 150 C132 160 136 176 128 190 C140 180 146 160 136 146Z" fill="#2a1e16"/>' +
      '<path d="M128 150 C160 140 190 150 210 168" stroke="#f2f0ea" stroke-width="26" stroke-linecap="round" fill="none"/>', '0 0 680 220');
    // lámpara de piso (un cubo de luz) que ilumina el muro
    cartel('mx-lampara', -250, PISO + 4, -30, 320, 180,
      '<defs><radialGradient id="mxCubo"><stop offset="0" stop-color="#fff6e2" stop-opacity=".75"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="halo-lampara" cx="270" cy="320" rx="160" ry="120" fill="url(#mxCubo)"/><ellipse cx="270" cy="330" rx="100" ry="70" fill="url(#mxCubo)"/>' +
      '<defs><linearGradient id="mxCuboF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe6b0"/></linearGradient></defs>' +
      '<path d="M218 290 L308 290 L308 376 L218 376Z" fill="url(#mxCuboF)"/><path d="M218 290 L242 272 L332 272 L308 290Z" fill="#fffdf6"/><path d="M308 290 L332 272 L332 356 L308 376Z" fill="#ffe2a8"/>' +
      '<path d="M218 290 L242 272 L332 272 L332 356 L308 376 L218 376Z" fill="none" stroke="#fff6dc" stroke-width="6" opacity=".7"/>' +
      '<path d="M226 300 L300 300" stroke="#fff" stroke-width="3" opacity=".8"/>', '110 200 320 180');
    // banquito con el mixtape (casete) encima
    var banco = cartel('mx-banco', 340, PISO + 4, -250, 260, 300,
      '<defs><radialGradient id="mxCasHalo"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".8"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="halo-casete" cx="130" cy="96" rx="140" ry="110" fill="url(#mxCasHalo)"/>' +
      '<path d="M40 140 L30 300 M220 140 L230 300 M70 150 L66 290 M190 150 L194 290" stroke="#8a5a32" stroke-width="12" stroke-linecap="round"/><path d="M36 240 H224" stroke="#7a4a28" stroke-width="8"/>' +
      '<path d="M20 124 L240 124 L232 152 L28 152Z" fill="#b07a46"/><path d="M20 124 L240 124 L240 132 L20 132Z" fill="#c8945a"/>' +
      // el casete
      '<g transform="translate(130 96) rotate(-6)"><rect x="-72" y="-44" width="144" height="88" rx="8" fill="#2a2a30"/><rect x="-62" y="-36" width="124" height="54" rx="4" fill="#f4ecd8"/>' +
      '<rect x="-62" y="-36" width="124" height="10" fill="#ff4ab8"/><rect x="-34" y="-14" width="68" height="22" rx="10" fill="#1a1a1e"/>' +

      '<path d="M-50 28 L-40 44 H40 L50 28Z" fill="#3a3a42"/></g>', '0 0 260 300');
    el('span', 'casete-etiqueta', 'mixtape · para ti ♡', banco);
    el('i', 'carrete c1', '', banco);
    el('i', 'carrete c2', '', banco);
    cartel('mx-cubeta', -420, PISO + 4, -150, 170, 200,
      '<path d="M30 60 L140 60 L130 196 L40 196Z" fill="#e8e8ec"/><ellipse cx="85" cy="60" rx="55" ry="14" fill="#f4f2ec"/><ellipse cx="85" cy="62" rx="46" ry="10" fill="#dcd6c4"/>' +
      '<path d="M30 60 C30 0 140 0 140 60" stroke="#8a8a90" stroke-width="5" fill="none"/><path d="M100 60 L150 -10" stroke="#c8322a" stroke-width="12" stroke-linecap="round"/><rect x="140" y="-28" width="26" height="30" fill="#e6d4a8" transform="rotate(34 150 -10)"/>' +
      '<path d="M50 60 V90 M120 60 V110" stroke="#f4f2ec" stroke-width="7" stroke-linecap="round"/>', '-10 -40 190 240');
    cartel('mx-bote', -110, PISO + 4, -160, 110, 130,
      '<rect x="10" y="20" width="90" height="108" rx="6" fill="#d8dce2"/><ellipse cx="55" cy="20" rx="45" ry="10" fill="#f4f4f2"/><rect x="10" y="50" width="90" height="40" fill="#2a6ac8"/><path d="M30 20 V44 M70 20 V60" stroke="#f4f4f2" stroke-width="7" stroke-linecap="round"/>', '0 0 110 130');
    // el chico ya abajo, viendo el corazón terminado (en la mañana)
    var chicoPiso = cartel('mx-chico-piso', 20, PISO + 24, -260, 480, 760, '', '', 1);
    el('div', 'mx-chico-dentro', svg('-240 -736 480 760', chico(false)), chicoPiso);

    // ---------- efectos en 2D (sobre la cámara) ----------
    var polvo = el('div', 'mx-polvo');
    semilla = 99;
    for (i = 0; i < 26; i++) el('i', '', '', polvo).style.cssText = 'left:' + f(rnd(30, 100)) + '%;top:' + f(rnd(10, 90)) + '%;--w:-' + f(rnd(0, 9)) + 's;--x:' + f(rnd(-60, 60)) + 'px;--s:' + f(rnd(.5, 1.5));
    var papeles = el('div', 'mx-papeles');
    for (i = 0; i < 16; i++) {
      el('i', i % 3 ? 'azul' : '', '', papeles).style.cssText = 'top:' + f(rnd(20, 90)) + '%;--d:' + f(rnd(1.6, 2.6)) + 's;--w:' + f(rnd(0, 3)) + 's;--y:' + f(rnd(-50, 30)) + 'vh;--g:' + f(rnd(-400, 400)) + 'deg;--s:' + f(rnd(.6, 1.3));
    }
    var flot = el('div', 'mx-flotantes');
    for (i = 0; i < 14; i++) {
      el('i', i % 2 ? 'azul' : '', '', flot).style.cssText = '--l:' + f(rnd(8, 92)) + '%;--d:' + f(rnd(7, 11)) + 's;--w:-' + f(rnd(0, 10)) + 's;--x:' + f(rnd(-120, 120)) + 'px;--g:' + f(rnd(-260, 260)) + 'deg';
    }
    el('div', 'mx-dia');
    el('div', 'mx-sepia-capa');
    el('div', 'mx-rayones', '<i></i><i></i><i></i>');
    var falla = el('div', 'mx-falla');
    for (i = 0; i < 7; i++) el('i', '', '', falla).style.cssText = 'top:' + f(rnd(0, 95)) + '%;height:' + f(rnd(1, 7)) + '%;--d:' + f(rnd(.2, .5)) + 's;--x:' + f(rnd(-30, 30)) + 'px;--c:' + ['rgba(255,40,80,.35)', 'rgba(40,220,255,.3)', 'rgba(255,255,255,.18)'][i % 3];
    elFalla = falla;
    // película: viñeta y grano (una textura de ruido que tiembla) en una sola capa
    var cg = document.createElement('canvas'), g2;
    cg.width = cg.height = 180;
    g2 = cg.getContext('2d');
    var img = g2.createImageData(180, 180);
    for (i = 0; i < img.data.length; i += 4) { var gv = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = gv; img.data[i + 3] = 22; }
    g2.putImageData(img, 0, 0);
    el('div', 'mx-pelicula').style.setProperty('--ruido', 'url(' + cg.toDataURL('image/png') + ')');
    el('div', 'mx-final');
    // filtro de falla: separa el rojo del azul ("mientes tanto y duele")
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('width', 0); defs.setAttribute('height', 0);
    defs.style.position = 'absolute';
    defs.innerHTML = '<filter id="mxRGB" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/><feOffset in="r" dx="-10" result="r2"/>' +
      '<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb"/><feOffset in="gb" dx="8" result="gb2"/>' +
      '<feBlend in="r2" in2="gb2" mode="screen"/></filter>';
    escena.appendChild(defs);
    elLetrero = el('div', 'mx-letrero');
    el('div', 'mx-creditos', 'alvafro — latin mafia, fred again..');
    elFlash = el('div', 'mx-flash');

    // el teléfono en el piso (frente a la cámara, junto al que duerme)
    var tel = elTel = el('div', 'mx-telefono');
    var cuerpoTel = el('div', 'tel-cuerpo', '', tel);
    var pant = el('div', 'tel-pantalla', '', cuerpoTel);
    el('div', 'tel-bloqueo', '<span class="tel-hora">4:12</span><span class="tel-fecha">hora 31 · mixtape</span><span class="tel-aviso"><b>mixtape_final_v31.wav</b>listo para exportar</span>', pant);
    telLlamada = el('div', 'tel-llamada', '<span class="tel-avatar">♡</span><span class="tel-nombre">tú</span><span class="tel-estado"></span>' +
      '<span class="tel-ondas"><i></i><i></i><i></i></span>' +
      '<svg class="tel-linea" viewBox="0 0 200 40" preserveAspectRatio="none"><path pathLength="1" d="M0 20 H70 L80 20 L86 6 L94 34 L100 20 H200" fill="none" stroke="#7affb0" stroke-width="2.5"/></svg>' +
      '<span class="tel-botones"><i class="colgar"></i><i class="contestar"></i></span>', pant);
    telReloj = telLlamada.querySelector('.tel-estado');
    el('div', 'tel-brillo', '', cuerpoTel);

    medir();
    window.addEventListener('resize', function () { if (activa) medir(); });

    // el mouse (o el dedo) mueve la cámara un poquito: el cuarto en 3D se ve desde otro ángulo
    var pend = false, mx = 0, my = 0;
    function mover(x, y) {
      if (!activa) return;
      mx = x / innerWidth * 2 - 1; my = y / innerHeight * 2 - 1;
      if (pend) return;
      pend = true;
      requestAnimationFrame(function () {
        pend = false;
        raton.style.transform = 'rotateY(' + (mx * 3.2).toFixed(2) + 'deg) rotateX(' + (-my * 2).toFixed(2) + 'deg)';
        elTel.style.translate = (-mx * 16).toFixed(1) + 'px ' + (-my * 9).toFixed(1) + 'px';
      });
    }
    window.addEventListener('mousemove', function (e) { mover(e.clientX, e.clientY); });
    window.addEventListener('touchmove', function (e) { var t = e.touches[0]; mover(t.clientX, t.clientY); }, { passive: true });
  }

  // el escenario mide 1600x900 en pantallas anchas; en otras proporciones crece hacia donde sobra
  // (el cuarto es 3D: en celular se ve más piso y más techo)
  function medir() {
    var w = innerWidth, h = innerHeight, asp = w / h;
    var W = 1100 + 500 * Math.max(0, Math.min(1, (asp - .6) / .9)), k = w / W, H = h / k;
    if (H < 900) { k = h / 900; H = 900; W = w / k; }
    escenario.style.width = W.toFixed(0) + 'px';
    escenario.style.height = H.toFixed(0) + 'px';
    escenario.style.margin = (-H / 2).toFixed(0) + 'px 0 0 ' + (-W / 2).toFixed(0) + 'px';
    escenario.style.transform = 'scale(' + k.toFixed(4) + ')';
    escena.classList.toggle('mx-vertical', asp < .9);
  }

  function flash() {
    elFlash.classList.remove('on');
    void elFlash.offsetWidth;
    elFlash.classList.add('on');
  }

  // ---- ritmo: analizador propio conectado al audio (js/main.js expone la fuente) ----
  var analizador = null, datos = null, prom = 0, golpe = 0, ultimoGolpe = 0;
  function prepararAnalizador() {
    if (analizador || !window.FuenteMusica) return;
    try {
      analizador = window.FuenteMusica.ctx.createAnalyser();
      analizador.fftSize = 1024;
      analizador.smoothingTimeConstant = .15;
      window.FuenteMusica.fuente.connect(analizador);
      datos = new Uint8Array(analizador.frequencyBinCount);
    } catch (e) { analizador = null; }
  }
  // time-lapse: cada cuántos golpes cambia de lugar la gente (0 = quieta)
  function modoLapso(t) {
    if (t >= 208.76) return 0;
    if ((t >= 85.54 && t < 97.47) || (t >= 170.5 && t < 208.76)) return 1;
    if ((t >= 13.5 && t < 67.54) || (t >= 82.9 && t < 111.3) || (t >= 125.16 && t < 164)) return 4;
    return 0;
  }
  var cuadro = 0, cuentaLapso = 0, ultimoCuadroT = 0;
  var POSE_CHICO = ['pega', 'alisa', 'pega', 'baja', 'alisa', 'pega'], ALTO = ['2', '2', '3', '2', '3', '2'];
  function siguienteCuadro() {
    cuadro++;
    escena.dataset.chico = POSE_CHICO[cuadro % 6];
    escena.dataset.alto = ALTO[(cuadro >> 1) % 6];
    escena.dataset.ayudante = cuadro % 3 === 1 ? 'revisa' : 'sube';
    escena.dataset.capucha = (cuadro >> 1) % 2 ? 'parado' : 'agacha';
    escena.dataset.lugar = String(cuadro % 4);
  }
  var velRueda = -1, ultimoTs = 0;
  function bucle(ts) {
    if (!activa) return;
    requestAnimationFrame(bucle);
    var dt = Math.min(.1, (ts - (ultimoTs || ts)) / 1000);
    ultimoTs = ts;
    var t = audio.currentTime, sonando = !audio.paused;
    // golpes del bajo
    prepararAnalizador();
    var nuevo = false;
    if (analizador && sonando) {
      analizador.getByteFrequencyData(datos);
      var e = (datos[1] + datos[2] + datos[3] + datos[4]) / 4;
      prom = prom * .94 + e * .06;
      if (e > prom * 1.12 && e > 150 && ts - ultimoGolpe > 300) { nuevo = true; ultimoGolpe = ts; }
    } else if (sonando && modoLapso(t) && ts - ultimoGolpe > 490) { nuevo = true; ultimoGolpe = ts; }
    if (nuevo) {
      golpe = 1;
      var cada = modoLapso(t);
      if (cada && ++cuentaLapso >= cada) { cuentaLapso = 0; siguienteCuadro(); ultimoCuadroT = t; }
    }
    // si no hay golpes que detectar (silencio, o sin analizador) el time-lapse sigue con el reloj
    var cada2 = modoLapso(t);
    if (sonando && cada2 && t - ultimoCuadroT > cada2 * .62 + .9) { siguienteCuadro(); ultimoCuadroT = t; }
    if (t < ultimoCuadroT) ultimoCuadroT = t;
    golpe *= Math.pow(.02, dt);
    var fuerza = (t >= 170.5 && t < 208.76) ? 1 : (t >= 13.5 && t < 67.54) || (t >= 82.9 && t < 104.5) || (t >= 125 && t < 164) ? .55 : .2;
    if (t < 184) haloRueda.style.opacity = (.55 + golpe * fuerza * .45).toFixed(3);
    pulso.style.transform = 'translateY(' + (golpe * fuerza * 3).toFixed(2) + 'px)';
    // la rueda de la fortuna: velocidad según la parte (1 = una vuelta en 52 s)
    var vel = (t >= 208.76 ? 0 : t >= 184 ? .55 : (t >= 85.54 && t < 97.47) ? 6.5 : (t >= 170.5 && t < 184) ? 3 : 1) * (sonando ? 1 : .3);
    if (!animsRueda.length) {
      animsRueda = elGiro.getAnimations({ subtree: true }).filter(function (x) { return x.animationName === 'mx-gira-rueda'; });
      velRueda = -1;
    }
    if (vel !== velRueda && animsRueda.length) {
      velRueda = vel;
      animsRueda.forEach(function (x) { x.playbackRate = vel; });
    }
    // fotos que se van pegando en el muro (vuelan si acaban de pegarse)
    var n = 0;
    for (var k = 0; k < ranuras.length; k++) if (ranuras[k].t <= t) n++;
    if (n !== llenas) {
      for (k = 0; k < ranuras.length; k++) {
        var r = ranuras[k], on = r.t <= t;
        if (on === r.el.classList.contains('puesta')) continue;
        r.el.classList.toggle('puesta', on);
        r.el.classList.toggle('vuela', on && t - r.t < 1.6 && t - r.t >= 0);
      }
      llenas = n;
    }
  }

  // ---- la escena sigue la letra ----
  var lineas = [];
  (window.LETRA_MIXTAPE_LRC || '').split(/\r?\n/).forEach(function (l) {
    var m = l.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (m) lineas.push({ t: +m[1] * 60 + +m[2], texto: m[3].trim().toLowerCase() });
  });
  var letreroActual = '';
  function reaccionar() {
    if (!activa) return;
    var t = audio.currentTime, x = '';
    for (var i = 0; i < lineas.length; i++) { if (lineas[i].t <= t) x = lineas[i].texto; else break; }
    var e = {
      'inicio': t < 13.5,
      'creditos': t >= 3.5 && t < 11,
      'donde': t >= 18.84 && t < 31.19,
      'entrego': t >= 31.19 && t < 39.79,
      'vuelo3d': t >= 12 && t < 40.6,
      'cassette': t >= 43.09 && t < 50.06,
      'nuestro': t >= 50.06 && t < 57.16,
      'tira-on': t >= 50.06,
      'sepia': t >= 57.16 && t < 67.54,
      'mientes': t >= 67.54 && t < 82.9,
      'escucho': /escucho/.test(x),
      'roto': t >= 67.54 && t < 167,
      'rompe': t >= 67.54 && t < 70,
      'hyper': t >= 85.54 && t < 97.47,
      'olvido': t >= 104.5 && t < 111.3,
      'cicatriz': t >= 107.54 && t < 168.5,
      'aqui1': t >= 111.3,
      'aqui2': t >= 118.37,
      'juntos': t >= 125.16,
      'completo': t >= 132.18,
      'tel': (t >= 139.17 && t < 153.6) || (t >= 159.6 && t < 167.4) || (t >= 187.3 && t < 196.53),
      'tel-luz': t >= 139.17 && t < 146.33,
      'tel-llama': t >= 146.33 && t < 153.2,
      'tel-nadie': t >= 150.8 && t < 153.2,
      'tel-entra': t >= 160.13 && t < 163.6,
      'tel-habla': (t >= 163.6 && t < 167) || (t >= 187.96 && t < 196.53),
      'tel-latido': t >= 192.48 && t < 196.53,
      'kintsugi': t >= 167,
      'dora': t >= 167 && t < 170.5,
      'c1': t >= 160, 'c2': t >= 170.52, 'c3': t >= 173.93, 'c4': t >= 177.44, 'c5': t >= 184.31, 'c6': t >= 196.53, 'c7': t >= 208.76,
      'climax': t >= 170.5 && t < 208.76,
      'rayos': t >= 184.31,
      'flotan': t >= 196.53 && t < 208.76,
      'manana': t >= 208.76,
      'fin': t >= 222.57,
      'blanco': t >= 235
    };
    ESTADOS.forEach(function (c) { escena.classList.toggle('mx-' + c, !!e[c]); });
    // tomas de cámara
    var tm = e.inicio ? 'inicio' : e.cassette ? 'cassette' : e.nuestro ? 'nuestro' : e.hyper ? 'ventana' : (t >= 139.17 && t < 167) ? 'tel' :
      (t >= 196.53 && t < 222.57) ? 'sol' : e.fin ? 'fin' : '';
    toma.className = 'mx-toma' + (tm ? ' toma-' + tm : '');
    // momentos de una sola vez
    if (e.entrego && !antes.entrego) flash();
    if (e.mientes && !antes.mientes) flash();
    if (e.kintsugi && antes.kintsugi === false) flash();
    if (e.c6 && antes.c6 === false) flash();
    // letreros de video casero ("hour 31 of finishing our mixtape, mexico city")
    var txt = '';
    LETREROS.forEach(function (L) { if (t >= L[0] && t < L[1]) txt = L[2]; });
    if (txt !== letreroActual) {
      letreroActual = txt;
      elLetrero.classList.remove('on');
      if (txt) { elLetrero.textContent = txt; void elLetrero.offsetWidth; elLetrero.classList.add('on'); }
    }
    // el teléfono: lo que dice la pantalla
    if (e['tel-llama']) telReloj.textContent = e['tel-nadie'] ? 'sin respuesta' : 'llamando…';
    else if (e['tel-entra']) telReloj.textContent = 'te está llamando';
    else if (e['tel-habla']) {
      var desde = t >= 187.96 ? 187.96 : 163.6, s = Math.max(0, t - desde) | 0;
      telReloj.textContent = '0:' + (s < 10 ? '0' : '') + s + ' · …';
    }
    // sin el time-lapse la gente queda en su lugar de siempre (y en la mañana, dormida)
    if (!modoLapso(t) && escena.dataset.chico !== (e.manana ? 'mira' : 'pega')) {
      escena.dataset.chico = e.manana ? 'mira' : 'pega';
      escena.dataset.alto = '2';
      escena.dataset.ayudante = 'sube';
      escena.dataset.capucha = 'agacha';
      escena.dataset.lugar = '0';
    }
    antes = e;
  }
  audio.addEventListener('timeupdate', reaccionar);
  audio.addEventListener('seeked', function () { llenas = -1; });

  window.Escenas = window.Escenas || {};
  window.Escenas.mixtape = {
    el: escena,
    activar: function () {
      if (!construida) construir();
      else medir();
      activa = true;
      window.SUB_ESPECIAL = SUBS;
      antes = {};
      llenas = -1;
      escena.dataset.chico = 'pega'; escena.dataset.alto = '2'; escena.dataset.ayudante = 'sube'; escena.dataset.capucha = 'agacha'; escena.dataset.lugar = '0';
      reaccionar();
      ultimoTs = 0;
      requestAnimationFrame(bucle);
    },
    desactivar: function () {
      activa = false;
      if (window.SUB_ESPECIAL === SUBS) window.SUB_ESPECIAL = null;
    }
  };
})();
