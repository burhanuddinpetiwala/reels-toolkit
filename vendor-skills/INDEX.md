# Vendored video skills (reviewed Nov 24, 2026)

I reviewed all 55 repos from the user's list: the README and every SKILL.md description, plus a deep read of the ones relevant to short e-commerce Reels made in Remotion. The ones kept are copied here with their licences. Scripts and media were removed, so these are reference reading. `docs/VIRAL-CRAFT.md` turns them into rules for this toolkit.

## Kept (read before building)
| Folder | Source | Licence | Why it's here |
|---|---|---|---|
| `iart-tiktok-video/` | iart-ai/tiktok-video-skills | MIT | Hook → retention → loop grammar, 9:16 safe zones, word-level captions, countdowns |
| `varg/product-video-hooks`, `varg/ecommerce-video-ads` | vargHQ/skills | MIT | 3-layer hooks (visual, spoken and text agree), 20+ hook types, the ecommerce ad structure (hook → bridge → demo → proof → CTA), platform and FTC rules |
| `iart-ad-video/` | iart-ai/ad-video-skills | MIT | One template × a CSV = many on-brand ad variants |
| `remotion-motion-graphics/` | haidrrrry/claude-remotion-skill | MIT | Remotion craft rules: no linear easing, 2–3 properties per entrance, stagger, a five-layer stack, render-and-look |
| `motionmaxxing/` | Tejashmakwana/motionmaxxing | Apache-2.0 | Anti-slop judgment: show it then say it, cut on motion, one hero per frame, end hold ≤ 1.4 s, never-ship list |
| `visual-motion-engine/` | Lob0Garou/opus-visual-motion-engine | MIT | Plan gates (one message, signature moment, handoff table), generic-AI tells, QA critique questions |
| `product-shot-cards/` | dlazy-ai/ai-product-video | Apache-2.0 | 150+ measured shot recipes: before/after slider (fast whip, slow sweep), odometer roll, crash-zoom punch, slam, impact frames |
| `claude-motion/` | whaleyxbt/claude-motion | MIT | Measured easings and springs, reading holds, scene overlap, sound-to-picture cue sheets, review loop |
| `business-motion-film/` | echris6/motion-video-kit | MIT | Truth rules for real businesses, the lead subject at 60–85% of the frame, independent-critic loop |
| `viral-video-decomposer/` | sharon-laicc/viral-video-decomposer | MIT | Breaking a competitor's viral video into shots, mechanism and a reusable brief |
| `lottie-motion-design/` | LottieFiles/motion-design-skill | MIT | Timing and easing by emotional intent |

**Install instead of copying:** Remotion's official skills (`npx remotion skills add`). The repo has no licence file, so it isn't copied here.

## Reviewed, not kept
| Repo | Verdict |
|---|---|
| 07anishu12/CLAUDE-VIDEO-SKILLS | 80 Indian lyric/reel looks; a few ideas (comic-halftone, tier-list, breaking-news) noted in VIRAL-CRAFT, too broad to vendor |
| AbubakrChan/product-launch-motion | SaaS launch film from a URL; app UI, not retail products |
| AgriciDaniel/claude-shorts | Long video → clips; we don't cut long footage |
| Alisa0808/vox-director | Paper-collage explainer via the paid Atlas API; the look is noted for the Dec 15 paper-cutout Reel |
| F0rger123/claude-video-editing-god-mode | Raw-footage editor; overlaps with what we have |
| Finderchangchang/promo-video-skill | Chinese-market promo forms; same ideas as varg |
| Moh4696/cinematic-skill | Skia documentary camera; good idea, wrong stack |
| Mort1d/motion-graphics-skills | Showreel HTML pipeline; lessons already covered by motionmaxxing |
| Neelshah1810/Claude-Video-Skills | 11 HTML film types (social-ad is solid); overlaps with tiktok + varg |
| Safiullah-Rahu/claude-video-skills | 61 explainer formats with heavy deps; the explainer formats don't fit retail deals |
| Sunwood-ai-labs/hyperframes-motion-reel-skill | HyperFrames showreel; different stack |
| TimoteoAltobrando/ai-video-skill | End-to-end Remotion + ElevenLabs; close to our toolkit, nothing new beyond the intake questions |
| Vincentwei1021/video-shotcraft | Same shot library as dlazy (kept that one) |
| VisualxIntelligence/motion-tools-and-skills | 133 effect skills (glitch-word, stamp-type, liquid-metal); effects noted, collection too big |
| alisolanki/alis-claude-editing-skills | Talking-head edits (split-screen, ranking); we have no talking-head footage |
| charlie947/motion-graphics-skills | LinkedIn and launch-oriented; brand-intake idea already in reel-studio |
| clonn, zhuyansen, vargHQ/awesome-ai-video-agents, frankxai | Lists and catalogs, not skills |
| dylantarre/animation-principles | Disney principles for UI; covered by lottie + claude-motion |
| eternityspring/reelbench-skills | ComfyUI-based; not our stack |
| greensock/gsap-skills | Official GSAP; we render with Remotion, not GSAP |
| hassancs91/claude-faceless-shorts-creator | Faceless shorts factory; similar pipeline to ours |
| heygen-com/hyperframes, heygen-com/skills | HyperFrames framework and HeyGen avatars (paid API); a different engine |
| howseen-ai/claude-motion-design | Beat-sync + SFX-on-peak; the idea is folded into VIRAL-CRAFT |
| iart-ai (b-roll, data-animation, explainer, javascript-animation, kinetic-typography, lower-thirds, motion-skills, webgl) | Useful but off-target for deal Reels; kinetic-typography rules folded in |
| jdjf39/video-creator-skills | Bundle of motionmaxxing + watch-video; the originals are kept |
| kaventro/motion-designer, kiki-lgtm-dot/cinematic-product-promo-skill, krisyangdev/motionboard | App launch films and a shot-card fork |
| madhavsomani/animation-skills | Educational Reel styles; the pixel-arcade and paper-lab looks are noted |
| mrpaidsocial/mrpaidsocial-video-editor-agent | Footage editor with a review page; no licence, so not copied |
| riffkit/skill | Paid swap/adapt service |
| xsourabhsharma/remotion-marketing-video-skill | SaaS marketing in Remotion; covered by remotion-motion-graphics |
