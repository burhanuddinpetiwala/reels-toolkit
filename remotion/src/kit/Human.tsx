// A real rigged human (Quaternius Universal Base Character, CC0) driven frame-by-frame for Remotion.
// Animations come from Quaternius Universal Animation Library (CC0). See public/models/quaternius/LICENSE-quaternius.txt.
// Clothes are painted in code: each vertex gets a colour from the bones that move it (legs = jeans,
// feet = sneakers, torso and arms = hoodie), blended over the skin texture so hands and face stay skin.
import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Loaded = {scene: THREE.Group; clips: THREE.AnimationClip[]};
let cache: Promise<Loaded> | null = null;
const load = () => {
  if (!cache) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const get = (f: string) => new Promise<any>((res, rej) => loader.load(staticFile(`models/quaternius/${f}`), res, undefined, rej));
    cache = Promise.all([get('character.glb'), get('animations.glb')]).then(([c, a]) => ({scene: c.scene, clips: a.animations}));
  }
  return cache;
};

export type Outfit = {top: string; bottom: string; shoes: string};
const region = (name: string): 'top' | 'bottom' | 'shoes' | 'skin' => {
  const n = name.toLowerCase();
  if (/^(foot|ball)/.test(n)) return 'shoes';
  if (/^(thigh|calf|pelvis|root)/.test(n)) return 'bottom';
  if (/^(spine|clavicle|upperarm|lowerarm)/.test(n)) return 'top';
  return 'skin';
};

const dress = (scene: THREE.Group, outfit: Outfit) => {
  const cols = {top: new THREE.Color(outfit.top), bottom: new THREE.Color(outfit.bottom), shoes: new THREE.Color(outfit.shoes)};
  scene.traverse((o: any) => {
    if (!o.isSkinnedMesh) return;
    o.frustumCulled = false;
    const mat = o.material as THREE.MeshStandardMaterial;
    if (!/superhero/i.test(mat.name || '')) return; // only the body mesh; hair, brows and eyes keep their own look
    const g = o.geometry as THREE.BufferGeometry;
    const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
    const bones = o.skeleton.bones as THREE.Bone[];
    const out = new Float32Array(si.count * 4);
    for (let v = 0; v < si.count; v++) {
      const acc: Record<string, number> = {top: 0, bottom: 0, shoes: 0, skin: 0};
      for (let k = 0; k < 4; k++) {
        const w = (sw as any).getComponent(v, k);
        if (w > 0) acc[region(bones[(si as any).getComponent(v, k)]?.name || '')] += w;
      }
      // the region with most weight wins outright: crisp hem lines, no colour gradient between garments
      const best = (['top', 'bottom', 'shoes'] as const).reduce((a, b) => (acc[b] > acc[a] ? b : a), 'top' as 'top' | 'bottom' | 'shoes');
      const clothed = acc.top + acc.bottom + acc.shoes;
      const c = cols[best];
      out.set(clothed > acc.skin ? [c.r, c.g, c.b, 1] : [0, 0, 0, 0], v * 4);
    }
    g.setAttribute('cloth', new THREE.BufferAttribute(out, 4));
    const nm = mat.clone();
    nm.roughness = 0.75;
    nm.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 cloth;\nvarying vec4 vCloth;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCloth = cloth;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vCloth;').replace('#include <map_fragment>', '#include <map_fragment>\nfloat cm = smoothstep(0.4, 0.6, vCloth.a);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vCloth.rgb, cm);');
    };
    nm.customProgramCacheKey = () => 'cloth';
    o.material = nm;
  });
};

/** state: what the body is doing at time t. Weights are crossfaded by the caller. */
/** Load the model in the normal React tree (outside the 3D canvas) so Remotion waits for it. */
export const useHumanAssets = () => {
  const [data, setData] = useState<Loaded | null>(null);
  const [handle] = useState(() => delayRender('Loading human model'));
  useEffect(() => {
    load().then((d) => { setData(d); setTimeout(() => continueRender(handle), 1500); }).catch((e) => { (window as any).__hdbg = 'ERR ' + String(e); continueRender(handle); });
  }, [handle]);
  return data;
};

/** state: what the body is doing at time t. */
export const Human: React.FC<{data: Loaded | null; x: number; z: number; t: number; run: number; jumpAt?: number; yaw?: number; height?: number; outfit: Outfit}> = ({data, x, z, t, run, jumpAt, yaw = 0, height = 2.5, outfit}) => {
  const rig = useMemo(() => {
    if (!data) return null;
    const scene = data.scene;
    dress(scene, outfit);
    const box = new THREE.Box3().setFromObject(scene);
    const s = height / Math.max(0.01, box.max.y - box.min.y);
    const mixer = new THREE.AnimationMixer(scene);
    const clip = (n: string) => data.clips.find((c) => c.name === n)!;
    const act = (n: string) => { const a = mixer.clipAction(clip(n)); a.play(); a.setEffectiveWeight(0); return a; };
    const root = scene.getObjectByName('root');
    const pelvis = scene.getObjectByName('pelvis');
    return {scene, s, minY: box.min.y, mixer, root, pelvis, idle: act('Idle_Loop'), sprint: act('Sprint_Loop'), jStart: act('Jump_Start'), jLand: act('Jump_Land')};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!rig) return null;
  // jump celebration: Jump_Start (1.33 s) then Jump_Land (1.27 s), then idle
  let js = 0, jl = 0;
  if (jumpAt !== undefined && t >= jumpAt) {
    const k = t - jumpAt;
    const dS = rig.jStart.getClip().duration, dL = rig.jLand.getClip().duration;
    if (k < dS) { js = Math.min(1, k / 0.12); rig.jStart.time = k; }
    else if (k < dS + dL) { jl = 1; rig.jLand.time = k - dS; js = Math.max(0, 1 - (k - dS) / 0.1); rig.jStart.time = dS; }
    else { jl = Math.max(0, 1 - (k - dS - dL) / 0.25); rig.jLand.time = dL; }
  }
  const body = 1 - Math.min(1, js + jl);
  rig.sprint.time = (t * 1.0) % rig.sprint.getClip().duration;
  rig.idle.time = t % rig.idle.getClip().duration;
  rig.sprint.setEffectiveWeight(run * body);
  rig.idle.setEffectiveWeight((1 - run) * body);
  rig.jStart.setEffectiveWeight(js);
  rig.jLand.setEffectiveWeight(jl);
  rig.mixer.update(0);
  if (rig.root) { rig.root.position.x = 0; rig.root.position.z = 0; } // keep it running in place; we move the group
  // pin the hips over the group origin so the body never drifts away from where we place it
  let ox = 0, oz = 0;
  if (rig.pelvis) {
    rig.scene.position.set(0, 0, 0);
    rig.scene.updateMatrixWorld(true);
    const lp = rig.scene.worldToLocal(rig.pelvis.getWorldPosition(new THREE.Vector3()));
    ox = -lp.x * rig.s; oz = -lp.z * rig.s;
  }

  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI + yaw, 0]}>
      <primitive object={rig.scene} scale={rig.s} position={[ox, -rig.minY * rig.s, oz]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><circleGeometry args={[0.55, 20]} /><meshBasicMaterial color="#000" transparent opacity={0.35} /></mesh>
    </group>
  );
};
