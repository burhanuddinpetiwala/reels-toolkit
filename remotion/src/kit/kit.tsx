// November 2026 deal-Reel kit: forest green / cream / mustard, black only for the small phase tag.
import {FONT, BRAND} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, ease, easeInOut, f, PaperGrain} from '../components/core';
import {tornClip} from '../components/collage';

export {N} from '../theme';
import {N} from '../theme';

export type Phase = string;


const useSp = (at: number, cfg: any = {damping: 12, stiffness: 170, mass: 0.7}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - f(at), fps, config: cfg});
};

/** Cream paper page with grain. */
export const Page: React.FC<{color?: string; texture?: boolean; children?: React.ReactNode}> = ({color = N.cream, texture = true, children}) => (
  <AbsoluteFill style={{background: color}}>
    {texture && color === N.cream && <Img src={staticFile('img/paper_cream.jpg')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9}} />}
    {children}
    <PaperGrain opacity={0.16} />
  </AbsoluteFill>
);

/** Small black phase tag, top-left inside the safe area. */
export const PhaseTag: React.FC<{phase: Phase; at?: number; out?: number; dark?: boolean}> = ({phase, at = 0, out, dark}) => {
  const frame = useCurrentFrame();
  const s = useSp(at, {damping: 14, stiffness: 160});
  if (frame < f(at)) return null;
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.25)], [1, 0], clamp) : 1;
  const blink = Math.floor((frame - f(at)) / 15) % 2 === 0 ? 1 : 0.35;
  return (
    <div style={{position: 'absolute', left: 80, top: 282, zIndex: 50, opacity: o, transform: `translateX(${(1 - s) * -260}px)`, display: 'flex', alignItems: 'center', gap: 14, background: dark ? N.cream : N.black, color: dark ? N.black : N.cream, borderRadius: 999, padding: '14px 26px 14px 20px', fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 2.5, textTransform: 'uppercase', boxShadow: '0 6px 14px rgba(0,0,0,0.25)'}}>
      <div style={{width: 16, height: 16, borderRadius: 8, background: N.mustard, opacity: blink}} />
      {phase}
    </div>
  );
};

/** A hanging paper price tag (punched hole + string) that swings in. Content = discount, never a price. */
export const SwingTag: React.FC<{at: number; x: number; y: number; w?: number; color?: string; ink?: string; children: React.ReactNode; rot?: number; out?: number}> = ({at, x, y, w = 560, color = N.mustard, ink = N.forestDeep, children, rot = -6, out}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 6, stiffness: 70, mass: 1}});
  const drop = spring({frame: frame - f(at), fps, config: {damping: 16, stiffness: 160}});
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.3)], [0, 1], {...clamp, easing: ease}) : 0;
  const angle = rot + (1 - s) * 34;
  const h = w * 0.62;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `translateY(${(1 - drop) * -700 + o * 1500}px)`, zIndex: 20}}>
      {/* string */}
      <svg width={8} height={200} style={{position: 'absolute', left: -4, top: -200}}><line x1={4} y1={0} x2={4} y2={200} stroke={N.ink} strokeWidth={3} /></svg>
      <div style={{position: 'absolute', left: -w * 0.08, top: -h / 2, width: w, height: h, transform: `rotate(${angle}deg)`, transformOrigin: `${w * 0.08}px ${h / 2}px`, filter: 'drop-shadow(10px 14px 0 rgba(0,0,0,0.16)) drop-shadow(0 20px 26px rgba(0,0,0,0.22))'}}>
        <div style={{position: 'absolute', inset: 0, background: color, clipPath: `polygon(0 22%, 15% 0, 100% 0, 100% 100%, 15% 100%, 0 78%)`}}>
          <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.35, mixBlendMode: 'multiply'}} />
        </div>
        <div style={{position: 'absolute', left: w * 0.08 - 20, top: h / 2 - 20, width: 40, height: 40, borderRadius: 20, background: N.cream, border: `7px solid ${N.mustardDeep}`, boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: w * 0.2, right: w * 0.04, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: ink}}>{children}</div>
      </div>
    </div>
  );
};

/** Big stamped discount: slams in with ink spread and a tiny camera shake value returned via children-less render. */
export const Stamp: React.FC<{at: number; x: number; y: number; text: string; sub?: string; size?: number; color?: string; rot?: number; out?: number; center?: boolean}> = ({at, x, y, text, sub, size = 150, color = N.forest, rot = -7, out, center = true}) => {
  const frame = useCurrentFrame();
  const s = useSp(at, {damping: 9, stiffness: 260, mass: 0.6});
  if (frame < f(at)) return null;
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.25)], [1, 0], clamp) : 1;
  const sc = 2.2 - 1.2 * s;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${center ? '-50%' : '0'}, -50%) rotate(${rot}deg) scale(${sc})`, opacity: Math.min(1, s * 2.5) * o, zIndex: 30}}>
      <div style={{border: `${Math.round(size * 0.07)}px solid ${color}`, borderRadius: size * 0.16, padding: `${size * 0.1}px ${size * 0.24}px ${size * 0.12}px`, color, fontFamily: FONT.display, fontSize: size, lineHeight: 0.92, textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap', mixBlendMode: 'multiply', maskImage: `url(${staticFile('img/paper_grain.png')})`, maskSize: '600px', WebkitMaskImage: `url(${staticFile('img/paper_grain.png')})`, WebkitMaskSize: '600px'}}>
        {text}
        {sub && <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: size * 0.24, letterSpacing: size * 0.02, marginTop: size * 0.08}}>{sub}</div>}
      </div>
    </div>
  );
};

/** Screen shake helper: returns px offset for a hit at time `at`. */
export const useShake = (hits: number[], amp = 16) => {
  const frame = useCurrentFrame();
  let dx = 0, dy = 0;
  for (const h of hits) {
    const t = frame - f(h);
    if (t >= 0 && t < 9) {
      const k = (1 - t / 9) * amp;
      dx += (random(`sx${h}${t}`) - 0.5) * 2 * k;
      dy += (random(`sy${h}${t}`) - 0.5) * 2 * k;
    }
  }
  return {dx, dy};
};

/** Bold headline that builds word by word (cut-paper slaps). */
export const Headline: React.FC<{at: number; words: string[]; x?: number; y: number; size?: number; colors?: string[]; bgs?: string[]; stagger?: number; out?: number; font?: string; align?: 'left' | 'center'}> = ({at, words, x = 540, y, size = 112, colors = [N.cream], bgs = [N.forest], stagger = 0.12, out, font = FONT.display, align = 'center'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.22)], [0, 1], {...clamp, easing: ease}) : 0;
  return (
    <div style={{position: 'absolute', left: align === 'center' ? 70 : x, width: align === 'center' ? 940 : 860, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: `${size * 0.14}px ${size * 0.12}px`, zIndex: 25}}>
      {words.map((w, i) => {
        const st = at + i * stagger;
        const s = spring({frame: frame - f(st), fps, config: {damping: 11, stiffness: 210, mass: 0.6}});
        if (frame < f(st)) return <span key={i} style={{visibility: 'hidden', fontFamily: font, fontSize: size, padding: '0 0.18em'}}>{w}</span>;
        const r = (random(`hr${w}${i}`) - 0.5) * 6;
        return (
          <span key={i} style={{display: 'inline-block', fontFamily: font, fontSize: size, lineHeight: 1.0, color: colors[i % colors.length], background: bgs[i % bgs.length], padding: `${size * 0.06}px ${size * 0.16}px ${size * 0.1}px`, transform: `rotate(${r}deg) scale(${1.4 - 0.4 * s}) translateY(${o * -1600}px)`, opacity: Math.min(1, s * 3), clipPath: bgs[i % bgs.length] === 'transparent' ? undefined : tornClip(`hw${i}${w}`, ['top', 'bottom', 'left', 'right'], 1.4), boxShadow: '0 8px 0 rgba(0,0,0,0.12)', textTransform: 'uppercase'}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Product sticker card: torn-paper card with the real cut-out and a handwritten label. */
export const ProductCard: React.FC<{src: string; at: number; out?: number; x?: number; y?: number; w?: number; h?: number; label: string; color?: string; rot?: number; imgH?: number; labelColor?: string; enter?: 'stomp' | 'slide'}> = ({src, at, out, x = 140, y = 470, w = 800, h = 760, label, color = N.paper, rot = -2, imgH, labelColor = N.forest, enter = 'stomp'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  if (out !== undefined && frame >= f(out)) return null;
  // stop-motion stomp: 3 snaps at 12 fps
  const st = Math.floor((frame - f(at)) / 2.5);
  const sc = enter === 'stomp' ? [0.78, 1.07, 0.98, 1][Math.min(3, st)] : 1;
  const sl = enter === 'slide' ? spring({frame: frame - f(at), fps, config: {damping: 14, stiffness: 170}}) : 1;
  const wob = Math.floor(frame / 2.5);
  const jr = (random(`pc${wob}${label}`) - 0.5) * 0.9;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translateX(${(1 - sl) * 1100}px) rotate(${rot + jr}deg) scale(${sc})`, zIndex: 10, filter: 'drop-shadow(10px 12px 0 rgba(0,0,0,0.14)) drop-shadow(0 18px 24px rgba(0,0,0,0.2))'}}>
      <div style={{position: 'absolute', inset: 0, background: color, clipPath: tornClip(`card${label}`, ['top', 'bottom', 'left', 'right'], 1.2)}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 30, bottom: 130, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <Img src={staticFile(src)} style={{maxWidth: w - 90, maxHeight: imgH ?? h - 170, objectFit: 'contain', filter: 'drop-shadow(0 14px 16px rgba(0,0,0,0.22))'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: FONT.script, fontWeight: 700, fontSize: 84, color: labelColor, lineHeight: 1}}>{label}</div>
    </div>
  );
};

/** Tear-off calendar page showing a date (urgency / launch). */
export const CalendarPage: React.FC<{at: number; x: number; y: number; month: string; day: string; dow?: string; out?: number; tearAt?: number; nextDay?: string}> = ({at, x, y, month, day, dow, out, tearAt, nextDay}) => {
  const frame = useCurrentFrame();
  const s = useSp(at, {damping: 12, stiffness: 160});
  if (frame < f(at)) return null;
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.25)], [1, 0], clamp) : 1;
  const W = 440, H = 500;
  const tear = tearAt !== undefined ? interpolate(frame, [f(tearAt), f(tearAt + 0.45)], [0, 1], {...clamp, easing: easeInOut}) : 0;
  const face = (d: string, extra?: React.CSSProperties) => (
    <div style={{position: 'absolute', inset: 0, background: N.cream, borderRadius: 18, overflow: 'hidden', ...extra}}>
      <div style={{height: 130, background: N.forest, color: N.cream, fontFamily: FONT.body, fontWeight: 800, fontSize: 58, letterSpacing: 6, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{month}</div>
      <div style={{fontFamily: FONT.display, fontSize: 250, color: N.ink, textAlign: 'center', lineHeight: 1.18}}>{d}</div>
      {dow && <div style={{fontFamily: FONT.script, fontWeight: 700, fontSize: 66, color: N.mustardDeep, textAlign: 'center', marginTop: -22}}>{dow}</div>}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: x - W / 2, top: y, width: W, height: H, opacity: o, transform: `translateY(${(1 - s) * 900}px) rotate(${(1 - s) * 12 + 3}deg)`, filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.25))', zIndex: 20}}>
      {nextDay && face(nextDay)}
      {face(day, {transformOrigin: '50% 0%', transform: `rotate(${tear * -24}deg) translate(${tear * -300}px, ${tear * 900}px)`, opacity: 1 - tear * 0.2})}
      {/* binder rings */}
      {[110, 330].map((rx) => <div key={rx} style={{position: 'absolute', left: rx - 14, top: -26, width: 28, height: 60, borderRadius: 14, border: `7px solid ${N.ink}`, boxSizing: 'border-box'}} />)}
    </div>
  );
};

/** Perforated coupon strip, with a dashed cut line that a scissor icon travels along. */
export const Coupon: React.FC<{at: number; x?: number; y: number; w?: number; h?: number; children: React.ReactNode; cutAt?: number; color?: string; out?: number; rot?: number}> = ({at, x = 90, y, w = 900, h = 300, children, cutAt, color = N.forest, out, rot = -2}) => {
  const frame = useCurrentFrame();
  const s = useSp(at, {damping: 13, stiffness: 180});
  if (frame < f(at)) return null;
  const o = out !== undefined ? interpolate(frame, [f(out), f(out + 0.25)], [1, 0], clamp) : 1;
  const cut = cutAt !== undefined ? interpolate(frame, [f(cutAt), f(cutAt + 0.6)], [0, 1], {...clamp, easing: easeInOut}) : 0;
  const notch = 34;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, transform: `translateX(${(1 - s) * -1200}px) rotate(${rot}deg)`, zIndex: 22, filter: 'drop-shadow(10px 12px 0 rgba(0,0,0,0.14))'}}>
      <div style={{position: 'absolute', inset: 0, background: color, WebkitMaskImage: `radial-gradient(circle ${notch}px at 0 50%, transparent 98%, #000 100%), radial-gradient(circle ${notch}px at 100% 50%, transparent 98%, #000 100%)`, WebkitMaskComposite: 'source-in', maskComposite: 'intersect', borderRadius: 16}} />
      <div style={{position: 'absolute', inset: 18, border: `4px dashed rgba(251,246,236,0.7)`, borderRadius: 12}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: N.cream}}>{children}</div>
      {cutAt !== undefined && frame >= f(cutAt) && (
        <div style={{position: 'absolute', top: -46, left: cut * (w - 60), fontSize: 64, transform: `rotate(${Math.sin(frame) * 8}deg)`}}>✂️</div>
      )}
    </div>
  );
};

/** Camera wrapper: applies a shake and an optional slow push. */
export const Camera: React.FC<{hits?: number[]; amp?: number; push?: [number, number, number, number]; children: React.ReactNode}> = ({hits = [], amp = 14, push, children}) => {
  const frame = useCurrentFrame();
  const {dx, dy} = useShake(hits, amp);
  const sc = push ? interpolate(frame, [f(push[0]), f(push[1])], [push[2], push[3]], {...clamp, easing: easeInOut}) : 1;
  return <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${sc})`}}>{children}</AbsoluteFill>;
};

/** Full-bleed photo held in a torn-paper frame with slow Ken Burns. Used for lifestyle shots. */
export const PhotoPanel: React.FC<{src: string; at: number; out?: number; x?: number; y?: number; w?: number; h?: number; rot?: number; zoom?: [number, number]; origin?: string; seed?: string; dur?: number; filter?: string}> = ({src, at, out, x = 60, y = 300, w = 960, h = 960, rot = 0, zoom = [1.04, 1.16], origin = '50% 50%', seed = 'pp', dur = 3, filter}) => {
  const frame = useCurrentFrame();
  const s = useSp(at, {damping: 14, stiffness: 150});
  if (frame < f(at)) return null;
  if (out !== undefined && frame >= f(out)) return null;
  const z = interpolate(frame, [f(at), f(at + dur)], zoom, clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translateY(${(1 - s) * 140}px) rotate(${rot}deg)`, opacity: Math.min(1, s * 2), filter: 'drop-shadow(0 22px 26px rgba(0,0,0,0.28))', zIndex: 8}}>
      <div style={{position: 'absolute', inset: 0, background: N.cream, clipPath: tornClip(seed, ['top', 'bottom', 'left', 'right'], 1.0)}} />
      <div style={{position: 'absolute', inset: 16, overflow: 'hidden', clipPath: tornClip(seed + 'i', ['top', 'bottom', 'left', 'right'], 0.8)}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, transformOrigin: origin, filter}} />
      </div>
    </div>
  );
};

/** End card used by every November deal Reel: logo, offer line, end date, Shop ValuHub.ca. */
export const DealEnd: React.FC<{at: number; offer: {big: string; line: string; ends: string; extra?: string[]}; cta?: string; note?: string; bigLines?: [string, string]; icon?: string}> = ({at, offer, cta = BRAND.cta, note, bigLines, icon = '⏰'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const wipe = interpolate(frame, [f(at), f(at + 0.45)], [0, 1], {...clamp, easing: ease});
  const logo = spring({frame: frame - f(at + 0.2), fps, config: {damping: 12, stiffness: 150}});
  const big = spring({frame: frame - f(at + 0.45), fps, config: {damping: 9, stiffness: 240, mass: 0.6}});
  const pill = spring({frame: frame - f(at + 0.95), fps, config: {damping: 12, stiffness: 160}});
  const sub = interpolate(frame, [f(at + 1.2), f(at + 1.5)], [0, 1], clamp);
  const pulse = 1 + 0.03 * Math.sin((frame - f(at)) / fps * 6);
  return (
    <AbsoluteFill style={{clipPath: `circle(${wipe * 130}% at 50% 60%)`, zIndex: 80}}>
      <Page color={N.forest} texture={false}>
        <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay'}} />
      </Page>
      <div style={{position: 'absolute', top: 330, left: 0, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${logo})`}}>
        <div style={{background: N.cream, borderRadius: 36, padding: '26px 44px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 12px 26px rgba(0,0,0,0.3)'}}>
          <Img src={staticFile(BRAND.logoMark)} style={{height: 104}} />
          <Img src={staticFile(BRAND.logoWord ?? BRAND.logoMark)} style={{height: 104}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 560, left: 0, width: 1080, textAlign: 'center', color: N.mustard, fontFamily: FONT.body, fontWeight: 800, fontSize: 44, letterSpacing: 6, textTransform: 'uppercase', opacity: sub}}>{offer.line}</div>
      <div style={{position: 'absolute', top: 630, left: 0, width: 1080, textAlign: 'center', fontFamily: FONT.display, fontSize: 132, lineHeight: 0.95, color: N.cream, textTransform: 'uppercase', transform: `scale(${(2 - big) * pulse})`, opacity: Math.min(1, big * 3)}}>
        {bigLines ? bigLines[0] : offer.big.split(' ').slice(0, 2).join(' ')}
        <br />
        <span style={{color: N.mustard}}>{bigLines ? bigLines[1] : offer.big.split(' ').slice(2).join(' ')}</span>
      </div>
      <div style={{position: 'absolute', top: 920, left: 0, width: 1080, display: 'flex', justifyContent: 'center', gap: 18, opacity: sub}}>
        <div style={{background: N.mustard, color: N.forestDeep, fontFamily: FONT.body, fontWeight: 800, fontSize: 40, padding: '14px 30px', borderRadius: 999}}>{icon} {offer.ends}</div>
      </div>
      <div style={{position: 'absolute', top: 1040, left: 0, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${pill})`}}>
        <div style={{background: N.cream, color: N.forest, fontFamily: FONT.display, fontSize: 62, padding: '22px 54px 26px', borderRadius: 999, boxShadow: '0 12px 0 rgba(0,0,0,0.18)'}}>{cta}</div>
      </div>
      {note && <div style={{position: 'absolute', top: 1180, left: 90, width: 900, textAlign: 'center', color: 'rgba(251,246,236,0.85)', fontFamily: FONT.body, fontWeight: 600, fontSize: 28, opacity: sub}}>{note}</div>}
    </AbsoluteFill>
  );
};
