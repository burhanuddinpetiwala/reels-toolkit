import type {Line} from './Captions';

export type VideoData = {id: string; fps: number; duration: number; endCardStart: number; lines: Line[]; beats: Record<string, number>};

/** start time of a line */
export const ls = (d: VideoData, k: string) => d.lines.find((l) => l.k === k)!.start;
export const le = (d: VideoData, k: string) => d.lines.find((l) => l.k === k)!.end;

/** time a word (matched by case-insensitive prefix, nth occurrence) is spoken within a line */
export const wt = (d: VideoData, k: string, word: string, nth = 0, which: 's' | 'e' = 's') => {
  const l = d.lines.find((x) => x.k === k)!;
  const hits = l.words.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9.\-″×°–]/g, '').startsWith(word.toLowerCase()));
  const w = hits[nth] ?? hits[hits.length - 1];
  if (!w) return l.start;
  return w[which];
};
