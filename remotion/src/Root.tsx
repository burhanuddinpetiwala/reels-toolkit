// Compositions for the active project (src/project -> <project dir>):
//   <ID>        one 1080x1920 Reel per entry in project/specs.json, timed by project/data/v<ID>.json
//   C-<ID>      its cover still
//   AD-<id>-V/S/L  paid ad in 9:16, 1:1 and 16:9 per entry in project/ads.json
//   <storyId>   Story frame stills from project/stories.json
import React from 'react';
import {Composition, Still} from 'remotion';
import {loadFonts} from './brand';
import {makeGen, makeCover} from './kit/Gen';
import {AdV, AD_HOLD} from './kit/Ad';
import {StoryFrame} from './kit/Story';

loadFonts();

const ctx = (require as any).context('./project', true, /^\.\/(specs|ads|stories)\.json$|^\.\/data\/v[\w-]+\.json$/);
const has = (k: string) => ctx.keys().includes(k);
const specs: Record<string, any> = has('./specs.json') ? ctx('./specs.json') : {};
const ads: any[] = has('./ads.json') ? ctx('./ads.json') : [];
const stories: any[] = has('./stories.json') ? ctx('./stories.json') : [];
const data = (id: string) => (has(`./data/v${id}.json`) ? ctx(`./data/v${id}.json`) : null);

export const Root: React.FC = () => (
  <>
    {Object.entries(specs).map(([id, spec]) => {
      const d = data(id);
      return (
        <React.Fragment key={id}>
          {d && <Composition id={id} component={makeGen({...spec, id}, d)} durationInFrames={Math.round(d.duration * 30)} fps={30} width={1080} height={1920} />}
          {spec.cover && <Still id={`C-${id}`} component={makeCover({...spec, id})} width={1080} height={1920} />}
        </React.Fragment>
      );
    })}
    {ads.flatMap((ad) =>
      ([['V', 1080, 1920], ['S', 1080, 1080], ['L', 1920, 1080]] as const).map(([k, w, h]) => (
        <Composition key={ad.id + k} id={`AD-${ad.id}-${k}`} component={AdV as any} defaultProps={ad} durationInFrames={Math.round((ad.T.voEnd + AD_HOLD) * 30)} fps={30} width={w} height={h} />
      )),
    )}
    {stories.map((s) => (
      <Still key={s.id} id={s.id} component={() => <StoryFrame {...s} />} width={1080} height={1920} />
    ))}
  </>
);
