// Video vertical (9:16, para TikTok) del cumpleaños de Javiera con "Tu jardín con enanitos" (Melendi).
// A diferencia de las escenas de index.html aquí no hay dibujos: las protagonistas son sus fotos (img/cumple/).
// Solo se usa el puente final (de "nunca olvida tu cumpleaños" a "sin tu amor"), con ~7 s del solo de guitarra antes
// para la portada con su nombre. Todo se pinta en un canvas de 1080x1920 y cada cuadro depende solo del tiempo de la
// canción (nada guarda estado entre cuadros), así que se puede adelantar, repetir y grabar y siempre sale igual.
// Ritmo medido del audio: 128 negras por minuto, primer tiempo fuerte en 140.06 s (no se desfasa en toda la canción);
// los cortes caen en las negras y la cámara da un pequeño golpe en cada una.
// "Grabar video" genera el archivo 1080x1920 con la música (MediaRecorder); necesita abrir la página desde un servidor.
(function () {
  var lienzo = document.getElementById('lienzo');
  var audio = document.getElementById('musica');
  if (!lienzo || !audio || !window.LETRA_CUMPLE_LRC) return;
  var real = lienzo.getContext('2d'), ctx = real;
  var W = 1080, H = 1920, PI2 = Math.PI * 2;
  var NOMBRE = 'Javi :3', NOMBRE_FINAL = 'Mi amor', DEDICATORIA = ['el mundo es más bonito', 'desde que llegaste tú'];
  var T_COMPAS0 = 140.06, NEGRA = 60 / 128, COMPAS = NEGRA * 4;
  var T_INI = 166.31, T_FIN = 237.2;
  // la letra va un poco a la izquierda del centro y arriba de la parte de abajo: ahí TikTok pone sus botones y textos
  var CX = 520, Y_LETRA = 1330, ANCHO_LETRA = 840;
  var F_LETRA = 'italic 700 58px "Playfair Display", Georgia, serif';
  function fuenteClave(px) { return px + 'px Anton, Impact, sans-serif'; }
  function fuenteNombre(px) { return px + 'px "Great Vibes", "Brush Script MT", cursive'; }

  // punto de interés de cada foto (fracción del ancho y del alto): ahí se centra al recortarla
  var FOTOS = [
    { x: .55, y: .33 },  // 00 en el parque, él le da un beso en el cachete
    { x: .58, y: .38 },  // 01 año nuevo junto al árbol (horizontal)
    { x: .52, y: .45 },  // 02 selfie junto al árbol de navidad
    { x: .68, y: .30 },  // 03 ella de rojo junto al árbol
    { x: .62, y: .40 },  // 04 selfie en el parque (horizontal)
    { x: .50, y: .58 },  // 05 ella en el arco del castillo, de jeans
    { x: .55, y: .42 },  // 06 ella entre las hortensias
    { x: .52, y: .50 },  // 07 ella en el jardín del kiosco, cielo azul
    { x: .55, y: .45 },  // 08 cenando de noche (horizontal)
    { x: .50, y: .45 },  // 09 selfie frente al póster
    { x: .45, y: .45 },  // 10 de fiesta con luces rojas
    { x: .50, y: .55 },  // 11 en el espejo de neón rosa
    { x: .52, y: .48 },  // 12 abrazados de cerquita
    { x: .50, y: .52 },  // 13 selfie en el espejo, falda negra
    { x: .36, y: .42 }   // 14 ella de rojo con lentes (recorte de la foto de Snapchat, sin el reloj)
  ];

  // ---------------------------------------------------------------- utilidades
  function lim(x, a, b) { return x < a ? a : x > b ? b : x; }
  function prog(t, a, d) { return lim((t - a) / d, 0, 1); }
  function eOut(k) { return 1 - Math.pow(1 - k, 3); }
  function eIn(k) { return k * k * k; }
  function eInOut(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eBack(k) { var c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  function mezcla(a, b, k) { return a + (b - a) * k; }
  // número "al azar" que siempre es el mismo para la misma semilla (así cada cuadro se puede volver a pintar igual)
  function azar(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function nNegra(t) { return (t - T_COMPAS0) / NEGRA; }
  function negraT(n) { return T_COMPAS0 + n * NEGRA; }
  function alTiempo(t) { return negraT(Math.round(nNegra(t))); }
  // golpe: 1 justo en cada negra y se apaga rápido; golpeFuerte: lo mismo pero solo en el primer tiempo del compás
  function golpe(t) { var n = nNegra(t); return n < 0 ? 0 : Math.exp(-(n - Math.floor(n)) * 6); }
  function golpeFuerte(t) { var n = nNegra(t) / 4; return n < 0 ? 0 : Math.exp(-(n - Math.floor(n)) * 10); }

  function lienzoNuevo(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // pinta con otro contexto (las funciones de dibujo usan siempre "ctx")
  function conCtx(otro, fn) { var antes = ctx; ctx = otro; try { fn(); } finally { ctx = antes; } }
  function circulo(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, PI2); }
  function rectRedondo(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // dibuja la imagen cubriendo el rectángulo, centrada en el punto de interés (sin dejar huecos)
  function cubrir(img, foco, x, y, w, h, zoom, dx, dy) {
    var s = Math.max(w / img.width, h / img.height) * (zoom || 1), dw = img.width * s, dh = img.height * s;
    var ox = lim(x + w / 2 - foco.x * dw + (dx || 0), x + w - dw, x), oy = lim(y + h / 2 - foco.y * dh + (dy || 0), y + h - dh, y);
    ctx.drawImage(img, ox, oy, dw, dh);
  }
  function foto(i, zoom, dx, dy) { cubrir(imgs[i], FOTOS[i], 0, 0, W, H, zoom, dx, dy); }
  // degradado oscuro abajo para que la letra se lea sobre cualquier foto
  function velo(fuerza) {
    var g = ctx.createLinearGradient(0, 980, 0, H);
    g.addColorStop(0, 'rgba(8,3,6,0)'); g.addColorStop(.45, 'rgba(8,3,6,' + .5 * (fuerza || 1) + ')'); g.addColorStop(1, 'rgba(8,3,6,' + .7 * (fuerza || 1) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 980, W, H - 980);
  }
  // dorado con un brillo que pasa
  function gradOro(x0, x1, y0, y1, t) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1), s = (t * .45) % 1.6 - .3;
    g.addColorStop(0, '#f6cf7c');
    if (s > .1 && s < .9) { g.addColorStop(s - .1, '#f2c062'); g.addColorStop(s, '#fff7dc'); g.addColorStop(s + .1, '#eab456'); }
    g.addColorStop(1, '#c98a2c');
    return g;
  }
  // corazón (curva clásica 16 sen³) con ancho s
  var CORAZON = [];
  for (var u = 0; u < PI2; u += PI2 / 72) CORAZON.push([16 * Math.pow(Math.sin(u), 3) / 32, -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) / 32]);
  function trazarCorazon(x, y, s) {
    ctx.beginPath();
    CORAZON.forEach(function (p, i) { if (i) ctx.lineTo(x + p[0] * s, y + p[1] * s); else ctx.moveTo(x + p[0] * s, y + p[1] * s); });
    ctx.closePath();
  }
  // curva suave (Catmull-Rom) por los puntos, muestreada, con su largo acumulado
  function curva(pts) {
    var out = [], n = pts.length;
    function P(i) { return pts[lim(i, 0, n - 1)]; }
    for (var i = 0; i < n - 1; i++) {
      var p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (var s = 0; s < 1; s += 1 / 24) {
        var s2 = s * s, s3 = s2 * s;
        out.push([.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3)]);
      }
    }
    out.push(pts[n - 1]);
    var largo = 0;
    out.forEach(function (p, i) { if (i) largo += Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]); p[2] = largo; });
    out.largo = largo;
    return out;
  }

  // ---------------------------------------------------------------- fotos y sus versiones
  var imgs = [], versiones = {};
  function gris(img) {
    var c = lienzoNuevo(img.width, img.height), g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function sepia(img) {
    var c = gris(img), g = c.getContext('2d');
    g.globalCompositeOperation = 'color'; g.fillStyle = '#a0703e'; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // desenfoque barato: se encoge a la mitad varias veces y se vuelve a agrandar
  function borrosa(img) {
    var c = img, w = img.width, h = img.height;
    while (w > 60) {
      w = Math.round(w / 2); h = Math.round(h / 2);
      var m = lienzoNuevo(w, h), g = m.getContext('2d');
      g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, w, h); c = m;
    }
    var b = lienzoNuevo(w * 6, h * 6), gb = b.getContext('2d');
    gb.imageSmoothingQuality = 'high'; gb.drawImage(c, 0, 0, w * 6, h * 6);
    return b;
  }
  // cuadrito de 320x320 centrado en el punto de interés (para las burbujas del corazón)
  function mini(i) {
    var c = lienzoNuevo(320, 320);
    conCtx(c.getContext('2d'), function () { cubrir(imgs[i], FOTOS[i], 0, 0, 320, 320, 1.1); });
    return c;
  }
  function version(i, tipo) {
    var k = i + tipo;
    if (!versiones[k]) {
      versiones[k] = tipo === 'gris' ? gris(imgs[i]) : tipo === 'sepia' ? sepia(imgs[i]) : tipo === 'mini' ? mini(i) :
        borrosa(tipo === 'borrosa-sepia' ? version(i, 'sepia') : imgs[i]);
    }
    return versiones[k];
  }

  // ---------------------------------------------------------------- imágenes que se pintan una sola vez
  var VINETA, GRANO = [], DESTELLO, BOKEH = {}, LUNA_TEX, MEDIA_LUNA;
  var capaA = lienzoNuevo(W, H), cA = capaA.getContext('2d');   // para transiciones con transparencia
  var capaB = lienzoNuevo(W, H), cB = capaB.getContext('2d');   // para la foto pintada con pinceladas
  var mascara = lienzoNuevo(W / 2, H / 2), cM = mascara.getContext('2d');
  var agua = lienzoNuevo(W, 1200), cAgua = agua.getContext('2d');
  function prepararSprites() {
    VINETA = lienzoNuevo(W, H);
    var g = VINETA.getContext('2d'), r = g.createRadialGradient(W / 2, H * .46, 420, W / 2, H * .5, 1250);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    for (var k = 0; k < 4; k++) {
      var c = lienzoNuevo(270, 480), gc = c.getContext('2d'), d = gc.createImageData(270, 480);
      for (var p = 0; p < d.data.length; p += 4) { var v = Math.random() * 255; d.data[p] = d.data[p + 1] = d.data[p + 2] = v; d.data[p + 3] = 255; }
      gc.putImageData(d, 0, 0); GRANO.push(c);
    }
    // destello de cuatro puntas
    DESTELLO = lienzoNuevo(96, 96);
    g = DESTELLO.getContext('2d');
    r = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    r.addColorStop(0, 'rgba(255,250,230,1)'); r.addColorStop(.2, 'rgba(255,220,150,.5)'); r.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, 96, 96);
    g.fillStyle = '#fffaf0';
    g.beginPath(); g.moveTo(48, 0); g.quadraticCurveTo(52, 44, 96, 48); g.quadraticCurveTo(52, 52, 48, 96); g.quadraticCurveTo(44, 52, 0, 48); g.quadraticCurveTo(44, 44, 48, 0); g.fill();
    // círculos suaves de colores (bokeh)
    [['oro', '255,200,110'], ['rosa', '255,110,160'], ['blanco', '255,245,235'], ['violeta', '170,120,255']].forEach(function (b) {
      var c = lienzoNuevo(128, 128), gc = c.getContext('2d'), rr = gc.createRadialGradient(64, 64, 0, 64, 64, 64);
      rr.addColorStop(0, 'rgba(' + b[1] + ',.9)'); rr.addColorStop(.55, 'rgba(' + b[1] + ',.35)'); rr.addColorStop(1, 'rgba(' + b[1] + ',0)');
      gc.fillStyle = rr; gc.fillRect(0, 0, 128, 128); BOKEH[b[0]] = c;
    });
    // textura de la luna: sombra de esfera y cráteres (transparente donde no hay nada)
    var R = 330;
    LUNA_TEX = lienzoNuevo(R * 2, R * 2);
    g = LUNA_TEX.getContext('2d');
    r = g.createRadialGradient(R * .62, R * .55, R * .1, R, R, R);
    r.addColorStop(0, 'rgba(255,250,235,.12)'); r.addColorStop(.7, 'rgba(110,100,130,.18)'); r.addColorStop(1, 'rgba(20,14,44,.78)');
    g.fillStyle = r; g.beginPath(); g.arc(R, R, R, 0, PI2); g.fill();
    for (k = 0; k < 16; k++) {
      var a = azar(k + 900) * PI2, dd = Math.sqrt(azar(k + 910)) * R * .82, cr = R * (.04 + azar(k + 920) * .11);
      var x = R + Math.cos(a) * dd, y = R + Math.sin(a) * dd;
      g.fillStyle = 'rgba(50,40,60,.2)'; g.beginPath(); g.ellipse(x, y, cr, cr * .85, 0, 0, PI2); g.fill();
      g.strokeStyle = 'rgba(255,250,240,.22)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x + 2, y + 2, cr, cr * .85, 0, Math.PI * .9, Math.PI * 1.8); g.stroke();
    }
    // media luna dorada con brillo
    MEDIA_LUNA = lienzoNuevo(220, 220);
    g = MEDIA_LUNA.getContext('2d');
    r = g.createRadialGradient(110, 110, 30, 110, 110, 110);
    r.addColorStop(0, 'rgba(255,210,120,.55)'); r.addColorStop(1, 'rgba(255,210,120,0)');
    g.fillStyle = r; g.fillRect(0, 0, 220, 220);
    g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(110, 110, 62, 0, PI2); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(138, 92, 56, 0, PI2); g.fill();
  }

  // ---------------------------------------------------------------- la letra
  // clave: la palabra que sale sola en grande (dorada); brillo: palabras que salen en dorado dentro del renglón
  var ESTILO = [
    { clave: /^cumpleaños$/ },
    { clave: /^rosa$/, brillo: /^espina$/ },
    { clave: /^carnaval$/, brillo: /^(principios|finales)$/ },
    { clave: /^mar$/, y: 1420 },
    { clave: /^gardel$/, brillo: /^tango$/ },
    { clave: /^maravilla$/, brillo: /^luna$/ },
    { clave: /^cremallera$/, brillo: /^(baile|botones)$/ },
    { clave: /^falda$/, brillo: /^pantalones$/, hasta: negraT(136.5) },
    { clave: /^luna$/, brillo: /^astronauta$/, y: 1400 },
    { clave: /^locura$/, y: 1400 },
    { clave: /^color$/, brillo: /^pasión$/ },
    { brillo: /^(sabor|emoción|ternura)$/, y: 330 },
    { clave: /^cura$/ },
    { clave: /^amor$/, y: 835, hasta: negraT(190) - .1 }
  ];
  function silabas(p) {
    var s = p.toLowerCase().replace(/[^a-záéíóúüñy]/g, ''), g = s.match(/[aeiouáéíóúü]+/g) || [], n = g.length;
    g.forEach(function (v) { n += (v.match(/[aeoáéó]{2}|[íú][aeo]|[aeo][íú]/g) || []).length; });
    if (/y$/.test(s) && !/[aeiouáéíóúü]y$/.test(s)) n++;
    return Math.max(1, n);
  }
  var L = [];
  window.LETRA_CUMPLE_LRC.split('\n').forEach(function (r) {
    var m = r.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (m) L.push({ t: +m[1] * 60 + +m[2], texto: m[3].trim() });
  });
  L.forEach(function (l, i) {
    var est = l.est = ESTILO[i] || {}, sig = L[i + 1] ? L[i + 1].t : l.t + 4;
    l.fin = est.hasta || sig - .3;   // se termina de ir justo cuando entra la siguiente (no se enciman)
    var ps = l.texto ? l.texto.split(/\s+/) : [], sil = ps.map(silabas);
    var tot = sil.reduce(function (a, b) { return a + b; }, 0) || 1, dur = Math.min(sig - l.t - .25, tot * .215), acc = 0;
    l.palabras = ps.map(function (p, j) {
      var limpia = p.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
      var w = { texto: p, t: l.t + acc / tot * dur - .05, clave: !!(est.clave && est.clave.test(limpia)), brillo: !!(est.brillo && est.brillo.test(limpia)) };
      acc += sil[j];
      return w;
    });
  });
  // cuándo se canta (aproximadamente) una palabra de la línea i
  function tPalabra(i, re) {
    var ps = L[i].palabras;
    for (var j = 0; j < ps.length; j++) if (re.test(ps[j].texto.toLowerCase())) return ps[j].t;
    return L[i].t;
  }
  function maquetar(l) {
    var filas = [], fila = [], ancho = 0;
    ctx.font = F_LETRA;
    var esp = ctx.measureText(' ').width;
    function cerrar() { if (fila.length) filas.push({ ps: fila, w: ancho, alto: 74 }); fila = []; ancho = 0; }
    l.palabras.forEach(function (w) {
      if (w.clave) {
        cerrar();
        w.mostrar = w.texto.replace(/[,.;:!?¡¿]/g, '').toUpperCase();
        ctx.font = fuenteClave(150);
        var mw = ctx.measureText(w.mostrar).width;
        w.tam = Math.min(150, 150 * 860 / mw); w.w = mw * w.tam / 150;
        filas.push({ ps: [w], w: w.w, alto: w.tam * 1.12, clave: true });
        ctx.font = F_LETRA;
        return;
      }
      w.mostrar = w.texto;
      var m = ctx.measureText(w.texto).width;
      if (fila.length && ancho + esp + m > ANCHO_LETRA) cerrar();
      w.dx = fila.length ? ancho + esp : 0; w.w = m;
      ancho = w.dx + m; fila.push(w);
    });
    cerrar();
    var total = filas.reduce(function (a, f) { return a + f.alto; }, 0), y = (l.est.y || Y_LETRA) - total / 2;
    filas.forEach(function (f) {
      var x0 = CX - f.w / 2;
      f.ps.forEach(function (w) { w.x = f.clave ? CX : x0 + w.dx; w.y = y + f.alto * (f.clave ? .9 : .76); });
      y += f.alto;
    });
    l.lista = true;
  }
  function letra(t) {
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      if (!l.texto || t < l.t - .2 || t > l.fin + .3) continue;
      if (!l.lista) maquetar(l);
      var sal = eIn(prog(t, l.fin, .25));
      for (var j = 0; j < l.palabras.length; j++) palabra(l.palabras[j], t, 1 - sal, sal);
    }
  }
  function palabra(w, t, aL, sal) {
    var a = prog(t, w.t, w.clave ? .5 : .3);
    if (a <= 0 || aL <= 0) return;
    var e = eOut(a);
    ctx.save();
    ctx.globalAlpha = aL * Math.min(1, a * 2.4);
    if (w.clave) {
      var s = (a < 1 ? eBack(a) : 1) * (1 + .035 * golpe(t)) * (1 + sal * .25);
      ctx.translate(w.x, w.y - sal * 30); ctx.rotate((1 - e) * -.14); ctx.scale(s, s);
      ctx.font = fuenteClave(w.tam); ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,160,50,.6)'; ctx.shadowBlur = 36;
      ctx.fillStyle = gradOro(-w.w / 2, w.w / 2, -w.tam * .8, 0, t);
      ctx.fillText(w.mostrar, 0, 0);
      ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(110,50,0,.35)';
      ctx.strokeText(w.mostrar, 0, 0);
    } else {
      ctx.font = F_LETRA; ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
      ctx.fillStyle = w.brillo ? '#ffd27a' : '#fff8ef';
      ctx.fillText(w.mostrar, w.x, w.y + (1 - e) * 34 - sal * 22);
    }
    ctx.restore();
  }

  // momentos clave (de la letra y de las negras)
  var TL = L.map(function (l) { return alTiempo(l.t); });
  var tCumple = alTiempo(tPalabra(0, /cumplea/)), tRosa = tPalabra(1, /^rosa/), tEspina = tPalabra(1, /espina/);
  var tPrincipios = tPalabra(2, /principios/), tMaravilla = tPalabra(5, /maravilla/), tCremallera = tPalabra(6, /cremallera/);
  var tPise = tPalabra(8, /pise/), tClavando = TL[9], tLocura = tPalabra(9, /locura/), tPasion = tPalabra(10, /pasi/);
  var tCura = tPalabra(12, /cura/), T_GOLPE = negraT(190);

  // ---------------------------------------------------------------- partículas (todas en función del tiempo)
  var COLORES = ['#ff4f81', '#ffd23f', '#3ec6ff', '#7cff9b', '#b388ff', '#ffffff', '#ff9f43'];
  // dos cañones de confeti desde las esquinas de abajo (con resistencia del aire y gravedad)
  function confeti(t, t0, n, s) {
    var a0 = t - t0;
    if (a0 < 0 || a0 > 5) return;
    var K = 2.4, G = 620, vida = 1 - prog(a0, 3.6, 1.3);
    for (var i = 0; i < n; i++) {
      var a = a0 - azar(s + i * 4.3) * .12;
      if (a <= 0) continue;
      var lado = i % 2 ? 1 : -1, vx = lado * (350 + azar(s + i * 1.7) * 1100), vy = -(1500 + azar(s + i * 2.9) * 1500);
      var f = (1 - Math.exp(-K * a)) / K;
      var x = (lado > 0 ? -10 : W + 10) + vx * f + Math.sin(a * 5 + i) * 18 * Math.min(1, a);
      var y = H * .8 + vy * f + G / K * (a - f);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * (3 + azar(i) * 4) + i); ctx.scale(1, Math.cos(a * 9 + i));
      ctx.globalAlpha = vida; ctx.fillStyle = COLORES[i % COLORES.length];
      ctx.fillRect(-9, -5, 14 + azar(i + 7) * 10, 9);
      ctx.restore();
    }
  }
  // confeti que cae sin parar desde arriba
  function lluviaConfeti(lt, n, s) {
    for (var i = 0; i < n; i++) {
      var vel = 220 + azar(s + i) * 260, y = (lt * vel + azar(s + i * 3) * (H + 80)) % (H + 80) - 40;
      var x = azar(s + i * 7) * W + Math.sin(lt * 2 + i) * 30;
      ctx.save(); ctx.translate(x, y); ctx.rotate(lt * 3 + i); ctx.scale(1, Math.cos(lt * 7 + i));
      ctx.fillStyle = COLORES[i % COLORES.length]; ctx.fillRect(-8, -4, 16, 8);
      ctx.restore();
    }
  }
  function petalos(lt, n, s) {
    for (var i = 0; i < n; i++) {
      var vel = 130 + azar(s + i) * 150, y = (lt * vel + azar(s + i * 3) * (H + 200)) % (H + 200) - 100;
      var x = azar(s + i * 7) * W + Math.sin(lt * 1.2 + i) * 50;
      ctx.save(); ctx.translate(x, y); ctx.rotate(lt * (.8 + azar(i)) + i); ctx.scale(1, Math.cos(lt * 2.2 + i * 1.3));
      var g = ctx.createLinearGradient(-20, 0, 20, 0);
      g.addColorStop(0, '#ff8fab'); g.addColorStop(1, '#d6204e');
      ctx.fillStyle = g; ctx.globalAlpha = .9;
      ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(0, -16, 20, 0); ctx.quadraticCurveTo(0, 12, -20, 0); ctx.fill();
      ctx.restore();
    }
  }
  function corazones(t, t0, n, s, color) {
    var a0 = t - t0;
    if (a0 < 0) return;
    for (var i = 0; i < n; i++) {
      var a = a0 - azar(s + i) * 1.4;
      if (a < 0 || a > 3.2) continue;
      var x = 120 + azar(s + i * 3) * 840 + Math.sin(a * 2 + i) * 30, y = H * .82 - a * (260 + azar(s + i * 5) * 160);
      ctx.save(); ctx.globalAlpha = Math.min(1, a * 3) * (1 - prog(a, 2.4, .8));
      ctx.fillStyle = color || '#ff3b6b'; ctx.shadowColor = 'rgba(255,40,90,.6)'; ctx.shadowBlur = 16;
      trazarCorazon(x, y, 34 + azar(s + i * 9) * 30); ctx.fill();
      ctx.restore();
    }
  }
  function destello(x, y, s, a) {
    if (a <= .01) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(DESTELLO, x - 48 * s, y - 48 * s, 96 * s, 96 * s);
    ctx.restore();
  }
  function bokeh(lt, n, s, tipos) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < n; i++) {
      var r = 40 + azar(s + i) * 90, x = (azar(s + i * 3) * (W + 200) + lt * (12 + azar(i) * 20)) % (W + 200) - 100;
      var y = azar(s + i * 5) * H + Math.sin(lt * .7 + i) * 30;
      ctx.globalAlpha = .25 + .35 * Math.abs(Math.sin(lt * .8 + i));
      ctx.drawImage(BOKEH[tipos[i % tipos.length]], x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  // fuegos artificiales: una explosión de chispas con estela
  function fuegos(t, t0, x, y, color, s) {
    var a = t - t0;
    if (a < 0 || a > 1.9) return;
    var K = 2.2, G = 260, n = 52;
    function pos(ang, v, a) { var f = (1 - Math.exp(-K * a)) / K; return [x + Math.cos(ang) * v * f, y + Math.sin(ang) * v * f + G / K * (a - f)]; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = color; ctx.lineCap = 'round';
    if (a < .25) {
      var r = ctx.createRadialGradient(x, y, 0, x, y, 160);
      r.addColorStop(0, 'rgba(255,255,255,' + (1 - a * 4) + ')'); r.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = r; ctx.fillRect(x - 160, y - 160, 320, 320);
    }
    for (var i = 0; i < n; i++) {
      var ang = i / n * PI2 + azar(s + i) * .15, v = 420 + azar(s + i * 3) * 260;
      var p1 = pos(ang, v, a), p0 = pos(ang, v, Math.max(0, a - .1));
      ctx.globalAlpha = Math.pow(1 - a / 1.9, 1.4) * (a > 1.1 ? .5 + .5 * Math.sin(a * 40 + i) : 1);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- escenas
  // intro: una foto distinta en cada negra y su nombre que se escribe letra por letra
  var ORDEN_INTRO = [0, 6, 2, 11, 4, 9, 3, 12, 8, 13, 1, 7, 10, 5, 14];
  var N_INI = Math.round(nNegra(T_INI));
  function intro(t) {
    var nb = nNegra(t), n = lim(Math.floor(nb) - N_INI, 0, ORDEN_INTRO.length - 1), ph = lim(nb - Math.floor(nb), 0, 1);
    var i = ORDEN_INTRO[n];
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate((n % 2 ? 1 : -1) * .025 * (1 - eOut(ph))); ctx.translate(-W / 2, -H / 2);
    foto(i, 1.16 - .1 * eOut(Math.min(1, ph * 1.4)));
    ctx.restore();
    ctx.fillStyle = 'rgba(14,6,12,.38)'; ctx.fillRect(0, 0, W, H);
    var r = ctx.createRadialGradient(W / 2, 860, 60, W / 2, 860, 700);
    r.addColorStop(0, 'rgba(14,4,10,.6)'); r.addColorStop(1, 'rgba(14,4,10,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,236,220,' + (.42 * Math.exp(-ph * 9)) + ')'; ctx.fillRect(0, 0, W, H);
    titulo(t, nb - N_INI);
  }
  function textoEspaciado(txt, x, y, esp) {
    var ws = [], total = 0;
    for (var i = 0; i < txt.length; i++) { ws.push(ctx.measureText(txt[i]).width); total += ws[i] + (i ? esp : 0); }
    var cx = x - total / 2;
    ctx.textAlign = 'left';
    for (i = 0; i < txt.length; i++) { ctx.fillText(txt[i], cx, y); cx += ws[i] + esp; }
  }
  function nombre(t, x, y, px, k, txt) {
    txt = txt || NOMBRE;
    ctx.font = fuenteNombre(px);
    var w = ctx.measureText(txt).width;
    if (w > 920) { px *= 920 / w; ctx.font = fuenteNombre(px); w = 920; }
    ctx.save();
    if (k < 1) { ctx.beginPath(); ctx.rect(x - w / 2 - 60, y - px, (w + 120) * k, px * 1.6); ctx.clip(); }
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,170,70,.75)'; ctx.shadowBlur = 40;
    ctx.fillStyle = gradOro(x - w / 2, x + w / 2, y - px * .7, y, t);
    ctx.fillText(txt, x, y);
    ctx.restore();
    return w;
  }
  function titulo(t, nb) {
    var salida = eInOut(prog(t, negraT(N_INI + 14), NEGRA * .95));
    ctx.save();
    ctx.globalAlpha = 1 - salida;
    ctx.translate(W / 2, 880); ctx.scale(1 + salida * .7, 1 + salida * .7); ctx.translate(-W / 2, -880);
    // el nombre se descubre una letra por negra, con un destello en la punta
    var letras = NOMBRE.length, k = lim((nb + .35) / letras, 0, 1), kk = eOut(k);
    var w = nombre(t, W / 2, 930, 270, kk);
    if (k > 0 && k < 1) destello(W / 2 - w / 2 - 60 + (w + 120) * kk, 860, 1.4, 1);
    // "feliz cumpleaños" arriba
    var a = prog(nb, letras + .2, .8);
    if (a > 0) {
      ctx.save(); ctx.globalAlpha *= a;
      ctx.font = '800 44px Montserrat, sans-serif'; ctx.fillStyle = '#fff4e2';
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14;
      textoEspaciado('FELIZ CUMPLEAÑOS', W / 2, 700 + (1 - eOut(a)) * 30, 14 * (1 - eOut(a)) + 10);
      ctx.restore();
    }
    // corazoncito que late abajo
    var c = prog(nb, letras + 1, .6);
    if (c > 0) {
      ctx.save(); ctx.globalAlpha *= c; ctx.fillStyle = '#ff4d6d'; ctx.shadowColor = 'rgba(255,60,100,.8)'; ctx.shadowBlur = 24;
      trazarCorazon(W / 2, 1060, 70 * eBack(c) * (1 + .15 * golpe(t))); ctx.fill();
      ctx.restore();
    }
    // chispitas alrededor del nombre
    for (var i = 0; i < 14; i++) {
      var tw = Math.pow(Math.max(0, Math.sin(t * 3 + i * 2.1)), 6) * prog(nb, i * .5, 1);
      destello(160 + azar(i + 300) * 760, 640 + azar(i + 310) * 460, .5 + azar(i + 320) * .6, tw);
    }
    ctx.restore();
  }

  function globo(x, y, r, col, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, r * 1.25); ctx.bezierCurveTo(-14, r * 1.8, 14, r * 2.3, -4, r * 3.2); ctx.stroke();
    ctx.fillStyle = col[1];
    ctx.beginPath(); ctx.moveTo(0, r * 1.14); ctx.lineTo(-9, r * 1.3); ctx.lineTo(9, r * 1.3); ctx.closePath(); ctx.fill();
    var g = ctx.createRadialGradient(-r * .35, -r * .45, r * .08, 0, 0, r * 1.3);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.22, col[0]); g.addColorStop(1, col[1]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.2, 0, 0, PI2); ctx.fill();
    ctx.restore();
  }
  var GLOBOS = [['#ff5c8a', '#b3124a'], ['#ffd166', '#c98a00'], ['#f2ecff', '#a99cd6'], ['#ff8fab', '#c0466a'], ['#e5383b', '#8a0f12']];
  function globos(t, t0) {
    for (var i = 0; i < 8; i++) {
      var a = t - t0 - azar(i + 40) * .7;
      if (a < 0) continue;
      var y = H + 140 - a * (340 + azar(i + 60) * 170);
      if (y < -250) continue;
      globo(70 + azar(i + 50) * 920 + Math.sin(a * 1.3 + i) * 26, y, 50 + azar(i + 70) * 20, GLOBOS[i % GLOBOS.length], Math.sin(a * 1.1 + i) * .08);
    }
  }
  // 1 · "nunca olvida tu cumpleaños": confeti y globos justo en "cumpleaños"
  function cumple(t, lt) {
    foto(0, 1.04 + .07 * prog(lt, 0, 4.2) + .22 * (1 - eOut(prog(lt, 0, .9))));
    velo();
    globos(t, tCumple);
    confeti(t, tCumple, 160, 11);
  }

  // 2 · "mi rosa y mi espina": un tallo con espinas crece por la orilla y en "rosa" abre una rosa
  var TALLO = curva([[-20, 1960], [70, 1720], [40, 1480], [95, 1250], [50, 1020], [95, 820], [150, 660], [185, 545]]);
  var TALLO2 = curva([[1110, 1960], [1010, 1790], [1050, 1630], [985, 1500]]);
  function tallo(c, k, grosor, tE, lado) {
    var hasta = c.largo * k;
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 1; i < c.length && c[i][2] <= hasta; i++) {
      ctx.strokeStyle = '#2f5d32'; ctx.lineWidth = grosor * (1 - c[i][2] / c.largo * .55);
      ctx.beginPath(); ctx.moveTo(c[i - 1][0], c[i - 1][1]); ctx.lineTo(c[i][0], c[i][1]); ctx.stroke();
    }
    // espinas y hojas
    var pulso = 1 + .7 * Math.exp(-Math.max(0, ctx.t - tE) * 5) * (ctx.t >= tE ? 1 : 0);
    for (var s = 70, j = 0; s < hasta; s += 75, j++) {
      var p = c.find(function (q) { return q[2] >= s; }) || c[c.length - 1], q = c[c.indexOf(p) - 1] || p;
      var ang = Math.atan2(p[1] - q[1], p[0] - q[0]), lado2 = j % 2 ? 1 : -1, crece = prog(hasta - s, 0, 60);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang + lado2 * Math.PI / 2 * lado);
      if (j % 3 === 2) {
        ctx.scale(crece, crece);
        var g = ctx.createLinearGradient(0, 0, 70, 0); g.addColorStop(0, '#3f7a3a'); g.addColorStop(1, '#7fbf5a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(36, 0, 36, 14, -.25, 0, PI2); ctx.fill();
        ctx.strokeStyle = 'rgba(20,50,20,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(66, -8); ctx.stroke();
      } else {
        ctx.scale(crece * pulso, crece * pulso);
        ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(0, 22); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function rosaFlor(x, y, r, k, giro) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(giro);
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 20;
    [[1, 6, '#5e0817', '#b3132f'], [.8, 5, '#7d0c22', '#d81f3d'], [.6, 5, '#9d1029', '#ec3651'], [.4, 4, '#b8163a', '#ff5470']].forEach(function (c, j) {
      for (var p = 0; p < c[1]; p++) {
        ctx.save(); ctx.rotate(p / c[1] * PI2 + j * .55);
        var g = ctx.createRadialGradient(0, r * c[0] * .2, 0, 0, r * c[0] * .45, r * c[0] * .62);
        g.addColorStop(0, c[2]); g.addColorStop(1, c[3]);
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, r * c[0] * .4, r * c[0] * .4, r * c[0] * .55, 0, 0, PI2); ctx.fill();
        ctx.restore();
      }
      ctx.shadowBlur = 0;
    });
    ctx.strokeStyle = 'rgba(70,0,12,.7)'; ctx.lineWidth = 3; ctx.beginPath();
    for (var a = 0; a < 13; a += .25) { var rr = a * r * .016; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.stroke();
    ctx.restore();
  }
  function rosa(t, lt) {
    foto(6, 1.08 + .05 * prog(lt, 0, 3.6));
    velo();
    petalos(lt, 26, 200);
    ctx.t = t;
    tallo(TALLO, eOut(prog(lt, .1, 1.8)), 12, tEspina, 1);
    tallo(TALLO2, eOut(prog(lt, .5, 1.4)), 9, tEspina, -1);
    rosaFlor(185, 545, 115, eBack(prog(t, tRosa - .1, .7)), lt * .15);
    rosaFlor(985, 1500, 70, eBack(prog(t, tRosa + .25, .6)), -lt * .2);
  }

  // 3 · "carnaval": luces de colores que cambian en cada negra, serpentinas y confeti
  function serpentinas(lt) {
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var largo = lim((lt - azar(i + 90) * .5) / 1.1, 0, 1) * (500 + azar(i + 99) * 700);
      if (largo <= 0) continue;
      var x0 = 40 + i * 125 + azar(i + 80) * 40;
      [['rgba(0,0,0,.25)', 4], [COLORES[i % COLORES.length], 0]].forEach(function (c) {
        ctx.strokeStyle = c[0]; ctx.lineWidth = 10; ctx.beginPath();
        for (var y = 0; y <= largo; y += 12) {
          var x = x0 + c[1] + Math.sin(y * .028 + lt * 3 + i) * (18 + y * .03);
          if (y) ctx.lineTo(x, y - 20 + c[1]); else ctx.moveTo(x, y - 20 + c[1]);
        }
        ctx.stroke();
      });
    }
    ctx.restore();
  }
  function fechaFoto(txt, x, y, a) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '600 46px "Courier New", monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = '#ff8a2a'; ctx.shadowColor = 'rgba(255,120,30,.9)'; ctx.shadowBlur = 14;
    ctx.fillText(txt, x, y);
    ctx.restore();
  }
  function carnaval(t, lt) {
    foto(10, 1.08 + .04 * prog(lt, 0, 3.8));
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    var nb = Math.floor(nNegra(t)), c = ['255,40,160', '40,200,255', '255,210,40'][((nb % 3) + 3) % 3], px = nb % 2 ? W * .08 : W * .92;
    var gr = ctx.createRadialGradient(px, H * .3, 0, px, H * .3, 1150);
    gr.addColorStop(0, 'rgba(' + c + ',' + (.6 * golpe(t)) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    velo();
    serpentinas(lt);
    lluviaConfeti(lt, 70, 31);
    // "tus principios y tus finales": la fecha de la primera foto y la de la más reciente, como cámara de rollo
    var a = prog(t, tPrincipios - .1, .3);
    fechaFoto("18 12 '25", 960, 250, a);
    fechaFoto("14 10 '26", 960, 310, prog(t, tPrincipios + .55, .3));
  }

  // 4 · "el mar": el agua sube y abajo queda el reflejo de la foto con olas
  var LINEA_AGUA = 1180;
  function mar(t, lt) {
    var z = 1.06 + .05 * prog(lt, 0, 5);
    conCtx(cAgua, function () { cubrir(imgs[7], FOTOS[7], 0, 0, W, LINEA_AGUA, z); });
    ctx.drawImage(agua, 0, 0, W, LINEA_AGUA, 0, 0, W, LINEA_AGUA);
    for (var y = LINEA_AGUA; y < H; y += 6) {
      var d = y - LINEA_AGUA, ys = lim(LINEA_AGUA - d * .92 - 6 + Math.sin(d * .05 - lt * 3.2) * (2 + d * .012), 0, LINEA_AGUA - 6);
      ctx.drawImage(agua, 0, ys, W, 6, Math.sin(d * .045 - lt * 4) * (6 + d * .025) - 24, y, W + 48, 6.5);
    }
    var g = ctx.createLinearGradient(0, LINEA_AGUA, 0, H);
    g.addColorStop(0, 'rgba(30,120,170,.35)'); g.addColorStop(1, 'rgba(6,30,70,.78)');
    ctx.fillStyle = g; ctx.fillRect(0, LINEA_AGUA, W, H - LINEA_AGUA);
    // línea del agua y brillitos del sol
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, LINEA_AGUA - 1, W, 3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 46; i++) {
      var a = Math.pow(Math.max(0, Math.sin(lt * 5 + i * 1.9)), 4), gy = LINEA_AGUA + 14 + azar(i + 400) * 600;
      ctx.fillStyle = 'rgba(255,250,230,' + a * .8 + ')';
      ctx.fillRect(azar(i + 410) * W + Math.sin(lt * 2 + i) * 20, gy, 16 + azar(i) * 30, 3);
    }
    ctx.restore();
    // burbujas
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    for (i = 0; i < 18; i++) {
      var by = H - ((lt * (90 + azar(i + 430) * 90) + azar(i + 440) * 700) % 700);
      circulo(azar(i + 450) * W + Math.sin(lt * 3 + i) * 10, by, 5 + azar(i + 460) * 9); ctx.stroke();
    }
  }

  // 5 · "tango de Gardel, octavillas": retrato antiguo en sepia, película vieja y volantes de papel que caen
  function octavillas(lt) {
    for (var i = 0; i < 9; i++) {
      var a = lt - azar(i + 500) * 1.1;
      if (a < 0) continue;
      var y = -120 + a * (300 + azar(i + 510) * 160), x = 80 + azar(i + 520) * 920 + Math.sin(a * 2 + i) * 50;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(a * 1.7 + i) * .6); ctx.scale(Math.cos(a * 2.6 + i), 1);
      ctx.fillStyle = '#efe3c8'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 10; ctx.fillRect(-35, -46, 70, 92);
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(80,50,30,.55)';
      ctx.fillRect(-24, -30, 48, 5); ctx.fillRect(-24, -18, 36, 4); ctx.fillRect(-24, 22, 48, 4);
      ctx.fillStyle = '#b3132f'; trazarCorazon(0, 4, 26); ctx.fill();
      ctx.restore();
    }
  }
  function peliculaVieja(t) {
    var f = Math.floor(t * 24);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + azar(f) * .09 + ')'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,240,210,.22)'; ctx.lineWidth = 1.6;
    for (var j = 0; j < 3; j++) if (azar(f * 3 + j) > .55) { var x = azar(f * 7 + j) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(30,20,10,.5)';
    for (j = 0; j < 6; j++) { circulo(azar(f * 11 + j) * W, azar(f * 13 + j) * H, 1 + azar(f + j) * 3); ctx.fill(); }
    ctx.restore();
  }
  function tango(t, lt) {
    cubrir(version(8, 'borrosa-sepia'), FOTOS[8], 0, 0, W, H, 1.1);
    ctx.fillStyle = 'rgba(20,10,4,.45)'; ctx.fillRect(0, 0, W, H);
    var r = ctx.createRadialGradient(540, 700, 50, 540, 700, 900);
    r.addColorStop(0, 'rgba(255,215,150,.28)'); r.addColorStop(1, 'rgba(255,215,150,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(540, 700); ctx.rotate(-.05 + Math.sin(lt * 1.4) * .012);
    var s = .9 + .1 * eOut(prog(lt, 0, .6)); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 44; ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#efe4cc'; rectRedondo(-460, -400, 920, 800, 8); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save(); ctx.beginPath(); ctx.rect(-420, -360, 840, 630); ctx.clip();
    cubrir(version(8, 'sepia'), FOTOS[8], -420, -360, 840, 630, 1.04 + .03 * prog(lt, 0, 2.6));
    ctx.restore();
    ctx.strokeStyle = 'rgba(90,60,30,.45)'; ctx.lineWidth = 2; ctx.strokeRect(-420, -360, 840, 630);
    ctx.font = '700 58px Caveat, cursive'; ctx.textAlign = 'center'; ctx.fillStyle = '#5a3a22';
    ctx.fillText('♪ nuestro tango ♪', 0, 345);
    ctx.restore();
    octavillas(lt);
    peliculaVieja(t);
  }

  // 6 · "mi octava maravilla": de sepia a color desde su cara, marco dorado, media luna y destellos
  function marcoDorado(t, lt) {
    var k = eInOut(prog(lt, .3, 1.4));
    if (k <= 0) return;
    ctx.save(); ctx.strokeStyle = '#f1c86a'; ctx.shadowColor = 'rgba(255,190,90,.8)'; ctx.shadowBlur = 16;
    [[36, 5], [54, 2]].forEach(function (m) {
      var per = 2 * (W - 2 * m[0] + H - 2 * m[0]);
      ctx.lineWidth = m[1]; ctx.setLineDash([per * k, per]); ctx.strokeRect(m[0], m[0], W - 2 * m[0], H - 2 * m[0]);
    });
    ctx.setLineDash([]);
    var a = prog(lt, 1.5, .4);
    [[45, 45], [W - 45, 45], [45, H - 45], [W - 45, H - 45]].forEach(function (p) {
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.PI / 4); ctx.scale(a, a); ctx.fillStyle = '#ffe3a0'; ctx.fillRect(-12, -12, 24, 24); ctx.restore();
    });
    ctx.restore();
  }
  function maravilla(t, lt) {
    var z = 1.05 + .08 * eInOut(prog(lt, 0, 4.3));
    cubrir(version(3, 'sepia'), FOTOS[3], 0, 0, W, H, z);
    var r = eInOut(prog(lt, .05, 1.1)) * 1500;
    if (r > 0) { ctx.save(); circulo(680, 540, r); ctx.clip(); foto(3, z); ctx.restore(); }
    velo();
    marcoDorado(t, lt);
    var a = eBack(prog(lt, .5, .7));
    if (a > 0) {
      ctx.save(); ctx.translate(210, 340); ctx.scale(a, a); ctx.rotate(Math.sin(lt * 1.5) * .08);
      ctx.drawImage(MEDIA_LUNA, -110, -110); ctx.restore();
    }
    var boost = t > tMaravilla ? 1.6 * Math.exp(-(t - tMaravilla) * 1.6) : 0;
    for (var i = 0; i < 34; i++) {
      var tw = Math.pow(Math.max(0, Math.sin(lt * 4 + i * 1.7)), 3) * (.6 + boost) * prog(lt, .3 + azar(i + 600), .5);
      destello(360 + azar(i + 610) * 660, 180 + azar(i + 620) * 1150, .45 + azar(i + 630) * .7 + boost * .4, tw);
    }
  }

  // 7 · "el baile de mi salón": luces de discoteca, la foto baila al ritmo y luego una cremallera la abre
  function baile(t, lt) {
    var g = golpe(t);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(nNegra(t) * Math.PI / 2) * .014); ctx.translate(-W / 2, -H / 2);
    foto(11, 1.07 + .035 * g);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    var cols = ['255,60,200', '150,80,255', '60,220,255', '255,120,220', '120,140,255'];
    for (var i = 0; i < 5; i++) {
      ctx.save(); ctx.translate(140 + i * 200, -40); ctx.rotate(Math.sin(lt * 1.5 + i * 1.3) * .55);
      var gr = ctx.createLinearGradient(0, 0, 0, 1700);
      gr.addColorStop(0, 'rgba(' + cols[i] + ',.6)'); gr.addColorStop(1, 'rgba(' + cols[i] + ',0)');
      ctx.fillStyle = gr; ctx.globalAlpha = .3 + .4 * g;
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(190, 1700); ctx.lineTo(-190, 1700); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < 60; i++) {
      var a = Math.pow(Math.max(0, Math.sin(lt * 6 + i)), 2);
      ctx.fillStyle = 'rgba(255,255,255,' + a * .8 + ')';
      circulo((azar(i + 700) * W + lt * (120 + azar(i + 710) * 200)) % W, azar(i + 720) * H * .85, 2 + azar(i + 730) * 4); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = '#ff6fd8'; ctx.lineWidth = 6; ctx.shadowColor = '#ff2fc0'; ctx.shadowBlur = 30 + 30 * g;
    ctx.globalAlpha = .55 + .45 * g; rectRedondo(28, 28, W - 56, H - 56, 34); ctx.stroke();
    ctx.restore();
    velo();
  }

  // 8 · "tu falda y también mis pantalones": pantalla partida, y cuenta regresiva para despegar a la luna
  function faldas(t) {
    var lt = t - TL[7], m = W / 2, tiembla = prog(t, negraT(137), 1.6) * 9;
    ctx.save();
    ctx.translate(Math.sin(t * 71) * tiembla, Math.cos(t * 59) * tiembla);
    ctx.save(); ctx.beginPath(); ctx.rect(-20, -20, m - 5 + 20, H + 40); ctx.clip();
    cubrir(imgs[13], FOTOS[13], -20, -20, m + 15, H + 40, 1.14, 0, 110 - lt * 40);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(m + 5, -20, m + 15, H + 40); ctx.clip();
    cubrir(imgs[5], FOTOS[5], m + 5, -20, m + 15, H + 40, 1.14, 0, -110 + lt * 40);
    ctx.restore();
    ctx.fillStyle = '#fff8ef'; ctx.fillRect(m - 5, -20, 10, H + 40);
    ctx.fillStyle = 'rgba(255,255,255,' + .2 * golpe(t) + ')'; ctx.fillRect(Math.floor(nNegra(t)) % 2 ? m : 0, 0, m, H);
    ctx.restore();
    velo();
    for (var j = 0; j < 3; j++) {
      var a = t - negraT(137 + j);
      if (a < 0 || a > NEGRA) continue;
      ctx.save(); ctx.globalAlpha = 1 - prog(a, NEGRA * .6, NEGRA * .4);
      ctx.translate(W / 2, 1000); var s = 1.5 - .5 * eOut(prog(a, 0, .25)); ctx.scale(s, s);
      ctx.font = fuenteClave(420); ctx.textAlign = 'center'; ctx.fillStyle = '#fff8ef';
      ctx.shadowColor = 'rgba(255,190,90,.9)'; ctx.shadowBlur = 50;
      ctx.fillText(String(3 - j), 0, 150);
      ctx.restore();
    }
  }

  // 9-10 · "tu astronauta… tu luna" y "una bandera de locura": la luna es una foto
  var ESTRELLAS = [];
  for (var e = 0; e < 240; e++) ESTRELLAS.push({ x: azar(e + 1000) * W, y: azar(e + 1100) * H, r: .6 + azar(e + 1200) * 2.2, c: e % 3, f: azar(e + 1300) * 9 });
  var R_LUNA = 330, ANG_ASTRO = -2.3, ANG_BANDERA = -1.82;
  function astronauta(x, y, s, rot, saluda) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 100, s / 100);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#c9d1dd'; rectRedondo(-27, -80, 54, 48, 10); ctx.fill();                 // mochila
    ctx.fillStyle = '#f4f6fa'; ctx.strokeStyle = '#8c98ac'; ctx.lineWidth = 3;
    rectRedondo(-22, -34, 18, 34, 7); ctx.fill(); ctx.stroke(); rectRedondo(4, -34, 18, 34, 7); ctx.fill(); ctx.stroke();  // piernas
    ctx.fillStyle = '#9aa6ba'; rectRedondo(-24, -8, 22, 10, 4); ctx.fill(); rectRedondo(2, -8, 22, 10, 4); ctx.fill();      // botas
    ctx.fillStyle = '#f4f6fa'; rectRedondo(-25, -74, 50, 46, 15); ctx.fill(); ctx.stroke();  // cuerpo
    ctx.fillStyle = '#ff4d6d'; trazarCorazon(0, -54, 18); ctx.fill();                        // corazoncito en el pecho
    ctx.fillStyle = '#f4f6fa';
    ctx.save(); ctx.translate(-24, -66); ctx.rotate(.5); rectRedondo(-8, 0, 16, 34, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(24, -66); ctx.rotate(saluda ? -2.4 + Math.sin(ctx.t * 9) * .35 : -.5); rectRedondo(-8, 0, 16, 34, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    circulo(0, -96, 27); ctx.fill(); ctx.stroke();                                           // casco
    var g = ctx.createLinearGradient(-18, -108, 18, -84);
    g.addColorStop(0, '#ffe7a3'); g.addColorStop(.5, '#e0a43c'); g.addColorStop(1, '#8a5a1a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(2, -95, 19, 14, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(-6, -100, 5, 3, -.5, 0, PI2); ctx.fill();
    ctx.restore();
  }
  function bandera(bx, by, ang, t) {
    var baja = (1 - eIn(prog(t, tClavando - .3, .3))) * 220, k = eOut(prog(t, tClavando, .7)), alto = 200;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(ang + Math.PI / 2); ctx.translate(0, -baja);
    ctx.fillStyle = '#e3e7ee'; ctx.fillRect(-3, -alto, 6, alto + 8);
    if (k > 0) {
      var ancho = 170 * k, onda = function (x) { return Math.sin(x * .05 - t * 7) * 9 * (x / 170); };
      var g = ctx.createLinearGradient(0, -alto, ancho, -alto + 110);
      g.addColorStop(0, '#ff5c8a'); g.addColorStop(1, '#c9184a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(3, -alto);
      for (var x = 0; x <= ancho; x += 6) ctx.lineTo(3 + x, -alto + onda(x));
      for (x = ancho; x >= 0; x -= 6) ctx.lineTo(3 + x, -alto + 110 + onda(x));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; trazarCorazon(3 + ancho / 2, -alto + 55 + onda(ancho / 2), 50 * k); ctx.fill();
    }
    ctx.restore();
    // polvo al clavarla
    var a = t - tClavando;
    if (a > 0 && a < .9) {
      ctx.fillStyle = 'rgba(230,225,215,' + (1 - a / .9) * .7 + ')';
      for (var i = 0; i < 16; i++) {
        var d = (i % 2 ? 1 : -1) * (20 + azar(i + 1400) * 90) * eOut(a / .9), tg = ang + Math.PI / 2;
        circulo(bx + Math.cos(tg) * d + Math.cos(ang) * azar(i + 1410) * 40 * a, by + Math.sin(tg) * d + Math.sin(ang) * azar(i + 1410) * 40 * a, 6 + azar(i + 1420) * 10);
        ctx.fill();
      }
    }
  }
  function espacio(t) {
    var lt = t - TL[8];
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04020f'); g.addColorStop(.6, '#160b33'); g.addColorStop(1, '#2c0f4d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    bokeh(lt, 6, 1500, ['violeta', 'rosa']);
    var subida = eOut(prog(lt, 0, 1.4)), cx = W / 2, cy = 800 + (1 - subida) * 300 + Math.sin(lt * .8) * 6;
    // estrellas: en "locura" empiezan a girar alrededor de la luna cada vez más rápido
    var giro = t > tLocura ? .22 * Math.pow(t - tLocura, 2) : 0;
    ctx.save();
    for (var i = 0; i < ESTRELLAS.length; i++) {
      var s = ESTRELLAS[i], y = (s.y + lt * (8 + s.c * 10)) % H, ang = giro * (.5 + s.c * .3);
      var dx = s.x - cx, dy = y - cy, x2 = cx + dx * Math.cos(ang) - dy * Math.sin(ang), y2 = cy + dx * Math.sin(ang) + dy * Math.cos(ang);
      ctx.fillStyle = giro ? 'hsla(' + ((i * 37 + t * 200) % 360) + ',90%,80%,' + (.5 + .5 * Math.sin(lt * 3 + s.f)) + ')' : 'rgba(255,250,240,' + (.4 + .6 * Math.abs(Math.sin(lt * 1.6 + s.f))) + ')';
      ctx.fillRect(x2, y2, s.r, s.r);
    }
    ctx.restore();
    // estrella fugaz
    var f = prog(lt, 2.2, .7);
    if (f > 0 && f < 1) {
      var fx = mezcla(980, 200, f), fy = mezcla(180, 520, f);
      var gf = ctx.createLinearGradient(fx, fy, fx + 260, fy - 110);
      gf.addColorStop(0, 'rgba(255,255,255,' + (1 - f) + ')'); gf.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = gf; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 260, fy - 110); ctx.stroke();
    }
    // anillos de colores que salen de la luna en cada negra de "locura"
    if (t > tLocura) {
      ctx.save(); ctx.lineWidth = 10;
      for (var n = Math.floor(nNegra(tLocura)); negraT(n) <= t; n++) {
        var a = t - negraT(n);
        if (negraT(n) < tLocura - .01 || a > 1.6) continue;
        ctx.strokeStyle = 'hsla(' + ((n * 55) % 360) + ',100%,68%,' + (1 - a / 1.6) + ')';
        circulo(cx, cy, R_LUNA + a * 700); ctx.stroke();
      }
      ctx.restore();
    }
    // la luna: brillo, foto adentro (en "locura" cambia a otra foto), un poco de gris y los cráteres
    var R = R_LUNA * (.7 + .3 * subida);
    var halo = ctx.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.65);
    halo.addColorStop(0, 'rgba(255,240,215,.35)'); halo.addColorStop(1, 'rgba(255,240,215,0)');
    ctx.fillStyle = halo; ctx.fillRect(cx - R * 1.7, cy - R * 1.7, R * 3.4, R * 3.4);
    ctx.save(); circulo(cx, cy, R); ctx.clip();
    cubrir(imgs[4], FOTOS[4], cx - R, cy - R, 2 * R, 2 * R, 1.08);
    var cambio = prog(t, tLocura, .6);
    if (cambio > 0) { ctx.globalAlpha = cambio; cubrir(imgs[9], FOTOS[9], cx - R, cy - R, 2 * R, 2 * R, 1.1); ctx.globalAlpha = 1; }
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.4)'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(LUNA_TEX, cx - R, cy - R, 2 * R, 2 * R);
    // huellas de sus pasos
    for (i = 0; i < 3; i++) {
      var ah = prog(t, tPise + NEGRA * (i + 1), .2);
      if (ah <= 0) continue;
      var an = ANG_ASTRO + .12 * (i + 1), rh = R - 22;
      ctx.fillStyle = 'rgba(40,30,50,' + .45 * ah + ')';
      ctx.beginPath(); ctx.ellipse(cx + Math.cos(an) * rh, cy + Math.sin(an) * rh, 9, 5, an, 0, PI2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,250,240,.45)'; ctx.lineWidth = 3; circulo(cx, cy, R); ctx.stroke();
    // el astronauta vuela hasta la luna y aterriza en "pise"
    ctx.t = t;
    var p = eInOut(prog(t, TL[8] + .4, tPise - TL[8] - .4));
    var dest = [cx + Math.cos(ANG_ASTRO) * R, cy + Math.sin(ANG_ASTRO) * R];
    var ax = (1 - p) * (1 - p) * 170 + 2 * (1 - p) * p * 60 + p * p * dest[0];
    var ay = (1 - p) * (1 - p) * 1560 + 2 * (1 - p) * p * 900 + p * p * dest[1] + Math.sin(lt * 2) * 12 * (1 - p);
    var aplasta = t > tPise ? 1 - .12 * Math.exp(-(t - tPise) * 8) * Math.cos((t - tPise) * 30) : 1;
    astronauta(ax, ay, 150 * aplasta, mezcla(-.4 + Math.sin(lt * 1.5) * .2, ANG_ASTRO + Math.PI / 2, p), t > tPise && t < tClavando);
    if (t > tClavando - .3) bandera(cx + Math.cos(ANG_BANDERA) * R, cy + Math.sin(ANG_BANDERA) * R, ANG_BANDERA, t);
  }

  // 11 · "pintar tu vida de color": la foto en gris y en cada negra una pincelada le devuelve el color
  var TRAZOS = [
    [[-80, 380], [400, 300], [800, 420], [1160, 330]],
    [[1160, 760], [700, 640], [300, 780], [-80, 700]],
    [[-80, 1080], [380, 980], [760, 1120], [1160, 1020]],
    [[1160, 1420], [720, 1330], [320, 1460], [-80, 1380]],
    [[-80, 1760], [400, 1680], [780, 1800], [1160, 1700]],
    [[200, -80], [300, 700], [180, 1300], [260, 2000]],
    [[880, -80], [800, 600], [920, 1300], [840, 2000]]
  ].map(curva);
  var PINTURAS = ['255,77,121', '255,196,0', '0,200,200', '255,120,60', '170,90,255', '255,77,121', '255,196,0'];
  function pintar(t, lt) {
    var z = 1.05 + .06 * prog(lt, 0, 3.6);
    cubrir(version(2, 'gris'), FOTOS[2], 0, 0, W, H, z);
    cM.setTransform(.5, 0, 0, .5, 0, 0); cM.clearRect(0, 0, W, H); cM.fillStyle = '#fff';
    var algo = false;
    TRAZOS.forEach(function (c, j) {
      var k = eOut(prog(t, TL[10] + j * NEGRA, .4)), hasta = c.largo * k;
      if (k <= 0) return;
      algo = true;
      for (var m = 0; m < c.length && c[m][2] <= hasta; m += 2) {
        var r = 175 + azar(j * 100 + m) * 40;
        cM.beginPath(); cM.arc(c[m][0] + (azar(j * 50 + m) - .5) * 30, c[m][1] + (azar(j * 70 + m) - .5) * 30, r, 0, PI2); cM.fill();
      }
    });
    if (algo) {
      cB.setTransform(1, 0, 0, 1, 0, 0); cB.globalCompositeOperation = 'source-over'; cB.clearRect(0, 0, W, H);
      conCtx(cB, function () { foto(2, z); });
      cB.globalCompositeOperation = 'destination-in'; cB.drawImage(mascara, 0, 0, W, H);
      cB.globalCompositeOperation = 'source-over';
      ctx.drawImage(capaB, 0, 0);
    }
    // un toque de color de pintura donde pasa cada pincelada (se desvanece para no teñir las caras)
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    TRAZOS.forEach(function (c, j) {
      var t0 = TL[10] + j * NEGRA + .2, a = prog(t, t0, .25) * (1 - prog(t, t0 + .45, .5));
      if (a <= 0) return;
      var p = c[Math.floor(c.length * .5)];
      ctx.fillStyle = 'rgba(' + PINTURAS[j] + ',' + .4 * a + ')';
      circulo(p[0], p[1], 260 * eOut(a)); ctx.fill();
    });
    ctx.restore();
    velo();
    corazones(t, tPasion, 14, 1600);
  }

  // 12 · "de sabor, de emoción y ternura": tres polaroids caen una en cada palabra
  var POLAROIDS = [
    { i: 1, x: 330, y: 720, r: -.15, txt: 'sabor', re: /sabor/ },
    { i: 8, x: 740, y: 940, r: .12, txt: 'emoción', re: /emoci/ },
    { i: 14, x: 470, y: 1190, r: -.05, txt: 'ternura', re: /ternura/ }
  ];
  POLAROIDS.forEach(function (p) { p.t = tPalabra(11, p.re); });
  function polaroid(p, t) {
    var a = prog(t, p.t, .5);
    if (a <= 0) return;
    var img = imgs[p.i], e = eOut(a), fw = 410, fh = Math.round(fw * Math.min(1, img.height / img.width));
    var s = 1.7 - .7 * e;
    ctx.save(); ctx.globalAlpha = Math.min(1, a * 3);
    ctx.translate(p.x, p.y - (1 - e) * 120); ctx.rotate(p.r + (1 - e) * .5); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 20 + 30 * (1 - e); ctx.shadowOffsetY = 10 + 40 * (1 - e);
    ctx.fillStyle = '#fbf8f2'; ctx.fillRect(-fw / 2 - 25, -fh / 2 - 25, fw + 50, fh + 135);
    ctx.shadowColor = 'transparent';
    ctx.save(); ctx.beginPath(); ctx.rect(-fw / 2, -fh / 2, fw, fh); ctx.clip();
    cubrir(img, FOTOS[p.i], -fw / 2, -fh / 2, fw, fh, 1.02); ctx.restore();
    ctx.font = '700 64px Caveat, cursive'; ctx.textAlign = 'center'; ctx.fillStyle = '#3d2a2a';
    ctx.fillText(p.txt, 0, fh / 2 + 82);
    ctx.restore();
  }
  function polaroids(t, lt) {
    cubrir(version(2, 'borrosa'), FOTOS[2], 0, 0, W, H, 1.15);
    ctx.fillStyle = 'rgba(25,8,14,.4)'; ctx.fillRect(0, 0, W, H);
    bokeh(lt, 16, 1700, ['oro', 'rosa', 'blanco']);
    var g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, 'rgba(8,3,6,.6)'); g.addColorStop(1, 'rgba(8,3,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
    POLAROIDS.forEach(function (p) { polaroid(p, t); });
  }

  // 13 · "ya no tengo cura": la foto late al ritmo, monitor de latidos y en "cura" se dibuja un corazón
  function latido(f) {
    if (f < .08) return 0;
    if (f < .16) return -Math.sin((f - .08) / .08 * Math.PI) * 14;
    if (f < .2) return 0;
    if (f < .23) return (f - .2) / .03 * 22;
    if (f < .27) return 22 - (f - .23) / .04 * 172;
    if (f < .31) return -150 + (f - .27) / .04 * 200;
    if (f < .34) return 50 - (f - .31) / .03 * 50;
    if (f < .5) return 0;
    if (f < .66) return -Math.sin((f - .5) / .16 * Math.PI) * 26;
    return 0;
  }
  function cura(t, lt) {
    var g = golpe(t);
    foto(12, 1.05 + .05 * prog(lt, 0, 4) + .025 * g);
    var r = ctx.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1200);
    r.addColorStop(0, 'rgba(255,30,80,0)'); r.addColorStop(1, 'rgba(255,30,80,' + (.15 + .3 * g) + ')');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    velo();
    var gt = ctx.createLinearGradient(0, 0, 0, 640);
    gt.addColorStop(0, 'rgba(8,3,6,.55)'); gt.addColorStop(1, 'rgba(8,3,6,0)');
    ctx.fillStyle = gt; ctx.fillRect(0, 0, W, 640);
    // monitor: la cabeza recorre la pantalla en un compás y cada pico cae justo en una negra
    var Y = 380, CELDA = W / 4, origen = negraT(Math.floor(nNegra(TL[12]) / 4) * 4);
    var cab = (((t - origen) / COMPAS) % 1) * W, aparece = prog(lt, 0, .4);
    function trazo(x0, x1) {
      ctx.beginPath();
      for (var x = x0; x <= x1; x += 4) { var y = Y + latido((x / CELDA + .27) % 1); if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.save(); ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.strokeStyle = '#ff4d6d'; ctx.shadowColor = '#ff2a55'; ctx.shadowBlur = 18;
    ctx.globalAlpha = aparece; trazo(0, cab);
    ctx.globalAlpha = .22 * aparece; trazo(Math.min(W, cab + 40), W);
    ctx.globalAlpha = aparece; ctx.fillStyle = '#fff'; circulo(cab, Y + latido((cab / CELDA + .27) % 1), 8); ctx.fill();
    // corazón que se dibuja en "cura"
    var k = prog(t, tCura, .8);
    if (k > 0) {
      ctx.globalAlpha = 1; ctx.lineWidth = 8; ctx.strokeStyle = '#ff4d6d';
      var per = 900; ctx.setLineDash([per * eInOut(k), per]);
      trazarCorazon(W / 2, Y - 10, 220 * (1 + .06 * golpe(t))); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,77,109,' + .5 * prog(t, tCura + .6, .4) * (.6 + .4 * g) + ')'; ctx.fill();
    }
    ctx.restore();
  }

  // 14 · "sin tu amor": las 15 fotos forman un corazón y al final su nombre adentro, con fuegos artificiales
  var ORDEN_ANILLO = [3, 0, 6, 12, 2, 11, 9, 14, 4, 13, 1, 7, 10, 5, 8];
  var ANILLO = (function () {
    var pts = [], largo = 0, prev;
    for (var k = 0; k <= 2000; k++) {
      var u = Math.PI + k / 2000 * PI2;
      var p = [540 + 16 * Math.pow(Math.sin(u), 3) * 26, 795 - (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * 26];
      if (prev) largo += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      p[2] = largo; pts.push(p); prev = p;
    }
    var out = [];
    for (var j = 0; j < 15; j++) { var s = j / 15 * largo; out.push(pts.find(function (q) { return q[2] >= s; }) || pts[pts.length - 1]); }
    return out;
  })();
  var FUEGOS = [];
  for (var nf = 0; nf < 8; nf++) FUEGOS.push({ t: negraT(190 + nf * 2), x: 170 + azar(nf + 1700) * 740, y: nf % 3 === 2 ? 1430 + azar(nf + 1710) * 120 : 230 + azar(nf + 1720) * 260, c: ['#ffd166', '#ff5c8a', '#ffffff', '#7ad8ff'][nf % 4] });
  function burbuja(i, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff8ef'; circulo(0, 0, r + 6); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.save(); circulo(0, 0, r); ctx.clip(); ctx.drawImage(version(i, 'mini'), -r, -r, 2 * r, 2 * r); ctx.restore();
    ctx.restore();
  }
  function final(t, lt) {
    var g = ctx.createRadialGradient(W / 2, 820, 80, W / 2, 900, 1300);
    g.addColorStop(0, '#5a1236'); g.addColorStop(.6, '#2a0818'); g.addColorStop(1, '#10030a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    bokeh(lt, 22, 1800, ['oro', 'rosa', 'blanco']);
    var a = t - T_GOLPE;
    // resplandor del corazón y onda en el golpe
    if (a > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,190,110,' + (.12 + .1 * golpe(t)) + ')'; trazarCorazon(540, 790, 980); ctx.fill();
      if (a < 1.2) { ctx.strokeStyle = 'rgba(255,220,150,' + (1 - a / 1.2) + ')'; ctx.lineWidth = 14; circulo(540, 860, 100 + a * 1100); ctx.stroke(); }
      ctx.restore();
    }
    for (var j = 0; j < 15; j++) {
      var p = ANILLO[j], k = prog(t, TL[13] + j * .06, .9), e = eOut(k);
      if (k <= 0) continue;
      var ang = azar(j * 3 + 500) * PI2;
      var x = mezcla(540 + Math.cos(ang) * 1400, p[0], e), y = mezcla(860 + Math.sin(ang) * 1400, p[1], e);
      burbuja(ORDEN_ANILLO[j], x, y, 76 * (1 + .08 * golpe(t - j * .03)) * (.5 + .5 * e), (1 - e) * 4);
    }
    FUEGOS.forEach(function (f, i) { fuegos(t, f.t, f.x, f.y, f.c, 1800 + i * 60); });
    // "Mi amor" adentro del corazón
    var k2 = prog(t, T_GOLPE + .05, 1.2);
    if (k2 > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, k2 * 2);
      ctx.font = '800 34px Montserrat, sans-serif'; ctx.fillStyle = '#fff1dc'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
      textoEspaciado('FELIZ CUMPLEAÑOS', W / 2, 715 + (1 - eOut(k2)) * 24, 9);
      ctx.restore();
      ctx.save(); ctx.translate(W / 2, 880); var s = .8 + .2 * eOut(k2) + .02 * golpe(t); ctx.scale(s, s);
      nombre(t, 0, 0, 175, eOut(prog(t, T_GOLPE + .25, 1.1)), NOMBRE_FINAL);
      ctx.restore();
      var k3 = prog(t, T_GOLPE + 1.6, .9);
      if (k3 > 0) {
        ctx.save(); ctx.globalAlpha = k3; ctx.font = 'italic 400 46px "Playfair Display", Georgia, serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe9cf'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 14;
        ctx.fillText(DEDICATORIA[0], CX, 1400 + (1 - eOut(k3)) * 20); ctx.fillText(DEDICATORIA[1], CX, 1462 + (1 - eOut(k3)) * 20);
        ctx.restore();
      }
      for (var i = 0; i < 18; i++) destello(300 + azar(i + 1900) * 480, 640 + azar(i + 1910) * 360, .5 + azar(i + 1920) * .7, Math.pow(Math.max(0, Math.sin(t * 3.2 + i * 1.9)), 6) * k2);
    }
  }

  // ---------------------------------------------------------------- transiciones
  // cada una recibe el avance k (0 a 1) y dos funciones: pintar la escena anterior y pintar la nueva
  function enCapa(fn) {
    cA.setTransform(1, 0, 0, 1, 0, 0); cA.globalAlpha = 1; cA.globalCompositeOperation = 'source-over'; cA.clearRect(0, 0, W, H);
    conCtx(cA, fn);
    return capaA;
  }
  function eFlash(d) {
    return { d: d, fn: function (t, k, prev, yo) { yo(); ctx.fillStyle = 'rgba(255,248,235,' + (1 - k) * (1 - k) + ')'; ctx.fillRect(0, 0, W, H); } };
  }
  function eIris(d, cx, cy) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        var r = eInOut(k) * 1300;
        ctx.save(); circulo(cx, cy, r); ctx.clip(); yo(); ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(255,200,215,' + (1 - k) + ')'; ctx.lineWidth = 18; ctx.shadowColor = '#ff8fab'; ctx.shadowBlur = 30;
        circulo(cx, cy, r); ctx.stroke(); ctx.restore();
      }
    };
  }
  function eLatigo(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        var e = eInOut(k);
        ctx.save(); ctx.translate(-e * W, 0); prev(); ctx.restore();
        var capa = enCapa(yo);
        ctx.save(); ctx.translate((1 - e) * W, 0);
        for (var j = 3; j >= 0; j--) { ctx.globalAlpha = j ? .25 * (1 - k) : 1; ctx.drawImage(capa, j * 70 * (1 - k), 0); }
        ctx.restore();
      }
    };
  }
  function eOla(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        var e = eInOut(k), borde = H + 80 - e * (H + 240);
        function orilla() {
          ctx.beginPath(); ctx.moveTo(0, H);
          for (var x = 0; x <= W; x += 30) ctx.lineTo(x, borde + Math.sin(x * .012 + t * 6) * 34 * (1 - e * .5));
          ctx.lineTo(W, H); ctx.closePath();
        }
        ctx.save(); orilla(); ctx.clip(); yo(); ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + .85 * (1 - k) + ')'; ctx.lineWidth = 14;
        ctx.beginPath();
        for (var x = 0; x <= W; x += 30) ctx.lineTo(x, borde + Math.sin(x * .012 + t * 6) * 34 * (1 - e * .5));
        ctx.stroke(); ctx.restore();
      }
    };
  }
  function eQuemado(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        ctx.globalAlpha = eInOut(k); ctx.drawImage(enCapa(yo), 0, 0); ctx.globalAlpha = 1;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        var r = ctx.createRadialGradient(W * .8, H * .2, 0, W * .8, H * .2, 1400);
        r.addColorStop(0, 'rgba(255,170,70,' + Math.sin(k * Math.PI) * .9 + ')'); r.addColorStop(1, 'rgba(255,90,20,0)');
        ctx.fillStyle = r; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
    };
  }
  function eDisolver(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        var e = eInOut(k), s = 1.06 - .06 * e;
        ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
        ctx.drawImage(enCapa(yo), 0, 0); ctx.restore();
      }
    };
  }
  function eNeon(d) {
    var PATRON = [0, 1, 0, 0, 1, .3, 1, 1];
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        var a = PATRON[Math.min(PATRON.length - 1, Math.floor(k * PATRON.length))];
        if (a > 0) { ctx.globalAlpha = a; ctx.drawImage(enCapa(yo), 0, 0); ctx.globalAlpha = 1; }
      }
    };
  }
  // la cremallera baja por el centro y se abre en V; adentro ya está la escena nueva
  function eCremallera(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        prev();
        var e = eInOut(k), ys = -60 + e * (H + 1000), cx = W / 2;
        function abre(y) { return Math.min(W, Math.max(0, (ys - y) * .65)); }
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, Math.min(ys, H + 10));
        for (var y = Math.min(ys, H + 10); y >= -10; y -= 20) ctx.lineTo(cx - abre(y) / 2, y);
        for (y = -10; y <= Math.min(ys, H + 10); y += 20) ctx.lineTo(cx + abre(y) / 2, y);
        ctx.closePath(); ctx.clip(); yo(); ctx.restore();
        // dientes: abajo del cierre van trabados al centro, arriba se separan con la tela
        ctx.save(); ctx.globalAlpha = prog(k, 0, .08);
        for (y = -10; y < H + 20; y += 16) {
          var w = y > ys ? 0 : abre(y) / 2, lado = Math.round(y / 16) % 2 ? 1 : -1;
          ctx.fillStyle = (Math.round(y / 16) % 2) ? '#e9d8a6' : '#c8b27a';
          if (w === 0) ctx.fillRect(cx - 9 + lado * 4, y, 18, 10);
          else { ctx.fillRect(cx - w - 14, y, 18, 10); ctx.fillRect(cx + w - 4, y + 8, 18, 10); }
        }
        if (ys < H + 80) {
          var gz = ctx.createLinearGradient(cx - 30, ys - 50, cx + 30, ys + 60);
          gz.addColorStop(0, '#fff6d8'); gz.addColorStop(.5, '#c9a95e'); gz.addColorStop(1, '#7a5d22');
          ctx.fillStyle = gz; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.moveTo(cx - 34, ys - 50); ctx.lineTo(cx + 34, ys - 50); ctx.lineTo(cx + 22, ys + 22); ctx.lineTo(cx - 22, ys + 22); ctx.closePath(); ctx.fill();
          rectRedondo(cx - 14, ys + 14, 28, 80, 12); ctx.fill();
          ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(60,40,10,.6)'; rectRedondo(cx - 6, ys + 54, 12, 28, 6); ctx.fill();
        }
        ctx.restore();
      }
    };
  }
  // despegue: la escena de abajo se va hacia abajo (la cámara sube) y del cielo baja el espacio
  function eDespegue(d) {
    return {
      d: d, fn: function (t, k, prev, yo) {
        var e = eInOut(k);
        ctx.save(); ctx.translate(0, e * H); prev(); ctx.restore();
        ctx.save(); ctx.translate(0, -(1 - e) * H); yo(); ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + Math.sin(k * Math.PI) * .6 + ')'; ctx.lineWidth = 3;
        for (var i = 0; i < 40; i++) { var x = azar(i + 2000) * W, y = azar(i + 2010) * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 160 * Math.sin(k * Math.PI)); ctx.stroke(); }
        ctx.restore();
      }
    };
  }

  var ESCENAS = [
    { t0: T_INI, dibujar: intro },
    { t0: TL[0], dibujar: cumple, entrada: eFlash(.55) },
    { t0: TL[1], dibujar: rosa, entrada: eIris(.7, 600, 800) },
    { t0: TL[2], dibujar: carnaval, entrada: eLatigo(.4) },
    { t0: TL[3], dibujar: mar, entrada: eOla(.8) },
    { t0: TL[4], dibujar: tango, entrada: eQuemado(.5) },
    { t0: TL[5], dibujar: maravilla, entrada: eDisolver(.3) },
    { t0: TL[6], dibujar: baile, entrada: eNeon(.4) },
    { t0: tCremallera, dibujar: faldas, entrada: eCremallera(TL[7] - tCremallera) },
    { t0: TL[8], dibujar: espacio, entrada: eDespegue(.9) },
    { t0: TL[10], dibujar: pintar, entrada: eFlash(.4) },
    { t0: TL[11], dibujar: polaroids, entrada: eDisolver(.4) },
    { t0: TL[12], dibujar: cura, entrada: eDisolver(.45) },
    { t0: TL[13], dibujar: final, entrada: eDisolver(.5) }
  ];

  // ---------------------------------------------------------------- un cuadro completo
  var SACUDIDAS = [[tCumple, 8], [tClavando, 18], [T_GOLPE, 12]].concat(POLAROIDS.map(function (p) { return [p.t + .35, 9]; }));
  function camara(t) {
    var z = 1 + .012 * golpe(t), sx = 0, sy = 0;
    SACUDIDAS.forEach(function (s) {
      var a = t - s[0];
      if (a < 0 || a > .7) return;
      var f = s[1] * Math.exp(-a * 8);
      sx += Math.sin(a * 55) * f; sy += Math.cos(a * 47) * f;
    });
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  }
  function fugasDeLuz(t) {
    var esp = t >= TL[8] && t < TL[10], a = (esp ? .1 : .14) + .12 * golpeFuerte(t);
    var c1 = esp ? '110,90,255' : '255,140,60', c2 = esp ? '255,60,200' : '255,70,120';
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    [[W * (.05 + .15 * Math.sin(t * .3)), H * (.18 + .08 * Math.sin(t * .23)), c1], [W * (.95 - .12 * Math.sin(t * .27)), H * (.78 + .06 * Math.sin(t * .31)), c2]].forEach(function (b) {
      var r = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], 760);
      r.addColorStop(0, 'rgba(' + b[2] + ',' + a + ')'); r.addColorStop(1, 'rgba(' + b[2] + ',0)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    });
    ctx.restore();
  }
  function grano(t) {
    var f = Math.floor(t * 24);
    ctx.save(); ctx.globalAlpha = .06; ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(GRANO[f % 4], -azar(f) * 60, -azar(f + 1) * 60, W + 80, H + 80);
    ctx.restore();
  }
  function pintarCuadro(t) {
    ctx = real;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var i = 0;
    while (i < ESCENAS.length - 1 && ESCENAS[i + 1].t0 <= t) i++;
    var esc = ESCENAS[i], lt = t - esc.t0;
    ctx.save(); camara(t);
    function de(e) { return function () { ctx.save(); e.dibujar(t, t - e.t0); ctx.restore(); }; }
    if (i > 0 && esc.entrada && lt < esc.entrada.d) esc.entrada.fn(t, lt / esc.entrada.d, de(ESCENAS[i - 1]), de(esc));
    else de(esc)();
    ctx.restore();
    fugasDeLuz(t);
    ctx.drawImage(VINETA, 0, 0);
    grano(t);
    letra(t);
    var negro = prog(t, T_FIN - 1.7, 1.5);
    if (negro > 0) { ctx.fillStyle = 'rgba(0,0,0,' + negro + ')'; ctx.fillRect(0, 0, W, H); }
  }

  // ---------------------------------------------------------------- reproducir, pausar y grabar
  var portada = document.getElementById('portada'), btnVer = document.getElementById('cp-ver');
  var btnGrabar = document.getElementById('cp-grabar'), lnkDescargar = document.getElementById('cp-descargar');
  var aviso = document.getElementById('cp-aviso'), icoPausa = document.getElementById('cp-pausa');
  var q = new URLSearchParams(location.search), T_ARRANQUE = q.has('t') ? +q.get('t') : T_INI;
  var estado = 'cargando', grabador = null, trozos = [], urlVideo = null;
  var audioCtx = null, fuente = null, volumen = null, destino = null;
  var ultimoAudio = -1, ultimoReloj = 0;
  // el reloj es el audio; entre dos lecturas iguales se interpola con el reloj del navegador
  function tiempoActual() {
    var a = audio.currentTime, p = performance.now();
    if (a !== ultimoAudio) { ultimoAudio = a; ultimoReloj = p; return a; }
    return audio.paused ? a : a + (p - ultimoReloj) / 1000;
  }
  function bucle() {
    if (estado !== 'tocando') return;
    var t = tiempoActual();
    if (t >= T_FIN) { terminar(); return; }
    var vol = lim((t - T_ARRANQUE) / .35, 0, 1);
    if (volumen) volumen.gain.value = vol; else audio.volume = vol;
    pintarCuadro(t);
    requestAnimationFrame(bucle);
  }
  function arrancar() {
    portada.hidden = true; icoPausa.hidden = true;
    audio.currentTime = T_ARRANQUE;
    estado = 'tocando';
    return audio.play().then(function () { requestAnimationFrame(bucle); }, function (err) {
      estado = 'portada'; portada.hidden = false; aviso.textContent = 'No se pudo reproducir el audio: ' + err.message;
    });
  }
  function ver() {
    if (estado === 'cargando') return;
    if (document.documentElement.requestFullscreen && matchMedia('(pointer: coarse)').matches) document.documentElement.requestFullscreen().catch(function () {});
    arrancar();
  }
  function grabar() {
    if (estado === 'cargando') return;
    if (location.protocol === 'file:') {
      aviso.textContent = 'Para grabar con música hay que abrir la página desde un servidor (GitHub Pages, o "python3 -m http.server" en la carpeta del proyecto). Mientras tanto puedes grabar la pantalla del cel con "Ver el video".';
      return;
    }
    if (!window.MediaRecorder || !lienzo.captureStream) { aviso.textContent = 'Este navegador no puede grabar. Usa Chrome en la computadora o graba la pantalla con "Ver el video".'; return; }
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      fuente = audioCtx.createMediaElementSource(audio); volumen = audioCtx.createGain(); destino = audioCtx.createMediaStreamDestination();
      fuente.connect(volumen); volumen.connect(destino); volumen.connect(audioCtx.destination);
    }
    audioCtx.resume();
    // lo mejor para TikTok es H.264 + AAC (Chrome en Windows, Mac y Android); Chrome en Linux no graba AAC y ahí
    // sale H.264 + Opus; VP9 o webm solo si no hay de otra
    var tipo = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1.640028,opus',
      'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
      .filter(function (m) { return MediaRecorder.isTypeSupported(m); })[0];
    var flujo = new MediaStream(lienzo.captureStream(30).getVideoTracks().concat(destino.stream.getAudioTracks()));
    grabador = new MediaRecorder(flujo, { mimeType: tipo, videoBitsPerSecond: 14000000, audioBitsPerSecond: 192000 });
    trozos = [];
    grabador.ondataavailable = function (e) { if (e.data.size) trozos.push(e.data); };
    grabador.onstop = function () {
      var mime = grabador.mimeType || tipo || 'video/webm', ext = /mp4/.test(mime) ? 'mp4' : 'webm';
      if (urlVideo) URL.revokeObjectURL(urlVideo);
      urlVideo = URL.createObjectURL(new Blob(trozos, { type: mime }));
      lnkDescargar.href = urlVideo; lnkDescargar.download = 'feliz-cumple-javiera.' + ext; lnkDescargar.hidden = false;
      lnkDescargar.click();
      aviso.textContent = /avc1.*mp4a/.test(mime) ? 'Listo: el video se descargó (1080×1920, mp4 H.264 + AAC), listo para TikTok.' :
        'Listo: el video se descargó (1080×1920, ' + mime.replace('video/', '') + '). Si TikTok no lo acepta, pásalo por CapCut y expórtalo en mp4.';
      document.body.classList.remove('cp-grabando'); grabador = null;
    };
    document.body.classList.add('cp-grabando');
    pintarCuadro(T_ARRANQUE);
    grabador.start(1000);
    setTimeout(arrancar, 150);
  }
  function terminar() {
    estado = 'portada';
    audio.pause();
    pintarCuadro(T_FIN - .01);
    btnVer.textContent = '↺ Ver otra vez';
    portada.hidden = false;
    if (grabador && grabador.state === 'recording') setTimeout(function () { grabador.stop(); }, 250);
  }
  function pausar() {
    if (grabador) return;   // mientras se graba no se pausa
    if (estado === 'tocando') { audio.pause(); estado = 'pausa'; icoPausa.hidden = false; }
    else if (estado === 'pausa') { estado = 'tocando'; icoPausa.hidden = true; audio.play().then(function () { requestAnimationFrame(bucle); }); }
  }
  btnVer.addEventListener('click', ver);
  btnGrabar.addEventListener('click', grabar);
  lienzo.addEventListener('click', pausar);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') { e.preventDefault(); if (estado === 'portada') ver(); else pausar(); }
    else if ((e.code === 'ArrowRight' || e.code === 'ArrowLeft') && !grabador && estado !== 'portada') audio.currentTime += e.code === 'ArrowRight' ? 5 : -5;
  });
  // para revisar cuadros sueltos sin audio (desde la consola): __cuadro(200)
  window.__cuadro = function (t) { portada.hidden = true; pintarCuadro(t); };
  // herramientas/video-cumple.mjs lee de aquí qué pedazo de la canción va en el mp4
  window.__tramo = { ini: T_INI, fin: T_FIN, audio: audio.getAttribute('src') };

  // ---------------------------------------------------------------- carga: fotos, fuentes y las versiones que se usan
  var cargas = FOTOS.map(function (f, i) {
    return new Promise(function (ok, mal) {
      var im = new Image();
      im.onload = function () { imgs[i] = im; (im.decode ? im.decode() : Promise.resolve()).then(ok, ok); };
      im.onerror = function () { mal(new Error('no se encontró img/cumple/' + String(i).padStart(2, '0') + '.jpg')); };
      im.src = 'img/cumple/' + String(i).padStart(2, '0') + '.jpg';
    });
  });
  var fuentes = document.fonts ? [F_LETRA, fuenteClave(150), fuenteNombre(200), '800 40px Montserrat', '700 60px Caveat', 'italic 400 40px "Playfair Display"']
    .map(function (f) { return document.fonts.load(f, 'Javiera CUMPLEAÑOS ñó♪'); }) : [];
  // el audio se carga completo en memoria: así siempre se puede adelantar al minuto 2:46, aunque el servidor no
  // permita pedir pedazos del archivo (como "python3 -m http.server"); desde file:// se deja como está
  var cargaAudio = location.protocol === 'file:' ? Promise.resolve() : fetch(audio.getAttribute('src'))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); })
    .then(function (b) { audio.src = URL.createObjectURL(b); }, function () {});
  Promise.all(cargas.concat(fuentes, [cargaAudio])).then(function () {
    prepararSprites();
    [[2, 'gris'], [3, 'sepia'], [8, 'sepia'], [8, 'borrosa-sepia'], [2, 'borrosa']].forEach(function (v) { version(v[0], v[1]); });
    FOTOS.forEach(function (f, i) { version(i, 'mini'); });
    // cada foto (y cada versión) se pinta una vez chiquita: así la tarjeta de video ya la tiene y no da tirón
    // la primera vez que aparece (en la intro sale una foto nueva en cada negra)
    imgs.concat(Object.keys(versiones).map(function (k) { return versiones[k]; }), [VINETA, LUNA_TEX, MEDIA_LUNA, DESTELLO, capaA, capaB, mascara, agua])
      .forEach(function (im) { real.drawImage(im, 0, 0, 8, 8); });
    estado = 'portada';
    pintarCuadro(T_INI + 4.4);
    btnVer.textContent = '▶ Ver el video'; btnVer.disabled = false; btnGrabar.disabled = false;
    window.__listo = true;
  }, function (err) {
    btnVer.textContent = 'Error al cargar'; aviso.textContent = err.message;
  });
})();
