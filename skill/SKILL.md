---
name: reel-studio
description: Plan and produce voiced short-form Reels, paid video ads (9:16, 1:1, 16:9), Story frames and carousels for any brand or store, using the private reels-toolkit repo. Asks intake questions first.
---

# Reel Studio

This skill produces a campaign's social content for any business with one toolkit, brand-themed per business:
- voiced motion-graphic Reels (hook, product savings, end card, captions)
- paid ads in 9:16, 1:1 and 16:9
- Story frames
- carousels
- post copy, plus a savings sheet

The toolkit lives at **github.com/burhanuddinpetiwala/reels-toolkit** (private). Its docs are the source of truth for formats; read them once per session:
- `docs/PROJECT.md`: project folder and JSON formats, pipeline commands
- `docs/SPEC.md`: Reel scene types and timing anchors
- `docs/EXTRAS.md`: ads, Stories, carousels
- `docs/COPY.md`: creative and copy rules that worked

Work through the phases in order. Keep updates to the user short. Show a draft early (the first Reel, rendered) before batch-producing the rest.

## Phase 0: Setup (silent, about 3 minutes)
1. Attach and clone the repo:
   - Call `add_repo` with owner `burhanuddinpetiwala`, repo `reels-toolkit` and access `push`.
   - Then run `git clone --depth 1 https://github.com/burhanuddinpetiwala/reels-toolkit ~/reels-toolkit`.
   - If the repo is unreachable, tell the user the Claude GitHub App needs access to it and stop.
2. Run `bash ~/reels-toolkit/setup.sh` in the background with a 10-minute timeout. Continue with the intake while it runs, and check `rt/doctor.sh` before rendering.
3. Check connectors with `ToolSearch` and `ListConnectors`:

| Need | Connector | If missing |
|---|---|---|
| Voiceover (required) | ElevenLabs (`creative_generate_speech`, `creative_list_voices`) | Search the registry and suggest the connector. Without it there are no Reels or ads, only carousels and Stories. |
| Product data and prices | Shopify (`graphql_query`, `productByIdentifier`), one per store | Ask for product URLs and read them with WebFetch/Firecrawl. Confirm prices with the user. |
| Music | ElevenLabs music, or the user's own tracks | Ask for royalty-free tracks |
| Lifestyle photos and clips (optional) | OpenArt or ElevenLabs image/video, or store photos | Use store photos and cut-outs only |
| Brand colours and logo (optional) | Firecrawl `scrape` with `formats:["branding"]` on the brand site | Ask the user to attach the logo and give colours |

Never install or enable a connector yourself. Name the missing one and say what it unlocks.

## Phase 1: Intake (AskUserQuestion, at most 4 questions per call, 2–3 calls)
First, check memory and project docs for this brand: an existing `brand.json`, voices, rules, a sale calendar or a past campaign. Don't ask what you already know. Mark recommended options and keep each option's description to one line.

**Round 1: brand and goal**
- Which business or site? List the known ones and offer "a new one".
- The campaign and its dates, for example "Black Friday Nov 7–30", "Spring launch" or "Always-on".
- The offer by phase: the % per phase, end dates, and any extras (free shipping, bundles, cashback).
- Outputs, multi-select: voiced Reels, paid ads, Story frames, carousels.

**Round 2: volume and audience**
- How many Reels and on what cadence (for example 3 a week from <date>)?
- Audiences to target. Suggest 4–6 from the catalogue, for example renters, families, pet parents, gift buyers, caregivers, remote workers.
- Where products and prices come from: the Shopify connector, product URLs or typed prices. Recommend URLs when there is no connector.
- Rules and claims to avoid. Suggest the defaults from docs/COPY.md, plus any category-specific ones (medical, heating, kids' safety).

**Round 3: look, voice and delivery**
- Brand kit: use the existing kit, pull it from the website, or have the user attach a logo and colours.
- Voice: suggest one per audience from `creative_list_voices`, plus a high-energy announcer for ads. Ask only if no voices are saved for the brand.
- Music: generated, or the user's own files.
- Delivery: zips in chat (default). Never auto-post or schedule unless asked.

If the user is away, take the recommended options, state them at the top of the work, and continue.

## Phase 2: Plan (confirm before producing)
1. Create the project at `~/reels-projects/<brand-slug>/<campaign-slug>/` by copying `examples/sample-project`. Write `brand.json` first: colours, fonts, logos, domain, `domainSpoken`, voices and rules.
2. Build the calendar: date, id (R01…), audience, angle or format, products, offer phase. Mix the formats: deal drop, buying guide, FAQ, comparison, top 5, countdown, last call, plus a holiday greeting with `plain` set.
3. Products:
   - Get the live price for each product from Shopify or its page, and write `products.json` with the URL, price and check date.
   - Run `rt/savings.py`. Savings are always rounded down.
   - Check that the store actually has the discount set up (Shopify `discountNodes`). If it doesn't, flag it in the plan and in the final README; don't silently publish a % the checkout won't honour.
4. Show the calendar as a short table and get a yes. If the user is away, proceed.

## Phase 3: Assets
- Logos go in `assets/`: `logo_mark` (square), `logo_word`, `logo`, `logo_white`.
- Product cut-outs: `python3 rt/cutout.py P <image url or file> <key>` → `assets/p/<key>.png`. Check each cut-out by eye; the product must match the real listing.
- Lifestyle photos and clips go in `assets/photos` and `assets/clips` (mp4, 3–5 s). Use the store's own photos first. Generated imagery must match the real product and contain no other brands, real people or text.
- Music: put `music/default.mp3` in place (instrumental, about 35 s).

## Phase 4: Scripts and voiceover
1. Write `plan.json` lines for each Reel, following docs/COPY.md.
   - The hook comes first and names the audience.
   - Lead with "up to X% off", then each product's dollar saving.
   - Extras go in one short line.
   - The last line is `close`, with the end date and domain.
   - Write numbers and the domain as spoken. Aim for 50–75 words.
   - Also write `caption` (IG, FB, hashtags, Story idea) and `link`.
2. ElevenLabs: run `creative_generate_speech` with model `eleven_v4`, the reel's voice, the prompt `[tone] ` plus all lines joined, and 2 takes.
   - Poll `creative_get_flow_run_status`.
   - Download each take with curl from `content_url` to `vo/<id>_a.mp3` and `_b.mp3`. The URLs expire, so download right away.
   - Generations auto-retry on concurrency limits; never re-submit, because that charges again.
3. Run `python3 rt/vo_pick.py P <ids>` and read the printed captions against the script. Expect a match of at least 0.9. If a word is wrong, regenerate that Reel only.

## Phase 5: Scenes, render and QA
1. Write `specs.json` (docs/SPEC.md).
   - Use a `slam` hook over a clip or photo with an "UP TO X% OFF" stamp.
   - Add `product`/`flash`/`photos` scenes with `save` + `pct` anchored on `["line","$"]`.
   - Add one `offer` scene with the big % and a small extras chip, an end card and a cover.
2. Render one Reel first with `bash rt/render.sh P R01`. Open `qa/vR01_sheet.jpg` and check:
   - text inside the safe area, no overlaps
   - % and $ correct
   - products correct
   - the end card readable
   
   Send that Reel to the user as an early draft.
3. Batch-render the rest in the background (`run_in_background`; each Reel takes about 3 minutes on 2 cores). Re-render anything that fails QA or looks wrong on the sheet.
4. Extras:
   - Ads: write `ads.json` and generate the ad VO with the high-energy voice. Run `rt/ad_prep.py` then `rt/render_ad.sh`, and write `AD_COPY.md` with Meta and Google copy and character limits.
   - Stories: `stories.json` → `rt/stories.sh`.
   - Carousels: `carousels.json` → `rt/carousel.py`, plus `carousels_captions.md`.
   - Look at a contact sheet of every output before delivery.

## Phase 6: Deliver
1. Write the project `README.md`:
   - what's included
   - offers by phase
   - **before posting:** set the discounts, re-check prices (they drift), turn on the AI label
   - anything left unchanged
2. Run `python3 rt/package.py P <Name>`. It splits zips under 380 MB because chat uploads cap at 400 MB. Send them with SendUserFile.
3. Save new brand facts the user stated (voices, rules, colours) back into the brand's `brand.json`. Offer to keep the project folder for the next campaign.

## Always
- Never invent products, prices, discounts, reviews, stats, testimonials or claims. Every product must be real and live; every saving must come from a live price × the user's %, rounded down.
- No medical, health or performance claims beyond the product page. For benefits-related products, say "check your plan" and "ask your healthcare provider".
- Every Reel and ad has a voiceover and word captions. AI voices and people get the platform's AI label.
- Ask before anything destructive, any spend over the ElevenLabs or OpenArt credits the user expects, or posting or scheduling.
- If something is your bug, say so plainly and fix it.
