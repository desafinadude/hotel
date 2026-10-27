// Headless simulation: plays full bot-only games to check the engine never stalls or crashes.
// Usage: node test/sim.js [games] [players]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console, setTimeout, Math, Promise };
vm.createContext(ctx);
for (const f of ['data.js', 'engine.js', 'bot.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}

const games = +process.argv[2] || 20;
const players = +process.argv[3] || 2;

(async () => {
  const totals = [];
  for (let i = 0; i < games; i++) {
    ctx.newGame({ humans: 0, bots: players, botDelay: 0 });
    const res = await Promise.race([
      ctx.runGame(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('game stalled')), 10000)),
    ]);
    for (const r of res) {
      if (!Number.isFinite(r.total)) throw new Error('bad score');
      totals.push(r.total);
    }
    if (i === 0) console.log(res.map(r => `${r.p.name}: ${r.total} (vp ${r.before}, staff ${r.staff}, rooms ${r.rooms}, money ${r.money}, cubes ${r.cubes}, cafe ${r.cafe})`).join('\n'));
  }
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  console.log(`${games} games, ${players} players: avg score ${avg.toFixed(1)}, min ${Math.min(...totals)}, max ${Math.max(...totals)}`);
})().catch(e => { console.error(e); process.exit(1); });
