# Grand Hotel

A mobile-first (portrait) browser version of **Grand Austria Hotel** for one player against 1–3 bots.
No build step and no dependencies: open `index.html` in a browser, or serve the folder with any static host
(e.g. GitHub Pages).

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page shell and styling (light and dark mode) |
| `js/data.js` | Guests, staff, politics cards, emperor tiles, hotel board layout |
| `js/engine.js` | Rules engine (rounds, dice, passing/re-rolls, rooms, guests, staff, scoring) |
| `js/bot.js` | Heuristic bot player |
| `js/ui.js` | Rendering and touch input |
| `test/sim.js` | Headless bot-vs-bot simulation: `node test/sim.js [games] [players]` |

## Rules implemented

Follows the official rules: 7 rounds, snake turn order (1…N…1), 10/12/14 dice, guest display with costs,
the six actions (incl. the +1 boost and the 6 = any action), passing and re-rolling, check-ins and room
rewards, occupancy bonuses, all 48 staff cards, all 12 politics cards and 12 emperor tiles,
emperor scoring after rounds 3/5/7 and final scoring.

Simplifications / assumptions for this first version:

- Food and drink you receive is placed on guest orders automatically (fullest guest first); extras go to the kitchen.
- Guest orders and VP values are approximations (the reference material listed rewards but not the exact orders).
- Group-occupancy bonuses, emperor-track VP, politics VP values and guest-slot costs are best readings of the board.
- Only the front (identical) hotel board is used, and staff are dealt 6 at random (standard setup).
