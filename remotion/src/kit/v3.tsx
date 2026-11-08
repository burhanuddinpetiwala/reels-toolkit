// v3 additions: scroll-stopping hook (slam), lifestyle clip scenes, savings burst, urgency end card.
import {FONT, BRAND, DEEP} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence} from 'remotion';
import {clamp, ease, easeInOut, f} from '../components/core';
import {Sticker, tornClip} from '../components/collage';
import {N, Page} from './kit';

const sp = (frame: number, at: number, fps: number, cfg: any) => spring({frame: frame - f(at), fps, config: cfg});

/** Approximate Archivo Black uppercase advance widths (em) so slam lines fit 900px. */
const units = (t: string) =>
  Array.from(t.toUpperCase()).reduce((a, c) => a + (" '.,:!;|".includes(c) ? 0.34 : 'IJ1'.includes(c) ? 0.45 : 'MW'.includes(c) ? 1.0 : /[A-Z]/.test(c) ? 0.78 : /[0-9$#%?&]/.test(c) ? 0.72 : c.charCodeAt(0) > 255 ? 1.1 : 0.6), 0);
export const fitSize = (t: string, want: number, maxW = 900) => Math.min(want, Math.floor(maxW / units(t)));

/** Starburst savings badge: SAVE / $51 / 15% OFF. */
export const SaveBurst: React.FC<{at: number; x: number; y: number; save: string; pct?: string; size?: number; rot?: number; color?: string; ink?: string; out?: number}> = ({at, x, y, save, pct, size = 300, rot = -10, color = N.mustard, ink = N.forestDeep, out}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  if (out !== undefined && frame >= f(out)) return null;
  const s = sp(frame, at, fps, {damping: 8, stiffness: 260, mass: 0.6});
  const t = (frame - f(at)) / fps;
  const pulse = 1 + 0.035 * Math.sin(t * 7);
  const spin = (1 - s) * -120;
  const pts: string[] = [];
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 41 : 50;
    const a = (Math.PI * i) / n;
    pts.push(`${50 + r * Math.cos(a)}% ${50 + r * Math.sin(a)}%`);
  }
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 45, transform: `rotate(${rot + spin}deg) scale(${s * pulse})`, filter: 'drop-shadow(0 12px 0 rgba(0,0,0,0.2))'}}>
      <div style={{position: 'absolute', inset: 0, background: color, clipPath: `polygon(${pts.join(',')})`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: ink, textAlign: 'center'}}>
        <div style={{fontFamily: FONT.body, fontWeight: 900, fontSize: size * 0.11, letterSpacing: size * 0.012, lineHeight: 1}}>SAVE</div>
        <div style={{fontFamily: FONT.display, fontSize: size * (save.length > 4 ? 0.24 : 0.3), lineHeight: 0.95}}>{save}</div>
        {pct && <div style={{fontFamily: FONT.body, fontWeight: 900, fontSize: size * 0.085, letterSpacing: size * 0.008, lineHeight: 1.1, marginTop: size * 0.02}}>{pct}</div>}
      </div>
    </div>
  );
};

/** Big slam-in word blocks. */
export const SlamText: React.FC<{lines: {t: string; at: number; bg?: string; color?: string; size?: number}[]; y: number; dark?: boolean}> = ({lines, y, dark = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{position: 'absolute', top: y, left: 50, width: 980, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 40}}>
      {lines.map((l, i) => {
        if (frame < f(l.at)) return <div key={i} style={{height: fitSize(l.t, l.size ?? 120) + 28}} />;
        const s = sp(frame, l.at, fps, {damping: 11, stiffness: 320, mass: 0.5});
        const sc = 2.4 - 1.4 * s;
        const rot = (random('sl' + l.t) - 0.5) * 5;
        const bg = l.bg ?? (i % 2 ? N.black : dark ? N.mustard : N.forest);
        const fit = fitSize(l.t, l.size ?? 120);
        const col = l.color ?? (i % 2 ? N.cream : dark ? N.forestDeep : N.cream);
        return (
          <div key={i} style={{transform: `scale(${sc}) rotate(${rot}deg)`, opacity: Math.min(1, s * 4), background: bg, color: col, fontFamily: FONT.display, fontSize: fit, lineHeight: 1, padding: '10px 30px 18px', textTransform: 'uppercase', textAlign: 'center', clipPath: tornClip('sl' + i + l.t, ['top', 'bottom', 'left', 'right'], 1.1), boxShadow: '0 10px 0 rgba(0,0,0,0.2)', whiteSpace: 'nowrap', maxWidth: 1000}}>
            {l.t}
          </div>
        );
      })}
    </div>
  );
};

/** Full-bleed lifestyle background: OpenArt clip (video) or photo with a punch-in zoom. */
export const Bleed: React.FC<{from: number; to: number; clip?: string; photo?: string; pos?: string; clipLen?: number; rate?: number; startFrom?: number; dim?: number; punch?: boolean}> = ({from, to, clip, photo, pos = '50% 50%', clipLen = 3, rate, startFrom = 0, dim = 0.35, punch = true}) => {
  const frame = useCurrentFrame();
  const len = Math.max(0.5, to - from);
  const r = rate ?? Math.max(0.5, Math.min(1, (clipLen - startFrom - 0.08) / len));
  const z0 = punch ? 1.28 : 1.06;
  const zoom = interpolate(frame, [f(from), f(from + 0.5), f(to)], [z0, 1.06, 1.14], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: N.forestDeep}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {clip ? (
          <Sequence from={f(from)} layout="none">
            <OffthreadVideo src={staticFile(clip)} muted playbackRate={r} startFrom={Math.round(startFrom * 24)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
          </Sequence>
        ) : (
          <Img src={staticFile(photo!)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(${DEEP},${dim + 0.45}) 0%, rgba(${DEEP},${dim}) 30%, rgba(0,0,0,0) 52%, rgba(0,0,0,0) 70%, rgba(${DEEP},${dim + 0.2}) 100%)`}} />
    </AbsoluteFill>
  );
};

/** Urgency end card: logo, tagline, offer, deadline, CTA button with a tap. */
export const EndV3: React.FC<{at: number; tagline: [string, string]; line?: string; bigLines?: [string, string]; ends?: string; cta?: string; note?: string; icon?: string; plain?: boolean; products?: string[]}> = ({at, tagline, line, bigLines, ends, cta = BRAND.cta, note, icon = '⏰', plain, products = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const wipe = interpolate(frame, [f(at), f(at + 0.45)], [0, 1], {...clamp, easing: ease});
  const logo = sp(frame, at + 0.15, fps, {damping: 12, stiffness: 150});
  const tg = [sp(frame, at + 0.35, fps, {damping: 10, stiffness: 220, mass: 0.6}), sp(frame, at + 0.6, fps, {damping: 10, stiffness: 220, mass: 0.6})];
  const big = sp(frame, at + 0.9, fps, {damping: 9, stiffness: 240, mass: 0.6});
  const pill = sp(frame, at + 1.3, fps, {damping: 12, stiffness: 160});
  const sub = interpolate(frame, [f(at + 1.1), f(at + 1.4)], [0, 1], clamp);
  const t = (frame - f(at)) / fps;
  const btnPulse = 1 + 0.045 * Math.max(0, Math.sin(t * 6));
  const tap = t > 2.2 && t < 2.5;
  const hand = interpolate(frame, [f(at + 1.6), f(at + 2.2)], [1, 0], {...clamp, easing: easeInOut});
  return (
    <AbsoluteFill style={{clipPath: `circle(${wipe * 130}% at 50% 60%)`, zIndex: 80}}>
      <Page color={N.forest} texture={false}>
        <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay'}} />
      </Page>
      <div style={{position: 'absolute', top: 290, left: 0, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${logo})`}}>
        <div style={{background: N.cream, borderRadius: 30, padding: '18px 36px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 26px rgba(0,0,0,0.3)'}}>
          <Img src={staticFile(BRAND.logoMark)} style={{height: 80}} />
          <Img src={staticFile(BRAND.logoWord ?? BRAND.logoMark)} style={{height: 80}} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 440, left: 40, width: 1000, textAlign: 'center'}}>
        {tagline.map((tl, i) => (
          <div key={i} style={{fontFamily: FONT.serif, fontStyle: 'italic', fontWeight: 900, fontSize: 96, lineHeight: 1.02, color: i ? N.mustard : N.cream, transform: `translateY(${(1 - tg[i]) * 40}px) scale(${0.85 + 0.15 * tg[i]})`, opacity: Math.min(1, tg[i] * 2), textShadow: '0 6px 18px rgba(0,0,0,0.25)'}}>{tl}</div>
        ))}
      </div>
      {!plain && bigLines && (
        <div style={{position: 'absolute', top: 680, left: 0, width: 1080, textAlign: 'center'}}>
          {line && <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: N.mustard, textTransform: 'uppercase', opacity: sub, marginBottom: 6}}>{line}</div>}
          <div style={{fontFamily: FONT.display, fontSize: fitSize(bigLines[0] + ' ' + bigLines[1], 104, 980), lineHeight: 0.95, color: N.cream, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `scale(${2 - big})`, opacity: Math.min(1, big * 3)}}>
            {bigLines[0]} <span style={{color: N.mustard}}>{bigLines[1]}</span>
          </div>
        </div>
      )}
      {!plain && ends && (
        <div style={{position: 'absolute', top: 860, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: sub}}>
          <div style={{background: N.mustard, color: N.forestDeep, fontFamily: FONT.body, fontWeight: 800, fontSize: 40, padding: '12px 30px', borderRadius: 999}}>{icon} {ends}</div>
        </div>
      )}
      <div style={{position: 'absolute', top: plain ? 760 : 980, left: 0, width: 1080, display: 'flex', justifyContent: 'center', transform: `scale(${pill * (tap ? 0.94 : btnPulse)})`}}>
        <div style={{background: tap ? N.mustard : N.cream, color: N.forest, fontFamily: FONT.display, fontSize: 64, padding: '22px 56px 26px', borderRadius: 999, boxShadow: '0 12px 0 rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 16}}>
          {cta} <span style={{fontSize: 56}}>→</span>
        </div>
      </div>
      {pill > 0.5 && <div style={{position: 'absolute', left: 700 + hand * 160, top: (plain ? 820 : 1040) + hand * 200, fontSize: 96, zIndex: 90, transform: `rotate(-15deg) scale(${tap ? 0.88 : 1})`, opacity: Math.min(1, (pill - 0.5) * 4)}}>👆</div>}
      {products.slice(0, 3).map((p, i) => {
        const ps = sp(frame, at + 1.5 + i * 0.15, fps, {damping: 11, stiffness: 160, mass: 0.7});
        const xs = products.length === 1 ? [540] : products.length === 2 ? [330, 750] : [220, 540, 860];
        return (
          <div key={p} style={{position: 'absolute', left: xs[i], top: 1660, width: 0, height: 0, zIndex: 70}}>
            <div style={{position: 'absolute', left: 0, bottom: 0, transform: `translate(-50%, ${(1 - ps) * 420}px) rotate(${[-4, 0, 4][i]}deg)`, transformOrigin: '50% 100%'}}>
              <Sticker src={p} h={products.length === 1 ? 330 : 350} outline={8} />
            </div>
          </div>
        );
      })}
      {note && <div style={{position: 'absolute', top: plain ? 920 : 1150, left: 90, width: 900, textAlign: 'center', color: 'rgba(251,246,236,0.88)', fontFamily: FONT.body, fontWeight: 600, fontSize: 28, opacity: sub}}>{note}</div>}
    </AbsoluteFill>
  );
};

/** Product sticker visible from frame 0 (no fly-in), with a punch scale. */
export const HeroSticker: React.FC<{src: string; at: number; x: number; y: number; h: number; rot?: number}> = ({src, at, x, y, h, rot = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = at <= 0.05 ? 1 : sp(frame, at, fps, {damping: 10, stiffness: 220, mass: 0.6});
  if (frame < f(at) && at > 0.05) return null;
  const punch = interpolate(frame, [f(at), f(at + 0.35)], [1.18, 1], {...clamp, easing: ease});
  const idle = Math.sin(frame / fps * 1.4) * 1.2;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 30}}>
      <div style={{position: 'absolute', left: 0, bottom: 0, transform: `translate(-50%, 0) rotate(${rot + idle}deg) scale(${punch * s})`, transformOrigin: '50% 100%'}}>
        <Sticker src={src} h={h} outline={9} />
      </div>
    </div>
  );
};
