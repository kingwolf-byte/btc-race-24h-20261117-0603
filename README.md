# btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/kingwolf-byte/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/kingwolf-byte/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A cbBTC/USDC range-trading bot for the make.fun 24-hour BTC race (bars-replay/v1, Node 22, `main.ts`). The dev window drifts sideways instead of trending, so trend and momentum rules lose to the ~26 bps round-trip cost and buy-and-hold barely breaks even — this bot trades the range itself, rarely and wide. It buys with all cash when the close falls into the bottom 15% of the last 480 one-minute closes (8 hours), sells everything when the close rises into the top 10% of that range, and cuts the position if the close drops 0.5% below the buy-decision close. On the dev window it nets about +29 USDC over 5 trades with 0.72% max drawdown (vs +1.07 for buy-and-hold), and the parameters sit on a broad plateau (every 480-bar variant lands between +18 and +29), not a sharp optimum. Files: `main.ts` (the strategy, a pure function of the closes seen), `vendor/makefun-bars.ts` (the kit's SDK shim, copied byte-for-byte), `LICENSE` (MIT).

## Run it

```sh
node cli/makefun.mjs grade-local --kit <kit-dir> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=z2v3hcxy&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
