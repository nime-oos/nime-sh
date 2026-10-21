// Escena estilo portada "No digas nada": pastel al óleo sobre papel + marcador negro.
// Todo se anima como dibujo hecho a mano: 3 cuadros que se alternan ("hervor"),
// líneas que se dibujan solas y movimientos a saltitos.
// También maneja los subtítulos sincronizados con el audio.
(function () {
  var escena = document.getElementById('escena');
  var sub = document.getElementById('subtitulo');
  var audio = document.getElementById('bg-music');
  if (!escena || !sub || !audio) return;

  var CUADROS = 3, FPS_DIBUJO = 125; // ms por cuadro (~8 cuadros por segundo)

  function el(cls, parent, css) {
    var d = document.createElement('div');
    d.className = cls;
    if (css) d.style.cssText = css;
    parent.appendChild(d);
    return d;
  }
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // ---- filtros SVG: contorno tembloroso de marcador + borde irregular de pastel ----
  var defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', 0); defs.setAttribute('height', 0);
  defs.style.position = 'absolute';
  defs.innerHTML =
    '<filter id="marcador" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence id="hervor" type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="1" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="7"/></filter>' +
    '<filter id="pastel" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence id="hervor2" type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="1" result="w"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="w" scale="9"/></filter>';
  document.body.appendChild(defs);

  // ---- rayado de crayón: ida y vuelta con fibras finas encima ----
  function rayado(c, x, y, ang, len, filas, sep, ancho, color, alfa) {
    var ca = Math.cos(ang), sa = Math.sin(ang), pts = [];
    for (var p = 0; p < filas; p++) {
      var a = p % 2 ? len : 0, lado = p * sep + rnd(-2, 2), ext = rnd(-12, 12);
      pts.push([x + ca * (a + ext) - sa * lado, y + sa * (a + ext) + ca * lado]);
    }
    return { pts: pts, color: color, ancho: ancho, alfa: alfa };
  }
  function trazar(c, tr, temblor) {
    c.strokeStyle = tr.color;
    c.lineCap = c.lineJoin = 'round';
    for (var f = 0; f < 3; f++) {
      c.globalAlpha = tr.alfa * (f ? .45 : 1);
      c.lineWidth = f ? tr.ancho * .3 : tr.ancho;
      var off = f ? rnd(-tr.ancho, tr.ancho) : 0;
      c.beginPath();
      tr.pts.forEach(function (pt, i) {
        var x = pt[0] + off + rnd(-temblor, temblor), y = pt[1] + off + rnd(-temblor, temblor);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  function grano(c, w, h, cant, alfa) {
    c.globalAlpha = alfa;
    for (var g = 0; g < cant; g++) { c.fillStyle = Math.random() < .5 ? '#fff' : '#123'; c.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4); }
    c.globalAlpha = 1;
  }
  // genera una textura (lista de trazos) y la pinta en 3 cuadros con temblor distinto
  function texturas(w, h, base, lista, temblor) {
    var urls = [];
    for (var q = 0; q < CUADROS; q++) {
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var c = cv.getContext('2d');
      c.fillStyle = base; c.fillRect(0, 0, w, h);
      lista.forEach(function (tr) { trazar(c, tr, temblor); });
      grano(c, w, h, w * h / 60, .1);
      urls.push(cv.toDataURL('image/jpeg', .85));
    }
    return urls;
  }

  // ---- fondo de pantalla: papel + pastel azul con orilla irregular ----
  var lienzos = [];
  for (var q = 0; q < CUADROS; q++) {
    var cv = document.createElement('canvas');
    cv.className = 'lienzo';
    escena.appendChild(cv);
    lienzos.push(cv);
  }
  function pintarFondo() {
    var w = innerWidth, h = innerHeight, m = Math.min(w, h) * .035;
    var azules = ['#2ba6ea', '#3ab4f0', '#1f93dc', '#5cc4f4', '#2a9ee2'];
    var otros = ['#f1f5f4', '#dcebf5', '#2fb39a', '#68cfb4', '#c7cdef', '#e9e68a'];
    var lista = [];
    for (var n = 0; n < 420; n++) {
      var x = rnd(m, w - m), y = rnd(m, h - m);
      lista.push(rayado(null, x, y, rnd(-1.2, 1.2) + (Math.random() < .5 ? 1.5 : 0), rnd(40, 200), Math.round(rnd(3, 9)), rnd(4, 8), rnd(4, 10),
        Math.random() < .15 ? pick(otros) : pick(azules), rnd(.3, .7)));
    }
    lienzos.forEach(function (cv) {
      cv.width = w; cv.height = h;
      var c = cv.getContext('2d');
      c.fillStyle = '#ebe6da'; c.fillRect(0, 0, w, h);
      // orilla: muchas pinceladas cortas para que el borde se vea pintado a mano
      c.save();
      c.beginPath();
      var pts = [], t;
      for (t = 0; t <= 1; t += .02) pts.push([m + t * (w - 2 * m), m + rnd(-4, 7)]);
      for (t = 0; t <= 1; t += .02) pts.push([w - m + rnd(-7, 3), m + t * (h - 2 * m)]);
      for (t = 1; t >= 0; t -= .02) pts.push([m + t * (w - 2 * m), h - m + rnd(-7, 4)]);
      for (t = 1; t >= 0; t -= .02) pts.push([m + rnd(-3, 7), m + t * (h - 2 * m)]);
      pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.fillStyle = '#2fa9ea'; c.fill();
      c.clip();
      lista.forEach(function (tr) { trazar(c, tr, 1.5); });
      c.restore();
      grano(c, w, h, 7000, .1);
    });
  }
  pintarFondo();
  var tRes;
  window.addEventListener('resize', function () { clearTimeout(tRes); tRes = setTimeout(pintarFondo, 200); });

  // ---- texturas de la cara (verde-turquesa) y de los corazones (rojo) ----
  var verdes = ['#25a58c', '#34b58b', '#1d8f7f', '#49c29a', '#2c9fd6', '#3aa8dc', '#1f7f6a', '#6bd0b1'];
  var brillos = ['#eef4f1', '#d6ece6', '#cfd3f0', '#cfe58a', '#f0e27a'];
  var listaCara = [];
  for (var n = 0; n < 260; n++) {
    // más blanco arriba a la izquierda, como en la portada
    var x = rnd(-40, 660), y = rnd(40, 600), arribaIzq = x < 330 && y < 260;
    var col = Math.random() < (arribaIzq ? .3 : .08) ? pick(brillos) : pick(verdes);
    listaCara.push(rayado(null, x, y, rnd(-1.4, -.3) + (Math.random() < .4 ? 1.6 : 0), rnd(40, 170), Math.round(rnd(3, 8)), rnd(4, 7), rnd(4, 9), col, rnd(.35, .8)));
  }
  var texCara = texturas(660, 620, '#27a88e', listaCara, 1.5);
  var listaRojo = [];
  for (n = 0; n < 60; n++) {
    listaRojo.push(rayado(null, rnd(0, 200), rnd(0, 160), rnd(-.8, .8), rnd(30, 90), Math.round(rnd(3, 6)), rnd(3, 5), rnd(3, 7),
      pick(['#d13a22', '#b92a1a', '#e2502f', '#a82318', '#e8765a']), rnd(.4, .8)));
  }
  var texRojo = texturas(200, 160, '#c9311e', listaRojo, 1);
  // herramientas de crayón compartidas con las otras escenas del álbum (js/escena-humano.js)
  window.Crayon = { el: el, rnd: rnd, pick: pick, rayado: rayado, trazar: trazar, grano: grano, texturas: texturas,
    texRojo: texRojo, CUADROS: CUADROS, FPS_DIBUJO: FPS_DIBUJO };

  // ---- la ilustración (coordenadas tomadas de la portada, 640x640) ----
  var mundo = el('mundo', escena);
  var carita = el('carita', mundo);
  var L = 'class="linea" pathLength="1" fill="none" stroke="#161616" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"';
  var CABEZA = 'M45 205 C50 140 92 112 170 100 C300 85 470 88 545 105 C595 118 606 165 600 210 C640 205 646 282 606 286 ' +
    'C616 360 592 440 540 482 C470 530 300 540 160 522 C80 510 30 470 25 400 C20 340 25 300 35 280 C0 275 -4 205 45 205Z';
  var COR_I = 'M170 335 C115 315 88 285 95 255 C102 228 140 225 158 250 C172 222 215 218 228 245 C240 275 215 310 170 335Z';
  var COR_D = 'M505 365 C465 345 448 318 455 293 C462 272 490 272 500 290 C512 268 545 268 555 292 C565 322 540 348 505 365Z';
  function letra(ch, x, y, tam, rot, i) {
    return '<text class="letra" x="' + x + '" y="' + y + '" font-size="' + tam + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')" ' +
      'style="animation-delay:-' + (i * .23).toFixed(2) + 's">' + ch + '</text>';
  }
  carita.innerHTML =
    '<svg viewBox="-10 60 670 560" style="width:100%;height:100%;overflow:visible">' +
      '<defs>' +
        '<clipPath id="clipCara"><path d="' + CABEZA + '"/></clipPath>' +
        '<clipPath id="clipCorI"><path d="' + COR_I + '"/></clipPath>' +
        '<clipPath id="clipCorD"><path d="' + COR_D + '"/></clipPath>' +
      '</defs>' +
      // relleno de pastel dentro de la cabeza
      '<g filter="url(#pastel)" clip-path="url(#clipCara)"><image class="tex-cara" href="' + texCara[0] + '" x="-10" y="40" width="660" height="620" preserveAspectRatio="none"/></g>' +
      // líneas de marcador
      '<g filter="url(#marcador)">' +
        '<path ' + L + ' d="' + CABEZA + '"/>' +
        '<circle class="punto" cx="35" cy="232" r="10" fill="#161616"/>' +
        '<circle class="punto" cx="614" cy="258" r="10" fill="#161616" style="animation-delay:-.4s"/>' +
        // ojos: cúpulas con pestañas y pupila que mira a los lados
        '<g class="ojo">' +
          '<path ' + L + ' d="M140 240 C132 190 170 160 225 162 C280 164 322 200 320 250 C260 256 190 250 140 240Z"/>' +
          '<path ' + L + ' d="M148 172 L172 194 M206 128 L214 162 M268 164 L292 146"/>' +
          '<circle class="pupila" cx="275" cy="210" r="10" fill="#161616"/>' +
        '</g>' +
        '<g class="ojo" style="animation-delay:-.2s">' +
          '<path ' + L + ' d="M368 250 C362 195 400 162 455 165 C510 168 552 205 552 262 C490 268 420 262 368 250Z"/>' +
          '<path ' + L + ' d="M386 158 L400 188 M462 136 L462 167 M522 182 L548 166"/>' +
          '<circle class="pupila" cx="512" cy="228" r="10" fill="#161616"/>' +
        '</g>' +
        // boca: contorno, dientes, labio interior y garabato nervioso
        '<g class="boca">' +
          '<path ' + L + ' d="M150 345 C250 322 450 322 548 342 C570 380 562 450 520 470 C420 495 250 495 170 470 C120 455 115 380 150 345Z"/>' +
          '<path ' + L + ' d="M250 332 C245 365 262 375 283 372 C303 368 310 350 305 330 M318 330 C315 360 335 372 358 368 C380 364 386 345 382 332"/>' +
          '<path ' + L + ' d="M172 452 C150 420 168 396 220 392 C330 385 430 388 490 398"/>' +
          '<path ' + L + ' d="M470 372 C458 402 470 428 502 432"/>' +
          '<path class="linea nervio" pathLength="1" fill="none" stroke="#161616" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" ' +
            'd="M278 422 C290 404 300 432 312 418 C322 406 332 426 342 414 C346 428 340 440 334 450"/>' +
        '</g>' +
      '</g>' +
      // corazones rojos pintados encima de las líneas (como en la portada)
      '<g class="cor" filter="url(#pastel)" clip-path="url(#clipCorI)"><image class="tex-rojo" href="' + texRojo[0] + '" x="85" y="210" width="155" height="130" preserveAspectRatio="none"/></g>' +
      '<g class="cor" style="animation-delay:.3s" filter="url(#pastel)" clip-path="url(#clipCorD)"><image class="tex-rojo" href="' + texRojo[1] + '" x="445" y="262" width="125" height="108" preserveAspectRatio="none"/></g>' +
      // título en letras blancas de crayón
      '<g class="titulo" filter="url(#pastel)" fill="#eef2f3" font-family="Fredoka, \'Arial Rounded MT Bold\', sans-serif" font-weight="700">' +
        letra('N', 385, 578, 44, -4, 0) + letra('o', 418, 578, 36, 6, 1) + letra('D', 458, 572, 40, -3, 2) + letra('i', 486, 570, 34, 4, 3) +
        letra('G', 500, 575, 42, -6, 4) + letra('A', 532, 560, 36, 5, 5) + letra('s', 560, 566, 32, -4, 6) +
        letra('N', 440, 618, 44, 3, 7) + letra('A', 474, 616, 42, -4, 8) + letra('D', 508, 617, 44, 4, 9) + letra('A', 542, 615, 42, -3, 10) +
      '</g>' +
    '</svg>';

  // ---- elementos de atrás ----
  // corazones pintados que suben a saltitos
  for (var j = 0; j < 10; j++) {
    var tx = pick(texRojo);
    el('corazon', mundo, 'left:' + rnd(3, 94) + '%;--z:' + Math.round(rnd(-300, 120)) + 'px;--x:' + Math.round(rnd(-10, 10)) +
      'vw;--s:' + rnd(.6, 1.3).toFixed(2) + ';--d:' + rnd(11, 18).toFixed(1) + 's;--w:-' + rnd(0, 18).toFixed(1) + 's').innerHTML =
      '<svg viewBox="85 215 150 125" style="width:100%;height:100%;overflow:visible"><g filter="url(#pastel)" clip-path="url(#clipCorI)">' +
      '<image class="tex-rojo" href="' + tx + '" x="85" y="210" width="155" height="130" preserveAspectRatio="none"/></g></svg>';
  }
  // rayones de crayón que se dibujan solos y se desvanecen, uno tras otro
  var coloresRayon = ['#f1f5f4', '#6fd6b8', '#1c8f7c', '#e9e68a', '#c7cdef', '#1f7fd0'];
  for (var k = 0; k < 9; k++) {
    var d = 'M0 ' + rnd(10, 50).toFixed(0), xx = 0;
    for (var z = 0; z < 4; z++) { xx += rnd(30, 60); d += ' Q' + (xx - 20).toFixed(0) + ' ' + rnd(-10, 70).toFixed(0) + ' ' + xx.toFixed(0) + ' ' + rnd(10, 50).toFixed(0); }
    el('rayon', mundo, 'top:' + rnd(4, 88) + '%;left:' + rnd(0, 85) + '%;--z:' + Math.round(rnd(-250, 60)) + 'px;transform:rotate(' + rnd(-50, 50).toFixed(0) +
      'deg);--d:' + rnd(5, 9).toFixed(1) + 's;--w:-' + rnd(0, 9).toFixed(1) + 's').innerHTML =
      '<svg viewBox="-10 -20 260 110" style="width:100%;height:100%;overflow:visible"><path filter="url(#marcador)" pathLength="1" d="' + d +
      '" fill="none" stroke="' + pick(coloresRayon) + '" stroke-width="' + rnd(6, 12).toFixed(0) + '" stroke-linecap="round" opacity=".85"/></svg>';
  }

  // ---- "hervor": cambia de cuadro ~8 veces por segundo, como animación dibujada ----
  var hervor = document.getElementById('hervor'), hervor2 = document.getElementById('hervor2'), cuadro = 0;
  var imgsCara = carita.querySelectorAll('.tex-cara'), imgsRojo = escena.querySelectorAll('.tex-rojo');
  setInterval(function () {
    cuadro = (cuadro + 1) % CUADROS;
    lienzos.forEach(function (cv, i) { cv.style.opacity = i === cuadro ? 1 : 0; });
    hervor.setAttribute('seed', cuadro + 1);
    hervor2.setAttribute('seed', cuadro + 4);
    imgsCara.forEach(function (im) { im.setAttribute('href', texCara[cuadro]); });
    imgsRojo.forEach(function (im, i) { im.setAttribute('href', texRojo[(cuadro + i) % CUADROS]); });
  }, FPS_DIBUJO);

  // parallax 3D con mouse / dedo
  function tilt(x, y) {
    mundo.style.setProperty('--ry', ((x - .5) * 20) + 'deg');
    mundo.style.setProperty('--rx', ((.5 - y) * 14) + 'deg');
  }
  window.addEventListener('mousemove', function (e) { tilt(e.clientX / innerWidth, e.clientY / innerHeight); });
  window.addEventListener('touchmove', function (e) { var t = e.touches[0]; tilt(t.clientX / innerWidth, t.clientY / innerHeight); }, { passive: true });

  // se muestra al cargar; las líneas se dibujan solas y se repite al arrancar la música
  function dibujar() {
    carita.classList.remove('dibujando');
    void carita.offsetWidth;
    carita.classList.add('dibujando');
  }
  requestAnimationFrame(function () { escena.classList.add('visible'); dibujar(); });
  audio.addEventListener('play', dibujar);

  // ---- subtítulos: la línea activa es la última cuya "t" ya pasó ----
  // acepta formato LRC ("[mm:ss.cc] texto") o la lista window.LETRA = [{ t, texto }]
  function leerLRC(txt) {
    var out = [];
    (txt || '').split(/\r?\n/).forEach(function (linea) {
      var m = linea.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
      if (m) out.push({ t: +m[1] * 60 + +m[2], texto: m[3].trim() });
    });
    return out;
  }
  var letraCancion = [], secciones = [], actual = -1;
  // cambia la letra y las partes de la canción (lo usa el menú de canciones, js/menu.js)
  function cargarLetra(lrc, secs) {
    letraCancion = (typeof lrc === 'string' ? leerLRC(lrc) : lrc || []).slice().sort(function (a, b) { return a.t - b.t; });
    secciones = (secs || []).slice().sort(function (a, b) { return a.desde - b.desde; });
    actual = -1;
    mostrar('');
  }
  window.cargarLetra = cargarLetra;
  function seccion(t) {
    var tipo = 'verso';
    secciones.forEach(function (s) { if (s.desde <= t) tipo = s.tipo; });
    return tipo;
  }
  // Una escena puede pedir subtítulos especiales con window.SUB_ESPECIAL = { letras: true, claves: /regex/ }:
  // cada palabra se arma letra por letra (--j = número de letra), las palabras que coinciden con "claves"
  // llevan la clase "clave", y la línea anterior se queda un momento en #subtitulo-sale para su animación de salida.
  var subSale = document.createElement('div');
  subSale.id = 'subtitulo-sale';
  subSale.setAttribute('aria-hidden', 'true');
  sub.parentNode.insertBefore(subSale, sub.nextSibling);
  // arma la línea palabra por palabra; lo que va entre paréntesis son coros de fondo.
  // Con SUB_ESPECIAL.traduccion, lo que va después de "|" es la traducción y sale aparte, en .traduccion.
  function mostrar(texto, t) {
    var esp = window.SUB_ESPECIAL, trad = '';
    if (esp && esp.traduccion && texto) {
      var partes = texto.split(/\s*\|\s*/);
      texto = partes[0];
      trad = partes[1] || '';
    }
    if (esp && sub.innerHTML) {
      subSale.className = '';
      void subSale.offsetWidth;
      subSale.innerHTML = sub.innerHTML;
      subSale.className = sub.className.replace(/\bon\b/, '') + ' sale';
    }
    sub.className = '';
    void sub.offsetWidth; // reinicia la animación
    sub.innerHTML = '';
    if (!texto) return;
    var tipo = seccion(t);
    sub.classList.add('sub-' + tipo);
    document.dispatchEvent(new CustomEvent('seccion', { detail: tipo }));
    var n = 0, j = 0;
    texto.split(/(\([^)]*\))/).forEach(function (parte) {
      if (!parte.trim()) return;
      var eco = /^\(/.test(parte);
      var caja = document.createElement('span');
      caja.className = eco ? 'eco' : 'voz';
      parte.replace(/[()]/g, '').trim().split(/\s+/).forEach(function (palabra) {
        var s = document.createElement('span');
        s.className = 'palabra';
        if (esp && esp.letras) {
          Array.from(palabra).forEach(function (ch) {
            var l = document.createElement('span');
            l.className = 'letra-sub';
            l.textContent = ch;
            l.style.setProperty('--j', j++);
            s.appendChild(l);
          });
          j += 2;
          if (esp.claves && esp.claves.test(palabra.toLowerCase().replace(/[^a-záéíóúñü]/g, ''))) s.classList.add('clave');
        } else {
          s.textContent = palabra;
        }
        s.style.setProperty('--i', n);
        s.style.setProperty('--rot', (Math.random() * 6 - 3).toFixed(1) + 'deg');
        n++;
        caja.appendChild(s);
        caja.appendChild(document.createTextNode(' '));
      });
      sub.appendChild(caja);
    });
    if (trad) {
      var tr = document.createElement('span');
      tr.className = 'traduccion';
      tr.textContent = trad;
      sub.appendChild(tr);
    }
    sub.style.setProperty('--letras', j);
    sub.classList.add('on');
  }
  cargarLetra(window.LETRA_LRC || window.LETRA, window.SECCIONES);
  audio.addEventListener('timeupdate', function () {
    var t = audio.currentTime, idx = -1;
    for (var k = 0; k < letraCancion.length; k++) { if (letraCancion[k].t <= t) idx = k; else break; }
    if (idx !== actual) { actual = idx; mostrar(idx >= 0 ? letraCancion[idx].texto : '', idx >= 0 ? letraCancion[idx].t : 0); }
  });
  audio.addEventListener('ended', function () { actual = -1; mostrar(''); });
})();
