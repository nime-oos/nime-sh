// Escena "Every breath you take" (The Police): cine negro de los años 40 con un solo color, el rojo.
// Como en el video de The Police (blanco y negro, contrabajo, el ventanal enorme con el limpiavidrios), pero el que
// toca el contrabajo es Jason con su máscara de hockey, frente a un ventanal que da al lago Crystal Lake de noche.
// Todo es gris de película vieja (grano, parpadeo, rayones); lo único a color es el rojo: las marcas de la máscara,
// la rosa del bolsillo, el corazón, la luz en forma de corazón, las cartas y los pétalos.
// "I'll be watching you": la máscara sigue al mouse (o al dedo), la luna se vuelve un ojo y hay ojos en la oscuridad.
// La mano puntea el contrabajo al tempo de la canción (117.25 por minuto, medido del audio; no usa analizador).
// Para que no se trabe: cada dibujo es una imagen SVG que se pinta una sola vez; lo que se mueve son capas enteras
// (transform/opacity). Lo único que se repinta en cada cuadro es el iris del final (cuatro segundos).
(function () {
  var escena = document.getElementById('escena-police');
  var audio = document.getElementById('bg-music');
  if (!escena || !audio) return;
  var SUBS = { letras: true, traduccion: true, claves: /^(watching|heart|belong|face|embrace|crying|baby|please)$/ };
  var ESTADOS = ['lider', 'titulo', 'foco', 'enciende', 'corazon', 'aliento', 'pasos', 'mira', 'calendario', 'notas', 'cartas',
    'ojos', 'rosa', 'late', 'grieta', 'sonrisa', 'luna-ojo', 'pupila-corazon', 'apagon', 'sueno', 'busca', 'frio', 'llora',
    'lluvia', 'vaho', 'dibuja', 'baile', 'pianista', 'limpiador', 'camara', 'reflectores', 'final', 'arriba', 'petalos',
    'fin', 'cam-mascara', 'cam-luna', 'cam-lejos'];
  // tiempo de los golpes: negras a 117.25 por minuto, la primera en 0.217 s (no se desfasa en toda la canción)
  var T0 = .217, NEGRA = 60 / 117.25;
  var ROJO = '#d0142c', NS = 'http://www.w3.org/2000/svg';

  var construida = false, activa = false, antes = {};
  var mundo, gJason, gCabeza, elAntebrazo, elBrillos, elPupila, elOjoLuna, elCono, elPianista, elBaquetas, elIris,
    elFlash, elLiderNum, elLiderMano;

  // ---------------------------------------------------------------- utilidades
  var semilla = 1;
  function rnd(a, b) { semilla = (semilla * 9301 + 49297) % 233280; return a + semilla / 233280 * (b - a); }
  function f(n) { return String(Math.round(n * 10) / 10); }
  function el(tag, clase, html, padre) {
    var e = document.createElement(tag);
    e.className = clase;
    if (html) e.innerHTML = html;
    (padre || escena).appendChild(e);
    return e;
  }
  function imagen(vb, contenido) {
    return URL.createObjectURL(new Blob(['<svg xmlns="' + NS + '" viewBox="' + vb + '" preserveAspectRatio="none">' + contenido + '</svg>'], { type: 'image/svg+xml' }));
  }
  function ubicar(d, bb) { d.style.cssText += ';--x:' + bb[0] + ';--y:' + bb[1] + ';--w:' + bb[2] + ';--h:' + bb[3]; return d; }
  // una capa: una imagen SVG en coordenadas del mundo (1600x900) dentro de su caja bb = [x, y, ancho, alto]
  function capa(clase, bb, contenido, padre, vb) {
    var d = ubicar(el('div', 'pl-capa ' + clase, '', padre), bb);
    var im = document.createElement('img');
    im.alt = '';
    im.decoding = 'async';
    im.src = typeof contenido === 'string' && /^blob:/.test(contenido) ? contenido : imagen(vb || bb.join(' '), contenido);
    d.appendChild(im);
    return d;
  }
  // curva suave (Catmull-Rom) que pasa por los puntos, como path de Bézier
  function suave(pts, cerrada) {
    var n = pts.length, d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    function P(i) { return cerrada ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; }
    for (var i = 0, segs = cerrada ? n : n - 1; i < segs; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + (cerrada ? 'Z' : '');
  }
  function forma(pts, relleno, extra) { return '<path d="' + suave(pts, true) + '" fill="' + relleno + '"' + (extra || '') + '/>'; }
  function linea(pts, color, ancho, extra) {
    return '<path d="' + suave(pts, false) + '" fill="none" stroke="' + color + '" stroke-width="' + ancho + '" stroke-linecap="round"' + (extra || '') + '/>';
  }
  function poli(pts, relleno, extra) {
    return '<path d="M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z" fill="' + relleno + '"' + (extra || '') + '/>';
  }
  function corazonD(cx, cy, w, h) {
    var x = cx - w / 2, y = cy - h / 2;
    return 'M' + f(cx) + ' ' + f(y + h) +
      'C' + f(x + w * .1) + ' ' + f(y + h * .72) + ' ' + f(x) + ' ' + f(y + h * .5) + ' ' + f(x) + ' ' + f(y + h * .28) +
      'C' + f(x) + ' ' + f(y + h * .08) + ' ' + f(x + w * .16) + ' ' + f(y) + ' ' + f(x + w * .28) + ' ' + f(y) +
      'C' + f(x + w * .4) + ' ' + f(y) + ' ' + f(cx) + ' ' + f(y + h * .1) + ' ' + f(cx) + ' ' + f(y + h * .22) +
      'C' + f(cx) + ' ' + f(y + h * .1) + ' ' + f(x + w * .6) + ' ' + f(y) + ' ' + f(x + w * .72) + ' ' + f(y) +
      'C' + f(x + w * .84) + ' ' + f(y) + ' ' + f(x + w) + ' ' + f(y + h * .08) + ' ' + f(x + w) + ' ' + f(y + h * .28) +
      'C' + f(x + w) + ' ' + f(y + h * .5) + ' ' + f(x + w * .9) + ' ' + f(y + h * .72) + ' ' + f(cx) + ' ' + f(y + h) + 'Z';
  }
  function grad(id, x1, y1, x2, y2, stops) {
    return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>';
  }
  function radial(id, cx, cy, r, stops, extra) {
    return '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + (extra || '') + '>' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>';
  }

  // ---------------------------------------------------------------- afuera: cielo, luna y el lago (Crystal Lake)
  var LUNA = [1040, 215, 68];
  var VENTANA = [180, 30, 1240, 570];

  function cielo() {
    var s = '<defs>' + grad('c', 0, 20, 0, 420, [[0, '#141416'], [.5, '#2f2f33'], [.85, '#55555a'], [1, '#6e6e73']]) +
      radial('h', LUNA[0], LUNA[1], 330, [[0, '#fff', .42], [.25, '#fff', .16], [.6, '#fff', .05], [1, '#fff', 0]]) +
      radial('m', LUNA[0] - 18, LUNA[1] - 20, 92, [[0, '#fdfcf8'], [.65, '#ece9e1'], [1, '#cdc9bf']]) +
      grad('n', 0, 0, 1, 0, [[0, '#9a9aa0', 0], [.5, '#9a9aa0', .5], [1, '#9a9aa0', 0]]).replace('gradientUnits="userSpaceOnUse" ', '') + '</defs>' +
      '<rect x="160" y="0" width="1280" height="430" fill="url(#c)"/>';
    semilla = 7;
    for (var i = 0; i < 120; i++) {
      var x = rnd(185, 1415), y = rnd(34, 360);
      if (Math.hypot(x - LUNA[0], y - LUNA[1]) < 125) continue;
      var r = rnd(.5, 1.7);
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="#f4f2ec" opacity="' + f(rnd(.35, .95)) + '"/>';
      if (r > 1.5) s += '<path d="M' + f(x - 6) + ' ' + f(y) + 'H' + f(x + 6) + 'M' + f(x) + ' ' + f(y - 6) + 'V' + f(y + 6) + '" stroke="#f4f2ec" stroke-width=".7" opacity=".55"/>';
    }
    s += '<rect x="160" y="0" width="1280" height="430" fill="url(#h)"/>';
    // nubes delgadas
    [[300, 92, 380, 14], [520, 64, 260, 9], [1250, 112, 300, 12], [1320, 262, 200, 8], [760, 286, 420, 10]].forEach(function (n) {
      s += '<ellipse cx="' + n[0] + '" cy="' + n[1] + '" rx="' + n[2] / 2 + '" ry="' + n[3] + '" fill="url(#n)" opacity=".55"/>' +
        '<ellipse cx="' + (n[0] + 10) + '" cy="' + (n[1] - n[3] * .4) + '" rx="' + n[2] * .38 + '" ry="' + n[3] * .35 + '" fill="#c8c8cc" opacity=".18"/>';
    });
    // la luna llena
    s += '<circle cx="' + LUNA[0] + '" cy="' + LUNA[1] + '" r="' + LUNA[2] + '" fill="url(#m)"/>';
    [[-22, -18, 14], [18, -26, 9], [24, 12, 17], [-14, 24, 10], [-34, 8, 7], [4, -2, 6], [34, -6, 6]].forEach(function (c) {
      s += '<circle cx="' + (LUNA[0] + c[0]) + '" cy="' + (LUNA[1] + c[1]) + '" r="' + c[2] + '" fill="#cfcbc1" opacity=".55"/>';
    });
    return s;
  }
  // un pino: puntas en capas, más ancho hacia abajo
  function pino(x, base, alto, ancho) {
    var der = [], izq = [], capas = Math.max(4, Math.round(alto / 14)), arriba = base - alto;
    for (var k = 1; k <= capas; k++) {
      var y = arriba + alto * k / capas * .9, w = ancho * .5 * (.25 + .75 * k / capas);
      der.push([x + w * rnd(.85, 1.1), y], [x + w * .35, y + alto / capas * .12]);
      izq.unshift([x - w * .35, y + alto / capas * .12], [x - w * rnd(.85, 1.1), y]);
    }
    return [[x, arriba]].concat(der, [[x + ancho * .08, base + 4], [x - ancho * .08, base + 4]], izq);
  }
  function lago() {
    var s = '<defs>' + grad('l', 0, 405, 0, 620, [[0, '#46464b'], [.25, '#2c2c30'], [1, '#141416']]) +
      radial('v', 347, 386, 16, [[0, '#f3edd2', .7], [1, '#f3edd2', 0]]) + '</defs>';
    // cerros lejanos
    s += '<path d="M160 398 C260 372 330 384 420 376 C520 366 600 388 700 380 C820 370 900 392 1020 382 C1140 372 1240 390 1340 378 L1440 384 V430 H160Z" fill="#26262a"/>';
    // el lago
    s += '<rect x="160" y="404" width="1280" height="220" fill="url(#l)"/>';
    semilla = 12;
    for (var i = 0; i < 70; i++) {
      var y = rnd(410, 600), x = rnd(170, 1400), w = rnd(20, 120) * (y - 380) / 120;
      s += '<path d="M' + f(x) + ' ' + f(y) + 'h' + f(w) + '" stroke="#bfbfc4" stroke-width="' + f(rnd(.8, 1.6)) + '" opacity="' + f(rnd(.04, .12)) + '"/>';
    }
    // la orilla con pinos (más altos hacia las orillas de la ventana)
    semilla = 21;
    var pinos = '';
    for (var x = 165; x < 1440; x += rnd(9, 22)) {
      var orilla = Math.min(1, Math.abs(x - 800) / 620), alto = rnd(26, 58) + orilla * rnd(10, 46);
      pinos += poli(pino(x, 408 + rnd(-3, 4), alto, alto * rnd(.36, .48)), '#0d0d0f');
    }
    s += pinos + '<path d="M160 404 H1440 V412 H160Z" fill="#0d0d0f"/>';
    // la cabaña del campamento con su ventana prendida (y su reflejo)
    s += '<rect x="330" y="372" width="56" height="30" fill="#111113"/><path d="M322 374 L358 352 L394 374Z" fill="#111113"/>' +
      '<rect x="342" y="382" width="11" height="9" fill="#f3edd2"/><circle cx="347" cy="386" r="16" fill="url(#v)"/>' +
      '<path d="M347 410 V470" stroke="#f3edd2" stroke-width="5" opacity=".18"/><path d="M344 420h7M342 436h10M345 452h6" stroke="#f3edd2" stroke-width="2" opacity=".35"/>';
    // el muelle de madera
    s += '<path d="M150 624 L392 624 L330 488 L292 488Z" fill="#232220"/>';
    for (var k = 0; k < 14; k++) {
      var t = k / 13, y2 = 488 + (624 - 488) * t * t * .4 + (624 - 488) * t * .6, xa = 292 - (292 - 150) * (y2 - 488) / 136, xb = 330 + (392 - 330) * (y2 - 488) / 136;
      s += '<path d="M' + f(xa) + ' ' + f(y2) + 'H' + f(xb) + '" stroke="#5a5854" stroke-width="' + f(.8 + t * 1.6) + '" opacity=".7"/>';
    }
    s += '<path d="M292 488 L150 624 M330 488 L392 624" stroke="#77756f" stroke-width="2" opacity=".6"/>' +
      '<path d="M296 488 v26 M326 488 v26 M234 546 v40 M360 552 v40" stroke="#141413" stroke-width="5"/>' +
      '<path d="M380 532 C392 546 430 546 444 532 C430 540 394 540 380 532Z" fill="#141413" stroke="#5a5854" stroke-width="1.2"/>';
    // el letrero del campamento
    s += '<g transform="rotate(-3 1320 470)"><path d="M1262 470 V540 M1376 470 V540" stroke="#141413" stroke-width="7"/>' +
      '<rect x="1240" y="440" width="160" height="46" rx="3" fill="#2b2926" stroke="#5f5c56" stroke-width="2"/>' +
      '<text x="1320" y="459" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="14" font-weight="700" fill="#d8d4ca" letter-spacing="2">CAMP</text>' +
      '<text x="1320" y="478" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="13" font-weight="700" fill="#d8d4ca" letter-spacing="1">CRYSTAL LAKE</text></g>';
    return s;
  }
  // el reflejo de la luna en el agua (dos cuadros que se alternan: brilla)
  function reflejo(k) {
    semilla = 40 + k * 17;
    var s = '';
    for (var y = 414; y < 618; y += rnd(5, 10)) {
      var t = (y - 410) / 210, w = rnd(10, 46) * (1 - t * .3) + t * 30;
      s += '<path d="M' + f(LUNA[0] - w / 2 + rnd(-8, 8)) + ' ' + f(y) + 'h' + f(w) + '" stroke="#f3f1ea" stroke-width="' + f(1.5 + t * 2.4) + '" stroke-linecap="round" opacity="' + f((1 - t * .75) * rnd(.45, .95)) + '"/>';
    }
    return s;
  }

  // ---------------------------------------------------------------- el cuarto: pared con el ventanal, cortinas y piso
  function pared() {
    var V = VENTANA, x0 = V[0], y0 = V[1], x1 = V[0] + V[2], y1 = V[1] + V[3];
    var s = '<defs>' + grad('p', 0, -300, 0, 646, [[0, '#060607'], [.5, '#111113'], [1, '#0d0d0e']]) +
      radial('e', 800, 330, 980, [[0, '#fff', .07], [1, '#fff', 0]]) +
      grad('c1', 0, -300, 0, 646, [[0, '#18181a'], [.55, '#202023'], [1, '#121214']]) + '</defs>' +
      '<path d="M-400 -300 H2000 V646 H-400Z M' + x0 + ' ' + y0 + ' V' + y1 + ' H' + x1 + ' V' + y0 + 'Z" fill="url(#p)" fill-rule="evenodd"/>';
    for (var x = -400; x < 2000; x += 46) {
      if (x > x0 - 30 && x < x1 + 10) { s += '<path d="M' + x + ' -300 V' + (y0 - 18) + '" stroke="#fff" stroke-width="10" opacity=".018"/>'; continue; }
      s += '<path d="M' + x + ' -300 V646" stroke="#fff" stroke-width="10" opacity=".018"/>';
    }
    s += '<path d="M-400 470 H' + (x0 - 16) + ' M' + (x1 + 16) + ' 470 H2000" stroke="#2a2a2d" stroke-width="7"/>' +
      '<rect x="-400" y="-300" width="2400" height="946" fill="url(#e)"/>';
    // marco de fierro del ventanal y sus barrotes (la luna los ilumina del lado derecho)
    s += '<path d="M' + (x0 - 16) + ' ' + (y0 - 16) + ' H' + (x1 + 16) + ' V' + (y1 + 4) + ' H' + (x0 - 16) + 'Z M' + x0 + ' ' + y0 + ' V' + y1 + ' H' + x1 + ' V' + y0 + 'Z" fill="#1f1f22" fill-rule="evenodd"/>' +
      '<path d="M' + x0 + ' ' + y1 + ' V' + y0 + ' H' + x1 + '" stroke="#4c4c52" stroke-width="2" fill="none"/>';
    [428, 676, 924, 1172].forEach(function (bx) {
      s += '<rect x="' + (bx - 6) + '" y="' + y0 + '" width="12" height="' + V[3] + '" fill="#1b1b1e"/><path d="M' + (bx + 5) + ' ' + y0 + ' V' + y1 + '" stroke="#5a5a60" stroke-width="1.6"/>';
    });
    s += '<rect x="' + x0 + '" y="309" width="' + V[2] + '" height="12" fill="#1b1b1e"/><path d="M' + x0 + ' 309.8 H' + x1 + '" stroke="#5a5a60" stroke-width="1.6"/>';
    // repisa
    s += '<rect x="156" y="598" width="1288" height="24" fill="#2a2a2d"/><path d="M156 599.5 H1444" stroke="#7a7a80" stroke-width="2.4"/>' +
      '<rect x="156" y="622" width="1288" height="10" fill="#000" opacity=".5"/>';
    // cortinas de terciopelo recogidas
    function cortina(sx) {
      function X(x) { return sx > 0 ? x : 1600 - x; }
      var c = '<path d="M' + X(10) + ' -300 H' + X(252) + ' C' + X(248) + ' 40 ' + X(214) + ' 250 ' + X(160) + ' 380 C' + X(190) + ' 470 ' + X(226) + ' 560 ' + X(238) + ' 646 H' + X(10) + 'Z" fill="url(#c1)"/>';
      for (var i = 0; i < 7; i++) {
        var a = 22 + i * 33, b = 34 + i * 18, d = 22 + i * 32;
        c += linea([[X(a), -300], [X(a + (b - a) * .4), 120], [X(b), 380], [X(d), 646]], '#36363a', 9, ' opacity=".55"') +
          linea([[X(a + 12), -300], [X(a + 12 + (b - a) * .4), 120], [X(b + 6), 380], [X(d + 14), 646]], '#050506', 7, ' opacity=".7"');
      }
      // el cordón que la recoge (abraza la cortina) y su borla
      c += '<path d="M' + X(14) + ' 372 C' + X(60) + ' 386 ' + X(120) + ' 390 ' + X(160) + ' 380" stroke="#4a4a50" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + X(14) + ' 370 C' + X(60) + ' 383 ' + X(120) + ' 387 ' + X(160) + ' 377" stroke="#8a8a90" stroke-width="1.6" fill="none"/>' +
        '<path d="M' + X(156) + ' 382 C' + X(160) + ' 396 ' + X(158) + ' 404 ' + X(162) + ' 412" stroke="#4a4a50" stroke-width="3" fill="none"/>' +
        '<path d="M' + X(154) + ' 410 h16 l-2 24 h-12Z" fill="#3e3e44"/><path d="M' + X(157) + ' 414 v18 M' + X(162) + ' 414 v18 M' + X(167) + ' 414 v18" stroke="#6a6a70" stroke-width="1"/>';
      return c;
    }
    s += cortina(1) + cortina(-1);
    s += '<rect x="-400" y="632" width="2400" height="14" fill="#18181a"/><path d="M-400 632.6 H2000" stroke="#3c3c40" stroke-width="1.6"/>';
    return s;
  }
  function piso() {
    var s = '<defs>' + grad('f', 0, 640, 0, 1160, [[0, '#22211f'], [.45, '#141312'], [1, '#080808']]) +
      grad('r', 0, 646, 0, 760, [[0, '#fff', .07], [1, '#fff', 0]]) + '</defs>' +
      '<rect x="-400" y="640" width="2400" height="520" fill="url(#f)"/>';
    // tablas que se juntan al fondo
    for (var xb = -2600; xb <= 4200; xb += 104) {
      var xa = 800 + (xb - 800) * (646 - 380) / (1160 - 380);
      s += '<path d="M' + f(xa) + ' 646 L' + xb + ' 1160" stroke="#000" stroke-width="2.2" opacity=".5"/>' +
        '<path d="M' + f(xa + 1.5) + ' 646 L' + (xb + 4) + ' 1160" stroke="#4a4844" stroke-width="1" opacity=".22"/>';
    }
    semilla = 30;
    for (var i = 0; i < 70; i++) {
      var y = rnd(650, 1150), xx = rnd(-300, 1900), w = 40 * (y - 380) / 400;
      s += '<path d="M' + f(xx) + ' ' + f(y) + 'h' + f(w) + '" stroke="#000" stroke-width="1.6" opacity=".45"/>';
    }
    // la luz de la luna entra por el ventanal y dibuja los cuadros en el piso
    var cols = [[186, 422], [434, 670], [682, 918], [930, 1166], [1178, 1414]];
    cols.forEach(function (c) {
      [[650, 708, .05], [716, 820, .07]].forEach(function (r) {
        var sk = .55, a = r[0] - 646, b = r[1] - 646;
        s += poli([[c[0] - a * sk, r[0]], [c[1] - a * sk, r[0]], [c[1] - b * sk - 30, r[1]], [c[0] - b * sk - 30, r[1]]], '#fff', ' opacity="' + r[2] + '"');
      });
    });
    s += '<rect x="180" y="646" width="1240" height="114" fill="url(#r)"/>';
    return s;
  }
  // el piano de cola (de lado, con la tapa abierta) y el pianista, a contraluz del ventanal
  function piano() {
    var s = '<defs>' + grad('t', 0, 470, 0, 640, [[0, '#2a2a2e'], [1, '#09090a']]) + '</defs>';
    s += '<path d="M190 690 V800 M470 690 V796 M330 690 V770" stroke="#08080a" stroke-width="16"/>' +
      '<path d="M222 690 L232 772 H252 L262 690" fill="#0a0a0b"/><path d="M226 772 h32" stroke="#2c2c30" stroke-width="5"/>';
    // la tapa abierta y su palo
    s += poli([[196, 638], [512, 638], [500, 468], [450, 452], [236, 588]], 'url(#t)') +
      '<path d="M236 588 L450 452 L500 468" stroke="#9a9aa0" stroke-width="2.4" fill="none" stroke-linejoin="round"/>' +
      '<path d="M400 640 L436 500" stroke="#7a7a80" stroke-width="3"/>';
    // la caja
    s += '<path d="M170 636 H500 C530 636 548 652 546 670 C544 688 528 694 506 694 H170Z" fill="#0b0b0c"/>' +
      '<path d="M170 637 H500 C530 637 546 652 546 668" stroke="#8a8a90" stroke-width="2.2" fill="none"/>' +
      '<path d="M190 660 H520" stroke="#fff" stroke-width="5" opacity=".07"/>' +
      '<rect x="150" y="628" width="44" height="10" fill="#c9c5bc"/><path d="M156 628 v6 M164 628 v6 M176 628 v6 M184 628 v6" stroke="#111" stroke-width="3"/>' +
      '<path d="M176 626 L186 600 L196 600 L188 628Z" fill="#141416" stroke="#5a5a60" stroke-width="1.2"/>';
    // el banco
    s += '<rect x="74" y="700" width="78" height="12" fill="#0b0b0c"/><path d="M82 712 V790 M144 712 V790" stroke="#0b0b0c" stroke-width="6"/>';
    return s;
  }
  function pianista() {
    var s = '';
    s += forma([[96, 702], [92, 650], [98, 612], [114, 596], [138, 598], [150, 620], [148, 668], [140, 704]], '#0b0b0c') +
      forma([[118, 590], [114, 572], [120, 556], [134, 552], [146, 560], [149, 574], [146, 588], [134, 594]], '#0b0b0c') +
      '<path d="M116 566 C118 552 134 546 146 556" stroke="#2a2a2e" stroke-width="6" fill="none"/>' +
      '<path d="M148 572 l5 4 l-5 2" fill="#0b0b0c"/>' +
      linea([[140, 612], [160, 634], [170, 630]], '#0b0b0c', 15) +
      linea([[134, 604], [150, 626], [176, 628]], '#0b0b0c', 13) +
      '<path d="M140 704 H182 L186 776" stroke="#0b0b0c" stroke-width="20" fill="none" stroke-linejoin="round"/>' +
      linea([[146, 556], [150, 572], [146, 590]], '#7a7a80', 1.6, ' opacity=".7"') +
      linea([[138, 598], [150, 620], [148, 664]], '#7a7a80', 1.4, ' opacity=".5"');
    return s;
  }
  // la batería y el baterista (silueta), con platillos que brillan
  function bateria() {
    var s = '<defs>' + radial('b', 1318, 704, 80, [[0, '#cfcbc2'], [.75, '#a8a49b'], [1, '#77746e']]) +
      grad('pl', 0, 0, 1, 0, [[0, '#4a4a4e'], [.5, '#bdbdc2'], [1, '#4a4a4e']]).replace('gradientUnits="userSpaceOnUse" ', '') + '</defs>';
    // el baterista detrás
    s += forma([[1282, 650], [1288, 584], [1306, 562], [1356, 562], [1376, 586], [1382, 650]], '#0b0b0c') +
      '<circle cx="1332" cy="536" r="21" fill="#0b0b0c"/><path d="M1312 528 C1316 512 1346 510 1354 528" stroke="#2c2c30" stroke-width="5" fill="none"/>' +
      linea([[1352, 520], [1355, 538], [1350, 552]], '#7a7a80', 1.4, ' opacity=".6"');
    // atriles y platillos
    s += '<path d="M1188 604 V800 M1472 562 V800 M1176 800 l12 -14 l12 14 M1460 800 l12 -14 l12 14" stroke="#4a4a4e" stroke-width="3" fill="none"/>' +
      '<ellipse cx="1188" cy="604" rx="44" ry="7" fill="url(#pl)"/><ellipse cx="1188" cy="611" rx="44" ry="6" fill="url(#pl)" opacity=".8"/>' +
      '<g transform="rotate(-10 1472 560)"><ellipse cx="1472" cy="560" rx="64" ry="9" fill="url(#pl)"/><path d="M1420 558 Q1472 548 1524 558" stroke="#f2f2f4" stroke-width="1.6" fill="none" opacity=".8"/></g>';
    // tambores
    s += '<path d="M1194 664 V690 C1194 698 1258 698 1258 690 V664" fill="#151517"/><ellipse cx="1226" cy="664" rx="32" ry="9" fill="#c4c0b8"/>' +
      '<path d="M1226 696 V800 M1212 800 l14 -16 l14 16" stroke="#4a4a4e" stroke-width="3" fill="none"/>' +
      '<path d="M1268 606 V638 C1268 646 1332 646 1332 638 V606" fill="#151517"/><ellipse cx="1300" cy="606" rx="32" ry="9" fill="#c4c0b8"/>' +
      '<path d="M1406 690 V770 C1406 780 1480 780 1480 770 V690" fill="#151517"/><ellipse cx="1443" cy="690" rx="37" ry="11" fill="#c4c0b8"/>' +
      '<path d="M1412 772 L1408 806 M1474 772 L1478 806" stroke="#4a4a4e" stroke-width="3"/>';
    // el bombo de frente: aro, parche claro y un 13 de viernes
    s += '<circle cx="1318" cy="716" r="80" fill="#121214"/><circle cx="1318" cy="716" r="70" fill="url(#b)"/>' +
      '<circle cx="1318" cy="716" r="74" fill="none" stroke="#3a3a3e" stroke-width="6"/>' +
      '<path d="M1252 690 A74 74 0 0 1 1300 644" stroke="#e8e8ec" stroke-width="2" fill="none" opacity=".7"/>' +
      '<circle cx="1318" cy="716" r="34" fill="none" stroke="#1a1a1c" stroke-width="3"/>' +
      '<text x="1318" y="732" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="44" font-weight="700" fill="#1a1a1c">13</text>' +
      '<path d="M1262 790 L1250 806 M1374 790 L1386 806" stroke="#4a4a4e" stroke-width="4"/>';
    return s;
  }
  // las baquetas: dos cuadros que se alternan con cada golpe
  function baquetas(k) {
    var a = k ? [[1300, 590], [1238, 652]] : [[1300, 590], [1250, 560]], b = k ? [[1362, 590], [1388, 548]] : [[1362, 590], [1300, 600]];
    return linea([[1290, 590], a[0], a[1]], '#0b0b0c', 11) + linea([[1372, 590], b[0], b[1]], '#0b0b0c', 11) +
      '<path d="M' + a[1][0] + ' ' + a[1][1] + ' l' + (k ? -26 : -30) + ' ' + (k ? 14 : -26) + '" stroke="#bdb9b0" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + b[1][0] + ' ' + b[1][1] + ' l' + (k ? 18 : -36) + ' ' + (k ? -28 : 10) + '" stroke="#bdb9b0" stroke-width="3" stroke-linecap="round"/>';
  }

  // ---------------------------------------------------------------- el contrabajo (de pie, un poco inclinado hacia él)
  var BAJO = { x: 905, y: 880, giro: -7 };
  function aMundo(x, y) {
    var a = BAJO.giro * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [BAJO.x + x * c - y * s, BAJO.y + x * s + y * c];
  }
  var CUERPO_BAJO = (function () {
    var R = [[0, -34], [48, -38], [92, -54], [120, -84], [134, -122], [134, -160], [126, -196], [112, -226], [104, -240], [92, -247],
      [84, -266], [84, -292], [92, -310], [104, -318], [108, -336], [104, -360], [92, -386], [70, -408], [44, -426], [26, -440]];
    return R.concat(R.slice(1).reverse().map(function (p) { return [-p[0], p[1]]; }));
  })();
  function contrabajo() {
    var s = '<defs>' + radial('w', -24, -240, 240, [[0, '#7a756c'], [.45, '#4d4943'], [.8, '#27241f'], [1, '#141311']]) +
      grad('cu', -20, 0, 20, 0, [[0, '#2e2a26'], [.4, '#6a645b'], [1, '#2a2723']]) +
      grad('ce', 0, -120, 0, -60, [[0, '#fff', .7], [1, '#fff', 0]]) + '</defs>' +
      '<g transform="translate(' + BAJO.x + ' ' + BAJO.y + ') rotate(' + BAJO.giro + ')">';
    // pica
    s += '<path d="M0 -36 V-2" stroke="#a8a8ac" stroke-width="4"/><circle cx="0" cy="-1" r="4" fill="#1c1c1e"/>';
    // mástil, clavijero y voluta (detrás del diapasón)
    s += poli([[-13, -656], [17, -656], [22, -452], [30, -436], [-30, -436], [-20, -452]], 'url(#cu)') +
      poli([[-13, -652], [13, -652], [15, -706], [-13, -706]], '#3a3632') + '<path d="M0 -652 V-702" stroke="#0a0a0a" stroke-width="7"/>' +
      '<path d="M-14 -668 h-12 M-14 -690 h-12 M14 -668 h12 M14 -690 h12" stroke="#8d8a83" stroke-width="5"/>' +
      '<ellipse cx="-30" cy="-668" rx="6" ry="4" fill="#bdb9b0"/><ellipse cx="-30" cy="-690" rx="6" ry="4" fill="#bdb9b0"/>' +
      '<ellipse cx="30" cy="-668" rx="6" ry="4" fill="#bdb9b0"/><ellipse cx="30" cy="-690" rx="6" ry="4" fill="#bdb9b0"/>' +
      '<circle cx="0" cy="-718" r="15" fill="#4a453f"/><path d="M0 -718 m-9 0 a9 9 0 1 1 9 9 a6 6 0 1 1 -5 -6 a3 3 0 1 1 3 3" stroke="#151412" stroke-width="2.4" fill="none"/>' +
      '<path d="M-13 -706 C-16 -716 -12 -728 -2 -732" stroke="#9a948a" stroke-width="2" fill="none" opacity=".8"/>';
    // la caja: madera barnizada con brillos fuertes en las orillas
    s += '<path d="' + suave(CUERPO_BAJO, true) + '" fill="url(#w)" stroke="#0b0a09" stroke-width="5"/>' +
      '<path d="' + suave(CUERPO_BAJO.map(function (p) { return [p[0] * .95, -235 + (p[1] + 235) * .965]; }), true) + '" fill="none" stroke="#a49d92" stroke-width="1.4" opacity=".35"/>' +
      linea([[-118, -78], [-131, -118], [-133, -160], [-124, -198]], '#fff', 12, ' opacity=".12"') +
      linea([[-118, -78], [-131, -118], [-133, -160], [-124, -198]], '#fff', 3.6, ' opacity=".6"') +
      linea([[108, -66], [126, -104], [131, -148]], '#fff', 3.4, ' opacity=".7"') +
      linea([[-98, -326], [-104, -352], [-90, -384], [-66, -408]], '#fff', 3, ' opacity=".55"') +
      linea([[100, -330], [100, -358]], '#fff', 2.6, ' opacity=".45"') +
      '<ellipse cx="-34" cy="-110" rx="40" ry="66" fill="#fff" opacity=".07"/><ellipse cx="-24" cy="-338" rx="30" ry="40" fill="#fff" opacity=".08"/>';
    // efes
    [-1, 1].forEach(function (k) {
      var x = 57 * k;
      s += '<path d="M' + (x - 2 * k) + ' -212 C' + (x + 10 * k) + ' -200 ' + (x - 6 * k) + ' -186 ' + x + ' -170 C' + (x + 8 * k) + ' -154 ' + (x - 10 * k) + ' -140 ' + (x + 1 * k) + ' -126" stroke="#050505" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="' + (x - 2 * k) + '" cy="-214" r="5.5" fill="#050505"/><circle cx="' + (x + 1 * k) + '" cy="-124" r="5.5" fill="#050505"/>' +
        '<path d="M' + (x - 7) + ' -170 h14" stroke="#050505" stroke-width="2"/>';
    });
    // cordal
    s += '<path d="M-22 -112 L22 -112 L10 -50 L-10 -50Z" fill="#0d0d0d"/><path d="M-22 -112 L-10 -50" stroke="#6a6a6a" stroke-width="1.6"/><path d="M0 -50 V-36" stroke="#2a2a2a" stroke-width="3"/>';
    // diapasón
    s += '<path d="M-11 -652 L11 -652 L24 -256 Q0 -248 -24 -256Z" fill="#0b0b0b"/><path d="M-11 -652 L-24 -256" stroke="#5c5c5c" stroke-width="1.6" opacity=".8"/>' +
      '<rect x="-12" y="-655" width="24" height="5" fill="#d8d4cc"/>' +
      linea([[-12, -640], [-18, -470]], '#fff', 2, ' opacity=".3"');
    // puente (con su corazoncito calado)
    s += '<path d="M-40 -146 L-28 -146 L-20 -160 L20 -160 L28 -146 L40 -146 L33 -172 L28 -190 Q0 -197 -28 -190 L-33 -172Z" fill="#8f877a" stroke="#3a352e" stroke-width="1.2"/>' +
      '<path d="M-28 -190 Q0 -197 28 -190" stroke="#d6cfc2" stroke-width="1.6" fill="none"/>' +
      '<path d="' + corazonD(0, -176, 12, 11) + '" fill="#2a2622"/><ellipse cx="-19" cy="-168" rx="5" ry="3" fill="#2a2622"/><ellipse cx="19" cy="-168" rx="5" ry="3" fill="#2a2622"/>';
    // cuerdas
    var tx = [-15, -5, 5, 15], bx = [-24, -8, 8, 24], nx = [-8, -2.7, 2.7, 8], an = [2.4, 2.1, 1.8, 1.5];
    for (var i = 0; i < 4; i++) {
      var d = 'M' + tx[i] + ' -110 L' + bx[i] + ' -194 L' + nx[i] + ' -652';
      s += '<path d="' + d + '" stroke="#000" stroke-width="' + an[i] + '" fill="none" opacity=".55" transform="translate(1.6 0)"/>' +
        '<path d="' + d + '" stroke="#e2ded5" stroke-width="' + an[i] + '" fill="none"/>';
    }
    return s + '</g>';
  }

  // ---------------------------------------------------------------- él: Jason (camisa de trabajo, a contraluz)
  var MASCARA_BB = [706, 207, 92, 118];
  function cuerpo() {
    var s = '<defs>' + grad('cm', 0, 340, 0, 600, [[0, '#3a3a3d'], [.3, '#222224'], [1, '#121214']]) +
      radial('sp', 700, 360, 90, [[0, '#fff', .2], [1, '#fff', 0]]) + '</defs>';
    // sombra en el piso
    s += '<ellipse cx="790" cy="884" rx="170" ry="30" fill="#000" opacity=".55"/>';
    // piernas y botas
    s += poli([[690, 590], [756, 590], [748, 862], [700, 862]], '#141415') + poli([[750, 590], [834, 590], [814, 862], [762, 862]], '#121213') +
      '<path d="M722 610 L718 856 M792 610 L788 856" stroke="#2a2a2c" stroke-width="2" opacity=".7"/>' +
      forma([[694, 856], [746, 856], [752, 874], [748, 888], [684, 888], [682, 874]], '#0a0a0b') +
      forma([[764, 856], [814, 856], [822, 874], [818, 888], [758, 888], [756, 872]], '#0a0a0b') +
      '<path d="M690 876 h40 M762 876 h40" stroke="#4a4a4e" stroke-width="2" opacity=".6"/>';
    // cuello
    s += poli([[732, 312], [772, 312], [778, 354], [726, 354]], '#101011');
    // brazo del mástil (arriba, detrás del contrabajo)
    s += forma([[846, 360], [884, 368], [934, 400], [972, 436], [994, 462], [988, 490], [962, 492], [928, 464], [890, 434], [854, 410]], 'url(#cm)') +
      linea([[884, 370], [934, 400], [972, 436], [994, 460]], '#9a9aa0', 2, ' opacity=".4"');
    // torso
    var T = [[724, 342], [700, 346], [676, 354], [660, 368], [652, 388], [654, 420], [664, 456], [670, 500], [676, 548], [684, 594],
      [836, 594], [842, 548], [846, 500], [852, 456], [862, 420], [866, 388], [858, 368], [842, 354], [818, 346], [786, 342]];
    s += forma(T, 'url(#cm)') + '<ellipse cx="700" cy="368" rx="70" ry="40" fill="url(#sp)"/><ellipse cx="826" cy="366" rx="50" ry="26" fill="url(#sp)"/>';
    // cuello de la camisa, la V y la playera de abajo
    s += poli([[736, 346], [768, 346], [752, 394]], '#08080a') +
      forma([[738, 344], [712, 350], [716, 372], [730, 388], [744, 368]], '#3c3c3f') + forma([[766, 344], [792, 350], [788, 372], [774, 388], [760, 368]], '#36363a') +
      linea([[712, 350], [716, 372], [730, 388]], '#8a8a90', 1.4, ' opacity=".6"');
    // botones, bolsillos con cartera y cinturón
    s += '<path d="M752 394 V592" stroke="#101011" stroke-width="2.4"/>';
    [424, 470, 516, 562].forEach(function (y) { s += '<circle cx="755" cy="' + y + '" r="3.2" fill="#8a8a8e"/>'; });
    [[690, 736], [770, 816]].forEach(function (p) {
      s += '<path d="M' + p[0] + ' 404 H' + p[1] + ' V462 Q' + ((p[0] + p[1]) / 2) + ' 468 ' + p[0] + ' 462Z" fill="#000" opacity=".16"/>' +
        '<path d="M' + p[0] + ' 404 H' + p[1] + ' V462 Q' + ((p[0] + p[1]) / 2) + ' 468 ' + p[0] + ' 462Z" fill="none" stroke="#0e0e0f" stroke-width="2"/>' +
        poli([[p[0] - 1, 400], [p[1] + 1, 400], [p[1], 416], [(p[0] + p[1]) / 2, 424], [p[0], 416]], '#3a3a3d', ' stroke="#0e0e0f" stroke-width="1.6"') +
        '<circle cx="' + ((p[0] + p[1]) / 2) + '" cy="416" r="2.8" fill="#8a8a8e"/>';
    });
    s += linea([[690, 492], [712, 500], [736, 496]], '#0b0b0c', 3, ' opacity=".7"') + linea([[778, 504], [804, 510], [826, 502]], '#0b0b0c', 3, ' opacity=".7"') +
      linea([[684, 552], [716, 560], [744, 556]], '#0b0b0c', 3, ' opacity=".6"');
    s += '<rect x="682" y="586" width="156" height="14" fill="#0b0b0c"/><rect x="742" y="584" width="22" height="18" fill="none" stroke="#7a7a80" stroke-width="2.4"/>';
    // brazo del punteo (arriba, del hombro al codo)
    s += forma([[662, 366], [646, 380], [640, 412], [642, 452], [648, 492], [658, 524], [676, 540], [700, 534], [706, 506], [700, 470], [694, 430], [690, 396]], 'url(#cm)') +
      linea([[652, 498], [672, 510], [696, 506]], '#0b0b0c', 3, ' opacity=".8"') + linea([[648, 470], [668, 480], [692, 474]], '#0b0b0c', 2.4, ' opacity=".6"');
    // luz de contorno (la luna y el reflector)
    s += linea([[720, 343], [690, 348], [664, 362], [648, 384], [642, 420], [644, 460]], '#a6a6ac', 2.4, ' opacity=".45"') +
      linea([[790, 343], [820, 347], [846, 357], [862, 372]], '#a6a6ac', 2, ' opacity=".4"');
    return s;
  }
  // la cabeza detrás de la máscara (oscura, con luz de contorno)
  function nuca() {
    return '<ellipse cx="752" cy="262" rx="51" ry="66" fill="#0b0b0c"/>' +
      linea([[714, 214], [736, 200], [766, 199], [792, 214]], '#7a7a80', 2.6, ' opacity=".55"') +
      linea([[800, 236], [804, 262], [800, 290]], '#5a5a60', 2, ' opacity=".45"');
  }
  // la máscara de hockey: blanca, con agujeritos, las marcas rojas y el golpe de hacha arriba
  function mascara() {
    var C = [[100, 6], [134, 9], [162, 22], [181, 46], [191, 80], [192, 112], [187, 146], [176, 178], [160, 205], [138, 228], [116, 242],
      [100, 246], [84, 242], [62, 228], [40, 205], [24, 178], [13, 146], [8, 112], [9, 80], [19, 46], [38, 22], [66, 9]];
    var s = '<defs>' + radial('g', 94, 88, 178, [[0, '#fdfcf8'], [.5, '#eeeae1'], [.82, '#c9c3b7'], [1, '#a39d91']]) +
      grad('d', 0, 140, 0, 248, [[0, '#4a453c', 0], [1, '#4a453c', .4]]) + radial('rj', 100, 30, 40, [[0, '#ff4a5a'], [.6, ROJO], [1, '#8e0c1c']]) + '</defs>';
    s += '<rect x="2" y="72" width="10" height="18" fill="#1a1a1a"/><rect x="188" y="72" width="10" height="18" fill="#1a1a1a"/>' +
      '<rect x="8" y="150" width="10" height="16" fill="#1a1a1a"/><rect x="182" y="150" width="10" height="16" fill="#1a1a1a"/>';
    s += forma(C, 'url(#g)', ' stroke="#7a7468" stroke-width="2.5"') + forma(C, 'url(#d)');
    // cejas, nariz y pómulos (relieve)
    s += linea([[30, 84], [50, 72], [74, 68], [92, 78]], '#b5afa3', 8, ' opacity=".55"') + linea([[170, 84], [150, 72], [126, 68], [108, 78]], '#b5afa3', 8, ' opacity=".55"') +
      linea([[100, 92], [97, 120], [98, 150]], '#fff', 9, ' opacity=".7"') +
      linea([[90, 104], [86, 128], [88, 154]], '#a8a296', 5, ' opacity=".45"') + linea([[110, 104], [114, 128], [112, 154]], '#a8a296', 5, ' opacity=".45"') +
      '<ellipse cx="100" cy="156" rx="15" ry="8" fill="#e2ddd2"/>' +
      linea([[40, 150], [56, 168], [74, 172]], '#b2ac9f', 4, ' opacity=".35"') + linea([[160, 150], [144, 168], [126, 172]], '#b2ac9f', 4, ' opacity=".35"');
    // ojos
    s += '<path d="M38 106 C44 90 62 82 80 86 C88 88 92 96 91 106 C88 116 74 120 60 119 C48 118 40 113 38 106Z" fill="#050505" stroke="#7d776c" stroke-width="3"/>' +
      '<path d="M162 106 C156 90 138 82 120 86 C112 88 108 96 109 106 C112 116 126 120 140 119 C152 118 160 113 162 106Z" fill="#050505" stroke="#7d776c" stroke-width="3"/>';
    // agujeros para respirar
    [[58, 48], [72, 38], [128, 38], [142, 48], [46, 62], [154, 62], [93, 160], [107, 160], [40, 166], [52, 182], [160, 166], [148, 182],
      [76, 182], [88, 186], [100, 188], [112, 186], [124, 182], [82, 200], [94, 203], [106, 203], [118, 200], [90, 217], [100, 219], [110, 217], [100, 233]].forEach(function (h, i) {
      s += '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="' + (i === 6 || i === 7 ? 3.8 : 4.4) + '" fill="#0a0a0a" stroke="#8d877c" stroke-width="1.2"/>';
    });
    // las marcas rojas (lo único a color)
    s += '<path d="M84 22 L116 22 L100 56Z" fill="url(#rj)" stroke="' + ROJO + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M24 120 L54 126 L38 152Z" fill="' + ROJO + '" stroke="' + ROJO + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M176 120 L146 126 L162 152Z" fill="' + ROJO + '" stroke="' + ROJO + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M90 26 L104 26" stroke="#ff8a94" stroke-width="2" opacity=".7"/>';
    // el golpe de hacha y unos rayones
    s += '<path d="M103 6 L114 7 L111 22 L104 21Z" fill="#2a2722"/>' +
      '<path d="M136 196 l14 -10 M60 60 l10 6 M150 140 l-8 14 M30 100 l4 12" stroke="#8d877c" stroke-width="1.2" opacity=".6"/>';
    return s;
  }
  // antebrazo y mano del punteo (gira desde el codo con cada corchea)
  var ANTEBRAZO_BB = [660, 480, 230, 180];
  function antebrazo() {
    var s = '<defs>' + grad('mn', 0, 584, 0, 646, [[0, '#c4bfb7'], [1, '#77726b']]) + grad('cm2', 0, 500, 0, 620, [[0, '#2e2e31'], [1, '#18181a']]) + '</defs>';
    s += forma([[676, 506], [700, 498], [740, 528], [780, 562], [808, 582], [802, 614], [774, 604], [734, 578], [694, 556], [672, 540]], 'url(#cm2)') +
      linea([[700, 500], [740, 529], [780, 562], [806, 582]], '#8a8a90', 2, ' opacity=".5"') +
      linea([[728, 548], [740, 570]], '#0b0b0c', 2.4, ' opacity=".7"') +
      poli([[786, 572], [812, 584], [804, 618], [778, 606]], '#3c3c3f', ' stroke="#0e0e0f" stroke-width="1.4"');
    // la mano: dorso, pulgar sobre la orilla del diapasón, índice y medio pulsando
    s += forma([[806, 584], [828, 588], [848, 598], [858, 614], [854, 630], [836, 634], [816, 626], [802, 614]], 'url(#mn)') +
      forma([[830, 592], [852, 584], [868, 582], [874, 588], [858, 596], [838, 602]], '#b3aea6') +
      forma([[846, 604], [864, 612], [874, 626], [868, 632], [856, 624], [846, 616]], '#a8a39b') +
      forma([[850, 616], [868, 628], [878, 642], [870, 648], [858, 638], [848, 628]], '#9d988f') +
      forma([[836, 628], [848, 636], [844, 644], [832, 638]], '#8a857d') +
      linea([[852, 614], [866, 624]], '#5e5a55', 1.2) + linea([[834, 606], [852, 600], [866, 590]], '#e2ddd5', 1.4, ' opacity=".6"');
    return s;
  }
  // antebrazo y mano del mástil (delante del contrabajo): los dedos cruzan el diapasón
  function brazoMastil() {
    var s = '<defs>' + grad('mn', 0, 388, 0, 446, [[0, '#c9c4bc'], [1, '#7a756e']]) + grad('cm3', 0, 410, 0, 496, [[0, '#2e2e31'], [1, '#18181a']]) + '</defs>';
    s += forma([[958, 448], [990, 460], [986, 492], [956, 482], [918, 456], [888, 442], [882, 414], [906, 414], [936, 430]], 'url(#cm3)') +
      linea([[906, 414], [936, 430], [962, 448], [990, 460]], '#9a9aa0', 2, ' opacity=".45"') +
      poli([[880, 410], [902, 414], [900, 446], [882, 444]], '#3c3c3f', ' stroke="#0e0e0f" stroke-width="1.4"');
    s += forma([[862, 394], [884, 398], [896, 414], [892, 440], [874, 448], [862, 434]], 'url(#mn)');
    [[392, 1], [404, .96], [416, .92], [428, .86]].forEach(function (d, i) {
      var y = d[0], x0 = 870, x1 = 870 - 34 * d[1];
      s += forma([[x0, y - 5], [x1 + 6, y - 6], [x1, y - 1], [x1 + 2, y + 5], [x0, y + 6]], i % 2 ? '#a7a29a' : '#b4afa7') +
        linea([[x1 + 4, y - 4], [x0 - 4, y - 5]], '#e2ddd5', 1.2, ' opacity=".5"');
    });
    return s + linea([[868, 396], [872, 444]], '#5e5a55', 1.4, ' opacity=".7"');
  }
  // la rosa del bolsillo (aparece en "you belong to me" y ya no se va)
  function rosa() {
    return '<path d="M30 40 L27 60" stroke="#3a3d36" stroke-width="3"/>' +
      '<path d="M28 44 C16 40 7 46 3 55 C14 57 22 53 28 44Z" fill="#5a5f55"/><path d="M28 44 C20 47 12 51 6 54" stroke="#33362f" stroke-width="1" fill="none"/>' +
      '<path d="M31 44 C42 38 52 42 57 51 C47 55 37 53 31 44Z" fill="#4a4e45"/><path d="M31 44 C40 46 48 48 54 50" stroke="#2c2f29" stroke-width="1" fill="none"/>' +
      '<path d="M13 26 C11 13 22 5 30 7 C41 5 51 14 47 28 C45 38 37 45 30 45 C21 45 15 37 13 26Z" fill="#8e0d1c"/>' +
      '<path d="M17 24 C17 14 26 9 32 11 C41 11 45 20 43 28 C41 36 34 40 29 39 C22 38 17 31 17 24Z" fill="#c0122a"/>' +
      '<path d="M22 22 C23 15 30 13 34 15 C39 18 38 26 32 29 C27 31 23 27 22 22Z" fill="#e3203a"/>' +
      '<path d="M27 21 C28 17 33 17 34 21 C34 25 30 26 28 24" fill="none" stroke="#7a0a16" stroke-width="1.6"/>' +
      '<path d="M15 22 C19 31 26 35 35 34" fill="none" stroke="#6e0913" stroke-width="1.4" opacity=".7"/>' +
      '<path d="M19 13 C24 9 30 8 35 10" fill="none" stroke="#ff6a78" stroke-width="1.8" opacity=".85"/>';
  }
  // su cara en la luna ("I can only see your face"): un camafeo de perfil
  // (dibujado para una luna en 1010,150; se traslada a donde esté LUNA)
  function camafeo() {
    return '<defs><clipPath id="k"><circle cx="1010" cy="150" r="' + (LUNA[2] - 3) + '"/></clipPath></defs>' +
      '<g transform="translate(' + (LUNA[0] - 1010) + ' ' + (LUNA[1] - 150) + ')"><g clip-path="url(#k)" opacity=".78">' +
      forma([[1008, 96], [1036, 90], [1060, 104], [1072, 128], [1070, 156], [1074, 182], [1064, 204], [1050, 196], [1046, 176], [1040, 160], [1034, 140], [1016, 118]], '#4a4640') +
      '<path d="M1003 104 C996 110 994 118 992 124 C990 130 984 134 982 138 C984 141 988 141 990 142 C988 145 987 147 989 149 C991 150 990 152 988 154 C990 157 993 158 994 160 C992 164 993 168 998 172 C1003 176 1006 180 1007 190 L1009 232 L1080 232 L1068 204 C1056 196 1048 184 1046 172 C1044 160 1040 150 1036 140 L1020 108 Z" fill="#4a4640"/>' +
      '<path d="M995 121 l6 -1" stroke="#2a2724" stroke-width="1.6"/>' +
      linea([[1040, 104], [1054, 120], [1056, 140], [1062, 160], [1060, 182]], '#6e6a62', 2, ' opacity=".6"') +
      '<circle cx="1046" cy="108" r="6" fill="' + ROJO + '"/><circle cx="1040" cy="104" r="4" fill="#b0102a"/><circle cx="1050" cy="102" r="3.4" fill="#e3203a"/></g></g>';
  }
  // el limpiavidrios del video, colgado afuera de la ventana en su tabla
  function limpiador() {
    var s = '<path d="M940 -700 V556 M1112 -700 V556" stroke="#2a2a2e" stroke-width="3"/>' +
      '<rect x="928" y="554" width="196" height="12" fill="#0d0d0f"/><path d="M928 555 H1124" stroke="#6a6a70" stroke-width="1.6"/>' +
      '<path d="M1078 566 L1074 540 H1104 L1100 566Z" fill="#0d0d0f"/><path d="M1074 540 C1080 524 1098 524 1104 540" stroke="#3a3a3e" stroke-width="2" fill="none"/>';
    s += forma([[1004, 554], [1000, 500], [1004, 470], [1032, 470], [1036, 500], [1034, 554]], '#0d0d0f') +
      forma([[998, 474], [996, 430], [1004, 410], [1034, 410], [1042, 430], [1040, 474]], '#0d0d0f') +
      '<circle cx="1019" cy="394" r="15" fill="#0d0d0f"/><path d="M1002 388 C1004 374 1034 372 1038 388 L1048 390 L1002 392Z" fill="#0d0d0f"/>' +
      linea([[1006, 420], [990, 450], [992, 470]], '#0d0d0f', 10) + linea([[992, 470], [944, 500]], '#0d0d0f', 8) +
      linea([[1034, 380], [1036, 396], [1032, 410]], '#6a6a70', 1.6, ' opacity=".6"') + linea([[1040, 430], [1042, 470]], '#6a6a70', 1.4, ' opacity=".5"');
    return s;
  }
  function limpiadorBrazo() {
    return linea([[1032, 418], [1056, 436], [1070, 418]], '#0d0d0f', 10) +
      '<path d="M1070 418 L1110 360" stroke="#3a3a3e" stroke-width="4"/><path d="M1086 346 L1134 374" stroke="#1a1a1c" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M1086 346 L1134 374" stroke="#8a8a90" stroke-width="1.4" opacity=".6"/>';
  }
  // vidrio: gotas, escarcha y la grieta
  function gotas() {
    semilla = 77;
    var s = '';
    for (var i = 0; i < 220; i++) {
      var x = rnd(185, 1415), y = rnd(35, 595), r = rnd(1.2, 4.2);
      s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(r * .8) + '" ry="' + f(r) + '" fill="#d9d9de" opacity=".22"/>' +
        '<circle cx="' + f(x - r * .25) + '" cy="' + f(y - r * .35) + '" r="' + f(r * .3) + '" fill="#fff" opacity=".7"/>';
      if (r > 3.6) s += '<path d="M' + f(x) + ' ' + f(y + r) + 'v' + f(rnd(10, 40)) + '" stroke="#d9d9de" stroke-width="' + f(r * .5) + '" opacity=".18"/>';
    }
    return s;
  }
  function escarcha() {
    semilla = 91;
    var s = '';
    function rama(x, y, ang, largo, n) {
      if (n <= 0 || largo < 3) return;
      var x2 = x + Math.cos(ang) * largo, y2 = y + Math.sin(ang) * largo;
      s += '<path d="M' + f(x) + ' ' + f(y) + 'L' + f(x2) + ' ' + f(y2) + '" stroke="#eef0f4" stroke-width="' + f(.5 + n * .35) + '" opacity="' + f(.25 + n * .1) + '"/>';
      rama(x2, y2, ang + rnd(-.3, .3), largo * .78, n - 1);
      if (rnd(0, 1) < .7) rama(x + (x2 - x) * .5, y + (y2 - y) * .5, ang + rnd(.6, 1.1), largo * .5, n - 2);
      if (rnd(0, 1) < .7) rama(x + (x2 - x) * .5, y + (y2 - y) * .5, ang - rnd(.6, 1.1), largo * .5, n - 2);
    }
    var xs = [180, 428, 676, 924, 1172, 1420], ys = [30, 315, 600];
    xs.forEach(function (x) {
      ys.forEach(function (y) {
        for (var k = 0; k < 4; k++) {
          var hacia = Math.atan2(315 - y, 800 - x) + rnd(-1, 1);
          rama(x + rnd(-6, 6), y + rnd(-6, 6), hacia, rnd(18, 34), 5);
        }
      });
    });
    return s + '<path d="M180 30 H1420 V600 H180Z M206 56 V574 H1394 V56Z" fill="#e8eaee" fill-rule="evenodd" opacity=".12"/>';
  }
  function grieta() {
    semilla = 64;
    var cx = 586, cy = 196, s = '';
    for (var i = 0; i < 9; i++) {
      var a = i / 9 * Math.PI * 2 + rnd(-.2, .2), x = cx, y = cy, d = 'M' + cx + ' ' + cy, largo = rnd(60, 110);
      for (var k = 1; k <= 4; k++) { x = cx + Math.cos(a + rnd(-.15, .15)) * largo * k / 4; y = cy + Math.sin(a + rnd(-.15, .15)) * largo * k / 4; d += 'L' + f(x) + ' ' + f(y); }
      s += '<path d="' + d + '" stroke="#000" stroke-width="2.6" fill="none" opacity=".5" transform="translate(1 1)"/><path d="' + d + '" stroke="#f4f4f6" stroke-width="1.4" fill="none" opacity=".85"/>';
    }
    [26, 54].forEach(function (r, j) {
      var d = '';
      for (var k = 0; k <= 9; k++) {
        var a = k / 9 * Math.PI * 2, rr = r * rnd(.85, 1.15);
        d += (k ? 'L' : 'M') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr);
      }
      s += '<path d="' + d + '" stroke="#f4f4f6" stroke-width="' + (1.2 - j * .3) + '" fill="none" opacity=".7"/>';
    });
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#fff" opacity=".8"/>';
  }

  // ---------------------------------------------------------------- luz: el reflector (blanco o rojo de corazón)
  var FUENTE = [770, -80];
  function cono(color, fuerza) {
    var s = '<defs>' + grad('k', 0, -80, 0, 890, [[0, color, .9 * fuerza], [.5, color, .45 * fuerza], [1, color, .28 * fuerza]]) + '</defs>';
    [[1, .2], [.84, .26], [.66, .3], [.46, .34]].forEach(function (c) {
      var ab = 238 * c[0], ar = 14 * c[0];
      s += poli([[FUENTE[0] - ar, FUENTE[1]], [FUENTE[0] + ar, FUENTE[1]], [FUENTE[0] + ab, 886], [FUENTE[0] - ab, 886]], 'url(#k)', ' opacity="' + c[1] + '"');
    });
    return s;
  }
  function charco() {
    return '<defs>' + radial('q', 770, 880, 260, [[0, '#fff', .55], [.55, '#fff', .2], [1, '#fff', 0]], ' gradientTransform="translate(0 669) scale(1 .24)"') + '</defs>' +
      '<ellipse cx="770" cy="880" rx="270" ry="64" fill="url(#q)"/>';
  }
  function charcoCorazon() {
    return '<defs>' + radial('q', 770, 860, 230, [[0, '#ff4a5a', .75], [.6, ROJO, .45], [1, ROJO, 0]]) + '</defs>' +
      '<g transform="translate(0 600) scale(1 .3)"><path d="' + corazonD(770, 880, 470, 430) + '" fill="url(#q)"/></g>';
  }
  function lampara() {
    return '<path d="M770 -420 V-210 M716 -210 H824 M716 -210 V-150 M824 -210 V-150" stroke="#1c1c1e" stroke-width="8" fill="none"/>' +
      '<path d="M722 -196 L818 -196 L828 -96 L712 -96Z" fill="#141416"/><path d="M722 -196 L712 -96" stroke="#5a5a60" stroke-width="2"/>' +
      '<path d="M716 -170 H824 M714 -146 H826 M713 -122 H827" stroke="#050506" stroke-width="3"/>' +
      '<ellipse cx="770" cy="-92" rx="58" ry="11" fill="#f6f4ee"/><ellipse cx="770" cy="-92" rx="90" ry="26" fill="#fff" opacity=".15"/>';
  }
  function reflectorExterior() {
    return '<defs>' + grad('k', 0, 600, 0, 0, [[0, '#fff', .42], [.6, '#fff', .12], [1, '#fff', 0]]) + '</defs>' +
      '<path d="M44 600 L56 600 L100 0 L0 0Z" fill="url(#k)"/>';
  }
  function huella() {
    return '<ellipse cx="15" cy="22" rx="11" ry="20" fill="#ece8de"/><ellipse cx="15" cy="57" rx="9" ry="10" fill="#ece8de"/>';
  }
  function nota(k) {
    if (k) return '<path d="M8 40 V10 L34 4 V34" stroke="#efede7" stroke-width="3" fill="none"/><path d="M8 10 L34 4 V11 L8 17Z" fill="#efede7"/>' +
      '<ellipse cx="4" cy="41" rx="7" ry="5" transform="rotate(-22 4 41)" fill="#efede7"/><ellipse cx="30" cy="35" rx="7" ry="5" transform="rotate(-22 30 35)" fill="#efede7"/>';
    return '<path d="M14 40 V4 C20 12 30 14 28 26" stroke="#efede7" stroke-width="3" fill="none"/><ellipse cx="9" cy="41" rx="8" ry="5.6" transform="rotate(-22 9 41)" fill="#efede7"/>';
  }
  function petalo() {
    return '<defs>' + radial('p', 12, 10, 20, [[0, '#ff4d5e'], [.6, ROJO], [1, '#7e0a18']]) + '</defs>' +
      '<path d="M12 2 C22 6 24 18 16 26 C12 30 6 28 4 22 C1 14 4 4 12 2Z" fill="url(#p)"/><path d="M12 6 C10 12 10 18 12 24" stroke="#ff8a96" stroke-width="1" opacity=".6" fill="none"/>';
  }

  // ---------------------------------------------------------------- armar la escena
  function grano() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var cx = cv.getContext('2d');
    semilla = 5;
    for (var i = 0; i < 5200; i++) {
      cx.fillStyle = rnd(0, 1) < .5 ? 'rgba(0,0,0,' + f(rnd(.25, .6)) + ')' : 'rgba(255,255,255,' + f(rnd(.2, .5)) + ')';
      cx.fillRect(rnd(0, 256), rnd(0, 256), rnd(.6, 1.8), rnd(.6, 1.8));
    }
    return cv.toDataURL();
  }
  function lluviaTile() {
    semilla = 13;
    var s = '';
    for (var i = 0; i < 16; i++) {
      var x = rnd(0, 160), y = rnd(0, 260), l = rnd(26, 60);
      s += '<path d="M' + f(x) + ' ' + f(y) + 'l' + f(-l * .12) + ' ' + f(l) + '" stroke="#e6e6ea" stroke-width="' + f(rnd(.7, 1.5)) + '" opacity="' + f(rnd(.25, .55)) + '"/>';
      if (y + l > 260) s += '<path d="M' + f(x) + ' ' + f(y - 260) + 'l' + f(-l * .12) + ' ' + f(l) + '" stroke="#e6e6ea" stroke-width="1" opacity=".4"/>';
    }
    return imagen('0 0 160 260', s);
  }

  function construir() {
    construida = true;
    mundo = el('div', 'pl-mundo');
    var cam = el('div', 'pl-camara', '', mundo), tiembla = el('div', 'pl-tiembla', '', cam);

    // afuera, recortado por el ventanal
    var vent = ubicar(el('div', 'pl-ventana', '', tiembla), VENTANA), afuera = el('div', 'pl-ventana-in', '', vent);
    capa('pl-cielo', [160, 0, 1280, 430], cielo(), afuera);
    ubicar(el('div', 'pl-halo-luna', '', afuera), [LUNA[0] - 200, LUNA[1] - 200, 400, 400]);
    var urlRef = imagen('0 0 100 600', reflectorExterior()), refl = el('div', 'pl-reflectores', '', afuera);
    [[300, 1, -22], [760, 2, 14], [1240, 3, -8]].forEach(function (r) {
      var d = capa('pl-reflector pl-r' + r[1], [r[0] - 60, -150, 120, 570], urlRef, refl);
      d.style.setProperty('--g', r[2] + 'deg');
    });
    var ojoLuna = ubicar(el('div', 'pl-luna-ojo', '<i class="pl-luna-iris"><b class="pl-luna-pupila"><em></em></b></i><svg viewBox="0 0 140 140" aria-hidden="true">' +
      '<path d="M8 70 Q70 18 132 70" stroke="#2e2c28" stroke-width="3.5" fill="none"/><path d="M8 70 Q70 122 132 70" stroke="#2e2c28" stroke-width="2.5" fill="none"/>' +
      '<path d="M22 56 l-8 -8 M40 44 l-5 -10 M60 38 l-2 -11 M80 38 l2 -11 M100 44 l5 -10 M118 56 l8 -8" stroke="#2e2c28" stroke-width="2.4" stroke-linecap="round"/></svg>', afuera), [LUNA[0] - 70, LUNA[1] - 70, 140, 140]);
    elOjoLuna = ojoLuna;
    elPupila = ojoLuna.querySelector('.pl-luna-iris');
    capa('pl-camafeo', [LUNA[0] - 70, LUNA[1] - 70, 140, 152], camafeo(), afuera, (LUNA[0] - 70) + ' ' + (LUNA[1] - 70) + ' 140 152');
    capa('pl-lago', [160, 330, 1280, 300], lago(), afuera);
    var reflejoEl = el('div', 'pl-reflejo', '', afuera);
    capa('pl-ref-a', [LUNA[0] - 70, 404, 140, 220], reflejo(0), reflejoEl);
    capa('pl-ref-b', [LUNA[0] - 70, 404, 140, 220], reflejo(1), reflejoEl);
    ubicar(el('div', 'pl-bruma pl-bruma1', '', afuera), [160, 380, 2560, 90]);
    ubicar(el('div', 'pl-bruma pl-bruma2', '', afuera), [160, 500, 2560, 110]);
    var ojosFuera = el('div', 'pl-ojos pl-ojos-fuera', '', afuera);
    var limp = el('div', 'pl-limpiador', '', afuera);
    capa('pl-limpiador-cuerpo', [920, -700, 220, 1280], limpiador(), limp);
    capa('pl-limpiador-brazo', [1020, 330, 130, 110], limpiadorBrazo(), limp);
    capa('pl-gotas', VENTANA, gotas(), afuera);
    var urlLluvia = lluviaTile();
    ['pl-lluvia1', 'pl-lluvia2'].forEach(function (c) {
      var d = ubicar(el('div', 'pl-lluvia ' + c, '', afuera), [180, 30 - 260, 1240, 570 + 260]);
      d.style.backgroundImage = 'url(' + urlLluvia + ')';
    });
    var vaho = ubicar(el('div', 'pl-vaho', '', afuera), VENTANA);
    vaho.innerHTML = '<svg viewBox="180 30 1240 570" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="pl-vaho-cor" pathLength="1" d="' + corazonD(LUNA[0] - 8, LUNA[1] + 10, 170, 160) + '" stroke="#0e0e10" stroke-width="9" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '<path class="pl-vaho-gota" d="M' + (LUNA[0] - 75) + ' ' + (LUNA[1] + 10) + 'v26M' + (LUNA[0] + 76) + ' ' + (LUNA[1] + 12) + 'v34M' + LUNA[0] + ' ' + (LUNA[1] + 102) + 'v30M' + (LUNA[0] - 40) + ' ' + (LUNA[1] + 64) + 'v18" stroke="#0e0e10" stroke-width="3" opacity=".45" stroke-linecap="round"/></svg>';
    capa('pl-escarcha', VENTANA, escarcha(), afuera);
    capa('pl-grieta', [480, 90, 220, 220], grieta(), afuera);
    ubicar(el('div', 'pl-relampago', '', afuera), VENTANA);

    // el cuarto
    capa('pl-pared', [-400, -300, 2400, 946], pared(), tiembla);
    capa('pl-piso', [-400, 640, 2400, 520], piso(), tiembla);
    capa('pl-charco', [480, 800, 580, 160], charco(), tiembla);
    capa('pl-charco-rojo', [520, 800, 500, 160], charcoCorazon(), tiembla);
    var huellas = el('div', 'pl-huellas', '', tiembla), urlHuella = imagen('0 0 30 70', huella());
    [[420, 796], [462, 778], [504, 790], [546, 771], [590, 782], [632, 763]].forEach(function (p, i) {
      var d = capa('pl-huella', [p[0] - 15, p[1] - 35, 30, 70], urlHuella, huellas);
      d.style.setProperty('--d', (i * .42).toFixed(2) + 's');
    });
    capa('pl-piano', [60, 440, 500, 370], piano(), tiembla);
    elPianista = capa('pl-pianista', [60, 540, 140, 250], pianista(), tiembla);
    capa('pl-bateria', [1130, 490, 420, 330], bateria(), tiembla);
    elBaquetas = el('div', 'pl-baquetas', '', tiembla);
    capa('pl-baq-a', [1200, 520, 220, 160], baquetas(0), elBaquetas);
    capa('pl-baq-b', [1200, 520, 220, 160], baquetas(1), elBaquetas);
    capa('pl-cono-piano', [-40, 360, 420, 460], cono('#fff', .55), tiembla, '470 -100 600 1010');
    var ojosDentro = el('div', 'pl-ojos pl-ojos-dentro', '', tiembla);
    capa('pl-lampara', [690, -430, 160, 360], lampara(), tiembla);

    // el haz del reflector, detrás de él (así queda en silueta). El grupo se prende/apaga y se mueve;
    // adentro, .pl-luz-in late con el bombo.
    elCono = el('div', 'pl-luz-in', '', el('div', 'pl-luz', '', tiembla));
    capa('pl-cono', [470, -100, 600, 1010], cono('#fff', 1), elCono);
    capa('pl-cono-rojo', [470, -100, 600, 1010], cono('#ff3a4c', .9), elCono);

    // él y el contrabajo
    gJason = el('div', 'pl-jason', '', tiembla);
    capa('pl-cuerpo', [620, 300, 400, 600], cuerpo(), gJason);
    // el corazón que le duele ("how my poor heart aches"): late en el pecho, con una grieta
    ubicar(el('div', 'pl-latido', '<svg viewBox="0 0 80 74" aria-hidden="true"><path d="' + corazonD(40, 37, 70, 64) + '" fill="' + ROJO + '"/>' +
      '<path d="M22 22 C26 16 32 15 36 18" stroke="#ff8a96" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M40 14 L35 28 L45 36 L37 48 L42 58" stroke="#3a0008" stroke-width="2.6" fill="none" stroke-linejoin="round"/></svg>', gJason), [686, 404, 80, 74]);
    capa('pl-bajo', [700, 120, 400, 790], contrabajo(), gJason);
    var notas = el('div', 'pl-notas', '', gJason), urlNotas = [imagen('0 0 40 48', nota(0)), imagen('0 0 40 48', nota(1))];
    var urlCor = imagen('0 0 40 36', '<path d="' + corazonD(20, 18, 36, 32) + '" fill="' + ROJO + '"/>');
    var fh = [aMundo(-57, -170), aMundo(57, -170)];
    semilla = 52;
    for (var i = 0; i < 10; i++) {
      var p = fh[i % 2], cor = i % 4 === 3;
      var d = capa('pl-nota', [p[0] - 16 + rnd(-6, 6), p[1] - 24, cor ? 30 : 32, cor ? 27 : 38], cor ? urlCor : urlNotas[i % 3 ? 0 : 1], notas);
      d.style.setProperty('--d', (i * .38).toFixed(2) + 's');
      d.style.setProperty('--dx', f(rnd(-90, 90)));
      d.style.setProperty('--dg', f(rnd(-30, 30)) + 'deg');
    }
    capa('pl-brazo-mastil', [820, 380, 190, 120], brazoMastil(), gJason);
    elAntebrazo = capa('pl-antebrazo', ANTEBRAZO_BB, antebrazo(), gJason);
    capa('pl-rosa', [680, 366, 64, 64], rosa(), gJason, '0 0 60 60');
    gCabeza = el('div', 'pl-cabeza', '', gJason);
    ubicar(el('div', 'pl-halo-mascara', '', gCabeza), [632, 150, 240, 240]);
    capa('pl-nuca', [690, 186, 124, 160], nuca(), gCabeza);
    capa('pl-mascara', MASCARA_BB, mascara(), gCabeza, '0 0 200 250');
    var sonrisa = ubicar(el('div', 'pl-sonrisa', '<svg viewBox="0 0 200 250" preserveAspectRatio="none" aria-hidden="true">' +
      '<path pathLength="1" d="M58 172 C76 204 124 206 142 172" stroke="' + ROJO + '" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<path pathLength="1" d="M52 166 l10 8 M148 166 l-10 8" stroke="' + ROJO + '" stroke-width="6" fill="none" stroke-linecap="round"/></svg>', gCabeza), MASCARA_BB);
    sonrisa.setAttribute('aria-hidden', 'true');
    elBrillos = ubicar(el('div', 'pl-brillos', '<i></i><i></i>', gCabeza), MASCARA_BB);
    ubicar(el('div', 'pl-lagrimas', '<i></i><i></i>', gCabeza), MASCARA_BB);
    ubicar(el('div', 'pl-aliento', '<i></i><i></i><i></i>', gCabeza), [712, 296, 80, 60]);


    // cosas que flotan: cartas, calendario, pétalos
    var cartas = el('div', 'pl-cartas', '', tiembla);
    [['A', 610, 0], ['K', 700, .32], ['Q', 790, .64], ['J', 880, .96], ['10', 960, 1.28]].forEach(function (c, i) {
      var d = ubicar(el('div', 'pl-carta', '<div class="pl-carta-in"><div class="pl-cara"><b>' + c[0] + '</b><i>♥</i><em>♥</em></div><div class="pl-dorso"></div></div>', cartas), [c[1], 120, 64, 90]);
      d.style.setProperty('--d', c[2] + 's');
      d.style.setProperty('--g', (i % 2 ? 1 : -1) * (20 + i * 9) + 'deg');
    });
    var cal = ubicar(el('div', 'pl-calendario', '', tiembla), [892, 170, 196, 232]);
    [['LUNES', '9'], ['MARTES', '10'], ['MIÉRCOLES', '11'], ['JUEVES', '12'], ['VIERNES', '13']].reverse().forEach(function (d, i) {
      var h = el('div', 'pl-hoja-cal' + (i === 0 ? ' pl-hoja-13' : ''), '<small>NOVIEMBRE</small><b>' + d[1] + '</b><span>' + d[0] + '</span>', cal);
      h.style.setProperty('--k', 4 - i);
    });
    var petalos = el('div', 'pl-petalos', '', tiembla), urlPetalo = imagen('0 0 24 30', petalo());
    semilla = 60;
    for (i = 0; i < 16; i++) {
      var pe = capa('pl-petalo', [rnd(380, 1220), -60, 24, 30], urlPetalo, petalos);
      pe.style.setProperty('--d', f(rnd(0, 6)) + 's');
      pe.style.setProperty('--t', f(rnd(5, 8)) + 's');
      pe.style.setProperty('--dx', f(rnd(-140, 140)));
      pe.style.setProperty('--g', f(rnd(200, 720)) + 'deg');
    }
    el('div', 'pl-bruma-cuarto', '', tiembla);
    el('div', 'pl-oscuro', '', tiembla);

    // ojos en la oscuridad: afuera entre los pinos y adentro en los rincones
    [[258, 392, ojosFuera], [560, 384, ojosFuera], [1108, 388, ojosFuera], [1336, 380, ojosFuera], [150, 770, ojosDentro], [470, 830, ojosDentro],
      [1090, 822, ojosDentro], [1520, 650, ojosDentro], [70, 300, ojosDentro], [1530, 300, ojosDentro], [536, 650, ojosDentro], [1062, 652, ojosDentro]].forEach(function (o, i) {
      var d = ubicar(el('div', 'pl-par', '<i></i><i></i>', o[2]), [o[0] - 12, o[1] - 5, 24, 10]);
      d.style.setProperty('--d', f((i * .37) % 2.2) + 's');
      d.style.setProperty('--p', f(2.6 + (i % 4) * .7) + 's');
    });

    // película: destello, relámpago, grano, parpadeo, rayones, viñeta, iris
    elFlash = el('div', 'pl-flash');
    el('div', 'pl-destello', '<i></i><b></b>');
    var gr = el('div', 'pl-grano');
    gr.style.backgroundImage = 'url(' + grano() + ')';
    el('div', 'pl-parpadeo');
    el('div', 'pl-rayones', '<i></i><i></i><b></b>');
    el('div', 'pl-vineta');
    elIris = el('div', 'pl-iris');
    // la cuenta regresiva del principio, el cartel del título y el "fin"
    var lider = el('div', 'pl-lider', '<i class="pl-lider-c"></i><i class="pl-lider-c dos"></i><i class="pl-lider-h"></i><i class="pl-lider-v"></i><b class="pl-lider-mano"></b><span class="pl-lider-num">5</span>');
    elLiderNum = lider.querySelector('.pl-lider-num');
    elLiderMano = lider.querySelector('.pl-lider-mano');
    el('div', 'pl-cartel', '<div class="pl-cartel-marco"><small>The Police</small><em>presentan</em><h2>Every Breath<br>You Take</h2>' +
      '<p>cada vez que respiras</p><span>una historia de amor… con un poquito de miedo <i>♥</i></span></div>');
    el('div', 'pl-fin', '<b>Fin</b><i>♥</i><small>…¿o no?</small><span class="pl-fin-ojos"><i></i><i></i></span>');
    medir();
  }

  // ---------------------------------------------------------------- la escena sigue la letra
  var lineas = [];
  (window.LETRA_POLICE_LRC || '').split(/\r?\n/).forEach(function (l) {
    var m = l.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (m) lineas.push({ t: +m[1] * 60 + +m[2], texto: m[3].split('|')[0].trim().toLowerCase() });
  });
  function entre(t, a, b) { return t >= a && t < b; }
  var RAYOS = [99.0, 101.05, 103.1, 105.15, 133.98];
  function reaccionar() {
    if (!activa) return;
    var t = audio.currentTime, x = '', empezo = document.body.classList.contains('empezo');
    for (var i = 0; i < lineas.length; i++) { if (lineas[i].t <= t) x = lineas[i].texto; else break; }
    var mira = /watching/.test(x);
    var e = {
      'lider': empezo && t < 4.25,
      'titulo': empezo ? entre(t, 4.1, 11.2) : t < 4.25,
      'enciende': entre(t, 11.2, 12.4),
      'aliento': /breath|so cold/.test(x),
      'pasos': /step you take/.test(x),
      'mira': mira,
      'calendario': /single day/.test(x),
      'notas': /word you say/.test(x),
      'cartas': /game you play/.test(x),
      'ojos': (mira && t >= 40) || /move you make/.test(x) || entre(t, 179, 222),
      'rosa': t >= 52.14,
      'late': /heart aches/.test(x),
      'grieta': /vow you break/.test(x),
      'sonrisa': /smile you fake/.test(x),
      'luna-ojo': entre(t, 76.47, 82.35) || entre(t, 170.57, 174) || entre(t, 179, 222),
      'pupila-corazon': entre(t, 201.26, 222),
      'apagon': entre(t, 82.35, 90.84) || entre(t, 98.92, 110),
      'sueno': entre(t, 86.78, 94.92),
      'busca': entre(t, 90.84, 98.92),
      'frio': entre(t, 94.92, 110),
      'llora': entre(t, 98.92, 106.63),
      'lluvia': entre(t, 98.92, 119),
      'vaho': entre(t, 106.63, 124.5),
      'dibuja': entre(t, 108.2, 124.5),
      'baile': entre(t, 110, 128.5),
      'pianista': entre(t, 106.63, 120),
      'limpiador': entre(t, 114, 125.5),
      'camara': entre(t, 162.36, 166.41) || entre(t, 209.45, 213.51),
      'reflectores': entre(t, 179, 226),
      'final': t >= 179,
      'arriba': entre(t, 205.26, 209.45),
      'petalos': entre(t, 205.26, 228.5),
      'fin': t >= 226.3,
      'cam-mascara': entre(t, 27.3, 31.73) || t >= 222,
      'cam-luna': entre(t, 86.78, 90.84),
      'cam-lejos': entre(t, 106.63, 133.5)
    };
    e.foco = t >= 11.2 && !e.apagon && t < 226.3;
    e.corazon = entre(t, 48.14, 64.58) || entre(t, 110, 128.5) || entre(t, 133.98, 150.35) || entre(t, 201.26, 222);
    e.mira = e.mira || e.camara || t >= 222;
    // relámpagos y el regreso de la luz: destellos de una sola vez
    RAYOS.forEach(function (r) { if (antes.t != null && antes.t < r && t >= r && t - r < .5) flash(); });
    ESTADOS.forEach(function (c) { escena.classList.toggle('pl-' + c, !!e[c]); });
    e.t = t;
    antes = e;
  }
  function flash() {
    elFlash.classList.remove('on');
    void elFlash.offsetWidth;
    elFlash.classList.add('on');
  }
  audio.addEventListener('timeupdate', reaccionar);
  audio.addEventListener('seeked', reaccionar);

  // ---------------------------------------------------------------- cada cuadro: el punteo, el vaivén y la mirada
  var u = 1, apunta = null, ultimoApunte = -1e9, mirada = { x: 0, y: 0 }, ultimoTs = 0, ultimoGolpe = -1;
  function medir() { if (mundo) u = mundo.offsetWidth / 1600 || 1; }
  window.addEventListener('resize', medir);
  function apuntar(cx, cy) { apunta = [cx, cy]; ultimoApunte = performance.now(); }
  window.addEventListener('pointermove', function (ev) { apuntar(ev.clientX, ev.clientY); }, { passive: true });
  window.addEventListener('touchstart', function (ev) { var t = ev.touches[0]; if (t) apuntar(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('touchmove', function (ev) { var t = ev.touches[0]; if (t) apuntar(t.clientX, t.clientY); }, { passive: true });
  function centroDe(elem) { var r = elem.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }
  function lim(v) { return Math.max(-1, Math.min(1, v)); }
  // el punteo: jala rápido la cuerda y regresa despacio
  function punteo(fase) { return fase < .16 ? fase / .16 : Math.pow(1 - (fase - .16) / .84, 1.6); }

  function bucle(ts) {
    if (!activa) return;
    requestAnimationFrame(bucle);
    var dt = Math.min(.1, (ts - (ultimoTs || ts)) / 1000);
    ultimoTs = ts;
    var t = audio.currentTime, sonando = !audio.paused, b = (t - T0) / NEGRA, fase = b - Math.floor(b), corchea = (b * 2) % 1;
    // lecturas primero (para no forzar el acomodo de la página después de escribir)
    var cMasc = apunta || t >= 222 ? centroDe(gCabeza.querySelector('.pl-mascara')) : null;
    var cLuna = apunta && escena.classList.contains('pl-luna-ojo') ? centroDe(elOjoLuna) : null;

    // a dónde mira: al dedo/mouse; si no lo has movido, pasea la vista; en "watching you" te mira a ti
    var obj = { x: Math.sin(t * .45) * .55, y: Math.sin(t * .31) * .25 };
    if (escena.classList.contains('pl-mira')) obj = { x: 0, y: 0 };
    if (apunta && ts - ultimoApunte < 4000 && cMasc) obj = { x: lim((apunta[0] - cMasc[0]) / (innerWidth * .4)), y: lim((apunta[1] - cMasc[1]) / (innerHeight * .4)) };
    if (escena.classList.contains('pl-arriba')) obj = { x: .55, y: -1 };
    var k = 1 - Math.exp(-dt * 5);
    mirada.x += (obj.x - mirada.x) * k;
    mirada.y += (obj.y - mirada.y) * k;
    gCabeza.style.transform = 'translate(' + (mirada.x * 6 * u).toFixed(2) + 'px,' + (mirada.y * 5 * u).toFixed(2) + 'px) rotate(' + (mirada.x * 8 + mirada.y * -2).toFixed(2) + 'deg)';
    elBrillos.style.transform = 'translate(' + (mirada.x * 3.5 * u).toFixed(2) + 'px,' + (mirada.y * 2.4 * u).toFixed(2) + 'px)';
    var mx = mirada.x, my = mirada.y;
    if (cLuna && ts - ultimoApunte < 4000) { mx = lim((apunta[0] - cLuna[0]) / (innerWidth * .35)); my = lim((apunta[1] - cLuna[1]) / (innerHeight * .35)); }
    elPupila.style.transform = 'translate(' + (mx * 20 * u).toFixed(2) + 'px,' + (my * 10 * u).toFixed(2) + 'px)';

    // el punteo de la mano derecha y el vaivén con el ritmo (en el baile se mece con el contrabajo)
    var p = sonando && t > 4 ? punteo(corchea) : 0;
    elAntebrazo.style.transform = 'rotate(' + (p * 5.5 - 1.5).toFixed(2) + 'deg)';
    var baile = escena.classList.contains('pl-baile'), golpeNegra = sonando ? Math.pow(1 - fase, 3) : 0;
    var vaiven = Math.sin((b / 8) * Math.PI * 2) * (baile ? 3.2 : .7);
    gJason.style.transform = 'translate(' + (baile ? Math.sin((b / 8) * Math.PI * 2) * 14 * u : 0).toFixed(2) + 'px,' + (-golpeNegra * 1.6 * u).toFixed(2) + 'px) rotate(' + vaiven.toFixed(2) + 'deg)';
    elPianista.style.transform = 'translateY(' + (-golpeNegra * 2.4 * u).toFixed(2) + 'px)';
    var nb = Math.floor(b);
    if (sonando && nb !== ultimoGolpe) { ultimoGolpe = nb; elBaquetas.classList.toggle('pl-b1', nb % 2 === 1); }
    // en los coros y en el final la luz late con el bombo
    var pulsa = escena.classList.contains('pl-final') || entre(t, 133.98, 174);
    elCono.style.opacity = pulsa && sonando ? (.68 + golpeNegra * .32).toFixed(3) : '';

    // la cuenta regresiva de la película
    if (t < 4.3) {
      var n = Math.max(2, 5 - Math.floor(Math.max(0, t - T0) / (NEGRA * 2)));
      if (elLiderNum.textContent !== String(n)) elLiderNum.textContent = n;
      elLiderMano.style.transform = 'rotate(' + ((((t - T0) / (NEGRA * 2)) % 1) * 360).toFixed(1) + 'deg)';
    }
    // el iris del final se cierra sobre la máscara (y ella guiña)
    if (t >= 222 && t < 227 && cMasc) {
      var R0 = Math.hypot(innerWidth, innerHeight), r1 = cMasc[3] * .95, r;
      if (t < 224.2) { var a = (t - 222) / 2.2; a = a * a * (3 - 2 * a); r = R0 + (r1 - R0) * a; }
      else if (t < 225.6) r = r1;
      else r = r1 * Math.max(0, 1 - (t - 225.6) / .7);
      elIris.style.setProperty('--ix', cMasc[0].toFixed(1) + 'px');
      elIris.style.setProperty('--iy', cMasc[1].toFixed(1) + 'px');
      elIris.style.setProperty('--ir', r.toFixed(1) + 'px');
      elIris.style.opacity = 1;
      escena.classList.toggle('pl-guino', t >= 224.5 && t < 224.95);
    } else if (elIris.style.opacity !== '0') {
      elIris.style.opacity = t >= 227 ? 1 : 0;
      if (t >= 227) elIris.style.setProperty('--ir', '0px');
      escena.classList.remove('pl-guino');
    }
  }

  window.Escenas = window.Escenas || {};
  window.Escenas.police = {
    el: escena,
    activar: function () {
      if (!construida) construir();
      activa = true;
      window.SUB_ESPECIAL = SUBS;
      antes = {};
      medir();
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
