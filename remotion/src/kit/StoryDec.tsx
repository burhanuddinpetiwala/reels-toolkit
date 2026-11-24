// December Story frames: no sticker box. The lower third (y 1180-1500) is left clean for the
// poll / quiz / slider / link sticker you add in Instagram. Link buttons render as separate transparent PNGs.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {N, FONT, BRAND} from '../theme';

type Theme = {bg: string; fg: string; accent: string; pillBg: string; pillFg: string; font: string; logo: 'white' | 'full'; deco?: string};
export const THEMES: Record<string, Theme> = {
  glitch: {bg: '#050b07', fg: '#ffffff', accent: '#E0A526', pillBg: '#2ecc71', pillFg: '#050b07', font: 'Bebas Neue', logo: 'white', deco: 'grid'},
  split: {bg: 'linear-gradient(90deg, #F7D6DA 50%, #D3EEDF 50%)', fg: '#2B1E2F', accent: '#E2405B', pillBg: '#2B1E2F', pillFg: '#ffffff', font: 'Fredoka', logo: 'full'},
  ba: {bg: N.cream, fg: N.ink, accent: N.forest, pillBg: N.forest, pillFg: N.cream, font: FONT.display, logo: 'full'},
  gta: {bg: 'linear-gradient(180deg, #2b1055 0%, #7a2a8c 35%, #e0557a 62%, #ff9a5a 80%, #ffd27a 100%)', fg: '#ffffff', accent: '#f7e463', pillBg: '#0d0d0d', pillFg: '#7CF27C', font: 'Bowlby One', logo: 'white'},
  ugc: {bg: '#FFF4E6', fg: N.ink, accent: '#E2405B', pillBg: '#E2405B', pillFg: '#ffffff', font: FONT.display, logo: 'full'},
  info: {bg: N.cream, fg: N.ink, accent: N.forest, pillBg: N.forest, pillFg: N.cream, font: FONT.display, logo: 'full', deco: 'dots'},
  plain: {bg: '#10223a', fg: '#fdf6e3', accent: '#c9a74a', pillBg: '#c9a74a', pillFg: '#10223a', font: 'DM Serif Display', logo: 'white'},
};
const LOGO = (k: 'white' | 'full') => staticFile((k === 'white' ? BRAND.logoWhite : BRAND.logo) as string);

export type DecStory = {id: string; style: string; phase: string; kicker?: string; title: string[]; sub?: string; products?: {src: string; h: number; x: number; y: number; rot?: number}[]; photo?: string; badge?: string; note?: string; plain?: boolean};

export const DecStoryFrame: React.FC<DecStory> = ({style, phase, kicker, title, sub, products = [], photo, badge, note, plain}) => {
  const th = THEMES[style] ?? THEMES.ba;
  const outline = style === 'gta' ? ({WebkitTextStroke: '12px #000', paintOrder: 'stroke fill'} as React.CSSProperties) : {};
  return (
    <AbsoluteFill style={{background: th.bg}}>
      {photo && <Img src={staticFile(photo)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />}
      {photo && <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.55))'}} />}
      {th.deco === 'grid' && <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(46,204,113,0.14) 2px, transparent 2px), linear-gradient(90deg, rgba(46,204,113,0.14) 2px, transparent 2px)', backgroundSize: '90px 90px'}} />}
      {th.deco === 'dots' && <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(31,74,50,0.10) 2px, transparent 2.5px)', backgroundSize: '34px 34px'}} />}
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
        <Img key={i} src={staticFile(p.src)} style={{position: 'absolute', left: p.x, top: p.y, height: p.h, maxWidth: 520, objectFit: 'contain', transform: `translateX(-50%) rotate(${p.rot ?? 0}deg)`, filter: style === 'gta' ? 'drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(12px 12px 0 rgba(0,0,0,0.5))' : 'drop-shadow(0 24px 24px rgba(0,0,0,0.3))'}} />
      ))}
      {badge && (
        <div style={{position: 'absolute', right: 70, top: 690, width: 250, height: 250, borderRadius: 999, background: th.accent, color: style === 'glitch' || style === 'gta' ? '#111' : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)', boxShadow: '0 12px 0 rgba(0,0,0,0.2)', fontFamily: FONT.display}}>
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
  const gta = style === 'gta';
  return (
    <AbsoluteFill style={{background: 'transparent', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, background: gta ? '#7CF27C' : th.pillBg, color: gta ? '#08210b' : th.pillFg, border: gta ? '8px solid #000' : style === 'glitch' ? '6px solid #E0A526' : '6px solid rgba(255,255,255,0.9)', borderRadius: gta ? 10 : 999, padding: '26px 52px 30px', fontFamily: style === 'split' ? 'Fredoka' : FONT.display, fontWeight: 700, fontSize: 58, whiteSpace: 'nowrap', boxShadow: '0 10px 0 rgba(0,0,0,0.25)'}}>
        <Img src={staticFile(BRAND.logoMark as string)} style={{height: 62, background: '#fff', borderRadius: 14, padding: 6}} />
        {text}
      </div>
    </AbsoluteFill>
  );
};
