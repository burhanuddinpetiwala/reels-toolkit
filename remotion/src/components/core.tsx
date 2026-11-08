import {FONT} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {C, FPS} from '../brand';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1); // easeOutQuint-ish
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** seconds -> frame */
export const f = (s: number) => Math.round(s * FPS);

/** 0..1 progress between two times (seconds) with easing */
export const useProgress = (startS: number, durS: number, easing = ease) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [f(startS), f(startS + durS)], [0, 1], {...clamp, easing});
};

/** spring that starts at time s */
export const useSpringAt = (s: number, config: any = {damping: 14, stiffness: 120, mass: 0.9}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - f(s), fps, config});
};

/** Paper grain overlay (overlay blend). */
export const PaperGrain: React.FC<{opacity?: number}> = ({opacity = 0.22}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
    <Img src={staticFile('img/paper_grain.png')} style={{width: '100%', height: '100%'}} />
  </AbsoluteFill>
);

/** Soft vignette */
export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.45, color = '0,0,0'}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** Full-frame background image with optional slow push (Ken Burns) and CSS filter. */
export const Bg: React.FC<{
  src: string;
  from?: number; // seconds
  dur?: number;
  scaleFrom?: number;
  scaleTo?: number;
  originX?: number; // percent
  originY?: number;
  filter?: string;
  style?: React.CSSProperties;
}> = ({src, from = 0, dur = 10, scaleFrom = 1.0, scaleTo = 1.06, originX = 50, originY = 50, filter, style}) => {
  const p = useProgress(from, dur, Easing.linear);
  const s = scaleFrom + (scaleTo - scaleFrom) * p;
  return (
    <AbsoluteFill style={{overflow: 'hidden', ...style}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, transformOrigin: `${originX}% ${originY}%`, filter}}
      />
    </AbsoluteFill>
  );
};

type Enter = 'rise' | 'drop' | 'pop' | 'left' | 'right' | 'swing' | 'fade' | 'grow' | 'stop';
/** Real product cutout with paper-like drop shadow and entrance animation. */
export const Cutout: React.FC<{
  src: string;
  x: number; // centre x px
  y: number; // bottom y px (feet of the product)
  h: number; // height px
  at: number; // seconds
  enter?: Enter;
  shadow?: number; // 0..1
  sway?: number; // idle rotation degrees
  rotate?: number;
  exitAt?: number;
  exitDur?: number;
  zIndex?: number;
  filter?: string;
  floorShadow?: boolean;
}> = ({src, x, y, h, at, enter = 'pop', shadow = 0.35, sway = 0, rotate = 0, exitAt, exitDur = 0.4, zIndex, filter, floorShadow = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - f(at), fps, config: enter === 'swing' ? {damping: 7, stiffness: 60, mass: 1} : {damping: 13, stiffness: 140, mass: 0.8}});
  const lin = interpolate(frame, [f(at), f(at + 0.5)], [0, 1], clamp);
  if (frame < f(at) - 1) return null;
  let tx = 0, ty = 0, sc = 1, rot = rotate, op = 1, sy = 1, sx = 1;
  switch (enter) {
    case 'rise': ty = (1 - sp) * 260; op = lin; break;
    case 'drop': ty = -(1 - sp) * 900; break;
    case 'pop': sc = 0.6 + 0.4 * sp; op = Math.min(1, lin * 2); break;
    case 'left': tx = -(1 - sp) * 1100; break;
    case 'right': tx = (1 - sp) * 1100; break;
    case 'swing': rot = rotate + (1 - sp) * -28; ty = -(1 - Math.min(1, lin * 1.5)) * 500; break;
    case 'fade': op = lin; break;
    case 'grow': sy = sp; sx = 0.85 + 0.15 * sp; op = Math.min(1, lin * 3); break;
    case 'stop': {
      // stop-motion: snap in 3 steps at 12fps
      const st = Math.floor(Math.max(0, frame - f(at)) / 2.5);
      sc = [0.5, 0.82, 1.06, 1][Math.min(3, st)];
      break;
    }
  }
  if (sway) rot += Math.sin((frame - f(at)) / fps * 1.6) * sway;
  if (exitAt !== undefined) {
    const e = interpolate(frame, [f(exitAt), f(exitAt + exitDur)], [0, 1], {...clamp, easing: easeInOut});
    op *= 1 - e;
    ty += e * 60;
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex}}>
      {floorShadow && (
        <div
          style={{
            position: 'absolute',
            left: -h * 0.32,
            top: -h * 0.03,
            width: h * 0.64,
            height: h * 0.07,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)',
            opacity: op * shadow * 1.6 * sy,
            transform: `translateX(${tx}px) scaleX(${sc})`,
          }}
        />
      )}
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          height: h,
          left: 0,
          bottom: 0,
          transform: `translate(-50%, 0) translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc * sx}, ${sc * sy})`,
          transformOrigin: '50% 100%',
          opacity: op,
          filter: `drop-shadow(0px ${h * 0.012}px ${h * 0.02}px rgba(30,20,10,${shadow})) ${filter ?? ''}`,
        }}
      />
    </div>
  );
};

/** Handwritten paper tag on a string, with a drawn connector line to a point. */
export const Tag: React.FC<{
  text: string;
  sub?: string;
  x: number; y: number; // tag top-left
  at: number;
  out?: number;
  to?: [number, number]; // point the line goes to
  rotate?: number;
  color?: string;
  bg?: string;
  font?: string;
  size?: number;
  width?: number;
}> = ({text, sub, x, y, at, out, to, rotate = -3, color = C.ink, bg = C.cream, font = FONT.script, size = 58, width}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - f(at), fps, config: {damping: 12, stiffness: 150}});
  const line = interpolate(frame, [f(at), f(at + 0.45)], [0, 1], {...clamp, easing: ease});
  const fade = out !== undefined ? interpolate(frame, [f(out), f(out + 0.3)], [1, 0], clamp) : 1;
  if (frame < f(at)) return null;
  return (
    <>
      {to && (
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: fade}} viewBox="0 0 1080 1920">
          <path
            d={`M ${x + 30} ${y + 20} Q ${(x + to[0]) / 2} ${Math.min(y, to[1]) - 60} ${to[0]} ${to[1]}`}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeDasharray="1200"
            strokeDashoffset={1200 * (1 - line)}
            strokeLinecap="round"
          />
          <circle cx={to[0]} cy={to[1]} r={9 * line} fill={color} />
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `rotate(${rotate}deg) scale(${sp})`,
          transformOrigin: '0% 0%',
          opacity: fade,
          background: bg,
          color,
          padding: '14px 30px 16px 40px',
          borderRadius: 10,
          clipPath: 'polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 50%)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
          fontFamily: font,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.0,
          width,
          whiteSpace: width ? 'normal' : 'nowrap',
        }}
      >
        <div style={{position: 'absolute', left: 14, top: '50%', width: 12, height: 12, marginTop: -6, borderRadius: 6, background: 'rgba(0,0,0,0.25)'}} />
        {text}
        {sub && <div style={{fontFamily: FONT.body, fontWeight: 600, fontSize: size * 0.42, marginTop: 6, opacity: 0.8, letterSpacing: 0.3}}>{sub}</div>}
      </div>
    </>
  );
};

/** Falling paper snow (deterministic). */
export const Snow: React.FC<{count?: number; seed?: string; opacity?: number; speed?: number; color?: string; from?: number; size?: number}> = ({count = 40, seed = 's', opacity = 0.85, speed = 1, color = '#fff', from = 0, size = 1}) => {
  const frame = useCurrentFrame();
  const t = (frame - f(from)) / FPS;
  if (t < 0) return null;
  const flakes = [] as React.ReactNode[];
  for (let i = 0; i < count; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const s = (10 + r('s') * 22) * size;
    const vy = (60 + r('v') * 90) * speed;
    const x0 = r('x') * 1140 - 30;
    const y = ((r('y') * 2100 + t * vy) % 2100) - 90;
    const x = x0 + Math.sin(t * (0.6 + r('w')) + r('p') * 6) * 30;
    const rot = t * 40 * (r('r') - 0.5);
    const star = r('t') > 0.5;
    flakes.push(
      <svg key={i} width={s} height={s} viewBox="-10 -10 20 20" style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, opacity: opacity * (0.5 + 0.5 * r('o'))}}>
        {star ? (
          <g stroke={color} strokeWidth={1.6} strokeLinecap="round">
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-8 * Math.cos((a * Math.PI) / 180)} y1={-8 * Math.sin((a * Math.PI) / 180)} x2={8 * Math.cos((a * Math.PI) / 180)} y2={8 * Math.sin((a * Math.PI) / 180)} />
            ))}
          </g>
        ) : (
          <circle r={5} fill={color} />
        )}
      </svg>
    );
  }
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{flakes}</AbsoluteFill>;
};

/** Warm glow light (screen blend). */
export const Glow: React.FC<{x: number; y: number; r: number; color?: string; opacity?: number; flicker?: number}> = ({x, y, r, color = '255,190,110', opacity = 0.6, flicker = 0}) => {
  const frame = useCurrentFrame();
  const fl = flicker ? 1 + Math.sin(frame * 0.7) * 0.04 * flicker + Math.sin(frame * 1.9 + 1) * 0.03 * flicker : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${color},${opacity * fl}) 0%, rgba(${color},${opacity * 0.35 * fl}) 40%, rgba(${color},0) 70%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

/** Big serif kinetic title: words drop in one by one. */
export const KineticTitle: React.FC<{
  words: string[];
  at: number;
  stagger?: number;
  x?: number; y: number; width?: number;
  size?: number; color?: string; font?: string; italicIdx?: number[]; align?: 'left' | 'center';
  out?: number;
  shadow?: string;
  weight?: number;
}> = ({words, at, stagger = 0.12, x = 90, y, width = 900, size = 120, color = C.cream, font = FONT.serif, italicIdx = [], align = 'left', out, shadow = '0 6px 30px rgba(0,0,0,0.35)', weight = 600}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fade = out !== undefined ? interpolate(frame, [f(out), f(out + 0.35)], [1, 0], clamp) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width, textAlign: align, opacity: fade, lineHeight: 1.02}}>
      {words.map((w, i) => {
        const sp = spring({frame: frame - f(at + i * stagger), fps, config: {damping: 13, stiffness: 160}});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: size * 0.24,
              fontFamily: font,
              fontWeight: weight,
              fontStyle: italicIdx.includes(i) ? 'italic' : 'normal',
              fontSize: size,
              color,
              textShadow: shadow,
              transform: `translateY(${(1 - sp) * 60}px) rotate(${(1 - sp) * (i % 2 ? 6 : -6)}deg)`,
              opacity: Math.min(1, sp * 1.4),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Circle reveal wrapper: children revealed from (cx,cy). */
export const CircleReveal: React.FC<{at: number; dur?: number; cx: number; cy: number; children: React.ReactNode}> = ({at, dur = 1.0, cx, cy, children}) => {
  const p = useProgress(at, dur, easeInOut);
  const r = p * 2300;
  return <AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>;
};

/** Hard-edged paper wipe (diagonal torn edge sliding across). */
export const PaperWipe: React.FC<{at: number; dur?: number; color?: string; dir?: 1 | -1}> = ({at, dur = 0.7, color = C.cream, dir = 1}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [f(at), f(at + dur)], [0, 1], {...clamp, easing: easeInOut});
  if (p <= 0 || p >= 1) return null;
  const x = dir === 1 ? -1400 + p * 2800 : 1400 - p * 2800;
  const teeth = Array.from({length: 26}, (_, k) => 25 - k)
    .map((i) => `${i % 2 ? 40 : 0}px ${((i * 2120) / 25).toFixed(0)}px`)
    .join(',');
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x, top: -100, width: 1400, height: 2120, background: color, transform: 'rotate(8deg)', boxShadow: '0 0 40px rgba(0,0,0,0.35)', clipPath: `polygon(40px 0, 100% 0, 100% 100%, 40px 100%, ${teeth})`}} />
    </AbsoluteFill>
  );
};

/** Mounts children only between two times (seconds) without shifting their clock (unlike <Sequence>). */
export const Show: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const frame = useCurrentFrame();
  if (frame < f(from) || frame >= f(to)) return null;
  return <AbsoluteFill>{children}</AbsoluteFill>;
};
