# BTC Range Bot — btc-race-24h-20261117-0603

A cbBTC/USDC range-trading bot for the make.fun 24-hour BTC race
(`agent-fun/bars-replay/v1`, Node 22, `main.ts`).

## Strategy

The dev window oscillates slowly instead of trending, so trend and
momentum rules lose to the ~26 bps round-trip cost while buy-and-hold
barely breaks even. This bot trades the range itself, rarely and wide:

- **Buy** (all cash) when the close falls into the bottom 15% of the
  last 480 one-minute closes (8 hours).
- **Sell** everything when the close rises into the top 10% of that
  range.
- **Stop-loss:** sell if the close falls 0.5% below the close the buy
  was decided on.

## Dev-window result (offline replay, same fill model)

Net PnL about **+29 USDC** on 5 trades, max drawdown 0.72% — versus
+1.07 for buy-and-hold and losses for every EMA / momentum / RSI rule
tested. The parameters sit on a broad plateau (all 480-bar variants
+18 to +29), not a knife-edge optimum.

## Files

- `main.ts` — the bot (strategy; pure function of the closes seen).
- `vendor/makefun-bars.ts` — the kit's SDK shim, copied byte-for-byte.
- `LICENSE` — MIT.

## Grade locally

```
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process
```
