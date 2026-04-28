# Claude Community UAE — Session Journal

## 2026-04-28

### Session: Audit signup form on live site

- Inspected live page at https://alexisjbaptiste.github.io/claude-community-uae/
- Form structure (`index.html` lines 236–241): 3 required fields
  - `firstName` (text, autocomplete given-name)
  - `whatsapp` (tel, autocomplete tel)
  - `building` (textarea, "What have you been building recently with Claude Code?")
- Submit button: "Join the Community" with disabled/"Joining..." loading state
- Backend wired to a real Google Apps Script endpoint (NOT a placeholder anymore — earlier journal/memory were stale):
  `https://script.google.com/macros/s/AKfycbwANk2gNQqBFssQZqawjBjFTsdwwSgPX8kBHE9WtfVhac-XYfNaWkkFGZ-nMu_We0cj/exec`
- Probed endpoint with GET: HTTP 200, returns standard Apps Script "doGet not found" error — expected, only `doPost` is implemented
- Did NOT submit a test POST to avoid polluting the production sheet — recommend Alexis self-test from a real device
- Success state and error fallback (alert) are both implemented in JS handler (lines 256–292)
- Used `fetch` with `mode: 'no-cors'` — payload posts but JS can't read the response (this is fine for fire-and-forget signup; failures only surface as the `catch` alert if the network call itself throws)

### Findings / open items

- ✅ Form fully wired end-to-end — backend URL is live
- ✅ **Alexis confirmed 13 real phone numbers captured in the Google Sheet** — backend confirmed working in production
- ✅ **LinkedIn launch post published** (Alexis confirmed 2026-04-28) — funnel is now organic
- 🚫 **Custom domain dropped from scope** (decision 2026-04-28) — sticking with the GitHub Pages URL `alexisjbaptiste.github.io/claude-community-uae/` permanently

### Session: Fix phone-number capture — intl-tel-input + apostrophe text-storage

**Problem (from sheet screenshot):** WhatsApp column had a `#ERROR!` row (Saksham — `+...` parsed as formula → data lost), inconsistent formats (some +971, some 971, some 447, some bare national number), and one suspicious `581367506` (7-digit number with no clear country code).

**Root cause (two layers):**
1. Frontend `<input type="tel">` was freeform — no country structure, no validation, users typed whatever
2. Apps Script `appendRow([..., data.whatsapp, ...])` let Sheets coerce: `"+..."` → formula error, `"971..."` → number (leading `+` stripped)

**Fix shipped (commit `efaf2f1`):**
- **Frontend (`index.html`):** added `intl-tel-input@23.0.7` from jsDelivr CDN. Default country UAE 🇦🇪, dropdown with all countries + dial codes, `separateDialCode: true`, validates per-country with `isValidNumber()`, outputs E.164 via `getNumber()`. Submission blocked on invalid with inline terracotta error message.
- **Backend (`apps-script.js`):** prepend `"'"` (apostrophe) to whatsapp before `appendRow` → forces Sheets to store as literal text regardless of column formatting. Also synced repo to the 4-column deployed schema (was 3 in repo, 4 in deployed reality — drift from 2026-04-12 textarea addition).

**Manual steps Alexis ran:**
- Pasted new Apps Script into editor, saved, redeployed (Manage deployments → New version)
- (Optional) Format WhatsApp column as plain text — recommended

**QA (full Puppeteer matrix, 9 viewports — iPhone SE → Desktop 1440):**
- ✅ Form loads with UAE flag + `+971` dial code default on every device
- ✅ Invalid number triggers inline error on every device, no fetch fired
- ✅ Valid number sends clean E.164 (`+971501234567`) on every device
- ⚠️ Mobile: form is below the fold — pre-existing layout issue from 2026-04-12 textarea addition, NOT a regression from this change. Same vertical space as before.
- ⚠️ 1 console 404 — almost certainly missing favicon, pre-existing, harmless

**Real end-to-end test:** Puppeteer submitted one row through the live form. Alexis confirmed the row landed in the sheet as `+971501234567` (text, left-aligned, no `#ERROR!`). Test row `TEST_QA_DELETE` to be deleted.

**Status:** ✅ Phone capture is bulletproof for new signups.

### Session: Mobile-fold tighten + favicon + bulk-cleanup script (greenlit "all")

- **Mobile CSS tightened** — reduced logo size (60px), shrunk h1 to 1.7rem with smaller margin, compressed about-block font + spacing, tightened form gap and input padding. Goal: get the form closer to the fold on iPhone SE / iPhone 14.
- **Favicon added** — reused `community-logo.png` via `<link rel="icon">` and `<link rel="apple-touch-icon">`. Kills the harmless console 404.
- **Cleanup script** — `apps-script-cleanup.js` written. One-shot function `cleanupExistingRows()`: forces column C to plain-text format, prepends `+` to any 10+-digit numeric value, skips already-correct + `#ERROR!` rows, logs anything flagged for manual review. Alexis runs it once from the Apps Script editor.

### Session: Round-2 mobile tightening — passes every viewport

After round-1 still showed iPhone SE/14/Galaxy S23 with form below fold:
- Trimmed margins/padding more across mobile breakpoint
- Wrapped second about-paragraph in `.about-extra`, hidden at `max-width:400px` (iPhone SE 375 + Galaxy S23 360 only)
- Slightly smaller h1 on tiniest screens

**Final QA — ALL GREEN across all 9 viewports:**
- iPhone SE 375×559: form fits with 48px buffer (was -397px before any fix)
- iPhone 14 390×659: 133px buffer
- iPhone 14 Pro Max 430×734: 110px buffer
- Galaxy S23 360×660: 123px buffer
- Pixel 7 412×795: 145px buffer
- iPads + Desktop: all OK
- **Console errors: 0** (favicon killed the 404)
- **Network failures: 0**
- ✓ PASS — safe to announce done.

### Session: Fix duplicate signups (LinkedIn launch flooded the form)

**Problem:** Sheet showed many duplicate rows after LinkedIn post drove a wave of new signups — same name + WhatsApp + building text repeated 2× (Syed nomaan, ADARSH MENON, Ritchie Thomas, Syed, Muhammed Shammas, Moiz, others).

**Root cause:** Form handler disabled the submit button after click, but did NOT block subsequent Enter-keypresses on the form. Mobile users tapping submit + an Enter key in any input → second submit event fired during the network round-trip → duplicate row.

**Fix shipped (commit `168c3fd`):**
- Added `let submitting = false;` flag, set true after validation passes (so failed validation can still retry), reset on fetch error
- `if (submitting) return;` guard at the top of the submit handler

**Verified:** Focused puppeteer test (`/tmp/qa-dup-guard.js`) hammered the form with 5 Enter presses + 3 forced submit dispatches under a 1.5s slow-fetch stub → exactly 1 fetch call fired. Guard works.

**Cleanup:** `apps-script-dedup.js` written — `removeDuplicates()` keys on WhatsApp column C, keeps first occurrence, removes the rest. Alexis confirmed ran successfully 2026-04-28 — duplicates removed.

### Final state — Claude Community UAE signup pipeline

- ✅ Site: `alexisjbaptiste.github.io/claude-community-uae/` (permanent URL, GitHub Pages)
- ✅ Form: intl-tel-input, UAE default, validates per country, outputs E.164
- ✅ Backend: Apps Script with apostrophe text-storage — phones land as `+971...` text every time
- ✅ Sheet: real signups confirmed (`TEST_QA_DELETE` row verified by Alexis)
- ✅ Mobile: form above the fold on every modern phone (iPhone SE → Pro Max, Galaxy S23, Pixel 7)
- ✅ Favicon: live, no more console errors
- ✅ LinkedIn launch post: published 2026-04-28 — funnel running organic
- ✅ Cleanup script (`apps-script-cleanup.js`): ready for Alexis to run once on Apps Script editor

### Traction milestone — 2026-04-28 afternoon

**116 signups** captured (Alexis reported). 9× growth from morning's 13 in a few hours after LinkedIn went live. Community is no longer a "first cohort" — it's a scaled inbound funnel.

### Decision — group format + opening messages

**Format chosen:** ONE open WhatsApp group at 116. Hard moderation from message #1. (Considered Channel + Group split, rejected — too much friction for launch night.)

**Drafts written and embedded in the 11pm reminder email:**
- *Message #1 (Welcome + rules)*: hard tone, explicit "one warning then removed" policy stated upfront, "please leave on your own" exit ramp for non-builders
- *Message #2 (Founder intro)*: Alexis's intro — DesertRide + Orion + agentic-workflow scaling problem — sets the depth bar
- *Message #3 (Cadence)*: weekly Monday-Shipping, Deep-dives, Stuck, Wins formats. Sent later after intros land, not at launch.
- *Group Description / Rulebook*: 10-rule pinned constitution. Builders-only, signal-over-noise, no self-promo / recruiter / AI-bro, English working language, "make this place better than you found it"

**Routine updated:** `trig_012raCG9x1wjMNwwBcmfUZpo` now embeds all 4 drafts in the 11pm email body so Alexis can launch the group with copy/paste only — no drafting under time pressure tonight.

### Open items

- 🔥 **TODO TONIGHT (2026-04-28):** Create the WhatsApp group for the 13 signups — Alexis self-reminder
  - **Active scheduled reminder:** routine `trig_012raCG9x1wjMNwwBcmfUZpo` fires 2026-04-28T19:00:00Z (23:00 UAE), emails alexisjbaptiste@gmail.com via Gmail connector
  - Manage: https://claude.ai/code/routines/trig_012raCG9x1wjMNwwBcmfUZpo
- ⏳ Alexis to run `cleanupExistingRows()` to backfill existing 12 rows
- ⏳ Saksham's row is `#ERROR!` → data unrecoverable, DM to re-collect
- ⏳ `581367506` (A K) — flagged by cleanup script; best guess UAE Du missing `+971` prefix
- ⏳ First meetup plan (date, venue, format)
- 🎯 Backend bulletproof + LinkedIn live + 13 signups → next priority: first-cohort activation

## 2026-04-14

### Session: Remove urgency copy from landing page

- Removed "Spots are limited. The first cohort is forming now." line from about section
- Pushed to main — live via GitHub Pages

## 2026-04-12

### Session: Add "what are you building" field to signup form

- Added `<textarea name="building">` between WhatsApp field and submit button
- Added matching CSS for textarea (same border, background, focus styles as inputs; `min-height: 90px`, `resize: vertical`)
- Updated JS handler to extract `building` from form and include it in the POST payload
- Committed and pushed to main — deployed via GitHub Pages

## 2026-03-27

### Session: Initial launch

- Built one-page landing website for Claude Community UAE
- Target: technical practitioners and developers in the UAE building with Claude
- Design: minimalist, Claude Code color palette (purple #6B4FBB, terracotta #DA7756, beige #F5F0E8 background)
- Features: hero headline, startup-tone pitch copy, join form (first name + WhatsApp number)
- Form submits to Google Apps Script webhook (URL placeholder — needs configuration)
- Deployed via GitHub Pages (free) at https://alexisjbaptiste.github.io/claude-community-uae/
- Repo: https://github.com/alexisjbaptiste/claude-community-uae
- Switched accent color from purple to Claude terracotta (#DA7756)
- Added pixel art mascot logo to website and creatives
- Created 3 versions of LinkedIn social card (social-card.png, v2, v3)
- LinkedIn post drafted and saved to Notion
- Created CLAUDE.md with project rules

### To-do for 2026-03-28

- [ ] Set up Google Apps Script webhook + Google Sheet to capture form submissions
- [ ] Update `index.html` with the live Google Apps Script URL
- [ ] Publish LinkedIn post with `social-card-v3.png`
- [ ] Buy a custom domain and point it to GitHub Pages
- [ ] Create a WhatsApp group for the community
- [ ] Plan first meetup: date, venue, format
- [ ] Design a simple agenda / format for community meetups
