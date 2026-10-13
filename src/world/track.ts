import * as THREE from 'three';
import { LANES } from '../game/config';
import type { LevelData, Obstacle } from './level';

// Construye todo lo que se ve del nivel: vías, vagones, estrellas, paisaje y la meta.
// La distancia "d" hacia adelante se dibuja en z = -d.

export interface StarObject {
  mesh: THREE.Mesh;
  lane: number;
  dist: number;
  baseY: number;
  collected: boolean;
  /** 0..1 mientras vuela hacia el personaje al ser atrapada. */
  flying: number;
}

export interface Track {
  root: THREE.Group;
  stars: StarObject[];
  update(time: number): void;
  dispose(): void;
}

const EXTRA = 120; // vía de más después de la meta, para el festejo

export function buildTrack(level: LevelData): Track {
  const root = new THREE.Group();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const total = level.length + EXTRA + 40;
  const centerZ = -(total / 2) + 40;

  // ---------- Suelo ----------
  const grass = new THREE.Mesh(
    track(new THREE.PlaneGeometry(200, total)),
    track(new THREE.MeshLambertMaterial({ color: 0x8fd16a })),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.02, centerZ);
  root.add(grass);

  const gravel = new THREE.Mesh(
    track(new THREE.PlaneGeometry(8.4, total)),
    track(new THREE.MeshLambertMaterial({ color: 0xc9b79c })),
  );
  gravel.rotation.x = -Math.PI / 2;
  gravel.position.set(0, 0, centerZ);
  root.add(gravel);

  // Andenes a los costados
  const platformMat = track(new THREE.MeshLambertMaterial({ color: 0xd9dde3 }));
  const edgeMat = track(new THREE.MeshLambertMaterial({ color: 0xffd23f }));
  for (const side of [-1, 1]) {
    const platform = new THREE.Mesh(track(new THREE.BoxGeometry(3, 0.5, total)), platformMat);
    platform.position.set(side * 5.7, 0.25, centerZ);
    root.add(platform);
    const edge = new THREE.Mesh(track(new THREE.BoxGeometry(0.3, 0.52, total)), edgeMat);
    edge.position.set(side * 4.35, 0.26, centerZ);
    root.add(edge);
  }

  // ---------- Vías ----------
  const railMat = track(new THREE.MeshLambertMaterial({ color: 0x8a8f99 }));
  const railGeo = track(new THREE.BoxGeometry(0.12, 0.14, total));
  for (const x of LANES) {
    for (const off of [-0.55, 0.55]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x + off, 0.12, centerZ);
      root.add(rail);
    }
  }

  const sleeperGap = 1.3;
  const sleepersPerLane = Math.ceil(total / sleeperGap);
  const sleepers = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(1.6, 0.1, 0.35)),
    track(new THREE.MeshLambertMaterial({ color: 0x8b5a3c })),
    sleepersPerLane * LANES.length,
  );
  const m = new THREE.Matrix4();
  let i = 0;
  for (const x of LANES) {
    for (let s = 0; s < sleepersPerLane; s++) {
      m.makeTranslation(x, 0.05, 40 - s * sleeperGap);
      sleepers.setMatrixAt(i++, m);
    }
  }
  root.add(sleepers);

  // ---------- Vagones y barreras ----------
  for (const ob of level.obstacles) {
    const mesh = ob.kind === 'train' ? makeTrain(ob, track) : makeBarrier(ob, track);
    root.add(mesh);
  }

  // ---------- Estrellas ----------
  const starGeo = track(makeStarGeometry());
  const starMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      emissive: 0xffa600,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.1,
    }),
  );
  const stars: StarObject[] = level.stars.map((s) => {
    const mesh = new THREE.Mesh(starGeo, starMat);
    mesh.position.set(LANES[s.lane], s.y, -s.dist);
    root.add(mesh);
    return { mesh, lane: s.lane, dist: s.dist, baseY: s.y, collected: false, flying: 0 };
  });

  // ---------- Paisaje ----------
  root.add(makeScenery(total, track));

  // ---------- Meta ----------
  root.add(makeFinishArch(level.length, track));

  return {
    root,
    stars,
    update(time: number) {
      for (const s of stars) {
        if (s.collected) continue;
        s.mesh.rotation.y = time * 2.5 + s.dist * 0.3;
        if (s.flying === 0) s.mesh.position.y = s.baseY + Math.sin(time * 3 + s.dist) * 0.12;
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

type Tracker = <T extends { dispose(): void }>(x: T) => T;

function makeTrain(ob: Obstacle, track: Tracker): THREE.Group {
  const len = ob.end - ob.start;
  const g = new THREE.Group();
  const bodyMat = track(new THREE.MeshLambertMaterial({ color: ob.color }));
  const darkMat = track(new THREE.MeshLambertMaterial({ color: 0x3a3f4b }));
  const glassMat = track(new THREE.MeshLambertMaterial({ color: 0xbfe6ff }));
  const whiteMat = track(new THREE.MeshLambertMaterial({ color: 0xffffff }));

  const base = new THREE.Mesh(track(new THREE.BoxGeometry(1.7, 0.35, len - 0.4)), darkMat);
  base.position.y = 0.3;
  g.add(base);

  const body = new THREE.Mesh(track(new THREE.BoxGeometry(1.9, 1.9, len)), bodyMat);
  body.position.y = 1.4;
  g.add(body);

  const roof = new THREE.Mesh(track(new THREE.CylinderGeometry(0.95, 0.95, len, 16)), bodyMat);
  roof.rotation.x = Math.PI / 2;
  roof.scale.set(1, 1, 0.45);
  roof.position.y = 2.2;
  g.add(roof);

  // Franja de ventanas a los costados
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.6, len - 1.2)), glassMat);
    win.position.set(side * 0.96, 1.7, 0);
    g.add(win);
  }
  // Frente: parabrisas + franja blanca + faroles
  const front = len / 2 + 0.01;
  const windshield = new THREE.Mesh(track(new THREE.PlaneGeometry(1.4, 0.7)), glassMat);
  windshield.position.set(0, 1.75, front);
  g.add(windshield);
  const stripe = new THREE.Mesh(track(new THREE.PlaneGeometry(1.9, 0.18)), whiteMat);
  stripe.position.set(0, 1.0, front);
  g.add(stripe);
  const lampGeo = track(new THREE.CircleGeometry(0.14, 12));
  const lampMat = track(new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
  for (const x of [-0.6, 0.6]) {
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, 0.7, front + 0.01);
    g.add(lamp);
  }

  g.position.set(LANES[ob.lane], 0, -(ob.start + len / 2));
  return g;
}

function makeBarrier(ob: Obstacle, track: Tracker): THREE.Group {
  const g = new THREE.Group();
  const postMat = track(new THREE.MeshLambertMaterial({ color: 0x555b66 }));
  const red = track(new THREE.MeshLambertMaterial({ color: 0xe63946 }));
  const white = track(new THREE.MeshLambertMaterial({ color: 0xffffff }));
  const postGeo = track(new THREE.BoxGeometry(0.15, ob.height, 0.15));
  for (const x of [-0.75, 0.75]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, ob.height / 2, 0);
    g.add(post);
  }
  const segGeo = track(new THREE.BoxGeometry(0.34, 0.3, 0.12));
  for (let k = 0; k < 5; k++) {
    const seg = new THREE.Mesh(segGeo, k % 2 ? white : red);
    seg.position.set(-0.68 + k * 0.34, ob.height - 0.2, 0);
    g.add(seg);
  }
  g.position.set(LANES[ob.lane], 0, -(ob.start + 0.3));
  return g;
}

function makeStarGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outer = 0.45;
  const inner = 0.2;
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (k === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 1,
  });
  geo.center();
  return geo;
}

function makeScenery(total: number, track: Tracker): THREE.Group {
  const g = new THREE.Group();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  // Edificios de colores detrás de los andenes
  const buildingColors = [0xffadad, 0xffd6a5, 0xfdffb6, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xbdb2ff, 0xffc6ff];
  const perSide = Math.ceil(total / 9);
  const buildings = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(1, 1, 1)),
    track(new THREE.MeshLambertMaterial({ color: 0xffffff })),
    perSide * 2,
  );
  let n = 0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < perSide; k++) {
      const h = 3 + ((k * 7 + (side > 0 ? 3 : 0)) % 5) * 1.4;
      const w = 5 + (k % 3);
      dummy.position.set(side * (13 + (k % 2) * 1.5), h / 2, 40 - k * 9);
      dummy.scale.set(w, h, 7.5);
      dummy.updateMatrix();
      buildings.setMatrixAt(n, dummy.matrix);
      buildings.setColorAt(n, color.setHex(buildingColors[(k + (side > 0 ? 4 : 0)) % buildingColors.length]));
      n++;
    }
  }
  g.add(buildings);

  // Árboles entre andenes y edificios
  const treeCount = Math.ceil(total / 7) * 2;
  const trunks = new THREE.InstancedMesh(
    track(new THREE.CylinderGeometry(0.15, 0.2, 1, 6)),
    track(new THREE.MeshLambertMaterial({ color: 0x8b5a3c })),
    treeCount,
  );
  const crowns = new THREE.InstancedMesh(
    track(new THREE.IcosahedronGeometry(1, 0)),
    track(new THREE.MeshLambertMaterial({ color: 0x4caf50 })),
    treeCount,
  );
  n = 0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < treeCount / 2; k++) {
      const z = 36 - k * 7 - (side > 0 ? 3.5 : 0);
      const x = side * (8.6 + (k % 3) * 0.5);
      dummy.position.set(x, 0.5, z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      trunks.setMatrixAt(n, dummy.matrix);
      const s = 0.9 + (k % 4) * 0.15;
      dummy.position.set(x, 1.6 + s * 0.5, z);
      dummy.scale.set(s, s * 1.1, s);
      dummy.updateMatrix();
      crowns.setMatrixAt(n, dummy.matrix);
      crowns.setColorAt(n, color.setHex(k % 3 === 0 ? 0x66bb6a : k % 3 === 1 ? 0x43a047 : 0x7cb342));
      n++;
    }
  }
  g.add(trunks, crowns);

  // Faroles sobre los andenes
  const lampCount = Math.ceil(total / 16) * 2;
  const poles = new THREE.InstancedMesh(
    track(new THREE.CylinderGeometry(0.07, 0.07, 3, 6)),
    track(new THREE.MeshLambertMaterial({ color: 0x4a5568 })),
    lampCount,
  );
  const bulbs = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.22, 10, 8)),
    track(new THREE.MeshBasicMaterial({ color: 0xfff1b3 })),
    lampCount,
  );
  n = 0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < lampCount / 2; k++) {
      const z = 30 - k * 16;
      dummy.scale.set(1, 1, 1);
      dummy.position.set(side * 6.2, 2, z);
      dummy.updateMatrix();
      poles.setMatrixAt(n, dummy.matrix);
      dummy.position.set(side * 6.2, 3.55, z);
      dummy.updateMatrix();
      bulbs.setMatrixAt(n, dummy.matrix);
      n++;
    }
  }
  g.add(poles, bulbs);

  return g;
}

function makeFinishArch(dist: number, track: Tracker): THREE.Group {
  const g = new THREE.Group();
  const pillarMat = track(new THREE.MeshLambertMaterial({ color: 0xff6b9a }));
  const pillarGeo = track(new THREE.CylinderGeometry(0.35, 0.35, 6, 12));
  for (const x of [-4.4, 4.4]) {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(x, 3, 0);
    g.add(p);
    const ball = new THREE.Mesh(track(new THREE.SphereGeometry(0.55, 14, 10)), track(new THREE.MeshLambertMaterial({ color: 0xffd23f })));
    ball.position.set(x, 6.3, 0);
    g.add(ball);
  }

  // Cartel a cuadros con la palabra META
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const sq = 32;
  for (let y = 0; y < canvas.height; y += sq) {
    for (let x = 0; x < canvas.width; x += sq) {
      ctx.fillStyle = (x / sq + y / sq) % 2 ? '#222' : '#fff';
      ctx.fillRect(x, y, sq, sq);
    }
  }
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(110, 18, 292, 92);
  ctx.fillStyle = '#c2185b';
  ctx.font = 'bold 80px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('META', 256, 68);
  const tex = track(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  const banner = new THREE.Mesh(
    track(new THREE.BoxGeometry(9.4, 2.2, 0.3)),
    track(new THREE.MeshBasicMaterial({ map: tex })),
  );
  banner.position.set(0, 5.2, 0);
  g.add(banner);

  // Línea a cuadros en el piso
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 256;
  floorCanvas.height = 32;
  const fctx = floorCanvas.getContext('2d')!;
  for (let x = 0; x < 256; x += 16) {
    for (let y = 0; y < 32; y += 16) {
      fctx.fillStyle = (x / 16 + y / 16) % 2 ? '#222' : '#fff';
      fctx.fillRect(x, y, 16, 16);
    }
  }
  const lineTex = track(new THREE.CanvasTexture(floorCanvas));
  const line = new THREE.Mesh(
    track(new THREE.PlaneGeometry(8.4, 1)),
    track(new THREE.MeshBasicMaterial({ map: lineTex })),
  );
  line.rotation.x = -Math.PI / 2;
  line.position.y = 0.2;
  g.add(line);

  g.position.z = -dist;
  return g;
}
