# Créditos de sonidos

Todos los sonidos de esta carpeta son de **Kenney** (https://kenney.nl) y tienen licencia
**CC0 1.0** (dominio público): se pueden usar libremente, sin dar créditos (igual los dejamos
anotados para tener el origen claro).

Se convirtieron de OGG a MP3 (mono, 96 kbps) para que funcionen en iPhone/iPad.

| Archivo          | Uso en el juego             | Origen                                                                 |
|------------------|-----------------------------|------------------------------------------------------------------------|
| `estrella.mp3`   | Juntar una estrella         | `sounds/coin.ogg` de [Starter Kit 3D Platformer](https://github.com/KenneyNL/Starter-Kit-3D-Platformer) |
| `salto.mp3`      | Saltar                      | `sounds/jump.ogg` de Starter Kit 3D Platformer                         |
| `aterrizaje.mp3` | Tocar el piso tras un salto | `sounds/land.ogg` de Starter Kit 3D Platformer                         |
| `carril.mp3`     | Cambiar de carril           | `sounds/placement-a.ogg` de [Starter Kit City Builder](https://github.com/KenneyNL/Starter-Kit-City-Builder) |
| `ocupado.mp3`    | Carril ocupado ("por acá no") | `sounds/placement-d.ogg` de Starter Kit City Builder                 |

El "boing" del choque y la fanfarria de la meta todavía se sintetizan en el código
(`src/audio/sfx.ts`), porque estos kits no traen sonidos de ese estilo.
