# SoDEX Alpha Launch

A hackathon-ready launch terminal for SoDEX built around live SoSoValue research, live SoDEX market data, and real order-routing flows.

## Features
- Product-launch route with basket builder, backtest, and launch CTA rail
- Judges board route for hackathon presentation
- Execution desk route for pre-trade sizing, spread, order flow, and live SoDEX routing
- Trading bot inside `/execution` that scans SoDEX depth and routes paper trades automatically
- Diagnostics route for live SoDEX endpoint checks
- SoSoValue API explorer with docs-aligned presets and raw JSON preview
- `News & Insights` now reads SoSoValue hot news, featured stories, and macro events
- `/portfolio-live` reads SoDEX balances, orders, trades, fee-rate, and API-key readiness by wallet
- `/api/sodex/prepare`, `/api/sodex/submit`, and `/api/sodex/order` support EIP-712 prepare / browser-wallet / server-signed order flows
- Interactive left sidebar routes: Launch, Markets, Watchlist, Signals, Portfolio, Research, Settings and more
- Real browser wallet connect/disconnect through `window.ethereum`
- Server-side `/api/market` route for live market data and safe private API handling
- Server-side `/api/diag` route for endpoint health and account readiness
- Server-side `/api/sosovalue` route for safe SoSoValue probing
- Server-side `/api/news-live` route for SoSoValue newsroom aggregation
- Server-side `/api/portfolio-live` route for live SoDEX account state
- Private key stays in Vercel env only: `SODEX_API_PRIVATE_KEY`
- SoSoValue API base URL stays in Vercel env only: `SOSOVALUE_API_BASE_URL`
- Trading terminal UI inspired by SoDEX / SoSoValue Wave 2

## Why This Fits The Hackathon

- Shows a real research-to-execution loop instead of a static dashboard.
- Uses SoSoValue deeply for research exploration and SoDEX deeply for market + execution workflows.
- Gives judges a dedicated `/judges` route and a `/diag` route that proves the stack is live.
- Uses `/execution` to explain trade sizing, spread, slippage, and risk before live submission.
- Adds a wallet-based `/portfolio-live` route so builders can prove they are reading live SoDEX account state instead of mock balances.

## Demo Flow

- Open `/` or `/launch` for the product launch page.
- Open `/judges` to present the submission scorecard and demo flow.
- Open `/execution` to size a trade, inspect the live book, and route a real SoDEX order with server-side or browser-wallet signing.
- Keep `/execution` open to enable the trading bot, auto-scan candidates, and inspect the planner beside the live order route.
- Open `/portfolio-live` with a connected wallet to show SoDEX balances, orders, trades, and readiness.
- Open `/diag` to verify live endpoint health and wallet readiness.
- Open `News & Insights` to show SoSoValue hot news, featured stories, and macro events.
- Open `AI Research` to probe SoSoValue presets and raw payloads.
- Use `Alpha Signals` and `Paper Trading` to show research-to-execution flow.
