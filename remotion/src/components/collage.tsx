/* Collage / paper-cut / scrapbook toolkit shared by the 5 illustrated Reels.
   Everything is frame-driven (no CSS animations) so renders are deterministic. */
import {FONT} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, easeInOut, f} from './core';

/** "Boil": tiny jitter that updates on 2s (12 fps) — the hand-made stop-motion feel. */
export const useBoil = (seed: string, amp = 1.2) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / 2.5);
  return {x: (random(`${seed}x${k}`) - 0.5) * amp * 2, y: (random(`${seed}y${k}`) - 0.5) * amp * 2, r: (random(`${seed}r${k}`) - 0.5) * amp * 0.8};
};

/** Deterministic jagged edge polygon points along one side, in % units, for clip-path. */
export const tornEdge = (seed: string, side: 'top' | 'bottom' | 'left' | 'right', depth = 2.2, n = 40) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const p = (i / n) * 100;
    const j = random(`${seed}${i}`) * depth;
    if (side === 'top') pts.push(`${p}% ${j}%`);
    if (side === 'bottom') pts.push(`${100 - p}% ${100 - j}%`);
    if (side === 'left') pts.push(`${j}% ${100 - p}%`);
    if (side === 'right') pts.push(`${100 - j}% ${p}%`);
  }
  return pts;
};

/** A paper card with torn top/bottom edges (or all four). */
export const tornClip = (seed: string, sides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom'], depth = 2.2) => {
  const top = sides.includes('top') ? tornEdge(seed + 't', 'top', depth) : ['0% 0%', '100% 0%'];
  const right = sides.includes('right') ? tornEdge(seed + 'r', 'right', depth) : ['100% 0%', '100% 100%'];
  const bottom = sides.includes('bottom') ? tornEdge(seed + 'b', 'bottom', depth) : ['100% 100%', '0% 100%'];
  const left = sides.includes('left') ? tornEdge(seed + 'l', 'left', depth) : ['0% 100%', '0% 0%'];
  return `polygon(${[...top, ...right, ...bottom, ...left].join(', ')})`;
};

/** Halftone dot overlay (risograph / print feel). */
export const Halftone: React.FC<{color?: string; size?: number; opacity?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({color = 'rgba(0,0,0,0.35)', size = 9, opacity = 0.25, blend = 'multiply'}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: blend, backgroundImage: `radial-gradient(${color} 28%, transparent 30%)`, backgroundSize: `${size}px ${size}px`}} />
);

/** Strip of masking tape. */
export const Tape: React.FC<{x: number; y: number; w?: number; rot?: number; color?: string; at?: number}> = ({x, y, w = 150, rot = -8, color = 'rgba(240,226,190,0.85)', at = 0}) => {
  const frame = useCurrentFrame();
  if (frame < f(at)) return null;
  const p = interpolate(frame, [f(at), f(at + 0.18)], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - 20, width: w * p, height: 40, background: color, transform: `rotate(${rot}deg)`, transformOrigin: '0% 50%', clipPath: 'polygon(0 6%, 4% 0, 9% 8%, 14% 0, 100% 4%, 97% 50%, 100% 96%, 92% 100%, 86% 92%, 80% 100%, 0 96%, 3% 50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.12)'}} />
  );
};

/** A photo / cut-out that "slaps" onto the page: overshoot scale + rotation settle + hard shadow. */
export const Slap: React.FC<{at: number; x: number; y: number; w?: number; h?: number; rot?: number; children: React.ReactNode; shadow?: number; out?: number; from?: 'top' | 'left' | 'right' | 'bottom' | 'none'; z?: number; origin?: string}> = ({at, x, y, w, h, rot = 0, children, shadow = 0.28, out, from = 'none', z, origin = '50% 50%'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  if (out !== undefined && frame > f(out + 0.35)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 11, stiffness: 190, mass: 0.7}});
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.35)], [0, 1], {...clamp, easing: ease}) : 0;
  const dx = from === 'left' ? -900 : from === 'right' ? 900 : 0;
  const dy = from === 'top' ? -1400 : from === 'bottom' ? 1400 : 0;
  const sc = from === 'none' ? 1.35 - 0.35 * s : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: z, transformOrigin: origin, transform: `translate(${dx * (1 - s) + o * (dx || 0)}px, ${dy * (1 - s) + o * 1400}px) rotate(${rot + (1 - s) * (from === 'none' ? 9 : 0)}deg) scale(${sc})`, opacity: from === 'none' ? Math.min(1, s * 3) : 1, filter: `drop-shadow(8px 10px 0 rgba(0,0,0,${shadow * 0.5})) drop-shadow(0 18px 22px rgba(0,0,0,${shadow}))`}}>
      {children}
    </div>
  );
};

/** Sticker treatment for a product cut-out: white die-cut outline + soft shadow. */
export const Sticker: React.FC<{src: string; h: number; outline?: number; style?: React.CSSProperties}> = ({src, h, outline = 7, style}) => {
  const o = outline;
  const ring = [
    `drop-shadow(${o}px 0 0 #fff)`, `drop-shadow(-${o}px 0 0 #fff)`, `drop-shadow(0 ${o}px 0 #fff)`, `drop-shadow(0 -${o}px 0 #fff)`,
    'drop-shadow(0 12px 14px rgba(0,0,0,0.25))',
  ].join(' ');
  return <Img src={staticFile(src)} style={{height: h, display: 'block', filter: ring, ...style}} />;
};

/** Hand-drawn stroke that draws on (stroke-dashoffset). */
export const DrawOn: React.FC<{d: string; at: number; dur?: number; color: string; width?: number; len?: number; dash?: string; opacity?: number}> = ({d, at, dur = 0.6, color, width = 5, len = 1500, dash, opacity = 1}) => {
  const frame = useCurrentFrame();
  if (frame < f(at)) return null;
  const p = interpolate(frame, [f(at), f(at + dur)], [0, 1], {...clamp, easing: ease});
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ?? len} strokeDashoffset={dash ? 0 : len * (1 - p)} opacity={dash ? p * opacity : opacity} />;
};

/** Paper plane for parallax: a layer that moves at its own depth when the "camera" trucks. */
export const Plane: React.FC<{depth: number; camX: number; camY?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({depth, camX, camY = 0, children, style}) => (
  <AbsoluteFill style={{transform: `translate(${-camX * depth}px, ${-camY * depth}px)`, ...style}}>{children}</AbsoluteFill>
);

/** Cut-out "ransom" letters: each letter on its own paper chip, slapped in one by one. */
export const CutLetters: React.FC<{text: string; at: number; x: number; y: number; size?: number; colors?: string[]; fonts?: string[]; seed?: string; stagger?: number; center?: boolean; rot?: number}> = ({text, at, x, y, size = 96, colors = ['#fff'], fonts = [FONT.body], seed = 'cl', stagger = 0.04, center = false, rot = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', flexWrap: 'nowrap', gap: 6, alignItems: 'center', transform: `${center ? 'translateX(-50%) ' : ''}rotate(${rot}deg)`}}>
      {text.split('').map((ch, i) => {
        if (ch === ' ') return <div key={i} style={{width: size * 0.32}} />;
        const t0 = at + i * stagger;
        if (frame < f(t0)) return <div key={i} style={{width: size * 0.7, height: size}} />;
        const s = spring({frame: frame - f(t0), fps, config: {damping: 10, stiffness: 260, mass: 0.6}});
        const r = (random(`${seed}${i}`) - 0.5) * 10;
        const bg = colors[Math.floor(random(`${seed}c${i}`) * colors.length)];
        const ff = fonts[Math.floor(random(`${seed}f${i}`) * fonts.length)];
        const dark = /^#(0|1|2|3)/.test(bg);
        return (
          <div key={i} style={{background: bg, padding: '2px 10px 6px', transform: `rotate(${r}deg) scale(${1.5 - 0.5 * s})`, opacity: Math.min(1, s * 3), boxShadow: '3px 4px 0 rgba(0,0,0,0.25)', fontFamily: ff, fontWeight: 800, fontSize: size, lineHeight: 1, color: dark ? '#fff' : '#1b1b1b'}}>
            {ch}
          </div>
        );
      })}
    </div>
  );
};

/** Postage-stamp frame (perforated edge) around children. */
export const StampFrame: React.FC<{w: number; h: number; color?: string; children: React.ReactNode}> = ({w, h, color = '#FBF6EC', children}) => {
  const r = 9;
  const mask = `radial-gradient(circle at ${r}px ${r}px, transparent ${r - 0.5}px, #000 ${r}px) -${r}px -${r}px / ${r * 2}px ${r * 2}px`;
  return (
    <div style={{width: w, height: h, background: color, WebkitMask: mask, mask, padding: 22, boxSizing: 'border-box', filter: 'drop-shadow(0 10px 12px rgba(0,0,0,0.25))'}}>
      <div style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}>{children}</div>
    </div>
  );
};

/** Circular ink postmark with text around the ring. */
export const Postmark: React.FC<{text: string; sub?: string; at: number; x: number; y: number; color?: string; size?: number; rot?: number}> = ({text, sub, at, x, y, color = 'rgba(40,40,60,0.75)', size = 220, rot = -12}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 14, stiffness: 400}});
  const id = `pm${Math.round(x)}${Math.round(y)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * s})`, opacity: Math.min(0.9, s * 2)}}>
      <defs>
        <path id={id} d="M 100 100 m -72 0 a 72 72 0 1 1 144 0 a 72 72 0 1 1 -144 0" />
      </defs>
      <circle cx={100} cy={100} r={92} fill="none" stroke={color} strokeWidth={5} />
      <circle cx={100} cy={100} r={52} fill="none" stroke={color} strokeWidth={3} />
      <text fill={color} fontFamily="Inter" fontWeight={800} fontSize={19} letterSpacing={5}>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
      {sub && (
        <text x={100} y={108} textAnchor="middle" fill={color} fontFamily="Inter" fontWeight={800} fontSize={22}>
          {sub}
        </text>
      )}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M 196 ${70 + i * 18} q 30 -10 60 0 t 60 0`} stroke={color} strokeWidth={4} fill="none" />
      ))}
    </svg>
  );
};

/** Torn-paper scene transition: a sheet with a jagged leading edge sweeps across. */
export const TornSweep: React.FC<{at: number; dur?: number; color?: string; texture?: string; dir?: 'up' | 'down' | 'left' | 'right'; seed?: string}> = ({at, dur = 0.8, color = '#F3EAD7', texture = 'img/paper_cream.jpg', dir = 'up', seed = 'ts'}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [f(at), f(at + dur)], [0, 1], {...clamp, easing: easeInOut});
  if (p <= 0 || p >= 1) return null;
  const vertical = dir === 'up' || dir === 'down';
  const span = vertical ? 1920 : 1080;
  const size = span * 1.25;
  const pos = (dir === 'up' || dir === 'left' ? 1 : -1) * (span + 60) - (dir === 'up' || dir === 'left' ? 1 : -1) * p * (span + size + 120);
  const clip = tornClip(seed, vertical ? ['top', 'bottom'] : ['left', 'right'], 1.6);
  return (
    <div style={{position: 'absolute', left: vertical ? -20 : pos, top: vertical ? pos : -20, width: vertical ? 1120 : size, height: vertical ? size : 1960, clipPath: clip, background: color, filter: 'drop-shadow(0 0 18px rgba(0,0,0,0.3))'}}>
      <Img src={staticFile(texture)} style={{width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.55}} />
    </div>
  );
};

/** Typewriter text (reveals characters, with a blinking caret while typing). */
export const Typewriter: React.FC<{text: string; at: number; cps?: number; style?: React.CSSProperties}> = ({text, at, cps = 26, style}) => {
  const frame = useCurrentFrame();
  const t = (frame - f(at)) / 30;
  if (t < 0) return null;
  const n = Math.min(text.length, Math.floor(t * cps));
  const caret = n < text.length && Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={style}>
      {text.slice(0, n)}
      <span style={{opacity: caret ? 1 : 0}}>|</span>
    </div>
  );
};

/** Gentle pendulum sway (for hanging tags, ornaments). */
export const useSway = (amp = 3, speed = 1, phase = 0) => {
  const frame = useCurrentFrame();
  return Math.sin((frame / 30) * speed * 2 + phase) * amp;
};

export {clamp, ease, easeInOut, f};

/** Handwritten line that "writes on" left-to-right like a pen (soft-edged wipe), instead of a typed caret. */
export const WriteOn: React.FC<{text: string; at: number; cps?: number; style?: React.CSSProperties}> = ({text, at, cps = 22, style}) => {
  const frame = useCurrentFrame();
  const t = (frame - f(at)) / 30;
  if (t < 0) return null;
  const p = Math.min(1, t / Math.max(0.35, text.length / cps));
  const edge = p * 112 - 6; // % position of the pen, with a 6% soft edge
  return (
    <div style={{...style, display: 'inline-block', WebkitMaskImage: `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 6}%)`, maskImage: `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 6}%)`}}>
      {text}
    </div>
  );
};
