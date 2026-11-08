// Brand theme for the active project (remotion/src/project -> <project dir>, linked by rt/use_project.sh).
// Every colour, font, logo and URL in the templates comes from project/brand.json.
import brand from './project/brand.json';

const B: any = brand;
const c = B.colors ?? {};
/** Template palette. Names are roles (kept short for the templates):
 *  forest = primary, forestDeep = primary dark, mustard = accent, mustardDeep = accent dark,
 *  cream = light background, paper = second light background, ink = body text. */
export const N = {
  forest: c.primary ?? '#1F4A32',
  forestDeep: c.primaryDeep ?? '#143523',
  mustard: c.accent ?? '#E0A526',
  mustardDeep: c.accentDeep ?? '#B9821A',
  cream: c.light ?? '#FBF6EC',
  paper: c.paper ?? '#F3EAD7',
  ink: c.ink ?? '#1B231D',
  black: c.black ?? '#111111',
  white: '#FFFFFF',
  brand: c.highlight ?? c.primary ?? '#006400',
};

const hexRgb = (h: string) => {
  const x = h.replace('#', '');
  const n = parseInt(x.length === 3 ? x.split('').map((ch) => ch + ch).join('') : x, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
/** 'r,g,b' of the dark primary, for gradients: `rgba(${DEEP},0.8)` */
export const DEEP = hexRgb(N.forestDeep);
export const PRIMARY_RGB = hexRgb(N.forest);

const fo = B.fonts ?? {};
export const FONT = {
  display: fo.display ?? 'Archivo Black', // big uppercase punches
  body: fo.body ?? 'Inter', // labels, captions (needs 600/700/800 weights)
  script: fo.script ?? 'Caveat', // handwritten labels
  serif: fo.serif ?? 'Fraunces', // italic editorial titles
};

const lg = B.logos ?? {};
const P = (p?: string) => (p ? 'project/' + p : undefined);
export const BRAND = {
  name: B.name ?? 'Brand',
  domain: B.domain ?? 'example.com', // shown as typed, e.g. "ValuHub.ca"
  cta: B.cta ?? `Shop ${B.domain ?? 'now'}`,
  kicker: B.issueKicker ?? `${(B.name ?? '').toUpperCase()}`,
  logoMark: P(lg.mark) ?? P(lg.full) ?? 'img/paper_grain.png',
  logoWord: P(lg.word),
  logo: P(lg.full) ?? P(lg.mark),
  logoWhite: P(lg.white) ?? P(lg.full) ?? P(lg.mark),
};
