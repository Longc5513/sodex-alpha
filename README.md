# SoDEX Alpha Terminal

SoDEX Alpha Terminal is a builder-grade research-to-execution workstation for the SoSoValue x SoDEX buildathon.

The product thesis is simple:

> if research cannot become an accountable execution plan, it is still just content.

This repo turns SoSoValue research context and SoDEX venue data into a working operator loop:

- discover market rotation
- inspect macro and news catalysts
- generate execution drafts
- apply risk gates
- route paper or live orders
- keep a decision audit trail

## Why This Project Exists

Most hackathon trading demos stop at one of two extremes:

- a pretty dashboard with little execution logic
- an execution form with weak research context

This project is intentionally built between those two.

It is designed to help a solo operator:

- decide what matters now
- understand why it matters
- translate that into a staged SoDEX plan
- prove the decision path honestly to judges and users

## Core Product Surfaces

### 1. Launch Rail

Route: `/launch`

The launch page is not a marketing shell. It is the product story in working form.

It combines:

- live market overview
- SoSoValue-aware launch narrative
- quant-style decision surface
- basket backtest
- direct paths into execution and audit

### 2. Trade Copilot

Route: `/execution`

This is the main decision-to-order screen.

It uses live or venue-derived SoDEX context to show:

- spread
- visible depth
- estimated fills
- fee-aware cost
- market impact
- risk gate status
- live order route readiness

It supports:

- paper routing
- server-signed live route
- browser-wallet EIP-712 flow
- staged draft loading from other modules
- Groq-generated execution drafts
- TWAP / VWAP / POV / Iceberg style slice planning

### 3. Index Rebalance Executor

Route: `/sosovalue-indexes`

This module converts SoSoValue basket or index thinking into actionable venue plans.

It produces:

- target weights
- exposure drift
- staged slice plans
- execution drafts that can be loaded into the shared operator queue

### 4. News-to-Execution Bot

Route: `/alerts`

This module reads live SoSoValue news and macro context, then turns that flow into execution drafts.

It classifies regime, proposes side bias, and creates rationale-rich drafts rather than static alerts.

### 5. Operator Lab

Route: `/operator-lab`

Operator Lab is the orchestration layer of the product.

It acts as a shared inbox for:

- rebalance drafts
- news-driven drafts
- execution planning context
- staged slice review before route

### 6. Portfolio Live

Route: `/portfolio-live`

This page reads live SoDEX account state by wallet and keeps the demo honest.

It includes:

- balances
- open orders
- trade history
- fee tier
- account readiness
- API key readiness
- live PnL attribution
- smart money watch
- peer scorecard
- counterfactual replay overlay

### 7. Decision Log

Route: `/decision-log`

This is the accountability layer.

Every meaningful action can record:

- signal reason
- SoSoValue news reference
- macro context
- spread and depth
- risk gate result
- route outcome
- counterfactual "if skipped" overlay

### 8. Heatmap

Route: `/heatmap`

The heatmap is a sector-style treemap over the SoDEX venue universe.

It is built to be useful, not decorative:

- tile size reflects liquidity or market size
- tile color reflects momentum
- hover reveals execution context
- click jumps directly into `/execution`

## Live Integrations

### SoSoValue

Used for:

- currency directory and research metadata
- market snapshots
- hot news
- featured research
- macro event context
- index and SSI rails

### SoDEX

Used for:

- market tickers
- klines
- book tickers
- orderbook depth
- recent trades
- live account reads
- fee information
- live order preparation
- live order submission

### Groq

Optional server-side copilot support is now wired for:

- execution thesis generation
- AI research condensation
- fast action briefs built from SoSoValue news and SoDEX venue context

Groq is only called from the server route. The key is not exposed to the browser.

## Technical Inspiration

One execution workflow reference used while improving this product was:

- [`mansoor-mamnoon/limit-order-book`](https://github.com/mansoor-mamnoon/limit-order-book)

That repo focuses on market microstructure, spread / impact analytics, and execution styles such as VWAP, TWAP, and POV. This app adapts that idea into a builder-friendly SoDEX workflow by turning live venue state into staged order drafts instead of only showing raw orderbook data.

## What Makes This Submission Strong

From a judge perspective, this project is strongest where many hackathon submissions are weakest:

- it does not fake venue state when live state is unavailable
- it distinguishes live external data from local operator state
- it provides an audit trail, not only an execution button
- it shows how research translates into execution drafts
- it proves risk gating before submit
- it gives a builder-friendly demo flow instead of isolated screens

## Data Honesty

This product intentionally separates three classes of data.

### 1. Live external data

Fetched from SoSoValue or SoDEX:

- market rows
- candles
- orderbook depth
- trades
- hot news
- featured stories
- macro events
- account state
- fee rates

### 2. Local operator state

Persisted in browser storage for demo continuity:

- watchlist
- paper trades
- decision log
- drafts
- bot history

### 3. Derived analytics

Strategy outputs and planner logic:

- staged order slices
- rebalance deltas
- execution route suggestions
- skip-trade overlays
- scenario PnL previews

Where a value is derived, the UI should treat it as derived logic, not claim it as a venue-native field.

## Architecture

### Frontend

- Next.js 16
- React 19
- App Router
- terminal-style client experience centered in [`app/terminal.tsx`](./app/terminal.tsx)

### Backend / library modules

- [`lib/market.ts`](./lib/market.ts)
  - SoDEX market aggregation
  - SoSoValue snapshot merging
  - live asset normalization
- [`lib/sodex.ts`](./lib/sodex.ts)
  - account reads
  - order preparation
  - EIP-712 and live route helpers
- [`lib/sosovalue.ts`](./lib/sosovalue.ts)
  - SoSoValue API wrapper
- [`lib/sosovalue-meta.ts`](./lib/sosovalue-meta.ts)
  - docs links
  - console links
  - preset metadata

### Assets

- [`public/tokens`](./public/tokens) for local token icons
- [`public/sodex-logo.jpg`](./public/sodex-logo.jpg) for product branding

## Routes

| Route | Purpose |
| --- | --- |
| `/launch` | Product-story launch rail |
| `/judges` | Submission framing for evaluation |
| `/execution` | Trade Copilot and live route desk |
| `/operator-lab` | Shared execution inbox |
| `/decision-log` | Audit trail and counterfactual review |
| `/markets` | Market table surface |
| `/watchlist` | Builder watchlist |
| `/alpha-signals` | Signal rail |
| `/screener` | Live market screen |
| `/heatmap` | Full-screen treemap |
| `/portfolio` | Local portfolio panel |
| `/portfolio-live` | Live SoDEX account state |
| `/paper-trading` | Local paper order flow |
| `/news-and-insights` | SoSoValue news + macro rail |
| `/sosovalue-indexes` | Index rebalance executor |
| `/ai-research` | SoSoValue research probe surface |
| `/alerts` | News-to-execution bot |
| `/diag` | Integration diagnostics |

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/market` | Live market aggregation for launch, heatmap, screener, execution |
| `/api/news-live` | SoSoValue hot news, featured stories, macro events |
| `/api/portfolio-live` | SoDEX wallet-linked account state |
| `/api/sodex/prepare` | Build typed-data order payload |
| `/api/sodex/submit` | Submit browser-signed order |
| `/api/sodex/order` | Server-signed live route |
| `/api/smart-money` | Peer wallet watch and scorecard |
| `/api/diag` | Runtime and integration diagnostics |
| `/api/sosovalue` | Safe SoSoValue research probing |

## Environment Variables

Copy `.env.example` into `.env.local` and fill the values you control.

```bash
cp .env.example .env.local
```

Expected variables:

```env
SODEX_API_PRIVATE_KEY=private_key_here
SODEX_API_KEY_NAME=api-key-name
SODEX_API_PUBLIC_KEY=0x_public_api_key
SODEX_PUBLIC_KEY=0x_optional_alias
SODEX_CHAIN_ID=286623
SOSOVALUE_API_KEY=your_sosovalue_api_key
SOSOVALUE_API_BASE_URL=https://openapi.sosovalue.com/openapi/v1
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
SODEX_SPOT_ENDPOINT=https://mainnet-gw.sodex.dev/api/v1/spot
SODEX_PERPS_ENDPOINT=https://mainnet-gw.sodex.dev/api/v1/perps
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Build production:

```bash
npm run build
npm run start
```

## Suggested Demo Flow

For a clean judge-facing demo:

1. Open `/launch`
2. Show the thesis and live market surface
3. Open `/news-and-insights`
4. Show live SoSoValue hot news and macro context
5. Open `/alerts`
6. Generate a news-driven execution draft
7. Open `/sosovalue-indexes`
8. Generate an index rebalance draft
9. Open `/operator-lab`
10. Show the shared execution inbox
11. Open `/execution`
12. Load a draft and show spread, depth, fee-aware cost, and route readiness
13. Open `/portfolio-live`
14. Prove live SoDEX account reads
15. Open `/decision-log`
16. Prove explainability and counterfactual review
17. Open `/diag`
18. End by proving the stack is alive

## Security Notes

- keep `SODEX_API_PRIVATE_KEY` server-side only
- do not expose private signing material to the browser
- use browser-wallet typed-data signing when you want explicit user approval
- use server-side routes to keep credentials out of the client bundle

## Current Limitations

- operator state is browser-local, not database-backed
- some strategy analytics are derived rather than official venue post-trade metrics
- live attribution depends on the queried wallet actually having SoDEX order or trade history
- not every module auto-submits; some intentionally stop at staged execution plans

## Repo Structure

```text
app/
  api/
  alerts/
  ai-research/
  decision-log/
  diag/
  execution/
  heatmap/
  judges/
  launch/
  markets/
  news-and-insights/
  operator-lab/
  portfolio-live/
  sosovalue-indexes/
  terminal.tsx
lib/
  market.ts
  sodex.ts
  sosovalue.ts
  sosovalue-meta.ts
public/
  sodex-logo.jpg
  tokens/
```

## Status

Current state of the project:

- live SoSoValue integration
- live SoDEX market integration
- live SoDEX account integration
- staged and live execution flows
- builder-ready demo surface for the hackathon

## License

No license file is included yet.

Add an explicit license before broader open-source distribution beyond the buildathon.
