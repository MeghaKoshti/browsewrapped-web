# BrowseWrapped Web

[![CI](https://github.com/MeghaKoshti/browsewrapped-web/actions/workflows/ci.yml/badge.svg)](https://github.com/MeghaKoshti/browsewrapped-web/actions/workflows/ci.yml)

**BrowseWrapped turns your browser history into a "Spotify Wrapped"-style report**: what you explored, when you browse, which topics are growing, and a knowledge map of your interests.

**Live demo: [browsewrapped.vercel.app](https://browsewrapped.vercel.app)** · click **Try with sample data**, no upload needed. The API runs on a free plan that sleeps when idle, so the first request can take up to a minute while it wakes up.

This repo is the **React frontend**. The analysis happens in the Rails API: [browsewrapped-api](https://github.com/MeghaKoshti/browsewrapped-api). For how the pieces fit together and why, see [Architecture & decisions](https://github.com/MeghaKoshti/browsewrapped-api#architecture--decisions).

![BrowseWrapped results page](docs/screenshots/wrapped.jpg)

## Screenshots

| Upload | Then vs now |
|---|---|
| ![Upload page](docs/screenshots/upload.jpg) | ![Last 30 days compared with the 30 days before](docs/screenshots/then-vs-now.jpg) |
| **What you explored** | **Browsing rhythm (day × hour heatmap)** |
| ![Topic breakdown and most visited sites](docs/screenshots/explored.jpg) | ![Heatmap](docs/screenshots/rhythm.jpg) |
| **Knowledge map** | **Persona card (downloaded PNG)** |
| ![Topic graph](docs/screenshots/universe.jpg) | ![1080×1350 persona card image](docs/screenshots/persona-card.jpg) |
| **Export guide** | **Mobile (375 px)** |
| ![Where to find your history file: browser tabs with copyable file paths](docs/screenshots/export-guide.jpg) | ![Results page on a phone](docs/screenshots/mobile-results.jpg) |

> Screenshots use the synthetic sample file from the API repo (`sample/sample_history.json`), not real browsing data.

## Features

- **Try with sample data:** one click shows a full report from a synthetic history, no export needed
- **Upload or import:** drop a Chrome Takeout JSON, an extension export (JSON or CSV), or the browser's own SQLite history database: Chrome/Edge `History`, Firefox `places.sqlite` or Safari `History.db` (the file picker has no extension filter, so the extensionless `History` file can be chosen). When the API runs on your own machine, "Import from Chrome" reads Chrome's database directly
- **Export guide:** step-by-step tabs for Chrome, Firefox, Safari, Edge and other browsers, with file locations on macOS, Windows and Linux and a one-click copy for each path. It opens on the visitor's own browser
- **Persona card:** a fun "you are…" summary (The Builder, The AI Pioneer…) based on your top topics
- **Download or share image:** save your persona card as a 1080×1350 PNG (persona, top topics, key stats, and the site address from `VITE_PUBLIC_URL` next to the date range), made in your browser. On phones the button opens the system share sheet (`navigator.share` with the file) and falls back to a download elsewhere
- **Story pack:** five 1080×1920 slides for Instagram, WhatsApp or LinkedIn stories (persona, top topics, browsing rhythm, then vs now, streak), each with a "Make yours at …" watermark. Slide 1 is free; slides 2–5 unlock with a Wrapped Pass. "Make your own" links on shared reports carry `?ref=share`
- **Stats:** total visits, hours browsed, daily average, top interest, streaks
- **Charts:** topic breakdown, most-visited sites and pages, activity calendar, day × hour heatmap, weekly and monthly patterns
- **Trends:** which interests are rising or falling, and how your curiosity shifted over time
- **Then vs now:** your latest 30 days against the 30 before (visits, active days, hours and topics), with a text summary and table view of the chart
- **Knowledge map:** an interactive graph of topic clusters (drag to explore)
- **Large files:** big uploads are analysed in the background; `/analyses/:id` shows a processing screen and polls until the report is ready
- **Delete my data now:** the report page has a "Delete this report now" button that removes the stored analysis from the API straight away (it uses the one-time delete token from the upload, kept in `sessionStorage` for that tab)
- **Wrapped Pass:** a pricing page in ₹ or $, checkout, Pass activation and "Restore my Pass" by email (see [Pricing and the Wrapped Pass](#pricing-and-the-wrapped-pass))
- **Share links:** "Share my report" creates a public `/r/:token` page with aggregated stats only (no URLs, titles, searches or site names), which you can delete at any time
- **Rich link previews:** sharing also uploads the persona card as a 1200×630 PNG (made in the browser, at most 300 KB). The link you copy is the API's `preview_url` (`/s/:token`), which shows that card in WhatsApp, X, LinkedIn and Slack previews and then opens the report. `index.html` has default Open Graph and Twitter tags with a static `public/og-image.png`; set `VITE_PUBLIC_URL` so its URL is absolute
- **Accessible and responsive:** works from 375 px phones up, keyboard friendly (skip link, visible focus), WCAG AA contrast, and every chart has a text alternative
- **Friendly errors:** unsupported or empty files, databases that aren't browser history or were copied half-written, oversized uploads and rate limits (with the real wait from `Retry-After`) get a plain-English message instead of a crash
- **Ready to deploy:** Vercel config with SPA rewrites, a strict Content Security Policy and security headers; the API URL comes from `VITE_API_URL`, and report pages and charts load as separate chunks
- **Tested:** Vitest + React Testing Library suite (pages, period comparison, persona image, error copy, skip link), run with lint and the build in CI

## Privacy

What the upload page tells visitors, and what actually happens:

- **The uploaded file** is read on the API server and deleted as soon as it has been analysed.
- **The report** (totals, topics, top sites, top pages with address and title, and top searches) is kept for **7 days** so the visitor can reopen `/analyses/:id`, then a daily job deletes it.
- **Delete now:** the upload response carries a one-time `delete_token`. The web app keeps it in `sessionStorage` (`bw.deleteTokens`, a map of analysis id to token) and sends it as `X-Delete-Token` to `DELETE /api/v1/analyses/:id`. Only the tab that uploaded the file can delete it early.
- **AI categorisation:** up to 50 domain names the rules don't recognise (for example `example.com`) may be sent to Google Gemini. Never full URLs, page titles or searches.
- **Share links** contain aggregated stats and topics only and expire after 30 days.

## Pricing and the Wrapped Pass

The Wrapped Pass is a one-time payment (no subscription) that unlocks extra features for 12 months. The API owns prices, checkout and entitlements; the web app only shows them.

- **`/pricing`** reads `GET /api/v1/pricing` and shows the free vs Pass table, in ₹ for an `en-IN`-style locale or an Indian timezone and in $ otherwise, with a manual ₹/$ toggle. The early-bird price applies until the API's `early_bird_until`. Pass features that aren't built yet are marked "Coming soon".
- **Get the Pass** asks for an email, calls `POST /api/v1/checkouts` and redirects to the hosted checkout (only `http(s)` URLs are followed).
- **`/billing/success`** polls `GET /api/v1/me` every 2 s until the webhook has created the Pass, and shows a help message after 30 s. With no session on the device it emails a sign-in link instead. In development the fake checkout adds `?token=` so the whole flow can be clicked through locally.
- **`/billing/cancel`** confirms nothing was charged.
- **Restore my Pass** emails a single-use sign-in link (`POST /api/v1/sessions/magic_link`). The link opens **`/auth/verify?token=`**, which POSTs the token to `/api/v1/sessions/verify` once, removes it from the address bar and stores the session token in `localStorage` (`bw.passToken`, sent as `Authorization: Bearer`).
- **`usePass()`** (`src/pass/passContext.js`) gives any component `{ status, hasPass, email, validUntil, refresh, signIn, signOut }`. `PassProvider` checks a stored token with `/me` once per page load and forgets it on a 401.

## Legal pages

`/privacy`, `/terms`, `/refund` and `/contact` are lazy-loaded pages written for an **India-based individual operator** selling a one-time Wrapped Pass through a merchant of record (Dodo Payments). Every page links from the site footer, and the upload drop zone says "By uploading you agree to the Terms and Privacy Policy".

> **Megha must review these pages before launch. They are a plain-English starting point, not legal advice.** Check them against the DPDP Act 2023 and its rules, the payment provider's requirements and how the app actually behaves (retention, processors, email provider, analytics), and ask a lawyer if anything is unclear.

What to set before publishing:

| Setting | Where | Used for |
|---|---|---|
| `VITE_LEGAL_NAME` | build env | Operator and grievance contact name (default `[Operator name]`) |
| `VITE_CONTACT_EMAIL` | build env | Contact, privacy, grievance and refund email (default `contact@example.com`) |
| `VITE_LEGAL_CITY` | build env | Courts named in the Terms (default `[City]`) |
| `LEGAL_LAST_UPDATED` | `src/lib/legal.js` | The "Last updated" date on all four pages. Change it with every edit |

The refund window, retention periods and minimum age are constants in the same file.

## Tech stack

- React 19 + Vite
- Tailwind CSS 4 (CSS-first config in `src/index.css`, via `@tailwindcss/vite`)
- Recharts for charts, D3 for the force-directed knowledge map
- Axios for API calls
- Vercel for hosting (SPA rewrites and security headers in `vercel.json`)
- React Router

## Getting started

### 1. Start the API

Follow the setup in [browsewrapped-api](https://github.com/MeghaKoshti/browsewrapped-api) and run it on `http://localhost:3000`.

### 2. Start the frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` requests to `http://localhost:3000` (see `vite.config.js`).

### 3. Try it

Upload `sample/sample_history.json` from the API repo, or your own history. The upload page has a guide for every browser; in short:

- **Chrome / Edge:** the `History` file in your profile folder (no extension), or a [Google Takeout](https://takeout.google.com) export
- **Firefox:** `places.sqlite` in your profile folder (open `about:support` → Profile Folder)
- **Safari:** `~/Library/Safari/History.db`
- **Any browser:** a CSV or JSON file from a history-export extension

Browsers keep their history database busy while they're open, so quit the browser or upload a copy of the file.

### Test

```bash
npm test          # run the Vitest + React Testing Library suite once
npm run test:watch
```

Tests run in jsdom with the API client mocked, so no API server is needed. CI runs lint, tests and the build on every pull request.

### Build

```bash
npm run build
```

## Deploy

**Live setup (all free tiers):**

| Part | Where | URL |
|---|---|---|
| Web app (this repo) | Vercel Hobby | https://browsewrapped.vercel.app |
| Rails API | Render free web service (Docker, Singapore) | https://browsewrapped-api.onrender.com |
| Database | Neon free Postgres (Singapore) | — |

Vercel's Hobby plan is for non-commercial use only. Before selling anything, move to Vercel Pro or serve this build from another host.

### Vercel settings

1. **Import the repo in Vercel.** It detects Vite: build command `npm run build`, output directory `dist`.
2. **Environment variables** (Project → Settings → Environment Variables). They are read at build time, so **redeploy** after changing any of them:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://browsewrapped-api.onrender.com` |
   | `VITE_LEGAL_NAME` | Operator name shown on the legal pages |
   | `VITE_CONTACT_EMAIL` | Support / grievance email |
   | `VITE_LEGAL_CITY` | City for the Terms' jurisdiction |

   Without `VITE_API_URL` the app calls `/api` on its own origin, which only works with the Vite dev proxy. See `.env.example`.
3. **The API origin is in the CSP.** `vercel.json` allows `https://browsewrapped-api.onrender.com` in `connect-src`. If the API moves, change it there too (scheme and host only), otherwise the browser blocks every API call. A test in `src/test/vercelConfig.test.js` guards it.
4. **The API must allow this site.** On the API, `CORS_ORIGINS=https://browsewrapped.vercel.app`.

### Free API sleeping

Render's free plan stops the API after 15 minutes without visits. The first request after that fails at Render's proxy until the server is back (usually under a minute). The app handles this: `src/api/wake.js` retries the sample report, uploads and shared-report links for about a minute and shows "Waking up the server…" instead of an error. The API's own errors (rate limits, bad files, 503 with a JSON body) are never retried.

### What `vercel.json` sets up

- **Deep links:** every path except `/api/*` falls back to `index.html`, so `/r/:token` and `/analyses/:id` links open directly.
- **Security headers:** a Content Security Policy (only this site's scripts and styles, Google Fonts, the API in `connect-src`, `data:`/`blob:` images for the PNG export, no framing), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns off camera, microphone and location.
- **Caching:** hashed files in `/assets/` are cached for a year.

"Import from Chrome" reads Chrome's database on the machine the API runs on, so the upload page only shows it when `VITE_API_URL` is empty or points at `localhost`. Visitors to the hosted site upload their history file instead.

The CSP needs no `'unsafe-inline'`: styles live in `src/index.css`, and React and D3 set inline styles through the DOM, which CSP allows. Keep new `<style>` tags out of components.

To check a production build locally:

```bash
VITE_API_URL=https://browsewrapped-api.onrender.com npm run build
npx vite preview   # http://localhost:4173
```

The report pages, Recharts and D3 are split into separate chunks that load on demand, so the upload page only downloads about 300 kB of JavaScript (about 100 kB gzipped).

## Project status

🚀 Live at [browsewrapped.vercel.app](https://browsewrapped.vercel.app). Next up: the Wrapped Pass, story-format share slides and SEO export guides (in review).

## Author

**Megha Koshti**, Ruby on Rails developer · [GitHub](https://github.com/MeghaKoshti) · [LinkedIn](https://www.linkedin.com/in/megha-koshti)

## License

[MIT](LICENSE)
