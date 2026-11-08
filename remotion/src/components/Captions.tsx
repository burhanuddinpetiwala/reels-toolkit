import {FONT} from '../theme';
import React from 'react';
import {getInputProps, interpolate, useCurrentFrame} from 'remotion';
import {C, FPS} from '../brand';

export type Word = {w: string; s: number; e: number};
export type Line = {k: string; text: string; start: number; end: number; words: Word[]};

type Group = {words: Word[]; s: number; e: number};

/** Split the voiceover into short readable caption groups (max ~26 chars, break on punctuation). */
export const groupWords = (lines: Line[], maxChars = 26): Group[] => {
  const groups: Group[] = [];
  for (const l of lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) groups.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
      cur = [];
    };
    for (const w of l.words) {
      const len = cur.map((x) => x.w).join(' ').length;
      if (cur.length && len + w.w.length + 1 > maxChars) flush();
      cur.push(w);
      if (/[.,!?:;…]$/.test(w.w) && cur.map((x) => x.w).join(' ').length > 12) flush();
    }
    flush();
  }
  // extend each group to the next group's start (max +0.6s) for readability
  for (let i = 0; i < groups.length; i++) {
    const next = groups[i + 1];
    const lim = next ? next.s - 0.04 : groups[i].e + 0.6;
    groups[i].e = Math.min(lim, groups[i].e + 0.6);
  }
  return groups;
};

export type CaptionStyle = {
  font?: string;
  size?: number;
  weight?: number;
  color?: string;
  active?: string; // colour of the word being spoken
  bg?: string | null; // strip background, null = no box
  y?: number; // vertical centre in px
  x?: number; // horizontal centre
  maxWidth?: number;
  rotate?: number;
  shadow?: string;
  radius?: number;
  uppercase?: boolean;
};

export const Captions: React.FC<{lines: Line[]; style?: CaptionStyle; hideFrom?: number; maxChars?: number}> = ({lines, style = {}, hideFrom, maxChars = 26}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const groups = React.useMemo(() => groupWords(lines, maxChars), [lines, maxChars]);
  if (hideFrom !== undefined && t >= hideFrom) return null;
  if ((getInputProps() as {noCaptions?: boolean}).noCaptions) return null; // used for clean thumbnails
  const g = groups.find((x) => t >= x.s - 0.08 && t < x.e);
  if (!g) return null;
  const {font = FONT.body, size = 54, weight = 800, color = C.ink, active = C.green, bg = C.cream, y = 1180, x = 500, maxWidth = 820, rotate = 0, shadow, radius = 14, uppercase = false} = style;
  const pop = interpolate(t, [g.s - 0.08, g.s + 0.1], [0.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(t, [g.s - 0.08, g.s + 0.04, g.e - 0.06, g.e], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${pop})`,
        maxWidth,
        width: 'max-content',
        textAlign: 'center',
        opacity: op,
        padding: bg ? '14px 28px 16px' : 0,
        background: bg ?? 'transparent',
        borderRadius: radius,
        boxShadow: bg ? '0 10px 30px rgba(0,0,0,0.28)' : undefined,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.12,
        letterSpacing: -0.5,
        textTransform: uppercase ? 'uppercase' : 'none',
      }}
    >
      {g.words.map((w, i) => {
        const on = t >= w.s - 0.05;
        return (
          <span key={i} style={{color: on ? (t < w.e + 0.05 ? active : color) : color, opacity: on ? 1 : 0.55, textShadow: shadow, transition: 'none'}}>
            {w.w}
            {i < g.words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};
