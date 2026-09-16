# NextSelf Advisory | Coaching — website

Static site. No build step, no dependencies. Ten pages plus a shared stylesheet and one script.

```
index.html                      Home — overview that routes onward
approach.html                   The NextSelf Model, four pillars, engagement, fit
coaching.html                   Executive coaching + pricing + the AI comparison
startup-advisory.html           Founders & early-stage teams
early-starters.html             New grads & early career
testimonials.html               Client testimonials  ← see below
about.html                      The coach — Indrasanan Krishnan
brief.html                      The NextSelf Brief (newsletter)
faq.html                        All FAQs in one place
contact.html                    Book a call — the only page with the calendar link

nextself_startups_v1_0.html     Redirect stub → startup-advisory.html
nextself_earlystart_v1_0.html   Redirect stub → early-starters.html

assets/css/styles.css           Whole design system
assets/js/main.js               Reveal, nav, accordion, tabs, count-up, gate
assets/img/wordmark.png         Full lockup (dark type, for light grounds)
assets/img/wordmark-light.png   Full lockup (light type, for indigo grounds)
assets/img/mark.svg             "N›" mark as vector — favicon, hero, inline use
assets/img/mark.png             "N›" mark raster — favicon fallback
assets/img/indrasanan.jpg       Portrait — hero on 3 pages, and about.html
```

**Structure follows the Global Digital pattern:** a home page that introduces and routes
onward, with real separate pages for everything substantial — rather than one long scroll.
Home went from 13,263px to 5,723px.

Nav is **Approach · Services · Testimonials · The Brief · About**, plus a *Book a call* button.
"Services" is an anchor to the three-way router on the home page, which links to the three
service pages. FAQ sits in the footer.

Every CTA on every page points to `contact.html`, and the HoneyBook calendar is **embedded
inline** there so visitors book without leaving the site.

## Booking (HoneyBook)

The scheduler is the one the live site already uses:

```
https://nextselfllc.hbportal.co/schedule/69c7d46bc8ed7c00285031d3
```

It is iframed into the `#book` section of `contact.html`. HoneyBook sends no
`X-Frame-Options` or CSP `frame-ancestors` header, so embedding is permitted.

The URL appears **only in `contact.html`**, in three places: the iframe `src`, the fallback
link inside the frame, and the "Open in a new tab" link below it — plus the domain shown as
visible link text. Everywhere else on the site links to `contact.html#book`. To change the
booking URL, edit that one file:

```bash
grep -n hbportal contact.html
```

If the frame fails to load, an error block below it points to the calendar directly — and an
"Open in a new tab" link is always visible regardless, so booking is never unreachable. There is
deliberately no load timeout: the frame is cross-origin, so a timer could hide a working
calendar behind an error.

Nav and footer are duplicated in each file (no build step, so the site stays hand-editable).
If you add a nav item, update all ten pages.

## Testimonials

The published page shows **no invented quotes**. Fabricated endorsements are prohibited by the
brand brief, and for a US business they are actionable under the FTC's endorsement rules
(16 CFR Part 255) — which since 2024 carry civil penalties. For a practice selling discretion
and honesty, it is also the single worst thing to be caught doing.

**Live state.** `testimonials.html` and the home page both show a designed panel —
*"Nothing here yet. On purpose."* — explaining that quotes appear only with permission, backed
by the real credentials. It reads as discretion rather than absence, and is publishable as is.

**Preview mode.** Five clearly fictional samples live in a `<template>` and render **only** when
the URL carries `?demo=1`:

```
http://localhost:4180/testimonials.html?demo=1
```

That shows the populated layout to a stakeholder, behind a loud striped "Preview mode" banner,
with every quote prefixed `SAMPLE —` and attributed to "Sample Person". Without the parameter
the samples are inert markup and never reach a visitor. Verified: 0 quotes rendered and no
`SAMPLE` text anywhere in the live DOM; 5 rendered with `?demo=1`.

**Adding a real one.** Copy a block out of the `<template>` in `testimonials.html` into
`<div class="tm-grid">` above it, replace the text, and delete the sample. Once the grid has
real content, delete the `#tm-empty` panel. Do the same on `index.html`.

- The avatar is **initials, not a photo**, so you never have to ask anyone for a headshot.
- Anonymised attribution ("Director · Healthcare") is fully supported and is often what people
  will actually agree to.
- Add `is-featured` to one card to make it span two columns on a dark ground. Use it for your
  single strongest quote only — the effect dies if everything is featured.

## Running it locally

```bash
npx --yes http-server . -p 4180 -c-1
```

Then open <http://localhost:4180>. Any static server works; there is nothing to compile.

## Deploying

Upload the files as they are. The two `nextself_*_v1_0.html` stubs exist because those URLs
are already live and may be linked from LinkedIn or the newsletter — they redirect to the new
clean paths. If the host serves extensionless URLs (`/startup-advisory` → `startup-advisory.html`),
the stubs keep working as-is; if not, configure that mapping or keep the old paths in circulation.

## Design system

Still exactly three brand colours. Richness comes from **tonal depth inside them** — gradient,
grain, glow, translucency — not from new hues.

| Token | Value | Use |
|---|---|---|
| `--off-white` | `#F8F4EE` | Light ground |
| `--warm` / `--warm-2` | `#F0EAE0` / `#E8E0D3` | Warm sections (gradient pair) |
| `--paper` | `#FFFFFF` | Cards |
| `--indigo` | `#2D3250` | Brand indigo |
| `--indigo-2` | `#3E4568` | Gradient highlight |
| `--indigo-deep` | `#1A1E33` | Dark ground base |
| `--indigo-ink` | `#12152A` | Footer, marquee, deepest point |
| `--gold` | `#F0A500` | Accent — **rationed** |

The four indigo steps are what let a dark section read as *ink* rather than as flat `#333`.
Every dark ground is a layered radial gradient plus an SVG film-grain overlay at ~16% on
`overlay` blend — that grain is doing most of the work against the "flat digital" look.

**Scroll rhythm is deliberate:** dark hero → ink marquee → light → paper → dark Model →
light pillars → warm coach → light compare → paper pricing → light FAQ → dark Brief panel →
dark CTA → ink footer. Alternating hard, rather than page after page of cream.

Gold stays scarce: eyebrows, the two key nodes of the Model, list markers, the featured pricing
tier, one italic word per headline, and the closing CTA. The hero CTA is deliberately *not* gold —
it inverts to off-white so gold still lands when it arrives at the bottom of the page.

Type is **Georgia** for display (a system font — nothing to load, nothing to 404) against
**Inter** for UI. Display runs to 88px against 16px body — a ~5.5× ratio. Oversized outlined
ghost numerals carry the pillars and the service cards.

Motion: scroll-reveal (fade + 20px rise, 60ms stagger, fires once), two sticky columns, a
looping marquee, a slow-rotating dashed ring and floating glass chips in the hero, hover lifts
with a gold hairline wipe across each card's top edge, count-up on stats. All disabled under
`prefers-reduced-motion`. No parallax, no scroll-jacking.

### Two CSS traps worth remembering

- `overflow-x: hidden` on `body` makes body its own scroll container, which zeroes
  `window.scrollY` and silently kills both the sticky-nav state and `position: sticky`.
  Use `overflow-x: clip` on `html` instead. (This bit us once already.)
- The reveal's hidden state is scoped under `.js`, and `main.js` force-shows everything after
  2.5s if the observer never fires. Without both, a failed IntersectionObserver leaves the
  entire page at `opacity: 0`.

## Things you should know

**The access gate is not security.** `assets/js/main.js` hides an overlay when the code in
`data-code` matches. The entire page content is in the DOM regardless — anyone can read it with
View Source, exactly as on the current live site. It is kept as a *positioning* device
(a selective practice, signalled). If you need real privacy, use host-level protection:
Cloudflare Access, a Netlify password, or HTTP basic auth. A referral link of the form
`?access=nextself2026` opens it without typing anything.

**The newsletter form has no backend.** It validates the address and hands off to `mailto:`.
When The Brief gets a real provider (Beehiiv, ConvertKit, Substack), replace `initBrief()` in
`main.js` with their endpoint.

## Open questions for the client

1. **Startup Advisory pricing contradicts itself.** Carried over verbatim from the live site:
   Starter is 5 hours at $399 (~$80/hr), Builder is 10 hours at $900 ($90/hr) labelled
   *"save 10%"*. The larger block is **more** expensive per hour, so it neither saves 10% nor
   rewards the bigger commitment. Deliberately not "fixed" — pricing is your call. Options:
   $720 for 10 hours (a true 10% off $80/hr), or drop the "save 10%" claim.

2. **The logo's gold is not the brand's gold.** The wordmark uses bronze `#AB8A61`; the brief
   locks Amber Gold `#F0A500`. The logo is used exactly as supplied and the site uses the brief's
   amber, so the two sit side by side. Worth reconciling one way or the other.

3. **Location is inconsistent.** The old main page said Raleigh, NC; the old startup page said
   Morrisville, NC; the Early Starters FAQ says Raleigh–Durham. All three now say Raleigh, NC.
   Confirm which is right.

4. **"6 session types" was stale.** The old Early Starters hero said 6; the page listed 8, and
   the main site said 8. Now 8 everywhere.

5. **The Leadership Assessment is not built.** The brand brief's biggest gap is a self-serve
   ten-minute diagnostic as the front door. It is deliberately absent rather than faked — the
   brief is explicit that nothing should appear publicly as an existing service before it exists.
   It needs a real scoring methodology first.

6. **Tagline retired.** "Your better version is your NextSelf" was the old hero line, and it sits
   on the brand brief's own *never say this* list ("Become the best version of yourself").
   Replaced with **"Understand how you operate. Then decide what changes."**

7. ~~There is no photograph of Indrasanan.~~ **Resolved.** There *was* one all along — embedded
   as a base64 JPEG in the live site's `#about` section (978×803, `alt="Indrasanan Krishnan"`).
   Extracted, resized to 900px and optimised from 104KB to 36KB as
   `assets/img/indrasanan.jpg`, now used on `about.html` and as that page's `og:image`.

   The panel crops it with `object-fit: cover` and `object-position: 54% 22%` — the source is
   landscape, the panel is portrait, and the face sits right of centre. If you swap the photo,
   re-check that `object-position`.

   The same portrait now also leads the hero on `index.html`, `startup-advisory.html` and
   `early-starters.html`, replacing the abstract logo-in-an-orb graphic. A boutique practice
   sells the practitioner, so the hero shows the person rather than a mark. Each page carries
   its own `.hf-chip` line (board level / product · pricing · GTM / senior perspective).

   A second image would still help — a candid or working shot, so the hero and the About page
   are not the same photograph.

8. **A quote was restored to verbatim.** Indrasanan's pull quote contains "build a **better
   version** of themselves", and the closing paragraph says "we build a better version of you".
   Both echo the brand brief's *never say this* list. They are his own attributed words, so
   they have been left exactly as written on the live site rather than edited. If you want the
   brief applied strictly here, that is a decision for him — not something to change silently.
