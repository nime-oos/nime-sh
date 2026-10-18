# Bitácora del proyecto — Flor Novia 3D

## 2026-09-29 — Análisis del proyecto y explicación de la animación

### Estructura
```
index.html      punto de entrada, botón de inicio, audio, canvas de galaxia y flor
css/style.css   estilos, transforms 3D y keyframes de todas las animaciones
js/main.js      versión "en producción" (minificada) + lógica de interacción (botón, mensajes, galaxia, corazón)
js/script.js    versión legible/de desarrollo de la flor 3D y la galaxia de fondo
musica/         pista de audio que acompaña la animación
```
`main.js` y `script.js` generan la misma flor; `main.js` es la copia comprimida que realmente corre en la página (cargada con `defer` en `index.html`), mientras `script.js` parece la versión de trabajo/legible del mismo código, más fácil de editar.

### Cómo se construye la flor 3D
La flor **no es un modelo 3D real**, es una ilusión hecha con `div`s y `transform-style: preserve-3d` de CSS.

1. `createFlower()` crea `maxPetals = 6` pétalos y los distribuye en círculo:
   - `angle = 360 / maxPetals` (60° entre cada uno).
   - Cada pétalo se rota con `rotateY(ánguloDelPétalo) rotateX(-30deg) translateZ(9vmin)`, lo que los separa en el espacio 3D como si salieran del centro.
2. `createPetal()` arma un pétalo apilando `maxParts = 20` "cajas" (`createBox`), una dentro de otra (anidamiento tipo muñeca rusa), donde cada caja:
   - Reduce su `font-size` progresivamente (`partsFontStep * posición`), lo que da el efecto de que el pétalo se afina hacia la punta.
   - Cambia de color con `hsl()`, variando el matiz (`baseHue = 320`, rosa) y el brillo según la posición, para simular sombreado/degradado desde el centro (más oscuro) hacia la punta (más claro).
   - Cada "caja" contiene un `.shape` (un círculo vía `border-radius:50%` + `box-shadow` para clonar puntos), que en conjunto arma la silueta redondeada de cada segmento del pétalo.
3. Las animaciones CSS hacen el resto:
   - `.flower { animation: rotate-flower 30s linear infinite }` gira toda la flor sobre el eje Y indefinidamente.
   - `.box { animation: rotate-box 12s infinite }` hace que cada segmento del pétalo oscile (`rotateX` entre 3.5° y -7°), dando el efecto de pétalos "respirando"/abriéndose y cerrándose.

En resumen: la ilusión 3D sale de combinar `rotateX/rotateY/translateZ` con `transform-style: preserve-3d` en varios niveles anidados, no de un motor 3D real (no usa WebGL/Three.js).

### Cómo se construye el fondo de "galaxia"
Hay dos capas de canvas/efectos:

1. **Estrellas de fondo** (`drawGalaxy()` en ambos JS): dibuja 120 puntos rosados aleatorios en un `<canvas>` que se mueven a velocidad baja y rebotan en los bordes (`requestAnimationFrame`), siempre visibles desde que carga la página.
2. **Galaxia interactiva** (dentro del `click` del botón, en `main.js`): al presionar "Presioname":
   - Se oculta el botón, aparece la flor, se reproduce la música.
   - 2 segundos después aparece un segundo `<canvas>` (`#galaxy-canvas`) con puntos ("dots") que se agregan uno por uno (`addDot`, cada 10ms) en órbitas aleatorias alrededor del centro.
   - Se conecta la música a la **Web Audio API** (`AudioContext` + `AnalyserNode`) para leer el volumen en tiempo real (`getByteFrequencyData`) y usarlo como `speedFactor`: cuando la canción suena más fuerte, los puntos se mueven más rápido — la animación "reacciona" a la música.
   - En paralelo se van mostrando mensajes con efecto de máquina de escribir (`typeText`, letra por letra cada 90ms).

### Cómo se forma el corazón
Cuando terminan de mostrarse todos los mensajes, se llama a `animateHeart()`:
- Calcula posiciones objetivo con la **fórmula paramétrica del corazón**:
  ```
  x(t) = cx + size * 16*sin³(t)
  y(t) = cy - size * (13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t))
  ```
  para `t` entre 0 y 2π, repartiendo un punto por cada "dot" existente.
- `moveDotsToHeart()` interpola la posición de cada punto hacia su destino en 14 pasos (`requestAnimationFrame`), con un factor de suavizado (`(target - actual) / (steps - step + 1)`) que hace que el movimiento desacelere al acercarse, dando un efecto de "ensamblaje" suave en vez de un salto brusco.

### Diferencias móvil vs escritorio
- `isMobile = innerWidth <= 600`.
- En móvil hay un pequeño retraso extra (1200ms) antes de mostrar el texto, pensado para simular una carga ("loader"), y los estilos (`@media (max-width: 480px)`) reposicionan la flor y el mensaje para pantalla vertical.
- En escritorio la flor y el texto aparecen juntos, sin esa espera.

### Notas técnicas / posibles mejoras futuras
- `main.js` y `script.js` están duplicados (misma lógica de flor). Si se sigue editando el proyecto, conviene mantener un solo archivo fuente y generar el minificado a partir de él, para no tener que replicar cambios dos veces.
- El código usa `alert()` si el navegador bloquea el autoplay del audio; podría reemplazarse por un mensaje visual menos intrusivo.
- No hay control de reproducción/pausa de la música una vez iniciada.

## 2026-09-30 — Segunda canción "Más humano" + menú de canciones

- **Menú** (`js/menu.js`, estilos en `css/humano.css`): dos portaditas de crayón pegadas con cinta arriba a la izquierda (lado A / lado B). La activa se marca con un círculo rojo de marcador; un ecualizador de crayón se mueve mientras suena la música. También se puede abrir directo con `index.html#humano`.
- **Transición**: un borrón de crayón (canvas `#borron`) tapa la pantalla con los colores de la canción elegida y su título; debajo se cambian escena, letra y audio, y el borrón se desvanece. Al terminar una canción sigue la otra.
- **Escena "Más humano"** (`js/escena-humano.js`): la parada de autobús de noche de la portada redibujada en el mismo estilo (pastel + marcador, 3 cuadros que hierven, parallax 3D). Se construye la primera vez que se elige. Reacciona a las partes de la canción (`SECCIONES_HUMANO` en `js/letra-humano.js`): en los versos llueve y salen charcos; en el coro el letrero brilla más, el chico mira hacia arriba y le salen corazones.
- `js/escena.js` solo cambió en dos cosas: expone sus herramientas de crayón (`window.Crayon`) y permite cambiar la letra (`window.cargarLetra`). Además avisa la parte de la canción con el evento `seccion`. La escena de "No digas nada" no cambió.
- `sincronizar.html` ahora deja elegir cuál canción sincronizar.
- Pendiente, que ya venía de antes: `animateHeart()` en `main.js` usa `galaxyCanvas` fuera de su alcance y lanza `galaxyCanvas is not defined` al terminar los mensajes, así que el corazón de puntos nunca se forma.

## 2026-10-01 — Tercera canción "Piensas en mí" (LATIN MAFIA, Fred again..)

- **Menú**: nueva portadita **lado C · Piensas en mí** (enlace directo: `index.html#piensas-en-mi`; `#alvafro` también funciona). Los colores del borrón y del título ahora se definen en cada canción (`tinta`, `sombra` en `js/menu.js`); las dos anteriores quedaron igual.
- **Escena** (`js/escena-alvafro.js`, `css/alvafro.css`): el estudio de la portada redibujado: muro blanco frotado con pintura gris azulada (las manchas se vuelven a pintar solas), fotos pegadas con cinta, collage de caritas, paisaje rojizo con ciclistas, cortinas rojas, escalera, tela que se mece, sillón envuelto en plástico, banquito, botes de pintura y papeles en el piso. Título "PiENsAs EN mí" pintado en el muro. (Audio: `musica/Fred again.., LATIN MAFIA - Piensas En Mi.mp3`. Los archivos del código conservan el nombre `alvafro`.)
- **"Todo el mundo está observando"**: los ojos de todas las fotos siguen al mouse o al dedo. En las líneas que dicen "observando" todas te miran de frente, se asoman celulares en la oscuridad y hay flashes de cámara.
- **"Tú y yo"**: se encierran con marcador rojo dos fotos del collage (el chico de la gorra de "Más humano" y una chica) y les sale un corazón.
- **"Me pregunto…"**: se escribe "¿piensas en mí?" en rojo en el muro y los papeles del piso se agitan.
- Guiño: entre las fotos de arriba está la carita verde de "No digas nada".
- La escena lee la letra directamente (`LETRA_ALVAFRO_LRC`) para saber qué dice cada línea; no se tocaron las escenas anteriores.

## 2026-10-01 — Mensajes de ánimo
- Los dos mensajes que se escriben al presionar el botón (`messages` en `js/main.js`) ahora son: "No llores, todo pasa 🤍" y "¡Ánimo! Aquí estoy contigo 🌷" (este último es el que se queda).
- En escritorio pasaron a la esquina de arriba a la derecha, frente al menú (`css/escena.css`), para no tapar ninguna escena. En móvil siguen arriba al centro.

## 2026-10-01 — Cuarta canción "Luna" (Zoé, MTV Unplugged)

- **Menú**: nueva portadita **lado D · Luna** (enlace directo: `index.html#luna`). Borrón azul noche con el título en crema y sombra naranja. Con cuatro portaditas, en celulares el letrero "canciones" pasa debajo del menú.
- **Escena** (`js/escena-luna.js`, `css/luna.css`, letra en `js/letra-luna.js`): el escenario del unplugged redibujado con crayón y marcador: foro azul con cortinas y luz azul desde el piso, globos de luz naranja en pedestales, reflectores de cuadritos, lámpara de mesa, jaula dorada con pajarito, alfombras persas (roja con rombos, beige con medallón, azul con olas), pufs de rayas, cables y pedalera. La banda: guitarrista con tenis blancos, tecladista de gorro con teclados rojos, organista de lentes en el clavecín de madera, contrabajo, la chica del teclado rojo, León en su banquito con guitarra, armónica y el pelo tapándole los ojos, baterista con "Zoé" y una lunita en el bombo, y una guitarra en su base. Todos tocan a saltitos. Título "LuNa" pintado abajo a la izquierda. Un haz de luz sigue al mouse o al dedo.
- **La escena reacciona a cada línea**:
  - "Luna": sale la luna grande con carita; León abre los ojos y la mira. En "cráteres" le laten los cráteres.
  - "Silencio, se abre la tierra": apagón (solo queda la luna) y se abre una grieta de lava en el piso.
  - "Se alzan los mares, al compás del volcán": sube el mar desde abajo y la grieta escupe chispas.
  - "Se acelera mi motor": reflectores en estrobo, batería y guitarras a toda velocidad, el piso tiembla.
  - "Me da fiebre, me hago fuego": los globos se ponen rojos y salen llamas al frente.
  - "Dame solo un beso": suben corazones. "Mirarte a los ojos": León y la luna te miran (los ojos de León siguen al mouse).
- La luna va en su propia capa 3D (`capa-luna`, un poco al frente) para que el apagón no la tape.
- `sincronizar.html` ya incluye "Luna". Audio: `musica/Zoé - Luna (MTV Unplugged).mp3`.
- Letra corregida (versión del unplugged, líneas más cortas y nuevos tiempos). Como ahora las frases vienen partidas, la escena también reacciona a "recuperarme" (luna), "consumir" (fuego) y "morir" (beso) para que el efecto siga durante toda la frase.

## 2026-10-01 — Quinta canción "Labios rotos" (Zoé)

- **Menú**: nueva portadita **lado E · Labios rotos** (enlace directo: `index.html#labios-rotos`). Borrón rojo de lámpara con el título en rosa y sombra vino.
- **Escena** (`js/escena-labios.js`, `css/labios.css`, letra en `js/letra-labios.js`): la foto del florero bajo la lámpara de atardecer redibujada con crayón y marcador: muro oscuro con el gran círculo de luz roja, las sombras gigantes de las flores en la pared (dos flores arriba, una grande a la izquierda, helechos, tallos y la sombra del florero), y al frente el florero blanco teñido de rosa con el ramo de flores rosas, dos rojas oscuras, tallos, hojas y helechos. Título "Labios rotos" pintado arriba a la derecha con un besito partido. La luz sigue al mouse o al dedo y las sombras se mueven al revés, como si movieras la lámpara.
- **La escena reacciona a cada línea**:
  - "Regálame tu corazón": un corazón grande late dentro de la luz. "Déjame entrar a ese lugar": el círculo de luz se abre.
  - "Donde nacen las flores": brotan seis flores nuevas en el ramo. "Nace el amor" / "con todo mi amor": suben corazoncitos.
  - "Entrégame tus labios rotos": aparecen unos labios con una grieta que se dibuja sola. "Los quiero besar": los labios mandan besos y salen besitos por toda la pared. "Curar" / "cuidar": la grieta se borra y le ponen una curita.
  - "Es raro el amor": la luz cambia de color a saltos y las sombras bailan solas. "Que se te aparece…": llueven pétalos.
  - "No importa la distancia, ni el tiempo, ni la edad": la luz cruza de lado a lado como el sol y las sombras se estiran con ella.
  - "Moja el desierto de mi alma": llueve. "Con tu mirar, con tu tierna voz": tres flores abren los ojos (siguen al mouse) y cantan.
  - "Con tu mano en mi mano": dos manos de sombra entran por la pared y se tocan. "Por la eternidad": se dibuja un infinito con estrellitas.
  - "Ah-ah-ah": el ramo se mece y la luz respira. "Amor, amor": corazón grande y corazoncitos.
- En pantallas verticales el título, los labios, el corazón y el infinito se recorren al centro para que no los corte la orilla.
- `sincronizar.html` ya incluye "Labios rotos". Audio: `musica/Labios Rotos - Zoé Letra. ♡.mp3`.

## 2026-10-02 — Sexta canción "Soñé" (Zoé, Unplugged)

- **Menú**: nueva portadita **lado F · Soñé** (enlace directo: `index.html#sone`), con la polaroid de ella en miniatura. Borrón azul noche y violeta con el título en lila y sombra rosa.
- **Escena** (`js/escena-sone.js`, `css/sone.css`, letra en `js/letra-sone.js`): ella, dibujada con crayón y marcador a partir de sus fotos (no se guardó ninguna foto en el proyecto). En medio de un cielo de sueño (azul noche, violeta y rosa, vía láctea, estrellas que titilan, nubes rosas y una luna dormida) flota la polaroid de su cumpleaños: pared de ladrillo blanco con el letrero "THDAY", globos naranja y amarillo, plato de fiesta, sombrero de paja y estante, la mesa con el mantel de carritos rojos, y ella con su vestido rojo de hombros caídos, lentes redondos dorados con reflejo de pantalla, fleco y pelo largo, sosteniendo el pastel blanco del monito rosa con su pulsera negra. Abajo dice "te soñé ♡" a mano.
- Al entrar, la foto **se revela como una instantánea** (flash y luego aparece poco a poco).
- Alrededor flotan otros recuerdos en polaroids chiquitas: la selfie del fleco con lentes azules ("omg"), la del pelo rizado con la mano en la mejilla y lentes morados (♡) y la del pastel con globos ("la cuarta es la mejor"). Globos amarrados a la esquina de la foto.
- **La escena reacciona a cada línea**:
  - "Ruego al tiempo aquel momento": sale un reloj de bolsillo con las agujas girando para atrás.
  - "Mi mundo se paraba entre tus labios": todo se congela (hasta el crayón deja de hervir), ella hace trompita y sale volando un beso gigante.
  - "Revivir y derretirme": la foto, el pastel, la luna y las nubes se derriten en chorritos.
  - "Mirando tus ojos negros" / "una mirada tuya": zoom a su cara; sus ojos siguen al mouse y le brillan estrellitas en los lentes.
  - "Ser aire y me respires": remolinos de viento y se le mueve el pelo. "Nada que perder": los globos se van volando.
  - "Todo el tiempo estoy pensando en ti": los recuerdos vienen al frente, se dibuja un hilo rojo que los une y salen corazones.
  - "El brillo del sol": sale un sol con carita en lugar de la luna y todo se pone cálido. "Rincón del cielo": estrellas fugaces.
  - "El eco del mar que retumba en tus ojos": sube el mar, zoom a sus ojos con ondas en los lentes y la foto retumba.
  - "Soñé": noche de sueño, halo en la foto, polvo de estrellas y la luna suelta zetas. "Una vez mas": además suben corazones.
- En celulares la foto se recorre al centro y el título grande se esconde (la foto ya dice "te soñé").
- `sincronizar.html` ya incluye "Soñé". Audio: `musica/Soñé (Unplugged) - Zoé Letra.mp3`.
- **Retoque de parecido** (a partir de la foto del cumpleaños): cara más redonda de cachetes llenos y piel más clara, fleco de cortina abierto en medio en lugar de fleco recto, mechón largo que le cae por delante del hombro, lentes grandes de alambre delgado color oro rosado, ojos sonrientes un poco cerraditos, cejas finas, naricita redonda y sonrisa suave de labios cerrados. La cabeza va un poquito ladeada como en la foto y solo se ve el tirante del vestido del lado derecho.
- **Más delgada**: cara más fina con la barbilla definida, cuello fino, hombros y brazos más angostos y el vestido entallado con cintura marcada (también en los recuerdos chiquitos).
- **Más parecido**: pelo casi negro con raya en medio, lentes un poco más abajo en la nariz (los ojos quedan en la parte de arriba del lente, como en la foto), ojos un poco más grandes con pestañitas.
- **Con cintura**: el vestido ahora es entallado con la cintura a la altura real (antes quedaba muy abajo y la tapaba el brazo), con busto y cadera marcados; el pelo de atrás es más corto para que se vea la silueta y el brazo derecho sigue la curva del cuerpo.
- **Nueva escena (sin la foto grande)**: a pedido, se quitó la polaroid grande. Ahora **dos tendederos de lucecitas** cruzan el cielo de sueño y de ellos cuelgan con pinzas de madera **ocho polaroids de ella**, siempre con su misma cara (fleco de cortina, pelo casi negro, lentes grandes de alambre, ojos sonrientes, figura delgada): "omg" (selfie con lentes azules y trompita), "tu cumple ♡" (vestido rojo, letrero THDAY, globos y pastel), "muak" (mandando un beso con corazón), "para ti" (guiñando con un girasol), "jajaja" (muerta de risa), "♡" (pelo rizado con la mano en la mejilla), "el mar" (con el mar y el sol detrás) y "te soñé" (dormida bajo la luna). Las fotos caen una por una al tendedero al entrar y se columpian. Título "Soñé" arriba al centro, luna dormida arriba a la derecha y globos amarrados a la punta del tendedero de abajo.
- Reacciones ajustadas a la nueva escena: con "labios" se congela todo y **en todas las fotos** hace trompita mientras el beso sale volando desde "muak"; con "ojos" / "mirada" hace zoom a "tu cumple" y las demás se apagan; con "aire" las fotos se columpian con el viento; con "pensando en ti" brincan y las lucecitas parpadean rápido; con "derretirme" chorrean todas las fotos; con "del mar" retumban.
- En celulares las ocho fotos se acomodan en dos columnas (sin tendederos) y el zoom y el beso se recalculan para esa posición.
- La portadita del menú ahora muestra el tendedero con tres fotitos.

## 2026-10-02 — Séptima canción "Luz de día" (Enanitos Verdes), temática de Halloween

- **Menú**: nueva portadita **lado G · Luz de día** (enlace directo: `index.html#luz-de-dia`), con la pareja frente a la luna. Borrón negro, morado y naranja calabaza. Con siete portaditas, en celulares el menú se hizo más compacto.
- **Escena** (`js/escena-luz.js`, `css/luz.css`, letra en `js/letra-luz.js`): noche de Halloween inspirada en las imágenes de referencia, redibujada con crayón y marcador: luna llena gigante, la colina que termina en espiral y arriba la pareja tomada de la mano (el esqueleto flaquísimo de traje a rayas, moño de murciélago y zapatos enroscados, saludando a la luna, y la muñeca de trapo pelirroja con cara de costuras, vestido de parches y medias a rayas). Atrás un pueblo torcido con ventanas encendidas y un árbol seco de ramas en espiral; murciélagos volando, fantasmitas y un perrito fantasma con nariz de calabaza. Al frente el panteón: lápidas RIP y cruz, reja de fierro con remolinos, calabazas talladas encendidas, velas y la botella de champagne. Título "Luz de día" en naranja con "Enanitos Verdes" en verde.
- **La escena reacciona a cada línea**:
  - "Destapa el champagne": sale volando el corcho y brotan burbujas. "Apaga las luces": apagón total menos la luna (la pareja queda en silueta) y las calabazas. "Velas": se prenden las velas del panteón.
  - "Afuera las heridas": los fantasmitas se van volando. "Pasado": sube la neblina.
  - "Choquen nuestras copas": dos copas brindan con un ¡clink! "Por habernos encontrado": la pareja se acerca y aparece un corazón entre los dos.
  - "Mirar el cielo": estrellas fugaces. "Besar tus manos": él se inclina y sale un besito. "Sentir tu cuerpo, decir tu nombre": bailan arriba de la colina.
  - "Las caricias serán la brisa que aviva el fuego": hojas de otoño al viento y las calabazas echan llamas.
  - "De nuestro amor": los murciélagos forman un corazón en la luna y suben corazones.
  - "Ser luz de noche, ser luz de día": la noche se vuelve día (cielo azul y naranja, la luna se vuelve sol con rayos) y otra vez noche.
  - "Frenar el mundo por un segundo": todo se congela, hasta el crayón deja de moverse.
  - "El tiempo dejó su huella": huellas brillantes suben por la colina. "Tu piel y mi piel": la pareja brilla.
  - "Esta noche todo vale": fiesta, las calabazas brincan, los fantasmas bailan y llueve confeti. "Una vez más": la espiral se mueve y la pareja brinca.
  - "Sin tu amor": final con velas, corazones y fiesta juntos.
- `sincronizar.html` ya incluye "Luz de día". Audio: `musica/Enanitos Verdes - Luz de Día (Letra Lyrics).mp3`.

## 2026-10-02 — Octava canción "Ciudad de las luces" (LATIN MAFIA)

- **Menú**: nueva portadita **lado H · Ciudad de las luces** (enlace directo: `index.html#ciudad-de-las-luces`), con la noria iluminada. Borrón azul noche, magenta y cian.
- **Escena** (`js/escena-ciudad.js`, `css/ciudad.css`, letra en `js/letra-ciudad.js`): la ciudad de noche con crayón y marcador. Al centro una **noria gigante iluminada** que gira a saltitos, con doce cabinas de colores que cuelgan derechitas y foquitos de colores en el aro (el giro se maneja desde JavaScript para que rueda y cabinas vayan siempre sincronizadas). Atrás, edificios con ventanas que se prenden y apagan, letreros de neón ("bar", "143", un corazón), luces desenfocadas, luna y un farol. Abajo, un puente por donde pasa un **tren con las ventanas encendidas** y un **río que refleja la ciudad y la noria** con ondas. Título en neón "ciudad de las luces" con "LATIN MAFIA".
- (Antes la escena tenía un retrato de ella; a pedido se quitó y se reemplazó por la noria.)
- **La escena reacciona a cada línea**:
  - "Desarmando lo que soy": la noria se desarma (las piezas del aro y las cabinas salen volando) y los edificios se desacomodan; "construyéndote": todo se vuelve a armar pieza por pieza.
  - "Si fue real, quiero verte": dos reflectores barren el cielo. "Ciudad de las luces": se prenden todas las ventanas, los neones y los foquitos corren. "Se luce": la noria gira rápido y salen brillitos.
  - "Me cautivé": el corazón de neón late y suben corazones. "No sé quién es": en una ventana aparece una silueta misteriosa con signos de interrogación.
  - "Nunca más coincidimos": un segundo tren cruza en sentido contrario y dos estelas de luz se cruzan. "En el aire nos convertimos": farolitos de papel suben desde el río. "Fuimos uno": todo cambia de color al ritmo.
  - "Para luego solo quedar yo": se apaga la ciudad y queda una sola cabina encendida.
  - "Tus amigas / es raro que tú bailes": amigas bailando en silueta, bola disco con rayos de colores.
  - "Como si viviera de nuevo el momento": rebobinar (líneas de VHS, ◀◀, la noria y el tren van al revés). "Tus manos": dos estelas de luz rosa abrazan la noria.
  - "Te vuelvo a ver": el reflejo del río se ilumina. "Todo está confuso": la ciudad se tambalea. "Se sintió bien": fuegos artificiales.
- `sincronizar.html` ya incluye "Ciudad de las luces". Audio: `musica/ciudad de las luces; latin mafia letra.mp3`.

## 2026-10-02 — Novena canción "Igual que ayer" (Enanitos Verdes)

- **Menú**: nueva portadita **lado I · Igual que ayer** (enlace directo: `index.html#igual-que-ayer`), con el castillo sobre el lago. Borrón azul noche, morado y dorado de ventanas.
- **Escena** (`js/escena-ayer.js`, `css/ayer.css`, letra en `js/letra-ayer.js`): un castillo mágico de noche inspirado en la imagen de referencia, con crayón y marcador: el gran salón con sus ventanales encendidos, la torre redonda de techo cónico, el racimo de agujas con la torre del reloj, el puente de arcos, la escalera en zigzag que baja hasta la casita del muelle, el acantilado, un pino, montañas lejanas, la luna llena, nubes y el lago con el reflejo del castillo. Título "Igual que ayer" sobre el lago.
- **Para que no se trabe**: el castillo (lo más pesado) se dibuja una sola vez con los filtros de crayón y se convierte en imagen PNG (3 cuadros para el "hervor"); encima solo van cosas ligeras sin filtros (ventanas, velas, lechuzas, corazones) animadas con transform/opacity.
- **La escena reacciona a cada línea**:
  - "Nos conocimos sin saber": dos lucecitas recorren el castillo y se encuentran. "Un cigarrillo y un café": aparece una taza humeante con corazón y aros de humo; se enciende la casita del muelle ("el mismo bar").
  - "El tiempo de los dos": las manecillas del reloj de la torre giran. "Voy a salir a caminar": se prenden uno a uno los faroles de la escalera. "Grande la ciudad": se prenden todas las ventanas.
  - "Nos vamos a encontrar": las lucecitas se juntan y sale un corazón. "La chispa": chispas mágicas salen de la torre. "Cada latido de mi corazón": la luna late con un corazón.
  - "Yo necesito tu amor": suben velas flotantes. "Dame tu amor": corazones. "Igual que ayer": lechuzas cruzan el cielo y todo se pone color recuerdo.
  - "La emoción / tu voz": notas musicales salen de la torre. "Quedó desierta la ciudad, sólo para los dos": se apagan todas las ventanas menos dos rosas.
  - "Reaccionar": destello mágico. "Recuperemos el lugar": las ventanas del gran salón forman un corazón. "Las flores del jardín": florecen flores al pie del acantilado.
- `sincronizar.html` ya incluye "Igual que ayer". Audio: `musica/Igual que ayer - Enanitos verdes Letra.mp3`.

## 2026-10-03 — Décima canción "Es por ti" (Juanes)

- **Menú**: nueva portadita **lado J · Es por ti** (enlace directo: `index.html#es-por-ti`), con la pareja frente al atardecer. Borrón azul mar, rojo y naranja.
- **Escena** (`js/escena-porti.js`, `css/porti.css`, letra en `js/letra-porti.js`): la carretera junto al mar de la imagen de referencia, con crayón y marcador: la pareja de espaldas mirando el mar (él con su traje verde limón; ella con el pelo verde agua recogido, chamarra negra y falda roja larga, tomada de su brazo), una moto deportiva azul (carenado completo con franja amarilla y el número 7, parabrisas, colín levantado, escape y rines de rayos), la valla de contención, la señal de "no estacionarse", el asfalto con su línea blanca y, a lo lejos, un faro rojo y blanco sobre la punta de tierra. El título "ES POR TI" va pintado en el asfalto como señal de carretera, con "Juanes" a mano.
- **El cielo vive un día entero al ritmo de la canción**: cuatro cielos pintados (noche, amanecer, día y atardecer) que se funden entre sí; el sol sube y baja con la hora y el reflejo del sol o la luna sobre el mar cambia de color.
- **Para que no se trabe**: los cielos, el camino y cada uno de los dos se pintan una sola vez y se guardan como imagen; encima solo hay cosas ligeras animadas con transform/opacity. Del "hervor" solo se cambian las imágenes visibles.
- **La escena reacciona a cada línea**:
  - "Cada vez que me levanto": amanece (el sol asoma en el horizonte). "Me siento renovado": rayos de sol.
  - "Aniquilado si no estás": ella desaparece y se hace de noche. "Tú controlas toda mi verdad" / "Tus ojos me llevan al sol": ella vuelve y sale el sol de mediodía.
  - "Tu boca me habla del amor" / "he vuelto a hablar de amor": suben corazones desde la pareja. "Tu piel tiene el color de un rojo atardecer": cielo y mar rojos con el sol grande sobre el horizonte.
  - "Y es por ti": noche estrellada con luna, estrellas fugaces y un halo sobre la pareja.
  - "Que late mi corazón": los brillos del mar forman un corazón que late. "Que brillan mis ojos hoy": el cielo se llena de destellos. "Que calma mi dolor": luciérnagas y el mar se calma.
  - "Y cada vez que yo te busco y no te puedo aún hallar": ella no está y el haz del faro barre el mar buscándola.
  - "Me siento un vagabundo, perdido por el mundo": pasan coches con estelas de luz y se prende la moto. "Desordenado si no estás": todo se tambalea. "Cómo mueves tú mi felicidad": ella regresa entre destellos.
- `sincronizar.html` ya incluye "Es por ti". Audio: `musica/Juanes - Es Por Ti (Official Music Video).mp3`.

## 2026-10-03 — Canción once "Just the way you are" (Bruno Mars): retrato con cinta de casete

- **Menú**: nueva portadita **lado K · Just the way you are** (enlace directo: `index.html#just-the-way-you-are`), con el casete y la cara de cinta sobre madera. Borrón beige y café cinta.
- **Estilo totalmente distinto** (a la manera de Erika Iris Simmons): sobre una mesa de madera clara hay un casete (etiqueta "just the way you are · lado B · ♡ para ti · 90 min") y de él sale la cinta magnética, cruza la mesa con un par de bucles sueltos y dibuja a una muchacha. Todo es una sola cinta café oscura satinada de grosor constante con reflejos sutiles; los contornos de la cara son limpios y fluidos, y el pelo (ondas en S, flequillo de lado) se forma con mechones de cinta y enredos/bucles acumulados en las orillas y en la sombra junto al cuello. Movimientos suaves, sin crayón.
- **Al entrar** la cinta se va dibujando sola (~6 s) mientras los carretes del casete giran rapidísimo; luego giran despacio mientras suena la música.
- **Archivos**: `js/cinta.js` (el motor: curvas suaves Catmull-Rom/Bézier, bucles de cinta, enredos en zonas, pintado de la cinta con sombra y brillo, y conversión de foto a cinta con detección de bordes tipo Canny — suavizado gaussiano, Sobel, supresión de no máximos, doble umbral con histéresis, seguimiento de bordes y simplificación — más enredos en las zonas oscuras), `js/escena-cinta.js`, `css/cinta.css`, letra en `js/letra-cinta.js`.
- **Foto opcional**: si existe `img/cinta.jpg`, el retrato se arma a partir de esa foto con el detector de bordes. Si no, sale el retrato dibujado. (Ojo: el repositorio es público.)
- **Para que no se trabe**: la cinta se pinta una sola vez en canvas, en capas recortadas al tamaño de lo que dibujan (la mesa y la cara juntas; pelo, ojos, boca y sonrisa aparte); lo que se mueve son capas enteras y adornos SVG ligeros.
- **La escena reacciona a cada línea**:
  - "Her eyes": estrellas de cinta alrededor y brillitos en los ojos. "Her hair": el pelo se mece.
  - "She's so beautiful" / "just the way you are": la cinta forma un corazón sobre la mesa.
  - "She won't believe me" / "do I look okay?": el retrato se desvanece un poco y aparece un signo de interrogación de cinta.
  - "When I see your face": acercamiento a su cara. "And when you smile": ella sonríe. "Amazing": un brillo recorre la cinta y salen estrellas.
  - "The whole world stops and stares": todo se detiene (carretes, pelo, parpadeo) y se oscurecen las orillas.
  - "Her lips / kiss": un besito de cinta junto a sus labios.
- `sincronizar.html` ya incluye la canción. Audio: `musica/Bruno Mars - Just The Way You Are Sub. Español + Lyrics.mp3`.
- **Retrato rehecho como en el video** (cinta ancha que se va armando): la cinta ahora es un listón de ~5 px que se tuerce (se angosta y brilla en la orilla). Cejas, ojos, nariz y labios se construyen uno por uno con cinta: cejas y labios "rellenos" de tiras de cinta, ojos almendrados con delineado y colita, iris en espiral con su brillito, la nariz solo con la curva de abajo, y la cara apenas sugerida con mejillas y barbilla. Rasgos de ella: lentes grandes, redondos y de alambre delgado; fleco ondulado sobre la frente abierto un poquito al centro; pelo largo ondulado con volumen; labios llenos; escote recto de hombros caídos. Al sonreír se le ven las comisuras arriba y el hueco de los dientes. Orden de armado: la cinta llega del casete al hombro, luego cejas, ojos, nariz, labios, lentes y al final el pelo. El retrato se acomodó un poco más chico y abajo para que el menú no lo tape.
- Letra de "Just the way you are" re-sincronizada con los tiempos correctos del audio (empieza en 00:30.93).
- **Escena rehecha como el video de la canción** (`js/escena-cinta.js`, `css/cinta.css`): ya no es un solo retrato fijo. La cinta **sale del casete, dibuja una figura según la letra, se rebobina (se mete de nuevo al casete, de atrás hacia adelante) y vuelve a salir para dibujar la siguiente**. Los carretes giran rápido cuando sale la cinta y al revés cuando entra. Figuras:
  - Intro / "her hair" / "beautiful" / "when I see your face": su retrato (lentes grandes redondos de alambre, fleco tipo cortina, pelo largo ondulado, labios llenos, hombros descubiertos).
  - "Her eyes": sus ojos de cerca con los lentes, las cejas y estrellas de cinta.
  - "She won't believe me" / "do I look okay?": un espejo de mano con un signo de pregunta.
  - "Amazing" / "just the way you are": un corazón triple de cinta con estrellas.
  - "When you smile": su retrato sonriendo. "Her laugh": su retrato riéndose con los ojos cerrados.
  - "The whole world stops and stares": un globo terráqueo con ojos que se queda mirando.
  - "Her lips / kiss them": sus labios de cerca rellenos de cinta y corazones.
- Labios, cejas y párpados se rellenan con tiras de cinta pegaditas (ida y vuelta), calculadas para el tamaño de cada figura, como en el video.
- Ahora todo lo anima el navegador con transiciones de CSS sobre trazos SVG (`stroke-dashoffset`): corre a ~55-60 cuadros por segundo incluso mientras dibuja.
- **Arreglos**: (1) Se quedaba en blanco después del mundo: si la letra cambiaba mientras la cinta se rebobinaba se cancelaba el aviso de "ya entró" y la cinta nunca volvía a salir. La máquina de estados se rehízo: cada figura se termina de dibujar, se queda un momentito y se rebobina; lo que pida la letra mientras tanto se guarda y se dibuja en cuanto la cinta entra. Probado en tiempo real: siempre hay una figura y el atraso es de ~1 s (lo que tarda en rebobinar). (2) Dibujos más ágiles (2.2–3.4 s) y rebobinado de 0.8 s. (3) Sonrisa nueva como en el video: labio de arriba en arco, la hilera de dientes clara y el labio de abajo fino; nariz más chiquita (ya no parece bigote). (4) El mundo rehecho: globo limpio con ecuador y un meridiano, América, Europa y África, carita con ojos grandes que se quedan mirando y rayitas de "se detiene", en su soporte.
- **Letra en español**: los subtítulos de esta canción ahora salen traducidos al español (mismos tiempos) y las figuras se activan con las palabras en español.

## 2026-10-04 — Canción doce "Can't take my eyes off you" (Frankie Valli): noche de Halloween

- **Menú**: portadita **lado L · Can't take my eyes off you** (enlace directo: `index.html#cant-take-my-eyes-off-you`), con la mansión contra la luna, el panteón y una calabaza. Borrón morado noche y naranja calabaza.
- **Escena** (`js/escena-mirada.js`, `css/mirada.css`, letra traducida al español en `js/letra-mirada.js`): noche de Halloween **sin personajes** (antes hubo una versión anime lofi con una pareja, pero los personajes no convencieron y se quitó). Ilustración limpia con línea oscura, colores planos con degradados y halos de luz: una **mansión embrujada** asentada en una explanada de la colina, con cimiento de piedra, sombra y arbustos al pie (ala, torre con veleta de murciélago, buhardilla redonda, chimenea con humo, hiedra, contraventanas chuecas, porche con puerta y escalones, ventanas encendidas) recortada contra una **luna llena gigante**; cielo morado a naranja con estrellas, nubes y murciélagos; colinas lejanas con arbolitos secos; al frente el **panteón** con reja de fierro y puerta abierta con remolinos, lápidas RIP y una cruz, velas, un **caldero** con poción verde que burbujea, un **árbol seco** con telaraña, araña que sube y baja y una **linterna** colgando, **calabazas talladas** encendidas, fuegos fatuos y neblina. El título va pintado en un **letrero de madera** ("can't take my eyes off you", fuente Creepster).
- **Ojos en la oscuridad**: como dice la canción, entre los arbustos y en el hueco del árbol hay ojos brillantes que parpadean y **siguen al mouse**.
- **La escena reacciona a cada línea**:
  - "Demasiado buena para ser verdad": polvo mágico alrededor de la luna.
  - "No puedo apartar mis ojos de ti": se abren todos los ojos de la oscuridad y **las ventanas de la mansión se vuelven ojos**; todos siguen al mouse.
  - "Tocar el cielo" / "el amor ha llegado": estrellas fugaces; con "el amor ha llegado" se prenden las ventanas apagadas y se abre la puerta con luz.
  - "Abrazarte" / "quédate": los murciélagos rodean la luna. "Gracias a Dios por estar vivo": se encienden las velas y suben los fuegos fatuos.
  - "Perdona la forma en que te miro": todo se tiñe de rosa. "Sin fuerzas" / "te necesito": un corazón late dentro de la calabaza gigante.
  - "No me quedan palabras": todo se oscurece y sube la neblina; solo quedan los ojos.
  - "Si sientes lo que yo siento" / "te amo": corazones de fuego salen de las calabazas. "Dime que es real" / "créeme": ¡relámpago!
  - **Fuegos artificiales en los momentos clave**: desde el solo de metales antes del coro y durante todo el coro "Te amo, nena" hay muchos fuegos (naranja, morado, verde, rojo), cada uno con su cohete que sube antes de reventar, y calabazas-linterna que suben al cielo; también hay fuegos en "tocar el cielo", "el amor ha llegado", "estar vivo", "dime que es real" y "déjame amarte" (este con fuegos de corazón).
  - "Entibiar una noche solitaria": la chimenea echa más humo, se prende toda la casa y todo se pone cálido.
  - "Déjame amarte" / "preciosa": los murciélagos forman un **corazón en la luna** y llueven pétalos de rosa.
- Para que no se trabe: cada parte que se mueve es su propio `<svg>`/`<div>` y solo se anima con transform/opacity (sin filtros).
- `sincronizar.html` ya la incluye. Audio: `musica/Frankie Valli - Can't take my eyes off of you (I Love You Baby)-[traducida sub. español].mp3`.
- Letra re-sincronizada con los tiempos correctos del audio (empieza en 00:16.02; el coro en 01:35.15 y 02:47.26), traducida al español.
- **Subtítulos especiales de Halloween** (solo en esta canción): letra de terror (Creepster) sobre una neblina oscura que respira como la luz de una vela, con un resplandor de calabaza debajo. Cada **letra aparece desde la neblina** (borrosa, desde abajo y girando) y luego flota. Versos en naranja calabaza, solos en verde fantasma, y el **coro "Te amo, nena"** más grande con letras de colores (naranja, rosa, morado) que **revientan como fuego artificial**, rebotan y sueltan destellos. Las **palabras clave** (ojos, amor, cielo, real, nena, amarte, preciosa…) brillan en rosa con un corazoncito que late. La **línea que se va se deshace hacia arriba como humo**. Funciona con `window.SUB_ESPECIAL` (`js/escena.js` arma la línea letra por letra y guarda la anterior en `#subtitulo-sale`); las demás canciones no cambian.


## 2026-10-06 — Canción trece "Brillas" (León Larregui): pintar con luz

- **Menú**: portadita **lado M · Brillas** (enlace directo: `index.html#brillas`), con la luna perla y dos estelas (dorada y turquesa) que la rodean sobre un cielo de atardecer. Borrón morado, rosa, dorado y turquesa.
- **Escena** (`js/escena-brillas.js`, `css/brillas.css`, letra en `js/letra-brillas.js`): sin personajes. **Dos estrellas fugaces** (tú, dorada; yo, turquesa) bailan en un **cielo psicodélico de los setenta** y van **dibujando con su estela de luz**, como fotografía de larga exposición. Al centro una **luna perla** con halo; al fondo estrellas que titilan, nebulosas de colores, cerros con borde rosa y un **lago** donde se refleja la luna. Al principio aparece el título **"Brillas"** en neón sobre los cerros. Con el mouse (o el dedo) se puede **guiar a la estrella dorada**.
- **Cada línea dibuja algo distinto**:
  - Intro: las dos estrellas se buscan dando vueltas alrededor de la luna.
  - "Nos dimos todo lo que se nos dio": se lanzan chispas una a la otra y quedan **hilos de luz** entre ellas. "Y mucho más": estallido de luz.
  - "Para después reconocernos, otra vez": se alejan y vuelven a encontrarse en la luna, con un **destello** al tocarse.
  - "Amanecer colgado de tus labios": **amanece**: sale un **sol retro de rayas** detrás de los cerros y el cielo se pone rosa y naranja.
  - "Brillas y brillas tan lindo": dibujan una **flor de espirógrafo** y todo el cielo se llena de destellos.
  - "Brillamos juntos entre pestañas": **caen pestañas de luz** (para pedir un deseo).
  - "Divina sonrisa": dibujan una **sonrisa** enorme de lado a lado.
  - "Abrazo de luna, de luna llena": **abrazan la luna** girando a su alrededor; la luna crece, suelta rayos y anillos de luz.
  - "Ah ah ah": **caleidoscopio**: mandalas de luz con simetría que cambian de color, y una aurora de colores que gira detrás.
  - "Y así, juntitos los dos": viajan pegaditos dibujando el **infinito**.
  - Final: dibujan un **corazón** que cambia de colores alrededor de la luna.
- Cuando cambia la figura, el dibujo anterior se desvanece entero y el nuevo empieza limpio (dos lienzos que se turnan), así no quedan fantasmas.
- Para que no se trabe: las estelas y la diamantina se pintan en un canvas a resolución reducida que se desvanece poco a poco; las cabezas de las estrellas son dos elementos que solo se mueven con transform; nebulosas pintadas en el fondo (quietas); el resto se anima con transform/opacity.
- **Subtítulos especiales** (con `window.SUB_ESPECIAL`, como en la canción doce): cada **letra se enciende como estrella** (un chispazo y luego queda brillando) con una estela de luz que cruza por debajo. Versos a mano (Caveat) blanco perla con brillo dorado; el **coro en letra de los setenta** (Pacifico) con letras doradas, rosas y celestes y destellos alrededor; los **"ah ah ah"** ondulan como aurora lila. Palabras clave (brillas, luna, sonrisa, labios, amanecer, juntitos…) en dorado con un destello ✦ que gira. La **línea que se va se deshace en polvo de estrellas**.
- `sincronizar.html` ya la incluye. Audio: `musica/León Larregui - Brillas (Letra).mp3`.
- **Menú con 13 canciones**: ya no cabía a lo ancho. En pantallas angostas (laptops de 1280–1366 px) el menú se encoge lo justo para que se vean todas las portaditas, y en celular se acomodan en dos filas de 7.

## 2026-10-09 — Canción catorce "Virgen" (Adolescent's Orquesta): la rosa más bella

- **Menú**: portadita **lado N · Virgen** (enlace directo: `index.html#virgen`), con un medallón dorado con una rosa adentro, bajo la lluvia. Borrón vino, rojo rosa y dorado.
- **Sin foto**: al principio el medallón llevaba una foto de ella; después se quitó (y se borró `img/virgen.jpg`). Ahora adentro hay una rosa grande sobre terciopelo vino con gotitas de rocío.
- **Escena** (`js/escena-virgen.js`, `css/virgen.css`, letra en `js/letra-virgen.js`): noche de lluvia en un jardín de rosas, con cielo vino, nubes y piso mojado con charco.
  - Intro: el título "Virgen" bajo la lluvia y **una rosa caída** (gris, marchita) en el piso con pétalos regados.
  - "Ya no llores, ya no temas": la lluvia se calma. "Tranquila, que aquí estoy yo": baja **un paraguas rojo** con luz cálida a cubrir la rosa.
  - "Para hablarte del amor": **la rosa se levanta** y recupera su color.
  - "Ahora entrégate": deja de llover, se abren las nubes, salen las estrellas y la luna, y **la rosa florece en un medallón dorado con una rosa grande adentro**, rodeado de una corona de rosas (onda dorada, destello y lluvia de pétalos). El paraguas se va volando.
  - Coro: "Si lloro o tiemblo" → el medallón tiembla y caen **lágrimas de luz que se vuelven estrellitas**; "Dios me mandó para ti" → **rayos de luz** desde arriba; "adorarte para toda la vida" / "muere contigo" → pétalos; "Siénteme" → **late como corazón**; "nació para ti" / "vivo por ti" → suben corazones; "Niña de mi vida" / "Mi linda querida" → **anillo de corazones** girando alrededor del medallón.
  - Instrumentales y montuno ("No me importa / Si yo te amo"): **bola disco**, reflejos de colores y reflectores de salsa.
  - "Como aquel que pisó la rosa": vuelve la llovizna y las rosas de la corona se marchitan; "fui el escogido para levantarte": destello y vuelven a florecer. "Te amaré y cuidaré / te protegeré" → **cúpula de cristal** que la protege.
  - "Tus sentimientos vi por dentro" → luz desde adentro del medallón; "somos una sola persona" → **dos corazones se juntan en uno**; "tantas cosas bellas" → el jardín florece y salen **mariposas**.
  - "Adolescentes": **letrero de neón "Adolescent's Orquesta"** y fuegos artificiales.
  - Final: "No llores, niña" → lágrimas que se vuelven estrellas; "Ríe, mi vida" → **amanece** (sale el sol detrás del jardín); "Tú corres por mis venas" → **enredaderas de rosas** suben por las orillas; "Eres la rosa más bella" → destellos de corona sobre el medallón.
- **Subtítulos especiales**: cada letra **cae girando como pétalo** y se acomoda; versos en letra de carta de amor (Dancing Script), el coro y el montuno en **letra de salsa de los 90** (Lobster) dorada con sombra vino; "Adolescentes" en neón rosa; palabras clave (amor, rosa, niña, vida, Dios, siénteme…) en rojo rosa con una florecita ❀; la línea que se va **se deshoja**.
- Las clases de estado de la escena llevan prefijo `vg-` (la clase `disco` chocaba con `.disco` de las portaditas del menú y encogía la escena).
- Para que no se trabe: todo en capas que solo animan transform/opacity; la lluvia es una sola tira con patrón que se desliza (sin rotar la capa, que era lo que la hacía pesada); en celular hay un jardín angosto propio (el ancho se recortaba) y la bola disco se oculta.
- `sincronizar.html` ya la incluye. Audio: `musica/Adolescent's Orquesta - Virgen (Audio Oficial).mp3`. Fuentes nuevas: Lobster y Dancing Script.

## 2026-10-14 — Canción quince "Alvafro" (LATIN MAFIA, Fred again..): hora 31 del mixtape

- **Menú**: portadita **lado O · Alvafro** (enlace directo: `index.html#alvafro`), con el ventanal, la rueda de la fortuna y la escalera. Borrón azul noche, cian, rosa neón y triplay. Los archivos usan el nombre `mixtape` (`js/escena-mixtape.js`, `css/mixtape.css`, letra en `js/letra-mixtape.js`) porque `alvafro` ya lo usaban los de "Piensas en mí". **Cambio en los enlaces**: ahora se busca primero por enlace y luego por id, así que `#alvafro` abre "Alvafro"; "Piensas en mí" sigue en `#piensas-en-mi`.
- **Las portaditas se caen**: con 15 canciones el menú ocupaba todo lo de arriba. Al elegir una canción, las demás se despegan de una esquina de su cinta, se quedan colgando un instante y caen girando fuera de la pantalla (primero las más cercanas a la elegida). La elegida se recorre a la esquina y junto a ella queda "canciones · ver todas". Tocándola (o tocando el letrero) las demás vuelven a subir y se pegan con un manotazo; tocar "canciones" con el menú abierto lo vuelve a recoger. Si una canción termina con el menú recogido, la siguiente se pega en su lugar. Al abrir la página el menú empieza abierto. En celular ahora van 8 y 7 portaditas por fila. Con "reducir movimiento" se recoge sin animación.
- **Escena** (inspirada en el video, "hour 31 of finishing our mixtape, mexico city"): el estudio en una cabaña en A, **en 3D de verdad** (CSS `perspective` + `preserve-3d`): piso con papel kraft, techo de triplay a dos aguas, el ventanal triangular con marcos de fierro y, afuera, la Ciudad de México de noche con árboles, edificios y la **rueda de la fortuna** iluminada. Adentro, un muro de collage en diagonal, el chico de playera rosa y gorra en una escalera pegando fotos (con su sombra en el muro), el que le pasa las fotos, alguien de sudadera junto a una caja, una persona con audífonos en la compu, torres de equipo con pantallas azules, bocinas, un foco rojo, micrófono, sillón, lámparas de papel como nubes, una guirnalda de foquitos, sábanas blancas con ella sentada y alguien dormido, botes de pintura y fotos regadas. El mouse (o el dedo) mueve la cámara y se ve la profundidad; además la cámara tiene pulso de mano y se acerca a lo importante en cada parte.
- **Todo es un time-lapse de la madrugada**: la gente cambia de lugar a saltos al ritmo del bajo (detectado en vivo; `js/main.js` ahora expone la fuente de audio en `window.FuenteMusica`), las fotos van llenando un **corazón** en el muro, y al final amanece. Letreros como los del video: "hour 31 of finishing our mixtape, mexico city", "hour 32", "hour 33", "hour 34" y al final "we finished it ♡".
- **El collage está hecho del mismo mixtape**: entre las fotos están las portaditas de todas las canciones (el menú las expone en `window.MiniPortadas`), y en el muro hay una **lista de canciones escrita a mano** (lado A a lado O, `window.ListaCanciones`) con palomita en cada una; "alvafro" se palomea al final.
- **La escena reacciona a cada línea**:
  - "¿Dónde está todo eso?": huecos vacíos con signos de interrogación y una linterna que busca por el muro.
  - "Si tú lo quieres, pues yo te lo entrego todo" / "te lo doy de todos modos": ráfaga de fotos que vuelan en 3D hasta el muro y papeles que cruzan frente a la cámara.
  - "¿Dónde estaba eso que me habías pedido?": la cámara se acerca al banquito con el **mixtape** (casete "para ti ♡") que brilla.
  - "¿Dónde está lo nuestro?": la cámara gira hacia el muro y se ilumina la **tira de fotos "tú y yo"** al centro del corazón.
  - "Lo que habíamos sido": película vieja (sepia, rayones, parpadeo de proyector).
  - "Mientes tanto y duele" / "cada que te escucho": falla de video (colores separados, barras, tirones de cámara), pantallas y rueda en rojo, ondas en las bocinas, y **el corazón se rompe** por la mitad.
  - "Ya no recuerdo": las fotos se borran. "Pero hay cicatrices": cinta que cose la grieta.
  - "Si estás aquí, no está tan mal" (cuatro veces): se prenden las lámparas, luego la guirnalda, luego alguien se sienta junto a ella y la abraza (suben corazones) y al final el corazón se completa y brilla.
  - "Cuando llamo y no me dices nada": el teléfono en la sábana llama ("llamando…" → "sin respuesta"); "cuando llamas": entra la llamada vibrando y se contesta… en silencio; al final la línea plana da un latido.
  - "No, no duele ya": la grieta se llena de **oro (kintsugi)** y amanece a saltos; la rueda se va apagando, sale el sol detrás de ella, entran rayos de luz y polvo, y en el clímax todo va al ritmo (estelas de coches, pads del equipo, saltos de la gente).
  - Final: mañana, todos dormidos, el chico abajo mirando el corazón terminado con luz de sol en el piso.
- **Subtítulos especiales**: los versos como letreros de video casero (minúsculas, Helvetica, letras que se escriben rápido; palabras clave en rosa neón). El coro como **mensajes de chat**: burbuja azul con "entregado" y la respuesta (lo que va entre paréntesis) en burbuja gris; al cambiar de línea el mensaje sube como en el chat.
- **Para que no se trabe** (medido con la GPU Intel Iris Xe de esta máquina, junto a "Virgen"): la rueda gira con animaciones del compositor (las cabinas giran al revés para quedar derechas; la velocidad cambia con `playbackRate`, sin brincos); ciudad, árboles, sombra del muro y el resplandor del corazón son imágenes SVG que se pintan una sola vez (un SVG con filtro de desenfoque dentro de la página se volvía una capa de 14 megapíxeles); el muro es un plano y solo conserva el 3D mientras vuelan fotos; a las fotos se les quita la animación al terminar (si no, quedaban como capas sueltas); grano y viñeta van en una sola capa; nada de modos de mezcla a pantalla completa salvo en sepia. Resultado: 55–60 cuadros por segundo casi toda la canción y ~46–56 en el amanecer.
- En celular el cuarto 3D se ve completo (más piso y más techo) y la cámara se mueve menos. `sincronizar.html` ya la incluye. Audio: `musica/LATIN MAFIA, Fred again.. - Alvafro.mp3`.
- Pendiente que ya venía de antes: además de `galaxyCanvas is not defined`, en celular `js/main.js` lanza `mobileLoader is not defined`.

## 2026-10-17 — Canción dieciséis "Take on me" (a-ha): el cómic a lápiz

- **Menú**: portadita **lado P · Take on me** (enlace directo: `index.html#take-on-me`), con la viñeta, él de espaldas sacando la mano del cómic y ella a color abajo a la izquierda. Borrón de papel y grafito. En celular quedan dos filas de 8 portaditas.
- **Escena** (`js/escena-takeonme.js`, `css/takeonme.css`, letra en `js/letra-takeonme.js`), al estilo del video: una página de cómic dibujada a lápiz sobre papel, con otras viñetas a medio dibujar en las orillas (una taza de café, un casco). En la viñeta grande hay un cuarto como el set del video (muros grises con líneas negras gruesas, una puerta, piso con brochazos negros) y **él dibujado a lápiz, de espaldas**, con el pelo rayado y la chamarra sombreada. **Ella es "real"**: a color (pelo largo casi negro con fleco de cortina, lentes redondos de alambre, suéter claro abierto y vestido oscuro).
- **Motor de lápiz** (propio de esta escena): cada trazo es una forma que se adelgaza en las puntas, como carboncillo, y se pasa un poquito de donde termina; los rectángulos se dibujan lado por lado y se cruzan en las esquinas; el sombreado son rayitas a mano. Cada dibujo se pinta 3 veces con pequeñas diferencias y se alternan ~10 veces por segundo (el "hervor" del rotoscopio del video).
- **La historia sigue la canción**:
  - Intro: la viñeta se dibuja sola, aparece el título "TAKE ON ME / a-ha" y adentro hay una **carrera de motos** (gradas con gente, bordillo a cuadros que corre, estelas, "VROOM!" y "ZOOM!"). Ella aparece afuera, viendo la página.
  - "Talking away": la carrera se cambia al cuarto y en una viñetita aparte él **voltea y le guiña el ojo**. Globos de diálogo: "…" ("I don't know what I'm to say"), "♥" ("I'll say it anyway") y "OK?"; en "today is another day to find you" salen líneas de enfoque y en "shying away" ella se sonroja.
  - Coro "Take on me": **su mano sale de la viñeta** hacia ella; en "take me on" ella estira el brazo y se la toma, y con un destello **la jala adentro del cómic** (adentro queda chiquita en el cuarto, con contorno de lápiz y su sombra en la pared). "I'll be gone": corazones de lápiz entre los dos; "in a day or two": un reloj que gira rapidísimo.
  - Segundo verso: "…" en "needless to say"; en "I'm odds and ends, but I'm me" aparecen sus **líneas de construcción en lápiz azul**; en "stumbling away" se tambalea; en "life is okay" entra una **luz cálida**; "say after me": ella canta (♪); "safe than sorry": globos con corazón.
  - Segundo coro: van **juntos en la moto** (ella atrás con el pelo al viento). En el instrumental los persiguen dos motociclistas con **llaves de tuerca** ("CLANG!"), le pegan ("BAM!") y, en el silencio de la canción, **arrugan la página** ("CRUNCH!"): la hoja se aleja sobre la mesa del café con arrugas; después ella la alisa.
  - Tercera parte ("All the things that you say"): él queda **atrapado y se avienta contra la orilla de la viñeta** ("BAM!", "THUD!"); a cada línea se abre una grieta en el marco.
  - Último coro: **rompe la viñeta** ("CRASH!", los pedazos salen volando), sale del cómic y **se vuelve real** (a color, con las líneas de lápiz todavía encima, mitad dibujo y mitad real); ella camina hasta él y **le toma la mano**, como en las imágenes de referencia (él grande al frente de espaldas y ella de frente). Rayos de cómic, luz cálida, corazones y al final "**THE END ♥**".
- **Subtítulos especiales**: los versos son **recuadros de narración de cómic** (papel, borde negro y sombra dura, mayúsculas de cómic que se rotulan letra por letra); el coro son **letras de onomatopeya** (Bangers) que revientan sobre una explosión de cómic con puntitos, y los coros de fondo "(take on me)" van en un globito. Palabras clave (love, okay, life, remember, gone, anyway) en rojo. Fuentes nuevas: Bangers y Comic Neue.
- La letra va en inglés tal como se pasó. El audio dura 3:40: las últimas dos líneas caen en el desvanecido y la última ya no se alcanza a ver.
- **En celular (vertical)** se ve la viñeta completa al centro; ella se para al frente, abajo a la izquierda, la viñetita del guiño se recorre adentro y al final la parte de abajo se desvanece en el papel.
- **Para que no se trabe** (medido con la GPU Intel Iris Xe de esta máquina, Chrome sin ventana, con la canción sonando): cada dibujo es una imagen SVG que se pinta una sola vez y lo que se mueve son capas enteras; el hervor es una animación de opacidad del compositor; lo de adentro de la viñeta se recorta con un rectángulo (un recorte con la forma de la viñeta obligaba a repintar todo en cada cuadro); la página arrugada se aleja con perspectiva 3D en lugar de `scale()` (encogerla hacía repintar todas las capas: ~280 ms de tirón → ~120 ms) y mientras está arrugada deja de hervir; al entrar la canción todo se pinta una vez casi invisible para que nada dé tirón la primera vez que aparece; se quitó un acercamiento de cámara que obligaba a repintar todo. Resultado: 54–57 cuadros por segundo de promedio; quedan tirones sueltos de ~100–150 ms cuando aparece la mano y cuando arrugan la página. (Con la misma medición, "Virgen" da 44–56 y "Alvafro" 24–29.)
- **"Alvafro"**: su lista del mixtape escrita a mano ahora llega solo hasta "alvafro" (la última canción del mixtape), para que no aparezca "take on me" ya palomeada. Esa escena no cambió en nada más.
- `sincronizar.html` ya la incluye. Audio: `musica/A-ha - Take on me(Sub Español + Lyrics).mp3`.
- **Él rediseñado con el mismo estilo y tamaño que ella** (a ella no se le cambió nada del dibujo): ya no es el dibujo grande de espaldas, sino un muchacho de cuerpo entero de tres cuartos mirándola, con cara como la de ella (ojos, cejas, sonrisa), pelo castaño ochentero de lado con la frente despejada, chamarra de piel, playera blanca, jeans y botas; mide un poquito más que ella. **Siempre a color** (en gris parecía maniquí y daba miedo): en el cómic va un poco apagado y con contorno de lápiz encima, igual que ella cuando entra, y al salir de la viñeta queda con sus colores completos. En la viñetita del guiño también es él, a color, con su cara nueva.
- Cómo se acomoda él en cada parte: en el primer verso está en el cuarto, más cerca del frente; en "Take on me" camina hasta el frente de la viñeta y **estira el brazo** (el brazo gira desde el hombro) hasta la mano de ella, que también estira el suyo (ya no sale la mano dibujada a lápiz); adentro del cómic quedan **los dos del mismo tamaño, frente a frente**; después del golpe está ladeado con **estrellitas de mareo**; atrapado, se avienta contra la orilla derecha; al romper la viñeta sale al frente y al final se toman de la mano **los dos del mismo tamaño**, con los corazones entre ellos.
- **La moto ahora es realista** (clásica de carreras de los ochenta): llantas con rin de 5 rayos, disco y caliper de freno, horquilla cromada, salpicadera, faro redondo, tablero y espejo, tanque rojo con franja, asiento de piel con su número 7, motor con aletas y tapas cromadas, carburador, escape cromado, cadena, basculante y amortiguador con resorte. **Encima van ellos dos con sus mismas cabezas** (las de cuando están de pie, al 85 %; la de él volteada hacia adelante): él manejando con las manos en el manubrio y ella atrás abrazándolo, con la mejilla recargada en su hombro y el pelo largo al viento. Los cuerpos sentados son brazos, piernas y torso suaves (tubos) con su misma ropa: él con chamarra café y jeans, ella con su suéter, vestido y medias. La primera versión (perfiles inventados y él en gris) se veía tiesa y rara, y se rehízo así. La cola de la moto quedó corta y el amortiguador lleva un resorte de verdad. Los rivales tienen la misma moto pero negra, casco y la llave de tuerca en alto.
- La portadita del menú ahora muestra a él con su diseño nuevo dándole la mano a ella.
- Rendimiento después del rediseño: 51–54 cuadros por segundo de promedio fuera de la carrera; en la carrera da entre 43 y 49 según la carga de la máquina (con o sin la moto sale igual, así que no es la moto). Quedan tirones sueltos de 100–250 ms la primera vez que aparece la carrera o la moto con los dos.
