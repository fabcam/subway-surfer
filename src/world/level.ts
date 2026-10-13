import type { LaneIndex } from '../game/config';

// Distancias medidas desde la largada, hacia adelante.

export type ObstacleKind = 'train' | 'barrier';

export interface Obstacle {
  kind: ObstacleKind;
  lane: LaneIndex;
  /** Distancia donde empieza (frente) y termina (cola). */
  start: number;
  end: number;
  height: number;
  color: number;
}

export interface StarItem {
  lane: LaneIndex;
  dist: number;
  y: number;
}

export interface LevelData {
  name: string;
  length: number;
  obstacles: Obstacle[];
  stars: StarItem[];
}

export interface LevelSpec {
  name: string;
  length: number;
  seed: number;
  /** Probabilidad (0..1) de cada tipo de fila. El resto queda libre. */
  oneTrain: number;
  twoTrains: number;
  barrier: number;
}

export const LEVEL_1: LevelSpec = {
  name: 'La Estación',
  length: 520,
  seed: 7,
  oneTrain: 0.45,
  twoTrains: 0.15,
  barrier: 0.2,
};

const TRAIN_COLORS = [0xe63946, 0x2a9d8f, 0x457b9d, 0xf4a261, 0x9b5de5, 0x00b4d8];

/** Generador pseudoaleatorio con semilla: el mismo nivel sale siempre igual. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALL_LANES: LaneIndex[] = [0, 1, 2];

export function generateLevel(spec: LevelSpec): LevelData {
  const rand = mulberry32(spec.seed);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => min + rand() * (max - min);

  const obstacles: Obstacle[] = [];
  const stars: StarItem[] = [];

  const addStarRun = (lane: LaneIndex, from: number, to: number, y = 0.9) => {
    for (let d = from; d <= to; d += 2.4) stars.push({ lane, dist: d, y });
  };

  // Primeras estrellas de bienvenida en el carril del medio, sin obstáculos.
  addStarRun(1, 14, 34);

  let d = 50;
  const lastRow = spec.length - 45;
  while (d < lastRow) {
    const r = rand();
    let rowEnd = d + 8;

    if (r < spec.oneTrain + spec.twoTrains) {
      // Vagones: uno o dos carriles ocupados, siempre queda al menos uno libre.
      const count = r < spec.oneTrain ? 1 : 2;
      const shuffled = [...ALL_LANES].sort(() => rand() - 0.5);
      const blocked = shuffled.slice(0, count);
      const free = shuffled.slice(count);
      const len = between(9, 14);
      for (const lane of blocked) {
        obstacles.push({
          kind: 'train',
          lane,
          start: d,
          end: d + len,
          height: 2.6,
          color: pick(TRAIN_COLORS),
        });
      }
      rowEnd = d + len;
      addStarRun(pick(free), d - 2, rowEnd);
    } else if (r < spec.oneTrain + spec.twoTrains + spec.barrier) {
      // Barrera baja que se puede saltar, con un arco de estrellas encima.
      const lane = pick(ALL_LANES);
      obstacles.push({ kind: 'barrier', lane, start: d, end: d + 0.6, height: 1.0, color: 0xffffff });
      for (let i = -3; i <= 3; i++) {
        const y = 0.9 + 1.6 * (1 - (i * i) / 9);
        stars.push({ lane, dist: d + 0.3 + i * 1.3, y });
      }
      rowEnd = d + 4;
    } else {
      // Tramo libre: una fila de estrellas en cualquier carril.
      addStarRun(pick(ALL_LANES), d, d + 12);
      rowEnd = d + 12;
    }

    d = rowEnd + between(14, 22);
  }

  // Estrellas finales hacia la meta, en los tres carriles.
  for (const lane of ALL_LANES) addStarRun(lane, spec.length - 25, spec.length - 6);

  return { name: spec.name, length: spec.length, obstacles, stars };
}
