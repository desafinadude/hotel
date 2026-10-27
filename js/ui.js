// Mobile UI: renders the whole screen from state on every change and turns taps
// into engine commands or prompt answers.

const UI = {
  bots: 1,
  info: null, // non-blocking info sheet: { type, ... }
  started: false,
};

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const me = () => S && S.players.find(p => !p.isBot);
const myTurn = () => S && S.turn && !S.players[S.turn.pi].isBot && S.awaitCmd;

function cubeHTML(c, hollow) {
  return `<i class="cube ${c}${hollow ? ' hollow' : ''}" title="${CUBE_INFO[c].name}"></i>`;
}

function rewardShort(r) {
  switch (r.t) {
    case 'k': return `+${r.n}💰`;
    case 'e': return `+${r.n}👑`;
    case 'v': return `+${r.n}⭐`;
    case 'c': return r.c === 'any' ? '+1 🍽' : `+${cubeHTML(r.c)}`;
    case 'g': return '+👤';
    case 'r': return { pay: '🛏', m1: '🛏-1', free: '🛏0', free12: '🛏0↓' }[r.mode];
    case 't': return r.c === 'any' ? '🔑' : `🔑<span style="color:var(--${r.c})">■</span>`;
    case 's': return r.n >= 99 ? '🃏0' : `🃏-${r.n}`;
    case 'd': return `+${r.n}🃏`;
    case 'x': return r.n >= 99 ? '3🃏→0' : '3🃏→-3';
    case 'a': return '⟳turn';
  }
  return '';
}

function rewardLong(r) {
  switch (r.t) {
    case 'k': return `Receive ${r.n} krone`;
    case 'e': return `Advance ${r.n} on the Emperor track`;
    case 'v': return `Receive ${r.n} VP`;
    case 'c': return r.c === 'any' ? 'Take a dish or drink of your choice' : `Take 1 ${CUBE_INFO[r.c].plural}`;
    case 'g': return 'Take a guest from the board for free';
    case 'r': return {
      pay: 'Prepare a room (pay cost)', m1: 'Prepare a room (cost -1)',
      free: 'Prepare a room for free', free12: 'Prepare a room on floor 1-2 for free',
    }[r.mode];
    case 't': return `Turn a ${r.c === 'any' ? '' : COLORS[r.c].name.toLowerCase() + ' '}prepared room to occupied`;
    case 's': return r.n >= 99 ? 'Hire a staff card for free' : `Hire a staff card for ${r.n} less`;
    case 'd': return `Draw ${r.n} staff card${r.n > 1 ? 's' : ''}`;
    case 'x': return r.n >= 99 ? 'Draw 3 staff, hire one for free' : 'Draw 3 staff, hire one for 3 less';
    case 'a': return 'Take another turn (without using up a die)';
  }
  return '';
}

function guestHTML(g, opt = {}) {
  if (!g) return `<div class="gcard empty">${opt.emptyLabel || 'empty'}</div>`;
  const order = g.order.map((c, i) => cubeHTML(c, opt.showFill ? !g.filled[i] : false)).join('');
  const rw = g.rewards.length ? g.rewards.map(rewardShort).join(' ') : '—';
  const done = opt.showFill && isComplete(g);
  const tag = opt.act ? 'button' : 'div';
  return `<${tag} class="gcard ${g.color}${done ? ' done' : ''}${opt.big ? ' big' : ''}" ${opt.act || ''}>
    <div class="gh"><span>${opt.big ? COLORS[g.color].guest : ''}</span><span>${g.vp}⭐</span></div>
    <div class="gn">${esc(g.name)}</div>
    <div class="go">${order}</div>
    <div class="gr">${opt.big ? (g.rewards.map(rewardLong).join('<br>') || 'No reward') : rw}</div>
  </${tag}>`;
}

function staffHTML(card, extra = '') {
  return `<div class="scard"><div class="sh"><span>${esc(card.name)}</span><span>${card.cost}💰</span></div>
    <div class="tp">${STAFF_TYPE_LABEL[card.type]}</div><p>${esc(card.text)}</p>${extra}</div>`;
}

function hotelHTML(p, pick) {
  const pickMap = {};
  if (pick) for (const c of pick) pickMap[key(c.r, c.c)] = c;
  let h = '<div class="hotel">';
  for (let r = ROWS - 1; r >= 0; r--) {
    h += `<div class="rowlab"><span>F${r + 1}</span><span>${ROW_COST[r]}💰</span></div>`;
    for (let c = 0; c < COLS; c++) {
      const color = LAYOUT[r][c];
      const st = p.rooms[r][c];
      const g = GROUP_OF[key(r, c)];
      const edge = (dr, dc) => {
        const nr = r + dr, nc = c + dc;
        return nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || GROUP_OF[key(nr, nc)] !== g;
      };
      const cls = ['room', color, st || '', edge(1, 0) ? 'gt' : '', edge(-1, 0) ? 'gb' : '', edge(0, -1) ? 'gl' : '', edge(0, 1) ? 'gr2' : ''];
      const pk = pickMap[key(r, c)];
      if (pk) cls.push('pick');
      const door = DOOR_VP[key(r, c)];
      const inner = st === 'occ' ? '👤' : st === 'free' ? 'free' : '';
      const doorH = door && !st ? `<span class="door">+${door}⭐</span>` : '';
      const costH = pk && pk.cost !== undefined && !st ? `<span class="pc">${pk.cost}💰</span>` : '';
      const tag = pk ? 'button' : 'div';
      h += `<${tag} class="${cls.join(' ')}" ${pk ? `data-act="cell" data-r="${r}" data-c="${c}"` : ''} aria-label="${COLORS[color].name} room floor ${r + 1}">${inner}${doorH}${costH}</${tag}>`;
    }
  }
  return h + '</div>';
}

function trackHTML() {
  let h = '<div class="track">';
  for (let i = 0; i <= EMP_MAX; i++) {
    const cls = i === 0 ? 'pen' : i >= 3 ? 'bonus' : '';
    const dots = S.players.filter(p => p.emp === i).map(p => `<span class="pdot" style="background:${p.color}"></span>`).join('');
    h += `<div class="tcell ${cls}">${i}<div class="dots">${dots}</div><span class="v">${EMP_VP[i]}⭐</span></div>`;
  }
  return h + '</div>';
}

function dieFace(n, big) {
  return `<span class="die${big ? ' big' : ''}">${n}</span>`;
}

function statusText() {
  if (S.phase === 'over') return 'Game over';
  const p = S.current !== null ? S.players[S.current] : null;
  if (S.prompt) return 'Make a choice';
  if (!S.turn) return p ? `${p.name}…` : '';
  const tp = S.players[S.turn.pi];
  if (tp.isBot) return `${tp.name} is playing…`;
  const t = S.turn;
  if (t.extra) return 'Bonus turn: invite a guest and use an action (no die is used up)';
  if (!t.dieTaken) return t.guestTaken ? 'Now take a die from the action board' : 'Your turn: invite a guest (optional), then take a die';
  return 'Check in guests, serve, use staff — then End turn';
}

function render() {
  const app = document.getElementById('app');
  if (!UI.started || !S) { app.innerHTML = menuHTML() + sheetsHTML(); return; }
  const p = me();
  const t = S.turn;
  const mine = myTurn();
  const canGuest = mine && !t.guestTaken && !t.dieTaken && cafeFree(p) >= 0;
  const claimable = mine ? claimablePolitics(p).length : 0;
  const order = playerOrder();
  const slotNums = pi => S.slots.map((x, i) => (x === pi ? i : -1)).filter(i => i >= 0)
    .map(i => `<span style="${S.covered[i] ? 'text-decoration:line-through;opacity:.5' : ''}">${i + 1}</span>`).join(' ');

  let h = `<header class="top">
    <h1>Grand Hotel</h1>
    <span class="round">${S.phase === 'setup' ? 'Setup' : `Round ${S.round}/7`}</span>
    <button class="iconbtn" data-act="court" aria-label="Emperor and politics">⚜${claimable ? '<span class="dot"></span>' : ''}</button>
    <button class="iconbtn" data-act="log" aria-label="Game log">☰</button>
    <button class="iconbtn" data-act="help" aria-label="How to play">?</button>
  </header>`;

  h += `<section class="players">${order.map(pi => {
    const q = S.players[pi];
    return `<button class="chip${S.current === pi ? ' active' : ''}" data-act="player" data-idx="${pi}">
      <div class="nm"><span class="pdot" style="background:${q.color}"></span>${esc(q.name)}</div>
      <div class="st">⭐${q.vp} 💰${q.money} 👑${q.emp}</div>
      <div class="st">turns ${S.slots.length ? slotNums(pi) : '—'}</div>
    </button>`;
  }).join('')}</section>`;

  const nextScore = [3, 5, 7].find(r => r >= S.round);
  h += `<section><div class="label"><span>Emperor track</span><span>${nextScore ? `scoring after round ${nextScore} (back ${EMP_SCORING[nextScore]})` : ''}</span></div>${trackHTML()}</section>`;

  h += `<section><div class="label"><span>Guests to invite</span><span>${hasStaff(p, 25) ? 'free (Delivery Boy)' : ''}</span></div><div class="gdisplay">${S.display.map((g, i) => `
    <div class="gslot">${guestHTML(g, { act: `data-act="guest" data-slot="${i}"` })}<div class="cost">${guestCost(p, i)}💰</div></div>`).join('')}</div></section>`;

  h += `<section><div class="label"><span>Action board — tap to take a die</span><span>${S.diceCount ? `${totalDice()} dice left` : ''}</span></div><div class="actions">`;
  for (let s = 1; s <= 6; s++) {
    const n = S.dice[s - 1];
    const ok = mine && !t.dieTaken && canUseSpace(p, s);
    h += `<button class="aspace${ok ? ' ready' : ''}" data-act="space" data-space="${s}" ${ok ? '' : 'disabled'}>
      <div class="an">${dieFace(s, true)}<span>${ACTION_NAMES[s]}${s === 6 ? ' (1💰)' : ''}</span></div>
      <div class="cnt">${n ? `×${n}` : '—'}</div>
    </button>`;
  }
  h += '</div></section>';

  h += `<section><div class="label"><span>Your hotel</span><span class="stats">⭐${p.vp} 💰${p.money} 👑${p.emp}</span></div>${hotelHTML(p)}</section>`;

  h += `<section><div class="label"><span>Café — complete orders, then check guests in</span></div><div class="cafe">${p.cafe.map((g, i) =>
    guestHTML(g, { showFill: true, act: `data-act="cafe" data-idx="${i}"`, emptyLabel: 'free table' })).join('')}</div></section>`;

  const serveCost = hasStaff(p, 24) ? 'free' : '1💰';
  h += `<section><div class="kitchen"><span>Kitchen</span>${CUBES.map(c => `<span class="kc">${cubeHTML(c)}${p.kitchen[c]}</span>`).join('')}
    <span class="sp"></span><button class="btn sm" data-act="serve" ${mine && kitchenUseful(p) ? '' : 'disabled'}>Serve (${serveCost})</button></div></section>`;

  const opr = p.staff.filter(e => e.card.type === 'opr' && !e.tapped).length;
  h += `<footer class="bar"><div class="bar-in">
    <div class="status">${esc(statusText())}</div>
    <div class="ticker">${S.log.slice(-2).map(l => esc(l.msg)).join('<br>')}</div>
    <div class="btns">
      <button class="btn" data-act="staff">Staff ${p.hand.length}✋ ${p.staff.length}✓${mine && opr ? ' •' : ''}</button>
      <button class="btn" data-act="pass" ${mine && !t.dieTaken && !t.extra ? '' : 'disabled'}>Pass</button>
      <button class="btn primary" data-act="end" ${mine && (t.dieTaken || t.extra) ? '' : 'disabled'}>End turn</button>
    </div></div></footer>`;

  app.innerHTML = h + sheetsHTML();
  if (canGuest) app.querySelectorAll('.gdisplay .gcard').forEach(el => el.classList.add('ready'));
}

function menuHTML() {
  const facade = LAYOUT.slice().reverse().join('').split('').map(c => `<i style="background:var(--${c})"></i>`).join('');
  return `<div class="menu">
    <div class="facade">${facade}</div>
    <h1>Grand Hotel</h1>
    <p class="tag">Run a Viennese hotel: serve guests, fill rooms, impress the Emperor.</p>
    <div class="label" style="justify-content:center">Opponents (bots)</div>
    <div class="seg">${[1, 2, 3].map(n => `<button class="btn${UI.bots === n ? ' on' : ''}" data-act="bots" data-n="${n}">${n}</button>`).join('')}</div>
    <div class="stack">
      <button class="btn primary" data-act="start">Start game</button>
      <button class="btn" data-act="help">How to play</button>
    </div>
  </div>`;
}

function promptHTML() {
  const pr = S.prompt;
  const p = S.players[pr.pi];
  let body = '';
  if (pr.meta && pr.meta.guest) body += guestHTML(pr.meta.guest, { big: true, showFill: pr.tag === 'checkin' });
  if (pr.kind === 'cells') {
    body += hotelHTML(p, pr.cells);
  } else {
    body += '<div class="opts">' + pr.options.map((o, i) => {
      if (o.guest !== undefined && pr.tag === 'guest') {
        return o.guest ? `<button class="btn opt" data-act="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
          <span class="pdot" style="background:var(--${o.guest.color})"></span>
          <span>${esc(o.guest.name)} <small>${o.guest.order.map(c => cubeHTML(c)).join('')} · ${o.guest.vp}⭐ · ${o.guest.rewards.map(rewardShort).join(' ') || '—'}</small></span></button>` : '';
      }
      if (o.card) {
        return `<button class="btn opt" data-act="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
          <span>${esc(o.card.name)} <small>${STAFF_TYPE_LABEL[o.card.type]} — ${esc(o.card.text)}</small></span>
          ${o.cost !== undefined ? `<span class="oc">${o.cost}💰</span>` : ''}</button>`;
      }
      if (o.cube) return `<button class="btn opt" data-act="opt" data-i="${i}">${cubeHTML(o.cube)} ${esc(o.label)}</button>`;
      if (o.guest) return `<button class="btn opt" data-act="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${esc(o.label)}</button>`;
      let label = esc(o.label);
      if (pr.tag === 'strength' && o.value.boost) label += ' <small>pay 1💰 extra for +1</small>';
      return `<button class="btn opt${o.value && o.value.boost ? '' : ' primary'}" data-act="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}><span>${label}</span></button>`;
    }).join('') + '</div>';
  }
  const skip = pr.allowSkip ? `<div class="foot"><button class="btn" data-act="skip">${esc(pr.skipLabel || 'Skip')}</button></div>` : '';
  return `<div class="shade"><div class="sheet" role="dialog" aria-label="${esc(pr.title)}">
    <h2>${esc(pr.title)}</h2>${pr.text ? `<p class="sub">${esc(pr.text)}</p>` : ''}${body}${skip}</div></div>`;
}

function infoHTML() {
  const i = UI.info;
  let title = '', body = '';
  const p = S && me();
  const mine = myTurn();
  if (i.type === 'help') {
    title = 'How to play';
    body = helpHTML();
  } else if (i.type === 'log') {
    title = 'Game log';
    body = `<div class="logs">${S.log.slice().reverse().map(l => `<div>${l.pi !== undefined ? `<span class="pdot" style="background:${S.players[l.pi].color}"></span> ` : ''}${esc(l.msg)}</div>`).join('')}</div>`;
  } else if (i.type === 'guest') {
    title = i.g.name;
    body = guestHTML(i.g, { big: true, showFill: i.cafe });
    if (i.cafe && mine && isComplete(i.g)) {
      const n = freeRoomsFor(p, i.g.color).length;
      body += `<div class="foot"><button class="btn good" data-act="checkin" data-idx="${i.idx}" ${n ? '' : 'disabled'}>${n ? 'Check in to a room' : `No free ${i.g.color === 'G' ? '' : COLORS[i.g.color].name.toLowerCase() + ' '}room`}</button></div>`;
    } else if (i.cafe) {
      body += `<p class="sub">Still needs: ${missing(i.g).map(c => cubeHTML(c)).join(' ') || 'nothing'}. ${i.g.color === 'G' ? 'Tourists take any room.' : `Needs a ${COLORS[i.g.color].name.toLowerCase()} room.`}</p>`;
    }
  } else if (i.type === 'staff') {
    title = 'Staff';
    body = '<h3>Hired</h3>' + (p.staff.length ? p.staff.map((e, k) => {
      const use = e.card.type === 'opr' ? `<div style="margin-top:6px"><button class="btn sm" data-act="opr" data-idx="${k}" ${mine && !e.tapped ? '' : 'disabled'}>${e.tapped ? 'Used this round' : 'Use now'}</button></div>` : '';
      return staffHTML(e.card, use).replace('class="scard"', `class="scard${e.tapped ? ' tapped' : ''}"`);
    }).join('') : '<p class="sub">Nobody yet. Hire staff with action 5.</p>');
    body += '<h3>In your hand</h3>' + (p.hand.length ? p.hand.map(c => staffHTML(c)).join('') : '<p class="sub">No cards in hand.</p>');
  } else if (i.type === 'player') {
    const q = S.players[i.idx];
    title = q.name;
    body = `<p class="sub">⭐${q.vp} · 💰${q.money} · 👑${q.emp} · ${q.hand.length} staff in hand</p>${hotelHTML(q)}
      <h3>Café</h3><div class="cafe">${q.cafe.map(g => guestHTML(g, { showFill: true, emptyLabel: 'free table' })).join('')}</div>
      <h3>Kitchen</h3><div class="kitchen">${CUBES.map(c => `<span class="kc">${cubeHTML(c)}${q.kitchen[c]}</span>`).join('')}</div>
      <h3>Staff</h3>${q.staff.length ? q.staff.map(e => staffHTML(e.card)).join('') : '<p class="sub">None</p>'}`;
  } else if (i.type === 'court') {
    title = 'Emperor & Politics';
    body = '<h3>Emperor tiles</h3>' + S.emperor.map((e, k) => `<div class="scard"><div class="sh"><span>After round ${[3, 5, 7][k]}</span><span>back ${[3, 5, 7][k]}</span></div>
      <p>🟨 Space 3+: <b>${esc(e.bonus)}</b></p><p>⬛ Space 0: <b>${esc(e.penalty)}</b></p></div>`).join('');
    body += '<p class="sub">At each Emperor scoring you score the ⭐ under your space, then move back. Spaces 1–2: nothing.</p>';
    body += '<h3>Politics — first to fulfil scores most</h3>' + S.politics.map((pc, k) => {
      const can = p && mine && !pc.claims.includes(p.idx) && pc.def.check(p);
      const vps = pc.def.vps.map((v, n) => `<span style="${n < pc.claims.length ? 'text-decoration:line-through;opacity:.5' : ''}">${v}</span>`).join(' / ');
      const who = pc.claims.map(pi => `<span class="pdot" style="background:${S.players[pi].color}"></span>`).join(' ');
      return `<div class="scard"><div class="sh"><span>${esc(pc.def.text)}</span><span>${vps}⭐</span></div><p>${who || '<span class="sub">unclaimed</span>'}</p>
        ${can ? `<div style="margin-top:6px"><button class="btn sm good" data-act="politics" data-idx="${k}">Claim now</button></div>` : ''}</div>`;
    }).join('');
  } else if (i.type === 'results') {
    title = 'Final scores';
    const r = S.results;
    body = `<p class="sub">${r[0].p.isBot ? `${esc(r[0].p.name)} wins.` : 'You win! The Emperor is delighted.'}</p>
      <table class="res"><tr><th></th><th>Game</th><th>Staff</th><th>Rooms</th><th>💰</th><th>Cubes</th><th>Café</th><th>Total</th></tr>
      ${r.map((x, n) => `<tr class="${n === 0 ? 'win' : ''}"><td><span class="pdot" style="background:${x.p.color}"></span> ${esc(x.p.name)}</td>
        <td>${x.before}</td><td>${x.staff}</td><td>${x.rooms}</td><td>${x.money}</td><td>${x.cubes}</td><td>${x.cafe}</td><td>${x.total}</td></tr>`).join('')}</table>
      <div class="foot"><button class="btn primary" data-act="again">Play again</button></div>`;
  }
  const close = i.type === 'results' ? '' : '<div class="foot"><button class="btn" data-act="close">Close</button></div>';
  return `<div class="shade" data-act="shade"><div class="sheet" role="dialog" aria-label="${esc(title)}"><h2>${esc(title)}</h2>${body}${close}</div></div>`;
}

function sheetsHTML() {
  let h = '';
  if (UI.info) h += infoHTML();
  if (S && S.prompt && !S.players[S.prompt.pi].isBot) h += promptHTML();
  return h;
}

function helpHTML() {
  return `<div class="help">
  <p><b>Goal:</b> have the most ⭐ victory points after 7 rounds.</p>
  <h3>Each round</h3>
  <ul>
    <li>Dice are rolled onto the 6 action spaces. Everyone gets <b>2 turns</b> (order 1-2-…-2-1).</li>
    <li>On your turn you may <b>invite 1 guest</b> into your café (pay the 💰 under the card; leftmost is newest and dearest).</li>
    <li>Then you <b>must take 1 die</b>. The action's strength = the number of dice on that space (pay 1💰 once per turn for +1).</li>
  </ul>
  <h3>Actions</h3>
  <ul>
    <li><b>1</b> Strudel ${cubeHTML('s')} / Cake ${cubeHTML('c')} — never more cake than strudel.</li>
    <li><b>2</b> Wine ${cubeHTML('w')} / Coffee ${cubeHTML('k')} — never more coffee than wine.</li>
    <li><b>3</b> Prepare rooms. Pay the floor cost; rooms must touch existing rooms.</li>
    <li><b>4</b> Steps on the Emperor 👑 track and/or krone 💰.</li>
    <li><b>5</b> Hire a staff card, each die = 1💰 discount.</li>
    <li><b>6</b> Pay 1💰 and use any action 1–5 with the strength of the 6s.</li>
  </ul>
  <h3>Guests</h3>
  <ul>
    <li>Food and drink you get goes straight onto your guests' orders; extras go to your kitchen. <b>Serve</b> moves up to 3 from the kitchen for 1💰.</li>
    <li>When an order is complete, tap the guest to <b>check in</b> to a free room of their colour (green tourists take any colour). You get their ⭐ and reward.</li>
    <li>Filling a whole room group (dark outline) gives a bonus: blue ⭐, red 💰, yellow 👑.</li>
  </ul>
  <h3>Emperor & politics (⚜)</h3>
  <ul>
    <li>After rounds 3, 5 and 7 you score ⭐ for your 👑 position, then step back 3/5/7. On space 3+ you get a bonus, on 0 a penalty.</li>
    <li>Politics cards give ⭐ to whoever fulfils them first; claim them from the ⚜ menu.</li>
  </ul>
  <h3>Passing</h3>
  <p>If nothing on the board suits you, pass. When everyone else is done, the dice left are re-rolled (one is removed) and you get another go.</p>
  <h3>End of game</h3>
  <p>Occupied rooms score 1–4⭐ by floor, each 💰 and kitchen cube scores 1⭐, game-end staff score, and every guest still in your café costs 5⭐.</p>
  <h3>Icons</h3>
  <p>👤 guest · 🛏 room (🛏0 free, 🛏-1 one cheaper, 🛏0↓ free on floor 1–2) · 🔑 mark a room occupied · 🃏-3 hire staff 3 cheaper · +2🃏 draw staff · 🍽 any dish/drink · ⟳turn extra turn</p>
  </div>`;
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

async function startGame() {
  newGame({ bots: UI.bots, humans: 1 });
  UI.started = true;
  UI.info = null;
  render();
  await runGame();
  UI.info = { type: 'results' };
  render();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'shade' && e.target !== el) return; // clicks inside the sheet
  const d = el.dataset;
  const p = S && me();
  switch (act) {
    case 'bots': UI.bots = +d.n; render(); break;
    case 'start': startGame(); break;
    case 'again': UI.started = false; UI.info = null; S = null; render(); break;
    case 'help': UI.info = { type: 'help' }; render(); break;
    case 'log': UI.info = { type: 'log' }; render(); break;
    case 'court': UI.info = { type: 'court' }; render(); break;
    case 'staff': UI.info = { type: 'staff' }; render(); break;
    case 'player':
      if (+d.idx === p.idx) UI.info = { type: 'staff' };
      else UI.info = { type: 'player', idx: +d.idx };
      render();
      break;
    case 'close': case 'shade': UI.info = null; render(); break;
    case 'opt': {
      const o = S.prompt.options[+d.i];
      if (o && !o.disabled) answerPrompt(o.value);
      break;
    }
    case 'skip': answerPrompt(null); break;
    case 'cell': answerPrompt(S.prompt.cells.find(c => c.r === +d.r && c.c === +d.c)); break;
    case 'guest': {
      const g = S.display[+d.slot];
      if (!g) break;
      const t = S.turn;
      if (myTurn() && !t.guestTaken && !t.dieTaken) sendCmd({ t: 'guest', slot: +d.slot });
      else { UI.info = { type: 'guest', g }; render(); }
      break;
    }
    case 'cafe': {
      const g = p.cafe[+d.idx];
      if (g) { UI.info = { type: 'guest', g, cafe: true, idx: +d.idx }; render(); }
      break;
    }
    case 'checkin': UI.info = null; sendCmd({ t: 'checkin', idx: +d.idx }); break;
    case 'space': if (myTurn()) sendCmd({ t: 'action', space: +d.space }); break;
    case 'serve': sendCmd({ t: 'serve' }); break;
    case 'pass': sendCmd({ t: 'pass' }); break;
    case 'end': sendCmd({ t: 'end' }); break;
    case 'politics': UI.info = null; sendCmd({ t: 'politics', idx: +d.idx }); break;
    case 'opr': sendCmd({ t: 'opr', idx: +d.idx }); break;
  }
});

Hooks.render = render;
Hooks.toast = toast;
render();
