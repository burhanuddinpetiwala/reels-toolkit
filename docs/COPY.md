# Copy and creative rules (learned on the ValuHub November campaign)

## What made the Reels work
- **First 3 seconds:**
  - Open on a slam-in hook timed to the first spoken word, over a real product or a lifestyle clip from frame 1.
  - Hook formulas that worked: "Wait. X already started?!", "It's live! Up to 40% off", "Tree red flags?", "Still working from the kitchen table?", "Your pet made a Black Friday list", "Caring for a parent?"
- **Lead with the offer.** Put the headline "up to X% off" in the hook, the stamp and the end card. Then give each product's **dollar** saving. Put extras (volume discounts, free shipping, cashback) in one small chip or line, never in a scene of their own.
- **Show savings, not prices.** Saving = live price × %, rounded **down** to the whole dollar. Re-check prices before posting; dropship prices drift daily.
- **One audience per Reel.** Speak to them by name: renters/condo, busy families, hosts, pet parents, remote workers, parents and grandparents, caregivers, benefits-plan holders. Cast the voice to match: excited male for deals, warm female for caregivers, calm for health benefits.
- **Educate as well as sell.** Buying guides (measure the ceiling, check their height), FAQs (no chimney? holds 880 lb?), comparisons (power vs manual vs massage), top-5 countdowns, checklists.
- **End card:** a two-line tagline, the offer, an urgency pill with the end date, a tapping "Shop <domain> →" button and a product shelf.
- **Rhythm:** one idea per scene, a scene change every 2–4 s and 20–35 s in total. Every Reel has a voiceover and word-by-word captions.

## Hard rules (confirm per brand, but these are the defaults)
- Never invent products, prices, promos, reviews, stats or testimonials. Every product and price comes from the live store or the user.
- Don't publish a % the store won't honour at checkout. Check the discount is set up, or flag it before delivery.
- No medical or health claims. Say "may be covered, check your plan" and "ask your healthcare provider".
- No heating or performance claims you can't source. Describe features only as the product page states them.
- AI-generated voices and people get the platform's AI label.
- Never imitate another brand or person. Use only the brand's own logo and assets.
- No song lyrics or copyrighted music. Music is generated or licensed.

## Voiceover (ElevenLabs eleven_v4)
- Generate 2 takes and let `vo_pick.py` choose by speech match.
- Start the prompt with a tone tag: `[excited]`, `[warmly]`, `[calmly]`, `[cheerfully]`, `[playfully]`, `[gently]`.
- Write numbers and the domain as spoken.
- Paid ads: `[very excited, high energy, fast-paced announcer]` with a radio-DJ style voice.

## Music
Use about 30–40 s of instrumental, no vocals, at around 100–120 bpm for deals or 70–90 bpm for calm Reels. Put it in `music/default.mp3` or `music/<id>.mp3`. It is ducked under the voice automatically.
