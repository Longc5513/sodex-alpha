# SoDEX Alpha Launch

A hackathon-ready launch terminal for SoDEX built around SoSoValue research, market execution, and demo-safe paper trading.

## Features
- Product-launch route with basket builder, backtest, and launch CTA rail
- Judges board route for hackathon presentation
- Execution desk route for pre-trade sizing, spread, order flow, and SoDEX routing
- Diagnostics route for live SoDEX endpoint checks
- SoSoValue API explorer with docs-aligned presets and raw JSON preview
- Interactive left sidebar routes: Launch, Markets, Watchlist, Signals, Portfolio, Research, Settings and more
- Real browser wallet connect/disconnect through `window.ethereum`
- Server-side `/api/market` route for live market data and safe private API handling
- Server-side `/api/diag` route for endpoint health and account readiness
- Server-side `/api/sosovalue` route for safe SoSoValue probing
- Private key stays in Vercel env only: `SODEX_API_PRIVATE_KEY`
- SoSoValue API base URL stays in Vercel env only: `SOSOVALUE_API_BASE_URL`
- Music player controls
- Trading terminal UI inspired by SoDEX / SoSoValue Wave 2

## Why This Fits The Hackathon

- Shows a real research-to-execution loop instead of a static dashboard.
- Uses SoSoValue deeply for research exploration and SoDEX deeply for market + execution workflows.
- Gives judges a dedicated `/judges` route and a `/diag` route that proves the stack is live.
- Uses `/execution` to explain trade sizing, spread, slippage, and risk before route-to-paper.

## Demo Flow

- Open `/` or `/launch` for the product launch page.
- Open `/judges` to present the submission scorecard and demo flow.
- Open `/execution` to size a trade, estimate fee/slippage, and route to paper trading.
- Open `/diag` to verify live endpoint health and wallet readiness.
- Open `AI Research` or `News & Insights` to probe SoSoValue presets and raw payloads.
- Use `Alpha Signals` and `Paper Trading` to show research-to-execution flow.
