# ¡Vamos a la meta! (nombre provisorio)

Juego runner en 3D, estilo *Subway Surfers*, pensado para chicos de 5 a 10 años con dificultades
motrices. **No se puede perder**: no hay vidas, ni reloj, ni nadie que persiga. Si el personaje choca
un vagón, dice "¡uy!" y se acomoda solo en el carril libre. Siempre se llega a la meta.

Ver el plan completo en [PLAN.md](PLAN.md).

## Cómo se juega
- **⬅ / ➡**: cambiar de carril. **⬆**: saltar.
- También se puede tocar la pantalla: lado izquierdo, centro o lado derecho.
- Teclado o pulsador Bluetooth: flechas, `A`/`D`/`W`, `Espacio` o `Enter` (saltar / jugar / seguir).
- Velocidad elegible en el inicio: 🐢 muy lento · 🐇 lento · 🐎 normal.

## Desarrollo
```bash
npm install
npm run dev      # abre un servidor local; se puede entrar desde la tablet con la IP de la compu
npm run build    # genera la versión final en dist/
```

Hecho con [Three.js](https://threejs.org/) + TypeScript + Vite. Se publica solo en GitHub Pages
cuando se actualiza la rama `master`.
