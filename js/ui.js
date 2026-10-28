// Mobile UI: renders the whole screen from state on every change and turns taps
// into engine commands or prompt answers.
// The game is a fixed, non-scrolling screen: header, one tab's screen, and a dock with the turn status.
// Phones keep the tabs in the dock; tablets and desktops (760px+, up to 1200px wide) put them in the header
// and turn sheets into dialogs.
// Room choices (prepare, check in, turn occupied) are made on the Hotel view itself;
// every other decision opens a sheet.

const UI = {
  bots: 1,
  info: null, // non-blocking info sheet: { type, ... }
  started: false,
  tab: 'table',
  pages: {},
  staffTab: 'hired',
};

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const me = () => S && S.players.find(p => !p.isBot);
const myTurn = () => S && S.turn && !S.players[S.turn.pi].isBot && S.awaitCmd;

// Pictures come from js/art.js (cut from the art contact sheets); anything without one falls back to emoji.
const ARTS = (THEME.id === 'museum' ? ART_MUSEUM : ART) || {};
const pic = (src, alt, cls) => `<img class="${cls}" src="${src}" alt="${esc(alt)}" decoding="async" draggable="false">`;
const artFor = (group, k) => ARTS[group] && ARTS[group][k];
const dish = c => (artFor('items', c) ? pic(artFor('items', c), CUBE_INFO[c].name, 'ic') : CUBE_INFO[c].emoji);
const staffFace = card => (artFor('staff', card.id) ? pic(artFor('staff', card.id), '', 'face') : `<span class="face emo" aria-hidden="true">${card.emoji}</span>`);
const guestFace = g => (artFor('guests', g.no) ? pic(artFor('guests', g.no), '', 'face') : `<span class="face emo" aria-hidden="true">${g.emoji}</span>`);
const playerFace = q => (artFor('players', q.idx) ? pic(artFor('players', q.idx), '', 'face') : `<span class="face emo" aria-hidden="true">${q.avatar}</span>`);
const actionIcon = s => (s === 1 ? dish('s') + dish('c') : s === 2 ? dish('w') + dish('k') : ACTION_EMOJI[s]);

const ACTION_LABEL = { 1: 'Strudel & cake', 2: 'Wine & coffee', 3: 'Prepare rooms', 4: 'Emperor/krone', 5: 'Hire staff', 6: 'Any action' };
const PIPS = {
  1: [[12, 12]],
  2: [[7.5, 7.5], [16.5, 16.5]],
  3: [[7.5, 7.5], [12, 12], [16.5, 16.5]],
  4: [[7.5, 7.5], [16.5, 7.5], [7.5, 16.5], [16.5, 16.5]],
  5: [[7.5, 7.5], [16.5, 7.5], [12, 12], [7.5, 16.5], [16.5, 16.5]],
  6: [[7.5, 7], [16.5, 7], [7.5, 12], [16.5, 12], [7.5, 17], [16.5, 17]],
};
function dieSVG(n, size = 28) {
  return `<svg class="die${n === 1 ? ' one' : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="Die showing ${n}">
    <rect x="1.5" y="1.5" width="21" height="21" rx="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</svg>`;
}

function rewardShort(r) {
  switch (r.t) {
    case 'k': return `+${r.n}💰`;
    case 'e': return `+${r.n}👑`;
    case 'v': return `+${r.n}⭐`;
    case 'c': return r.c === 'any' ? '+🍽️' : `+${dish(r.c)}`;
    case 'g': return '+🙋';
    case 'r': return { pay: '🛏️', m1: '🛏️-1', free: '🛏️0', free12: '🛏️0↓' }[r.mode];
    case 't': return '🔑';
    case 's': return r.n >= 99 ? '🤵0' : `🤵-${r.n}`;
    case 'd': return `+${r.n}🃏`;
    case 'x': return r.n >= 99 ? '3🃏→0' : '3🃏→-3';
    case 'a': return '🔁';
  }
  return '';
}

function rewardIcon(r) {
  if (r.t === 'c') return r.c === 'any' ? '🍽️' : dish(r.c);
  return { k: '💰', e: '👑', v: '⭐', g: '🙋', r: '🛏️', t: '🔑', s: '🤵', d: '🃏', x: '🃏', a: '🔁' }[r.t] || '';
}

function rewardLong(r) {
  switch (r.t) {
    case 'k': return `Receive ${r.n} krone`;
    case 'e': return `Advance ${r.n} on the Emperor track`;
    case 'v': return `Receive ${r.n} VP`;
    case 'c': return r.c === 'any' ? 'Take a dish or drink of your choice' : `Take 1 ${CUBE_INFO[r.c].plural}`;
    case 'g': return 'Invite another guest for free';
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

// Engine log lines use third-person verbs ("You invites"); read them as "You invite".
const YOU_VERBS = {
  checks: 'check', draws: 'draw', earns: 'earn', fills: 'fill', fulfils: 'fulfil', gets: 'get', hires: 'hire',
  invites: 'invite', loses: 'lose', marks: 'mark', passes: 'pass', pays: 'pay', prepares: 'prepare', rolls: 'roll',
  scores: 'score', serves: 'serve', suffers: 'suffer', takes: 'take',
};
function youText(msg) {
  return msg.replace(/\bYou's\b/g, 'Your').replace(/\bYou (re-)?([a-z]+)\b/g, (m, re, v) => `You ${re || ''}${YOU_VERBS[v] || v}`);
}

// Themes other than the hotel name galleries after their department rather than a colour.
const roomWord = color => (color === 'G' ? 'Any room' : `${THEME.types ? THEME.types[color] : COLORS[color].name} room`);

// ---------- building blocks ----------
function guestDetailHTML(g, opt = {}) {
  const order = g.order.map((c, i) => {
    const st = opt.showFill ? (g.filled[i] ? 'got' : 'miss') : '';
    return `<div class="${st}"><span>${dish(c)}</span>${CUBE_INFO[c].name}</div>`;
  }).join('');
  const rewards = g.rewards.length
    ? g.rewards.map(r => `<div class="rw"><span class="av" aria-hidden="true">${rewardIcon(r)}</span>${esc(rewardLong(r))}</div>`).join('')
    : '<div class="rw sub">No extra reward</div>';
  return `<div class="gd-head ${g.color}">
      <span class="gd-pt">${guestFace(g)}</span>
      <div class="tt"><div class="eyebrow"><i></i>${COLORS[g.color].guest} · No. ${g.no}</div><h2>${esc(g.name)}</h2></div>
    </div>
    <div class="facts ${g.color}">
      <div class="fact"><b>⭐ ${g.vp}</b><span>Points</span></div>
      <div class="fact"><b>${g.order.length}</b><span>In the order</span></div>
      <div class="fact"><b><span class="sw" aria-hidden="true">🛏️</span></b><span>${roomWord(g.color)}</span></div>
    </div>
    <h3>Order</h3><div class="order">${order}</div>
    <h3>When checked in</h3><div class="rewards">${rewards}</div>`;
}

// The hotel scales to fill its box: a roof, four floors of five rooms and a base line.
function hotelHTML(p, pick, tag) {
  const pickMap = {};
  if (pick) for (const c of pick) pickMap[key(c.r, c.c)] = c;
  let h = '';
  for (let r = ROWS - 1; r >= 0; r--) {
    h += `<div class="rowlab"><b>F${r + 1}</b><span>${ROW_COST[r] ? `💰${ROW_COST[r]}` : 'Free'}</span></div>`;
    for (let c = 0; c < COLS; c++) {
      const color = LAYOUT[r][c];
      const st = p.rooms[r][c];
      const cls = ['room', color, st || ''];
      const door = st && artFor('rooms', `${color}-${st}`);
      if (door) cls.push('art');
      const pk = pickMap[key(r, c)];
      if (pk) cls.push('pick');
      const gid = p.guestIn ? p.guestIn[key(r, c)] : undefined;
      let inner = '';
      let label = `${COLORS[color].name} room, floor ${r + 1}`;
      if (pk) {
        inner = pk.cost !== undefined
          ? `<span class="pc"><span>🛏️</span>${pk.cost ? `💰${pk.cost}` : 'Free'}</span>`
          : `<span class="pc"><span>${tag === 'removeRoom' ? '✖️' : '🔑'}</span>Here</span>`;
        label += pk.cost !== undefined ? `, costs ${pk.cost} krone` : ', choose';
      } else if (st === 'occ') {
        if (gid !== undefined) inner = `<span class="who">${guestFace(GUESTS[gid])}</span>`;
        if (gid !== undefined) cls.push('has-guest');
        else inner = door ? '' : '🧑';
        label += gid !== undefined ? `, ${GUESTS[gid].name}` : ', occupied';
      } else if (st === 'free') {
        inner = door ? '' : '🛏️';
        label += ', prepared';
      } else if (DOOR_VP[key(r, c)]) {
        inner = `<span class="door">+${DOOR_VP[key(r, c)]}⭐</span>`;
      }
      const bg = door ? ` style="background-image:url('${door}')"` : '';
      h += pk
        ? `<button class="${cls.join(' ')}"${bg} data-act="cell" data-r="${r}" data-c="${c}" aria-label="${esc(label)}">${inner}</button>`
        : gid !== undefined && st === 'occ'
          ? `<button class="${cls.join(' ')}"${bg} data-act="roomguest" data-g="${gid}" data-peek="g${gid}" aria-label="${esc(label)}">${inner}</button>`
          : `<div class="${cls.join(' ')}"${bg} role="img" aria-label="${esc(label)}">${inner}</div>`;
    }
  }
  return `<div class="hotel-box"><div class="hotel-fit">
    <div class="roofwrap" aria-hidden="true"><span></span><svg class="roof" viewBox="0 0 300 26" preserveAspectRatio="none"><path class="r" d="M4 26 L150 2 L296 26 Z"/><circle class="k" cx="150" cy="16" r="4"/></svg></div>
    <div class="hotel">${h}</div>
    <div class="basewrap" aria-hidden="true"><i></i></div>
  </div></div>`;
}

function trackHTML() {
  let h = '<div class="track">';
  for (let i = 0; i <= EMP_MAX; i++) {
    const cls = i === 0 ? 'pen' : i >= 3 ? 'bonus' : '';
    const dots = S.players.filter(p => p.emp === i).map(p => `<span class="pdot" style="background:${p.color}" title="${esc(p.name)}"></span>`).join('');
    h += `<div class="tcell ${cls}">${i}<div class="dots">${dots}</div><span class="v">${EMP_VP[i]}⭐</span></div>`;
  }
  return h + '</div>';
}

// A staff card: portrait on top, then name, kind and effect.
function staffCard(card, opt = {}) {
  return `<div class="scard2 ${card.type}${opt.dim ? ' dim' : ''}">
    <div class="sc-pic">${staffFace(card)}${opt.cost !== undefined ? `<span class="sc-cost">💰${opt.cost}</span>` : ''}</div>
    <div class="sc-b"><div class="sc-n">${esc(card.name)}</div><div class="sc-t">${STAFF_TYPE_LABEL[card.type]}</div>
      <p>${esc(card.text)}</p>${opt.foot || ''}</div>
  </div>`;
}

function statusText() {
  if (S.phase === 'over') return 'Game over';
  const p = S.current !== null ? S.players[S.current] : null;
  if (S.prompt) return S.prompt.kind === 'cells' ? 'Choose a room in your hotel' : 'Make a choice';
  if (!S.turn) return p ? `${p.name}…` : '';
  const tp = S.players[S.turn.pi];
  if (tp.isBot) return `${tp.name} is playing…`;
  const t = S.turn;
  if (t.extra) return 'Bonus turn: invite a guest and use an action';
  if (!t.dieTaken) return t.guestTaken ? 'Now take a die' : 'Your turn: invite a guest, then take a die';
  return 'Check in, serve or use staff — then end your turn';
}

// ---------- screens ----------
// Every screen fills the space between the header and the dock exactly; nothing on the page scrolls.
// Phones get five tabs (Table, Café, Hotel, Staff, Log); tablets and desktops show the café on the
// Table screen and so have four.
const WIDE = window.matchMedia('(min-width: 760px)');
WIDE.addEventListener('change', () => render());
window.addEventListener('resize', () => { if (UI.started) render(); });
const staffPage = () => (WIDE.matches ? 6 : window.innerHeight < 720 ? 3 : 4);

const TAB_INFO = {
  table: ['Table', '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/>'],
  cafe: ['Café', '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'],
  hotel: ['Hotel', '<path d="M4 20V6l8-3 8 3v14"/><path d="M3 20h18M9 9h2M13 9h2M9 13h2M13 13h2M10 20v-3h4v3"/>'],
  staff: ['Staff', '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>'],
  log: ['Log', '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'],
};
const VIEW_TITLE = { table: 'Grand Hotel', cafe: 'Your café', hotel: 'Your hotel', staff: 'Staff', log: 'Log' };
const tabsFor = wide => (wide ? ['table', 'hotel', 'staff', 'log'] : ['table', 'cafe', 'hotel', 'staff', 'log']);

function playersHTML() {
  return `<div class="players">${playerOrder().map(pi => {
    const q = S.players[pi];
    return `<button class="chip${S.current === pi ? ' active' : ''}" data-act="player" data-idx="${pi}" aria-label="${esc(q.name)}: ${q.vp} points, ${q.money} krone, Emperor ${q.emp}">
      <span class="av pav" style="--ring:${q.color}">${playerFace(q)}</span>
      <span class="ch-tx"><span class="nm">${esc(q.name)}</span><span class="st">⭐${q.vp} · 💰${q.money}</span></span>
    </button>`;
  }).join('')}</div>`;
}

function diceHTML(p, mine, t) {
  let h = `<section class="blk dice-blk"><div class="sec-h"><h2>Take a die</h2><span>🎲 ${totalDice()} left</span></div><div class="dice">`;
  for (let s = 1; s <= 6; s++) {
    const n = S.dice[s - 1];
    const ok = mine && !t.dieTaken && canUseSpace(p, s);
    const cls = !n ? 'none' : ok ? 'ready' : mine ? 'wait' : '';
    h += `<button class="dtile a${s} ${cls}" data-act="space" data-space="${s}" ${ok ? '' : 'disabled'} aria-label="${ACTION_LABEL[s]}, ${n} dice">
      <span class="d-die">${dieSVG(s)}</span>
      <span class="d-n">×${n}</span>
      <span class="d-ic" aria-hidden="true">${actionIcon(s)}${s === 6 && !hasStaff(p, 17) ? '<small>💰1</small>' : ''}</span>
      <span class="d-lab">${ACTION_LABEL[s]}</span>
    </button>`;
  }
  return h + '</div></section>';
}

function orderHTML(g, fill) {
  return `<span class="need-row">${g.order.map((c, k) => `<span class="need${fill ? (g.filled[k] ? ' got' : ' miss') : ''}" title="${CUBE_INFO[c].name}${fill && !g.filled[k] ? ' (still needed)' : ''}">${dish(c)}</span>`).join('')}</span>`;
}

function guestsHTML(p, mine, t) {
  const canGuest = mine && !t.guestTaken && !t.dieTaken && cafeFree(p) >= 0;
  let h = `<section class="blk guests-blk"><div class="sec-h"><h2>Guests arriving</h2><span>${hasStaff(p, 25) ? 'All free (Delivery Boy)' : canGuest ? 'Tap to invite' : 'Tap for details'}</span></div><div class="guests">`;
  h += S.display.map((g, i) => {
    if (!g) return '<div class="gtile empty">—</div>';
    const cost = guestCost(p, i);
    return `<button class="gtile ${g.color}${canGuest ? ' ready' : ''}" data-act="guest" data-slot="${i}" data-peek="d${i}" aria-label="${esc(g.name)}, ${COLORS[g.color].guest}, ${g.vp} VP, costs ${cost} krone">
      <span class="g-band">${COLORS[g.color].guest}</span>
      <span class="pt">${guestFace(g)}<span class="badge cost">${cost ? `💰${cost}` : 'Free'}</span><span class="badge vp">⭐${g.vp}</span></span>
      <span class="g-body"><span class="nm">${esc(g.name)}</span>${orderHTML(g, false)}</span>
    </button>`;
  }).join('');
  return h + '</div></section>';
}

function cafeHTML(p, mine) {
  const seated = p.cafe.filter(Boolean).length;
  let h = `<section class="blk cafe-blk"><div class="sec-h"><h2>Your café</h2><span>${seated} of 3 seats</span></div><div class="seats">`;
  h += p.cafe.map((g, i) => {
    if (!g) return '<div class="seat empty"><span class="seat-pt">🪑</span><span class="seat-tx"><b>Empty table</b><small>Invite a guest</small></span></div>';
    const done = isComplete(g);
    const rooms = freeRoomsFor(p, g.color).length;
    const act = done
      ? (mine ? `<button class="btn sm primary" data-act="checkin" data-idx="${i}" ${rooms ? '' : 'disabled'}>${rooms ? '🔑 Check in' : 'No free room'}</button>` : '<span class="ok">Ready ✓</span>')
      : `<span class="seat-rw">${g.rewards.map(rewardShort).join(' ')}</span>`;
    return `<div class="seat ${g.color}${done ? ' done' : ''}" data-peek="c${i}">
      <span class="g-band">${COLORS[g.color].guest}<span>⭐${g.vp}</span></span>
      <button class="seat-pt" data-act="cafe" data-idx="${i}" aria-label="${esc(g.name)} details">${guestFace(g)}</button>
      <div class="seat-tx"><b>${esc(g.name)}</b><small>${roomWord(g.color)}</small></div>
      <div class="seat-ord">${orderHTML(g, true)}</div>
      <div class="seat-act">${act}</div>
    </div>`;
  }).join('');
  h += '</div>';
  const serveCost = hasStaff(p, 24) ? 'free' : '💰1';
  h += `<div class="kitchen"><span class="lab">Kitchen</span>${CUBES.map(c => `<span class="k-it${p.kitchen[c] ? '' : ' zero'}" title="${CUBE_INFO[c].name}">${dish(c)}<b>${p.kitchen[c]}</b></span>`).join('')}
    <button class="btn" data-act="serve" ${mine && kitchenUseful(p) ? '' : 'disabled'}>Serve · ${serveCost}</button></div>`;
  return h + '</section>';
}

function tableView(p, mine, t, wide) {
  if (wide) return `<div class="table-grid">${diceHTML(p, mine, t)}${cafeHTML(p, mine)}${guestsHTML(p, mine, t)}</div>`;
  return `<div class="table-grid">${playersHTML()}${guestsHTML(p, mine, t)}${diceHTML(p, mine, t)}</div>`;
}

function courtHTML(p, mine) {
  const nextScore = [3, 5, 7].find(r => r >= S.round);
  let h = `<section class="blk"><div class="sec-h"><h2>Emperor track</h2><span>${nextScore ? `Scores after round ${nextScore}` : ''}</span></div>${trackHTML()}</section>`;
  h += `<section class="blk court-list"><div class="sec-h"><h2>Emperor &amp; politics</h2><button class="lnk" data-act="court">Details</button></div>`;
  h += S.emperor.map((e, k) => `<div class="cline${[3, 5, 7][k] < S.round ? ' past' : ''}"><b>R${[3, 5, 7][k]}</b><span>✨ ${esc(e.bonus)}<br>⚠️ ${esc(e.penalty)}</span></div>`).join('');
  h += S.politics.map((pc, k) => {
    const can = p && mine && !pc.claims.includes(p.idx) && pc.def.check(p);
    const who = pc.claims.map(pi => `<span class="pdot" style="background:${S.players[pi].color}"></span>`).join('');
    return `<div class="cline"><b>📜</b><span>${esc(pc.def.text)} <i>${pc.def.vps[pc.claims.length] || 0}⭐</i> ${who}</span>${can ? `<button class="btn sm good" data-act="politics" data-idx="${k}">Claim</button>` : ''}</div>`;
  }).join('');
  return h + '</section>';
}

function hotelView(p, pr, mine, wide) {
  const pick = pr && pr.kind === 'cells';
  const stats = `<div class="stats">
    <div class="stat"><div class="k">⭐ Points</div><div class="v">${p.vp}</div></div>
    <div class="stat"><div class="k">💰 Krone</div><div class="v">${p.money}</div></div>
    <div class="stat"><div class="k">👑 Emperor</div><div class="v">${p.emp}<small> / ${EMP_MAX}</small></div></div>
  </div>`;
  let banner = '';
  if (pick) {
    const g = pr.meta && pr.meta.guest;
    banner = `<div class="banner" role="status">
      <span class="av${g ? ' gav ' + g.color : ''}">${g ? guestFace(g) : pr.tag === 'removeRoom' ? '✖️' : pr.tag === 'turn' ? '🔑' : '🛏️'}</span>
      <span class="tx"><b>${esc(pr.title)}</b>${pr.text ? `<small>${esc(pr.text)}</small>` : ''}</span>
      ${pr.allowSkip ? `<button class="btn sm" data-act="skip">${esc(pr.skipLabel || 'Skip')}</button>` : ''}
    </div>`;
  }
  const legend = '<div class="legend"><span>🧑 Occupied</span><span>🛏️ Prepared</span><span><i></i>Empty</span></div>';
  if (wide) {
    return `<div class="hotel-grid"><div class="hotel-main">${banner}${hotelHTML(p, pick ? pr.cells : null, pick ? pr.tag : null)}${legend}</div>
      <div class="hotel-side">${stats}${courtHTML(p, mine)}</div></div>`;
  }
  const nextScore = [3, 5, 7].find(r => r >= S.round);
  return `<div class="hotel-grid">${stats}${banner}${hotelHTML(p, pick ? pr.cells : null, pick ? pr.tag : null)}${legend}
    <section class="blk"><div class="sec-h"><h2>Emperor${nextScore ? ` · scores after R${nextScore}` : ''}</h2><button class="lnk" data-act="court">Emperor &amp; politics</button></div>${trackHTML()}</section></div>`;
}

function pager(id, total) {
  const size = staffPage();
  const pages = Math.max(1, Math.ceil(total / size));
  const at = Math.min(UI.pages[id] || 0, pages - 1);
  UI.pages[id] = at;
  const nav = pages > 1 ? `<span class="pager"><button data-act="page" data-id="${id}" data-d="-1" ${at ? '' : 'disabled'} aria-label="Previous page">‹</button>${at + 1}/${pages}<button data-act="page" data-id="${id}" data-d="1" ${at < pages - 1 ? '' : 'disabled'} aria-label="Next page">›</button></span>` : '';
  return { from: at * size, size, nav };
}

function staffView(p, mine, wide) {
  const hired = pager('hired', p.staff.length);
  const hand = pager('hand', p.hand.length);
  const hiredHTML = `<section class="blk staff-blk"><div class="sec-h"><h2>Hired · ${p.staff.length}</h2>${hired.nav}</div>${p.staff.length
    ? '<div class="staffgrid">' + p.staff.slice(hired.from, hired.from + hired.size).map((e, k) => {
      const i = hired.from + k;
      const foot = e.card.type === 'opr'
        ? `<button class="btn sm" data-act="opr" data-idx="${i}" ${mine && !e.tapped ? '' : 'disabled'}>${e.tapped ? 'Used this round' : 'Use now'}</button>` : '';
      return staffCard(e.card, { foot, dim: e.tapped });
    }).join('') + '</div>'
    : '<p class="empty-note">Nobody hired yet. Take a 5 to hire staff 🤵</p>'}</section>`;
  const handHTML = `<section class="blk staff-blk"><div class="sec-h"><h2>In your hand · ${p.hand.length}</h2>${hand.nav}</div>${p.hand.length
    ? '<div class="staffgrid">' + p.hand.slice(hand.from, hand.from + hand.size).map(c => staffCard(c, { cost: c.cost })).join('') + '</div>'
    : '<p class="empty-note">No cards in hand.</p>'}</section>`;
  if (wide) return `<div class="staff-grid">${hiredHTML}${handHTML}</div>`;
  const sub = UI.staffTab;
  return `<div class="staff-grid"><div class="seg sub" role="tablist">
      <button role="tab" aria-selected="${sub === 'hired'}" data-act="stab" data-t="hired">Hired · ${p.staff.length}</button>
      <button role="tab" aria-selected="${sub === 'hand'}" data-act="stab" data-t="hand">In hand · ${p.hand.length}</button></div>
    ${sub === 'hired' ? hiredHTML : handHTML}</div>`;
}

function logView() {
  return `<section class="blk log-blk"><div class="list logs">${S.log.slice(-60).reverse().map(l => `<div class="lg">${l.pi !== undefined ? `<span class="pdot" style="background:${S.players[l.pi].color}"></span>` : '<span class="pdot none"></span>'}<span>${esc(youText(l.msg))}</span></div>`).join('') || '<div class="lg">Nothing yet.</div>'}</div></section>`;
}

function render() {
  const app = document.getElementById('app');
  if (!UI.started || !S) { document.body.classList.remove('ingame'); app.innerHTML = menuHTML() + sheetsHTML(); themeDom(app); calmSheets(); return; }
  document.body.classList.add('ingame');
  const p = me();
  const t = S.turn;
  const mine = myTurn();
  const pr = S.prompt && !S.players[S.prompt.pi].isBot ? S.prompt : null;
  const wide = WIDE.matches;
  const tabs = tabsFor(wide);
  if (!tabs.includes(UI.tab)) UI.tab = 'table';
  const cells = pr && pr.kind === 'cells';
  const view = cells ? 'hotel' : UI.tab;
  const claimable = mine ? claimablePolitics(p).length : 0;
  const oprReady = mine && p.staff.some(e => e.card.type === 'opr' && !e.tapped);
  const doneGuest = mine && p.cafe.some(g => g && isComplete(g));
  const dot = id => (id === 'staff' && oprReady) || (id === 'cafe' && doneGuest) ? '<span class="dot"></span>' : '';
  const nav = cls => `<nav class="${cls}">${tabs.map(id => `<button data-act="tab" data-tab="${id}" ${view === id ? 'aria-current="page"' : ''}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TAB_INFO[id][1]}</svg>
      <span>${TAB_INFO[id][0]}</span>${dot(id)}</button>`).join('')}</nav>`;

  let main;
  if (view === 'table') main = tableView(p, mine, t, wide);
  else if (view === 'cafe') main = cafeHTML(p, mine);
  else if (view === 'hotel') main = hotelView(p, pr, mine, wide);
  else if (view === 'staff') main = staffView(p, mine, wide);
  else main = logView();

  const last = S.log.length ? youText(S.log[S.log.length - 1].msg) : '';
  hidePeek();
  app.innerHTML = `<div class="shell ${wide ? 'wide' : 'narrow'}">
    <header class="top">
      <div class="tt"><div class="eyebrow">${S.phase === 'setup' ? 'Setting up' : S.phase === 'over' ? 'Game over' : `Round ${S.round} of 7`}</div>
      <h1 class="title">${VIEW_TITLE[view]}</h1></div>
      ${wide ? nav('tabs') + playersHTML() : ''}
      <button class="roundbtn" data-act="court" aria-label="Emperor and politics">👑${claimable ? '<span class="dot"></span>' : ''}</button>
      <button class="roundbtn" data-act="help" aria-label="How to play" style="font:600 18px/1 var(--serif)">?</button>
    </header>
    <main class="screen v-${view}">${main}</main>
    <div class="dock">
      <div class="status"><div class="tx" aria-live="polite"><div class="s1">${esc(statusText())}</div><div class="s2">${esc(last)}</div></div>
        <button class="btn" data-act="pass" ${mine && !t.dieTaken && !t.extra ? '' : 'disabled'}>Pass</button>
        <button class="btn primary" data-act="end" ${mine && (t.dieTaken || t.extra) ? '' : 'disabled'}>End turn</button>
      </div>
      ${wide ? '' : nav('nav')}
    </div>
  </div>` + sheetsHTML();
  themeDom(app);
  calmSheets();
}

function menuHTML() {
  const facade = LAYOUT.slice().reverse().join('').split('').map(c => `<i class="${c}"></i>`).join('');
  return `<div class="menu">
    <div class="facade" aria-hidden="true"><div class="roofm"></div><div class="win">${facade}</div><div class="base"></div></div>
    <h1>Grand Hotel</h1>
    <p class="tag">Serve your guests, fill your rooms,<br>keep the Emperor happy.</p>
    <div class="cast" aria-hidden="true">${PLAYER_AVATARS.map((a, i) => `<span class="av pav" style="--ring:${PLAYER_COLORS[i]}">${playerFace({ idx: i, name: '', avatar: a })}</span>`).join('')}</div>
    <div class="deco" aria-hidden="true">${dish('s')} ${dish('c')} ${dieSVG(5, 40).replace('<svg', '<svg style="transform:rotate(-12deg)"')} ${dieSVG(3, 40).replace('<svg', '<svg style="transform:rotate(14deg)"')} ${dish('w')} ${dish('k')}</div>
    <div class="seg-wrap"><div class="eyebrow">Theme</div>
      <div class="seg theme-seg" role="radiogroup" aria-label="Theme" data-keep>${[['hotel', '🏨 Hotel'], ['museum', '🏛️ Museum']].map(([id, label]) => `<button role="radio" aria-checked="${THEME.id === id}" data-act="theme" data-t="${id}">${label}</button>`).join('')}</div>
    </div>
    <div class="seg-wrap"><div class="eyebrow">Opponents 🤖</div>
      <div class="seg" role="radiogroup" aria-label="Opponents">${[1, 2, 3].map(n => `<button role="radio" aria-checked="${UI.bots === n}" data-act="bots" data-n="${n}">${n}</button>`).join('')}</div>
    </div>
    <div class="stack">
      <button class="btn primary big" data-act="start">🎲 New game</button>
      <button class="btn link" data-act="help">📖 How to play</button>
    </div>
  </div>`;
}

function optionHTML(pr, o, i) {
  const dis = o.disabled ? 'disabled' : '';
  if (pr.tag === 'guest' && o.guest !== undefined) {
    const g = o.guest;
    if (!g) return '';
    return `<button class="btn opt ${g.color}" data-act="opt" data-i="${i}" ${dis}>
      <span class="av gav">${guestFace(g)}</span>
      <span class="ol">${esc(g.name)}<small>⭐${g.vp} · ${g.order.map(dish).join('')} · ${g.rewards.map(rewardShort).join(' ') || 'no reward'}</small></span></button>`;
  }
  if (o.card) {
    return `<button class="btn opt" data-act="opt" data-i="${i}" ${dis}>
      <span class="av sav">${staffFace(o.card)}</span>
      <span class="ol">${esc(o.card.name)}<small>${STAFF_TYPE_LABEL[o.card.type]} — ${esc(o.card.text)}</small></span>
      ${o.cost !== undefined ? `<span class="oc">💰${o.cost}</span>` : ''}</button>`;
  }
  if (o.cube) return `<button class="btn opt" data-act="opt" data-i="${i}"><span class="av" aria-hidden="true">${dish(o.cube)}</span><span class="ol">${esc(o.label)}</span></button>`;
  if (o.guest) {
    return `<button class="btn opt ${o.guest.color}" data-act="opt" data-i="${i}" ${dis}><span class="av gav">${guestFace(o.guest)}</span><span class="ol">${esc(o.label)}</span></button>`;
  }
  if (o.guest === null) return '';
  let label = esc(o.label);
  let icon = '';
  if (pr.tag === 'strength') {
    icon = `<span class="av act" aria-hidden="true">${actionIcon(o.sub)}</span>`;
    if (o.boost) label += '<small>Pay 💰1 extra for +1</small>';
  }
  if (pr.tag === 'cubes') label = `${dish(pr.meta.a).repeat(o.a)}${dish(pr.meta.b).repeat(o.b)} <small>${esc(o.label)}</small>`;
  const primary = !(o.value && o.value.boost) && pr.tag !== 'cubes' && pr.tag !== 'split4';
  return `<button class="btn opt${primary ? ' primary' : ''}" data-act="opt" data-i="${i}" ${dis}>${icon}<span class="ol">${label}</span></button>`;
}

function promptHTML() {
  const pr = S.prompt;
  if (pr.kind === 'cells') return ''; // chosen on the Hotel view
  const g = pr.meta && pr.meta.guest;
  let body = '';
  if (g) {
    body = guestDetailHTML(g, { showFill: pr.tag === 'checkin' });
    body += `<div class="foot">${pr.options.map((o, i) => `<button class="btn primary big" data-act="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>🛎️ ${esc(o.label)}</button>`).join('')}
      ${pr.allowSkip ? `<button class="btn link" data-act="skip">${esc(pr.skipLabel || 'Not now')}</button>` : ''}</div>`;
    return `<div class="shade"><div class="sheet" role="dialog" aria-label="${esc(pr.title)}">${body}</div></div>`;
  }
  if (pr.tag === 'strength' && pr.meta) body += `<div style="margin:2px 0 10px">${dieSVG(pr.meta.space, 36)}</div>`;
  body += `<h2>${esc(pr.title)}</h2>${pr.text ? `<p class="sub">${esc(pr.text)}</p>` : ''}`;
  body += '<div class="opts">' + pr.options.map((o, i) => optionHTML(pr, o, i)).join('') + '</div>';
  if (pr.allowSkip) body += `<div class="foot"><button class="btn link" data-act="skip">${esc(pr.skipLabel || 'Skip')}</button></div>`;
  return `<div class="shade"><div class="sheet" role="dialog" aria-label="${esc(pr.title)}">${body}</div></div>`;
}

function infoHTML() {
  const i = UI.info;
  let title = '', body = '', bare = false;
  const p = S && me();
  const mine = myTurn();
  if (i.type === 'help') {
    title = 'How to play';
    body = helpHTML();
  } else if (i.type === 'guest') {
    bare = true;
    title = i.g.name;
    body = guestDetailHTML(i.g, { showFill: i.cafe });
    if (i.cafe && mine && isComplete(i.g)) {
      const n = freeRoomsFor(p, i.g.color).length;
      body += `<div class="foot"><button class="btn primary big" data-act="checkin" data-idx="${i.idx}" ${n ? '' : 'disabled'}>${n ? '🔑 Check in to a room' : `No free ${i.g.color === 'G' ? '' : COLORS[i.g.color].name.toLowerCase() + ' '}room`}</button></div>`;
    }
  } else if (i.type === 'player') {
    const q = S.players[i.idx];
    title = q.name;
    body = `<div class="who-head"><span class="av pav" style="--ring:${q.color}">${playerFace(q)}</span><p class="sub">⭐${q.vp} · 💰${q.money} · 👑${q.emp} · ${q.hand.length} staff in hand</p></div>${hotelHTML(q)}
      <h3>Café</h3><div class="list">${q.cafe.map(g => g ? `<div class="row ${g.color}"><span class="av gav">${guestFace(g)}</span><span style="flex:1"><span class="ttl">${esc(g.name)}</span><span class="sub">⭐${g.vp}</span></span><span class="dishes">${g.order.map((c, k) => `<span class="dish${g.filled[k] ? '' : ' miss'}">${dish(c)}</span>`).join('')}</span></div>` : '<div class="row empty"><span class="av">🪑</span>Empty seat</div>').join('')}</div>
      <h3>Kitchen</h3><div class="kitchen" style="margin:0">${CUBES.map(c => `<span>${dish(c)} ${q.kitchen[c]}</span>`).join('')}</div>
      <h3>Staff</h3>${q.staff.length ? `<div class="staffgrid">${q.staff.map(e => staffCard(e.card)).join('')}</div>` : '<p class="sub">None</p>'}`;
  } else if (i.type === 'court') {
    title = 'Emperor & Politics';
    body = '<h3>Emperor tiles</h3>' + S.emperor.map((e, k) => `<div class="scard"><div class="sh"><span>👑 After round ${[3, 5, 7][k]}</span><span style="color:var(--muted);font-weight:500">back ${[3, 5, 7][k]}</span></div>
      <p>✨ Space 3+: <b>${esc(e.bonus)}</b></p><p>⚠️ Space 0: <b>${esc(e.penalty)}</b></p></div>`).join('');
    body += '<p class="sub">At each Emperor scoring you score the ⭐ under your space, then move back. Spaces 1–2: nothing.</p>';
    body += '<h3>Politics — first to fulfil scores most</h3>' + S.politics.map((pc, k) => {
      const can = p && mine && !pc.claims.includes(p.idx) && pc.def.check(p);
      const vps = pc.def.vps.map((v, n) => `<span style="${n < pc.claims.length ? 'text-decoration:line-through;opacity:.5' : ''}">${v}</span>`).join(' / ');
      const who = pc.claims.map(pi => `<span class="pdot" style="background:${S.players[pi].color}"></span>`).join(' ');
      return `<div class="scard"><div class="sh"><span>📜 ${esc(pc.def.text)}</span><span>${vps}⭐</span></div><p>${who || '<span style="color:var(--muted)">Unclaimed</span>'}</p>
        ${can ? `<div style="margin-top:8px"><button class="btn sm good" data-act="politics" data-idx="${k}">Claim now</button></div>` : ''}</div>`;
    }).join('');
  } else if (i.type === 'results') {
    title = 'Final scores';
    const r = S.results;
    body = `<p class="sub">${r[0].p.isBot ? `${esc(r[0].p.name)} wins.` : '🎉 You win! The Emperor is delighted.'}</p>
      <table class="res"><tr><th></th><th>Game</th><th>Staff</th><th>Rooms</th><th>💰</th><th>Cubes</th><th>Café</th><th>Total</th></tr>
      ${r.map((x, n) => `<tr class="${n === 0 ? 'win' : ''}"><td><span class="av pav tiny" style="--ring:${x.p.color}">${playerFace(x.p)}</span> ${esc(x.p.name)}</td>
        <td>${x.before}</td><td>${x.staff}</td><td>${x.rooms}</td><td>${x.money}</td><td>${x.cubes}</td><td>${x.cafe}</td><td>${x.total}</td></tr>`).join('')}</table>
      <div class="foot"><button class="btn primary big" data-act="again">🎲 Play again</button></div>`;
  }
  const close = i.type === 'results' ? '' : '<div class="foot"><button class="btn link" data-act="close">Close</button></div>';
  return `<div class="shade" data-act="shade"><div class="sheet" role="dialog" aria-label="${esc(title)}">${bare ? '' : `<h2>${esc(title)}</h2>`}${body}${close}</div></div>`;
}

// The screen is re-rendered on every engine update; only animate a sheet the first time it appears.
function calmSheets() {
  const now = [UI.info, S && S.prompt];
  if (UI.shown && UI.shown[0] === now[0] && UI.shown[1] === now[1]) {
    document.querySelectorAll('.sheet').forEach(el => { el.style.animation = 'none'; });
  }
  UI.shown = now;
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
    <li>Dice 🎲 are rolled onto the 6 action spaces. Everyone gets <b>2 turns</b> (order 1-2-…-2-1).</li>
    <li>On your turn you may <b>invite 1 guest</b> into your café (pay the 💰 shown; the newest guests cost most).</li>
    <li>Then you <b>must take 1 die</b>. The action's strength = the number of dice on that space (pay 💰1 once per turn for +1).</li>
  </ul>
  <h3>Actions</h3>
  <ul>
    <li><b>1</b> Strudel 🥐 / Cake 🍰 — never more cake than strudel.</li>
    <li><b>2</b> Wine 🍷 / Coffee ☕ — never more coffee than wine.</li>
    <li><b>3</b> Prepare rooms 🛏️. Pay the floor cost; rooms must touch existing rooms.</li>
    <li><b>4</b> Steps on the Emperor 👑 track and/or krone 💰.</li>
    <li><b>5</b> Hire a staff card 🤵, each die = 💰1 discount.</li>
    <li><b>6</b> Pay 💰1 and use any action 1–5 with the strength of the 6s.</li>
  </ul>
  <h3>Guests</h3>
  <ul>
    <li>Food and drink you get goes straight onto your guests' orders; extras go to your kitchen. <b>Serve</b> moves up to 3 from the kitchen for 💰1.</li>
    <li>When an order is complete, tap <b>🔑 Check in</b> and pick a room of their colour on the Hotel screen (green tourists take any colour). You get their ⭐ and reward.</li>
    <li>Filling a whole room group (touching rooms of one colour) gives a bonus: blue ⭐, red 💰, yellow 👑.</li>
  </ul>
  <h3>Emperor & politics 👑</h3>
  <ul>
    <li>After rounds 3, 5 and 7 you score ⭐ for your 👑 position, then step back 3/5/7. On space 3+ you get a bonus, on 0 a penalty.</li>
    <li>Politics cards give ⭐ to whoever fulfils them first; claim them from the 👑 menu.</li>
  </ul>
  <h3>Passing</h3>
  <p>If nothing on the board suits you, pass. When everyone else is done, the dice left are re-rolled (one is removed) and you get another go.</p>
  <h3>End of game</h3>
  <p>Occupied rooms score 1–4⭐ by floor, each 💰 and kitchen item scores 1⭐, game-end staff score, and every guest still in your café costs 5⭐.</p>
  <h3>Reward icons</h3>
  <p>🙋 free guest · 🛏️ room (🛏️0 free, 🛏️-1 one cheaper, 🛏️0↓ free on floor 1–2) · 🔑 mark a room occupied · 🤵-3 hire staff 3 cheaper · +2🃏 draw staff · 🍽️ any dish/drink · 🔁 extra turn</p>
  </div>`;
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = themeText(msg);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

async function startGame() {
  newGame({ bots: UI.bots, humans: 1 });
  UI.started = true;
  UI.info = null;
  UI.tab = 'table';
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
    case 'theme': if (d.t !== THEME.id) chooseTheme(d.t); break;
    case 'start': startGame(); break;
    case 'again': UI.started = false; UI.info = null; UI.pages = {}; S = null; render(); break;
    case 'help': UI.info = { type: 'help' }; render(); break;
    case 'court': UI.info = { type: 'court' }; render(); break;
    case 'tab': UI.tab = d.tab; render(); break;
    case 'stab': UI.staffTab = d.t; render(); break;
    case 'page': UI.pages[d.id] = (UI.pages[d.id] || 0) + +d.d; render(); break;
    case 'player':
      if (+d.idx === p.idx) UI.tab = 'hotel';
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
    case 'roomguest': UI.info = { type: 'guest', g: makeGuest(GUESTS[+d.g]) }; render(); break;
    case 'checkin': UI.info = null; sendCmd({ t: 'checkin', idx: +d.idx }); break;
    case 'space': if (myTurn()) sendCmd({ t: 'action', space: +d.space }); break;
    case 'serve': sendCmd({ t: 'serve' }); break;
    case 'pass': sendCmd({ t: 'pass' }); break;
    case 'end': sendCmd({ t: 'end' }); break;
    case 'politics': UI.info = null; sendCmd({ t: 'politics', idx: +d.idx }); break;
    case 'opr': sendCmd({ t: 'opr', idx: +d.idx }); break;
  }
});

// ---------- hover preview ----------
// With a mouse, resting on any guest (arriving, in the café or in a room) shows a larger card beside it.
function peekGuest(id) {
  const p = me();
  if (!S || !p) return null;
  if (id[0] === 'd') return { g: S.display[+id.slice(1)], fill: false };
  if (id[0] === 'c') return { g: p.cafe[+id.slice(1)], fill: true };
  if (id[0] === 'g') return { g: makeGuest(GUESTS[+id.slice(1)]), fill: false };
  return null;
}
function showPeek(el) {
  const info = peekGuest(el.dataset.peek);
  const box = document.getElementById('peek');
  if (!info || !info.g || !box) return;
  const g = info.g;
  box.className = `peek ${g.color}`;
  box.innerHTML = `<div class="pk-pt">${guestFace(g)}</div>
    <div class="pk-b"><div class="g-band">${COLORS[g.color].guest} · ⭐${g.vp}</div>
      <h3>${esc(g.name)}</h3><div class="pk-room">${roomWord(g.color)}</div>
      ${orderHTML(g, info.fill)}
      <div class="pk-rw">${g.rewards.map(r => `<div><span>${rewardIcon(r)}</span>${esc(rewardLong(r))}</div>`).join('') || '<div>No extra reward</div>'}</div></div>`;
  themeDom(box);
  const r = el.getBoundingClientRect();
  box.hidden = false;
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let x = r.right + 12;
  if (x + bw > innerWidth - 8) x = r.left - bw - 12;
  if (x < 8) x = Math.min(innerWidth - bw - 8, Math.max(8, r.left));
  let y = Math.min(innerHeight - bh - 8, Math.max(8, r.top + r.height / 2 - bh / 2));
  box.style.left = x + 'px';
  box.style.top = y + 'px';
}
function hidePeek() {
  const box = document.getElementById('peek');
  if (box) box.hidden = true;
}
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const el = e.target.closest('[data-peek]');
  if (el) showPeek(el); else hidePeek();
});
document.addEventListener('pointerdown', hidePeek);

Hooks.render = render;
Hooks.toast = toast;
render();
