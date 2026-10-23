# BrowseWrapped Web

[![CI](https://github.com/MeghaKoshti/browsewrapped-web/actions/workflows/ci.yml/badge.svg)](https://github.com/MeghaKoshti/browsewrapped-web/actions/workflows/ci.yml)

**BrowseWrapped turns your browser history into a "Spotify Wrapped"-style report**: what you explored, when you browse, which topics are growing, and a knowledge map of your interests.

This repo is the **React frontend**. The analysis happens in the Rails API: [browsewrapped-api](https://github.com/MeghaKoshti/browsewrapped-api). For how the pieces fit together and why, see [Architecture & decisions](https://github.com/MeghaKoshti/browsewrapped-api#architecture--decisions).

![BrowseWrapped results page](docs/screenshots/wrapped.jpg)

## Screenshots

| Upload | What you explored |
|---|---|
| ![Upload page](docs/screenshots/upload.jpg) | ![Topic breakdown and most visited sites](docs/screenshots/explored.jpg) |
| **Browsing rhythm (day × hour heatmap)** | **Knowledge map** |
| ![Heatmap](docs/screenshots/rhythm.jpg) | ![Topic graph](docs/screenshots/universe.jpg) |

> Screenshots use the synthetic sample file from the API repo (`sample/sample_history.json`), not real browsing data.

## Features

- **Try with sample data:** one click shows a full report from a synthetic history, no export needed
- **Upload or import:** drop a Chrome Takeout JSON, an extension export (JSON) or a CSV, or let the API read Chrome's local history database (when the API runs on the same machine)
- **Persona card:** a fun "you are…" summary (The Builder, The AI Pioneer…) based on your top topics
- **Download image:** save your persona card as a 1080×1350 PNG (persona, top topics, key stats), made in your browser
- **Stats:** total visits, hours browsed, daily average, top interest, streaks
- **Charts:** topic breakdown, most-visited sites and pages, activity calendar, day × hour heatmap, weekly and monthly patterns
- **Trends:** which interests are rising or falling, and how your curiosity shifted over time
- **Then vs now:** your latest 30 days against the 30 before (visits, active days, hours and topics), with a text summary and table view of the chart
- **Knowledge map:** an interactive graph of topic clusters (drag to explore)
- **Large files:** big uploads are analysed in the background; `/analyses/:id` shows a processing screen and polls until the report is ready
- **Share links:** "Share my report" creates a public `/r/:token` page with aggregated stats only (no URLs, titles, searches or site names), which you can delete at any time
- **Accessible and responsive:** works from 375 px phones up, keyboard friendly (skip link, visible focus), WCAG AA contrast, and every chart has a text alternative

## Tech stack

- React 19 + Vite
- Tailwind CSS 3
- Recharts for charts, D3 for the force-directed knowledge map
- Axios for API calls
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

Upload `sample/sample_history.json` from the API repo, or export your own history:

- **Chrome:** [Google Takeout](https://takeout.google.com) → Chrome → `BrowserHistory.json`
- **Firefox / others:** use an "Export Browsing History" add-on to get a CSV or JSON file

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

## Project status

🚧 Actively in development. Ideas on the list: year-over-year comparison and more browser import options.

## Author

**Megha Koshti**, Ruby on Rails developer · [GitHub](https://github.com/MeghaKoshti) · [LinkedIn](https://www.linkedin.com/in/megha-koshti)

## License

[MIT](LICENSE)
