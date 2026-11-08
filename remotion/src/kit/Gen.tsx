// Data-driven November Reel: scenes keyed to voice-over words. One spec JSON per Reel.
import {FONT, BRAND, DEEP} from '../theme';
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Captions} from '../components/Captions';
import {clamp, easeInOut, f, Snow} from '../components/core';
import {Sticker, DrawOn, tornClip} from '../components/collage';
import {wt, VideoData} from '../components/timeline';
import {N, Page, PhaseTag, Stamp, CalendarPage, PhotoPanel, DealEnd, Camera, Headline, SwingTag, Phase} from './kit';
import {SaveBurst, SlamText, Bleed, EndV3, HeroSticker} from './v3';

type At = [string, string?, number?]; // line key, optional word prefix, optional nth
export type Spec = {
  id: string;
  phase: Phase;
  ticker: string;
  palette?: 'warm' | 'cool';
  end: {line: string; bigLines: [string, string]; ends: string; cta?: string; note?: string; icon?: string; tagline?: [string, string]; plain?: boolean};
  scenes: any[];
  snow?: boolean;
};

const BG: Record<string, string> = {cream: N.cream, forest: N.forest, mustard: N.mustard, paper: N.paper, deep: N.forestDeep, black: N.black};
const isDark = (bg: string) => ['forest', 'deep', 'black'].includes(bg);

const T = (d: VideoData, a: At) => (a[1] ? wt(d, a[0], a[1], a[2] ?? 0) : d.lines.find((l) => l.k === a[0])!.start);

/** Wipe-in scene container. */
const Scene: React.FC<{from: number; to: number; first?: boolean; dir?: number; children: React.ReactNode}> = ({from, to, first, dir = 0, children}) => {
  const frame = useCurrentFrame();
  if (frame < f(from) - 1 || frame >= f(to)) return null;
  const p = interpolate(frame, [f(from), f(from + 0.36)], [0, 1], {...clamp, easing: easeInOut});
  const clips = [`inset(0 ${(1 - p) * 100}% 0 0)`, `inset(${(1 - p) * 100}% 0 0 0)`, `inset(0 0 0 ${(1 - p) * 100}%)`, `circle(${p * 125}% at 50% 50%)`];
  return <AbsoluteFill style={{clipPath: first ? undefined : clips[dir % 4]}}>{children}</AbsoluteFill>;
};

const Floor: React.FC<{text: string; dark?: boolean}> = ({text, dark}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: -20, top: 1540, width: 1120, height: 420, background: dark ? N.forestDeep : N.forest, clipPath: tornClip(dark ? 'fd' : 'fl', ['top'], 1.2), zIndex: 5}}>
      <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay'}} />
      <div style={{position: 'absolute', top: 120, left: -((frame * 2.2) % 1400), whiteSpace: 'nowrap', fontFamily: FONT.display, fontSize: 40, letterSpacing: 4, color: N.mustard, opacity: 0.9}}>{(text + '  ·  ').repeat(8)}</div>
    </div>
  );
};

/** Persistent ValuHub.ca bug, top-right inside the safe area. */
const UrlBug: React.FC<{hideFrom: number}> = ({hideFrom}) => {
  const frame = useCurrentFrame();
  if (frame >= f(hideFrom)) return null;
  const o = interpolate(frame, [6, 14], [0, 1], clamp);
  return <div style={{position: 'absolute', right: 160, top: 286, zIndex: 60, opacity: o, background: N.cream, color: N.forest, border: `3px solid ${N.forest}`, borderRadius: 999, padding: '8px 20px', fontFamily: FONT.body, fontWeight: 800, fontSize: 28, letterSpacing: 0.5, boxShadow: '0 4px 10px rgba(0,0,0,0.18)'}}>{BRAND.domain}</div>;
};

const Chip: React.FC<{at: number; x: number; y: number; text: string; bg?: string; color?: string; size?: number}> = ({at, x, y, text, bg = N.mustard, color = N.forestDeep, size = 50}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 9, stiffness: 240, mass: 0.6}});
  return <div style={{position: 'absolute', left: x, top: y, zIndex: 36, transform: `scale(${s}) rotate(${(random(text) - 0.5) * 6}deg)`, transformOrigin: '0 50%', background: bg, color, fontFamily: FONT.display, fontSize: size, padding: '12px 28px', borderRadius: 999, boxShadow: '0 8px 0 rgba(0,0,0,0.18)', whiteSpace: 'nowrap', maxWidth: 900}}>{text}</div>;
};

const Label: React.FC<{at: number; x: number; y: number; text: string; rot?: number; color?: string; ink?: string}> = ({at, x, y, text, rot = -3, color = N.cream, ink = N.forest}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 10, stiffness: 200, mass: 0.6}});
  return <div style={{position: 'absolute', left: x, top: y, zIndex: 35, transform: `rotate(${rot}deg) scale(${1.3 - 0.3 * s})`, opacity: Math.min(1, s * 3), background: color, color: ink, padding: '8px 26px 12px', fontFamily: FONT.script, fontWeight: 700, fontSize: 64, lineHeight: 1, clipPath: tornClip(`lb${text}`, ['left', 'right'], 1.6), boxShadow: '0 6px 0 rgba(0,0,0,0.12)', whiteSpace: 'nowrap'}}>{text}</div>;
};

const Prod: React.FC<{src: string; at: number; x: number; y: number; h: number; rot?: number; spin?: boolean; shake?: [number, number]}> = ({src, at, x, y, h, rot = 0, spin, shake}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 11, stiffness: 160, mass: 0.8}});
  const idle = Math.sin((frame - f(at)) / fps * 1.3) * 0.8;
  const vib = shake && frame >= f(shake[0]) && frame < f(shake[1]) ? Math.sin(frame * 2.7) * 4 : 0;
  const sp = spin ? interpolate(frame, [f(at), f(at + 0.6)], [-25, 0], {...clamp, easing: easeInOut}) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, bottom: 0, transform: `translate(-50%, 0) translate(${vib}px, ${(1 - s) * 500}px) rotate(${rot + idle + sp}deg)`, transformOrigin: '50% 100%'}}>
        <Sticker src={src} h={h} outline={8} />
      </div>
    </div>
  );
};

/** Masthead cover (Issue format). */
const CoverScene: React.FC<{s: any; d: VideoData; from: number}> = ({s, from}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const push = interpolate(frame, [f(from), f(from + 6)], [1.0, 1.12], {...clamp, easing: easeInOut});
  const st = spring({frame: frame - f(from + 0.2), fps, config: {damping: 12, stiffness: 150}});
  return (
    <>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 60%'}}>
        <Img src={staticFile(s.bg)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.bgPos ?? '50% 50%'}} />
        {s.snow && <Snow count={26} seed="cv" opacity={0.5} speed={0.7} />}
      </AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(${DEEP},0.85) 0%, rgba(${DEEP},0.35) 32%, rgba(0,0,0,0) 48%)`}} />
      <div style={{position: 'absolute', top: 360, left: 0, width: 1080, textAlign: 'center', color: N.cream, transform: `translateY(${(1 - st) * -60}px)`, opacity: st}}>
        <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: N.mustard}}>{BRAND.kicker}</div>
        <div style={{fontFamily: FONT.serif, fontWeight: 900, fontStyle: 'italic', fontSize: s.titleSize ?? 110, lineHeight: 0.95, marginTop: 14, textShadow: '0 6px 24px rgba(0,0,0,0.35)'}}>{s.title}</div>
        <div style={{fontFamily: FONT.display, fontSize: 150, lineHeight: 0.9, letterSpacing: 4, textShadow: '0 6px 24px rgba(0,0,0,0.35)'}}>ISSUE</div>
      </div>
      {s.stamp && <Stamp at={from + (s.stampDelay ?? 1.4)} x={s.stampX ?? 760} y={s.stampY ?? 1060} text={s.stamp} size={70} color={N.mustard} rot={-10} />}
    </>
  );
};

/** One scene by type. */
const SceneBody: React.FC<{s: any; d: VideoData; from: number; to: number; ticker: string; idx: number}> = ({s, d, from, to, ticker, idx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bg = s.bg ?? (idx % 2 ? 'paper' : 'cream');
  const dark = isDark(bg);
  const at = (a?: At, dflt = from) => (a ? T(d, a) : dflt);
  const page = (children: React.ReactNode, floor = true) => (
    <Page color={BG[bg]} texture={bg === 'cream'}>
      {dark && <Img src={staticFile('img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay'}} />}
      {floor && <Floor text={ticker} dark={dark} />}
      {children}
    </Page>
  );
  switch (s.type) {
    case 'slam': {
      const dk = s.clip || s.photo ? true : isDark(bg);
      return (
        <>
          {s.clip || s.photo ? <Bleed from={from} to={to} clip={s.clip} photo={s.photo} pos={s.pos} clipLen={s.clipLen ?? 3} dim={s.dim ?? 0.3} /> : <Page color={BG[bg]} texture={bg === 'cream'} />}
          {s.floor && <Floor text={ticker} dark />}
          {(s.heroes ?? (s.hero ? [{src: s.hero, x: s.heroX, y: s.heroY, h: s.heroH, rot: s.heroRot}] : [])).map((h: any, i: number) => (
            <HeroSticker key={i} src={h.src} at={Array.isArray(h.at) ? T(d, h.at) - 0.05 : h.at ?? 0} x={h.x ?? 540} y={h.y ?? 1560} h={h.h ?? 760} rot={h.rot ?? 0} />
          ))}
          <SlamText y={s.y ?? 400} dark={dk} lines={(s.lines as any[]).map((l, i) => ({t: l.t, at: l.at ? T(d, l.at) : i === 0 ? from - 0.12 : from + i * 0.3, size: l.size, bg: l.bg, color: l.color}))} />
          {s.save && <SaveBurst at={s.saveAt ? T(d, s.saveAt) : from + 0.9} x={s.saveX ?? 800} y={s.saveY ?? 1010} save={s.save} pct={s.pct} size={s.saveSize ?? 300} />}
          {s.stamp && <Stamp at={at(s.stampAt, from + 0.8)} x={s.stampX ?? 540} y={s.stampY ?? 1000} text={s.stamp} size={s.stampSize ?? 110} color={N.mustard} rot={-8} />}
        </>
      );
    }
    case 'clip': {
      return (
        <>
          <Bleed from={from} to={to} clip={s.clip} photo={s.photo} pos={s.pos} clipLen={s.clipLen ?? 3} punch={false} dim={s.dim ?? 0.2} startFrom={s.startFrom ?? 0} />
          {s.floor && <Floor text={ticker} dark />}
          {s.label && <Label at={from + 0.2} x={s.lx ?? 90} y={s.ly ?? 400} text={s.label} rot={-3} color={N.mustard} ink={N.forestDeep} />}
          {(s.chips ?? []).map((c: any, i: number) => (
            <Chip key={i} at={at(c.at, from + 0.4 + i * 0.3)} x={c.x ?? 90} y={c.y ?? 520 + i * 100} text={c.text} bg={c.bg ?? N.cream} color={N.forestDeep} size={c.size ?? 50} />
          ))}
          {s.hero && <HeroSticker src={s.hero} at={from + 0.25} x={s.heroX ?? 760} y={s.heroY ?? 1560} h={s.heroH ?? 700} rot={s.heroRot ?? 0} />}
          {s.save && <SaveBurst at={at(s.saveAt, from + 0.6)} x={s.saveX ?? 800} y={s.saveY ?? 1000} save={s.save} pct={s.pct} size={s.saveSize ?? 280} />}
        </>
      );
    }
    case 'cover':
      return <CoverScene s={s} d={d} from={from} />;
    case 'hook':
      return page(
        <>
          {(s.stickers ?? []).map((src: string, i: number) => (
            <Prod key={src} src={src} at={from + 0.15 + i * 0.12} x={[200, 540, 880, 360, 720][i % 5]} y={1590} h={s.stickerH ?? 520} rot={[-6, 0, 6, -3, 3][i % 5]} />
          ))}
          <Headline at={from + 0.05} words={s.words} y={s.y ?? 420} size={s.size ?? 112} bgs={s.bgs ?? [dark ? N.mustard : N.forest, N.black]} colors={s.colors ?? [dark ? N.forestDeep : N.cream, N.cream]} stagger={s.stagger ?? 0.14} />
          {s.stamp && <Stamp at={at(s.stampAt, from + 0.6)} x={540} y={s.stampY ?? 900} text={s.stamp} sub={s.stampSub} size={s.stampSize ?? 130} color={dark ? N.mustard : N.forest} rot={-7} />}
        </>,
        s.floor !== false,
      );
    case 'flash': {
      // each item at its word; full-page colour pops (stop-motion)
      const items = s.items as any[];
      const times = items.map((it) => T(d, [it.line ?? s.at[0], it.w, it.n ?? 0]));
      const k = Math.max(0, times.filter((t) => frame >= f(t) - 1).length - 1);
      const it = items[k];
      const cols = ['cream', 'mustard', 'forest', 'paper', 'deep', 'cream'];
      const c = it.bg ?? cols[k % cols.length];
      const dk = isDark(c);
      return (
        <Page color={BG[c]} texture={c === 'cream'}>
          <Floor text={ticker} dark={dk} />
          {!it.label && <div style={{position: 'absolute', top: 400, left: 0, width: 1080, textAlign: 'center', fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: dk ? N.mustard : N.forest}}>{s.kicker ?? ''}</div>}
          <Prod key={k} src={it.src} at={times[k]} x={540} y={it.y ?? 1500} h={it.h ?? 900} rot={(k % 2 ? 3 : -3)} />
          <Label key={'l' + k} at={times[k] + 0.06} x={it.lx ?? 110} y={it.ly ?? 420} text={it.label} rot={k % 2 ? 4 : -4} color={dk ? N.mustard : N.forest} ink={dk ? N.forestDeep : N.cream} />
          {it.badge && <Stamp key={'s' + k} at={times[k] + 0.15} x={800} y={600} text={it.badge} size={64} color={dk ? N.mustard : N.forest} rot={-9} />}
          {it.save && <SaveBurst key={'b' + k} at={it.saveAt ? T(d, it.saveAt) : times[k] + 0.25} x={it.sx ?? 820} y={it.sy ?? 640} save={it.save} pct={it.pct} size={it.ss ?? 270} color={dk ? N.mustard : c === 'mustard' ? N.cream : N.mustard} />}
        </Page>
      );
    }
    case 'offer': {
      const tag = at(s.tagAt, from + 0.1);
      return page(
        <>
          <SwingTag at={tag} x={s.tagX ?? 300} y={s.tagY ?? 690} w={s.tagW ?? 640} color={dark ? N.mustard : N.forest} ink={dark ? N.forestDeep : N.cream} rot={-5}>
            <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 34, letterSpacing: 6, textTransform: 'uppercase', opacity: 0.9}}>{s.kicker ?? 'Up to'}</div>
            <div style={{fontFamily: FONT.display, fontSize: s.bigSize ?? 150, lineHeight: 0.92}}>{s.big}</div>
            <div style={{fontFamily: FONT.display, fontSize: 64, lineHeight: 1}}>{s.bigSub ?? 'OFF'}</div>
          </SwingTag>
          {s.date && <CalendarPage at={at(s.date.at, from + 0.5)} x={s.date.x ?? 790} y={s.date.y ?? 860} month={s.date.month} day={s.date.day} dow={s.date.dow} />}
          {(s.chips ?? []).map((c: any, i: number) => (
            <Chip key={i} at={at(c.at, from + 0.6 + i * 0.25)} x={c.x ?? 80} y={c.y ?? 960 + i * 100} text={c.text} bg={c.bg ?? (dark ? N.cream : N.mustard)} color={N.forestDeep} size={c.size ?? 50} />
          ))}
          {(s.stickers ?? []).map((src: string, i: number) => (
            <Prod key={src} src={src} at={from + 0.25 + i * 0.12} x={[230, 850, 540][i % 3]} y={1600} h={s.stickerH ?? 440} rot={[-5, 5, 0][i % 3]} />
          ))}
        </>,
      );
    }
    case 'product':
    case 'chapter': {
      const title = at(s.titleAt, from + 0.05);
      return page(
        <>
          {s.num && (
            <div style={{position: 'absolute', left: 78, top: 385, fontFamily: FONT.serif, fontWeight: 900, fontSize: 170, lineHeight: 0.8, color: dark ? N.mustard : N.forest, opacity: interpolate(frame, [f(from), f(from + 0.3)], [0, 1], clamp)}}>{s.num}</div>
          )}
          <Chip at={title} x={s.num ? 290 : 80} y={s.num ? 405 : 390} text={s.title} bg={dark ? N.cream : N.mustard} color={N.forestDeep} size={s.titleSize ?? 54} />
          {s.photo && <PhotoPanel src={s.photo} at={at(s.photoAt, from + 0.2)} x={s.px ?? 70} y={(s.py ?? 520) + 40} w={s.pw ?? 560} h={s.ph ?? 520} rot={s.prot ?? -3} zoom={[1.04, 1.16]} origin={s.porigin ?? '50% 50%'} seed={'p' + idx} dur={to - from} />}
          {s.src && <Prod src={s.src} at={at(s.srcAt, from + 0.3)} x={s.x ?? 760} y={s.y ?? 1590} h={s.h ?? 900} spin={s.spin} shake={s.shake ? [T(d, s.shake[0]), T(d, s.shake[1])] : undefined} />}
          {(s.chips ?? []).map((c: any, i: number) => (
            <Chip key={i} at={at(c.at, from + 0.6 + i * 0.3)} x={c.x ?? 80} y={c.y ?? 1080 - i * 100} text={c.text} bg={c.bg ?? (dark ? N.mustard : N.forest)} color={c.color ?? (dark ? N.forestDeep : N.cream)} size={c.size ?? 48} />
          ))}
          {(s.labels ?? []).map((c: any, i: number) => (
            <Label key={i} at={at(c.at, from + 0.6)} x={c.x} y={c.y} text={c.text} rot={c.rot ?? -3} color={c.color ?? (dark ? N.mustard : N.cream)} ink={c.ink ?? N.forestDeep} />
          ))}
          {s.stamp && <Stamp at={at(s.stampAt, from + 0.8)} x={s.stampX ?? 300} y={s.stampY ?? 1180} text={s.stamp} sub={s.stampSub} size={s.stampSize ?? 72} color={dark ? N.mustard : N.forest} rot={-8} />}
          {s.save && <SaveBurst at={at(s.saveAt, from + 0.7)} x={s.saveX ?? 840} y={s.saveY ?? 640} save={s.save} pct={s.pct} size={s.saveSize ?? 260} />}
        </>,
      );
    }
    case 'photos': {
      // demo: a sequence of big photos, each at a word, with a label
      const items = s.items as any[];
      const times = items.map((it) => T(d, it.at));
      const k = Math.max(0, times.filter((t) => frame >= f(t) - 1).length - 1);
      return page(
        <>
          {items.map((it, i) => (i <= k ? <PhotoPanel key={i} src={it.src} at={times[i]} x={it.x ?? 50} y={it.y ?? 360 + (i % 2) * 40} w={it.w ?? 980} h={it.h ?? 760} rot={it.rot ?? (i % 2 ? 2 : -2)} zoom={it.zoom ?? [1.02, 1.14]} origin={it.origin ?? '50% 50%'} seed={'ph' + i} dur={(times[i + 1] ?? to) - times[i] + 0.5} filter={it.filter} /> : null))}
          {items[k].label && <Label key={'pl' + k} at={times[k] + 0.2} x={items[k].lx ?? 90} y={items[k].ly ?? 1150} text={items[k].label} rot={k % 2 ? 3 : -3} color={N.mustard} ink={N.forestDeep} />}
          {items[k].save && <SaveBurst key={'ps' + k} at={items[k].saveAt ? T(d, items[k].saveAt) : times[k] + 0.4} x={items[k].sx ?? 830} y={items[k].sy ?? 1000} save={items[k].save} pct={items[k].pct} size={items[k].ss ?? 260} />}
          {items[k].chip && <Chip key={'pc' + k} at={times[k] + 0.35} x={items[k].cx ?? 90} y={items[k].cy ?? 1060} text={items[k].chip} bg={N.forest} color={N.cream} />}
        </>,
      );
    }
    case 'list': {
      const items = s.items as any[];
      return page(
        <>
          {s.title && <Headline at={from + 0.05} words={s.title} y={395} size={s.titleSize ?? 72} bgs={[dark ? N.mustard : N.forest]} colors={[dark ? N.forestDeep : N.cream]} stagger={0.08} />}
          {items.map((it, i) => {
            const t = T(d, it.at);
            if (frame < f(t)) return null;
            const sp = spring({frame: frame - f(t), fps, config: {damping: 12, stiffness: 180}});
            const tick = spring({frame: frame - f(t + 0.35), fps, config: {damping: 9, stiffness: 240}});
            return (
              <div key={i} style={{position: 'absolute', left: 80, top: (s.y0 ?? 560) + 50 + i * (s.dy ?? 170), width: 920, display: 'flex', alignItems: 'center', gap: 26, transform: `translateX(${(1 - sp) * -900}px)`, zIndex: 30}}>
                <div style={{width: 110, height: 110, flex: '0 0 110px', borderRadius: 20, background: dark ? N.cream : N.forest, color: dark ? N.forest : N.cream, fontFamily: FONT.display, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                  {it.n}
                  <div style={{position: 'absolute', right: -18, top: -18, fontSize: 56, transform: `scale(${tick})`}}>✅</div>
                </div>
                <div style={{background: dark ? N.forestDeep : N.cream, color: dark ? N.cream : N.ink, fontFamily: FONT.body, fontWeight: 800, fontSize: s.fs ?? 50, lineHeight: 1.1, padding: '18px 26px', borderRadius: 16, boxShadow: '0 8px 0 rgba(0,0,0,0.12)'}}>{it.text}</div>
              </div>
            );
          })}
        </>,
      );
    }
    case 'cta': {
      return page(
        <>
          <Headline at={from + 0.05} words={s.words} y={s.y ?? 420} size={s.size ?? 100} bgs={s.bgs ?? [dark ? N.mustard : N.forest, N.black]} colors={s.colors ?? [dark ? N.forestDeep : N.cream, N.cream]} stagger={0.12} />
          {s.button && <Button at={at(s.buttonAt, from + 0.6)} text={s.button} done={s.done} y={s.buttonY ?? 900} />}
          {(s.stickers ?? []).map((src: string, i: number) => (
            <Prod key={src} src={src} at={from + 0.2 + i * 0.12} x={[230, 850, 540][i % 3]} y={1600} h={s.stickerH ?? 440} rot={[-5, 5, 0][i % 3]} />
          ))}
          {s.date && <CalendarPage at={at(s.date.at, from + 0.4)} x={s.date.x ?? 540} y={s.date.y ?? 600} month={s.date.month} day={s.date.day} dow={s.date.dow} />}
        </>,
      );
    }
  }
  return null;
};

const Button: React.FC<{at: number; text: string; done?: string; y: number}> = ({at, text, done, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < f(at)) return null;
  const s = spring({frame: frame - f(at), fps, config: {damping: 10, stiffness: 200}});
  const ring = Math.sin((frame - f(at)) * 0.9) * 18 * Math.max(0, 1 - (frame - f(at)) / 30);
  const tap = done && frame > f(at + 0.8);
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: 1080, display: 'flex', justifyContent: 'center', zIndex: 40}}>
      <div style={{transform: `scale(${s})`, background: tap ? N.cream : N.forest, color: tap ? N.forest : N.cream, border: `5px solid ${N.forest}`, fontFamily: FONT.display, fontSize: 50, padding: '14px 40px', borderRadius: 999, display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 8px 0 rgba(0,0,0,0.15)'}}>
        <span style={{display: 'inline-block', transform: `rotate(${ring}deg)`}}>🔔</span>
        {tap ? done : text}
      </div>
    </div>
  );
};

export const makeGen = (spec: Spec, data: any) => {
  const d = data as VideoData;
  const Comp: React.FC = () => {
    const frame = useCurrentFrame();
    const starts = spec.scenes.map((s) => T(d, s.at));
    starts[0] = 0;
    const end = d.endCardStart;
    const hits = [0.03, ...starts.slice(1)];
    return (
      <AbsoluteFill style={{background: N.cream}}>
        <Camera hits={hits} amp={8}>
          {spec.scenes.map((s, i) => {
            const from = starts[i];
            const to = (starts[i + 1] ?? end) + 0.4;
            return (
              <Scene key={i} from={from} to={Math.min(to, end + 0.5)} first={i === 0} dir={i}>
                <SceneBody s={s} d={d} from={from} to={to} ticker={spec.ticker} idx={i} />
              </Scene>
            );
          })}
          {spec.snow && <Snow count={20} seed="gs" opacity={0.45} speed={0.6} />}
          {spec.end.tagline ? (
            <EndV3 at={end} tagline={spec.end.tagline} line={spec.end.line} bigLines={spec.end.bigLines} ends={spec.end.ends} cta={spec.end.cta ?? BRAND.cta} note={spec.end.note} icon={spec.end.icon ?? '⏰'} plain={spec.end.plain} products={(spec.end as any).products} />
          ) : (
            <DealEnd at={end} offer={{big: '', line: spec.end.line, ends: spec.end.ends}} bigLines={spec.end.bigLines} cta={spec.end.cta ?? BRAND.cta} note={spec.end.note} icon={spec.end.icon ?? '⏰'} />
          )}
        </Camera>
        <PhaseTag phase={spec.phase} at={0.1} out={end - 0.2} />
        <UrlBug hideFrom={end} />
        <Captions lines={d.lines as any} hideFrom={end} style={{y: 1236, font: FONT.body, weight: 800, size: 46, bg: N.cream, color: N.ink, active: N.brand, radius: 12}} maxChars={30} />
      </AbsoluteFill>
    );
  };
  return Comp;
};

/** Cover image (still): title inside the 4:5 grid crop, real product, phase tag, offer badge, ValuHub.ca. */
export const makeCover = (spec: Spec & {cover: any}) => {
  const C: React.FC = () => {
    const c = spec.cover;
    const bg = c.bg ?? 'forest';
    const dark = isDark(bg);
    return (
      <AbsoluteFill style={{background: BG[bg]}}>
        {c.photo && <Img src={staticFile(c.photo)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.photoPos ?? '50% 50%'}} />}
        {c.photo && <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(${DEEP},0.92) 0%, rgba(${DEEP},0.55) 34%, rgba(${DEEP},0.0) 55%, rgba(${DEEP},0.0) 75%, rgba(${DEEP},0.75) 100%)`}} />}
        {!c.photo && <Img src={staticFile(bg === 'cream' ? 'img/paper_cream.jpg' : 'img/paper_grain.png')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: bg === 'cream' ? 1 : 0.25, mixBlendMode: bg === 'cream' ? 'normal' : 'overlay'}} />}
        {/* products */}
        {(c.products ?? []).map((p: any, i: number) => (
          <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, zIndex: 10}}>
            <div style={{position: 'absolute', left: 0, bottom: 0, transform: `translate(-50%, 0) rotate(${p.rot ?? 0}deg)`, transformOrigin: '50% 100%'}}>
              <Sticker src={p.src} h={p.h} outline={9} />
            </div>
          </div>
        ))}
        {/* phase tag + kicker */}
        <div style={{position: 'absolute', top: 300, left: 0, width: 1080, display: 'flex', justifyContent: 'center', zIndex: 20}}>
          <div style={{background: N.black, color: N.cream, borderRadius: 999, padding: '12px 30px', fontFamily: FONT.body, fontWeight: 800, fontSize: 32, letterSpacing: 3, textTransform: 'uppercase', display: 'flex', gap: 12, alignItems: 'center'}}>
            <span style={{width: 16, height: 16, borderRadius: 8, background: N.mustard, display: 'inline-block'}} />
            {spec.phase}
          </div>
        </div>
        <div style={{position: 'absolute', top: 390, left: 60, width: 960, textAlign: 'center', zIndex: 20}}>
          {c.kicker && <div style={{fontFamily: FONT.script, fontWeight: 700, fontSize: 76, color: dark || c.photo ? N.mustard : N.forest, lineHeight: 1}}>{c.kicker}</div>}
          {c.title.map((t: string, i: number) => (
            <div key={i} style={{display: 'inline-block', margin: '8px 6px', fontFamily: i === 0 && c.serif ? FONT.serif : FONT.display, fontStyle: i === 0 && c.serif ? 'italic' : 'normal', fontWeight: 900, fontSize: c.size ?? 112, lineHeight: 1, textTransform: c.serif && i === 0 ? 'none' : 'uppercase', padding: '6px 22px 12px', color: i % 2 ? N.cream : dark || c.photo ? N.forestDeep : N.cream, background: i % 2 ? N.black : dark || c.photo ? N.mustard : N.forest, clipPath: tornClip('cv' + i + t, ['top', 'bottom', 'left', 'right'], 1.2)}}>{t}</div>
          ))}
        </div>
        {c.badge && (
          <div style={{position: 'absolute', left: c.badgeX ?? 700, top: c.badgeY ?? 1080, zIndex: 25, width: 300, height: 300, borderRadius: 150, background: N.mustard, color: N.forestDeep, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)', boxShadow: '0 14px 0 rgba(0,0,0,0.18)', border: `8px dashed ${N.forestDeep}`}}>
            <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 3}}>{c.badge[0]}</div>
            <div style={{fontFamily: FONT.display, fontSize: c.badge[1].length > 4 ? 70 : 96, lineHeight: 0.95}}>{c.badge[1]}</div>
            <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 30, letterSpacing: 3}}>{c.badge[2]}</div>
          </div>
        )}
        {/* footer: logo + url, kept inside the 4:5 crop (bottom edge ~1635) */}
        <div style={{position: 'absolute', top: 1470, left: 0, width: 1080, display: 'flex', justifyContent: 'center', zIndex: 30}}>
          <div style={{background: N.cream, borderRadius: 999, padding: '14px 36px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 10px 24px rgba(0,0,0,0.3)'}}>
            <Img src={staticFile(BRAND.logoMark)} style={{height: 64}} />
            <div style={{fontFamily: FONT.display, fontSize: 50, color: N.forest}}>{BRAND.domain}</div>
            {c.ends && <div style={{fontFamily: FONT.body, fontWeight: 800, fontSize: 32, color: N.forestDeep, background: N.mustard, borderRadius: 999, padding: '8px 18px'}}>{c.ends}</div>}
          </div>
        </div>
      </AbsoluteFill>
    );
  };
  return C;
};
