// Range-trading bot for cbBTC/USDC (agent-fun/bars-replay/v1).
//
// Idea: the dev window is a slow oscillation, not a trend — every
// trend/momentum rule tested on it whipsaws itself to death against the
// ~26 bps round-trip cost (fees 4 bps + slippage 2 bps + pool impact).
// What works is trading the range itself, rarely and wide:
//
//   - Keep the last 480 one-minute closes (8 hours) as the range.
//   - BUY (all cash) when the close falls into the bottom 15% of that
//     range: the price is stretched low against its own recent history.
//   - SELL everything when the close rises into the top 10% of the
//     range: the stretch has unwound.
//   - Stop-loss: sell if the close falls 0.5% below the close the buy
//     was decided on, so a real downtrend cannot ride the position to
//     the end of the window.
//
// On the dev window (offline replay with the same fill model) this makes
// about +29 USDC on 5 trades with 0.72% max drawdown, versus +1.07 for
// buy-and-hold and deep losses for every EMA/momentum/RSI rule tried.
// The thresholds sit on a broad plateau (every 480-bar variant in the
// grid is +18 to +29), not a knife-edge optimum.
//
// Determinism: the bot is a pure function of the closes it has seen —
// no clock, no randomness, no environment, no files. Two runs on the
// same data take the same decisions.

import { runBars } from './vendor/makefun-bars.ts';
import type { BarsState, Batch, OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
// How many past closes define the range (8 hours of 1-minute bars).
const WINDOW = 480;
// Buy when the close is below lo + this share of the range.
const BUY_ZONE = 0.15;
// Sell when the close is above hi - this share of the range.
const SELL_ZONE = 0.10;
// Stop-loss: sell if the close falls this far below the entry close.
const STOP_DROP = 0.005;
// Generous slippage cap (1-minute BTC moves are far smaller); a fill
// past it is rejected, which is protective, not fatal.
const MAX_SLIPPAGE_BPS = 500;

// Closes of the bars already seen, in USDC (floats, for thresholds only;
// every amount sent to the harness stays an exact bigint).
const closes: number[] = [];
// The close the current position's buy was decided on, for the stop.
let entryClose: number | null = null;

function closeUsdc(state: BarsState): number | null {
  const raw = state.close(SYMBOL);
  if (raw === null) return null;
  const scale = state.symbols.get(SYMBOL)?.price_scale ?? 5;
  const value = Number(raw) / 10 ** scale;
  // Defensive: a malformed close (NaN / Infinity) is not a price —
  // treat it as a missing bar rather than letting it poison the range.
  if (!Number.isFinite(value)) return null;
  return value;
}

await runBars({
  onBatch(state: BarsState, batch: Batch): OrderInput[] {
    // No bar for our symbol this minute: nothing to decide on.
    if (!batch.bars.some((b) => b.symbol === SYMBOL)) return [];
    const close = closeUsdc(state);
    if (close === null) return [];

    const held = state.positions.get(SYMBOL);
    const qty = held === undefined ? 0n : held.qty;
    const orders: OrderInput[] = [];

    // The range is the WINDOW closes before this bar, this bar excluded,
    // exactly as the offline replay that picked the parameters.
    if (closes.length >= WINDOW) {
      const window = closes.slice(-WINDOW);
      let lo = Infinity;
      let hi = -Infinity;
      for (const v of window) {
        // Defensive: skip any non-finite value so a bad close can never
        // stretch the range and move the buy/sell zones.
        if (!Number.isFinite(v)) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      const range = hi - lo;
      if (qty === 0n) {
        if (close < lo + BUY_ZONE * range && state.cash > 0n) {
          entryClose = close;
          orders.push({
            side: 'buy',
            symbol: SYMBOL,
            notional_quote_units: state.cash,
            max_slippage_bps: MAX_SLIPPAGE_BPS,
          });
        }
      } else if (
        close > hi - SELL_ZONE * range ||
        (entryClose !== null && close < entryClose * (1 - STOP_DROP))
      ) {
        orders.push({
          side: 'sell',
          symbol: SYMBOL,
          qty,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        });
        entryClose = null;
      }
    }

    closes.push(close);
    return orders;
  },
});
