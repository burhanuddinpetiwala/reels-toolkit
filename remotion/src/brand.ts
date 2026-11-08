import {continueRender, delayRender, staticFile} from 'remotion';
import {N} from './theme';

// Legacy palette used by components/core.tsx and Captions.tsx, mapped onto the brand theme.
export const C = {green: N.brand, greenDeep: N.forestDeep, gold: N.mustard, goldLight: N.mustard, cream: N.cream, paper: N.paper, kraft: N.paper, ink: N.ink, pine: N.forestDeep, berry: '#A8282F', snow: '#FFFFFF'};
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const SAFE = {top: 270, bottom: 1920 - 670, left: 70, right: 1080 - 150};
const FONTS: [string, string, string, string?][] = [
  ['Inter', 'inter-latin-400-normal.woff2', '400'],
  ['Inter', 'inter-latin-600-normal.woff2', '600'],
  ['Inter', 'inter-latin-700-normal.woff2', '700'],
  ['Inter', 'inter-latin-800-normal.woff2', '800'],
  ['Fraunces', 'fraunces-latin-full-normal.woff2', '100 900'],
  ['Fraunces', 'fraunces-latin-full-italic.woff2', '100 900', 'italic'],
  ['Caveat', 'caveat-latin-600-normal.woff2', '600'],
  ['Caveat', 'caveat-latin-700-normal.woff2', '700'],
  ['Fredoka', 'fredoka-latin-500-normal.woff2', '500'],
  ['Fredoka', 'fredoka-latin-600-normal.woff2', '600'],
  ['Fredoka', 'fredoka-latin-700-normal.woff2', '700'],
  ['DM Serif Display', 'dm-serif-display-latin-400-normal.woff2', '400'],
  ['DM Serif Display', 'dm-serif-display-latin-400-italic.woff2', '400', 'italic'],
  ['Archivo Black', 'archivo-black-latin-400-normal.woff2', '400'],
  ['Playfair Display', 'playfair-display-latin-wght-normal.woff2', '400 900'],
  ['Playfair Display', 'playfair-display-latin-wght-italic.woff2', '400 900', 'italic'],
  ['Special Elite', 'special-elite-latin-400-normal.woff2', '400'],
  ['Bebas Neue', 'bebas-neue-latin-400-normal.woff2', '400'],
  ['Abril Fatface', 'abril-fatface-latin-400-normal.woff2', '400'],
  ['Chewy', 'chewy-latin-400-normal.woff2', '400'],
  ['Bowlby One', 'bowlby-one-latin-400-normal.woff2', '400'],
  ['Limelight', 'limelight-latin-400-normal.woff2', '400'],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    FONTS.map(([family, file, weight, style]) => {
      const f = new FontFace(family, `url(${staticFile('fonts/' + file)}) format('woff2')`, {weight, style: style ?? 'normal'});
      return f.load().then((ff) => (document as any).fonts.add(ff));
    })
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

export const sec = (s: number) => Math.round(s * FPS);
