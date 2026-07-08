# SoDEX Alpha Terminal

SoDEX Alpha Terminal is a builder-grade operating desk for the SoSoValue x SoDEX buildathon.

It is designed around one practical idea:

> research only matters if it can become an accountable execution plan.

This repo focuses on that loop with fewer, stronger product surfaces instead of many thin demo pages.

## What This Product Does

The app combines SoSoValue research context, SoDEX venue state, and AI-assisted planning into one execution workflow:

1. detect opportunity
2. validate it with live market structure
3. turn it into a staged SoDEX draft
4. route or review it
5. keep a decision trail

## Core Menus

These are the active primary menus in the current product.

| Route | Module | What it does |
| --- | --- | --- |
| `/launch` | Launch | Product overview with live market rail, candidate discovery, and fast paths into execution |
| `/execution` | Trade Copilot | Spread, depth, fees, risk gates, Groq draft generation, and live/local order flow |
| `/strategy-rack` | Strategy Rack | Repo-inspired strategies that all stage real SoDEX drafts |
| `/backtest-lab` | Backtest Lab | Replay-style staging surface inspired by prediction-market-backtesting and large-dataset workflows |
| `/smart-money` | Smart Money | Peer-wallet consensus, best timing/sizing/discipline rankings, and consensus draft staging |
| `/lp-monitor` | LP Monitor | Passive repricing and maker-discipline workflow inspired by limit-order management tools |
| `/operator-lab` | Operator Lab | Central queue for AI, strategy, rebalance, and smart-money drafts |
| `/rebalance` | Rebalance | Convert index/basket thinking into staged SoDEX execution plans |
| `/decision-log` | Decision Log | Audit trail with rationale, market context, and execution outcome |
| `/heatmap` | Heatmap | Large token map with click-through into execution |
| `/portfolio-live` | Portfolio Live | Wallet-linked SoDEX balances, orders, trades, and peer benchmarking context |
| `/diagnostics` | Diagnostics | Runtime, SoSoValue, SoDEX, and Groq health checks |

## Why The Menu Changed

Older menu surfaces that did not provide distinct utility were removed from the main navigation.

The new navigation is built around four stronger use cases inspired by public trading repos:

- strategy staging
- backtest / replay discipline
- smart-money intelligence
- LP / maker execution discipline

## Repo Inspirations Actually Used

These repos were reviewed as design references for functionality, not copied as-is:

- [`SII-WANGZJ/Polymarket_data`](https://github.com/SII-WANGZJ/Polymarket_data)
- [`evan-kolberg/prediction-market-backtesting`](https://github.com/evan-kolberg/prediction-market-backtesting)
- [`ent0n29/polybot`](https://github.com/ent0n29/polybot)
- [`lihanyu81/polymarket_lp_tool`](https://github.com/lihanyu81/polymarket_lp_tool)
- [`alsk1992/CloddsBot`](https://github.com/alsk1992/CloddsBot)
- [`pydantic/pydantic-ai`](https://github.com/pydantic/pydantic-ai)
- [`TauricResearch/TradingAgents`](https://github.com/TauricResearch/TradingAgents)
- [`pmxt-dev/pmxt`](https://github.com/pmxt-dev/pmxt)
- [`HarrierOnChain/Prediction-Markets-Trading-Bot-Toolkits`](https://github.com/HarrierOnChain/Prediction-Markets-Trading-Bot-Toolkits)
- [`aarora4/Awesome-Prediction-Market-Tools`](https://github.com/aarora4/Awesome-Prediction-Market-Tools)
- [`Hari-hara7/Crypto`](https://github.com/Hari-hara7/Crypto)

What they contributed to this build:

- `Polymarket_data`: dataset-first thinking, replay mentality, historical discipline
- `prediction-market-backtesting`: runner-style validation and backtest promotion into live drafts
- `polybot`: peer-wallet behavior analysis and smart-money consensus
- `polymarket_lp_tool`: deterministic repricing / maker discipline
- `CloddsBot`: multi-strategy rack mentality
- `pydantic-ai`: typed, structured AI workflow mindset
- `TradingAgents`: research-to-action agent flow
- `pmxt`: unified market-data thinking across research and execution
- `Harrier toolkit`: execution-first bot structure
- `Awesome-Prediction-Market-Tools`: breadth of practical tool patterns
- `Hari-hara7/Crypto`: stronger trading-terminal presentation language

## Main Functional Surfaces

### Trade Copilot

Route: `/execution`

Trade Copilot is the most important page in the app.

It supports:

- symbol-focused SoDEX execution view
- risk gate before live submit
- API visibility tray for SoSoValue / SoDEX / Groq calls
- Groq-generated execution drafts
- staged slices
- live and local routing flows

### Strategy Rack

Route: `/strategy-rack`

Every strategy in this rack stages a real draft into Operator Lab.

Current strategies:

- `Momentum Sprint`
- `Consensus Follow`
- `News Shock Response`
- `LP Reprice`
- `Mean Reversion`
- `Vol Breakout`

### Backtest Lab

Route: `/backtest-lab`

This module translates replay and simulation ideas into actionable behavior:

- highlight strongest continuation candidate
- highlight strongest reversal candidate
- stage replay-driven drafts
- keep backtest thinking close to execution instead of isolated notebooks

### Smart Money

Route: `/smart-money`

This module uses `/api/smart-money` and real SoDEX wallet cohorts to provide:

- peer-wallet watchlists
- consensus symbol detection
- best timing ranking
- best sizing ranking
- best discipline ranking
- smart-money draft staging

### LP Monitor

Route: `/lp-monitor`

This module turns maker-style logic into a focused tool:

- top bid / top ask tracking
- spread view
- visible depth view
- depth imbalance signal
- suggested maker price
- maker draft staging into Operator Lab

### Operator Lab

Route: `/operator-lab`

This is the central execution queue for the whole app.

It aggregates drafts coming from:

- strategy rack
- trade copilot
- smart money
- backtest lab
- rebalance
- news bot

### Rebalance

Route: `/rebalance`

Rebalance converts SoSoValue index/basket thinking into:

- target weights
- drift checks
- staged execution plans
- queued SoDEX drafts

### Heatmap

Route: `/heatmap`

Heatmap is built as an execution map, not just a decorative board:

- hundreds of tokens
- grouped treemap layout
- click-to-execution behavior
- liquidity / market-size sizing
- momentum color encoding

### Portfolio Live

Route: `/portfolio-live`

This page proves wallet-linked venue integration:

- balances
- open orders
- order history
- trade history
- fee state
- account readiness
- smart-money benchmarking context

### Diagnostics

Route: `/diagnostics`

Diagnostics gives production-style visibility into:

- runtime state
- SoSoValue connectivity
- SoDEX connectivity
- Groq readiness
- latency per probe

## SoSoValue Integration

SoSoValue is used for:

- market context
- research presets
- hot news
- featured stories
- macro events
- index / basket framing

## SoDEX Integration

SoDEX is used for:

- market rows
- candles
- top-of-book detail
- orderbook depth
- trade tape
- wallet-linked account reads
- order preparation
- live execution routing

## Groq Integration

Groq is used server-side for:

- execution draft generation
- action briefs
- research condensation

The key stays off the client.

## Compatibility Routes

Some older routes are still supported as aliases or secondary entry points so shared links do not break:

| Older route | Current meaning |
| --- | --- |
| `/markets` | Strategy Rack |
| `/sosovalue-indexes` | Rebalance |
| `/judges` | Backtest Lab |
| `/diag` | Diagnostics |
| `/news-and-insights` | Secondary SoSoValue news surface |
| `/news-rail` | Secondary SoSoValue news surface |
| `/alerts` | Secondary news-to-execution bot surface |
| `/news-bot` | Secondary news-to-execution bot surface |

These routes are no longer primary navigation targets.

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/market` | Live market aggregation and symbol detail |
| `/api/news-live` | SoSoValue hot news, featured stories, macro events |
| `/api/portfolio-live` | Live SoDEX account state by wallet |
| `/api/smart-money` | Peer-wallet and consensus analytics |
| `/api/sodex/prepare` | Build typed order payload |
| `/api/sodex/submit` | Submit browser-signed order |
| `/api/sodex/order` | Server-side order route |
| `/api/diag` | Runtime and integration diagnostics |
| `/api/sosovalue` | SoSoValue research probing |
| `/api/ai-brief` | Groq-powered execution and research brief |

## Environment Variables

Copy `.env.example` to `.env.local` and fill your real values:

```bash
cp .env.example .env.local
```

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

Run locally:

```bash
npm run dev
```

Build production:

```bash
npm run build
npm run start
```

## Current Repo Structure

```text
app/
  api/
  backtest-lab/
  decision-log/
  diagnostics/
  execution/
  heatmap/
  judges/
  launch/
  lp-monitor/
  markets/
  news-and-insights/
  news-bot/
  news-rail/
  operator-lab/
  portfolio-live/
  rebalance/
  smart-money/
  sosovalue-indexes/
  strategy-rack/
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

## Notes On Data Honesty

The app separates:

- live external data
- local operator state
- derived analytics

That distinction matters for judging. If something is derived, the UI should treat it as derived logic, not pretend it came directly from the exchange.

## Current Status

Current repo state now emphasizes:

- cleaner main navigation
- fewer decorative pages
- stronger utility around SoDEX execution
- more direct inspiration from serious trading repos
- hackathon-friendly story with clearer product focus
