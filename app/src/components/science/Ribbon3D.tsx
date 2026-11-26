'use client';
// Science → Pacific Fire Ribbon, 3D view (step 4; docs/fire-ribbon.md). Loaded only when someone switches to 3D
// (FireRibbon.tsx imports it lazily), so Three.js never weighs on the 2D page.
//
// One window of the ribbon at a time, in kilometres: X along the route (centred on the window), Z across it
// (+ = left, the Pacific side on most of the route), Y up. Terrain is the ETOPO 2022 grid (10 km cells) with heights
// × the relief factor; earthquakes sit at their own position across the route and their reported depth (never
// exaggerated); volcanoes at their catalogued summit height. Cameras: oblique (perspective), section (orthographic,
// looking along the route: distance across vs depth) and top (orthographic, from above).
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useT } from '@/i18n/I18nProvider';
import { useAccount } from '@/components/Account';
import {
  GRID_Y0_KM, GRID_Y1_KM, depthColour, markerRadius, markerOpacity,
  type Period, type RibbonQuake, type Terrain3DResponse,
} from '@/lib/ribbon/shared';
import type { RibbonVolcano } from '@/lib/ribbon/volcanoes';
import styles from './ribbon.module.css';

export type Camera3D = 'oblique' | 'section' | 'top';
const BG = 0x0b1220;
const DEPTH_KM = 700;

/** Terrain colour by height (m): sea floor from deep to shallow blue, land from low green-brown to grey-ochre. */
function terrainColour(m: number, c: THREE.Color) {
  if (m < 0) {
    const t = Math.min(1, -m / 8000);
    return c.setRGB(0.16 - 0.1 * t, 0.36 - 0.22 * t, 0.56 - 0.24 * t);
  }
  const t = Math.min(1, m / 4500);
  return c.setRGB(0.34 + 0.32 * t, 0.36 + 0.18 * t, 0.24 + 0.22 * t);
}

/** A text label as a sprite that always faces the camera (size in km at the scene's scale). */
function label(text: string, sizeKm: number, colour = 'rgba(214,224,240,0.9)') {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = '600 48px system-ui, sans-serif';
  const w = Math.ceil(g.measureText(text).width) + 16;
  c.width = w; c.height = 64;
  g.font = '600 48px system-ui, sans-serif'; g.fillStyle = colour; g.textBaseline = 'middle';
  g.fillText(text, 8, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(sizeKm * (w / 64), sizeKm, 1);
  s.renderOrder = 10;
  return s;
}

/** Loads one terrain window, keyed by its rounded bounds; null while loading or when unavailable. */
function useTerrainWindow(x0: number, x1: number) {
  const { accessToken } = useAccount();
  const [st, setSt] = useState<{ key: string; d: Terrain3DResponse | null; failed: boolean } | null>(null);
  const a = Math.max(0, Math.floor(x0 / 100) * 100), b = Math.ceil(x1 / 100) * 100;
  const key = `${a}:${b}`;
  useEffect(() => {
    let alive = true;
    void (async () => {
      const token = await accessToken().catch(() => null);
      const r = await fetch(`/api/science/ribbon/terrain3d?from=${a}&to=${b}`, { headers: token ? { authorization: `Bearer ${token}` } : {} }).catch(() => null);
      const d = r?.ok ? ((await r.json()) as Terrain3DResponse) : null;
      if (alive) setSt({ key, d, failed: !d });
    })();
    return () => { alive = false; };
  }, [a, b, key, accessToken]);
  return st?.key === key ? st : null;
}

export default function Ribbon3D({ centre, span, quakes, volcanoes, showTerrain, relief, camera, period, now, selected, selectedV, onSelect, onSelectV, labels }: {
  centre: number; span: number; quakes: RibbonQuake[]; volcanoes: RibbonVolcano[]; showTerrain: boolean; relief: number;
  camera: Camera3D; period: Period; now: number; selected: string | null; selectedV: number | null;
  onSelect: (id: string | null) => void; onSelectV: (n: number | null) => void;
  labels: { pacific: string; behind: string; depth: string; km: string; loading: string; unavailable: string; noWebgl: string; regions: { name: string; x0: number; x1: number }[] };
}) {
  const { nf } = useT();
  const host = useRef<HTMLDivElement>(null);
  const x0 = centre - span / 2, x1 = centre + span / 2;
  const terrain = useTerrainWindow(x0, x1);
  const camRef = useRef<Camera3D>(camera);
  // WebGL support, checked once (this component only renders in the browser); a renderer that still fails sets it false.
  const [webgl, setWebgl] = useState(() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  });
  const three = useRef<{
    renderer: THREE.WebGLRenderer; scene: THREE.Scene; persp: THREE.PerspectiveCamera; ortho: THREE.OrthographicCamera;
    controls: OrbitControls; world: THREE.Group; render: () => void; quakeMesh: THREE.InstancedMesh | null; volcMesh: THREE.InstancedMesh | null;
    quakeIds: string[]; volcIds: number[];
  } | null>(null);

  // Renderer, cameras and controls: created once.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); } catch { queueMicrotask(() => setWebgl(false)); return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(BG);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1f2b, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-600, 900, 700);
    scene.add(sun);
    const world = new THREE.Group();
    scene.add(world);
    const persp = new THREE.PerspectiveCamera(40, 1, 5, 20000);
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -20000, 20000);
    const controls = new OrbitControls(persp, renderer.domElement);
    controls.enableDamping = true;
    let raf = 0;
    const render = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { if (controls.update()) render(); renderer.render(scene, controls.object as THREE.Camera); });
    };
    controls.addEventListener('change', render);
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`; renderer.domElement.style.height = `${h}px`;
      persp.aspect = w / h; persp.updateProjectionMatrix();
      const half = (ortho.userData.halfH as number | undefined) ?? 500;
      ortho.left = -half * (w / h); ortho.right = half * (w / h); ortho.top = half; ortho.bottom = -half; ortho.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    three.current = { renderer, scene, persp, ortho, controls, world, render, quakeMesh: null, volcMesh: null, quakeIds: [], volcIds: [] };
    resize();
    return () => {
      ro.disconnect(); cancelAnimationFrame(raf); controls.dispose();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => { (x as THREE.SpriteMaterial).map?.dispose(); x.dispose(); });
      });
      renderer.dispose(); renderer.domElement.remove(); three.current = null;
    };
  }, []);

  const inWindow = useMemo(() => quakes.filter(q => q.x >= x0 && q.x <= x1), [quakes, x0, x1]);
  const volcsIn = useMemo(() => volcanoes.filter(v => v.x >= x0 && v.x <= x1), [volcanoes, x0, x1]);

  // The scene contents: rebuilt when the window, data, relief or selection change.
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    const { world } = t;
    world.children.slice().forEach(o => {
      world.remove(o);
      o.traverse(c => {
        const m = c as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => { (x as THREE.SpriteMaterial).map?.dispose(); x.dispose(); });
      });
    });
    const W = x1 - x0, zA = GRID_Y0_KM, zB = GRID_Y1_KM;
    const scale = W / 1600; // marker sizes follow the window's width
    const ls = scale * 1.6; // label size

    // The subsurface volume: edges, depth grid every 100 km on the back and end walls, labels.
    const lines: number[] = [];
    const box = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => lines.push(ax, ay, az, bx, by, bz);
    for (const y of [0, -DEPTH_KM]) { box(-W / 2, y, zA, W / 2, y, zA); box(-W / 2, y, zB, W / 2, y, zB); box(-W / 2, y, zA, -W / 2, y, zB); box(W / 2, y, zA, W / 2, y, zB); }
    for (const x of [-W / 2, W / 2]) for (const z of [zA, zB]) box(x, 0, z, x, -DEPTH_KM, z);
    const grid: number[] = [];
    for (let d = 100; d < DEPTH_KM; d += 100) {
      grid.push(-W / 2, -d, zA, W / 2, -d, zA); // back wall
      grid.push(-W / 2, -d, zA, -W / 2, -d, zB); // end wall
    }
    const lg = (pts: number[], colour: number, opacity: number) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity }));
    };
    world.add(lg(lines, 0xbecde6, 0.35), lg(grid, 0xbecde6, 0.14));
    for (let d = 100; d <= DEPTH_KM; d += 200) { const s = label(`${nf.format(d)} ${labels.km}`, 28 * ls); s.position.set(-W / 2 - 40 * scale, -d, zA); s.userData.depthLabel = true; world.add(s); }
    const dl = label(labels.depth, 30 * ls); dl.position.set(-W / 2 - 40 * scale, -DEPTH_KM - 60 * scale, zA); dl.userData.depthLabel = true; world.add(dl);
    // Depth labels are hidden from above, where they would all fall on one spot.
    world.children.forEach(o => { if (o.userData.depthLabel) o.visible = camRef.current !== 'top'; });
    const lp = label(labels.pacific, 32 * ls, 'rgba(120,190,240,0.95)'); lp.position.set(0, 60 * scale, zB + 30 * scale); world.add(lp);
    const lb = label(labels.behind, 32 * ls, 'rgba(230,190,150,0.95)'); lb.position.set(0, 60 * scale, zA - 30 * scale); world.add(lb);
    for (const r of labels.regions) {
      const a = Math.max(r.x0, x0), b = Math.min(r.x1, x1);
      if (b - a < W * 0.08) continue;
      const s = label(r.name, 34 * ls); s.position.set((a + b) / 2 - centre, 140 * scale, 0); world.add(s);
    }
    // The route line at sea level.
    world.add(lg([-W / 2, 0.5, 0, W / 2, 0.5, 0], 0xffaa6e, 0.7));

    // Terrain mesh (10 km cells), heights × relief, coloured by height; partly see-through so earthquakes below show.
    if (showTerrain && terrain?.d) {
      const d = terrain.d, nz = d.rows[0]?.length ?? 0;
      const rows = d.rows.map((r, i) => ({ x: (d.x0bin + i) * d.stepKm + d.stepKm / 2, r })).filter(o => o.x >= x0 - d.stepKm && o.x <= x1 + d.stepKm);
      if (rows.length > 1 && nz > 1) {
        const pos = new Float32Array(rows.length * nz * 3), col = new Float32Array(rows.length * nz * 3), c = new THREE.Color();
        rows.forEach((o, i) => o.r.forEach((m, j) => {
          const k = (i * nz + j) * 3, h = m ?? 0;
          pos[k] = o.x - centre; pos[k + 1] = (h / 1000) * relief; pos[k + 2] = d.y0Km + j * d.stepKm + d.stepKm / 2;
          terrainColour(h, c); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
        }));
        const idx: number[] = [];
        for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < nz - 1; j++) {
          const a = i * nz + j, b = a + nz;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
        g.setIndex(idx); g.computeVertexNormals();
        world.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.62, depthWrite: false })));
      }
    }

    // Earthquakes: one instanced sphere mesh; colour by depth class, faded towards the background with age.
    t.quakeMesh = null; t.quakeIds = [];
    if (inWindow.length) {
      const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.5, emissiveIntensity: 0.35 }), inWindow.length);
      const o = new THREE.Object3D(), c = new THREE.Color(), bg = new THREE.Color(BG);
      inWindow.forEach((q, i) => {
        const r = markerRadius(q.mag) * 4 * scale * (q.id === selected ? 1.7 : 1);
        o.position.set(q.x - centre, -q.depth, q.y); o.scale.setScalar(r); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        c.set(q.id === selected ? '#FFFFFF' : depthColour(q.depth)).lerp(bg, 1 - markerOpacity(now - q.time, period));
        m.setColorAt(i, c);
      });
      world.add(m); t.quakeMesh = m; t.quakeIds = inWindow.map(q => q.id);
    }
    // Volcanoes: instanced cones at the catalogued summit (× relief), coloured by this week's status.
    t.volcMesh = null; t.volcIds = [];
    if (volcsIn.length) {
      const h = 34 * scale;
      const geo = new THREE.ConeGeometry(h * 0.45, h, 10); geo.translate(0, h / 2, 0);
      const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), volcsIn.length);
      const o = new THREE.Object3D(), c = new THREE.Color();
      const colours: Record<string, string> = { catalogued: '#E9EDF5', other: '#E9EDF5', new_unrest: '#FFC233', new_eruptive: '#FF8A2A', continuing: '#FF4040', unknown: '#7D879B' };
      volcsIn.forEach((v, i) => {
        o.position.set(v.x - centre, showTerrain ? ((v.elevation ?? 0) / 1000) * relief : 0, v.y);
        o.scale.setScalar(v.n === selectedV ? 1.5 : v.status === 'catalogued' || v.status === 'unknown' ? 0.7 : 1); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, c.set(v.n === selectedV ? '#FFFFFF' : colours[v.status]));
      });
      world.add(m); t.volcMesh = m; t.volcIds = volcsIn.map(v => v.n);
    }
    t.render();
  }, [terrain, showTerrain, relief, inWindow, volcsIn, selected, selectedV, centre, x0, x1, period, now, labels, nf]);

  // Camera: set when the mode or window changes (the person can then rotate, pan and zoom freely).
  useEffect(() => {
    const t = three.current;
    if (!t) return;
    const W = x1 - x0, el = host.current!;
    const aspect = el.clientWidth / Math.max(1, el.clientHeight);
    const midZ = (GRID_Y0_KM + GRID_Y1_KM) / 2, midY = -DEPTH_KM / 2 + 60;
    if (camera === 'oblique') {
      t.controls.object = t.persp;
      t.persp.position.set(-W * 0.15, W * 0.28, GRID_Y1_KM + W * 0.95);
      t.controls.target.set(0, midY, midZ);
      t.controls.enableRotate = true;
    } else {
      t.controls.object = t.ortho;
      const half = camera === 'section' ? Math.max(DEPTH_KM * 0.65, ((GRID_Y1_KM - GRID_Y0_KM) * 0.8) / aspect) : Math.max(W * 0.55 / aspect, (GRID_Y1_KM - GRID_Y0_KM) * 0.6);
      t.ortho.userData.halfH = half;
      t.ortho.left = -half * aspect; t.ortho.right = half * aspect; t.ortho.top = half; t.ortho.bottom = -half; t.ortho.zoom = 1;
      if (camera === 'section') { t.ortho.position.set(-W, midY, midZ); t.ortho.up.set(0, 1, 0); t.controls.target.set(0, midY, midZ); }
      else { t.ortho.position.set(0, 3000, midZ); t.ortho.up.set(0, 0, -1); t.controls.target.set(0, 0, midZ); }
      t.ortho.updateProjectionMatrix();
      t.controls.enableRotate = camera !== 'top';
    }
    camRef.current = camera;
    t.world.children.forEach(o => { if (o.userData.depthLabel) o.visible = camera !== 'top'; });
    t.controls.update();
    t.render();
  }, [camera, x0, x1]);

  // Tap / click: the nearest earthquake or volcano under the pointer.
  useEffect(() => {
    const t = three.current, el = host.current;
    if (!t || !el) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
      down = null;
      const r = el.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), t.controls.object as THREE.Camera);
      const hits = ray.intersectObjects([t.quakeMesh, t.volcMesh].filter(Boolean) as THREE.Object3D[], false);
      const h = hits[0];
      if (!h || h.instanceId === undefined) { onSelect(null); onSelectV(null); return; }
      if (h.object === t.volcMesh) onSelectV(t.volcIds[h.instanceId]); else onSelect(t.quakeIds[h.instanceId]);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    return () => { el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp); };
  }, [onSelect, onSelectV]);

  if (!webgl) return <p className={styles.noWebgl} role="alert">{labels.noWebgl}</p>;
  return (
    <div className={styles.view3d}>
      <div ref={host} className={styles.host3d} />
      {showTerrain && !terrain && <p className={styles.overlay3d}>{labels.loading}</p>}
      {showTerrain && terrain?.failed && <p className={styles.overlay3d} role="alert">{labels.unavailable}</p>}
    </div>
  );
}
