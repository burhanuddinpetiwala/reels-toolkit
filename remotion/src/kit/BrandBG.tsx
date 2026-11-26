// Light brand background (ValuHub, Nov 2026 reference): warm cream paper with a soft sage wave
// rising from bottom-left to top-right. Use it behind any text-led scene so every post stays on-brand.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {N} from '../theme';

export const L = {
  bg: '#F4EFE7',
  sage: '#D9E4D7',
  sageDeep: '#A9C3AE',
  forest: N.forest,
  forestDeep: N.forestDeep,
  mustard: N.mustard,
  mustardDeep: N.mustardDeep,
  ink: N.ink,
  cream: N.cream,
  white: '#FFFFFF',
};

/** Which brand shape a post uses, so posts in a row don't repeat: 0 wave, 1 big circle, 2 diagonal band, 3 arch. */
export const BgVariant = createContext<number>(0);

/** flip mirrors the wave (sage on the left); drift gently breathes the curve so idle frames still move. */
export const BrandBG: React.FC<{flip?: boolean; drift?: boolean; w?: number; h?: number; variant?: number}> = ({flip, drift = true, w = 1080, h = 1920, variant}) => {
  const frame = useCurrentFrame();
  const ctxV = useContext(BgVariant);
  const v = (variant ?? ctxV) % 4;
  const k = drift ? Math.sin(frame / 75) : 0;
  const y = (v: number) => (v * h) / 1920;
  const x = (v: number) => (v * w) / 1080;
  const d = `M0 ${y(1895)} C ${x(260)} ${y(1860)} ${x(430)} ${y(1620 + k * 20)} ${x(540)} ${y(1450 + k * 25)} C ${x(660)} ${y(1260)} ${x(740)} ${y(900 - k * 25)} ${x(810)} ${y(680)} C ${x(880)} ${y(450)} ${x(960)} ${y(200 + k * 20)} ${x(1080)} ${y(30)} L ${x(1080)} ${y(1920)} Z`;
  return (
    <AbsoluteFill style={{background: L.bg, overflow: 'hidden'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', transform: flip ? 'scaleX(-1)' : undefined}}>
        {v === 0 && <path d={d} fill={L.sage} />}
        {v === 1 && <circle cx={x(880)} cy={y(1720 + k * 20)} r={x(860)} fill={L.sage} />}
        {v === 1 && <circle cx={x(120)} cy={y(260)} r={x(150 + k * 8)} fill={L.sage} opacity={0.7} />}
        {v === 2 && <path d={`M0 ${y(0)} L${x(1080)} ${y(0)} L${x(1080)} ${y(330 + k * 20)} L0 ${y(760 - k * 20)} Z`} fill={L.sage} />}
        {v === 2 && <path d={`M0 ${y(1920)} L${x(1080)} ${y(1920)} L${x(1080)} ${y(1520 + k * 15)} L0 ${y(1760)} Z`} fill={L.sage} opacity={0.8} />}
        {v === 3 && <path d={`M${x(-120)} ${y(1920)} L${x(-120)} ${y(1180)} A ${x(660)} ${y(620 + k * 15)} 0 0 1 ${x(1200)} ${y(1180)} L ${x(1200)} ${y(1920)} Z`} fill={L.sage} />}
      </svg>
      {/* paper tooth */}
      <svg width={w} height={h} style={{position: 'absolute', opacity: 0.05, mixBlendMode: 'multiply'}}>
        <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={3} stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#paper)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Caption style for light posts: cream on forest box, mustard active word. Reads on photos and on cream. */
export const LIGHT_CAPTIONS = {color: L.cream, active: L.mustard, bg: L.forest, radius: 14};
