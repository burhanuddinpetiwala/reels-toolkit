# Viral craft rules (distilled from vendor-skills/, applied to every Reel)

Read this before writing scripts or specs. The sources are in `vendor-skills/INDEX.md`.

## 1. Script: problem → solution → saving
- **One idea per Reel.** If the takeaway needs two sentences, make two Reels.
- **The hook has three layers that agree** (varg): the first-frame visual, the spoken line (6–8 words, ≤ 3 s) and the on-screen text (≤ 8 words), all saying the same thing. Put the hook text on screen by frame 1 (most people watch muted).
- **Show the product or result by second 2.** Open on the strongest frame and never fade up from black.
- **Solution statements:** for each product, use problem? → what it does for you → saving. For example: "Tangled lights? Pre-lit trees: save up to $73." Use only features the listing states. Benefits are outcomes ("fits a condo corner"), never health or performance claims.
- **Order** (Meta/Toluna Reels study, via varg): hook 0–3 s → bridge → demo with 1–3 benefits, product shown more than once → offer → one CTA, said and shown. Keep the brand on screen for under 25% of the runtime and have speech plus music.
- **Top hook types for a sale** (Motion 2026): newness/sale announcement, price/saving anchor, urgency, problem-and-fix in one shot, callout ("Grandparents, this one's for you"), negation ("Stop scrolling").
- **AI host rules:** Maya can demo and state facts. She never gives a first-person result or review (FTC). Keep the AI label on.

## 2. Pacing (iart short-form, claude-motion)
- Make a visual change every 2–4 s at **uneven** intervals; a metronome rhythm reads as boring. Use punch-ins (scale to ~1.12 on a spring) as cheap pattern interrupts.
- Hold every readable state: ≥ 1 s for a short phrase, plus ~0.25 s per word beyond three. Hold the final offer ≥ 1.5 s.
- **Overlap scenes.** The next scene starts before the previous one is fully gone; a hard gap reads as loading.
- **Cut on motion.** Scenes start already moving. The end card holds ≤ 1.4 s once settled, and the whole CTA is ≤ 25% of the film.
- Loop where you can: make the last frame echo the first composition.

## 3. Motion grammar (remotion-motion-graphics, motionmaxxing, claude-motion)
- Never use linear easing except for drift or rotation. Arrivals use `bezier(0.16,1,0.3,1)` and exits `bezier(0.6,0,0.9,0.35)`; exits run about half the entrance length.
- An entrance animates 2–3 properties together (y + scale + opacity). A lone fade is forbidden.
- **Arrive from oversize, decelerating** (a slam from 2.5× in about 6 frames), not growing from zero. Allow at most one elastic spring per film.
- Stagger words by ~0.09 s and chips by ~0.2 s. Nothing enters at the same moment as something else.
- **One hero per frame**, with the lead product filling 60–85% of the usable frame on its feature beat. No small product floating in empty space.
- **Idle elements breathe:** anything on screen for more than 2 s gets subtle motion.
- **Five-layer stack:** a textured or mesh background → product/photo → type → colour grade → grain and vignette. Never a flat swatch.

## 4. Signature mechanics to reuse (product-shot-cards)
- **Before/after slider:** fast whip 8%→76% in 12 frames with overshoot, settle back to 70%, hold, then a slow sweep back to 40% (≈ 5:1 speed ratio), then hold.
- **Odometer savings:** each digit rolls like a slot reel, locks left to right with a half-step overshoot, then the whole number pulses.
- **Crash-zoom punch:** 6 frames ease-in to 2.4–2.8×, then a shake decaying from 14 px over ~6 frames. Use it to say "look at THIS".
- **Slam + impact:** the card drops from 2.5× in 6 frames, with a ring burst, dust and a shake on the landing frame. Freeze 2 frames on a hit. Save the heaviest hit (a 3-frame invert with speed lines) for the one climax per film.
- **Combo counter:** for a list of deals, each hit escalates (scale 1.3 → 1.45 → 1.6) so the list reads as building momentum.

## 5. Captions (iart caption-animation)
- Word-level timing from the voiceover, never evenly split. Show 1–4 words per page, with the active word highlighted and popping on its own spring.
- Bold sans with a heavy stroke or box. Readability beats style. Keep captions inside the safe area.

## 6. Safe zones (9:16)
- Keep the hook, the product and the caption in the centre 900×1400. Keep the top ~14% and the bottom ~35% clear of anything critical; the sides are 6%.

## 7. Never ship (motionmaxxing, visual-motion-engine)
- Page chrome: "01 / 06" counters, progress bars or tracked-caps labels with no job (a diegetic game HUD is fine when it IS the concept).
- A web-footer ending held more than 1.4 s, every scene fading to empty, everything centred at the same rhythm, or generic gradients.
- Invented stats, reviews or results, or prices that don't match the store.
- A film you didn't look at: render the stills and the contact sheet, describe each frame, then fix.

## 8. Sound (claude-motion sound-design, howseen)
- Each visual hit gets one sound on the exact frame. Leave silence before the big hit, and duck the music while text is read.
- Master to −14 LUFS with a true peak ≤ −1 dBTP (rt/mix.py already does this).

## 9. Review loop (claude-motion review-loop, business-motion-film)
- Render stills at every beat, open the sheet and answer: one focal point? Text readable at phone size? Nothing clipped? The holds long enough? The product shown more than once? A muted viewer knows what's on sale and what to do?
- Fix the worst item, re-render, and look again. Don't claim a fix you haven't looked at.
