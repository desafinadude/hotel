// Rules engine. Written with async/await: whenever a player must decide something
// the engine awaits choose(); bots answer instantly, the human answers via the UI.

let S = null; // the game state
const Hooks = { render() {}, toast() {}, botDelay: 450 };

const rnd = n => Math.floor(Math.random() * n);
const sleep = ms => (ms > 0 ? new Promise(r => setTimeout(r, ms)) : Promise.resolve());
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const key = (r, c) => r + ',' + c;

// ---------- player queries ----------
const hasStaff = (p, id) => p.staff.some(e => e.card.id === id);
const countRooms = p => p.rooms.flat().filter(Boolean).length;
const countOcc = p => p.rooms.flat().filter(x => x === 'occ').length;
function occOfColor(p, color) {
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
    if (p.rooms[r][c] === 'occ' && LAYOUT[r][c] === color) n++;
  return n;
}
const fullRows = p => p.rooms.filter(row => row.every(x => x === 'occ')).length;
function fullCols(p) {
  let n = 0;
  for (let c = 0; c < COLS; c++) if (p.rooms.every(row => row[c] === 'occ')) n++;
  return n;
}
const groupFull = (p, g) => GROUPS[g].cells.every(([r, c]) => p.rooms[r][c] === 'occ');
const fullGroups = p => GROUPS.filter((_, g) => groupFull(p, g)).length;
const missing = g => g.order.filter((_, i) => !g.filled[i]);
const isComplete = g => g.filled.every(Boolean);
const cafeFree = p => p.cafe.indexOf(null);
const kitchenTotal = p => CUBES.reduce((n, c) => n + p.kitchen[c], 0);
const playerOrder = () => {
  const n = S.players.length;
  return S.players.map((_, i) => (S.start + i) % n);
};

function log(msg, pi) {
  S.log.push({ msg, pi });
  if (S.log.length > 80) S.log.shift();
  Hooks.render();
}

// ---------- setup ----------
function makeGuest(def) {
  return { ...def, uid: Math.random().toString(36).slice(2), filled: def.order.map(() => false) };
}

function newGame({ bots = 1, humans = 1, botDelay } = {}) {
  if (botDelay !== undefined) Hooks.botDelay = botDelay;
  const players = [];
  for (let i = 0; i < humans + bots; i++) {
    const isBot = i >= humans;
    players.push({
      idx: i,
      name: isBot ? BOT_NAMES[(i - humans) % BOT_NAMES.length] : humans > 1 ? 'Player ' + (i + 1) : 'You',
      isBot,
      color: PLAYER_COLORS[i],
      money: 10,
      vp: 0,
      emp: 0,
      kitchen: { s: 1, c: 1, w: 1, k: 1 },
      cafe: [null, null, null],
      rooms: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
      claimedGroups: {},
      hand: [],
      staff: [],
      politics: [],
      extraTurn: false,
    });
  }
  const pick = (list, letter) => {
    const pool = list.filter(x => x.letter === letter);
    return pool[rnd(pool.length)];
  };
  S = {
    players,
    guestDeck: shuffle(GUESTS.map(makeGuest)),
    guestDiscard: [],
    display: [],
    staffDeck: shuffle(STAFF.slice()),
    dice: [0, 0, 0, 0, 0, 0],
    diceCount: DICE_FOR_PLAYERS[players.length],
    round: 1,
    start: 0,
    politics: ['A', 'B', 'C'].map(l => ({ def: pick(POLITICS, l), claims: [] })),
    emperor: ['A', 'B', 'C'].map(l => pick(EMPEROR_TILES, l)),
    log: [],
    phase: 'setup',
    turn: null,
    current: null,
    prompt: null,
    awaitCmd: null,
    slots: [],
    covered: [],
    results: null,
  };
  for (let i = 0; i < 5; i++) S.display.push(drawGuest());
  for (const p of players) for (let i = 0; i < 6; i++) p.hand.push(S.staffDeck.pop());
  return S;
}

function drawGuest() {
  if (!S.guestDeck.length) {
    S.guestDeck = shuffle(S.guestDiscard.map(g => makeGuest(GUESTS[g.id])));
    S.guestDiscard = [];
  }
  return S.guestDeck.pop() || null;
}

function drawStaffCards(n) {
  const out = [];
  for (let i = 0; i < n && S.staffDeck.length; i++) out.push(S.staffDeck.pop());
  return out;
}

// ---------- decisions ----------
// prompt: { tag, title, text, kind: 'options'|'cells', options, cells, allowSkip, skipLabel, meta }
async function choose(p, prompt) {
  if (p.isBot) {
    await sleep(Hooks.botDelay * 0.5);
    return Bot.decide(p, prompt);
  }
  return new Promise(resolve => {
    S.prompt = { ...prompt, pi: p.idx, resolve };
    Hooks.render();
  });
}

function answerPrompt(value) {
  const pr = S.prompt;
  if (!pr) return;
  S.prompt = null;
  pr.resolve(value);
  Hooks.render();
}

function waitCmd() {
  return new Promise(resolve => {
    S.awaitCmd = resolve;
    Hooks.render();
  });
}

function sendCmd(cmd) {
  const r = S.awaitCmd;
  if (!r) return;
  S.awaitCmd = null;
  r(cmd);
}

// ---------- resources ----------
function addMoney(p, n) {
  p.money = Math.max(0, Math.min(MONEY_MAX, p.money + n));
}
function addVP(p, n) {
  p.vp += n;
}
function addEmp(p, n) {
  const t = p.emp + n;
  if (t > EMP_MAX) {
    addVP(p, t - EMP_MAX);
    p.emp = EMP_MAX;
  } else p.emp = Math.max(0, t);
}

// Received dishes/drinks go straight onto guest orders where they fit,
// the rest goes to the kitchen.
function gainCubes(p, list) {
  for (const cube of list) {
    if (!placeOnGuest(p, cube)) p.kitchen[cube]++;
  }
}

function placeOnGuest(p, cube) {
  let best = null, bestMissing = 99;
  for (const g of p.cafe) {
    if (!g) continue;
    const i = g.order.findIndex((x, j) => x === cube && !g.filled[j]);
    if (i < 0) continue;
    const m = missing(g).length;
    if (m < bestMissing) { best = [g, i]; bestMissing = m; }
  }
  if (!best) return false;
  const [g, i] = best;
  g.filled[i] = true;
  if (isComplete(g)) onGuestComplete(p, g);
  return true;
}

function onGuestComplete(p, g) {
  log(`${g.name}'s order is complete`, p.idx);
  if (g.color === 'R' && hasStaff(p, 5)) addMoney(p, 2);
  if (g.color === 'B' && hasStaff(p, 6)) addEmp(p, 1);
}

function kitchenUseful(p) {
  return p.cafe.some(g => g && missing(g).some(c => p.kitchen[c] > 0));
}

function serveFromKitchen(p) {
  const free = hasStaff(p, 24);
  if (!kitchenUseful(p)) return false;
  if (!free && p.money < 1) return false;
  if (!free) addMoney(p, -1);
  let moved = 0;
  const limit = free ? 99 : 3;
  let progress = true;
  while (moved < limit && progress) {
    progress = false;
    for (const c of CUBES) {
      if (moved >= limit) break;
      if (p.kitchen[c] > 0 && placeOnGuest(p, c)) {
        p.kitchen[c]--;
        moved++;
        progress = true;
      }
    }
  }
  log(`${p.name} serves ${moved} item${moved === 1 ? '' : 's'} from the kitchen`, p.idx);
  return true;
}

// ---------- rooms ----------
function canPlace(p, r, c) {
  if (p.rooms[r][c]) return false;
  if (!countRooms(p)) return r === 0 && c === 0;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => {
    const nr = r + dr, nc = c + dc;
    return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && p.rooms[nr][nc];
  });
}

function roomCost(p, r, c, mode) {
  if (mode === 'free' || mode === 'free12') return 0;
  const color = LAYOUT[r][c];
  if ((color === 'B' && hasStaff(p, 9)) || (color === 'R' && hasStaff(p, 10)) || (color === 'Y' && hasStaff(p, 11))) return 0;
  return Math.max(0, ROW_COST[r] - (mode === 'm1' ? 1 : 0));
}

function placeableCells(p, mode, rows) {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    if (rows && !rows.includes(r)) continue;
    for (let c = 0; c < COLS; c++) {
      if (!canPlace(p, r, c)) continue;
      const cost = roomCost(p, r, c, mode);
      if (cost <= p.money) out.push({ r, c, cost });
    }
  }
  return out;
}

async function prepareRoom(p, mode = 'pay', opt = {}) {
  const rows = mode === 'free12' ? [0, 1] : opt.rows;
  const cells = placeableCells(p, mode, rows);
  if (!cells.length) {
    if (!p.isBot) Hooks.toast('No room can be prepared right now');
    return false;
  }
  const cell = await choose(p, {
    tag: 'room', kind: 'cells', cells,
    title: opt.title || 'Prepare a room',
    text: opt.occupied ? 'The room is placed already occupied.' : 'Tap a highlighted space. Rooms must touch your existing rooms.',
    allowSkip: opt.forced ? false : true, skipLabel: opt.skipLabel || 'Done',
    meta: { mode, occupied: opt.occupied },
  });
  if (!cell) return false;
  const { r, c } = cell;
  const cost = roomCost(p, r, c, mode);
  addMoney(p, -cost);
  p.rooms[r][c] = opt.occupied ? 'occ' : 'free';
  const door = DOOR_VP[key(r, c)] || 0;
  if (door) addVP(p, door);
  log(`${p.name} prepares a ${COLORS[LAYOUT[r][c]].name.toLowerCase()} room on floor ${r + 1}${cost ? ` (${cost}💰)` : ''}${door ? ` +${door}⭐` : ''}`, p.idx);
  if (opt.occupied) checkGroup(p, r, c);
  return true;
}

function freeRoomsFor(p, color) {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (p.rooms[r][c] !== 'free') continue;
    if (color === 'G' || color === 'any' || LAYOUT[r][c] === color) out.push({ r, c });
  }
  return out;
}

function checkGroup(p, r, c) {
  const g = GROUP_OF[key(r, c)];
  if (p.claimedGroups[g] || !groupFull(p, g)) return;
  p.claimedGroups[g] = true;
  const { color, cells } = GROUPS[g];
  const n = GROUP_BONUS[color][cells.length];
  if (color === 'B') addVP(p, n);
  if (color === 'R') addMoney(p, n);
  if (color === 'Y') addEmp(p, n);
  const what = color === 'B' ? '⭐' : color === 'R' ? '💰' : '👑';
  log(`${p.name} fills a ${COLORS[color].name.toLowerCase()} group: +${n}${what}`, p.idx);
}

function removeRoom(p, r, c) {
  p.rooms[r][c] = null;
  delete p.claimedGroups[GROUP_OF[key(r, c)]];
}

async function turnRoom(p, color) {
  const cells = freeRoomsFor(p, color);
  if (!cells.length) {
    if (!p.isBot) Hooks.toast('No matching free room to turn');
    return false;
  }
  const cell = await choose(p, {
    tag: 'turn', kind: 'cells', cells,
    title: `Turn a ${color === 'any' ? '' : COLORS[color].name.toLowerCase() + ' '}room to occupied`,
    allowSkip: true, skipLabel: 'Skip',
  });
  if (!cell) return false;
  p.rooms[cell.r][cell.c] = 'occ';
  log(`${p.name} marks a room occupied`, p.idx);
  checkGroup(p, cell.r, cell.c);
  return true;
}

// ---------- guests ----------
function guestCost(p, slot) {
  return hasStaff(p, 25) ? 0 : GUEST_COST[slot];
}

function takeGuest(p, slot, free) {
  const g = S.display[slot];
  const ci = cafeFree(p);
  if (!g || ci < 0) return false;
  const cost = free ? 0 : guestCost(p, slot);
  if (cost > p.money) return false;
  addMoney(p, -cost);
  p.cafe[ci] = g;
  S.display.splice(slot, 1);
  S.display.unshift(drawGuest());
  log(`${p.name} invites ${g.name}${cost ? ` (${cost}💰)` : ''}`, p.idx);
  return true;
}

async function takeFreeGuest(p, title = 'Take a guest for free') {
  if (cafeFree(p) < 0) return false;
  const options = S.display.map((g, i) => ({ label: g ? g.name : '—', value: i, guest: g, disabled: !g }));
  const slot = await choose(p, { tag: 'guest', title, options, allowSkip: true, skipLabel: 'Skip', meta: { free: true } });
  if (slot === null || slot === undefined) return false;
  return takeGuest(p, slot, true);
}

async function checkIn(p, idx) {
  const g = p.cafe[idx];
  if (!g || !isComplete(g)) return false;
  const cells = freeRoomsFor(p, g.color);
  if (!cells.length) {
    if (!p.isBot) Hooks.toast(`No free ${g.color === 'G' ? '' : COLORS[g.color].name.toLowerCase() + ' '}room for ${g.name}`);
    return false;
  }
  const cell = await choose(p, {
    tag: 'checkin', kind: 'cells', cells,
    title: `Move ${g.name} into a room`, text: `+${g.vp}⭐ and the guest's reward`,
    allowSkip: true, skipLabel: 'Cancel', meta: { guest: g },
  });
  if (!cell) return false;
  p.cafe[idx] = null;
  p.rooms[cell.r][cell.c] = 'occ';
  addVP(p, g.vp);
  if (hasStaff(p, 23)) addMoney(p, 1);
  if (g.color === 'Y' && hasStaff(p, 7)) addMoney(p, 1);
  if (g.color === 'G' && hasStaff(p, 8)) addVP(p, 2);
  if (g.order.length === 4 && hasStaff(p, 33)) addVP(p, 4);
  log(`${p.name} checks ${g.name} into a room: +${g.vp}⭐`, p.idx);
  checkGroup(p, cell.r, cell.c);
  S.guestDiscard.push(g);
  for (const rw of g.rewards) await doReward(p, rw);
  return true;
}

async function doReward(p, rw) {
  switch (rw.t) {
    case 'k': addMoney(p, rw.n); log(`${p.name} +${rw.n}💰`, p.idx); break;
    case 'e': addEmp(p, rw.n); log(`${p.name} +${rw.n}👑`, p.idx); break;
    case 'v': addVP(p, rw.n); break;
    case 'c': {
      let cube = rw.c;
      if (cube === 'any') cube = await chooseCube(p, 'Take a dish or drink');
      gainCubes(p, [cube]);
      log(`${p.name} gets 1 ${CUBE_INFO[cube].plural}`, p.idx);
      break;
    }
    case 'g': await takeFreeGuest(p); break;
    case 'r': await prepareRoom(p, rw.mode, { title: 'Reward: ' + roomModeText(rw.mode) }); break;
    case 't': await turnRoom(p, rw.c); break;
    case 's': await hireStaff(p, rw.n, { title: rw.n >= 99 ? 'Hire a staff card for free' : `Hire a staff card (-${rw.n}💰)` }); break;
    case 'd': drawStaff(p, rw.n); break;
    case 'x': await draw3(p, rw.n); break;
    case 'a': p.extraTurn = true; log(`${p.name} will get another turn`, p.idx); break;
  }
}

function roomModeText(mode) {
  return { pay: 'prepare a room', m1: 'prepare a room (-1💰)', free: 'prepare a room for free', free12: 'free room on floor 1-2' }[mode];
}

async function chooseCube(p, title) {
  return choose(p, {
    tag: 'cube', title,
    options: CUBES.map(c => ({ label: CUBE_INFO[c].name, value: c, cube: c })),
  });
}

// ---------- staff ----------
function drawStaff(p, n) {
  const got = drawStaffCards(n);
  p.hand.push(...got);
  log(`${p.name} draws ${got.length} staff card${got.length === 1 ? '' : 's'}`, p.idx);
}

async function hireStaff(p, discount, opt = {}) {
  const pool = opt.cards || p.hand;
  if (!pool.length) {
    if (!p.isBot) Hooks.toast('No staff cards in hand');
    return null;
  }
  const options = pool.map((card, i) => {
    const cost = Math.max(0, card.cost - discount);
    return { label: card.name, value: i, card, cost, disabled: cost > p.money };
  });
  const i = await choose(p, {
    tag: 'staff', title: opt.title || 'Hire a staff card', text: opt.text,
    options, allowSkip: true, skipLabel: opt.skipLabel || 'Skip', meta: { discount },
  });
  if (i === null || i === undefined) return null;
  const card = pool[i];
  const cost = Math.max(0, card.cost - discount);
  pool.splice(i, 1);
  addMoney(p, -cost);
  await hire(p, card, cost);
  return card;
}

async function hire(p, card, cost) {
  p.staff.push({ card, tapped: false });
  log(`${p.name} hires ${card.name}${cost ? ` (${cost}💰)` : ''}`, p.idx);
  switch (card.id) {
    case 21: gainCubes(p, ['s', 'c', 'w', 'k']); break;
    case 35: await turnRoom(p, 'any'); await turnRoom(p, 'any'); break;
    case 36: gainCubes(p, ['w', 'w', 'w', 'w']); break;
    case 39: gainCubes(p, ['c', 'c', 'c', 'c']); break;
    case 43: gainCubes(p, ['k', 'k', 'k', 'k']); break;
    case 44: gainCubes(p, ['s', 's', 's', 's']); break;
    case 45: addEmp(p, 3); break;
    case 38: {
      const options = p.cafe.map((g, i) => ({ label: g ? g.name : '—', value: i, guest: g, disabled: !g || isComplete(g) }));
      if (options.some(o => !o.disabled)) {
        const i = await choose(p, { tag: 'porter', title: 'Porter: complete a guest’s order', options });
        if (i !== null && i !== undefined) {
          const g = p.cafe[i];
          g.filled = g.filled.map(() => true);
          onGuestComplete(p, g);
        }
      }
      break;
    }
  }
}

async function draw3(p, discount) {
  const cards = drawStaffCards(3);
  if (!cards.length) return;
  await hireStaff(p, discount, {
    cards, title: discount >= 99 ? 'Pick one staff card to hire for free' : `Pick one staff card to hire (-${discount}💰)`,
    skipLabel: 'Hire none',
  });
  S.staffDeck.unshift(...cards);
}

const OPR_CUBE = { 1: 's', 2: 'c', 3: 'w', 4: 'k' };
function useOpr(p, i) {
  const e = p.staff[i];
  if (!e || e.tapped || e.card.type !== 'opr') return false;
  e.tapped = true;
  const cube = OPR_CUBE[e.card.id];
  gainCubes(p, [cube]);
  log(`${p.name}'s ${e.card.name} brings 1 ${CUBE_INFO[cube].plural}`, p.idx);
  return true;
}

// ---------- politics ----------
function claimablePolitics(p) {
  return S.politics.map((pc, i) => i).filter(i => {
    const pc = S.politics[i];
    return !pc.claims.includes(p.idx) && pc.def.check(p);
  });
}

function claimPolitics(p, i) {
  const pc = S.politics[i];
  if (pc.claims.includes(p.idx) || !pc.def.check(p)) return false;
  const vp = pc.def.vps[pc.claims.length] || 0;
  pc.claims.push(p.idx);
  p.politics.push(pc.def.id);
  addVP(p, vp);
  log(`${p.name} fulfils politics "${pc.def.text}": +${vp}⭐`, p.idx);
  return true;
}

// ---------- actions ----------
function canUseSpace(p, space) {
  if (!S.dice[space - 1]) return false;
  if (space === 6 && !hasStaff(p, 17) && p.money < 1) return false;
  return true;
}

function actionStrengths(p, space) {
  const n = S.dice[space - 1];
  const kh = space === 6 && hasStaff(p, 17);
  const base = space === 6 ? n + (kh ? 1 : 0) : n;
  const subs = space === 6 ? [1, 2, 3, 4, 5] : [space];
  return subs.map(sub => ({ sub, str: base + ((space === 1 || space === 2) && hasStaff(p, 13) ? 1 : 0) }));
}

async function doAction(p, space) {
  const t = S.turn;
  if (t.dieTaken || !canUseSpace(p, space)) return false;
  const fee = space === 6 && !hasStaff(p, 17) ? 1 : 0;
  const options = [];
  for (const { sub, str } of actionStrengths(p, space)) {
    options.push({ label: `${ACTION_NAMES[sub]} ×${str}`, value: { sub, str, boost: false }, sub, str });
    if (!t.boost) {
      options.push({
        label: `${ACTION_NAMES[sub]} ×${str + 1}`, sub, str: str + 1, boost: true,
        value: { sub, str: str + 1, boost: true }, disabled: p.money < fee + 1,
      });
    }
  }
  const choice = await choose(p, {
    tag: 'strength', title: `Take a ${space}`,
    text: space === 6 ? `Pay ${fee}💰 and use any action at the strength of the 6s.` : 'Strength = dice on this space. You may pay 1💰 once per turn for +1.',
    options, allowSkip: true, skipLabel: 'Cancel', meta: { space },
  });
  if (!choice) return false;
  addMoney(p, -(fee + (choice.boost ? 1 : 0)));
  if (choice.boost) t.boost = true;
  if (!t.extra) S.dice[space - 1]--;
  t.dieTaken = true;
  log(`${p.name} takes a ${space}: ${ACTION_NAMES[choice.sub]} ×${choice.str}`, p.idx);
  await performAction(p, choice.sub, choice.str, space);
  await dieTriggers(p, space);
  return true;
}

async function performAction(p, sub, n, space) {
  if (sub === 1 || sub === 2) {
    const [a, b] = sub === 1 ? ['s', 'c'] : ['w', 'k'];
    const options = [];
    for (let x = n; x >= Math.ceil(n / 2); x--) {
      options.push({ label: `${x} ${CUBE_INFO[a].plural}${n - x ? ` + ${n - x} ${CUBE_INFO[b].plural}` : ''}`, value: x, a: x, b: n - x });
    }
    const x = await choose(p, {
      tag: 'cubes', title: `Take ${n} ${sub === 1 ? 'dishes' : 'drinks'}`,
      text: `You can't take more ${CUBE_INFO[b].plural} than ${CUBE_INFO[a].plural}.`,
      options, meta: { a, b, n },
    });
    gainCubes(p, Array(x).fill(a).concat(Array(n - x).fill(b)));
  } else if (sub === 3) {
    for (let i = 0; i < n; i++) {
      const ok = await prepareRoom(p, 'pay', { title: `Prepare rooms (${i + 1} of ${n})` });
      if (!ok) break;
    }
  } else if (sub === 4) {
    if (space === 4 && hasStaff(p, 15)) {
      addEmp(p, n); addMoney(p, n);
      log(`${p.name} +${n}👑 and +${n}💰`, p.idx);
    } else {
      const options = [];
      for (let e = n; e >= 0; e--) options.push({ label: `${e}👑 Emperor + ${n - e}💰 Krone`, value: e });
      const e = await choose(p, { tag: 'split4', title: `Advance ${n} steps`, options, meta: { n } });
      addEmp(p, e); addMoney(p, n - e);
      log(`${p.name} +${e}👑 +${n - e}💰`, p.idx);
    }
  } else if (sub === 5) {
    const discount = n + (space === 5 && hasStaff(p, 18) ? 2 : 0);
    await hireStaff(p, discount, { title: `Hire a staff card (-${discount}💰)` });
  }
}

async function dieTriggers(p, face) {
  if ((face === 1 || face === 2) && hasStaff(p, 14)) await prepareRoom(p, 'pay', { title: 'Decorator: prepare 1 room', skipLabel: 'Skip' });
  if ((face === 3 || face === 4) && hasStaff(p, 12)) addVP(p, 2);
  if (face === 3 && hasStaff(p, 19)) addVP(p, 5);
  if (face === 4 && hasStaff(p, 16)) addVP(p, 4);
  if (face === 5 && hasStaff(p, 20)) addEmp(p, 2);
  if (face === 3 && hasStaff(p, 22)) await hireStaff(p, 0, { title: 'Staff Manager: hire a staff card' });
}

// ---------- turns ----------
async function takeTurn(pi, extra = false) {
  const p = S.players[pi];
  S.current = pi;
  S.turn = { pi, guestTaken: false, dieTaken: false, boost: false, extra, passed: false };
  Hooks.render();
  if (p.isBot) await Bot.turn(p);
  else await humanTurn(p);
  const passed = S.turn.passed;
  S.turn = null;
  Hooks.render();
  return passed ? 'pass' : 'done';
}

async function humanTurn(p) {
  const t = S.turn;
  for (;;) {
    const cmd = await waitCmd();
    switch (cmd.t) {
      case 'guest': {
        if (t.guestTaken || t.dieTaken) break;
        const g = S.display[cmd.slot];
        if (!g) break;
        if (cafeFree(p) < 0) { Hooks.toast('Your café is full'); break; }
        const cost = guestCost(p, cmd.slot);
        const ok = await choose(p, {
          tag: 'confirmGuest', title: `Invite ${g.name}?`,
          options: [{ label: cost ? `Invite for ${cost}💰` : 'Invite for free', value: true, disabled: cost > p.money }],
          allowSkip: true, skipLabel: 'Cancel', meta: { guest: g },
        });
        if (ok && takeGuest(p, cmd.slot)) t.guestTaken = true;
        break;
      }
      case 'action': await doAction(p, cmd.space); break;
      case 'checkin': await checkIn(p, cmd.idx); break;
      case 'serve':
        if (!serveFromKitchen(p)) Hooks.toast(p.money < 1 ? 'Serving costs 1💰' : 'Nothing in the kitchen your guests need');
        break;
      case 'politics': claimPolitics(p, cmd.idx); break;
      case 'opr': useOpr(p, cmd.idx); break;
      case 'pass':
        if (!t.dieTaken && !t.extra) { t.passed = true; log(`${p.name} pass${p.name === 'You' ? '' : 'es'}`, p.idx); return; }
        break;
      case 'end':
        if (t.dieTaken || t.extra) return;
        break;
    }
  }
}

const totalDice = () => S.dice.reduce((a, b) => a + b, 0);

function rollDice(n) {
  S.dice = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) S.dice[rnd(6)]++;
}

async function playRound() {
  const order = playerOrder();
  S.slots = [...order, ...order.slice().reverse()];
  S.covered = S.slots.map(() => false);
  for (const p of S.players) for (const e of p.staff) e.tapped = false;
  rollDice(S.diceCount);
  log(`— Round ${S.round}: ${S.players[order[0]].name} rolls the dice —`);
  const waiting = new Set();
  for (;;) {
    if (!totalDice()) break;
    const next = S.slots.findIndex((pi, i) => !S.covered[i] && !waiting.has(pi));
    if (next >= 0) {
      const pi = S.slots[next];
      const res = await takeTurn(pi);
      if (res === 'pass') waiting.add(pi);
      else {
        S.covered[next] = true;
        const p = S.players[pi];
        while (p.extraTurn) {
          p.extraTurn = false;
          await takeTurn(pi, true);
        }
      }
      await sleep(Hooks.botDelay * 0.3);
      continue;
    }
    const first = S.covered.indexOf(false);
    if (first < 0) break;
    const roller = S.players[S.slots[first]];
    const left = totalDice() - 1;
    rollDice(left);
    waiting.clear();
    log(`${roller.name} re-rolls the remaining dice (${left} left)`, roller.idx);
    await sleep(Hooks.botDelay);
  }
}

async function emperorScoring() {
  const back = EMP_SCORING[S.round];
  const idx = { 3: 0, 5: 1, 7: 2 }[S.round];
  const tile = S.emperor[idx];
  log(`— Emperor scoring (tile ${tile.id}) —`);
  for (const pi of playerOrder()) {
    const p = S.players[pi];
    const gained = EMP_VP[p.emp];
    addVP(p, gained);
    p.emp = Math.max(0, p.emp - back);
    log(`${p.name} scores ${gained}⭐ for the Emperor and moves back to ${p.emp}`, pi);
    if (p.emp >= 3) {
      log(`${p.name} earns the Emperor bonus: ${tile.bonus}`, pi);
      if (hasStaff(p, 42)) addVP(p, 5);
      await emperorBonus(p, tile.id);
    } else if (p.emp === 0) {
      if (hasStaff(p, 26) && p.money >= 1) {
        const pay = await choose(p, {
          tag: 'confManager', title: 'Conference Manager',
          text: `Pay 1💰 to avoid the penalty: ${tile.penalty}`,
          options: [{ label: 'Pay 1💰', value: true }, { label: 'Take the penalty', value: false }],
        });
        if (pay) { addMoney(p, -1); log(`${p.name} pays to avoid the penalty`, pi); continue; }
      }
      log(`${p.name} suffers the Emperor penalty: ${tile.penalty}`, pi);
      await emperorPenalty(p, tile.id);
    }
    await sleep(Hooks.botDelay * 0.5);
  }
}

async function emperorBonus(p, id) {
  switch (id) {
    case 'A1': addMoney(p, 3); break;
    case 'A2': await draw3(p, 3); break;
    case 'A3': for (let i = 0; i < 2; i++) gainCubes(p, [await chooseCube(p, `Emperor bonus: take a dish or drink (${i + 1}/2)`)]); break;
    case 'A4': await prepareRoom(p, 'free', { title: 'Emperor bonus: free room' }); break;
    case 'B1': gainCubes(p, ['s', 'c', 'w', 'k']); break;
    case 'B2': await draw3(p, 99); break;
    case 'B3': addMoney(p, 5); break;
    case 'B4': await prepareRoom(p, 'free12', { title: 'Emperor bonus: occupied room (floor 1-2)', occupied: true }); break;
    case 'C1': addVP(p, 8); break;
    case 'C2': addVP(p, 2 * p.staff.length); break;
    case 'C3': await prepareRoom(p, 'free', { title: 'Emperor bonus: occupied room', occupied: true }); break;
    case 'C4': await hireStaff(p, 99, { title: 'Emperor bonus: hire a staff card for free' }); break;
  }
}

async function choosePenalty(p, a, aOk, b) {
  if (!aOk) return false;
  return choose(p, {
    tag: 'penalty', title: 'Emperor penalty',
    options: [{ label: a, value: true }, { label: b, value: false }],
  });
}

async function returnStaff(p, n) {
  for (let k = 0; k < n; k++) {
    const i = await choose(p, {
      tag: 'discardHand', title: `Return a staff card (${k + 1}/${n})`,
      options: p.hand.map((card, j) => ({ label: card.name, value: j, card })),
    });
    S.staffDeck.unshift(p.hand.splice(i, 1)[0]);
  }
}

function highestRooms(p, state) {
  for (let r = ROWS - 1; r >= 0; r--) {
    const cells = [];
    for (let c = 0; c < COLS; c++) if (p.rooms[r][c] === state) cells.push({ r, c });
    if (cells.length) return cells;
  }
  return [];
}

async function removeHighest(p, state, title, column) {
  let cells = highestRooms(p, state);
  if (column !== undefined) {
    cells = [];
    for (let r = ROWS - 1; r >= 0 && !cells.length; r--) if (p.rooms[r][column] === state) cells.push({ r, c: column });
  }
  if (!cells.length) return null;
  const cell = cells.length === 1 ? cells[0] : await choose(p, { tag: 'removeRoom', kind: 'cells', cells, title });
  removeRoom(p, cell.r, cell.c);
  log(`${p.name} loses a room on floor ${cell.r + 1}`, p.idx);
  return cell;
}

async function emperorPenalty(p, id) {
  switch (id) {
    case 'A1': if (await choosePenalty(p, 'Lose 3💰', p.money >= 3, 'Lose 5⭐')) addMoney(p, -3); else addVP(p, -5); break;
    case 'A2': if (await choosePenalty(p, 'Return 2 staff cards', p.hand.length >= 2, 'Lose 5⭐')) await returnStaff(p, 2); else addVP(p, -5); break;
    case 'A3': CUBES.forEach(c => { p.kitchen[c] = 0; }); break;
    case 'A4':
      if (await choosePenalty(p, 'Remove highest unoccupied room', highestRooms(p, 'free').length > 0, 'Lose 5⭐')) await removeHighest(p, 'free', 'Remove an unoccupied room');
      else addVP(p, -5);
      break;
    case 'B1':
      CUBES.forEach(c => { p.kitchen[c] = 0; });
      p.cafe.forEach(g => { if (g) g.filled = g.filled.map(() => false); });
      break;
    case 'B2': if (await choosePenalty(p, 'Return 3 staff cards', p.hand.length >= 3, 'Lose 7⭐')) await returnStaff(p, 3); else addVP(p, -7); break;
    case 'B3': if (await choosePenalty(p, 'Lose 5💰', p.money >= 5, 'Lose 7⭐')) addMoney(p, -5); else addVP(p, -7); break;
    case 'B4':
      if (await choosePenalty(p, 'Lose 2 highest occupied rooms', countOcc(p) >= 2, 'Lose 7⭐')) {
        await removeHighest(p, 'occ', 'Remove an occupied room');
        await removeHighest(p, 'occ', 'Remove an occupied room');
      } else addVP(p, -7);
      break;
    case 'C1': addVP(p, -8); break;
    case 'C2': addVP(p, -2 * p.staff.length); break;
    case 'C3': {
      const cell = await removeHighest(p, 'occ', 'Remove your highest occupied room');
      if (cell) await removeHighest(p, 'occ', '', cell.c);
      break;
    }
    case 'C4': {
      const ends = p.staff.map((e, i) => ({ e, i })).filter(x => x.e.card.type === 'end');
      if (await choosePenalty(p, 'Discard a game-end staff', ends.length > 0, 'Lose 10⭐')) {
        const i = await choose(p, {
          tag: 'discardEnd', title: 'Discard a game-end staff card',
          options: ends.map(x => ({ label: x.e.card.name, value: x.i, card: x.e.card })),
        });
        p.staff.splice(i, 1);
      } else addVP(p, -10);
      break;
    }
  }
}

// ---------- final scoring ----------
function endStaffVP(p, id, forPlayer = p) {
  const q = forPlayer;
  switch (id) {
    case 27: return 3 * occOfColor(q, 'R');
    case 28: return 3 * occOfColor(q, 'B');
    case 30: return 3 * occOfColor(q, 'Y');
    case 31: return countOcc(q);
    case 32: return 2 * q.staff.length;
    case 34: return countRooms(q);
    case 37: return 2 * fullGroups(q);
    case 40: return 5 * q.politics.length;
    case 41: return 2 * EMP_VP[q.emp];
    case 46: return 5 * fullRows(q);
    case 47: return 5 * fullCols(q);
    case 48: return 4 * Math.min(occOfColor(q, 'R'), occOfColor(q, 'Y'), occOfColor(q, 'B'));
    case 29: {
      let best = 0;
      for (const o of S.players) {
        if (o === q) continue;
        for (const e of o.staff) if (e.card.type === 'end' && e.card.id !== 29) best = Math.max(best, endStaffVP(q, e.card.id, q));
      }
      return best;
    }
  }
  return 0;
}

function finalScore(p) {
  const staff = p.staff.filter(e => e.card.type === 'end').reduce((n, e) => n + endStaffVP(p, e.card.id), 0);
  let rooms = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (p.rooms[r][c] === 'occ') rooms += r + 1;
  const money = p.money;
  const cubes = kitchenTotal(p);
  const cafe = -5 * p.cafe.filter(Boolean).length;
  return { before: p.vp, staff, rooms, money, cubes, cafe, total: p.vp + staff + rooms + money + cubes + cafe };
}

async function runGame() {
  const n = S.players.length;
  // Setup: guests are picked from the last player backwards, then everyone prepares up to 3 rooms.
  const order = playerOrder();
  for (const pi of order.slice().reverse()) {
    const p = S.players[pi];
    S.current = pi;
    await takeFreeGuest(p, 'Setup: choose your first guest');
  }
  for (const pi of order) {
    const p = S.players[pi];
    S.current = pi;
    for (let i = 0; i < 3; i++) {
      const ok = await prepareRoom(p, 'pay', { title: `Setup: prepare up to 3 rooms (${i + 1}/3)`, skipLabel: 'Done' });
      if (!ok) break;
    }
  }
  S.phase = 'play';
  for (S.round = 1; S.round <= 7; S.round++) {
    S.start = (S.round - 1) % n;
    await playRound();
    if (EMP_SCORING[S.round]) await emperorScoring();
  }
  S.round = 7;
  S.results = S.players.map(p => ({ p, ...finalScore(p) }))
    .sort((a, b) => b.total - a.total || (b.money + b.cubes) - (a.money + a.cubes));
  S.phase = 'over';
  S.current = null;
  log('— Game over —');
  Hooks.render();
  return S.results;
}

if (typeof module !== 'undefined') {
  module.exports = { newGame, runGame, Hooks, getState: () => S };
}
