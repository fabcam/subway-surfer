# Plan del juego — runner 3D inclusivo (nombre a definir)

## 1. Visión

Un juego **runner en 3D** al estilo *Subway Surfers* / *Talking Tom: Carrera del Oro*, pensado para
**chicos de 5 a 10 años con dificultades motrices**.

El personaje corre solo por las vías, cambia de carril, salta vagones y junta premios hasta llegar
a la **meta**. La regla de oro: **no se puede perder**.

### Lo que el juego NO tiene
- ❌ "Game Over", vidas ni reintentos.
- ❌ Reloj, cuenta regresiva ni límite de tiempo.
- ❌ Policía, perro ni ningún perseguidor.
- ❌ Puntajes que bajan o penalizaciones.
- ❌ Reacciones rápidas obligatorias, doble toque ni gestos de precisión.

### Lo que SÍ tiene
- ✅ Llegada garantizada a la meta, siempre con festejo y medalla.
- ✅ Choques amables: el personaje frena suave, hace un gesto gracioso ("¡uy!") y **se acomoda
  solo al carril libre** para seguir avanzando.
- ✅ Premios para juntar (estrellas, monedas, figuritas) que sirven para motivar, nunca para exigir.

---

## 2. Público y plataforma

| Aspecto      | Decisión                                                                                      |
|--------------|-----------------------------------------------------------------------------------------------|
| Edad         | 5 a 10 años                                                                                   |
| Dispositivo  | **Tablet y celular** (Android / iPad / iPhone)                                                |
| Orientación  | Horizontal y vertical, con los botones adaptados a cada una                                   |
| Estilo       | **3D caricaturesco** con colores vivos (referencias: Subway Surfers, Talking Tom Gold Run)    |
| Texto        | Mínimo: **íconos grandes + voz/sonido**, para que lo pueda usar un chico que todavía no lee   |
| Idioma       | Español (rioplatense neutro); se podrían sumar otros idiomas más adelante                     |

---

## 3. Mecánica principal

- **3 carriles.** El personaje avanza solo hacia adelante.
- **Acciones:** ⬅️ izquierda, ➡️ derecha, ⬆️ saltar. Agacharse queda fuera al principio para
  simplificar; se puede sumar como opción más adelante.
- **Obstáculos:** vagones, barreras y cajas. Nunca hacen perder.
- **Choque amable:**
  1. El personaje desacelera suavemente (sin frenazo brusco).
  2. Hace una animación simpática con un sonido suave y divertido.
  3. Se desliza solo al carril libre más cercano, o sube de un salto automático arriba del vagón.
  4. Retoma la velocidad de a poco.
  - Sin pantalla roja, sin sacudón de cámara fuerte y sin sonidos negativos.
- **Premios:** estrellas o monedas a lo largo del camino y algunos premios especiales (figuritas).
- **Meta:** un arco de llegada con confeti, música, baile del personaje y una **medalla que
  siempre se gana**. Si juntó más premios, la medalla tiene más brillitos, pero nunca hay
  "mal resultado".

---

## 4. Accesibilidad motriz (prioridad máxima)

### 4.1 Controles
- **Botones en pantalla grandes**, de 120 px o más, ubicados abajo y a los costados, con zona de
  toque generosa. El juego responde al **tocar**, no al deslizar.
- **Deslizar el dedo** queda como opción para quien pueda usarlo.
- **Tocar media pantalla:** tocar el lado izquierdo o derecho mueve hacia ese lado (modo alternativo).
- **Pulsadores adaptados (switch) por Bluetooth:** funcionan como teclas (espacio, enter, flechas),
  así que el juego los toma automáticamente.
- **Modo un solo botón (barrido o "scanning"):** las opciones ⬅️ ⬆️ ➡️ se iluminan por turnos y
  el chico aprieta cuando aparece la que quiere. La velocidad del barrido es ajustable.
- **Gamepad/joystick** compatible (por la API de gamepads del navegador).
- **Filtros de toques:**
  - Ignorar toques repetidos accidentales (temblor).
  - Tiempo de "mantener apretado" configurable para evitar toques involuntarios.
  - Todo funciona con un toque simple, sin necesidad de mantener apretado.

### 4.2 Ayudas regulables
- **Velocidad:** desde "muy lenta" hasta "normal".
- **Imán de premios:** agarra los premios cercanos aunque no esté exactamente en el carril.
  Se puede regular cuánto alcanza.
- **Salto automático** ante obstáculos (opcional).
- **Modo paseo:** el personaje esquiva solo y el chico solo junta premios o mira.
  Sirve para los primeros contactos con el juego.
- **Pausa** siempre visible y grande.

### 4.3 Aspectos sensoriales
- Sin destellos ni luces intermitentes.
- Opción de **movimiento reducido** (menos balanceo de cámara y menos efectos).
- Volúmenes separados para música, efectos y voz.
- Buen contraste: obstáculos y premios fáciles de distinguir del fondo.

### 4.4 Panel del adulto
- Para terapeutas, docentes o familia.
- Protegido para que el chico no entre sin querer (por ejemplo, mantener apretado 3 segundos o
  hacer una suma simple).
- Ahí se configuran los controles, la velocidad, las ayudas y el sonido.
- **Perfiles:** varios chicos en el mismo dispositivo, cada uno con su configuración.
- Opcional: un registro simple de uso (tiempo jugado, niveles completados) para seguimiento terapéutico.

---

## 5. Mundos / niveles

Cada nivel dura entre 1 y 3 minutos, ajustable según la velocidad, y termina en una meta con festejo.

| # | Mundo                 | Ambiente                            | Premio temático | Dificultad          |
|---|-----------------------|-------------------------------------|-----------------|---------------------|
| 1 | La Estación           | Andén, tutorial guiado con voz      | Estrellas       | Casi sin obstáculos |
| 2 | El Parque             | Árboles, flores, pájaros            | Mariposas       | Pocos vagones       |
| 3 | La Playa              | Tren costero, mar y sol             | Caracoles       | Algunos vagones     |
| 4 | La Montaña Nevada     | Túneles, pinos, nieve               | Copos de nieve  | Vagones + barreras  |
| 5 | La Ciudad de Noche    | Edificios con luces suaves          | Estrellas       | Variado             |
| 6 | La Gran Feria (final) | Calesita, globos, fuegos artificiales suaves | Globos | Variado + gran festejo |

- Todos los niveles se pueden **elegir libremente** desde un mapa. Si el adulto prefiere, se
  desbloquean en orden.
- La "dificultad" solo cambia cuántos obstáculos aparecen; aun así **nunca se pierde**.

---

## 6. Recompensas y motivación

- **Álbum de figuritas:** cada nivel completado da figuritas nuevas.
- **Personajes y ropa:** se eligen entre 3 o 4 personajes al principio (un animalito, un chico,
  una chica, un robot) y se desbloquean gorros, colores y patinetas con los premios.
- **Festejos frecuentes:** voz que felicita ("¡Muy bien!", "¡Lo lograste!") y animaciones alegres.
- Sin compras, sin publicidad y sin conexión obligatoria.

---

## 7. Propuesta técnica

| Tema           | Elección                                                                                    |
|----------------|---------------------------------------------------------------------------------------------|
| Tipo           | **Juego web instalable (PWA)**: se abre en el navegador y se puede "agregar a inicio" como una app |
| Motor 3D       | **Three.js**                                                                                |
| Lenguaje       | TypeScript                                                                                  |
| Herramienta    | Vite (desarrollo y empaquetado)                                                             |
| Gráficos       | Low-poly coloridos: al principio formas simples, después modelos 3D gratuitos (glTF, licencia CC0) |
| Sonido         | Web Audio (efectos + música de licencia libre); voces grabadas o síntesis de voz            |
| Offline        | Sí, con Service Worker (funciona sin internet una vez cargado)                              |
| Guardado       | En el dispositivo (localStorage/IndexedDB): perfiles, progreso, configuración               |
| Publicación    | GitHub Pages (gratis)                                                                       |
| Rendimiento    | Objetivo de 60 fps en tablets/celulares de gama media; modo "gráficos bajos" automático     |

Más adelante, si hace falta, se puede empaquetar como app de Play Store / App Store (Capacitor).

### Estructura tentativa
```
src/
  main.ts            # arranque
  game/              # bucle del juego, personaje, carriles, choques amables
  world/             # generación de pistas y niveles
  input/             # táctil, teclado/pulsador, barrido, gamepad
  ui/                # menús, panel del adulto, meta, álbum
  audio/             # música, efectos, voz
  data/levels/       # definición de cada mundo
public/
  models/ sounds/ icons/
```

---

## 8. Etapas de desarrollo

### Etapa 1: Prototipo jugable
- [ ] Proyecto base (Vite + TypeScript + Three.js).
- [ ] Pista infinita de 3 carriles con vías y escenario simple.
- [ ] Personaje (forma simple) que corre, cambia de carril y salta.
- [ ] Botones táctiles grandes + teclado.
- [ ] Vagones con **choque amable** (frenar, gesto, acomodarse al costado).
- [ ] Estrellas para juntar, con imán.
- [ ] Meta con festejo.
- **Objetivo:** probarlo con un chico real lo antes posible y ajustar.

### Etapa 2: Accesibilidad
- [ ] Modo barrido de un solo botón.
- [ ] Soporte para pulsadores Bluetooth y gamepad.
- [ ] Filtros de toques (antirrebote, temblor).
- [ ] Panel del adulto + perfiles.
- [ ] Velocidad, imán, salto automático, modo paseo y movimiento reducido.

### Etapa 3: Contenido
- [ ] Los 6 mundos con su ambientación.
- [ ] Mapa de selección de niveles.
- [ ] Personajes elegibles y personalización.
- [ ] Álbum de figuritas.
- [ ] Música, efectos y voces.

### Etapa 4: Pulido y publicación
- [ ] Modelos 3D más lindos y animaciones.
- [ ] Funcionamiento sin conexión (PWA).
- [ ] Pruebas en varios dispositivos.
- [ ] Publicación en GitHub Pages.

---

## 9. Pendientes por decidir
- **Nombre del juego.** Ideas: *Vía Libre*, *Tren de Estrellas*, *Rieles Mágicos*, *Viaje a la Meta*.
- **Personaje principal** y su estética.
- ¿Voces grabadas por personas o síntesis de voz?
- ¿Hace falta el registro de uso para terapeutas?
- Validar con terapeutas ocupacionales y kinesiólogos qué controles usan los chicos.

## 10. Nota legal
No se usan el nombre, los personajes ni los gráficos de *Subway Surfers* ni de *Talking Tom*
(son marcas registradas). El juego tiene identidad propia y solo toma la idea general del género
"runner".
