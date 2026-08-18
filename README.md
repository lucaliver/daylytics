# Daylytics

A local dashboard for [Daylio](https://daylio.net/) CSV exports, built to show mood and activity trends across multiple years instead of one year at a time. Not affiliated with Daylio.

Runs entirely in the browser. No backend, no accounts, no data leaves your device.

## Features

- Mood timeline with monthly average and moving average
- Year over year comparison of mood, frequency, and activity diversity
- Activity change ranking (risers and fallers) with sparklines
- Activity heatmap
- Mood distribution over time
- Best/worst day drill-down
- Notes word frequency analysis

## Principles

- 100% local, nothing leaves the browser
- No backend, no accounts
- Multi-year view by default
- Handles messy or partial data with visible coverage signals
- No AI

## Getting started

Requires Node.js v22+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and drop in a Daylio CSV export (Settings > Export > Export as CSV). No export handy? Use `daylio_export_mock.csv` in the repo root, it's synthetic test data.

```bash
npm run build   # type-check and build
npm run lint
```

To test on your phone over Wi-Fi: `npm run dev -- --host`

## Tech stack

React 19, TypeScript, Vite, Recharts, Tailwind CSS v4, PapaParse for CSV parsing.

## Project structure

```text
src/
  types/       shared data shapes
  parser/      CSV -> Entry[]
  analytics/   pure functions, one file per stat
  data/        React state (DataContext)
  components/  presentational UI
  pages/       dashboard assembly
```

## License

MIT, see [LICENSE](LICENSE).
