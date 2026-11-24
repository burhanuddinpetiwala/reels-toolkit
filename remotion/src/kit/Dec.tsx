// December styles: one visual language per audience. spec.style picks the template.
//   glitch  - glitch + kinetic typography deal list (deal hunters)
//   split   - A/B split-screen poll (renters, couples)
//   ba      - before/after room transformation (families)
//   gta     - open-world crime game HUD parody, original art only (gamers)
//   ugc     - host clips + product reveal stickers (parents, grandparents)
//   info    - calm animated infographic checklist + host picture-in-picture (benefits holders)
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions, CaptionStyle} from '../components/Captions';
import {VideoData, wt as wtw} from '../components/timeline';
import {N, FONT, BRAND} from '../theme';
const LOGO = {white: BRAND.logoWhite as string, full: BRAND.logo as string};

const FPS = 30;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fr = (t: number) => Math.round(t * FPS);
const src = (p: string) => staticFile(p);
type At = [string, string?, number?];
const T = (d: VideoData, a?: At | number) => {
  if (a === undefined) return 0;
  if (typeof a === 'number') return a;
  return a[1] ? wtw(d, a[0], a[1], a[2] ?? 0) : d.lines.find((l) => l.k === a[0])!.start;
};
const useT = () => useCurrentFrame() / FPS;
const sp = (frame: number, at: number, cfg = {damping: 11, stiffness: 180, mass: 0.7}) => (frame < fr(at) ? 0 : spring({frame: frame - fr(at), fps: FPS, config: cfg}));
const ease = (t: number) => t * t * (3 - 2 * t);


// ---------- craft helpers (docs/VIRAL-CRAFT.md) ----------
/** Film grain + vignette: the top layer of the five-layer stack. Deterministic per frame. */
const Grain: React.FC<{amount?: number; vignette?: number}> = ({amount = 0.07, vignette = 0.38}) => {
  const frame = useCurrentFrame();
  const seed = frame % 7;
  return (
    <AbsoluteFill style={{zIndex: 90, pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: amount, mixBlendMode: 'overlay'}}>
        <filter id={`gr${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter={`url(#gr${seed})`} />
      </svg>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,${vignette}) 100%)`}} />
    </AbsoluteFill>
  );
};
/** Crash-zoom punch: snap to `to` scale in ~6 frames, then a decaying shake. Wrap the hero. */
const Punch: React.FC<{at: number; to?: number; children: React.ReactNode; origin?: string}> = ({at, to = 1.12, children, origin = '50% 45%'}) => {
  const frame = useCurrentFrame();
  const f0 = fr(at);
  const k = frame < f0 ? 0 : Math.min(1, (frame - f0) / 6);
  const sc = 1 + (to - 1) * (k * k) - (frame >= f0 + 6 ? (to - 1) * 0.35 * Math.min(1, (frame - f0 - 6) / 8) : 0);
  const df = frame - f0 - 6;
  const amp = df >= 0 && df < 10 ? 14 * Math.exp(-df / 1.8) : 0;
  const sx = amp * Math.sin(df * 2.9), sy = amp * Math.cos(df * 3.7) * 0.6;
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${sc})`, transformOrigin: origin}}>{children}</AbsoluteFill>;
};
/** Slam-in scale: arrives from oversize, decelerating (not growing from zero). */
const slam = (frame: number, at: number, from = 2.2) => {
  if (frame < fr(at)) return {s: from, o: 0};
  const k = Math.min(1, (frame - fr(at)) / 7);
  const e = 1 - Math.pow(1 - k, 3);
  return {s: from + (1 - from) * e, o: Math.min(1, k * 3)};
};
/** Odometer: each digit rolls like a slot reel and locks left to right with a half-step overshoot. */
const Odo: React.FC<{value: number; at: number; prefix?: string; h: number}> = ({value, at, prefix = '$', h}) => {
  const frame = useCurrentFrame();
  const digits = String(value).split('').map(Number);
  return (
    <span style={{display: 'inline-flex', alignItems: 'flex-end'}}>
      <span>{prefix}</span>
      {digits.map((dg, i) => {
        const start = fr(at) + i * 4, dur = 12;
        const k = Math.max(0, Math.min(1, (frame - start) / dur));
        const spins = 2 + (digits.length - i);
        const target = spins * 10 + dg;
        let pos = target * (1 - Math.pow(1 - k, 3));
        if (k >= 1) { const b = Math.min(1, (frame - start - dur) / 5); pos = target + 0.5 * Math.sin(Math.PI * b) * (1 - b); }
        if (frame < start) pos = 0;
        const col = [...Array(spins * 10 + 11)].map((_, j) => j % 10);
        return (
          <span key={i} style={{display: 'inline-block', height: h, overflow: 'hidden', lineHeight: `${h}px`}}>
            <span style={{display: 'flex', flexDirection: 'column', transform: `translateY(${-pos * h}px)`}}>{col.map((c, j) => <span key={j} style={{height: h}}>{c}</span>)}</span>
          </span>
        );
      })}
    </span>
  );
};

// ---------- shared pieces ----------
const Show: React.FC<{from: number; to?: number; children: React.ReactNode}> = ({from, to = 999, children}) => {
  const t = useT();
  if (t < from - 0.001 || t >= to) return null;
  return <>{children}</>;
};

const Cut: React.FC<{p: string; x: number; y: number; h: number; at: number; rot?: number; filter?: string; float?: boolean; from?: 'up' | 'down' | 'left' | 'right' | 'pop'; z?: number; w?: number}> = ({p, x, y, h, at, rot = 0, filter, float = true, from = 'pop', z = 20, w}) => {
  const frame = useCurrentFrame();
  const s = sp(frame, at, {damping: 12, stiffness: 170, mass: 0.8});
  if (frame < fr(at)) return null;
  const off = (1 - s) * 900;
  const tr = from === 'up' ? `translateY(${-off}px)` : from === 'down' ? `translateY(${off}px)` : from === 'left' ? `translateX(${-off}px)` : from === 'right' ? `translateX(${off}px)` : `scale(${0.3 + 0.7 * s})`;
  const bob = float ? Math.sin((frame - fr(at)) / 22) * 8 : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y + bob, transform: `translate(-50%, 0) ${tr} rotate(${rot}deg)`, transformOrigin: '50% 80%', zIndex: z}}>
      <Img src={src(p)} style={{height: h, width: w, objectFit: 'contain', filter: filter ?? 'drop-shadow(0 30px 30px rgba(0,0,0,0.35))'}} />
    </div>
  );
};

const Pill: React.FC<{text: string; at: number; x: number; y: number; bg: string; color: string; size?: number; font?: string; rot?: number; center?: boolean; border?: string; z?: number}> = ({text, at, x, y, bg, color, size = 46, font = FONT.display, rot = 0, center, border, z = 40}) => {
  const frame = useCurrentFrame();
  const s = sp(frame, at, {damping: 9, stiffness: 240, mass: 0.6});
  if (frame < fr(at)) return null;
  return <div style={{position: 'absolute', left: x, top: y, zIndex: z, transform: `${center ? 'translateX(-50%) ' : ''}scale(${s}) rotate(${rot}deg)`, transformOrigin: center ? '50% 50%' : '0 50%', background: bg, color, fontFamily: font, fontSize: size, padding: '10px 26px 12px', borderRadius: 999, whiteSpace: 'nowrap', border, boxShadow: '0 8px 22px rgba(0,0,0,0.25)'}}>{text}</div>;
};

/** Number that rolls up to its value. */
const Roll: React.FC<{to: number; at: number; dur?: number; prefix?: string}> = ({to, at, dur = 0.5, prefix = '$'}) => {
  const t = useT();
  const v = Math.round(to * ease(Math.min(1, Math.max(0, (t - at) / dur))));
  return <>{prefix}{v}</>;
};

const TapButton: React.FC<{at: number; text: string; bg: string; color: string; y: number; font?: string; radius?: number; border?: string}> = ({at, text, bg, color, y, font = FONT.display, radius = 999, border}) => {
  const frame = useCurrentFrame();
  const s = sp(frame, at);
  const tap = frame > fr(at + 0.9) ? 1 - 0.07 * Math.max(0, Math.sin(((frame - fr(at + 0.9)) / FPS) * 7)) : 1;
  if (frame < fr(at)) return null;
  return (
    <div style={{position: 'absolute', left: 540, top: y, transform: `translateX(-50%) scale(${s * tap})`, background: bg, color, fontFamily: font, fontSize: 56, padding: '22px 54px 26px', borderRadius: radius, border, whiteSpace: 'nowrap', boxShadow: '0 14px 30px rgba(0,0,0,0.3)', zIndex: 50}}>{text}</div>
  );
};

type EndTheme = {bg: string; fg: string; accent: string; card?: string; font?: string; btnBg: string; btnFg: string; logo: 'white' | 'full'; bgNode?: React.ReactNode; radius?: number; border?: string};
const EndCard: React.FC<{at: number; theme: EndTheme; kicker: string; big: string; sub: string; note?: string; products: string[]; button?: string}> = ({at, theme, kicker, big, sub, note, products, button}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at) return null;
  const s = sp(frame, at, {damping: 14, stiffness: 160, mass: 0.8});
  const wipe = interpolate(frame, [fr(at), fr(at + 0.3)], [0, 100], cl);
  const font = theme.font ?? FONT.display;
  return (
    <AbsoluteFill style={{zIndex: 80, clipPath: `circle(${wipe * 1.3}% at 50% 45%)`, background: theme.bg}}>
      {theme.bgNode}
      <Img src={src(theme.logo === 'white' ? LOGO.white : LOGO.full)} style={{position: 'absolute', left: 540, top: 290, height: 120, transform: `translateX(-50%) scale(${s})`}} />
      <div style={{position: 'absolute', top: 470, width: '100%', textAlign: 'center', color: theme.fg, fontFamily: FONT.body, fontWeight: 800, fontSize: 46, letterSpacing: 3, textTransform: 'uppercase', opacity: s}}>{kicker}</div>
      <div style={{position: 'absolute', top: 530, width: '100%', textAlign: 'center', color: theme.accent, fontFamily: font, fontSize: 170, lineHeight: 1, transform: `scale(${0.6 + 0.4 * s})`}}>{big}</div>
      <div style={{position: 'absolute', top: 720, width: '100%', textAlign: 'center', color: theme.fg, fontFamily: font, fontSize: 64, opacity: s}}>{sub}</div>
      {products.map((p, i) => (
        <Cut key={i} p={p} x={[270, 540, 810][i] ?? 540} y={830 + (i === 1 ? -20 : 30)} h={i === 1 ? 330 : 270} at={at + 0.15 + i * 0.1} float />
      ))}
      <TapButton at={at + 0.35} text={button ?? `Shop ${BRAND.domain} →`} bg={theme.btnBg} color={theme.btnFg} y={1180} font={font} radius={theme.radius} border={theme.border} />
      {note && <div style={{position: 'absolute', top: 1110, width: '100%', textAlign: 'center', color: theme.fg, fontFamily: FONT.body, fontWeight: 700, fontSize: 34, opacity: interpolate(frame, [fr(at + 0.5), fr(at + 0.8)], [0, 0.9], cl)}}>{note}</div>}
    </AbsoluteFill>
  );
};

// ---------- 1. GLITCH ----------
const GlitchText: React.FC<{text: string; at: number; size: number; y: number; color: string; font?: string; burst?: number; x?: number}> = ({text, at, size, y, color, font = FONT.display, burst = 0.35, x = 540}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at) return null;
  const k = t - at < burst ? 1 : random(`g${Math.floor(frame / 3)}${text}`) > 0.93 ? 0.6 : 0;
  const j = (n: string) => (random(n + frame) - 0.5) * 40 * k;
  const s = sp(frame, at, {damping: 8, stiffness: 300, mass: 0.5});
  const slices = k ? [0, 1, 2].map((i) => ({top: random(`s${i}${frame}`) * 80, h: 6 + random(`h${i}${frame}`) * 18, dx: (random(`d${i}${frame}`) - 0.5) * 90})) : [];
  const base: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', textAlign: 'center', fontFamily: font, fontSize: size, lineHeight: 1, whiteSpace: 'pre', letterSpacing: -2};
  return (
    <div style={{position: 'absolute', left: x - 540, top: y, width: 1080, height: size * 1.1 * (text.split('\n').length), transform: `scale(${0.7 + 0.3 * s})`, zIndex: 30}}>
      <div style={{...base, color: '#ff2a6d', transform: `translate(${j('r') - 6 * k}px, ${j('r2') / 3}px)`, opacity: 0.85, mixBlendMode: 'screen'}}>{text}</div>
      <div style={{...base, color: '#05d9e8', transform: `translate(${j('c') + 6 * k}px, ${j('c2') / 3}px)`, opacity: 0.85, mixBlendMode: 'screen'}}>{text}</div>
      <div style={{...base, color}}>{text}</div>
      {slices.map((sl, i) => (
        <div key={i} style={{...base, color, clipPath: `inset(${sl.top}% 0 ${Math.max(0, 100 - sl.top - sl.h)}% 0)`, transform: `translateX(${sl.dx}px)`}}>{text}</div>
      ))}
    </div>
  );
};

const Kinetic: React.FC<{text: string; at: number; y: number; size: number; color: string; font?: string; stagger?: number}> = ({text, at, y, size, color, font = 'Bebas Neue', stagger = 0.035}) => {
  const frame = useCurrentFrame();
  if (frame < fr(at)) return null;
  return (
    <div style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', fontFamily: font, fontSize: size, color, letterSpacing: 4, lineHeight: 1, zIndex: 30, whiteSpace: 'nowrap'}}>
      {text.split('').map((ch, i) => {
        const s = sp(frame, at + i * stagger, {damping: 10, stiffness: 260, mass: 0.5});
        const dir = i % 2 ? 1 : -1;
        return <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 120 * dir}px)`, opacity: Math.min(1, s * 2)}}>{ch === ' ' ? ' ' : ch}</span>;
      })}
    </div>
  );
};

const GlitchBG: React.FC = () => {
  const frame = useCurrentFrame();
  const flick = random(`f${Math.floor(frame / 2)}`) > 0.96 ? 0.07 : 0;
  return (
    <AbsoluteFill style={{background: '#050b07'}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(rgba(46,204,113,0.13) 2px, transparent 2px), linear-gradient(90deg, rgba(46,204,113,0.13) 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0 ${(frame * 3) % 90}px`, transform: 'perspective(700px) rotateX(55deg) translateY(380px) scale(2.2)', transformOrigin: '50% 100%'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(224,165,38,0.18), transparent 60%)'}} />
      <AbsoluteFill style={{background: `rgba(255,255,255,${flick})`}} />
    </AbsoluteFill>
  );
};
const Scan: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{zIndex: 70, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)', opacity: 0.55}}>
      <div style={{position: 'absolute', left: 0, width: '100%', height: 140, top: (frame * 23) % 2100 - 140, background: 'linear-gradient(transparent, rgba(5,217,232,0.08), transparent)'}} />
    </AbsoluteFill>
  );
};

const GlitchReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const items = spec.items as {line: string; label: string; problem?: string; src: string; save: number; h?: number}[];
  const hk = spec.hook;
  const gold = N.mustard;
  return (
    <AbsoluteFill>
      <GlitchBG />
      {/* hook: WAIT! -> CYBER WEEK -> UP TO 50% OFF */}
      <Show from={0} to={T(d, hk.cyberAt)}>
        <GlitchText text="WAIT!" at={0.0} size={300} y={620} color="#ffffff" burst={0.5} />
        {[...Array(6)].map((_, i) => {
          const it = items[i % items.length];
          const on = Math.floor(frame / 4) % items.length === i;
          return on ? <Img key={i} src={src(it.src)} style={{position: 'absolute', left: 540, top: 330, height: 260, transform: 'translateX(-50%)', opacity: 0.35, filter: 'grayscale(1) contrast(1.4)'}} /> : null;
        })}
      </Show>
      <Show from={T(d, hk.cyberAt)} to={T(d, hk.upAt)}>
        <Kinetic text="CYBER WEEK" at={T(d, hk.cyberAt)} y={560} size={210} color="#ffffff" />
        <Kinetic text="JUST DROPPED" at={T(d, hk.cyberAt) + 0.35} y={800} size={110} color={gold} />
      </Show>
      <Show from={T(d, hk.upAt)} to={T(d, [items[0].line])}>
        <GlitchText text="UP TO" at={T(d, hk.upAt)} size={130} y={420} color="#ffffff" />
        <GlitchText text="50%" at={T(d, hk.upAt) + 0.15} size={380} y={560} color={gold} burst={0.6} />
        <GlitchText text="OFF" at={T(d, hk.upAt) + 0.3} size={200} y={950} color="#ffffff" />
      </Show>
      {/* category list */}
      {items.map((it, i) => {
        const a = T(d, [it.line]);
        const b = i + 1 < items.length ? T(d, [items[i + 1].line]) : end;
        const sAt = T(d, [it.line, '$']);
        return (
          <Show key={it.line} from={a} to={b}>
            {(() => {
              const sol = it.problem ? T(d, [it.line, it.label.toLowerCase().slice(0, 3)]) : a;
              return (
                <>
                  {it.problem && t < sol && <GlitchText text={it.problem.toUpperCase().replace(' ', '\n')} at={a} size={Math.min(170, Math.floor(1250 / Math.max(...it.problem.split(' ').map((w) => w.length))))} y={560} color="#ff4d6d" burst={0.3} />}
                  {t >= sol && <Kinetic text={it.label.toUpperCase()} at={sol} y={410} size={Math.min(130, Math.floor(1750 / it.label.length))} color="#ffffff" stagger={0.025} />}
                  {t >= sol && <Punch at={sol} to={1.1}><GlitchProd p={it.src} at={sol + 0.03} h={it.h ?? 560} /></Punch>}
                </>
              );
            })()}
            <div style={{position: 'absolute', top: 1085, width: '100%', textAlign: 'center', zIndex: 33}}>
              {t >= sAt && (
                <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, transform: `scale(${slam(frame, sAt, 1.6 + i * 0.15).s}) rotate(${-2 - i}deg)`, opacity: slam(frame, sAt).o, background: gold, color: '#050b07', fontFamily: FONT.display, fontSize: 84, padding: '6px 34px 10px', boxShadow: '8px 8px 0 #ff2a6d'}}>
                  SAVE UP TO <Odo value={it.save} at={sAt} h={96} />
                </div>
              )}
            </div>
          </Show>
        );
      })}
      <Scan />
      <Grain amount={0.08} />
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 50, weight: 800, color: '#ffffff', active: gold, bg: 'rgba(5,11,7,0.85)', y: 1236, radius: 6}} />
      <EndCard at={end} theme={{bg: '#050b07', fg: '#ffffff', accent: gold, btnBg: gold, btnFg: '#050b07', logo: 'white', bgNode: <GlitchBG />}} kicker="Cyber Week only · up to" big="50% OFF" sub="Shop the deals" products={spec.endProducts} />
    </AbsoluteFill>
  );
};
const GlitchProd: React.FC<{p: string; at: number; h: number}> = ({p, at, h}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < at) return null;
  const k = t - at < 0.4 ? 1 - (t - at) / 0.4 : 0;
  const s = sp(frame, at, {damping: 12, stiffness: 200, mass: 0.6});
  const style = (dx: number, f: string, op = 1): React.CSSProperties => ({position: 'absolute', left: 540 + dx, top: 530, height: h, maxWidth: 820, objectFit: 'contain', transform: `translateX(-50%) scale(${0.8 + 0.2 * s})`, filter: f, opacity: op, zIndex: 25});
  return (
    <>
      {k > 0 && <Img src={src(p)} style={style(-28 * k, 'drop-shadow(0 0 0 #ff2a6d) hue-rotate(-60deg) saturate(3)', 0.6 * k)} />}
      {k > 0 && <Img src={src(p)} style={style(28 * k, 'hue-rotate(150deg) saturate(3)', 0.6 * k)} />}
      <Img src={src(p)} style={{...style(0, 'drop-shadow(0 0 40px rgba(46,204,113,0.45))'), clipPath: k > 0 ? `inset(0 0 ${Math.round(random(`k${frame}`) * 30 * k)}% 0)` : undefined}} />
    </>
  );
};

// ---------- 2. SPLIT ----------
const SplitReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const A = spec.a, B = spec.b;
  const aT = T(d, ['a']), bT = T(d, ['b']), askT = T(d, ['ask']), offT = T(d, ['offer']);
  const pink = '#F7D6DA', mint = '#D3EEDF', ink = '#2B1E2F', red = '#E2405B', green = N.forest;
  const pa = interpolate(frame, [fr(aT), fr(aT + 0.4)], [0, 1], cl);
  const pb = interpolate(frame, [fr(bT), fr(bT + 0.4)], [0, 1], cl);
  const merge = interpolate(frame, [fr(offT), fr(offT + 0.4)], [0, 1], cl);
  const wob = Math.sin(t * 3) * 1.2;
  return (
    <AbsoluteFill style={{background: '#FFF8EF'}}>
      {/* hook: empty corner */}
      <Show from={0} to={aT}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <line x1={140} y1={1180} x2={540} y2={980} stroke="#C9B9A6" strokeWidth={10} strokeLinecap="round" />
          <line x1={540} y1={980} x2={940} y2={1180} stroke="#C9B9A6" strokeWidth={10} strokeLinecap="round" />
          <line x1={540} y1={980} x2={540} y2={360} stroke="#C9B9A6" strokeWidth={10} strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', left: 540, top: 640, transform: `translateX(-50%) translateY(${Math.sin(t * 5) * 18}px) scale(${sp(frame, 0.3)})`, fontFamily: 'Fredoka', fontWeight: 700, fontSize: 320, color: red}}>?</div>
        <Pill text="POV" at={0.05} x={90} y={300} bg={ink} color="#fff" size={44} font="Fredoka" />
        <div style={{position: 'absolute', top: 380, width: '100%', textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 92, color: ink, lineHeight: 1.05, transform: `scale(${slam(frame, 0, 1.5).s})`}}>December…<br />and no tree yet?</div>
      </Show>
      {t >= aT && t < bT && <div style={{position: 'absolute', left: 810, top: 640, transform: 'translateX(-50%)', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 260, color: 'rgba(43,30,47,0.12)'}}>B?</div>}
      {/* panels */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 540 + (1 - merge) * 0, height: 1920, background: pink, transform: `translateX(${(pa - 1) * 560}px)`, clipPath: `polygon(0 0, ${100 + wob}% 0, ${100 - wob}% 100%, 0 100%)`}} />
      <div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, background: mint, transform: `translateX(${(1 - pb) * 560}px)`}} />
      {t >= aT && t < offT + 0.4 && (
        <div style={{opacity: 1 - merge}}>
          <div style={{position: 'absolute', left: 270, top: 260, transform: `translateX(-50%) scale(${sp(frame, aT) * (t >= askT && Math.floor(t * 2.5) % 2 === 0 ? 1.12 : 1)})`, fontFamily: 'Fredoka', fontWeight: 700, fontSize: 200, color: red, lineHeight: 1.1, zIndex: 30, padding: '0 20px'}}>A</div>
          <Cut p={A.src} x={270} y={480} h={A.h ?? 720} at={aT + 0.1} from="left" />
          {A.chips.map((c: any, i: number) => <Pill key={c.text} text={c.text} at={T(d, c.at)} x={270} y={930 + i * 86} bg="#fff" color={ink} size={38} font="Fredoka" center rot={i % 2 ? 3 : -3} />)}
        </div>
      )}
      {t >= bT && t < offT + 0.4 && (
        <div style={{opacity: 1 - merge}}>
          <div style={{position: 'absolute', left: 810, top: 260, transform: `translateX(-50%) scale(${sp(frame, bT) * (t >= askT && Math.floor(t * 2.5) % 2 === 1 ? 1.12 : 1)})`, fontFamily: 'Fredoka', fontWeight: 700, fontSize: 200, color: green, lineHeight: 1.1, zIndex: 30, padding: '0 20px'}}>B</div>
          <Cut p={B.src} x={810} y={480} h={B.h ?? 720} at={bT + 0.1} from="right" />
          {B.chips.map((c: any, i: number) => <Pill key={c.text} text={c.text} at={T(d, c.at)} x={810} y={930 + i * 86} bg="#fff" color={ink} size={38} font="Fredoka" center rot={i % 2 ? -3 : 3} />)}
        </div>
      )}
      {/* VS badge + ask */}
      {t >= bT && t < offT && (
        <div style={{position: 'absolute', left: 540, top: 600, transform: `translate(-50%,-50%) scale(${sp(frame, bT + 0.3)}) rotate(${Math.sin(t * 4) * 6}deg)`, width: 150, height: 150, borderRadius: 999, background: ink, color: '#fff', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '8px solid #fff', zIndex: 45}}>VS</div>
      )}
      {t >= askT && t < offT && (
        <div style={{position: 'absolute', left: 540, top: 760, transform: `translateX(-50%) scale(${sp(frame, askT)}) rotate(-2deg)`, background: '#fff', borderRadius: 34, padding: '24px 40px', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 70, color: ink, boxShadow: '0 16px 40px rgba(0,0,0,0.2)', zIndex: 46, whiteSpace: 'nowrap', textAlign: 'center'}}>A or B? <span style={{color: red}}>Comment</span> 👇</div>
      )}
      {/* offer */}
      {t >= offT && (
        <AbsoluteFill style={{background: `linear-gradient(90deg, ${pink} 50%, ${mint} 50%)`, opacity: merge}}>
          <Cut p={A.src} x={330} y={760} h={520} at={offT + 0.05} rot={-4} />
          <Cut p={B.src} x={750} y={760} h={520} at={offT + 0.12} rot={4} />
          <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, color: ink, fontSize: 64, transform: `scale(${sp(frame, offT)})`}}>Cyber Week · up to</div>
          <div style={{position: 'absolute', top: 370, width: '100%', textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, color: red, fontSize: 230, lineHeight: 1, transform: `scale(${sp(frame, offT + 0.1)})`}}>50% OFF</div>
          {t >= T(d, ['offer', '$']) && <div style={{position: 'absolute', left: 540, top: 630, transform: `translateX(-50%) scale(${slam(frame, T(d, ['offer', '$']), 1.7).s})`, background: ink, color: '#fff', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 56, padding: '10px 34px', borderRadius: 999, whiteSpace: 'nowrap', display: 'flex', gap: 14, alignItems: 'center'}}>Save up to <Odo value={spec.save} at={T(d, ['offer', '$'])} h={64} /> on trees</div>}
        </AbsoluteFill>
      )}
      <Grain amount={0.05} vignette={0.18} />
      <Captions lines={d.lines} hideFrom={end} style={{font: 'Fredoka', size: 50, weight: 700, color: ink, active: red, bg: '#ffffff', y: 1236, radius: 26}} />
      <EndCard at={end} theme={{bg: `linear-gradient(90deg, ${pink} 50%, ${mint} 50%)`, fg: ink, accent: red, btnBg: ink, btnFg: '#fff', logo: 'full', font: 'Fredoka'}} kicker="Cyber Week · up to" big="50% OFF" sub="Order early for Christmas" products={spec.endProducts} />
    </AbsoluteFill>
  );
};

// ---------- 3. BEFORE / AFTER ----------
const Stamp: React.FC<{text: string; at: number; x: number; y: number; color: string; rot?: number; size?: number}> = ({text, at, x, y, color, rot = -8, size = 64}) => {
  const frame = useCurrentFrame();
  if (frame < fr(at)) return null;
  const s = sp(frame, at, {damping: 8, stiffness: 320, mass: 0.5});
  return <div style={{position: 'absolute', left: x, top: y, zIndex: 40, transform: `rotate(${rot}deg) scale(${2 - s})`, opacity: Math.min(1, s * 1.5), border: `7px solid ${color}`, color, fontFamily: FONT.display, fontSize: size, padding: '4px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', letterSpacing: 3}}>{text}</div>;
};
const BAReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const spots = spec.spots as {line: string; label: string; before?: string; after?: string; src: string; wipeAt: At; px: number; py: number; ph: number; chips: {text: string; at: At}[]}[];
  const offT = T(d, ['offer']);
  const red = '#D7263D', green = N.forest;
  return (
    <AbsoluteFill style={{background: N.cream}}>
      {/* hook: 3 before tiles */}
      <Show from={0} to={T(d, [spots[0].line])}>
        {spots.map((s, i) => {
          const at = 0.1 + i * 0.25;
          const k = sp(frame, at);
          return (
            <div key={i} style={{position: 'absolute', left: 60 + i * 330, top: 520, width: 300, height: 520, borderRadius: 24, overflow: 'hidden', transform: `translateY(${(1 - k) * 600}px) rotate(${(i - 1) * 4}deg)`, boxShadow: '0 20px 40px rgba(0,0,0,0.25)', background: '#ddd'}}>
              {s.before ? <Img src={src(s.before)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7)'}} /> : null}
              <div style={{position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: FONT.body, fontWeight: 800, fontSize: 34, textAlign: 'center', padding: 8}}>{s.label}</div>
            </div>
          );
        })}
        <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', fontFamily: FONT.display, fontSize: 104, color: N.ink, transform: `scale(${sp(frame, 0.05)})`, lineHeight: 1}}>STOP SCROLLING</div>
        <div style={{position: 'absolute', top: 410, width: '100%', textAlign: 'center', fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 700, fontSize: 70, color: red, opacity: sp(frame, 0.6)}}>3 messy spots…</div>
        <Stamp text="FIXED." at={T(d, ['hook', 'fixed'])} x={330} y={1080} color={green} size={110} />
      </Show>
      {spots.map((s, i) => {
        const a = T(d, [s.line]);
        const b = i + 1 < spots.length ? T(d, [spots[i + 1].line]) : offT;
        const w = T(d, s.wipeAt);
        const fw = frame - fr(w); const p = fw < 0 ? 0 : fw < 12 ? 0.86 * (1 - Math.pow(1 - fw / 12, 3)) + 0.04 * Math.sin(Math.PI * fw / 12) : fw < 30 ? 0.86 : Math.min(1, 0.86 + 0.14 * ease(Math.min(1, (fw - 30) / 24)));
        const shake = p < 0.01 ? Math.sin(frame * 1.7) * 3 : 0;
        return (
          <Show key={s.line} from={a} to={b}>
            <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
              {s.before ? <Img src={src(s.before)} style={{width: 1080, height: 1920, objectFit: 'cover', filter: 'saturate(0.75) brightness(0.95)'}} /> : <AbsoluteFill style={{background: '#cfc6b8'}} />}
            </AbsoluteFill>
            <AbsoluteFill style={{clipPath: `inset(0 ${100 - p * 100}% 0 0)`}}>
              {s.after ? <Img src={src(s.after)} style={{width: 1080, height: 1920, objectFit: 'cover', filter: 'saturate(1.08) brightness(1.04)'}} /> : <AbsoluteFill style={{background: N.cream}} />}
              <Img src={src(s.src)} style={{position: 'absolute', left: s.px, top: s.py, height: s.ph, transform: 'translateX(-50%)', filter: 'drop-shadow(0 26px 22px rgba(0,0,0,0.35))'}} />
            </AbsoluteFill>
            {p > 0 && p < 1 && <div style={{position: 'absolute', left: p * 1080 - 6, top: 0, width: 12, height: 1920, background: '#fff', boxShadow: '0 0 30px rgba(255,255,255,0.9)', zIndex: 30}} />}
            <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.45), transparent 30%, transparent 62%, rgba(0,0,0,0.35))'}} />
            <div style={{position: 'absolute', left: 70, top: 290, fontFamily: FONT.display, fontSize: 84, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.5)', transform: `translateX(${(1 - sp(frame, a)) * -600}px)`}}>{`${i + 1}. ${s.label}`}</div>
            {p < 0.5 ? <Stamp text="BEFORE" at={a + 0.15} x={680} y={300} color={red} /> : <Stamp text="AFTER" at={w + 0.25} x={700} y={300} color={green} rot={6} />}
            {s.chips.map((c, j) => <Pill key={c.text} text={c.text} at={T(d, c.at)} x={70} y={1020 + j * 92} bg={N.mustard} color={N.forestDeep} size={42} rot={j % 2 ? 2 : -2} />)}
          </Show>
        );
      })}
      {t >= offT && (
        <AbsoluteFill style={{background: N.forest}}>
          <div style={{position: 'absolute', top: 300, width: '100%', textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, letterSpacing: 4, color: N.cream, fontSize: 46}}>CYBER WEEK · UP TO</div>
          <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', fontFamily: FONT.display, color: N.mustard, fontSize: 220, lineHeight: 1, transform: `scale(${sp(frame, offT)})`}}>50% OFF</div>
          {spec.saves.map((s: any, i: number) => (
            <div key={i} style={{position: 'absolute', left: i ? 560 : 80, top: 640, width: 440, height: 430, borderRadius: 30, background: N.cream, transform: `translateY(${(1 - sp(frame, T(d, s.at))) * 900}px) rotate(${i ? 2 : -2}deg)`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'}}>
              <Img src={src(s.src)} style={{position: 'absolute', left: 220, top: 30, height: 230, transform: 'translateX(-50%)', objectFit: 'contain', maxWidth: 380}} />
              <div style={{position: 'absolute', top: 270, width: '100%', textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 32, color: N.ink}}>{s.label}</div>
              <div style={{position: 'absolute', top: 315, width: '100%', display: 'flex', justifyContent: 'center', gap: 14, fontFamily: FONT.display, fontSize: 70, color: N.forest}}>UP TO <Odo value={s.save} at={T(d, s.at)} h={84} /></div>
            </div>
          ))}
        </AbsoluteFill>
      )}
      <Grain amount={0.06} vignette={0.25} />
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 50, weight: 800, color: N.ink, active: N.forest, bg: N.cream, y: 1236}} />
      <EndCard at={end} theme={{bg: N.cream, fg: N.ink, accent: N.forest, btnBg: N.forest, btnFg: N.cream, logo: 'full'}} kicker="Cyber Week only · up to" big="50% OFF" sub="Storage & kitchen" products={spec.endProducts} />
    </AbsoluteFill>
  );
};

// ---------- 4. GTA-STYLE HUD (original art, no game marks) ----------
const City: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.6;
  const bld = [...Array(26)].map((_, i) => ({x: i * 48 - 60, w: 40 + random(`w${i}`) * 50, h: 160 + random(`h${i}`) * 520}));
  const palm = (x: number, s: number) => (
    <g transform={`translate(${x},1420) scale(${s})`} fill="#1a0b26">
      <path d="M0 0 C 6 -120, 14 -240, 4 -360 L 16 -360 C 26 -240, 20 -120, 14 0 Z" />
      {[...Array(7)].map((_, i) => <path key={i} transform={`translate(10,-360) rotate(${-150 + i * 40})`} d="M0 0 C 40 -20, 110 -10, 150 30 C 100 10, 50 8, 0 6 Z" />)}
    </g>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #2b1055 0%, #7a2a8c 30%, #e0557a 55%, #ff9a5a 70%, #ffd27a 80%)'}} />
      <div style={{position: 'absolute', left: 540, top: 900, width: 520, height: 520, borderRadius: 999, transform: 'translateX(-50%)', background: 'linear-gradient(#ffe58a, #ff7a59)', boxShadow: '0 0 120px rgba(255,170,90,0.8)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', transform: `translateX(${-(drift % 48)}px)`}}>
        {bld.map((b, i) => <rect key={i} x={b.x} y={1420 - b.h} width={b.w} height={b.h} fill={i % 3 ? '#2a1238' : '#341446'} />)}
        {bld.map((b, i) => [...Array(Math.floor(b.h / 60))].map((_, j) => (random(`l${i}${j}`) > 0.6 ? <rect key={`${i}-${j}`} x={b.x + 8} y={1420 - b.h + 20 + j * 60} width={8} height={14} fill="#ffcf6e" opacity={0.8} /> : null)))}
      </svg>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {palm(80, 1.2)}
        {palm(930, 1.05)}
        <rect x={0} y={1420} width={1080} height={500} fill="#150822" />
        {[...Array(8)].map((_, i) => <rect key={i} x={((i * 180 - frame * 14) % 1440) - 180} y={1520} width={90} height={12} fill="#ffcf6e" opacity={0.6} />)}
      </svg>
    </AbsoluteFill>
  );
};
const OUT = (c: string, w = 6) => ({WebkitTextStroke: `${w}px ${c}`, paintOrder: 'stroke fill'} as React.CSSProperties);
const Hud: React.FC<{money: {to: number; at: number} | null; stars: number}> = ({money, stars}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <>
      <div style={{position: 'absolute', right: 160, top: 290, textAlign: 'right', zIndex: 60}}>
        <div style={{fontFamily: 'Bebas Neue', fontSize: 92, color: '#7CF27C', letterSpacing: 2, ...OUT('#08210b', 8)}}>{money ? <Roll to={money.to} at={money.at} dur={0.6} /> : '$0'}</div>
        <div style={{display: 'flex', gap: 6, justifyContent: 'flex-end'}}>
          {[...Array(5)].map((_, i) => {
            const on = i < stars;
            const blink = on && Math.floor(t * 6) % 2 === 0 && i === stars - 1;
            return <svg key={i} width={52} height={52} viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.6 4.3L18.5 21 12 16.7 5.5 21l2.1-7.7L2 9h7z" fill={on ? (blink ? '#ffffff' : '#f7e463') : 'rgba(0,0,0,0.35)'} stroke="#111" strokeWidth={1.6} /></svg>;
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 80, top: 300, width: 220, height: 220, borderRadius: 999, background: 'rgba(20,40,30,0.75)', border: '6px solid #111', overflow: 'hidden', zIndex: 60}}>
        <svg width={220} height={220}>
          {[...Array(6)].map((_, i) => <line key={i} x1={0} y1={i * 44} x2={220} y2={i * 44 - 30} stroke="#5f7d6a" strokeWidth={6} />)}
          <path d={`M110 110 L ${110 + 120 * Math.cos(t * 3)} ${110 + 120 * Math.sin(t * 3)} A 120 120 0 0 1 ${110 + 120 * Math.cos(t * 3 + 0.6)} ${110 + 120 * Math.sin(t * 3 + 0.6)} Z`} fill="rgba(124,242,124,0.25)" />
          <circle cx={150} cy={70} r={10} fill="#f7e463" />
          <polygon points="110,96 122,124 110,116 98,124" fill="#fff" stroke="#111" strokeWidth={2} />
        </svg>
      </div>
    </>
  );
};
const GtaReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const items = spec.items as {line: string; label: string; problem?: string; src: string; save: number; color: string}[];
  const objT = T(d, ['obj']), passT = T(d, ['pass']);
  const passed = T(d, ['pass', 'mission']);
  let money: {to: number; at: number} | null = null;
  let stars = t >= objT ? 1 : 0;
  items.forEach((it, i) => {
    const a = T(d, [it.line, '$']);
    if (t >= a) { money = {to: it.save, at: a}; stars = 2 + i; }
  });
  const bars = interpolate(frame, [0, 8], [0, 1], cl) * (t < objT ? 1 : interpolate(frame, [fr(objT), fr(objT + 0.3)], [1, 0], cl));
  return (
    <AbsoluteFill>
      <City />
      {/* letterbox + mission title */}
      <div style={{position: 'absolute', top: 0, width: '100%', height: 250 * bars, background: '#000', zIndex: 55}} />
      <div style={{position: 'absolute', bottom: 0, width: '100%', height: 250 * bars, background: '#000', zIndex: 55}} />
      <Show from={0} to={objT}>
        <div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 48, letterSpacing: 10, color: '#fff', ...OUT('#000', 6), opacity: sp(frame, T(d, ['hook', 'new']))}}>NEW MISSION UNLOCKED</div>
        <div style={{position: 'absolute', top: 610, width: '100%', textAlign: 'center', fontFamily: 'Bowlby One', fontSize: 150, lineHeight: 0.95, color: '#fbe7a1', fontStyle: 'italic', ...OUT('#000', 14), transform: `scale(${sp(frame, T(d, ['hook', 'cyber']))}) rotate(-3deg)`}}>THE CYBER<br />WEEK HEIST</div>
      </Show>
      {/* objective subtitle box */}
      <Show from={objT} to={T(d, [items[0].line])}>
        <div style={{position: 'absolute', left: 90, top: 620, width: 900, background: 'rgba(0,0,0,0.78)', borderRadius: 10, padding: '28px 34px', fontFamily: FONT.body, fontWeight: 700, fontSize: 58, color: '#fff', lineHeight: 1.2, zIndex: 58, transform: `scale(${sp(frame, objT)})`}}>
          Objective: fix <span style={{color: '#f7e463'}}>holiday chaos</span> before the deals are <span style={{color: '#ff6b6b'}}>gone</span>.
        </div>
      </Show>
      {/* loading-screen art panels */}
      {items.map((it, i) => {
        const a = T(d, [it.line]);
        const b = i + 1 < items.length ? T(d, [items[i + 1].line]) : passT;
        const sAt = T(d, [it.line, '$']);
        const k = sp(frame, a, {damping: 13, stiffness: 150, mass: 0.8});
        const up = t >= sAt ? interpolate(frame, [fr(sAt), fr(sAt + 0.9)], [0, -260], cl) : 0;
        return (
          <Show key={it.line} from={a} to={b}>
            <Punch at={sAt} to={1.06} origin="50% 55%"><div style={{position: 'absolute', left: 120, top: 600, width: 840, height: 680, transform: `rotate(${i % 2 ? 3 : -3}deg) scale(${k})`, background: it.color, border: '12px solid #0d0d0d', boxShadow: '18px 18px 0 rgba(0,0,0,0.6)', overflow: 'hidden', zIndex: 40}}>
              <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(0,0,0,0.22) 3px, transparent 3.5px)', backgroundSize: '22px 22px'}} />
              <div style={{position: 'absolute', inset: 0, background: 'repeating-conic-gradient(from 0deg at 50% 60%, rgba(255,255,255,0.12) 0deg 10deg, transparent 10deg 20deg)'}} />
              <Img src={src(it.src)} style={{position: 'absolute', left: 420, top: 70, height: 560, maxWidth: 700, objectFit: 'contain', transform: 'translateX(-50%)', filter: 'drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(14px 14px 0 rgba(0,0,0,0.6)) contrast(1.15) saturate(1.25)'}} />
            </div></Punch>
            {it.problem && <div style={{position: 'absolute', left: 540, top: 640, transform: `translateX(-50%) scale(${slam(frame, a, 1.8).s}) rotate(-2deg)`, transformOrigin: '50% 50%', zIndex: 66, background: '#c62828', color: '#fff', fontFamily: 'Bebas Neue', fontSize: 84, letterSpacing: 3, padding: '6px 30px 2px', border: '6px solid #000', whiteSpace: 'nowrap'}}>{it.problem.toUpperCase()}</div>}
            <div style={{position: 'absolute', left: 110, top: 455, zIndex: 65, background: '#0d0d0d', color: '#fff', fontFamily: 'Bebas Neue', fontSize: 80, letterSpacing: 4, lineHeight: 1.15, padding: '8px 26px 4px', transform: `rotate(-3deg) translateX(${(1 - k) * -700}px)`}}>{it.label.toUpperCase()}</div>
            {t >= sAt && <div style={{position: 'absolute', left: 540, top: 760 + up * 1.2, transform: 'translateX(-50%)', fontFamily: 'Bebas Neue', fontSize: 110, color: '#7CF27C', ...OUT('#08210b', 10), zIndex: 59, opacity: interpolate(frame, [fr(sAt + 0.6), fr(sAt + 0.9)], [1, 0], cl)}}>+ UP TO ${it.save}</div>}
            {t >= sAt && <div style={{position: 'absolute', left: 540, top: 1150, transform: `translateX(-50%) scale(${sp(frame, sAt + 0.1)})`, background: '#f7e463', color: '#111', fontFamily: FONT.display, fontSize: 64, padding: '6px 28px', border: '6px solid #111', zIndex: 58}}>SAVE UP TO ${it.save}</div>}
          </Show>
        );
      })}
      {/* mission passed */}
      <Show from={passT} to={end}>
        <AbsoluteFill style={{background: 'rgba(0,0,0,0.45)', zIndex: 50}} />
        <div style={{position: 'absolute', top: 560, width: '100%', textAlign: 'center', zIndex: 61, fontFamily: 'Bowlby One', fontSize: 120, color: '#ffffff', ...OUT('#000', 12), transform: `scale(${sp(frame, passT)})`}}>UP TO 50% OFF</div>
        {t >= passed && <div style={{position: 'absolute', top: 760, width: '100%', textAlign: 'center', zIndex: 61, fontFamily: 'Bowlby One', fontStyle: 'italic', fontSize: 150, color: '#f7c948', ...OUT('#000', 14), transform: `scale(${1.6 - 0.6 * sp(frame, passed, {damping: 10, stiffness: 260, mass: 0.6})})`, lineHeight: 0.95}}>MISSION<br />PASSED</div>}
      </Show>
      <Hud money={money} stars={stars} />
      <Grain amount={0.06} vignette={0.3} />
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 52, weight: 800, color: '#ffffff', active: '#f7e463', bg: null, y: 1236, shadow: '0 0 6px #000, 0 0 2px #000, 3px 3px 0 #000'}} />
      <EndCard at={end} theme={{bg: '#120720', fg: '#ffffff', accent: '#f7c948', btnBg: '#7CF27C', btnFg: '#08210b', logo: 'white', font: 'Bowlby One', radius: 8, border: '6px solid #000', bgNode: <AbsoluteFill style={{opacity: 0.35}}><City /></AbsoluteFill>}} kicker="Mission: Cyber Week · up to" big="50% OFF" sub="No masks needed" products={spec.endProducts} />
    </AbsoluteFill>
  );
};

// ---------- 5. UGC host + reveal ----------
const Clip: React.FC<{p: string; from: number; to: number; startFrom?: number; zoom?: number}> = ({p, from, to, startFrom = 0, zoom = 1.0}) => {
  const frame = useCurrentFrame();
  const z = zoom + interpolate(frame, [fr(from), fr(to)], [0, 0.06], cl);
  return (
    <Sequence from={fr(from)} durationInFrames={Math.max(1, fr(to) - fr(from))}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo src={src(p)} muted startFrom={fr(startFrom)} style={{width: 1080, height: 1920, objectFit: 'cover', transform: `scale(${z})`}} />
      </AbsoluteFill>
    </Sequence>
  );
};
const Confetti: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  if (frame < fr(at)) return null;
  const tt = (frame - fr(at)) / FPS;
  return (
    <AbsoluteFill style={{zIndex: 35, pointerEvents: 'none'}}>
      {[...Array(60)].map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2, v = 500 + random(`v${i}`) * 900;
        const x = 540 + Math.cos(a) * v * tt, y = 760 + Math.sin(a) * v * tt + 900 * tt * tt;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 18, height: 30, background: ['#E2405B', N.mustard, N.forest, '#fff', '#5BC0EB'][i % 5], transform: `rotate(${tt * 720 + i * 20}deg)`, opacity: Math.max(0, 1 - tt / 1.6)}} />;
      })}
    </AbsoluteFill>
  );
};
const UgcReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const revT = T(d, spec.revealAt), featT = T(d, ['feat']), offT = T(d, ['offer']);
  const c = spec.clips;
  return (
    <AbsoluteFill style={{background: '#f4ece2'}}>
      <Clip p={c.hook} from={0} to={T(d, ['reveal'])} />
      <Clip p={c.bow} from={T(d, ['reveal'])} to={revT} startFrom={c.bowStart ?? 0} />
      {/* reveal */}
      <Show from={revT} to={offT}>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #fff6e8, #f3d9c4)'}} />
        <AbsoluteFill style={{background: 'repeating-conic-gradient(from 0deg at 50% 45%, rgba(226,64,91,0.10) 0deg 8deg, transparent 8deg 16deg)', transform: `rotate(${t * 12}deg) scale(1.6)`}} />
        <Punch at={revT} to={1.08}><Cut p={spec.product} x={540} y={430} h={720} at={revT} /></Punch>
        <Confetti at={revT} />
        <Pill text="3-in-1" at={revT + 0.3} x={110} y={330} bg="#E2405B" color="#fff" size={60} rot={-6} />
        {spec.chips.map((ch: any, i: number) => <Pill key={ch.text} text={ch.text} at={T(d, ch.at)} x={i % 2 ? 470 : 90} y={1010 + i * 96} bg="#fff" color={N.ink} size={44} rot={i % 2 ? 3 : -3} />)}
      </Show>
      <Clip p={c.react} from={offT} to={end} startFrom={c.reactStart ?? 0} />
      <Show from={offT} to={end}>
        <AbsoluteFill style={{background: 'linear-gradient(transparent 55%, rgba(0,0,0,0.5))'}} />
        <div style={{position: 'absolute', left: 540, top: 330, transform: `translateX(-50%) scale(${sp(frame, offT)}) rotate(-4deg)`, background: '#E2405B', color: '#fff', fontFamily: FONT.display, fontSize: 96, padding: '10px 40px', borderRadius: 20, whiteSpace: 'nowrap', zIndex: 40}}>UP TO 50% OFF</div>
        {t >= T(d, ['offer', '$']) && <div style={{position: 'absolute', left: 540, top: 490, transform: `translateX(-50%) scale(${slam(frame, T(d, ['offer', '$']), 1.7).s})`, background: '#fff', color: N.ink, fontFamily: FONT.display, fontSize: 52, padding: '10px 32px', borderRadius: 999, whiteSpace: 'nowrap', display: 'flex', gap: 12, alignItems: 'center', zIndex: 41}}>Save up to <Odo value={spec.save} at={T(d, ['offer', '$'])} h={62} /> on ride-ons</div>}
        <Img src={src(spec.product)} style={{position: 'absolute', right: 140, top: 900, height: 280, transform: `scale(${sp(frame, offT + 0.3)})`, filter: 'drop-shadow(0 0 0 #fff) drop-shadow(0 12px 18px rgba(0,0,0,0.4))', zIndex: 39}} />
      </Show>
      {/* hook sticker */}
      <Show from={0} to={T(d, ['reveal'])}>
        <div style={{position: 'absolute', left: 540, top: 330, transform: `translateX(-50%) scale(${sp(frame, 0.05)}) rotate(-2deg)`, background: '#fff', color: N.ink, fontFamily: FONT.body, fontWeight: 800, fontSize: 60, padding: '16px 34px', borderRadius: 18, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', zIndex: 40}}>Grandparents, <span style={{color: '#E2405B'}}>this one’s for you</span> 🎁</div>
      </Show>
      <Grain amount={0.05} vignette={0.25} />
      <Pill text="AI host" at={0.2} x={90} y={1140} bg="rgba(0,0,0,0.45)" color="#fff" size={28} font={FONT.body} />
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 54, weight: 800, color: '#ffffff', active: '#FFD84D', bg: null, y: 1236, shadow: '0 0 8px #000, 3px 3px 0 #000, -2px -2px 0 #000'}} />
      <EndCard at={end} theme={{bg: '#FFF4E6', fg: N.ink, accent: '#E2405B', btnBg: '#E2405B', btnFg: '#fff', logo: 'full'}} kicker="Cyber Week · up to" big="50% OFF" sub="Order early for Christmas" products={spec.endProducts} />
    </AbsoluteFill>
  );
};

// ---------- 6. INFOGRAPHIC ----------
const Icon: React.FC<{k: string}> = ({k}) => {
  const s = {stroke: N.forest, strokeWidth: 7, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round'} as const;
  if (k === 'plan') return <svg width={120} height={120} viewBox="0 0 100 100"><path d="M50 10 L84 22 V48 C84 70 68 84 50 92 C32 84 16 70 16 48 V22 Z" {...s} /><path d="M36 50 L46 60 L66 40" {...s} /></svg>;
  if (k === 'mail') return <svg width={120} height={120} viewBox="0 0 100 100"><rect x={12} y={24} width={76} height={54} rx={8} {...s} /><path d="M14 28 L50 56 L86 28" {...s} /></svg>;
  return <svg width={120} height={120} viewBox="0 0 100 100"><rect x={22} y={10} width={56} height={80} rx={8} {...s} /><path d="M34 32 H66 M34 48 H66 M34 64 H52" {...s} /><circle cx={70} cy={74} r={16} fill={N.mustard} stroke="none" /><path d="M63 74 H77" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></svg>;
};
const InfoReel: React.FC<{spec: any; d: VideoData}> = ({spec, d}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const end = d.endCardStart;
  const q1 = T(d, ['q1']), offT = T(d, ['offer']), closeT = T(d, ['close']);
  const rows = spec.rows as {line: string; icon: string; title: string; sub: string}[];
  return (
    <AbsoluteFill style={{background: N.cream}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(31,74,50,0.10) 2px, transparent 2.5px)`, backgroundSize: '34px 34px'}} />
      {/* hook: Maya clip in a card */}
      <Show from={0} to={q1 + 0.3}>
        <div style={{position: 'absolute', left: 90, top: 280, width: 900, height: 1060, borderRadius: 40, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', transform: `scale(${t < q1 ? 1 : interpolate(frame, [fr(q1), fr(q1 + 0.3)], [1, 0.2], cl)})`, transformOrigin: '88% 8%'}}>
          <Sequence durationInFrames={fr(q1 + 0.3)}><OffthreadVideo src={src(spec.clips.a)} muted style={{width: 900, height: 1600, objectFit: 'cover', marginTop: -200}} /></Sequence>
          <div style={{position: 'absolute', bottom: 0, width: '100%', padding: '30px 40px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', color: '#fff', fontFamily: FONT.display, fontSize: 72, lineHeight: 1.05}}>Before your<br /><span style={{color: N.mustard}}>benefits reset…</span></div>
        </div>
        <Pill text="YEAR-END CHECK" at={0.1} x={540} y={250} bg={N.forest} color={N.cream} size={44} center z={45} />
      </Show>
      {/* checklist */}
      <Show from={q1} to={offT}>
        <div style={{position: 'absolute', top: 290, left: 80, fontFamily: FONT.display, fontSize: 76, color: N.ink, transform: `translateX(${(1 - sp(frame, q1)) * -700}px)`}}>Year-end checklist</div>
        {rows.map((r, i) => {
          const a = T(d, [r.line]);
          const k = sp(frame, a, {damping: 13, stiffness: 170, mass: 0.7});
          const tick = interpolate(frame, [fr(a + 0.5), fr(a + 0.8)], [0, 1], cl);
          return (
            <div key={i} style={{position: 'absolute', left: 80, top: 420 + i * 255, width: 920, height: 225, borderRadius: 30, background: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', transform: `translateX(${(1 - k) * 1100}px)`, opacity: t >= a ? 1 : 0}}>
              <div style={{position: 'absolute', left: 30, top: 50}}><Icon k={r.icon} /></div>
              <div style={{position: 'absolute', left: 175, top: 38, width: 600, fontFamily: FONT.body, fontWeight: 800, fontSize: 46, color: N.ink, lineHeight: 1.1}}>{r.title}</div>
              <div style={{position: 'absolute', left: 175, top: 140, width: 620, fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: '#5b6b60'}}>{r.sub}</div>
              <div style={{position: 'absolute', right: 34, top: 66, width: 92, height: 92, borderRadius: 999, border: `6px solid ${N.forest}`, background: tick > 0.5 ? N.forest : 'transparent'}}>
                <svg width={80} height={80} viewBox="0 0 80 80"><path d="M20 42 L34 56 L60 28" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={70} strokeDashoffset={70 * (1 - tick)} /></svg>
              </div>
            </div>
          );
        })}
      </Show>
      {/* offer */}
      <Show from={offT} to={end}>
        <AbsoluteFill style={{background: N.forest}} />
        <div style={{position: 'absolute', top: 290, width: '100%', textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: N.cream}}>JOBST · SIGVARIS</div>
        <Cut p={spec.socks[0]} x={330} y={380} h={560} at={offT + 0.05} rot={-6} />
        <Cut p={spec.socks[1]} x={750} y={380} h={560} at={offT + 0.15} rot={6} />
        <div style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center', fontFamily: FONT.display, color: N.mustard, fontSize: 108, transform: `scale(${sp(frame, T(d, ['offer', '$']))})`}}><span style={{display: 'inline-flex', gap: 16}}>SAVE UP TO <Odo value={spec.save} at={T(d, ['offer', '$'])} h={124} /></span></div>
        {t >= closeT && <div style={{position: 'absolute', left: 90, top: 1100, width: 900, textAlign: 'center', fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: N.cream, opacity: sp(frame, closeT)}}>Backorders may happen during the year-end rush. Order early.</div>}
        <div style={{position: 'absolute', left: 80, top: 1160, width: 920, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: 'rgba(251,246,236,0.8)'}}>May be covered by your health plan. Check with your provider.</div>
      </Show>
      {/* host picture-in-picture during the checklist */}
      <Show from={q1 + 0.2} to={offT}>
        <div style={{position: 'absolute', right: 60, top: 230, width: 190, height: 190, borderRadius: 999, overflow: 'hidden', border: `7px solid ${N.forest}`, zIndex: 50, transform: `scale(${sp(frame, q1 + 0.2)})`, boxShadow: '0 10px 24px rgba(0,0,0,0.25)'}}>
          <Sequence from={fr(q1 + 0.2)} durationInFrames={Math.max(1, fr(offT) - fr(q1 + 0.2))}><OffthreadVideo src={src(spec.clips.b)} muted style={{width: 190, height: 338, objectFit: 'cover', marginTop: -40}} /></Sequence>
        </div>
      </Show>
      <Captions lines={d.lines} hideFrom={end} style={{font: FONT.body, size: 46, weight: 800, color: N.ink, active: N.forest, bg: '#ffffff', y: 1236}} maxChars={30} />
      <EndCard at={end} theme={{bg: N.cream, fg: N.ink, accent: N.forest, btnBg: N.forest, btnFg: N.cream, logo: 'full'}} kicker="Use your benefits before year end" big={`UP TO $${spec.save}`} sub="off JOBST & Sigvaris" note="May be covered by your health plan. Check with your provider." products={spec.endProducts} />
    </AbsoluteFill>
  );
};

// ---------- router ----------
export const makeDec = (spec: any, d: VideoData) => {
  const C = {glitch: GlitchReel, split: SplitReel, ba: BAReel, gta: GtaReel, ugc: UgcReel, info: InfoReel}[spec.style as string] as React.FC<{spec: any; d: VideoData}>;
  const Comp: React.FC = () => <C spec={spec} d={d} />;
  return Comp;
};

/** Cover still: the end-card look with the hook headline. */
export const makeDecCover = (spec: any) => {
  const Comp: React.FC = () => {
    const c = spec.cover;
    return (
      <AbsoluteFill style={{background: c.bg}}>
        {c.photo && <Img src={src(c.photo)} style={{width: 1080, height: 1920, objectFit: 'cover', opacity: c.photoOpacity ?? 1}} />}
        {c.products?.map((p: string, i: number) => p && (
          <Img key={i} src={src(p)} style={{position: 'absolute', left: [300, 540, 780][i] ?? 540, top: 760, height: i === 1 ? 640 : 520, transform: 'translateX(-50%)', objectFit: 'contain', filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.35))'}} />
        ))}
        <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', fontFamily: c.font ?? FONT.display, fontSize: c.size ?? 140, lineHeight: 0.95, color: c.color, ...(c.stroke ? OUT(c.stroke, 12) : {}), whiteSpace: 'pre'}}>{c.title}</div>
        <div style={{position: 'absolute', left: 540, top: 1380, transform: 'translateX(-50%) rotate(-3deg)', background: c.badgeBg, color: c.badgeFg, fontFamily: FONT.display, fontSize: 84, padding: '10px 40px', whiteSpace: 'nowrap'}}>UP TO 50% OFF</div>
        <Img src={src(c.logo === 'white' ? LOGO.white : LOGO.full)} style={{position: 'absolute', left: 540, top: 1540, height: 80, transform: 'translateX(-50%)'}} />
      </AbsoluteFill>
    );
  };
  return Comp;
};
