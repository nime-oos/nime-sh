// Escena "Take on me" (a-ha): el mundo de lápiz del video.
// Una página de cómic dibujada a lápiz. En la viñeta grande hay un cuarto de cómic (paredes grises con líneas negras,
// piso con brochazos) y él, dibujado a lápiz, de espaldas. Ella es "real" (a color) y está afuera, viendo la página.
// Intro: la viñeta se dibuja sola y adentro hay una carrera de motos. En el primer coro su mano sale de la viñeta,
// ella la toma y la jala adentro del cómic. En el segundo coro van juntos en la moto; en el instrumental los
// persiguen con llaves de tuerca, lo golpean, arrugan la página (en el silencio de la canción) y ella la vuelve a
// alisar. En la última parte él queda atrapado y se avienta contra las orillas de la viñeta hasta romperla, sale
// del cómic, se vuelve real (a color) y le toma la mano. Al final: "the end ♥".
//
// El lápiz: cada trazo es una forma rellena que se adelgaza en las puntas (como carboncillo) y se pasa un poquito de
// donde termina, como mano suelta. Cada dibujo se pinta 3 veces con pequeñas diferencias y los cuadros se alternan
// ~10 veces por segundo (el "hervor" del rotoscopio del video).
// Para que no se trabe: cada dibujo es una imagen SVG que se pinta una sola vez; lo que se mueve son capas enteras
// (transform/opacity) y el hervor es una animación de opacidad del compositor.
(function () {
  var escena = document.getElementById('escena-takeonme');
  var audio = document.getElementById('bg-music');
  if (!escena || !audio) return;
  var SUBS = { letras: true, claves: /^(love|okay|life|remember|gone|anyway)$/ };
  var ESTADOS = ['dibuja', 'titulo', 'carrera', 'cuarto', 'juntos', 'persecucion', 'vroom', 'zoom', 'guino', 'ella-fuera', 'ella-dentro',
    'chico', 'puntos', 'corazon-globo', 'busca', 'rubor', 'ok', 'mano-on', 'toma', 'jala', 'gone', 'reloj', 'needless', 'boceto',
    'tropieza', 'luz', 'canta', 'safe', 'rayos-on', 'clang', 'golpe', 'arruga', 'alisa', 'mesa', 'caido', 'atrapado', 'grieta1', 'grieta2',
    'grieta3', 'grieta4', 'rompe', 'real', 'manos', 'fiesta', 'fin'];

  var construida = false, activa = false, antes = {}, elFlash, tCalienta;
  var TINTA = '#1d1c1a', NS = 'http://www.w3.org/2000/svg';

  // ---------------------------------------------------------------- motor de lápiz
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
  // curva suave (Catmull-Rom) muestreada en puntos
  function cr(a, b, c, d, t, t2, t3) { return .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3); }
  function muestrear(pts, cerrada, pasos) {
    var n = pts.length, out = [];
    if (n < 2) return pts.slice();
    function P(i) { return cerrada ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; }
    for (var i = 0, segs = cerrada ? n : n - 1; i < segs; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (var s = 0; s < pasos; s++) {
        var t = s / pasos, t2 = t * t, t3 = t2 * t;
        out.push([cr(p0[0], p1[0], p2[0], p3[0], t, t2, t3), cr(p0[1], p1[1], p2[1], p3[1], t, t2, t3)]);
      }
    }
    out.push(cerrada ? out[0].slice() : pts[n - 1].slice());
    return out;
  }
  // la misma curva como path de Bézier (para los rellenos)
  function suave(pts, cerrada) {
    var n = pts.length, d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    function P(i) { return cerrada ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; }
    for (var i = 0, segs = cerrada ? n : n - 1; i < segs; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' +
        f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + (cerrada ? 'Z' : '');
  }
  function relleno(pts, color, extra) { return '<path d="' + suave(pts, true) + '" fill="' + color + '"' + (extra || '') + '/>'; }
  function poli(pts, color, extra) {
    return '<path d="M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z" fill="' + color + '"' + (extra || '') + '/>';
  }
  function linFina(pts, color, w, extra) {
    return '<path d="' + suave(pts, false) + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"' + (extra || '') + '/>';
  }
  function ovalo(cx, cy, rx, ry, n, giro) {
    var out = [], g = giro || 0;
    for (var i = 0; i < (n || 12); i++) {
      var a = i / (n || 12) * Math.PI * 2 + g;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }
  function mover(pts, dx, dy, k, cx, cy) {
    return pts.map(function (p) { return [(cx || 0) + (p[0] - (cx || 0)) * (k || 1) + dx, (cy || 0) + (p[1] - (cy || 0)) * (k || 1) + dy]; });
  }

  // un trazo: forma rellena que se adelgaza en las puntas, con temblor de mano y un poquito de "pasarse"
  function trazo(pts, w, o) {
    o = o || {};
    var jit = o.jit == null ? 1 : o.jit, q = [], i;
    for (i = 0; i < pts.length; i++) q.push([pts[i][0] + rnd(-jit, jit), pts[i][1] + rnd(-jit, jit)]);
    var over = o.over == null ? Math.min(7, w * 1.6) : o.over;
    if (over > 0 && q.length > 1) {
      var a = q[0], b = q[1], l = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, e = over * rnd(.2, 1);
      q.unshift([a[0] + (a[0] - b[0]) / l * e, a[1] + (a[1] - b[1]) / l * e]);
      var z = q[q.length - 1], y = q[q.length - 2];
      l = Math.hypot(z[0] - y[0], z[1] - y[1]) || 1; e = over * rnd(.2, 1);
      q.push([z[0] + (z[0] - y[0]) / l * e, z[1] + (z[1] - y[1]) / l * e]);
    }
    var m = muestrear(q, false, o.pasos || 5), n = m.length, L = [], R = [], fase = rnd(0, 6), punta = o.punta == null ? .55 : o.punta;
    for (i = 0; i < n; i++) {
      var p = m[i], pa = m[Math.max(0, i - 1)], pb = m[Math.min(n - 1, i + 1)];
      var dx = pb[0] - pa[0], dy = pb[1] - pa[1], ll = Math.hypot(dx, dy) || 1, t = n > 1 ? i / (n - 1) : .5;
      var h = w * (.16 + .84 * Math.pow(Math.sin(Math.PI * t), punta)) * (1 + .2 * Math.sin(t * 9 + fase)) / 2;
      L.push(f(p[0] - dy / ll * h) + ' ' + f(p[1] + dx / ll * h));
      R.push(f(p[0] + dy / ll * h) + ' ' + f(p[1] - dx / ll * h));
    }
    return '<path d="M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z" fill="' + (o.color || TINTA) + '"' + (o.alfa != null ? ' opacity="' + o.alfa + '"' : '') + '/>';
  }
  // una línea con su segunda pasada más delgada (como cuando se repasa con el lápiz)
  function linea(pts, w, o) {
    o = o || {};
    return trazo(pts, w, o) + (o.sola ? '' : trazo(pts, w * .45, { jit: (o.jit == null ? 1 : o.jit) * 2, alfa: (o.alfa == null ? 1 : o.alfa) * .5, color: o.color, punta: o.punta }));
  }
  // un contorno cerrado se dibuja en 2 o 3 trazos que se enciman un poquito
  function contorno(pts, w, o) {
    o = o || {};
    var n = pts.length, k = o.partes || (n > 9 ? 3 : 2), ini = Math.floor(rnd(0, n)), out = '';
    for (var p = 0; p < k; p++) {
      var a = ini + Math.floor(p * n / k), b = ini + Math.floor((p + 1) * n / k) + 1, seg = [];
      for (var i = a; i <= b; i++) seg.push(pts[i % n]);
      out += o.sola ? trazo(seg, w, o) : linea(seg, w, o);
    }
    return out;
  }
  // figura de lados rectos (marcos, puertas, tableros): cada lado es su propio trazo y se cruzan en las esquinas
  function caja(pts, w, o) {
    o = o || {};
    var out = '', n = pts.length;
    for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n], m = [(a[0] + b[0]) / 2 + rnd(-1.5, 1.5), (a[1] + b[1]) / 2 + rnd(-1.5, 1.5)];
      out += trazo([a, m, b], w * rnd(.85, 1.1), { over: o.over == null ? w * 2.4 : o.over, jit: o.jit == null ? .8 : o.jit, punta: .22, alfa: o.alfa, color: o.color });
      if (!o.sola) out += trazo([a, m, b], w * .4, { over: w * 1.4, jit: 2.2, punta: .4, alfa: (o.alfa == null ? 1 : o.alfa) * .45, color: o.color });
    }
    return out;
  }
  function dentro(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  // rayado a mano: trazos cortos casi paralelos cuyo centro cae dentro de la región
  function rayas(region, ang, sep, largo, w, o) {
    o = o || {};
    var poly = o.recta ? region : muestrear(region, true, 3), x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, out = '';
    poly.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + largo, ca = Math.cos(ang), sa = Math.sin(ang), paso = largo * (o.hueco || 1.05);
    for (var u = -R; u <= R; u += sep) {
      var corr = rnd(0, paso);
      for (var v = -R + corr; v <= R; v += paso) {
        if (o.prob != null && rnd(0, 1) > o.prob) continue;
        var vv = v + rnd(-largo * .2, largo * .2), uu = u + rnd(-sep * .2, sep * .2);
        var px = cx + ca * vv - sa * uu, py = cy + sa * vv + ca * uu;
        if (!dentro(poly, px, py)) continue;
        var h = largo * rnd(.55, 1) / 2, a2 = ang + rnd(-.1, .1), c2 = Math.cos(a2), s2 = Math.sin(a2);
        var A = [px - c2 * h, py - s2 * h], B = [px + c2 * h, py + s2 * h];
        if (!dentro(poly, A[0], A[1]) || !dentro(poly, B[0], B[1])) {
          h *= .5; A = [px - c2 * h, py - s2 * h]; B = [px + c2 * h, py + s2 * h];
          if (!dentro(poly, A[0], A[1]) && !dentro(poly, B[0], B[1])) continue;
        }
        var cu = rnd(-1, 1) * h * .1;
        out += trazo([A, [px - s2 * cu, py + c2 * cu], B], w * rnd(.65, 1.15), { jit: .4, over: 0, alfa: o.alfa, color: o.color, pasos: 3, punta: .8 });
      }
    }
    return out;
  }
  function cruzado(region, ang, sep, largo, w, o) { return rayas(region, ang, sep, largo, w, o) + rayas(region, ang + 1.25, sep * 1.4, largo * .85, w * .8, o); }

  // ---------------------------------------------------------------- capas (imágenes SVG en coordenadas del mundo 1600x900)
  function imagen(vb, contenido) {
    return URL.createObjectURL(new Blob(['<svg xmlns="' + NS + '" viewBox="' + vb + '" preserveAspectRatio="none">' + contenido + '</svg>'], { type: 'image/svg+xml' }));
  }
  function ubicar(d, bb) { d.style.cssText += ';--x:' + bb[0] + ';--y:' + bb[1] + ';--w:' + bb[2] + ';--h:' + bb[3]; return d; }
  function capa(clase, bb, dibujo, cuadros, padre, sem, vb) {
    var d = ubicar(el('div', 'tm-capa ' + clase, '', padre), bb), n = cuadros || 3;
    for (var k = 0; k < n; k++) {
      semilla = ((sem || 1) * 131 + k * 977 + 7) % 233280;
      var im = document.createElement('img');
      im.alt = '';
      im.decoding = 'async';
      im.src = imagen(vb || bb.join(' '), dibujo(k));
      d.appendChild(im);
    }
    if (n === 1) d.classList.add('quieta');
    return d;
  }
  // la misma imagen ya pintada, en otro lugar (las motos de los rivales, los corazones)
  function copia(clase, bb, urls, padre) {
    var d = ubicar(el('div', 'tm-capa ' + clase, '', padre), bb);
    urls.forEach(function (u) { var im = document.createElement('img'); im.alt = ''; im.src = u; d.appendChild(im); });
    if (urls.length === 1) d.classList.add('quieta');
    return d;
  }
  function urlsDe(capaEl) { return Array.prototype.map.call(capaEl.querySelectorAll('img'), function (im) { return im.src; }); }

  // ---------------------------------------------------------------- la viñeta
  var EXT = [[262, 58], [1352, 82], [1330, 856], [286, 846]];
  var INT = [[314, 106], [1302, 128], [1282, 808], [334, 798]];

  function papel() {
    return '<defs><radialGradient id="tmPapel" cx=".5" cy=".48" r=".75"><stop offset=".55" stop-color="#f3f0e8"/><stop offset="1" stop-color="#dcd6ca"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#tmPapel)"/>';
  }
  // bocetos en las orillas de la página: otras viñetas a medio dibujar, una taza de café (el café del video), un casco
  function margen() {
    var s = '', o = { alfa: .55 };
    // viñetas de la izquierda
    s += linea([[36, 34], [40, 300], [38, 600], [42, 866]], 3, o) + linea([[232, 30], [236, 330], [234, 870]], 3, o);
    s += linea([[30, 300], [236, 304]], 2.6, o) + linea([[34, 604], [238, 600]], 2.6, o);
    for (var i = 0; i < 9; i++) s += trazo([[54 + rnd(0, 20), 70 + i * 24], [150 + rnd(0, 40), 70 + i * 24 + rnd(-3, 3)], [220 - rnd(0, 30), 72 + i * 24]], 2, { alfa: .35 });
    s += rayas([[48, 470], [226, 470], [226, 590], [48, 590]], -.9, 9, 30, 1.4, { recta: true, alfa: .25, prob: .5 });
    // taza de café
    var taza = [[96, 404], [176, 404], [169, 456], [151, 472], [121, 472], [103, 456]];
    s += relleno(ovalo(136, 478, 64, 14, 16), '#ebe7de') + contorno(ovalo(136, 478, 64, 14, 16), 2.6, o) + relleno(taza, '#f6f4ee') + contorno(taza, 3, o);
    s += contorno(ovalo(136, 404, 40, 9, 14), 2.4, o) + linea([[176, 414], [198, 420], [198, 442], [172, 450]], 3, o);
    s += rayas(taza.slice(2).concat([[103, 456]]), 1.1, 6, 22, 1.3, { alfa: .4 });
    s += trazo([[126, 392], [118, 376], [128, 360], [120, 340]], 2, { alfa: .45 }) + trazo([[146, 390], [154, 372], [144, 356], [152, 336]], 2, { alfa: .45 });
    // abajo a la izquierda: rayones de velocidad
    for (i = 0; i < 7; i++) s += trazo([[60, 660 + i * 28], [140 + rnd(0, 60), 662 + i * 28], [220, 660 + i * 28 + rnd(-4, 4)]], 2.4, { alfa: .4 });
    // viñetas de la derecha
    s += linea([[1388, 40], [1384, 420], [1390, 870]], 3, o) + linea([[1568, 30], [1566, 470], [1570, 868]], 3, o);
    s += linea([[1384, 372], [1570, 376]], 2.6, o) + linea([[1388, 640], [1566, 636]], 2.6, o);
    // casco de la carrera
    var casco = [[1420, 300], [1416, 250], [1440, 210], [1480, 196], [1520, 206], [1540, 240], [1540, 290], [1500, 300]];
    s += relleno(casco, '#f6f4ee') + contorno(casco, 3, o) + relleno([[1470, 238], [1536, 236], [1540, 270], [1480, 276]], '#3a3836', ' opacity=".55"');
    s += rayas(casco, 1.2, 6, 26, 1.4, { alfa: .3, prob: .6 });
    // estrellitas y rayas sueltas
    for (i = 0; i < 6; i++) {
      var x = 1420 + rnd(0, 130), y = 420 + rnd(0, 190), r = rnd(8, 16);
      s += trazo([[x - r, y], [x + r, y]], 2, { alfa: .45 }) + trazo([[x, y - r], [x, y + r]], 2, { alfa: .45 });
    }
    for (i = 0; i < 6; i++) s += trazo([[1404, 690 + i * 30], [1480 + rnd(0, 40), 688 + i * 30], [1552, 692 + i * 30]], 2.2, { alfa: .35 });
    return s;
  }
  function marco() {
    var s = '<path d="M' + EXT.map(function (p) { return p.join(' '); }).join('L') + 'Z M' + INT.map(function (p) { return p.join(' '); }).join('L') + 'Z" fill="#fbfaf6" fill-rule="evenodd"/>';
    // grosor de la viñeta (como una tabla) a la izquierda y abajo
    var lado = [[262, 58], [286, 846], [266, 862], [242, 74]], base = [[286, 846], [1330, 856], [1316, 872], [266, 862]];
    s += poli(lado, '#d3cec4') + poli(base, '#c2bdb3') + rayas(lado, 1.5, 5, 30, 1.3, { recta: true, alfa: .5 }) + rayas(base, .02, 5, 40, 1.3, { recta: true, alfa: .45 });
    // sombra suave del borde blanco sobre el cuarto
    s += caja(EXT, 5.2, { over: 9 }) + caja(INT, 5.6, { over: 8 });
    s += linea([[242, 74], [266, 862], [1316, 872]], 3, { alfa: .8 });
    // manchitas de grafito en el borde blanco
    for (var i = 0; i < 16; i++) {
      var t = rnd(0, 1), lado2 = Math.floor(rnd(0, 4)), a = EXT[lado2], b = EXT[(lado2 + 1) % 4], c = INT[lado2], d = INT[(lado2 + 1) % 4];
      var px = a[0] + (b[0] - a[0]) * t, py = a[1] + (b[1] - a[1]) * t, qx = c[0] + (d[0] - c[0]) * t, qy = c[1] + (d[1] - c[1]) * t, m = rnd(.3, .7);
      var x = px + (qx - px) * m, y = py + (qy - py) * m, ang = rnd(0, 3);
      s += trazo([[x - Math.cos(ang) * 10, y - Math.sin(ang) * 10], [x + Math.cos(ang) * 10, y + Math.sin(ang) * 10]], 1.4, { alfa: .25 });
    }
    return s;
  }

  // ---------------------------------------------------------------- el cuarto (como el set del video: muros grises con líneas negras)
  var TECHO = [[290, 86], [1326, 110], [1326, 196], [290, 178]], MURO_I = [[290, 178], [470, 184], [470, 640], [290, 752]];
  var MURO_F = [[470, 184], [990, 190], [990, 642], [470, 640]], MURO_D = [[990, 190], [1326, 196], [1326, 760], [990, 642]];
  var PISO = [[290, 752], [470, 640], [990, 642], [1326, 760], [1326, 830], [290, 830]];
  var PUERTA = [[612, 300], [872, 302], [872, 640], [612, 640]];
  function cuarto() {
    var s = '<defs><linearGradient id="tmMuro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9e6df"/><stop offset=".6" stop-color="#d8d4cd"/><stop offset="1" stop-color="#c3bfb8"/></linearGradient>' +
      '<linearGradient id="tmPiso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d5ce"/><stop offset="1" stop-color="#b6b2ab"/></linearGradient>' +
      '<radialGradient id="tmLuzC" cx=".36" cy=".46" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    s += poli(TECHO, '#7a7772') + poli(MURO_I, '#dbd7d0') + poli(MURO_F, 'url(#tmMuro)') + poli(MURO_D, '#a6a29c') + poli(PISO, 'url(#tmPiso)');
    s += '<rect x="290" y="86" width="1040" height="750" fill="url(#tmLuzC)"/>';
    // sombreado a lápiz
    s += rayas(MURO_D, -1.05, 7, 46, 1.8, { recta: true, alfa: .5 });
    s += rayas(TECHO, .85, 6, 30, 1.7, { recta: true, alfa: .55 });
    s += rayas([[290, 178], [470, 184], [470, 260], [290, 250]], .9, 9, 26, 1.4, { recta: true, alfa: .35 });
    s += rayas([[300, 760], [470, 650], [990, 652], [1326, 770], [1326, 830], [300, 830]], .04, 13, 70, 1.3, { recta: true, alfa: .28, prob: .7 });
    s += rayas(PUERTA, 1.25, 10, 40, 1.3, { recta: true, alfa: .2, prob: .55 });
    // tablero de la pared izquierda (en perspectiva) y la puerta del fondo
    var tablero = [[330, 250], [446, 256], [446, 560], [336, 612]];
    s += poli(tablero, '#cfcbc4') + rayas(tablero, 1.3, 9, 30, 1.3, { recta: true, alfa: .3 });
    s += caja(tablero, 5.5) + caja(PUERTA, 6) + caja([[640, 330], [826, 332], [826, 376], [640, 374]], 5.5);
    // líneas negras del set: esquinas, techo y piso
    s += linea([[470, 184], [469, 420], [470, 640]], 6.5) + linea([[990, 190], [991, 420], [990, 642]], 6.5);
    s += linea([[290, 178], [470, 184], [730, 186]], 6) + linea([[720, 186], [990, 190], [1326, 196]], 6);
    s += linea([[290, 752], [380, 696], [470, 640]], 6.5) + linea([[470, 640], [730, 641], [990, 642]], 6) + linea([[990, 642], [1150, 700], [1326, 760]], 6.5);
    s += linea([[560, 184], [640, 106]], 5.5) + linea([[716, 186], [790, 110]], 5.5) + linea([[640, 140], [1000, 146]], 5) + linea([[880, 188], [930, 112]], 5);
    s += linea([[1060, 212], [1058, 440], [1056, 676]], 5) + linea([[1190, 214], [1188, 470], [1186, 718]], 5) + caja([[1080, 262], [1170, 264], [1168, 420], [1078, 418]], 5);
    // brochazos negros del piso
    [[[360, 768], [440, 742], [540, 748], [620, 776]], [[420, 812], [520, 786], [640, 790], [720, 812]], [[560, 690], [640, 674], [740, 678], [820, 702]],
      [[700, 744], [800, 724], [900, 732], [980, 756]], [[480, 704], [540, 690], [604, 692]], [[860, 670], [920, 662], [980, 670]], [[1040, 786], [1110, 770], [1180, 778]]]
      .forEach(function (b) { s += trazo(b, rnd(6, 9), { punta: .35 }) + trazo(mover(b, rnd(-4, 4), 5), 2, { alfa: .4 }); });
    // sombra de la orilla de la viñeta adentro del cuarto
    s += rayas([[314, 106], [1302, 128], [1302, 146], [334, 126], [354, 798], [334, 798]], .7, 6, 22, 1.4, { recta: true, alfa: .35 });
    return s;
  }

  // ---------------------------------------------------------------- ella (a color: es "real")
  var ELLA = {
    pelo: [[540, 318], [542, 302], [550, 292], [562, 287], [576, 289], [588, 297], [595, 311], [597, 330], [597, 352], [600, 376], [605, 402], [607, 430], [603, 452], [593, 462], [585, 452], [584, 428], [582, 404], [577, 388], [566, 384], [553, 388], [545, 404], [540, 428], [535, 452], [525, 462], [518, 452], [520, 428], [526, 404], [531, 380], [534, 356], [536, 334]],
    mechon: [[537, 338], [535, 370], [530, 400], [524, 430], [520, 454], [529, 462], [537, 440], [543, 410], [547, 380], [547, 350]],
    cara: [[548, 312], [560, 306], [574, 309], [583, 318], [586, 330], [586, 340], [589, 346], [585, 350], [584, 357], [578, 365], [568, 370], [557, 369], [549, 362], [544, 350], [542, 336], [544, 322]],
    cuello: [[553, 360], [554, 388], [572, 388], [574, 362]],
    coronilla: [[540, 322], [543, 303], [552, 292], [565, 287], [579, 290], [590, 299], [595, 316], [588, 307], [577, 300], [564, 298], [553, 300], [546, 309]],
    flequilloI: [[561, 296], [552, 301], [545, 311], [541, 325], [540, 341], [546, 330], [550, 318], [557, 307]],
    flequilloD: [[562, 296], [572, 300], [581, 308], [586, 320], [588, 335], [583, 325], [577, 314], [568, 305]],
    vestido: [[550, 388], [562, 396], [574, 388], [577, 420], [579, 460], [582, 500], [592, 540], [604, 594], [584, 600], [562, 602], [540, 600], [518, 594], [530, 540], [544, 500], [547, 460], [549, 420]],
    sueterI: [[554, 382], [540, 386], [527, 394], [523, 412], [525, 445], [527, 485], [529, 520], [531, 542], [547, 544], [549, 505], [550, 465], [551, 425], [556, 394]],
    sueterD: [[570, 382], [584, 386], [597, 393], [601, 412], [600, 445], [598, 485], [597, 520], [596, 542], [580, 544], [578, 505], [576, 465], [574, 425], [569, 394]],
    brazoI: [[527, 394], [518, 402], [512, 430], [508, 470], [505, 505], [506, 532], [516, 534], [519, 505], [522, 470], [525, 440], [528, 414]],
    manoI: [[507, 530], [503, 540], [503, 552], [506, 561], [511, 565], [515, 560], [518, 550], [519, 538], [516, 531]],
    brazoD: [[597, 393], [606, 401], [612, 430], [616, 470], [619, 505], [619, 530], [609, 532], [606, 505], [603, 472], [600, 442], [595, 414]],
    manoD: [[610, 529], [608, 540], [609, 552], [613, 561], [618, 565], [622, 559], [624, 548], [622, 537], [619, 530]],
    piernaI: [[540, 596], [537, 640], [539, 680], [540, 712], [548, 714], [549, 680], [550, 640], [553, 600]],
    piernaD: [[566, 600], [568, 640], [572, 680], [576, 712], [584, 712], [582, 680], [579, 640], [579, 600]],
    botaI: [[537, 706], [536, 722], [533, 735], [549, 738], [553, 730], [550, 706]],
    botaD: [[574, 706], [575, 722], [578, 735], [596, 737], [595, 728], [585, 721], [584, 706]]
  };
  // orillas del suéter (abierto): costados, orillas de enfrente y bastilla
  var SUETER = [[[527, 394], [523, 412], [525, 445], [527, 485], [529, 520], [531, 542], [547, 544]], [[554, 382], [556, 394], [551, 425], [550, 465], [549, 505], [547, 544]],
    [[597, 393], [601, 412], [600, 445], [598, 485], [597, 520], [596, 542], [580, 544]], [[570, 382], [569, 394], [574, 425], [576, 465], [578, 505], [580, 544]],
    [[540, 386], [554, 382]], [[570, 382], [584, 386]]];
  var ELLA_BB = [495, 280, 125, 465], BRAZO_BB = [590, 385, 40, 185];
  var DEF_ELLA = '<defs><linearGradient id="tmPiel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2b89b"/><stop offset=".55" stop-color="#f2d2ba"/><stop offset="1" stop-color="#eccab0"/></linearGradient>' +
    '<linearGradient id="tmPelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e2e28"/><stop offset=".4" stop-color="#2a1f1b"/><stop offset="1" stop-color="#1e1614"/></linearGradient>' +
    '<linearGradient id="tmSueter" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d4ccbd"/><stop offset=".55" stop-color="#f1ece2"/><stop offset="1" stop-color="#e6dfd2"/></linearGradient>' +
    '<linearGradient id="tmVest" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26212d"/><stop offset=".6" stop-color="#3a3243"/><stop offset="1" stop-color="#2c2633"/></linearGradient></defs>';
  function contornosFinos(lista) {
    return lista.map(function (p) { return '<path d="' + suave(p, true) + '" fill="none" stroke="#4a3631" stroke-width="1.1" opacity=".55"/>'; }).join('');
  }
  // ojos, cejas, lentes grandes de alambre, nariz y boca de ella (mirando hacia él, a la derecha)
  function rasgosElla() {
    return '<path d="M548.5 336 Q555 330.6 561.5 335.6 Q555 339.6 548.5 336Z" fill="#fff" opacity=".8"/><path d="M572.5 335.2 Q577.5 330.8 582 334.8 Q577.5 338.6 572.5 335.2Z" fill="#fff" opacity=".8"/>' +
      '<circle cx="555.6" cy="335.4" r="3" fill="#2a1d1a"/><circle cx="578" cy="334.8" r="2.7" fill="#2a1d1a"/>' +
      '<path d="M548.5 336 Q555 330.6 561.5 335.6 M572.5 335.2 Q577.5 330.8 582 334.8" fill="none" stroke="#2a1d1a" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="556.6" cy="334.4" r="1" fill="#fff"/><circle cx="578.9" cy="333.8" r=".9" fill="#fff"/>' +
      '<path d="M547.5 327 Q554 323.5 561 325.5 M572 325 Q577 323 582.5 325.5" fill="none" stroke="#3a2a24" stroke-width="1.4" stroke-linecap="round"/>' +
      '<ellipse cx="555" cy="336" rx="9.6" ry="9.2" fill="#fff" fill-opacity=".12" stroke="#b8935f" stroke-width="1.3"/>' +
      '<ellipse cx="577.6" cy="335.2" rx="7.4" ry="9.1" fill="#fff" fill-opacity=".12" stroke="#b8935f" stroke-width="1.3"/>' +
      '<path d="M564.6 334.6 Q567.4 332.4 570.2 334.2 M545.4 334.6 L540.6 332.6" fill="none" stroke="#b8935f" stroke-width="1.2"/>' +
      '<path d="M550 331 Q553 329.5 556 330" stroke="#fff" stroke-width=".8" opacity=".55" fill="none"/>' +
      '<path d="M583.4 340.5 Q587 347 582 349.4" fill="none" stroke="#b07f68" stroke-width="1.2" stroke-linecap="round"/>' +
      '<path d="M567 355.4 Q573 359.6 579.2 354.6" fill="none" stroke="#9a4a48" stroke-width="1.3" stroke-linecap="round"/>' +
      '<path d="M569.4 357.4 Q573.8 361.4 577.6 357.2 Q573.6 359 569.4 357.4Z" fill="#d27c78"/>' +
      '<path d="M548 333.4 l-2.2 -1.6 M561.2 333.2 l1.6 -1.8 M572.6 332.6 l-1.4 -1.6 M581.8 332.4 l1.4 -1.6" stroke="#2a1d1a" stroke-width=".9" stroke-linecap="round"/>' +
      '<ellipse cx="552.5" cy="348" rx="6" ry="3.4" fill="#f09a9a" opacity=".3"/><ellipse cx="581" cy="347.6" rx="3.8" ry="3" fill="#f09a9a" opacity=".3"/>';
  }
  function ellaColor() {
    var E = ELLA, s = DEF_ELLA;
    s += relleno(E.pelo, 'url(#tmPelo)');
    s += relleno(E.piernaI, '#2c2833') + relleno(E.piernaD, '#2c2833') + relleno(E.botaI, '#3d322c') + relleno(E.botaD, '#3d322c');
    s += relleno(E.vestido, 'url(#tmVest)');
    s += relleno(E.brazoI, 'url(#tmSueter)') + relleno(E.manoI, '#ecc7ab');
    s += relleno(E.sueterI, 'url(#tmSueter)') + relleno(E.sueterD, 'url(#tmSueter)');
    s += relleno(E.cuello, '#e0b597') + '<path d="M554 372 Q563 380 573 372 L573 380 Q563 386 554 380Z" fill="#cf9f82" opacity=".6"/>';
    s += relleno(E.mechon, 'url(#tmPelo)');
    s += relleno(E.cara, 'url(#tmPiel)');
    s += rasgosElla();
    s += relleno(E.coronilla, 'url(#tmPelo)') + relleno(E.flequilloI, '#2b201c') + relleno(E.flequilloD, '#2b201c');
    s += '<path d="M552 296 Q560 291 570 293" stroke="#6a5048" stroke-width="1.6" fill="none" opacity=".7"/>';
    // detalles del suéter (orilla tejida) y del vestido
    s += '<path d="M531 538 L547 540 M580 540 L596 538 M506 528 L517 529 M543 386 Q548 420 548 460" stroke="#bdb3a3" stroke-width="2" fill="none" opacity=".8"/>';
    s += contornosFinos([E.pelo, E.cara, E.vestido, E.brazoI, E.manoI, E.piernaI, E.piernaD, E.botaI, E.botaD]);
    s += SUETER.map(function (l) { return '<path d="' + suave(l, false) + '" fill="none" stroke="#4a3631" stroke-width="1.1" opacity=".55"/>'; }).join('');
    // brillo del pelo y pliegues de las mangas
    s += '<path d="M547 300 Q560 292 574 294 M590 318 Q596 350 598 380" stroke="#6e5850" stroke-width="2" fill="none" opacity=".5"/>' +
      '<path d="M512 470 q5 3 10 0 M509 500 q5 3 10 0 M508 556 l3 3" stroke="#a89c8a" stroke-width="1.2" fill="none" opacity=".8"/>';
    return s;
  }
  function ellaRubor() {
    return '<ellipse cx="552" cy="348.4" rx="6.5" ry="3.8" fill="#ff7a8a" opacity=".55"/><ellipse cx="581.4" cy="348" rx="4.2" ry="3.2" fill="#ff7a8a" opacity=".55"/>' +
      '<path d="M546 344 l3 -3 M550 345 l3 -3 M554 345 l3 -3 M579 344 l2 -3 M582 345 l2 -3" stroke="#d84a5a" stroke-width=".9" opacity=".7"/>';
  }
  function ellaLapiz() {
    var E = ELLA, s = '', o = { alfa: .9 };
    [E.pelo, E.cara, E.vestido, E.brazoI, E.manoI, E.piernaI, E.piernaD, E.botaI, E.botaD, E.mechon].forEach(function (p) { s += contorno(p, 1.8, o); });
    SUETER.forEach(function (l) { s += linea(l, 1.8, o); });
    s += rayas(E.vestido, 1.2, 4, 20, 1.3, { alfa: .55 }) + rayas(E.piernaI, 1.5, 3.6, 16, 1.1, { alfa: .5 }) + rayas(E.piernaD, 1.5, 3.6, 16, 1.1, { alfa: .5 });
    s += cruzado(E.botaI, .8, 3, 12, 1.2, { alfa: .6 }) + cruzado(E.botaD, .8, 3, 12, 1.2, { alfa: .6 });
    s += rayas([[523, 412], [538, 410], [543, 470], [547, 540], [531, 542], [527, 485]], 1.3, 4, 18, 1.1, { alfa: .35 });
    s += rayas(E.mechon, 1.5, 3.2, 26, 1.2, { alfa: .5 }) + rayas([[587, 300], [597, 330], [600, 376], [607, 430], [600, 456], [588, 456], [584, 420], [582, 390], [588, 360], [590, 330]], 1.45, 3.2, 28, 1.2, { alfa: .5 });
    s += trazo([[508, 552], [512, 556]], 1) + trazo([[612, 552], [617, 557]], 1);
    // mechones del pelo y fleco
    [[[560, 290], [548, 300], [542, 316], [540, 340]], [[563, 290], [576, 296], [585, 310], [588, 334]], [[540, 340], [536, 380], [528, 420], [522, 456]],
      [[596, 330], [598, 372], [604, 420], [600, 456]]].forEach(function (m) { s += trazo(m, 1.6, { alfa: .7 }); });
    s += trazo([[549, 336], [555, 332], [561, 336]], 1.3) + trazo([[573, 335], [577, 332], [582, 335]], 1.2);
    s += contorno(ovalo(555, 336, 9.6, 9.2, 10), 1, { alfa: .55, sola: true }) + contorno(ovalo(577.6, 335.2, 7.4, 9.1, 10), 1, { alfa: .55, sola: true });
    return s;
  }
  function ellaBrazoColor() {
    var E = ELLA;
    return DEF_ELLA + relleno(E.manoD, '#ecc7ab') + relleno(E.brazoD, 'url(#tmSueter)') + '<path d="M609 528 L619 527" stroke="#bdb3a3" stroke-width="2"/>' + contornosFinos([E.brazoD, E.manoD]);
  }
  function ellaBrazoLapiz() { return contorno(ELLA.brazoD, 1.8, { alfa: .9 }) + contorno(ELLA.manoD, 1.5, { alfa: .9 }); }
  function ellaSombra() {
    var sil = [[540, 296], [580, 292], [600, 330], [604, 400], [612, 450], [624, 560], [606, 600], [590, 712], [540, 712], [520, 600], [500, 540], [506, 430], [522, 392], [536, 380], [534, 340]];
    var sh = mover(sil, -112, -14, 1.04, 560, 500);
    return relleno(sh, '#4e4b46', ' opacity=".2"') + rayas(sh, 1.1, 7, 24, 1.3, { alfa: .2 });
  }

  // ---------------------------------------------------------------- él: con el mismo estilo y tamaño que ella, de tres cuartos mirándola.
  // Siempre a color (chamarra de piel café, playera blanca, jeans); en el cómic va un poco apagado y con contorno de
  // lápiz encima, igual que ella cuando entra, y al salir de la viñeta queda con sus colores completos.
  // El brazo que le da la mano es una capa aparte que gira desde el hombro.
  var EL = {
    pelo: [[797, 300], [795, 284], [801, 270], [813, 261], [830, 256], [848, 259], [860, 269], [866, 285], [864, 304], [858, 320], [849, 318], [845, 302], [841, 291], [834, 286], [822, 285], [810, 288], [802, 292]],
    mechones: [[[802, 278], [801, 266], [815, 268]], [[817, 265], [819, 253], [832, 260]], [[834, 260], [846, 252], [850, 264]], [[851, 266], [864, 263], [862, 277]], [[861, 284], [870, 286], [865, 296]]],
    cara: [[842, 290], [828, 285], [813, 288], [803, 297], [799, 309], [799, 319], [795, 326], [799, 330], [800, 337], [805, 346], [815, 354], [827, 356], [838, 350], [845, 338], [848, 322], [846, 304]],
    oreja: [[846, 308], [855, 303], [860, 314], [857, 330], [847, 334]],
    fleco: [[840, 268], [826, 272], [812, 280], [802, 292], [797, 305], [804, 298], [812, 291], [826, 285], [843, 281]],
    patilla: [[845, 296], [851, 298], [851, 308], [846, 310]],
    cuello: [[811, 346], [811, 378], [837, 378], [839, 344]],
    playera: [[806, 374], [822, 386], [838, 374], [841, 420], [843, 470], [842, 512], [802, 512], [801, 470], [803, 420]],
    chaqI: [[810, 372], [791, 376], [772, 386], [766, 410], [767, 450], [769, 490], [771, 526], [791, 530], [801, 522], [802, 480], [803, 430], [806, 396]],
    chaqD: [[834, 372], [853, 376], [872, 386], [878, 410], [877, 450], [875, 490], [873, 526], [853, 530], [843, 522], [842, 480], [841, 430], [838, 396]],
    solapaI: [[810, 372], [799, 382], [805, 408], [813, 392]],
    solapaD: [[834, 372], [845, 382], [839, 408], [831, 392]],
    brazoD: [[872, 386], [882, 396], [888, 430], [892, 470], [894, 508], [893, 532], [881, 534], [879, 508], [876, 470], [873, 436], [870, 412]],
    manoD: [[882, 531], [880, 544], [883, 558], [889, 565], [896, 559], [897, 545], [894, 533]],
    brazoI: [[772, 386], [762, 396], [756, 430], [752, 470], [750, 508], [751, 532], [763, 534], [765, 508], [768, 470], [771, 436], [774, 412]],
    manoI: [[751, 530], [748, 543], [749, 557], [755, 565], [762, 561], [765, 548], [764, 534]],
    cinto: [[801, 508], [843, 508], [844, 520], [801, 520]],
    piernaI: [[801, 518], [797, 560], [796, 610], [797, 660], [799, 712], [814, 714], [816, 660], [818, 610], [820, 566], [822, 532]],
    piernaD: [[822, 532], [826, 566], [830, 610], [834, 660], [838, 712], [852, 712], [851, 660], [849, 610], [847, 560], [844, 518]],
    botaI: [[797, 704], [795, 722], [786, 733], [789, 742], [816, 742], [817, 724], [815, 704]],
    botaD: [[837, 704], [838, 722], [837, 735], [863, 740], [866, 731], [856, 722], [853, 704]]
  };
  var EL_BB = [760, 250, 145, 500], EL_BRAZO_BB = [740, 380, 40, 192];
  var DEF_EL = '<defs><linearGradient id="tmPielG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9e6e0"/><stop offset=".55" stop-color="#dedad3"/><stop offset="1" stop-color="#cdc8c1"/></linearGradient>' +
    '<linearGradient id="tmPielEl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2d2ba"/><stop offset=".5" stop-color="#ecc6aa"/><stop offset="1" stop-color="#dcb092"/></linearGradient>' +
    '<linearGradient id="tmPeloEl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5840"/><stop offset=".5" stop-color="#523a2b"/><stop offset="1" stop-color="#33241a"/></linearGradient>' +
    '<linearGradient id="tmPeloG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c7873"/><stop offset=".5" stop-color="#57534f"/><stop offset="1" stop-color="#3a3734"/></linearGradient>' +
    '<linearGradient id="tmChaq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#93694f"/><stop offset=".5" stop-color="#6e4c3a"/><stop offset="1" stop-color="#4c3326"/></linearGradient>' +
    '<linearGradient id="tmChaqG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e8a85"/><stop offset=".5" stop-color="#6d6965"/><stop offset="1" stop-color="#4f4c49"/></linearGradient>' +
    '<linearGradient id="tmJean" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a7d9c"/><stop offset=".5" stop-color="#52627f"/><stop offset="1" stop-color="#3e4b64"/></linearGradient>' +
    '<linearGradient id="tmJeanG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aeaba6"/><stop offset=".5" stop-color="#94918c"/><stop offset="1" stop-color="#7c7975"/></linearGradient></defs>';
  // colores de él: "gris" (dibujo del cómic) y "color" (ya es real)
  var PAL_EL = {
    gris: { piel: 'url(#tmPielG)', piel2: '#d6d2cb', sombra: '#b9b4ad', nariz: '#8e8a84', pelo: 'url(#tmPeloG)', mechon: '#2e2c2a', brillo: '#9a9690', ceja: '#34312e', iris: '#2e2c2a',
      boca: '#6e6a65', labio: '#a8a39c', rubor: 0, chaq: 'url(#tmChaqG)', solapa: '#5a5753', play: '#f4f2ee', jean: 'url(#tmJeanG)', costura: '#c8c5c0', cinto: '#3a3836', bota: '#4a4744', linea: '#3a3836' },
    color: { piel: 'url(#tmPielEl)', piel2: '#e2b597', sombra: '#c99a7e', nariz: '#b07f68', pelo: 'url(#tmPeloEl)', mechon: '#24180f', brillo: '#a07a5a', ceja: '#3a2a20', iris: '#3a2a20',
      boca: '#8a4a40', labio: '#c4806f', rubor: .16, chaq: 'url(#tmChaq)', solapa: '#5e4234', play: '#f4f1ea', jean: 'url(#tmJean)', costura: '#c9a25a', cinto: '#2c2420', bota: '#3e2e26', linea: '#4a3631' }
  };
  function finos(lista, color) {
    return lista.map(function (p) { return '<path d="' + suave(p, true) + '" fill="none" stroke="' + color + '" stroke-width="1.1" opacity=".55"/>'; }).join('');
  }
  // la cabeza de él (la misma de pie y en la moto)
  function cabezaEl(p) {
    var E = EL, s = '';
    // la cabeza completa detrás (así no queda hueco entre el pelo y la cara)
    s += relleno(ovalo(832, 302, 32, 42, 14), p.piel2);
    s += relleno(E.cara, p.piel) + relleno(E.oreja, p.piel2) + '<path d="M850.5 312 Q856 319 851.5 327" stroke="' + p.nariz + '" stroke-width="1.2" fill="none"/>';
    s += '<path d="M843 326 Q840 342 828 351" fill="none" stroke="' + p.sombra + '" stroke-width="5" opacity=".22" stroke-linecap="round"/>';
    s += E.mechones.map(function (m) { return relleno(m, p.pelo); }).join('') + relleno(E.pelo, p.pelo) + relleno(E.fleco, p.pelo) + relleno(E.patilla, p.pelo);
    // mechones y brillo del pelo
    s += '<path d="M806 278 Q820 266 842 266 M840 268 Q826 276 806 296 M852 278 Q862 292 860 312" stroke="' + p.mechon + '" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>' +
      '<path d="M812 270 Q826 262 844 264" stroke="' + p.brillo + '" stroke-width="2.6" fill="none" opacity=".6" stroke-linecap="round"/>';
    // ojos, cejas, nariz y sonrisa (como los de ella, pero mirándola a la izquierda)
    s += '<path d="M823.5 313 Q830.6 307.6 838 312.4 Q830.6 316.8 823.5 313Z" fill="#fbfaf6"/><path d="M804.6 312.4 Q809.6 308 814.2 312 Q809.6 315.8 804.6 312.4Z" fill="#fbfaf6"/>' +
      '<circle cx="829.8" cy="312.4" r="3" fill="' + p.iris + '"/><circle cx="809" cy="312" r="2.6" fill="' + p.iris + '"/>' +
      '<path d="M823.5 313 Q830.6 307.6 838 312.4 M804.6 312.4 Q809.6 308 814.2 312" fill="none" stroke="' + p.iris + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="830.8" cy="311.4" r="1" fill="#fff"/><circle cx="809.8" cy="311" r=".9" fill="#fff"/>' +
      '<path d="M822.6 303.4 Q830 299.8 839.6 302.4" fill="none" stroke="' + p.ceja + '" stroke-width="2.7" stroke-linecap="round"/>' +
      '<path d="M802.4 303.8 Q808 301.2 814.6 302.6" fill="none" stroke="' + p.ceja + '" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M799.6 328.4 Q802.6 330.4 805.6 328.6" fill="none" stroke="' + p.nariz + '" stroke-width="1.3" stroke-linecap="round"/>' +
      '<path d="M819.6 338.2 Q813.2 343.2 806.4 337.8" fill="none" stroke="' + p.boca + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M817 341.8 Q813 344 809.8 341.6" fill="none" stroke="' + p.labio + '" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
      '<ellipse cx="832" cy="327" rx="5.5" ry="3" fill="#f09a9a" opacity="' + p.rubor + '"/>';
    return s;
  }
  function elFigura(tipo) {
    var E = EL, p = PAL_EL[tipo], s = DEF_ELLA + DEF_EL;
    s += relleno(E.piernaI, p.jean) + relleno(E.piernaD, p.jean) + relleno(E.botaI, p.bota) + relleno(E.botaD, p.bota);
    s += '<path d="M807 560 Q806 630 808 706 M841 562 Q842 630 846 706" stroke="' + p.costura + '" stroke-width="1.2" fill="none" opacity=".7"/>';
    s += '<path d="M786 734 L816 736 M838 733 L864 736" stroke="#1d1c1a" stroke-width="2" opacity=".5"/>';
    s += relleno(E.playera, p.play) + '<path d="M806 376 Q822 392 838 376" stroke="#cfc9bf" stroke-width="2" fill="none"/>';
    s += relleno(E.cinto, p.cinto) + '<rect x="815" y="509" width="13" height="10" rx="2" fill="none" stroke="#c9c3b6" stroke-width="1.8"/>';
    s += relleno(E.chaqI, p.chaq) + relleno(E.chaqD, p.chaq) + relleno(E.solapaI, p.solapa) + relleno(E.solapaD, p.solapa);
    s += '<path d="M790 470 L801 468 M844 468 L856 470 M769 520 L790 524 M854 524 L873 520" stroke="' + p.solapa + '" stroke-width="2" fill="none" opacity=".8"/>' +
      '<path d="M776 400 Q786 396 794 402 M868 402 Q860 396 850 400" stroke="#fff" stroke-width="2" fill="none" opacity=".25"/>';
    s += relleno(E.brazoD, p.chaq) + relleno(E.manoD, p.piel2) + '<path d="M880 526 L894 525" stroke="' + p.solapa + '" stroke-width="2.4"/>';
    s += relleno(E.cuello, p.piel2) + '<path d="M811 352 Q824 364 839 350 L838 364 Q824 372 811 364Z" fill="' + p.sombra + '" opacity=".7"/>';
    s += cabezaEl(p);
    s += finos([E.pelo, E.fleco, E.cara, E.playera, E.chaqI, E.chaqD, E.brazoD, E.manoD, E.piernaI, E.piernaD, E.botaI, E.botaD], p.linea);
    s += '<path d="M811 352 L811 376 M838 350 L837 376" stroke="' + p.linea + '" stroke-width="1.1" opacity=".55"/>';
    return s;
  }
  function elLapiz() {
    var E = EL, s = '', o = { alfa: .9 };
    [E.pelo, E.cara, E.oreja, E.playera, E.chaqI, E.chaqD, E.solapaI, E.solapaD, E.brazoD, E.manoD, E.piernaI, E.piernaD, E.botaI, E.botaD].forEach(function (q) { s += contorno(q, 1.8, o); });
    s += rayas(E.chaqI, 1.2, 4, 20, 1.2, { alfa: .5 }) + rayas(E.chaqD, 1.25, 3.6, 20, 1.2, { alfa: .6 }) + rayas(E.brazoD, 1.4, 3.6, 18, 1.1, { alfa: .55 });
    s += rayas(E.piernaI, 1.45, 5, 18, 1.1, { alfa: .35 }) + rayas(E.piernaD, 1.45, 4.4, 18, 1.1, { alfa: .45 });
    s += cruzado(E.botaI, .8, 3, 12, 1.2, { alfa: .6 }) + cruzado(E.botaD, .8, 3, 12, 1.2, { alfa: .6 });
    s += rayas(E.pelo, -.35, 3.2, 20, 1.3, { alfa: .5 }) + rayas([[803, 376], [810, 380], [812, 512], [803, 512]], 1.5, 3, 16, 1, { alfa: .4 });
    E.mechones.forEach(function (m) { s += trazo(m, 1.5, { alfa: .75, over: 0 }); });
    s += contorno(E.fleco, 1.4, { alfa: .7, sola: true }) + trazo([[836, 272], [818, 280], [804, 296]], 1.2, { alfa: .6 });
    s += trazo([[823, 303], [830, 300], [839, 302]], 1.8) + trazo([[803, 304], [808, 301.5], [814, 302.6]], 1.6);
    s += trazo([[824, 312.6], [830.6, 308], [837.6, 312.2]], 1.3) + trazo([[805, 312.2], [809.6, 308.4], [813.8, 311.8]], 1.2) + trazo([[819, 338.4], [813, 342.6], [806.8, 338]], 1.2);
    return s;
  }
  function elBrazo(tipo) {
    var p = PAL_EL[tipo];
    return DEF_ELLA + DEF_EL + relleno(EL.manoI, p.piel2) + relleno(EL.brazoI, p.chaq) + '<path d="M751 528 L765 529" stroke="' + p.solapa + '" stroke-width="2.4"/>' + finos([EL.brazoI, EL.manoI], p.linea);
  }
  function elBrazoLapiz() { return contorno(EL.brazoI, 1.8, { alfa: .9 }) + contorno(EL.manoI, 1.5, { alfa: .9 }) + rayas(EL.brazoI, 1.4, 3.8, 18, 1.1, { alfa: .5 }); }
  // líneas de construcción en lápiz azul ("I'm odds and ends, but I'm me")
  function boceto() {
    var o = { color: '#3d6fd0', alfa: .75, sola: true }, s = '';
    s += contorno(ovalo(824, 312, 38, 48, 14), 1.8, o) + trazo([[792, 312], [858, 312]], 1.4, o) + trazo([[826, 262], [818, 362]], 1.4, o);
    s += trazo([[764, 384], [880, 384]], 1.8, o) + trazo([[822, 366], [822, 450], [822, 520]], 1.8, o) + trazo([[798, 520], [848, 520]], 1.8, o);
    s += trazo([[808, 522], [806, 630], [806, 716]], 1.8, o) + trazo([[838, 522], [842, 630], [846, 716]], 1.8, o);
    s += trazo([[768, 388], [758, 470], [756, 548]], 1.8, o) + trazo([[876, 388], [886, 470], [888, 548]], 1.8, o);
    [[806, 630], [842, 630], [758, 470], [886, 470]].forEach(function (c) { s += contorno(ovalo(c[0], c[1], 9, 9, 8), 1.4, o); });
    s += contorno(ovalo(824, 742, 62, 8, 12), 1.4, o) + trazo([[870, 296], [912, 262]], 1.4, o) + trazo([[900, 258], [914, 261], [908, 274]], 1.4, o);
    return s;
  }
  // estrellitas de mareo cuando le pegan
  function mareo() {
    var s = '<svg viewBox="-60 -60 120 120"><g class="tm-orbita">';
    for (var i = 0; i < 3; i++) {
      var a = i / 3 * Math.PI * 2;
      s += '<path transform="translate(' + f(Math.cos(a) * 40) + ' ' + f(Math.sin(a) * 40) + ')" d="M0 -16 L4.4 -4.4 L16 0 L4.4 4.4 L0 16 L-4.4 4.4 L-16 0 L-4.4 -4.4Z" fill="#fff4b0" stroke="#1d1c1a" stroke-width="2.6" stroke-linejoin="round"/>';
    }
    return s + '</g></svg>';
  }

  // ---------------------------------------------------------------- la carrera (adentro de la viñeta)
  function pista() {
    var s = '', o = { alfa: .8 };
    s += '<rect x="290" y="86" width="1040" height="750" fill="#f7f5ef"/>';
    // sol, nubes y cerros
    s += contorno(ovalo(1160, 210, 42, 42, 14), 3, o);
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; s += trazo([[1160 + Math.cos(a) * 54, 210 + Math.sin(a) * 54], [1160 + Math.cos(a) * 74, 210 + Math.sin(a) * 74]], 2.6, o); }
    [[480, 230, 1], [820, 180, .8], [640, 300, .6]].forEach(function (n) {
      var nb = [];
      for (var k = 0; k <= 6; k++) nb.push([n[0] + (k - 3) * 30 * n[2], n[1] - Math.abs(Math.sin(k * 1.3)) * 18 * n[2] - (k % 2) * 10 * n[2]]);
      s += trazo(nb, 3, o) + trazo([[n[0] - 92 * n[2], n[1]], [n[0] + 92 * n[2], n[1] + 2]], 2.4, o);
    });
    var cerros = [[290, 448], [420, 404], [540, 424], [640, 386], [780, 414], [900, 392], [1040, 422], [1180, 398], [1330, 432], [1330, 470], [290, 470]];
    s += poli(cerros, '#e2ded6') + linea(cerros.slice(0, 9), 3, o) + rayas(cerros, .5, 7, 20, 1.3, { recta: true, alfa: .35 });
    // gradas con gente (cabecitas en garabato)
    s += poli([[290, 458], [1330, 458], [1330, 548], [290, 548]], '#cfcbc4') + linea([[290, 458], [1330, 460]], 3.4, o) + linea([[290, 548], [1330, 549]], 3.4, o);
    for (var r = 0; r < 3; r++) {
      for (var x = 300 + r * 9; x < 1325; x += rnd(17, 24)) {
        var y = 478 + r * 24 + rnd(-2, 2);
        s += contorno(ovalo(x, y, 6, 6.5, 6), 1.5, { alfa: .7, sola: true, partes: 2 }) + trazo([[x - 7, y + 14], [x, y + 8], [x + 7, y + 14]], 1.5, { alfa: .55 });
      }
    }
    // barandal
    s += linea([[290, 560], [1330, 562]], 3) + linea([[290, 578], [1330, 580]], 3);
    for (x = 300; x < 1330; x += 64) s += trazo([[x, 548], [x + 1, 590]], 2.4, o);
    // pista
    s += poli([[290, 590], [1330, 590], [1330, 836], [290, 836]], '#bdb9b2');
    s += rayas([[290, 600], [1330, 600], [1330, 836], [290, 836]], .02, 10, 80, 1.3, { recta: true, alfa: .3, prob: .7 });
    return s;
  }
  // franja que se desliza: bordillo a cuadros, rayas del piso y estelas de velocidad (el patrón se repite cada 140)
  function pistaMovil() {
    var s = '';
    for (var x = 290; x < 290 + 2100; x += 140) {
      s += poli([[x, 592], [x + 70, 592], [x + 70, 618], [x, 618]], '#2a2826', ' opacity=".85"') + poli([[x + 70, 592], [x + 140, 592], [x + 140, 618], [x + 70, 618]], '#f6f4ee');
      s += trazo([[x + 10, 712], [x + 80, 711]], 6, { alfa: .9, color: '#f7f5ef', jit: .4 });
      s += trazo([[x + rnd(0, 60), 650 + rnd(0, 30)], [x + 60 + rnd(0, 60), 652 + rnd(0, 30)]], 1.8, { alfa: .5 });
      s += trazo([[x + rnd(0, 60), 770 + rnd(0, 40)], [x + 70 + rnd(0, 60), 772 + rnd(0, 40)]], 2, { alfa: .5 });
    }
    s += linea([[290, 592], [2390, 592]], 3.2) + linea([[290, 618], [2390, 618]], 3);
    return s;
  }
  function estelas() {
    var s = '';
    for (var x = 290; x < 290 + 2100; x += 140) {
      for (var i = 0; i < 3; i++) {
        var y = rnd(110, 440), l = rnd(60, 130), x0 = x + rnd(0, 140 - 10);
        s += trazo([[x0, y], [x0 + l, y + rnd(-1, 1)]], rnd(1.6, 3), { alfa: rnd(.35, .7), punta: .4 });
      }
    }
    return s;
  }
  // moto clásica de carreras de los ochenta, de lado (mirando a la derecha). Encima van ellos dos con SUS MISMAS
  // CABEZAS (las de cuando están de pie, a 85 %): él manejando y, en "juntos", ella atrás abrazándolo con la mejilla
  // en su espalda y el pelo al viento. Los cuerpos sentados son tubos suaves (brazos, piernas, torso) con su ropa.
  // "rival": moto negra y un motociclista de casco con una llave de tuerca en alto.
  var MOTO_VB = '0 -230 660 570';
  var DEF_MOTO = '<defs><radialGradient id="tmRin" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f6f5f2"/><stop offset="1" stop-color="#a9a7a2"/></radialGradient>' +
    '<linearGradient id="tmCromo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#b9b7b2"/><stop offset=".55" stop-color="#eeedea"/><stop offset="1" stop-color="#7c7a76"/></linearGradient>' +
    '<linearGradient id="tmTanque" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2574a"/><stop offset=".45" stop-color="#ab2a22"/><stop offset="1" stop-color="#651510"/></linearGradient>' +
    '<linearGradient id="tmTanqueR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5754"/><stop offset=".45" stop-color="#2a2826"/><stop offset="1" stop-color="#121110"/></linearGradient>' +
    '<linearGradient id="tmMotor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d4cf"/><stop offset=".5" stop-color="#9a9893"/><stop offset="1" stop-color="#6a6864"/></linearGradient>' +
    '<linearGradient id="tmCuero" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4542"/><stop offset="1" stop-color="#1c1a19"/></linearGradient>' +
    '<linearGradient id="tmTraje" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55524e"/><stop offset="1" stop-color="#1e1c1b"/></linearGradient>' +
    '<linearGradient id="tmVientoP" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#2a1f1b"/><stop offset="1" stop-color="#2a1f1b" stop-opacity="0"/></linearGradient></defs>';
  // brazo, pierna o torso: un tubo suave a lo largo de una línea, con su grosor en cada punto
  function tubo(pts, anchos) {
    var m = muestrear(pts, false, 6), n = m.length, L = [], R = [];
    for (var i = 0; i < n; i++) {
      var a = m[Math.max(0, i - 1)], b = m[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      var t = i / (n - 1) * (anchos.length - 1), k = Math.min(anchos.length - 2, Math.floor(t)), w = (anchos[k] + (anchos[k + 1] - anchos[k]) * (t - k)) / 2;
      L.push([m[i][0] - dy / l * w, m[i][1] + dx / l * w]);
      R.push([m[i][0] + dy / l * w, m[i][1] - dx / l * w]);
    }
    return L.concat(R.reverse());
  }
  function pieza(pts, color) {
    var d = 'M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z';
    return '<path d="' + d + '" fill="' + color + '"/><path d="' + d + '" fill="none" stroke="#3a2c28" stroke-width="1.3" stroke-linejoin="round" opacity=".7"/>';
  }
  // cabezas en la moto: la de ella tal cual (mirando adelante, un poco recargada) y la de él volteada hacia adelante
  var CAB_ELLA = 'translate(298 -2) rotate(9) scale(.85) translate(-563 -364)', CAB_EL = 'translate(1062.4 -307.8) scale(-.85 .85)';
  var JINETE = {
    torso: [[302, 118], [322, 62], [344, 8]], cuello: [[350, 10], [358, -14]], brazo: [[348, 16], [392, 58], [428, 88]],
    brazoArriba: [[348, 14], [370, -30], [382, -78]], pierna: [[306, 120], [398, 136], [374, 212]]
  };
  var PASAJERA = { torso: [[232, 118], [262, 66], [288, 18]], cuello: [[292, 16], [298, -4]], brazo: [[288, 26], [310, 72], [334, 94]], pierna: [[238, 120], [306, 140], [286, 220]] };
  function rueda(cx, cy, delantera) {
    var s = '<path d="M' + (cx - 82) + ' ' + cy + 'a82 82 0 1 0 164 0a82 82 0 1 0 -164 0Z M' + (cx - 62) + ' ' + cy + 'a62 62 0 1 1 124 0a62 62 0 1 1 -124 0Z" fill="#2a2826" fill-rule="evenodd"/>';
    s += '<path d="M' + (cx - 76) + ' ' + (cy - 22) + ' A78 78 0 0 1 ' + (cx - 22) + ' ' + (cy - 76) + '" stroke="#64605b" stroke-width="5" fill="none" stroke-linecap="round"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="62" fill="url(#tmRin)"/><circle cx="' + cx + '" cy="' + cy + '" r="54" fill="#e6e4df" stroke="#8a8884" stroke-width="2"/>';
    if (delantera) {
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="38" fill="none" stroke="#b5b3ae" stroke-width="9"/>';
      for (var h = 0; h < 12; h++) { var b = h / 12 * Math.PI * 2; s += '<circle cx="' + f(cx + Math.cos(b) * 38) + '" cy="' + f(cy + Math.sin(b) * 38) + '" r="1.8" fill="#6a6864"/>'; }
    } else {
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="none" stroke="#6a6864" stroke-width="4" stroke-dasharray="3 2"/>';
    }
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2 - Math.PI / 2;
      s += '<path d="M' + f(cx + Math.cos(a) * 12) + ' ' + f(cy + Math.sin(a) * 12) + 'Q' + f(cx + Math.cos(a + .28) * 34) + ' ' + f(cy + Math.sin(a + .28) * 34) + ' ' + f(cx + Math.cos(a) * 55) + ' ' + f(cy + Math.sin(a) * 55) +
        '" stroke="#9c9a95" stroke-width="7" stroke-linecap="round" fill="none"/>';
    }
    if (delantera) s += poli([[cx + 26, cy + 14], [cx + 44, cy + 22], [cx + 36, cy + 42], [cx + 20, cy + 34]], '#3a3836');
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="url(#tmCromo)" stroke="#5a5652" stroke-width="2"/>';
    return s + contorno(ovalo(cx, cy, 82, 82, 18), 2.6, { alfa: .75 });
  }
  function resorte(x0, y0, x1, y1, vueltas, ancho) {
    var d = 'M' + f(x0) + ' ' + f(y0), dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    for (var i = 1; i <= vueltas * 2; i++) {
      var t = i / (vueltas * 2 + 1), lado = i % 2 ? 1 : -1;
      d += 'L' + f(x0 + dx * t + nx * ancho * lado) + ' ' + f(y0 + dy * t + ny * ancho * lado);
    }
    return '<path d="' + d + 'L' + f(x1) + ' ' + f(y1) + '" stroke="#d8d6d1" stroke-width="3" fill="none" stroke-linejoin="round"/>';
  }
  // amortiguador: cuerpo oscuro con un resorte cromado (espiras cortas inclinadas)
  function amortiguador(x0, y0, x1, y1, espiras, ancho) {
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * ancho, ny = dx / l * ancho, s = '<path d="M' + x0 + ' ' + y0 + 'L' + x1 + ' ' + y1 + '" stroke="#3a3836" stroke-width="8" stroke-linecap="round"/>';
    for (var i = 1; i < espiras; i++) {
      var t = .12 + i / espiras * .76, cx = x0 + dx * t, cy = y0 + dy * t;
      s += '<path d="M' + f(cx - nx + dx / l * 3) + ' ' + f(cy - ny + dy / l * 3) + 'L' + f(cx + nx - dx / l * 3) + ' ' + f(cy + ny - dy / l * 3) + '" stroke="#e4e2dd" stroke-width="3.2" stroke-linecap="round"/>';
    }
    return s;
  }
  function moto(op) {
    op = op || {};
    var s = DEF_ELLA + DEF_EL + DEF_MOTO, o = { alfa: .7 }, J = JINETE, P = PASAJERA, pe = PAL_EL.color, E = ELLA;
    var tanque = [[338, 128], [352, 106], [398, 94], [444, 98], [470, 112], [466, 134], [432, 146], [352, 150]];
    var cola = [[186, 130], [222, 122], [228, 146], [196, 148], [178, 142]];
    var asiento = [[218, 122], [342, 118], [352, 132], [336, 140], [226, 142]];
    var carter = [[340, 206], [452, 200], [460, 240], [432, 268], [350, 270], [322, 248]];
    var cilindro = [[368, 152], [438, 150], [446, 206], [376, 214]];
    var salpicadera = [[478, 182], [520, 164], [566, 170], [592, 194], [576, 198], [530, 180], [490, 192]];
    var horquilla = [[470, 112], [484, 108], [538, 246], [524, 252]];
    var mofle = [[302, 272], [304, 292], [168, 256], [164, 238]];
    var tronco, brazo, pierna;
    // ella: el pelo que vuela con el viento y el de atrás (detrás de todo)
    if (op.juntos) {
      var viento = [[272, -40], [246, -50], [216, -46], [190, -54], [160, -50], [176, -42], [150, -36], [182, -30], [158, -20], [196, -20], [222, -12], [250, -8], [274, 0]];
      s += relleno(viento, 'url(#tmPelo)') + contornosFinos([viento]);
      s += '<path d="M266 -36 Q234 -44 206 -40 Q184 -38 166 -46 M268 -24 Q236 -30 204 -28 Q184 -27 162 -32 M266 -12 Q238 -16 212 -16" stroke="#6e5850" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>';
      s += '<g transform="' + CAB_ELLA + '">' + relleno(E.pelo, 'url(#tmPelo)') + '</g>';
    }
    // atrás: salpicadera, rueda, basculante, cadena y amortiguador
    s += '<path d="M84 196 Q118 160 176 160 Q214 164 232 186" stroke="#2a2826" stroke-width="10" fill="none" stroke-linecap="round"/>';
    s += rueda(150, 250, false);
    s += poli([[334, 226], [344, 246], [160, 262], [150, 242]], 'url(#tmMotor)');
    s += '<path d="M150 226 L330 230 M150 274 L330 252" stroke="#3a3836" stroke-width="3" stroke-dasharray="5 3"/>';
    s += amortiguador(290, 152, 214, 228, 9, 9);
    // motor: cárter, cilindros con aletas, tapas cromadas, carburador
    s += relleno(carter, 'url(#tmMotor)') + relleno(cilindro, 'url(#tmMotor)');
    for (var y = 158; y <= 206; y += 7) s += '<path d="M' + f(370 + (y - 150) * .14) + ' ' + y + ' L' + f(440 + (y - 150) * .12) + ' ' + y + '" stroke="#5a5854" stroke-width="2"/>';
    s += poli([[362, 140], [442, 138], [442, 152], [366, 154]], 'url(#tmCromo)');
    s += '<circle cx="364" cy="240" r="24" fill="url(#tmCromo)" stroke="#6a6864" stroke-width="2"/><circle cx="436" cy="236" r="17" fill="url(#tmCromo)" stroke="#6a6864" stroke-width="2"/>';
    s += poli([[326, 162], [360, 158], [362, 190], [328, 192]], '#6e6c68') + '<circle cx="320" cy="176" r="11" fill="url(#tmCromo)"/>';
    s += rayas(carter, .9, 6, 20, 1.2, { alfa: .2 }) + contorno(carter, 2, o) + caja(cilindro, 2, { alfa: .6, over: 2, sola: true });
    // escape: tubos del motor por abajo y mofle cromado
    s += '<path d="M440 196 Q462 240 432 274 Q396 292 310 284" stroke="url(#tmCromo)" stroke-width="12" fill="none" stroke-linecap="round"/>';
    s += poli(mofle, 'url(#tmCromo)') + caja(mofle, 2, { alfa: .6, over: 2, sola: true }) + '<ellipse cx="166" cy="247" rx="4" ry="9" fill="#3a3836"/>';
    // chasis
    s += '<path d="M468 138 L432 206 M352 128 L318 176 L318 232 M470 118 L352 126" stroke="#3a3836" stroke-width="7" stroke-linecap="round" fill="none"/>';
    // adelante: rueda, horquilla cromada y salpicadera
    s += rueda(530, 250, true);
    s += poli(horquilla, 'url(#tmCromo)') + poli([[506, 196], [522, 192], [538, 246], [524, 252]], '#3a3836') + caja(horquilla, 2, { alfa: .6, over: 2, sola: true });
    s += relleno(salpicadera, op.rival ? '#2a2826' : '#ab2a22') + contorno(salpicadera, 2, o);
    // cola corta con calavera, tapa lateral con el número y asiento
    s += relleno(cola, op.rival ? 'url(#tmTanqueR)' : 'url(#tmTanque)') + poli([[172, 132], [184, 130], [186, 144], [174, 146]], '#ff4a3a') + contorno(cola, 2, o);
    s += relleno([[236, 152], [302, 150], [308, 182], [246, 186]], '#f4f2ee') + trazo([[262, 160], [282, 160], [268, 180]], 3.4) + trazo([[258, 170], [272, 170]], 2);
    s += relleno(asiento, 'url(#tmCuero)') + '<path d="M228 126 Q290 120 338 122" stroke="#8a8682" stroke-width="2.4" fill="none" opacity=".7"/>';
    // ella: torso (suéter), vestido y cuello
    if (op.juntos) {
      tronco = tubo(P.torso, [46, 42, 34]);
      s += pieza(tronco, 'url(#tmSueter)') + relleno(ovalo(288, 20, 18, 14, 10), '#ece6da');
      s += '<path d="M262 66 Q248 96 236 118" stroke="#bdb3a3" stroke-width="2" fill="none" opacity=".8"/>';
      s += pieza(tubo(P.cuello, [13, 12]), '#e0b597');
    }
    // tanque rojo con su franja y tapón
    s += relleno(tanque, op.rival ? 'url(#tmTanqueR)' : 'url(#tmTanque)');
    s += '<path d="M352 120 Q400 104 462 116" stroke="#fbfaf6" stroke-width="5" fill="none" opacity=".9"/><path d="M362 112 Q400 100 440 104" stroke="#fff" stroke-width="3" fill="none" opacity=".45"/>';
    s += '<ellipse cx="420" cy="99" rx="9" ry="3" fill="url(#tmCromo)"/>' + contorno(tanque, 2.2, o);
    // él (o el rival): torso, cuello y cabeza
    tronco = tubo(J.torso, [54, 52, 46]);
    if (op.rival) {
      s += pieza(tronco, 'url(#tmTraje)') + relleno(ovalo(344, 10, 24, 18, 10), '#2e2c2a') + '<path d="M304 108 Q326 60 346 14" stroke="#9a9894" stroke-width="2.4" fill="none" opacity=".7"/>';
      var casco = ovalo(356, -48, 36, 38, 16);
      s += relleno(casco, '#2a2826') + poli([[362, -64], [392, -56], [392, -36], [366, -40]], '#7c8a9a') + '<path d="M326 -74 Q354 -92 384 -72" stroke="#fbfaf6" stroke-width="4" fill="none"/>' + contorno(casco, 2.4, o);
    } else {
      s += pieza(tronco, 'url(#tmChaq)') + relleno(ovalo(346, 12, 25, 18, 10), '#7e5844');
      s += poli([[356, 8], [369, 14], [348, 68], [340, 64]], pe.play) + '<path d="M300 104 Q318 64 336 24" stroke="#4c3326" stroke-width="2" fill="none" opacity=".6"/>';
      s += pieza(tubo(J.cuello, [19, 17]), pe.piel2);
      s += '<g transform="' + CAB_EL + '">' + cabezaEl(pe) + finos([EL.pelo, EL.fleco, EL.cara], pe.linea) + '</g>';
    }
    // la cabeza de ella, recargada en su espalda, y su brazo abrazándolo
    if (op.juntos) {
      s += '<g transform="' + CAB_ELLA + '">' + relleno(E.cuello, '#e0b597') + relleno(E.mechon, 'url(#tmPelo)') + relleno(E.cara, 'url(#tmPiel)') + rasgosElla() +
        relleno(E.coronilla, 'url(#tmPelo)') + relleno(E.flequilloI, '#2b201c') + relleno(E.flequilloD, '#2b201c') +
        '<path d="M552 296 Q560 291 570 293" stroke="#6a5048" stroke-width="1.6" fill="none" opacity=".7"/>' + contornosFinos([E.pelo, E.cara, E.mechon]) + '</g>';
      brazo = tubo(P.brazo, [16, 14, 12]);
      s += relleno(ovalo(338, 96, 8, 6.5, 10), '#ecc7ab') + pieza(brazo, 'url(#tmSueter)') + '<path d="M326 88 L334 99" stroke="#bdb3a3" stroke-width="2"/>';
      // su pierna (medias oscuras), botín y el vestido encima
      pierna = tubo(P.pierna, [28, 20, 14]);
      s += pieza(pierna, '#2c2833') + pieza([[276, 212], [296, 214], [308, 228], [302, 236], [272, 234]], '#3d322c');
      s += pieza([[214, 106], [246, 100], [300, 126], [312, 146], [296, 154], [236, 140], [214, 124]], 'url(#tmVest)');
      s += rayas(pierna, 1.2, 4, 16, 1.1, { alfa: .3 });
    }
    // pierna de él: jeans y bota sobre el estribo
    pierna = tubo(J.pierna, [34, 26, 20]);
    s += pieza(pierna, op.rival ? 'url(#tmTraje)' : 'url(#tmJean)') + pieza([[362, 202], [384, 206], [404, 220], [402, 232], [360, 232]], op.rival ? '#1c1a19' : pe.bota);
    if (!op.rival) s += '<path d="M318 128 Q360 132 392 136" stroke="#c9a25a" stroke-width="1.2" fill="none" opacity=".7"/>';
    s += rayas(pierna, .4, 5, 20, 1.1, { alfa: .25 });
    // manubrio, faro, tablero y espejo
    s += '<path d="M478 102 L452 94 L432 96" stroke="#2a2826" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M462 92 L452 58" stroke="#5a5854" stroke-width="2.4"/>' +
      '<ellipse cx="450" cy="54" rx="11" ry="7" fill="url(#tmCromo)" stroke="#3a3836" stroke-width="2"/><circle cx="472" cy="88" r="9" fill="#f4f2ee" stroke="#3a3836" stroke-width="2"/>';
    s += '<circle cx="500" cy="114" r="24" fill="url(#tmCromo)" stroke="#3a3836" stroke-width="2.4"/><circle cx="502" cy="114" r="17" fill="#fffbe6"/><path d="M494 106 Q500 101 507 104" stroke="#fff" stroke-width="3" fill="none"/>';
    // brazo de él con la mano en el puño del manubrio (o el del rival con la llave de tuerca)
    if (op.rival) {
      brazo = tubo(J.brazoArriba, [20, 17, 14]);
      var llave = [[376, -82], [388, -84], [404, -170], [392, -172]], boca = [[386, -170], [376, -192], [392, -204], [398, -188], [410, -194], [416, -178], [406, -166]];
      s += relleno(llave, 'url(#tmCromo)') + relleno(boca, 'url(#tmCromo)') + caja(llave, 2, { alfa: .8, over: 2, sola: true }) + contorno(boca, 2, o);
      s += pieza(brazo, 'url(#tmTraje)') + relleno(ovalo(382, -80, 10, 10, 8), '#1c1a19');
    } else {
      brazo = tubo(J.brazo, [21, 18, 14]);
      s += pieza(brazo, 'url(#tmChaq)') + relleno(ovalo(434, 92, 9.5, 8, 10), pe.piel2) + '<path d="M428 86 Q436 84 442 90" stroke="#a87c64" stroke-width="1.2" fill="none"/>';
      s += '<path d="M420 82 L432 92" stroke="#4c3326" stroke-width="2.4"/>';
    }
    s += rayas(tronco, .5, 6, 22, 1.1, { alfa: op.rival ? .4 : .2 });
    // rayas de velocidad detrás
    for (var i = 0; i < 7; i++) s += trazo([[-10 + rnd(0, 50), -40 + i * 46], [70 + rnd(0, 60), -38 + i * 46]], 2.4, { alfa: .55 });
    return s;
  }

  // ---------------------------------------------------------------- viñeta chica: él volteando a verla y guiñando el ojo
  var GUINO_BB = [1170, 34, 340, 282];
  function guino() {
    var s = DEF_ELLA + DEF_EL, o = { alfa: .9 }, p = PAL_EL.color;
    s += '<rect x="4" y="4" width="332" height="274" fill="#fbfaf6"/><rect x="20" y="20" width="300" height="242" fill="#d3cfc8"/>';
    s += rayas([[20, 20], [320, 20], [320, 262], [20, 262]], -.75, 8, 40, 1.4, { recta: true, alfa: .3 });
    for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; s += trazo([[170 + Math.cos(a) * 128, 150 + Math.sin(a) * 116], [170 + Math.cos(a) * 190, 150 + Math.sin(a) * 180]], 2, { alfa: .3 }); }
    var cara = [[124, 126], [130, 98], [148, 82], [170, 77], [192, 82], [210, 98], [216, 126], [214, 158], [206, 188], [190, 210], [170, 218], [150, 210], [134, 188], [126, 158]];
    var pelo = [[118, 130], [114, 98], [124, 70], [146, 54], [174, 48], [202, 54], [222, 70], [230, 98], [224, 130], [216, 106], [206, 90], [186, 82], [160, 82], [140, 88], [126, 104]];
    var fleco = [[196, 76], [172, 80], [148, 92], [130, 110], [122, 130], [134, 116], [150, 102], [172, 92], [200, 88]];
    var chaqI = [[20, 262], [36, 244], [92, 226], [146, 236], [160, 262]], chaqD = [[180, 262], [194, 236], [248, 226], [304, 244], [320, 262]];
    s += relleno([[150, 206], [148, 244], [192, 244], [190, 206]], p.piel2) + '<path d="M150 214 Q170 230 190 214 L190 226 Q170 240 150 226Z" fill="' + p.sombra + '"/>';
    s += relleno([[140, 236], [170, 252], [200, 236], [200, 262], [140, 262]], p.play) + relleno(chaqI, p.chaq) + relleno(chaqD, p.chaq);
    s += relleno(cara, p.piel) + relleno([[124, 128], [114, 132], [113, 152], [124, 162]], p.piel2) + relleno([[216, 128], [226, 132], [227, 152], [216, 162]], p.piel2);
    s += relleno(pelo, p.pelo) + relleno(fleco, p.pelo);
    s += '<path d="M132 76 Q160 58 196 62 M140 92 Q168 78 204 84" stroke="' + p.mechon + '" stroke-width="2.4" fill="none" opacity=".5"/><path d="M146 68 Q170 56 196 60" stroke="' + p.brillo + '" stroke-width="4" fill="none" opacity=".6"/>';
    // ojo abierto, guiño, cejas, nariz y sonrisa
    s += '<path d="M133 140 Q148 129 163 139.4 Q148 148 133 140Z" fill="#fbfaf6"/><circle cx="148" cy="139.4" r="6.4" fill="' + p.iris + '"/><circle cx="150.4" cy="137.2" r="2.2" fill="#fff"/>' +
      '<path d="M133 140 Q148 129 163 139.4" stroke="' + p.iris + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M178 141 Q192 149 207 140" stroke="' + p.iris + '" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M180 141.6 l-4 -3 M205 140.6 l4 -3.4" stroke="' + p.iris + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M133 123 Q146 115 162 120" stroke="' + p.ceja + '" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M178 117 Q194 108 209 116" stroke="' + p.ceja + '" stroke-width="4.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M171 142 Q166 164 162 171 Q170 176 178 171" stroke="' + p.nariz + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M145 186 Q170 204 196 184" stroke="' + p.boca + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M196 184 l5 -3" stroke="' + p.boca + '" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M160 197 Q170 202 182 196" stroke="' + p.labio + '" stroke-width="2.4" fill="none" opacity=".8"/>';
    s += finos([cara, pelo, chaqI, chaqD], p.linea);
    [cara, pelo].forEach(function (q) { s += contorno(q, 2.6, o); });
    s += rayas(pelo, -.4, 4, 26, 1.6, { alfa: .5 }) + rayas(chaqI, 1.1, 5, 22, 1.4, { alfa: .5 }) + rayas(chaqD, 1.1, 5, 22, 1.4, { alfa: .5 }) + linea(chaqI, 2.4, o) + linea(chaqD, 2.4, o);
    [[[126, 72], [122, 54], [142, 60]], [[150, 56], [154, 40], [172, 52]], [[178, 52], [194, 40], [200, 58]], [[208, 60], [226, 54], [224, 74]]].forEach(function (m) { s += relleno(m, p.pelo) + trazo(m, 2, { alfa: .75, over: 0 }); });
    s += caja([[4, 4], [336, 4], [336, 278], [4, 278]], 4.6, { over: 7 }) + caja([[20, 20], [320, 20], [320, 262], [20, 262]], 4, { over: 6 });
    return s;
  }

  // ---------------------------------------------------------------- efectos
  function lineasFoco() {
    var s = '';
    for (var i = 0; i < 64; i++) {
      var a = i / 64 * Math.PI * 2 + rnd(-.03, .03), r0 = rnd(560, 640), r1 = rnd(900, 1000);
      s += trazo([[800 + Math.cos(a) * r1, 450 + Math.sin(a) * r1 * .62], [800 + Math.cos(a) * r0, 450 + Math.sin(a) * r0 * .62]], rnd(3, 7), { punta: .3, alfa: .75 });
    }
    return s;
  }
  function arrugas() {
    var s = '', cols = 9, filas = 6, g = [];
    for (var j = 0; j <= filas; j++) {
      g.push([]);
      for (var i = 0; i <= cols; i++) g[j].push([i * 1600 / cols + (i % cols ? rnd(-60, 60) : 0), j * 900 / filas + (j % filas ? rnd(-50, 50) : 0)]);
    }
    for (j = 0; j < filas; j++) {
      for (i = 0; i < cols; i++) {
        var a = g[j][i], b = g[j][i + 1], c = g[j + 1][i + 1], d = g[j + 1][i];
        s += poli([a, b, c], rnd(0, 1) < .5 ? '#3a3632' : '#ffffff', ' opacity="' + rnd(.04, .2).toFixed(2) + '"');
        s += poli([a, c, d], rnd(0, 1) < .5 ? '#3a3632' : '#ffffff', ' opacity="' + rnd(.04, .2).toFixed(2) + '"');
        s += '<path d="M' + f(a[0]) + ' ' + f(a[1]) + 'L' + f(c[0]) + ' ' + f(c[1]) + '" stroke="#5a554e" stroke-width="2" opacity=".35"/>';
      }
    }
    for (var k = 0; k < 14; k++) {
      var p = [[rnd(0, 1600), rnd(0, 900)]];
      for (var q = 0; q < 4; q++) p.push([p[q][0] + rnd(-260, 260), p[q][1] + rnd(-160, 160)]);
      var dd = 'M' + p.map(function (z) { return f(z[0]) + ' ' + f(z[1]); }).join('L');
      s += '<path d="' + dd + '" fill="none" stroke="#4a4540" stroke-width="2.4" opacity=".4"/><path d="' + dd + '" fill="none" stroke="#fff" stroke-width="2" opacity=".7" transform="translate(2 2)"/>';
    }
    return s;
  }
  function corazon() {
    var c = [[30, 50], [10, 32], [4, 18], [11, 7], [23, 6], [30, 14], [37, 6], [49, 7], [56, 18], [50, 32]];
    return relleno(c, '#d8322a', ' opacity=".92"') + rayas(c, -.8, 3.4, 12, 1.2, { alfa: .45, color: '#7a1410' }) + contorno(c, 2.6, { alfa: .95 }) +
      trazo([[16, 14], [20, 11]], 2.4, { color: '#fff', alfa: .9 });
  }
  // el reloj que gira ("in a day or two")
  function reloj() {
    var s = '<svg viewBox="-60 -60 120 120"><circle r="50" fill="#fbfaf6"/>', o = { alfa: .95 };
    semilla = 77;
    s += contorno(ovalo(0, 0, 50, 50, 14), 3.4, o) + contorno(ovalo(0, 0, 44, 44, 14), 1.4, { alfa: .5, sola: true });
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; s += trazo([[Math.cos(a) * 36, Math.sin(a) * 36], [Math.cos(a) * 42, Math.sin(a) * 42]], i % 3 ? 2 : 3.4); }
    s += '<g class="aguja-h">' + trazo([[0, 4], [0, -24]], 4.4, { punta: .2 }) + '</g><g class="aguja-m">' + trazo([[0, 4], [0, -36]], 3, { punta: .2 }) + '</g><circle r="3.4" fill="' + TINTA + '"/>';
    return s + '</svg>';
  }

  // pedazos del marco que salen volando cuando se rompe
  function pedazos() {
    var piezas = [], cortes = [0, .22, .41, .63, .8, 1];
    for (var lado = 0; lado < 4; lado++) {
      var A = EXT[lado], B = EXT[(lado + 1) % 4], C = INT[lado], D = INT[(lado + 1) % 4];
      for (var k = 0; k < cortes.length - 1; k++) {
        var t0 = cortes[k], t1 = cortes[k + 1];
        var e0 = [A[0] + (B[0] - A[0]) * t0, A[1] + (B[1] - A[1]) * t0], e1 = [A[0] + (B[0] - A[0]) * t1, A[1] + (B[1] - A[1]) * t1];
        var i0 = [C[0] + (D[0] - C[0]) * t0, C[1] + (D[1] - C[1]) * t0], i1 = [C[0] + (D[0] - C[0]) * t1, C[1] + (D[1] - C[1]) * t1];
        piezas.push({ p: [e0, e1, i1, i0], lado: lado });
      }
    }
    return piezas;
  }
  function grietas() {
    semilla = 91;
    var g = '', inicios = [[[700, 106], [690, 80], [712, 62]], [[314, 470], [290, 452], [270, 476]], [[1290, 520], [1316, 506], [1340, 530]], [[900, 804], [912, 830], [896, 852]]];
    inicios.forEach(function (c, n) {
      var p = c.slice(), dir = [c[2][0] - c[0][0], c[2][1] - c[0][1]], l = Math.hypot(dir[0], dir[1]);
      var hacia = [-dir[0] / l, -dir[1] / l], x = c[0][0], y = c[0][1], pts = [[x, y]];
      for (var i = 0; i < 6; i++) { x += hacia[0] * rnd(30, 60) + rnd(-26, 26); y += hacia[1] * rnd(30, 60) + rnd(-26, 26); pts.push([x, y]); }
      var dd = 'M' + p.concat(pts.slice(1)).map(function (z) { return f(z[0]) + ' ' + f(z[1]); }).join('L');
      g += '<g class="tm-grieta g' + (n + 1) + '"><path pathLength="1" d="' + dd + '" stroke="' + TINTA + '" stroke-width="4" fill="none" stroke-linejoin="round"/>' +
        '<path pathLength="1" d="M' + f(pts[2][0]) + ' ' + f(pts[2][1]) + 'l' + f(rnd(-50, 50)) + ' ' + f(rnd(-50, 50)) + 'l' + f(rnd(-30, 30)) + ' ' + f(rnd(-30, 30)) + '" stroke="' + TINTA + '" stroke-width="2.6" fill="none"/></g>';
    });
    return '<svg viewBox="0 0 1600 900" preserveAspectRatio="none">' + g + '</svg>';
  }

  // ---------------------------------------------------------------- armar la escena
  function construir() {
    construida = true;
    el('div', 'tm-mesa');
    var mundo = el('div', 'tm-mundo'), hoja = el('div', 'tm-hoja', '', mundo), cam = el('div', 'tm-camara', '', hoja);
    capa('tm-papel', [0, 0, 1600, 900], papel, 1, cam, 1);
    el('div', 'tm-rayos', '', cam);
    capa('tm-margen', [0, 0, 1600, 900], margen, 3, cam, 2);
    capa('tm-foco', [0, 0, 1600, 900], lineasFoco, 3, cam, 3);

    // adentro de la viñeta: un recorte rectangular del tamaño del marco (lo que sobra lo tapa el borde blanco).
    // Rectangular y no con la forma de la viñeta: un recorte con forma obliga a la tarjeta de video a pintar
    // todo lo de adentro en una capa aparte en cada cuadro.
    function recorte(clase) { return el('div', 'tm-recorte-in', '', el('div', 'tm-recorte ' + clase, '', cam)); }
    el('div', 'tm-sombra-hoja', '', hoja);
    var adentro = recorte('tm-dentro');
    var gCuarto = el('div', 'tm-g-cuarto', '', adentro);
    capa('tm-cuarto', [290, 86, 1040, 750], cuarto, 3, gCuarto, 4);
    capa('tm-sombra-ella', [380, 260, 200, 470], ellaSombra, 1, gCuarto, 5);
    var gPista = el('div', 'tm-g-pista', '', adentro);
    capa('tm-pista', [290, 86, 1040, 750], pista, 3, gPista, 6);
    capa('tm-pista-movil', [290, 586, 2100, 250], pistaMovil, 1, gPista, 7);
    capa('tm-estelas', [290, 100, 2100, 360], estelas, 1, gPista, 8);
    var rival = capa('tm-rival r1', [150, 96, 660, 570], function () { return moto({ rival: true }); }, 3, gPista, 9, MOTO_VB);
    copia('tm-rival r2', [-40, 80, 660, 570], urlsDe(rival), gPista);
    capa('tm-moto solo', [520, 122, 726, 627], function () { return moto(); }, 3, gPista, 10, MOTO_VB);
    capa('tm-moto juntos', [520, 122, 726, 627], function () { return moto({ juntos: true }); }, 3, gPista, 11, MOTO_VB);

    // él: el grupo se acomoda según la parte de la canción y adentro "mueve" tiene los tropiezos y los golpes.
    // El brazo con el que le da la mano va detrás del cuerpo (es el del lado de atrás) y gira desde el hombro.
    var gEl = el('div', 'tm-el', '', recorte('tm-el-rec')), mueve = el('div', 'tm-el-mueve', '', gEl);
    var brazoEl = el('div', 'tm-el-brazo', '', mueve);
    capa('tm-el-color', EL_BRAZO_BB, function () { return elBrazo('color'); }, 1, brazoEl, 16);
    capa('tm-el-lapiz', EL_BRAZO_BB, elBrazoLapiz, 3, brazoEl, 17);
    capa('tm-el-color', EL_BB, function () { return elFigura('color'); }, 1, mueve, 13);
    capa('tm-el-lapiz', EL_BB, elLapiz, 3, mueve, 14);
    capa('tm-boceto', [740, 250, 200, 505], boceto, 1, mueve, 18);
    ubicar(el('div', 'tm-mareo', mareo(), mueve), [762, 196, 140, 90]);

    // el marco de la viñeta, sus grietas y la viñetita del guiño
    capa('tm-marco', [236, 50, 1124, 828], marco, 3, cam, 19);
    var trazoMarco = el('div', 'tm-trazo-marco', '<svg viewBox="0 0 1600 900" preserveAspectRatio="none">' +
      '<path pathLength="1" d="M' + EXT.map(function (p) { return p.join(' '); }).join('L') + 'Z" stroke="' + TINTA + '" stroke-width="5" fill="none"/>' +
      '<path pathLength="1" d="M' + INT.map(function (p) { return p.join(' '); }).join('L') + 'Z" stroke="' + TINTA + '" stroke-width="5" fill="none"/></svg>', cam);
    trazoMarco.setAttribute('aria-hidden', 'true');
    el('div', 'tm-grietas', grietas(), cam);
    var gPedazos = el('div', 'tm-pedazos', '', cam);
    semilla = 55;
    pedazos().forEach(function (pz, i) {
      var xs = pz.p.map(function (p) { return p[0]; }), ys = pz.p.map(function (p) { return p[1]; });
      var bb = [Math.min.apply(0, xs) - 6, Math.min.apply(0, ys) - 6, Math.max.apply(0, xs) - Math.min.apply(0, xs) + 12, Math.max.apply(0, ys) - Math.min.apply(0, ys) + 12];
      var cx = bb[0] + bb[2] / 2, cy = bb[1] + bb[3] / 2, dx = (cx - 800) * rnd(.5, 1.1), dy = (cy - 450) * rnd(.6, 1.3) + rnd(-80, 80);
      var d = ubicar(el('div', 'tm-pedazo', '<svg viewBox="' + bb.join(' ') + '" preserveAspectRatio="none">' + poli(pz.p, '#fbfaf6') +
        caja(pz.p, 4, { sola: true, over: 3 }) + '</svg>', gPedazos), bb);
      d.style.setProperty('--dx', f(dx));
      d.style.setProperty('--dy', f(dy));
      d.style.setProperty('--g', f(rnd(-200, 200)) + 'deg');
      d.style.setProperty('--k', i);
    });
    capa('tm-guino', GUINO_BB, guino, 3, cam, 20, '0 0 340 282');

    // ella (afuera es grande y a color; adentro, chiquita en el cuarto y con contorno de lápiz)
    var gElla = el('div', 'tm-ella', '', cam);
    capa('tm-ch-color', ELLA_BB, ellaColor, 1, gElla, 21);
    capa('tm-ch-rubor', ELLA_BB, ellaRubor, 1, gElla, 22);
    capa('tm-ch-lapiz', ELLA_BB, ellaLapiz, 3, gElla, 23);
    var brazoElla = el('div', 'tm-ch-brazo', '', gElla);
    capa('tm-ch-color', BRAZO_BB, ellaBrazoColor, 1, brazoElla, 24);
    capa('tm-ch-lapiz', BRAZO_BB, ellaBrazoLapiz, 3, brazoElla, 25);

    ubicar(el('div', 'tm-reloj', reloj(), cam), [338, 120, 150, 150]);

    // corazones de lápiz
    var urlCor = imagen('0 0 60 56', (semilla = 33, corazon()));
    var cors = el('div', 'tm-corazones', '', cam);
    semilla = 41;
    for (var i = 0; i < 14; i++) {
      var c = copia('tm-cor', [rnd(620, 800), rnd(340, 540), 60, 56], [urlCor], cors);
      c.style.setProperty('--d', f(rnd(0, 3.5)) + 's');
      c.style.setProperty('--s', f(rnd(.6, 1.3)));
      c.style.setProperty('--sx', f(rnd(-60, 60)));
    }
    // globos de diálogo y onomatopeyas
    // (los de él van a la derecha de su cabeza, con la colita hacia la izquierda)
    var globos = [['puntos', '…', 1004, 152, 1], ['corazon-globo', '♥', 1004, 152, 1], ['ok', 'OK?', 1004, 152, 1], ['needless', '…', 872, 232, 1],
      ['canta', '♪ ♫', 500, 236], ['safe1', '♥', 506, 236], ['safe2', '♥', 876, 232, 1]];
    globos.forEach(function (g) { ubicar(el('div', 'tm-globo tm-gl-' + g[0] + (g[4] ? ' tm-gl-izq' : ''), '<span>' + g[1] + '</span>', cam), [g[2], g[3], 0, 0]); });
    var onos = [['vroom', 'VROOM!', 1000, 250, -8], ['zoom', 'ZOOM!', 430, 240, 6], ['clang', 'CLANG!', 560, 300, -10], ['bam', 'BAM!', 820, 300, 8],
      ['crunch', 'CRUNCH!', 800, 470, -6], ['thud1', 'BAM!', 1236, 214, -12], ['thud2', 'THUD!', 1300, 640, 10], ['crash', 'CRASH!', 800, 200, -4]];
    onos.forEach(function (o) {
      var d = ubicar(el('div', 'tm-ono tm-on-' + o[0], '<span>' + o[1] + '</span>', cam), [o[2], o[3], 0, 0]);
      d.style.setProperty('--r', o[4] + 'deg');
    });
    // título del principio y "the end"
    ubicar(el('div', 'tm-titulo', '<b>TAKE ON ME</b><i>a-ha</i>', cam), [800, 430, 0, 0]);
    ubicar(el('div', 'tm-fin', '<span>THE END</span><em>♥</em>', cam), [1250, 250, 0, 0]);
    capa('tm-arrugas', [0, 0, 1600, 900], arrugas, 1, hoja, 30);
    el('div', 'tm-luz', '', escena);
    elFlash = el('div', 'tm-flash', '', escena);
    // grano de papel (una sola capa quieta)
    var cv = document.createElement('canvas');
    cv.width = cv.height = 220;
    var cx = cv.getContext('2d');
    semilla = 3;
    for (i = 0; i < 2600; i++) { cx.fillStyle = rnd(0, 1) < .55 ? 'rgba(40,36,32,.5)' : 'rgba(255,255,255,.6)'; cx.fillRect(rnd(0, 220), rnd(0, 220), rnd(.6, 1.6), rnd(.6, 1.6)); }
    el('div', 'tm-grano').style.backgroundImage = 'url(' + cv.toDataURL() + ')';
  }

  function flash() {
    elFlash.classList.remove('on');
    void elFlash.offsetWidth;
    elFlash.classList.add('on');
  }

  // ---------------------------------------------------------------- la escena sigue la letra
  var lineas = [];
  (window.LETRA_TAKEONME_LRC || '').split(/\r?\n/).forEach(function (l) {
    var m = l.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (m) lineas.push({ t: +m[1] * 60 + +m[2], texto: m[3].trim().toLowerCase() });
  });
  function reaccionar() {
    if (!activa) return;
    var t = audio.currentTime, x = '';
    for (var i = 0; i < lineas.length; i++) { if (lineas[i].t <= t) x = lineas[i].texto; else break; }
    var e = {
      'dibuja': t < 2.4,
      'titulo': t >= 2 && t < 13,
      'carrera': (t >= 2.4 && t < 27) || (t >= 91.14 && t < 131.5),
      'juntos': t >= 91.14 && t < 131.5,
      'persecucion': t >= 116 && t < 131.5,
      'vroom': (t >= 7.5 && t < 11) || (t >= 91.4 && t < 94.6),
      'zoom': (t >= 17.5 && t < 20.5) || (t >= 118 && t < 121),
      'guino': t >= 28.6 && t < 51.39,
      'ella-fuera': (t >= 23.5 && t < 59.6) || t >= 139,
      'ella-dentro': t >= 59.6 && t < 91.14,
      'puntos': /don't know what/.test(x),
      'corazon-globo': /say it anyway/.test(x),
      'busca': /another day/.test(x),
      'rubor': /shying away/.test(x),
      'ok': /okay\?/.test(x),
      'mano-on': t >= 51.39 && t < 59.6,
      'toma': t >= 56.96 && t < 59.6,
      'jala': t >= 59.2 && t < 60.4,
      'gone': /i'll be gone/.test(x),
      'reloj': /in a day/.test(x),
      'needless': /needless/.test(x),
      'boceto': /odds and ends/.test(x),
      'tropieza': /stumbling/.test(x),
      'luz': (t >= 82.57 && t < 91.14) || t >= 181.93,
      'canta': /say after me/.test(x),
      'safe': /safe than sorry/.test(x),
      'rayos-on': (t >= 51.39 && t < 73.74) || (t >= 91.14 && t < 115.97) || t >= 171.2,
      'clang': t >= 124.5 && t < 127,
      'golpe': t >= 131 && t < 132.4,
      'arruga': t >= 131.6 && t < 136.5,
      'alisa': t >= 136.5 && t < 146,
      'mesa': t >= 131.6 && t < 139,
      'caido': t >= 131.6 && t < 147,
      'atrapado': t >= 150.5 && t < 171.2,
      'grieta1': t >= 157.37, 'grieta2': t >= 162.23, 'grieta3': t >= 165.6, 'grieta4': t >= 168.53,
      'rompe': t >= 171.2,
      'real': t >= 171.8,
      'manos': t >= 177.31,
      'fiesta': t >= 181.93,
      'fin': t >= 209
    };
    e.cuarto = !e.carrera && t >= 2.4;
    e.chico = (t >= 27 && t < 91.14) || t >= 131.6;
    // momentos de una sola vez: cuando él la jala adentro, el golpe, cuando rompe la viñeta
    if ((e.jala && !antes.jala) || (e.golpe && !antes.golpe) || (e.rompe && antes.rompe === false)) flash();
    ESTADOS.forEach(function (c) { escena.classList.toggle('tm-' + c, !!e[c]); });
    antes = e;
  }
  audio.addEventListener('timeupdate', reaccionar);
  audio.addEventListener('seeked', reaccionar);

  window.Escenas = window.Escenas || {};
  window.Escenas.takeonme = {
    el: escena,
    activar: function () {
      if (!construida) construir();
      activa = true;
      // todo se pinta una vez casi invisible mientras entra la canción, así nada da tirón la primera vez que aparece
      escena.classList.add('tm-calienta');
      clearTimeout(tCalienta);
      tCalienta = setTimeout(function () { escena.classList.remove('tm-calienta'); }, 1400);
      window.SUB_ESPECIAL = SUBS;
      antes = {};
      reaccionar();
    },
    desactivar: function () {
      activa = false;
      if (window.SUB_ESPECIAL === SUBS) window.SUB_ESPECIAL = null;
    }
  };
})();
