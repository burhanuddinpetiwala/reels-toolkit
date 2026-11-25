// Game-style Reel built entirely in code: a low-poly open-world city in three.js (via @remotion/three),
// a player character with a run cycle, loot pickups, scripted trailer cameras, and an HTML game HUD.
// Original art only: no game logos, fonts or names. Every value is a pure function of the frame.
import React, {useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {Captions} from '../components/Captions';
import {VideoData, wt} from '../components/timeline';
import {N, FONT, BRAND} from '../theme';

const FPS = 30;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type At = [string, string?, number?];
const T = (d: VideoData, a: At) => (a[1] ? wt(d, a[0], a[1], a[2] ?? 0) : d.lines.find((l) => l.k === a[0])!.start);
const mulberry = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const keyed = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i], [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (t - t0) / Math.max(0.001, t1 - t0));
  }
  return keys[keys.length - 1][1];
};
const OUT = (c: string, w = 6) => ({WebkitTextStroke: `${w}px ${c}`, paintOrder: 'stroke fill'} as React.CSSProperties);

// ---------- 3D world ----------
const useWindowTexture = () =>
  useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d')!;
    const r = mulberry(7);
    g.fillStyle = '#1c0f2b'; g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 128; y += 12) for (let x = 4; x < 64; x += 12) {
      const on = r() > 0.45;
      g.fillStyle = on ? (r() > 0.5 ? '#ffd27a' : '#ffb36b') : '#2a1a3d';
      g.fillRect(x, y, 7, 8);
    }
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.magFilter = THREE.NearestFilter;
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);

const City: React.FC = () => {
  const win = useWindowTexture();
  const blds = useMemo(() => {
    const r = mulberry(42);
    const out: {x: number; z: number; w: number; d: number; h: number; c: string}[] = [];
    for (const side of [-1, 1]) {
      let z = 25;
      while (z > -260) {
        const w = 6 + r() * 6, d = 6 + r() * 8, h = 8 + r() * 34;
        out.push({x: side * (9 + w / 2 + r() * 2), z: z - d / 2, w, d, h, c: ['#3a1f55', '#2d1846', '#47245f', '#25153a'][Math.floor(r() * 4)]});
        z -= d + 1 + r() * 3;
      }
    }
    return out;
  }, []);
  const mats = useMemo(() => {
    const m: Record<string, THREE.MeshStandardMaterial> = {};
    for (const b of blds) {
      const key = `${b.c}-${Math.round(b.w)}-${Math.round(b.h)}`;
      if (m[key]) continue;
      const tx = win.clone();
      tx.needsUpdate = true;
      tx.repeat.set(Math.max(1, Math.round(b.w / 3)), Math.max(1, Math.round(b.h / 5)));
      m[key] = new THREE.MeshStandardMaterial({color: b.c, emissiveMap: tx, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.9, roughness: 0.9});
    }
    return m;
  }, [blds, win]);
  return (
    <group>
      {/* road, sidewalks, snow banks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -120]}><planeGeometry args={[14, 320]} /><meshStandardMaterial color="#4a4058" roughness={0.9} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 8.5, 0.05, -120]}><planeGeometry args={[3, 320]} /><meshStandardMaterial color="#d9dcef" roughness={1} /></mesh>
      ))}
      {[...Array(40)].map((_, i) => (
        <mesh key={i} position={[0, 0.02, 20 - i * 8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.35, 3.2]} /><meshBasicMaterial color="#ffd27a" /></mesh>
      ))}
      {blds.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} material={mats[`${b.c}-${Math.round(b.w)}-${Math.round(b.h)}`]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
      {/* roof snow caps */}
      {blds.map((b, i) => (
        <mesh key={`s${i}`} position={[b.x, b.h + 0.15, b.z]}><boxGeometry args={[b.w + 0.2, 0.3, b.d + 0.2]} /><meshStandardMaterial color="#eef1ff" /></mesh>
      ))}
      {/* street lamps with glowing bulbs */}
      {[...Array(18)].map((_, i) =>
        [-1, 1].map((s) => (
          <group key={`${i}${s}`} position={[s * 7.4, 0, 14 - i * 16]}>
            <mesh position={[0, 2.6, 0]}><cylinderGeometry args={[0.08, 0.1, 5.2, 6]} /><meshStandardMaterial color="#1a1220" /></mesh>
            <mesh position={[-s * 0.6, 5.2, 0]}><boxGeometry args={[1.3, 0.12, 0.12]} /><meshStandardMaterial color="#1a1220" /></mesh>
            <mesh position={[-s * 1.1, 5.05, 0]}><sphereGeometry args={[0.28, 10, 8]} /><meshBasicMaterial color="#ffe1a0" /></mesh>
          </group>
        )),
      )}
      {/* sun disc on the horizon */}
      <mesh position={[0, 26, -300]}><circleGeometry args={[34, 40]} /><meshBasicMaterial color="#ffb36b" fog={false} /></mesh>
    </group>
  );
};

const Snow: React.FC<{t: number; cz: number}> = ({t, cz}) => {
  const base = useMemo(() => {
    const r = mulberry(9);
    return [...Array(900)].map(() => [r() * 40 - 20, r() * 24, r() * 60 - 50, 0.6 + r() * 0.8]);
  }, []);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  const pos = new Float32Array(base.length * 3);
  base.forEach(([x, y, z, v], i) => {
    pos[i * 3] = x + Math.sin(t * 0.8 + i) * 0.4;
    pos[i * 3 + 1] = (((y - t * 2.2 * v) % 24) + 24) % 24;
    pos[i * 3 + 2] = cz + z;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.12} transparent opacity={0.85} />
    </points>
  );
};

/** Blocky player: hoodie, jeans, sneakers. `run` 0..1 blends idle → run; `cheer` raises both arms. */
const Player: React.FC<{x: number; z: number; t: number; run: number; cheer: number; yaw?: number}> = ({x, z, t, run, cheer, yaw = 0}) => {
  const ph = t * 11;
  const swing = Math.sin(ph) * 0.9 * run;
  const bob = Math.abs(Math.sin(ph)) * 0.12 * run;
  const armL = lerp(-swing, -2.8, cheer), armR = lerp(swing, -2.8, cheer);
  const hoodie = '#e2405b', jeans = '#2f4b8a', skin = '#c98e6b';
  return (
    <group position={[x, bob, z]} rotation={[0, yaw, 0]}>
      <group rotation={[-0.12 * run, 0, 0]}>
        <mesh position={[0, 1.55, 0]}><boxGeometry args={[0.8, 0.95, 0.45]} /><meshStandardMaterial color={hoodie} /></mesh>
        <mesh position={[0, 2.3, 0]}><boxGeometry args={[0.55, 0.55, 0.55]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, 2.55, 0.05]}><boxGeometry args={[0.6, 0.22, 0.62]} /><meshStandardMaterial color="#1b1b24" /></mesh>
        <mesh position={[0, 1.4, -0.26]}><boxGeometry args={[0.5, 0.25, 0.08]} /><meshStandardMaterial color="#b8304a" /></mesh>
        <mesh position={[-0.12, 2.35, -0.28]}><boxGeometry args={[0.08, 0.1, 0.04]} /><meshBasicMaterial color="#111" /></mesh>
        <mesh position={[0.12, 2.35, -0.28]}><boxGeometry args={[0.08, 0.1, 0.04]} /><meshBasicMaterial color="#111" /></mesh>
        <mesh position={[0, 2.18, -0.28]}><boxGeometry args={[0.22, 0.05, 0.04]} /><meshBasicMaterial color="#7a2b2b" /></mesh>
        {[[-0.52, armL], [0.52, armR]].map(([ax, rot], i) => (
          <group key={i} position={[ax as number, 1.95, 0]} rotation={[rot as number, 0, (i ? -1 : 1) * 0.08 * (1 - cheer) + (i ? -0.25 : 0.25) * cheer]}>
            <mesh position={[0, -0.42, 0]}><boxGeometry args={[0.24, 0.85, 0.26]} /><meshStandardMaterial color={hoodie} /></mesh>
            <mesh position={[0, -0.9, 0]}><boxGeometry args={[0.2, 0.18, 0.2]} /><meshStandardMaterial color={skin} /></mesh>
          </group>
        ))}
      </group>
      {[[-0.2, -swing], [0.2, swing]].map(([lx, rot], i) => (
        <group key={i} position={[lx as number, 1.05, 0]} rotation={[rot as number, 0, 0]}>
          <mesh position={[0, -0.48, 0]}><boxGeometry args={[0.3, 0.95, 0.32]} /><meshStandardMaterial color={jeans} /></mesh>
          <mesh position={[0, -0.98, 0.08]}><boxGeometry args={[0.32, 0.18, 0.48]} /><meshStandardMaterial color="#f4f4f4" /></mesh>
        </group>
      ))}
      {/* contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -bob + 0.03, 0]}><circleGeometry args={[0.6, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.35} /></mesh>
    </group>
  );
};

/** Loot: a wrapped gift box in a light beam. Bursts open at `hit`. */
const Loot: React.FC<{z: number; t: number; hit: number; color: string}> = ({z, t, hit, color}) => {
  const k = t < hit ? 0 : Math.min(1, (t - hit) / 0.35);
  const s = t < hit ? 1 + Math.sin(t * 4) * 0.05 : 1 - k;
  const burst = t >= hit && t < hit + 0.8 ? (t - hit) / 0.8 : -1;
  return (
    <group position={[0, 0, z]}>
      {s > 0.01 && (
        <group position={[0, 0.9 + Math.sin(t * 3) * 0.15, 0]} rotation={[0, t * 1.6, 0]} scale={s}>
          <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} /></mesh>
          <mesh><boxGeometry args={[1.04, 1.04, 0.18]} /><meshStandardMaterial color="#ffd54a" emissive="#ffb300" emissiveIntensity={0.5} /></mesh>
          <mesh><boxGeometry args={[0.18, 1.04, 1.04]} /><meshStandardMaterial color="#ffd54a" emissive="#ffb300" emissiveIntensity={0.5} /></mesh>
        </group>
      )}
      <mesh position={[0, 6, 0]}><cylinderGeometry args={[0.7, 0.9, 12, 16, 1, true]} /><meshBasicMaterial color="#fff27a" transparent opacity={0.22 * (1 - k)} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><ringGeometry args={[0.9, 1.25, 32]} /><meshBasicMaterial color="#fff27a" transparent opacity={0.8 * (1 - k)} /></mesh>
      {burst >= 0 &&
        [...Array(24)].map((_, i) => {
          const a = (i / 24) * Math.PI * 2, r = 0.5 + burst * 4;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 1 + Math.sin(i * 1.7) * burst * 2 + burst * 2, Math.sin(a) * r]}>
              <boxGeometry args={[0.18, 0.18, 0.18]} />
              <meshBasicMaterial color={i % 2 ? '#ffd54a' : '#7cf27c'} transparent opacity={1 - burst} />
            </mesh>
          );
        })}
    </group>
  );
};

const Fireworks: React.FC<{t: number; t0: number; z: number}> = ({t, t0, z}) => {
  if (t < t0) return null;
  return (
    <group>
      {[0, 0.5, 1.0, 1.4].map((d, j) => {
        const k = t - t0 - d;
        if (k < 0 || k > 1.4) return null;
        const c = ['#ffd54a', '#7cf27c', '#ff5d8f', '#6ec8ff'][j];
        const cx = [-6, 5, -2, 7][j], cy = 16 + j * 2;
        return [...Array(28)].map((_, i) => {
          const a = (i / 28) * Math.PI * 2, r = k * 6;
          return (
            <mesh key={`${j}-${i}`} position={[cx + Math.cos(a) * r, cy + Math.sin(a) * r - k * k * 2, z - 18]}>
              <sphereGeometry args={[0.18, 6, 6]} />
              <meshBasicMaterial color={c} transparent opacity={Math.max(0, 1 - k / 1.4)} />
            </mesh>
          );
        });
      })}
    </group>
  );
};

/** Camera rig: drives the default R3F camera from the frame clock (no useFrame). */
const Rig: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const cam = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.lookAt(...look);
  cam.fov = fov;
  cam.near = 0.1;
  cam.far = 600;
  cam.updateProjectionMatrix();
  return null;
};

// ---------- HUD ----------
const Radar: React.FC<{t: number; heading: number; targets: number[]}> = ({t, targets}) => (
  <div style={{position: 'absolute', left: 70, top: 1470, width: 230, height: 230, borderRadius: 999, background: 'rgba(16,32,24,0.82)', border: '6px solid #0b0b0b', overflow: 'hidden', zIndex: 60}}>
    <svg width={230} height={230}>
      <rect x={100} y={0} width={30} height={230} fill="#4b5a52" />
      {[...Array(8)].map((_, i) => <rect key={i} x={i % 2 ? 140 : 40} y={((i * 40 - t * 30) % 320) - 40} width={50} height={30} fill="#33453b" />)}
      {targets.map((dz, i) => (dz > -1 && dz < 12 ? <circle key={i} cx={115} cy={115 - dz * 9} r={9} fill="#ffd54a" stroke="#000" strokeWidth={2} /> : null))}
      <polygon points="115,100 127,128 115,120 103,128" fill="#fff" stroke="#000" strokeWidth={2} />
    </svg>
  </div>
);
const Bars: React.FC<{hp: number}> = ({hp}) => (
  <div style={{position: 'absolute', left: 70, top: 1710, width: 230, zIndex: 60}}>
    <div style={{height: 14, background: '#0b0b0b', padding: 2}}><div style={{height: '100%', width: `${hp * 100}%`, background: '#58c94f'}} /></div>
    <div style={{height: 10, background: '#0b0b0b', padding: 2, marginTop: 4}}><div style={{height: '100%', width: '82%', background: '#4fa3e0'}} /></div>
  </div>
);
const Money: React.FC<{value: number; stars: number; t: number}> = ({value, stars, t}) => (
  <div style={{position: 'absolute', right: 150, top: 280, textAlign: 'right', zIndex: 60}}>
    <div style={{fontFamily: 'Bebas Neue', fontSize: 96, color: '#7CF27C', letterSpacing: 2, ...OUT('#06200a', 9)}}>LOOT {value}/3</div>
    <div style={{display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width={50} height={50} viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.6 4.3L18.5 21 12 16.7 5.5 21l2.1-7.7L2 9h7z" fill={i < stars ? (i === stars - 1 && Math.floor(t * 6) % 2 ? '#fff' : '#f7e463') : 'rgba(0,0,0,0.35)'} stroke="#111" strokeWidth={1.6} /></svg>
      ))}
    </div>
  </div>
);

// ---------- the Reel ----------
export const GameReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const end = d.endCardStart;
  const items = spec.items as {line: string; label: string; problem: string; name: string; benefit: string; src: string; save: number; color: string; pick: At}[];
  const objT = T(d, ['obj']);
  const passT = T(d, ['pass']);
  const picks = items.map((it) => T(d, it.pick));
  const lootZ = [-40, -78, -116];
  // player travel: stands during the hook, runs to each loot exactly when the voice names it, stops at the end
  const pz = keyed(t, [[0, 0], [objT, 0], [picks[0], lootZ[0]], [picks[1], lootZ[1]], [picks[2], lootZ[2]], [passT, lootZ[2] - 10], [passT + 0.6, lootZ[2] - 11]]);
  const run = t < objT ? smooth(Math.min(1, Math.max(0, (t - objT + 0.4) / 0.4))) : t > passT ? Math.max(0, 1 - (t - passT) / 0.4) : 1;
  const cheer = t > passT ? smooth(Math.min(1, (t - passT) / 0.35)) : 0;

  // shot list: [start, camera]
  const shots: {from: number; cam: (k: number) => {pos: [number, number, number]; look: [number, number, number]; fov: number}}[] = [
    {from: 0, cam: (k) => { const e = smooth(k); return {pos: [lerp(0, 0, e), lerp(38, 3.4, e), lerp(26, pz + 7.5, e)], look: [0, lerp(0, 1.6, e), lerp(-30, pz - 6, e)], fov: 55}; }},
    {from: objT, cam: () => ({pos: [Math.sin(t * 1.3) * 0.4, 2.9, pz + 5.6], look: [0, 1.5, pz - 8], fov: 58})},
    {from: T(d, [items[0].line]), cam: (k) => ({pos: [2.6 - k, 2.3, pz - 6.5], look: [0, 1.4, pz], fov: t > picks[0] && t < picks[0] + 0.25 ? 40 : 52})},
    {from: T(d, [items[1].line]), cam: (k) => ({pos: [-3.2 + k * 1.5, 3.4, pz + 6], look: [0, 1.2, pz - 7], fov: t > picks[1] && t < picks[1] + 0.25 ? 40 : 54})},
    {from: T(d, [items[2].line]), cam: (k) => { const a = -0.9 + k * 1.6; return {pos: [Math.sin(a) * 7, 2.4, pz + Math.cos(a) * 7], look: [0, 1.4, pz - 1], fov: 48}; }},
    {from: passT, cam: (k) => { const a = 2.6 + k * 1.4; return {pos: [Math.sin(a) * 6.5, 2.2 + k * 0.6, pz + Math.cos(a) * 6.5], look: [0, 2, pz], fov: 52}; }},
  ];
  const si = shots.reduce((acc, s, i) => (t >= s.from ? i : acc), 0);
  const nextFrom = si + 1 < shots.length ? shots[si + 1].from : end;
  const cam = shots[si].cam(Math.min(1, Math.max(0, (t - shots[si].from) / Math.max(0.1, nextFrom - shots[si].from))));
  // impact shake on each pickup
  const lastPick = picks.filter((p) => t >= p).pop();
  const dk = lastPick !== undefined ? (t - lastPick) * fps : 99;
  const shake = dk < 10 ? 0.25 * Math.exp(-dk / 2) : 0;
  const pos: [number, number, number] = [cam.pos[0] + Math.sin(frame * 2.9) * shake, cam.pos[1] + Math.cos(frame * 3.7) * shake, cam.pos[2]];

  // HUD state
  const got = picks.filter((p) => t >= p).length;
  const money = got;
  const stars = t >= objT ? 1 + got : 0;
  const flash = dk < 4 ? 0.5 * (1 - dk / 4) : 0;
  const titleIn = spring({frame, fps, config: {damping: 12, stiffness: 160}});
  const sp = (at: number) => (t < at ? 0 : spring({frame: frame - Math.round(at * fps), fps, config: {damping: 11, stiffness: 200, mass: 0.7}}));

  return (
    <AbsoluteFill style={{background: '#1a0d2b'}}>
      {t < end && (
        <ThreeCanvas width={width} height={height} linear flat={false}>
          <color attach="background" args={['#6a3a8c']} />
          <fog attach="fog" args={['#8a4f8f', 30, 190]} />
          <hemisphereLight args={['#ffc6d6', '#5a4680', 1.5]} />
          <directionalLight position={[-20, 30, -60]} intensity={1.4} color="#ffc38a" />
          <ambientLight intensity={0.5} />
          <Rig pos={pos} look={cam.look} fov={cam.fov} />
          <City />
          <Snow t={t} cz={pz} />
          {items.map((it, i) => <Loot key={i} z={lootZ[i]} t={t} hit={picks[i]} color={it.color} />)}
          <Player x={0} z={pz} t={t} run={run} cheer={cheer} yaw={t > passT ? Math.PI * smooth(Math.min(1, (t - passT) / 0.5)) : 0} />
          <Fireworks t={t} t0={passT + 0.2} z={pz} />
        </ThreeCanvas>
      )}
      {/* sky glow + grade */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,140,90,0.18), transparent 35%, transparent 70%, rgba(20,8,35,0.55))', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />
      {t < end && (
        <>
          <Money value={money} stars={stars} t={t} />
          {t >= objT && <Radar t={t} heading={0} targets={lootZ.map((z, i) => (t < picks[i] ? (pz - z) / 6 : -9))} />}
          {t >= objT && <Bars hp={0.9} />}
        </>
      )}
      {/* mission title */}
      {t < objT && (
        <>
          <AbsoluteFill style={{background: `linear-gradient(transparent 30%, rgba(0,0,0,${0.35 * titleIn}) 50%, transparent 70%)`}} />
          <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 46, letterSpacing: 10, color: '#fff', ...OUT('#000', 6), opacity: 1}}>NEW MISSION UNLOCKED</div>
          <div style={{position: 'absolute', top: 720, width: '100%', textAlign: 'center', fontFamily: 'Bowlby One', fontStyle: 'italic', fontSize: 150, lineHeight: 0.95, color: '#fbe7a1', ...OUT('#000', 14), transform: `scale(${2.2 - 1.2 * sp(T(d, ['hook', 'cyber']))}) rotate(-3deg)`, opacity: Math.min(1, sp(T(d, ['hook', 'cyber'])) * 3)}}>THE CYBER<br />WEEK HEIST</div>
        </>
      )}
      {/* objective */}
      {t >= objT && t < T(d, [items[0].line]) && (
        <div style={{position: 'absolute', left: 90, top: 470, width: 900, background: 'rgba(0,0,0,0.78)', borderRadius: 8, padding: '24px 32px', fontFamily: FONT.body, fontWeight: 700, fontSize: 54, color: '#fff', lineHeight: 1.2, zIndex: 58, transform: `translateY(${(1 - sp(objT)) * -200}px)`}}>
          Objective: fix <span style={{color: '#f7e463'}}>holiday chaos</span> before the deals are <span style={{color: '#ff6b6b'}}>gone</span>.
        </div>
      )}
      {/* per item: problem alert, then ITEM ACQUIRED card */}
      {items.map((it, i) => {
        const a = T(d, [it.line]);
        const b = i + 1 < items.length ? T(d, [items[i + 1].line]) : passT;
        if (t < a || t >= b) return null;
        const p = picks[i];
        const sAt = T(d, [it.line, '$']);
        const cardK = sp(p);
        return (
          <React.Fragment key={i}>
            {t < p + 0.2 && (
              <div style={{position: 'absolute', left: 540, top: 820, transform: `translateX(-50%) scale(${2 - sp(a)}) rotate(-2deg)`, opacity: Math.min(1, sp(a) * 3), zIndex: 62, background: '#c62828', color: '#fff', fontFamily: 'Bebas Neue', fontSize: 92, letterSpacing: 3, padding: '6px 34px 2px', border: '7px solid #000', whiteSpace: 'nowrap'}}>
                ⚠ {it.problem.toUpperCase()}
              </div>
            )}
            {t >= p && (
              <div style={{position: 'absolute', left: 80, top: 430, width: 920, zIndex: 63, transform: `translateX(${(1 - cardK) * -1100}px) rotate(-1.5deg)`, background: 'rgba(8,8,12,0.88)', border: '6px solid #f7e463', borderRadius: 10, padding: '20px 28px 26px', boxShadow: '12px 12px 0 rgba(0,0,0,0.5)'}}>
                <div style={{fontFamily: 'Bebas Neue', fontSize: 50, letterSpacing: 6, color: '#f7e463'}}>ITEM ACQUIRED</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
                  <div style={{width: 300, height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center', background: it.color, border: '5px solid #000', transform: `scale(${0.6 + 0.4 * sp(p + 0.08)}) rotate(${(1 - sp(p + 0.08)) * -20}deg)`}}>
                    <Img src={staticFile(it.src)} style={{maxHeight: 300, maxWidth: 280, objectFit: 'contain', filter: 'drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)'}} />
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontFamily: 'Bebas Neue', fontSize: 72, lineHeight: 0.95, color: '#fff', overflowWrap: 'anywhere'}}>{it.name.toUpperCase()}</div>
                    <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: '#d7d7e0', marginTop: 8, lineHeight: 1.2}}>{it.benefit}</div>
                    {t >= sAt && <div style={{marginTop: 14, display: 'inline-block', background: '#7CF27C', color: '#06200a', fontFamily: FONT.display, fontSize: 44, padding: '6px 18px', border: '5px solid #000', whiteSpace: 'nowrap', transform: `scale(${2 - sp(sAt)})`}}>SAVE UP TO ${it.save}</div>}
                  </div>
                </div>
              </div>
            )}
            {dk < 18 && lastPick === p && (
              <div style={{position: 'absolute', right: 150, top: 400, zIndex: 64, fontFamily: 'Bebas Neue', fontSize: 110, color: '#7CF27C', ...OUT('#06200a', 9), transform: `translateY(${-dk * 4}px)`, opacity: 1 - dk / 18}}>+1 LOOT</div>
            )}
          </React.Fragment>
        );
      })}
      {/* mission passed */}
      {t >= passT && t < end && (
        <>
          <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center', fontFamily: 'Bowlby One', fontSize: 112, color: '#fff', ...OUT('#000', 12), transform: `scale(${2 - sp(passT)})`, zIndex: 65}}>UP TO 50% OFF</div>
          {t >= T(d, ['pass', 'mission']) && <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: 'Bowlby One', fontStyle: 'italic', fontSize: 150, lineHeight: 0.95, color: '#f7c948', ...OUT('#000', 14), transform: `scale(${2.4 - 1.4 * sp(T(d, ['pass', 'mission']))})`, zIndex: 65}}>MISSION<br />PASSED</div>}
        </>
      )}
      {/* end card: pause-menu style */}
      {t >= end && (
        <AbsoluteFill style={{background: 'linear-gradient(160deg, #2b1055, #120720)'}}>
          <div style={{position: 'absolute', top: 290, width: '100%', textAlign: 'center'}}><Img src={staticFile(BRAND.logoWhite as string)} style={{height: 110, transform: `scale(${sp(end)})`}} /></div>
          <div style={{position: 'absolute', top: 450, left: 120, width: 840, fontFamily: 'Bebas Neue', fontSize: 64, letterSpacing: 6, color: '#f7e463'}}>MISSION REWARDS</div>
          {items.map((it, i) => (
            <div key={i} style={{position: 'absolute', top: 540 + i * 150, left: 120, width: 840, height: 130, display: 'flex', alignItems: 'center', gap: 24, background: 'rgba(255,255,255,0.08)', border: '4px solid rgba(255,255,255,0.25)', transform: `translateX(${(1 - sp(end + 0.1 + i * 0.12)) * 900}px)`}}>
              <div style={{width: 120, height: 120, background: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Img src={staticFile(it.src)} style={{maxHeight: 110, maxWidth: 110, objectFit: 'contain'}} /></div>
              <div style={{flex: 1, fontFamily: 'Bebas Neue', fontSize: 62, color: '#fff'}}>{it.label.toUpperCase()}</div>
              <div style={{fontFamily: 'Bebas Neue', fontSize: 62, color: '#7CF27C', paddingRight: 24}}>UP TO ${it.save}</div>
            </div>
          ))}
          <div style={{position: 'absolute', top: 1030, width: '100%', textAlign: 'center', fontFamily: 'Bowlby One', fontSize: 84, color: '#fff', ...OUT('#000', 8), opacity: sp(end + 0.4)}}>UP TO 50% OFF</div>
          <div style={{position: 'absolute', top: 1140, left: 540, transform: `translateX(-50%) scale(${sp(end + 0.55) * (1 - 0.06 * Math.max(0, Math.sin((t - end - 1) * 7)))})`, background: '#7CF27C', color: '#06200a', fontFamily: FONT.display, fontSize: 56, padding: '18px 48px', border: '6px solid #000', whiteSpace: 'nowrap'}}>▶ CONTINUE TO {BRAND.domain.toUpperCase()}</div>
        </AbsoluteFill>
      )}
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 52, weight: 800, color: '#ffffff', active: '#f7e463', bg: null, y: 1236, shadow: '0 0 6px #000, 0 0 2px #000, 3px 3px 0 #000'}} />
    </AbsoluteFill>
  );
};
