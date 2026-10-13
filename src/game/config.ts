// Valores generales del juego. Todo lo que un adulto podría querer ajustar vive acá.

export const LANES = [-2.2, 0, 2.2] as const;
export type LaneIndex = 0 | 1 | 2;

export type SpeedSetting = 'slow' | 'medium' | 'normal';

/** Velocidad de avance (unidades por segundo) según lo elegido en el inicio. */
export const SPEEDS: Record<SpeedSetting, number> = {
  slow: 5,
  medium: 8,
  normal: 11,
};

export const CONFIG = {
  /** Tiempo que tarda en pasar de un carril a otro (segundos). */
  laneChangeTime: 0.35,
  /** Altura y duración del salto. */
  jumpHeight: 2.2,
  jumpTime: 0.8,
  /** Alcance del "imán" de estrellas (distancia lateral desde el centro del personaje). */
  magnetRadius: 1.6,
  /** Cuánto dura el "¡uy!" después de chocar un vagón antes de acomodarse (segundos). */
  bumpPause: 0.6,
  /** Cuánto tarda en recuperar la velocidad después de un choque (segundos). */
  recoverTime: 1.2,
  /** Ignora toques repetidos del mismo botón más rápidos que esto (ms). Ayuda con temblores. */
  inputDebounceMs: 220,
};
