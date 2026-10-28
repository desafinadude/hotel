# Grand Hotel

A mobile-first (portrait) browser version, with a side-by-side tablet/desktop layout up to 1200px, of **Grand Austria Hotel** for one player against 1–3 bots.
No build step and no dependencies: open `index.html` in a browser, or serve the folder with any static host
(e.g. GitHub Pages).

It is deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`
(after a quick bot-vs-bot simulation passes). It can also be run by hand from the Actions tab.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css` | Page shell and styling: ivory and navy, Cormorant Garamond over Inter, light and dark mode |
| `js/data.js` | Guests, staff, politics cards, emperor tiles, hotel board layout |
| `js/engine.js` | Rules engine (rounds, dice, passing/re-rolls, rooms, guests, staff, scoring) |
| `js/bot.js` | Heuristic bot player |
| `js/ui.js` | Rendering and touch input: Table, Hotel, Staff and Log tabs, bottom sheets for choices |
| `docs/art-prompt.md` | Prompt and asset list for generating the artwork with an image AI |
| `test/sim.js` | Headless bot-vs-bot simulation: `node test/sim.js [games] [players]` |

## Screens

- **Table** — players, the six dice spaces, guests arriving (tap for details / to invite), your café and kitchen.
- **Hotel** — points, krone and Emperor position, your 4×5 hotel (room choices are made here), the Emperor track.
- **Staff** — hired staff (use once-per-round staff here) and the cards in your hand.
- **Log** — everything that has happened this game.

From 760px wide (tablets, desktops) the four screens are shown side by side instead of as tabs
(Table and Hotel in two columns; from 1100px Staff and Log get a third column), the page is capped at
1200px, and choices open as centred dialogs instead of bottom sheets.

Pictures are emoji and inline SVG for now (one emoji per guest and staff card, in `js/data.js`).

## Rules implemented

Follows the official rules: 7 rounds, snake turn order (1…N…1), 10/12/14 dice, guest display with costs,
the six actions (incl. the +1 boost and the 6 = any action), passing and re-rolling, check-ins and room
rewards, occupancy bonuses, all 48 staff cards, all 12 politics cards and 12 emperor tiles,
emperor scoring after rounds 3/5/7 and final scoring.

Simplifications / assumptions for this first version:

- Food and drink you receive is placed on guest orders automatically (fullest guest first); extras go to the kitchen.
- Guest names, VP and rewards follow the "Staff & Guest Cards by number" reference (cards 49–104). Guest orders are approximations (the reference does not list them).
- Group-occupancy bonuses, emperor-track VP, politics VP values and guest-slot costs are best readings of the board.
- Only the front (identical) hotel board is used, and staff are dealt 6 at random (standard setup).
