// Instagram Story frames (1080x1920 stills). Text <= 5 words; an empty, dashed "sticker zone" marks where the
// interactive sticker (poll, quiz, slider, countdown, link, question box, Add Yours) goes when posting in Instagram.
import {FONT, BRAND, DEEP, PRIMARY_RGB} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Sticker, tornClip} from '../components/collage';
import {N} from './kit';

export type StoryProps = {
  phase: string;
  bg: 'forest' | 'cream' | 'mustard' | 'black' | 'deep';
  title: string[]; // <= 5 words total
  kicker?: string;
  products?: {src: string; h: number; x: number; y: number; rot?: number}[];
  photo?: string;
  zone?: string; // sticker zone label, e.g. "POLL STICKER"
  zoneY?: number;
  badge?: [string, string, string];
  badgeX?: number; badgeY?: number;
  plain?: boolean; // Remembrance Day: no branding beyond the logo, no offers
};

const BG: Record<string, string> = {forest: N.forest, cream: N.cream, mustard: N.mustard, black: N.black, deep: N.forestDeep};

export const StoryFrame: React.FC<StoryProps> = ({phase, bg, title, kicker, products = [], photo, zone, zoneY = 1180, badge, badgeX = 720, badgeY = 760, plain}) => {
  const dark = ['forest', 'black', 'deep'].includes(bg);
  return (
    <AbsoluteFill style={{background: BG[bg]}}>
      {photo && <Img src={staticFile(photo)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />}
      {photo && <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(${DEEP},0.9) 0%, rgba(${DEEP},0.4) 35%, rgba(0,0,0,0) 55%)`}} />}
      {!photo && <Img src={staticFile(bg === 'cream' ? 'img/paper_cream.jpg' : 'img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: bg === 'cream' ? 1 : 0.22, mixBlendMode: bg === 'cream' ? 'normal' : 'overlay'}} />}
      {!plain && (
        <div style={{position: 'absolute', top: 250, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
          <div style={{background: N.black, color: N.cream, borderRadius: 999, padding: '10px 26px', fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', display: 'flex', gap: 12, alignItems: 'center'}}>
            <span style={{width: 14, height: 14, borderRadius: 7, background: N.mustard, display: 'inline-block'}} />
            {phase}
          </div>
        </div>
      )}
      <div style={{position: 'absolute', top: plain ? 640 : 340, left: 60, width: 960, textAlign: 'center'}}>
        {kicker && <div style={{fontFamily: FONT.script, fontWeight: 700, fontSize: 72, color: dark || photo ? N.mustard : N.forest, lineHeight: 1}}>{kicker}</div>}
        {title.map((t, i) => (
          <div key={i} style={{display: 'inline-block', margin: '8px 6px', fontFamily: plain ? FONT.serif : FONT.display, fontWeight: 900, fontSize: plain ? 110 : title.join(' ').length > 16 ? 84 : 100, lineHeight: 1, textTransform: plain ? 'none' : 'uppercase', padding: '6px 22px 12px', color: plain ? N.cream : i % 2 ? N.cream : dark || photo ? N.forestDeep : N.cream, background: plain ? 'transparent' : i % 2 ? N.black : dark || photo ? N.mustard : N.forest, clipPath: plain ? undefined : tornClip('st' + i + t, ['top', 'bottom', 'left', 'right'], 1.2)}}>{t}</div>
        ))}
      </div>
      {products.map((p, i) => (
        <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0}}>
          <div style={{position: 'absolute', left: 0, bottom: 0, transform: `translate(-50%, 0) rotate(${p.rot ?? 0}deg)`, transformOrigin: '50% 100%'}}>
            <Sticker src={p.src} h={Math.min(p.h, 470)} outline={9} />
          </div>
        </div>
      ))}
      {badge && (
        <div style={{position: 'absolute', left: badgeX, top: badgeY, width: 280, height: 280, zIndex: 5, borderRadius: 140, background: bg === 'mustard' ? N.forestDeep : N.mustard, color: bg === 'mustard' ? N.mustard : N.forestDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)', border: `8px dashed ${bg === 'mustard' ? N.mustard : N.forestDeep}`, boxShadow: '0 12px 0 rgba(0,0,0,0.18)'}}>
          <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 3}}>{badge[0]}</div>
          <div style={{fontFamily: FONT.display, fontSize: badge[1].length > 4 ? 64 : 90, lineHeight: 0.95}}>{badge[1]}</div>
          <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 3}}>{badge[2]}</div>
        </div>
      )}
      {zone && (
        <div style={{position: 'absolute', left: 140, top: zoneY, width: 800, height: 230, border: `5px dashed ${dark || photo ? 'rgba(251,246,236,0.75)' : `rgba(${PRIMARY_RGB},0.6)`}`, borderRadius: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: dark || photo ? 'rgba(251,246,236,0.75)' : `rgba(${PRIMARY_RGB},0.7)`}}>
          + {zone}
        </div>
      )}
      <div style={{position: 'absolute', top: 1500, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: N.cream, borderRadius: 999, padding: '12px 30px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 20px rgba(0,0,0,0.25)'}}>
          <Img src={staticFile(BRAND.logoMark)} style={{height: 54}} />
          <div style={{fontFamily: FONT.display, fontSize: 42, color: N.forest}}>{BRAND.domain}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
