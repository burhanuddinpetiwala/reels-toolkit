// Paid-ad cut (Google + Meta): one component, three canvases (9:16, 1:1, 16:9). Fast hook, big %, product savings, Shop now.
import {FONT, BRAND} from '../theme';
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, f} from '../components/core';
import {N} from './kit';
import {SaveBurst} from './v3';

export type AdT = {black: number; yes: number; up: number; fire: number; fireSave: number; sofa: number; sofaSave: number; tree: number; treeSave: number; ends: number; shop: number; voEnd: number};
export type AdProps = {T: AdT; vo: string; music: string; pct: string; endsText: string; phase: string; hero: string; heroPos?: string;
  hook1?: string; hook2?: [string, string]; yes?: string; kicker?: string; offWord?: string; button?: string; items: {src: string; name: string; save: string; h: number}[]};
export const AD_HOLD = 1.5;

const useLay = () => {
  const {width: W, height: H} = useVideoConfig();
  const kind = W > H ? 'land' : W === H ? 'sq' : 'vert';
  return {W, H, kind} as const;
};
const sp = (frame: number, at: number, fps: number, cfg: any = {damping: 12, stiffness: 200}) => spring({frame: frame - f(at), fps, config: cfg});
const Grain: React.FC<{o?: number}> = ({o = 0.25}) => <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: o, mixBlendMode: 'multiply'}} />;

const big = (s: number, color = N.white, stroke = true): React.CSSProperties => ({fontFamily: FONT.display, fontSize: s, lineHeight: 0.95, color, textTransform: 'uppercase', ...(stroke ? {WebkitTextStroke: `${Math.max(3, s / 28)}px #111`, paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(0,0,0,0.35)'} : {})});

/** Small persistent deal chip (top-left) + logo (top-right) after the hook. */
const Chrome: React.FC<{p: AdProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {kind} = useLay();
  const at = p.T.fire;
  if (frame < f(at) || frame >= f(p.T.ends)) return null;
  const s = sp(frame, at, fps);
  const pad = kind === 'vert' ? 60 : 44;
  return (
    <>
      <div style={{position: 'absolute', left: pad, top: kind === 'vert' ? 90 : pad, zIndex: 60, transform: `translateX(${(1 - s) * -400}px)`, background: N.forestDeep, color: N.cream, fontFamily: FONT.display, fontSize: kind === 'vert' ? 44 : 38, padding: '14px 26px 12px', borderRadius: 14, boxShadow: '0 6px 0 rgba(0,0,0,0.25)'}}>
        {(p.kicker ?? 'Up to').toUpperCase()} <span style={{color: N.mustard}}>{p.pct} {(p.offWord ?? 'Off').toUpperCase()}</span>
      </div>
      <Img src={staticFile(BRAND.logo)} style={{position: 'absolute', right: pad, top: kind === 'vert' ? 92 : pad + 4, height: kind === 'vert' ? 70 : 58, zIndex: 60, opacity: s}} />
    </>
  );
};

/** Hook: "WAIT." slam on a lifestyle photo, then the question. */
const Hook: React.FC<{p: AdProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {kind, W, H} = useLay();
  const z = interpolate(frame, [0, f(p.T.yes)], [1.12, 1.0], clamp);
  const s1 = sp(frame, 0.0, fps, {damping: 7, stiffness: 320, mass: 0.6});
  const s2 = sp(frame, p.T.black, fps, {damping: 10, stiffness: 260});
  const shake = frame < 8 ? Math.sin(frame * 2.3) * (8 - frame) * 2 : 0;
  const wSize = kind === 'land' ? 300 : kind === 'sq' ? 250 : 260;
  const qSize = kind === 'land' ? 110 : kind === 'sq' ? 92 : 104;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Img src={staticFile(p.hero)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.heroPos ?? (kind === 'land' ? '50% 50%' : '30% 50%'), transform: `scale(${z})`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.7) 100%)'}} />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 50, gap: kind === 'land' ? 24 : 34}}>
        <div style={{...big(wSize, N.mustard), transform: `scale(${s1 * 1}) translateX(${shake}px) rotate(-4deg)`}}>{p.hook1 ?? 'Wait.'}</div>
        <div style={{opacity: s2, transform: `translateY(${(1 - s2) * 80}px)`}}>
          <div style={big(qSize)}>{(p.hook2 ?? ['Big deals', 'already started?!'])[0]}</div>
          <div style={{...big(qSize * 1.08), marginTop: 10}}>{(p.hook2 ?? ['Big deals', 'already started?!'])[1]}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Offer: YES! then giant UP TO 40% OFF. */
const Offer: React.FC<{p: AdProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {kind} = useLay();
  const sy = sp(frame, p.T.yes, fps, {damping: 8, stiffness: 300});
  const su = sp(frame, p.T.up, fps, {damping: 11, stiffness: 240, mass: 0.8});
  const pulse = 1 + 0.025 * Math.sin((frame / fps) * 8);
  const pctSize = kind === 'land' ? 420 : kind === 'sq' ? 380 : 400;
  const stick = [p.items[0], p.items[1], p.items[2]];
  const pos = kind === 'land'
    ? [{x: 230, y: 760, h: 420, r: -6}, {x: 1690, y: 790, h: 300, r: 5}, {x: 1700, y: 300, h: 380, r: 4}]
    : kind === 'sq'
      ? [{x: 150, y: 900, h: 300, r: -6}, {x: 930, y: 930, h: 220, r: 5}, {x: 950, y: 230, h: 280, r: 4}]
      : [{x: 200, y: 1600, h: 380, r: -6}, {x: 860, y: 1620, h: 280, r: 5}, {x: 880, y: 330, h: 380, r: 4}];
  return (
    <AbsoluteFill style={{background: N.forest, overflow: 'hidden'}}>
      <Grain />
      {stick.map((it, i) => {
        const s = sp(frame, p.T.up + 0.15 + i * 0.12, fps, {damping: 11, stiffness: 180});
        const q = pos[i];
        return <Img key={i} src={staticFile(it.src)} style={{position: 'absolute', left: q.x, top: q.y, height: q.h, maxWidth: q.h * 1.3, objectFit: 'contain', transform: `translate(-50%,-50%) rotate(${q.r}deg) scale(${s})`, filter: 'drop-shadow(0 18px 20px rgba(0,0,0,0.35))'}} />;
      })}
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <div style={{...big(kind === 'land' ? 120 : 110, N.cream, false), transform: `scale(${sy}) rotate(-3deg)`, marginBottom: kind === 'land' ? 18 : 34}}>{p.yes ?? 'Yes!'}</div>
        <div style={{opacity: su, transform: `scale(${(0.6 + 0.4 * su) * pulse})`}}>
          <div style={{...big(kind === 'land' ? 90 : 84, N.cream, false), letterSpacing: 6}}>{p.kicker ?? 'Up to'}</div>
          <div style={{...big(pctSize, N.mustard), lineHeight: 0.9}}>{p.pct}</div>
          <div style={{...big(kind === 'land' ? 150 : 140, N.cream, false), marginTop: -6}}>{p.offWord ?? 'Off'}</div>
        </div>
        <div style={{marginTop: 26, opacity: su, background: N.black, color: N.cream, fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: 3, padding: '12px 26px', borderRadius: 999, textTransform: 'uppercase'}}>{p.phase} · {p.endsText}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** One product: cutout on cream + savings burst + name. */
const Product: React.FC<{p: AdProps; i: number; at: number; saveAt: number}> = ({p, i, at, saveAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {kind, W, H} = useLay();
  const it = p.items[i];
  const s = sp(frame, at, fps, {damping: 13, stiffness: 170});
  const slide = interpolate(frame, [f(at), f(at + 0.22)], [W * 0.6, 0], {...clamp, easing: ease});
  const z = interpolate(frame, [f(at), f(at + 2.6)], [1, 1.06], clamp);
  const L = kind === 'land'
    ? {ix: 640, iy: 580, bw: 1060, bh: 820, bx: 1440, by: 430, bs: 400, nx: 1440, ny: 800, nw: 760, ns: 74}
    : kind === 'sq'
      ? {ix: 470, iy: 560, bw: 760, bh: 620, bx: 820, by: 330, bs: 330, nx: 540, ny: 965, nw: 960, ns: 62}
      : {ix: 540, iy: 1080, bw: 1000, bh: 900, bx: 780, by: 520, bs: 400, nx: 540, ny: 1660, nw: 960, ns: 76};
  return (
    <AbsoluteFill style={{background: N.cream, overflow: 'hidden', transform: `translateX(${slide}px)`}}>
      <Grain o={0.1} />
      <div style={{position: 'absolute', left: L.ix - L.bw / 2, top: L.iy - L.bh / 2, width: L.bw, height: L.bh}}>
        <div style={{position: 'absolute', left: '5%', top: '22%', width: '90%', height: '66%', borderRadius: '50%', background: N.paper}} />
        <Img src={staticFile(it.src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${z * (0.85 + 0.15 * s)})`, filter: 'drop-shadow(0 26px 26px rgba(0,0,0,0.25))'}} />
      </div>
      <SaveBurst at={saveAt} x={L.bx} y={L.by} save={it.save} pct={`${p.pct} OFF`} size={L.bs} />
      <div style={{position: 'absolute', left: L.nx - L.nw / 2, top: L.ny - 60, width: L.nw, textAlign: 'center', opacity: s}}>
        <span style={{display: 'inline-block', background: N.forest, color: N.cream, fontFamily: FONT.display, fontSize: L.ns, padding: '18px 36px 14px', borderRadius: 18, textTransform: 'uppercase', boxShadow: '0 8px 0 rgba(0,0,0,0.2)'}}>{it.name}</span>
      </div>
    </AbsoluteFill>
  );
};

/** End: UP TO X% OFF · ends date · Shop now button · domain */
const End: React.FC<{p: AdProps}> = ({p}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {kind} = useLay();
  const s = sp(frame, p.T.ends, fps, {damping: 10, stiffness: 220});
  const sb = sp(frame, p.T.shop, fps, {damping: 8, stiffness: 260});
  const press = interpolate(frame % 24, [0, 4, 8, 24], [1, 0.94, 1.04, 1], clamp);
  const pulse = frame >= f(p.T.shop) ? press : 1;
  const land = kind === 'land';
  const row = p.items.map((it, i) => {
    const si = sp(frame, p.T.ends + 0.1 + i * 0.1, fps, {damping: 12, stiffness: 180});
    return <Img key={i} src={staticFile(it.src)} style={{height: land ? 380 : kind === 'sq' ? 210 : 330, maxWidth: land ? 400 : kind === 'sq' ? 260 : 340, objectFit: 'contain', transform: `scale(${si}) rotate(${(i - 1) * 4}deg)`, filter: 'drop-shadow(0 16px 18px rgba(0,0,0,0.35))'}} />;
  });
  const text = (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
      <Img src={staticFile(BRAND.logoWhite)} style={{height: land ? 80 : 74, marginBottom: land ? 26 : 22, opacity: s}} />
      <div style={{...big(land ? 84 : kind === 'sq' ? 74 : 86, N.cream, false), opacity: s}}>{p.kicker ?? 'Up to'}</div>
      <div style={{...big(land ? 250 : kind === 'sq' ? 200 : 250, N.mustard), transform: `scale(${s})`}}>{p.pct} off</div>
      <div style={{marginTop: 22, opacity: s, background: N.cream, color: N.forestDeep, fontFamily: FONT.display, fontSize: land ? 44 : 42, padding: '12px 28px 10px', borderRadius: 999, textTransform: 'uppercase'}}>⏰ {p.endsText}</div>
      <div style={{marginTop: land ? 34 : 30, transform: `scale(${sb * pulse})`, background: N.mustard, color: N.forestDeep, fontFamily: FONT.display, fontSize: land ? 76 : kind === 'sq' ? 66 : 80, padding: '22px 58px 18px', borderRadius: 22, border: '5px solid #111', boxShadow: '0 10px 0 #111', textTransform: 'uppercase'}}>{p.button ?? 'Shop now →'}</div>
      <div style={{marginTop: 22, opacity: sb, color: N.cream, fontFamily: FONT.body, fontWeight: 800, fontSize: land ? 40 : 38, letterSpacing: 2}}>{BRAND.domain.toLowerCase()}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: N.forestDeep, overflow: 'hidden'}}>
      <Grain />
      {land ? (
        <AbsoluteFill style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 80}}>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 0, width: 900, justifyContent: 'center'}}>{row}</div>
          {text}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: kind === 'sq' ? 18 : 60}}>
          {text}
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 10}}>{row}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const AdV: React.FC<AdProps> = (p) => {
  const frame = useCurrentFrame();
  const T = p.T;
  const total = T.voEnd + AD_HOLD;
  const fr = (a: number, b: number) => ({from: f(a), durationInFrames: Math.max(1, f(b) - f(a))});
  const mv = (x: number) => {
    const t = x / 30;
    return 0.1 * interpolate(t, [0, 0.3], [0.5, 1], clamp) * interpolate(t, [T.voEnd, T.voEnd + 0.4], [1, 2.2], clamp) * interpolate(t, [total - 0.8, total], [1, 0], clamp);
  };
  const sfx = [
    {src: 'sfx/stamp.mp3', at: 0.0, vol: 0.55}, {src: 'sfx/whoosh_soft.mp3', at: T.yes - 0.1, vol: 0.4}, {src: 'sfx/stamp.mp3', at: T.up + 0.05, vol: 0.5},
    {src: 'sfx/whoosh_soft.mp3', at: T.fire - 0.1, vol: 0.35}, {src: 'sfx/pop.mp3', at: T.fireSave, vol: 0.45},
    {src: 'sfx/whoosh_soft.mp3', at: T.sofa - 0.1, vol: 0.35}, {src: 'sfx/pop.mp3', at: T.sofaSave, vol: 0.45},
    {src: 'sfx/whoosh_soft.mp3', at: T.tree - 0.1, vol: 0.35}, {src: 'sfx/pop.mp3', at: T.treeSave, vol: 0.45},
    {src: 'sfx/whoosh_soft.mp3', at: T.ends - 0.1, vol: 0.4}, {src: 'sfx/sparkle.mp3', at: T.shop, vol: 0.35},
  ];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...fr(0, T.yes - 0.06)}><Hook p={p} /></Sequence>
      <Sequence {...fr(T.yes - 0.06, T.fire - 0.05)}><Offer p={{...p, T: {...T, yes: 0.06, up: T.up - T.yes + 0.06}}} /></Sequence>
      <Sequence {...fr(T.fire - 0.05, T.sofa - 0.05)}><Product p={p} i={0} at={0.0} saveAt={T.fireSave - T.fire + 0.05} /></Sequence>
      <Sequence {...fr(T.sofa - 0.05, T.tree - 0.05)}><Product p={p} i={1} at={0.0} saveAt={T.sofaSave - T.sofa + 0.05} /></Sequence>
      <Sequence {...fr(T.tree - 0.05, T.ends - 0.05)}><Product p={p} i={2} at={0.0} saveAt={T.treeSave - T.tree + 0.05} /></Sequence>
      <Sequence {...fr(T.ends - 0.05, total)}><End p={{...p, T: {...T, ends: 0.05, shop: T.shop - T.ends + 0.05}}} /></Sequence>
      <Chrome p={p} />
      <Audio src={staticFile(p.vo)} />
      <Audio src={staticFile(p.music)} volume={mv} />
      {sfx.map((x, i) => <Sequence key={i} from={Math.max(0, f(x.at))}><Audio src={staticFile(x.src)} volume={x.vol} /></Sequence>)}
    </AbsoluteFill>
  );
};
