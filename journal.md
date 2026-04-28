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

### Open items / next decisions

- ⏳ Saksham's row is `#ERROR!` → data unrecoverable, need to DM them to re-collect
- ⏳ `581367506` outlier (A K's row, 9 digits) — will be flagged by cleanup script for manual fix; best guess is UAE Du missing `+971` prefix
- ⏳ Original to-dos still open: WhatsApp group, first meetup plan
- 🎯 With backend bulletproof + LinkedIn post live + 13 signups, next priority is first-cohort activation

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
