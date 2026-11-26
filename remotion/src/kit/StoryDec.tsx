// December Story frames: no sticker box. The lower third (y 1180-1500) is left clean for the
// poll / quiz / slider / link sticker you add in Instagram. Link buttons render as separate transparent PNGs.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {N, FONT, BRAND} from '../theme';
import {BrandBG, L} from './BrandBG';

type Theme = {bg: string; fg: string; accent: string; pillBg: string; pillFg: string; font: string; logo: 'white' | 'full'; deco?: string};
// All Story looks share the light brand base (cream paper + sage wave, forest + mustard). Styles vary type only.
const base = {bg: L.bg, fg: L.forest, accent: L.mustardDeep, pillBg: L.forest, pillFg: L.cream, logo: 'full' as const};
export const THEMES: Record<string, Theme> = {
  glitch: {...base, font: 'Bebas Neue'},
  split: {...base, font: FONT.display},
  ba: {...base, font: FONT.display},
  gta: {...base, font: 'Bowlby One'},
  ugc: {...base, font: FONT.display},
  info: {...base, font: FONT.display},
  plain: {...base, font: 'DM Serif Display'},
};
const LOGO = (k: 'white' | 'full') => staticFile((k === 'white' ? BRAND.logoWhite : BRAND.logo) as string);

export type DecStory = {id: string; style: string; phase: string; kicker?: string; title: string[]; sub?: string; products?: {src: string; h: number; x: number; y: number; rot?: number}[]; photo?: string; badge?: string; note?: string; plain?: boolean};

export const DecStoryFrame: React.FC<DecStory> = ({id, style, phase, kicker, title, sub, products = [], photo, badge, note, plain}) => {
  const th = THEMES[style] ?? THEMES.ba;
  const outline = style === 'gta' ? ({WebkitTextStroke: `10px ${L.cream}`, paintOrder: 'stroke fill'} as React.CSSProperties) : {};
  return (
    <AbsoluteFill style={{background: th.bg}}>
      <BrandBG drift={false} flip={['split', 'gta', 'info'].includes(style)} variant={(id ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)} />
      {photo && <Img src={staticFile(photo)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />}
      {photo && <AbsoluteFill style={{background: 'linear-gradient(rgba(20,53,35,0.75), rgba(20,53,35,0.05) 45%, rgba(20,53,35,0.05) 60%, rgba(20,53,35,0.6))'}} />}
      {!plain && (
        <div style={{position: 'absolute', top: 240, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div style={{background: th.pillBg, color: th.pillFg, borderRadius: 999, padding: '10px 28px', fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 3, textTransform: 'uppercase'}}>{phase}</div>
        </div>
      )}
      <div style={{position: 'absolute', top: plain ? 560 : 330, left: 60, width: 960, textAlign: 'center', color: photo ? '#fff' : th.fg}}>
        {kicker && <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 42, letterSpacing: 2, color: photo ? '#fff' : th.accent, marginBottom: 10}}>{kicker}</div>}
        {title.map((t, i) => (
          <div key={i} style={{fontFamily: th.font, fontSize: plain ? 130 : t.length > 12 ? 104 : 128, lineHeight: 1.02, color: i % 2 ? (photo ? '#fff' : th.accent) : photo ? '#fff' : th.fg, textTransform: plain ? 'none' : 'uppercase', fontStyle: style === 'gta' ? 'italic' : 'normal', textShadow: photo ? '0 6px 24px rgba(0,0,0,0.5)' : undefined, ...outline}}>{t}</div>
        ))}
        {sub && <div style={{marginTop: 18, fontFamily: FONT.body, fontWeight: 800, fontSize: 46, color: photo ? '#fff' : th.fg}}>{sub}</div>}
      </div>
      {products.map((p, i) => (
        <Img key={i} src={staticFile(p.src)} style={{position: 'absolute', left: p.x, top: p.y, height: p.h, maxWidth: 520, objectFit: 'contain', transform: `translateX(-50%) rotate(${p.rot ?? 0}deg)`, filter: 'drop-shadow(0 0 2px rgba(31,74,50,0.35)) drop-shadow(0 24px 24px rgba(31,74,50,0.28))'}} />
      ))}
      {badge && (
        <div style={{position: 'absolute', right: 70, top: 690, width: 250, height: 250, borderRadius: 999, background: L.mustard, color: L.forestDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)', boxShadow: `0 12px 0 ${L.forest}`, fontFamily: FONT.display}}>
          <div style={{fontSize: 30, fontFamily: FONT.body, fontWeight: 800, letterSpacing: 2}}>UP TO</div>
          <div style={{fontSize: 84, lineHeight: 0.95}}>{badge}</div>
          <div style={{fontSize: 30, fontFamily: FONT.body, fontWeight: 800, letterSpacing: 2}}>OFF</div>
        </div>
      )}
      {note && <div style={{position: 'absolute', top: 1520, left: 80, width: 920, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: photo ? '#fff' : th.fg, opacity: 0.85}}>{note}</div>}
      <Img src={LOGO(th.logo)} style={{position: 'absolute', left: 540, top: 1590, height: 70, transform: 'translateX(-50%)'}} />
    </AbsoluteFill>
  );
};

export type LinkBtn = {id: string; style: string; text: string};
/** Transparent PNG of just the link button, to place over the Instagram link sticker. 900x220 canvas. */
export const LinkButton: React.FC<LinkBtn> = ({style, text}) => {
  const th = THEMES[style] ?? THEMES.ba;
  return (
    <AbsoluteFill style={{background: 'transparent', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, background: L.forest, color: L.cream, border: `6px solid ${L.mustard}`, borderRadius: 999, padding: '26px 52px 30px', fontFamily: FONT.display, fontWeight: 700, fontSize: 58, whiteSpace: 'nowrap', boxShadow: '0 10px 0 rgba(31,74,50,0.25)'}}>
        <Img src={staticFile(BRAND.logoMark as string)} style={{height: 62, background: '#fff', borderRadius: 14, padding: 6}} />
        {text}
      </div>
    </AbsoluteFill>
  );
};
