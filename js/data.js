// Static game data for Grand Hotel.
// Rules follow the Grand Austria Hotel rulebook; guest orders/VP and a few board
// numbers are approximations where the reference material did not list them.

const CUBES = ['s', 'c', 'w', 'k'];
const CUBE_INFO = {
  s: { name: 'Strudel', plural: 'strudel', css: '#9a6233' },
  c: { name: 'Cake', plural: 'cake', css: '#f6f1e7' },
  w: { name: 'Wine', plural: 'wine', css: '#b3202e' },
  k: { name: 'Coffee', plural: 'coffee', css: '#2a2220' },
};

const COLORS = {
  R: { name: 'Red', guest: 'Citizen', css: '#c8463d' },
  Y: { name: 'Yellow', guest: 'Artist', css: '#e0b42f' },
  B: { name: 'Blue', guest: 'Noble', css: '#3f7fc4' },
  G: { name: 'Green', guest: 'Tourist', css: '#4e9a51' },
};

// Hotel board (front side). Row 0 is the ground floor, row 3 the top floor.
const LAYOUT = ['BYRRB', 'YYRRY', 'BRBYY', 'BRBRB'];
const ROWS = 4;
const COLS = 5;
const ROW_COST = [0, 1, 2, 3];
// Rooms in the top-right part of the hotel give VP when prepared.
const DOOR_VP = { '2,3': 1, '2,4': 1, '3,2': 2, '3,3': 2, '3,4': 2 };
// Occupancy bonus by group size: blue = VP, red = krone, yellow = emperor steps.
const GROUP_BONUS = { B: [0, 2, 5, 8, 11], R: [0, 2, 4, 6, 8], Y: [0, 1, 2, 3, 4] };
// VP for each Emperor track space 0..13.
const EMP_VP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18];
const EMP_MAX = 13;
const EMP_SCORING = { 3: 3, 5: 5, 7: 7 }; // round -> steps moved back
// Cost of each guest slot on the game board, left (newest) to right (oldest).
const GUEST_COST = [3, 2, 1, 0, 0];
const MONEY_MAX = 20;
const DICE_FOR_PLAYERS = { 2: 10, 3: 12, 4: 14 };

const ACTION_NAMES = {
  1: 'Strudel / Cake',
  2: 'Wine / Coffee',
  3: 'Prepare rooms',
  4: 'Emperor / Krone',
  5: 'Hire staff',
  6: 'Any action',
};

// Guest rewards are written as short tokens:
//  k3 krone, e2 emperor steps, v2 VP, c:w cube of a colour (c:any = choice),
//  g free guest, r room (pay), r1 room (-1), r0 room free, r12 free room on floor 1-2,
//  t:R turn a room occupied (t:any), s3 hire staff at -3 (s99 = free),
//  d2 draw staff, x3 draw 3 hire one at -3 (x99 = free), a another turn.
const GUEST_DEFS = [
  // Citizens (red)
  ['Amtsrat', 'R', 'wk', 3, 'g'],
  ['Geheimrat', 'R', 'ss', 4, 'k1 e1'],
  ['General', 'R', 'kwc', 4, 'c:w k3'],
  ['Generalprokurator', 'R', 'wwkc', 3, 'r0 r0'],
  ['Hofrat', 'R', 'wkcs', 3, 'k3 g'],
  ['Kommerzialrat', 'R', 'kks', 3, 'k5'],
  ['Magister', 'R', 'ws', 5, 'k1'],
  ['Major', 'R', 'wwk', 4, 'k3'],
  ['Ministerialrat', 'R', 'kcs', 4, 'c:k k3'],
  ['Oberkommissär', 'R', 'wks', 5, 'k4'],
  ['Obermedizinalrat', 'R', 'wwcs', 4, 'k3 g'],
  ['Oberrat', 'R', 'kc', 2, 't:R'],
  ['Professor', 'R', 'ccs', 5, 'g'],
  ['Veterinärrat', 'R', 'ws', 3, 's3'],
  // Tourists (green)
  ['Bauer Franz', 'G', 'wwkk', 4, 't:any e3'],
  ['Bruder Uwe', 'G', 'kcss', 3, 'g e3'],
  ['Cramersopholus', 'G', 'wcs', 4, 'd1 e2'],
  ['Durgoing', 'G', 'kc', 3, 'd2'],
  ['E. Gizia', 'G', 'wkcs', 3, 'a'],
  ['Herr Horsa', 'G', 'ss', 4, 'e1'],
  ['Herr Oundo', 'G', 'wkc', 3, 's3'],
  ['Kondukteur', 'G', 'kks', 4, 't:Y e1'],
  ['Kpt. Goldhaken', 'G', 'wc', 5, 'k1'],
  ['M. Polo', 'G', 'wks', 4, 'k4'],
  ['MacLeod', 'G', 'wwkc', 3, 's99'],
  ['Michael Ingalls', 'G', 'ks', 4, 's1'],
  ['Mr. Boydell', 'G', 'wcc', 5, 'e2'],
  ['Tezcatlipoca', 'G', 'wkss', 4, 'd3'],
  // Nobles (blue)
  ['Baroness', 'B', 'wkc', 5, 'g'],
  ['Baronin', 'B', 'wwkc', 5, 'x3'],
  ['Freiherr', 'B', 'wc', 4, 'r0'],
  ['Fürst', 'B', 'kkcs', 5, 'd2 e2'],
  ['Graf', 'B', 'wkss', 4, 's1 s1'],
  ['Gräfin', 'B', 'cs', 5, 'k3'],
  ['Herzog', 'B', 'wkcc', 4, 'x99'],
  ['Herzogin', 'B', 'kc', 5, 's1'],
  ['Kurfürst', 'B', 'wkcs', 5, 's1 k3'],
  ['Landgraf', 'B', 'wws', 4, 's1 r'],
  ['Prinz', 'B', 'kks', 5, 't:B'],
  ['Prinzessin', 'B', 'wcs', 6, 'e3'],
  ['Reichsgraf', 'B', 'ks', 6, 'k1'],
  ['Reichsritter', 'B', 'wc', 3, ''],
  // Artists (yellow)
  ['Architekt', 'Y', 'wkcs', 3, 'r1 r1'],
  ['Bildhauer', 'Y', 'wc', 1, 'r12'],
  ['Burgschauspielerin', 'Y', 'kc', 3, 't:any'],
  ['Dichter', 'Y', 'wks', 3, 'c:c s2'],
  ['Fotograf', 'Y', 'ks', 4, 'd2'],
  ['Kammersängerin', 'Y', 'wwkc', 3, 'c:w s3'],
  ['Komponist', 'Y', 'cs', 4, 'c:s'],
  ['Maler', 'Y', 'wkcs', 4, 'r1 r'],
  ['Musiker', 'Y', 'wkc', 3, 'r d1'],
  ['Opernsängerin', 'Y', 'wwcs', 4, 'g e3'],
  ['Portraitmaler', 'Y', 'kcs', 3, 'c:any k2'],
  ['Schmuckdesigner', 'Y', 'wcs', 3, 'c:k k3'],
  ['Schneider', 'Y', 'kks', 4, 'c:c k2'],
  ['Tänzerin', 'Y', 'wcs', 3, 'c:w e2'],
];

function parseReward(tok) {
  if (tok === 'g') return { t: 'g' };
  if (tok === 'a') return { t: 'a' };
  if (tok === 'r') return { t: 'r', mode: 'pay' };
  if (tok === 'r1') return { t: 'r', mode: 'm1' };
  if (tok === 'r0') return { t: 'r', mode: 'free' };
  if (tok === 'r12') return { t: 'r', mode: 'free12' };
  if (tok.startsWith('c:')) return { t: 'c', c: tok.slice(2) };
  if (tok.startsWith('t:')) return { t: 't', c: tok.slice(2) };
  return { t: tok[0], n: parseInt(tok.slice(1), 10) };
}

const GUESTS = GUEST_DEFS.map(([name, color, order, vp, rw], i) => ({
  id: i,
  name,
  color,
  order: order.split(''),
  vp,
  rewards: rw ? rw.split(' ').map(parseReward) : [],
}));

// Staff cards: [id, name, cost, type, text]. type: once | opr (once per round) | perm | end
const STAFF_DEFS = [
  [1, 'Breakfast Server', 4, 'opr', 'Once per round: receive 1 strudel.'],
  [2, 'Waitress', 6, 'opr', 'Once per round: receive 1 cake.'],
  [3, 'Barkeeper', 4, 'opr', 'Once per round: receive 1 wine.'],
  [4, 'Sous-Chef', 6, 'opr', 'Once per round: receive 1 coffee.'],
  [5, 'Groom', 4, 'perm', 'Each time you complete a red guest’s order, receive 2 krone.'],
  [6, 'Stableman', 1, 'perm', 'Each time you complete a blue guest’s order, advance 1 on the Emperor track.'],
  [7, 'Masseuse', 1, 'perm', 'Each time a yellow guest moves into a room, receive 1 krone.'],
  [8, 'Tour Guide', 2, 'perm', 'Each time a green guest moves into a room, receive 2 VP.'],
  [9, 'Butler', 5, 'perm', 'You prepare blue rooms at no cost.'],
  [10, 'Chauffeur', 5, 'perm', 'You prepare red rooms at no cost.'],
  [11, 'Florist', 5, 'perm', 'You prepare yellow rooms at no cost.'],
  [12, 'Executive Housekeeper', 2, 'perm', 'Each time you take a die showing 3 or 4, receive 2 VP.'],
  [13, 'Restaurant Manager', 2, 'perm', 'Each time you take a die showing 1 or 2, receive 1 extra dish/drink.'],
  [14, 'Decorator', 2, 'perm', 'Each time you take a die showing 1 or 2, you may also prepare 1 room (pay cost).'],
  [15, 'Bootblack', 4, 'perm', 'Die 4: advance on BOTH the Emperor and Krone track for each die.'],
  [16, 'Laundress', 2, 'perm', 'Each time you take a die showing 4, receive 4 VP.'],
  [17, 'Kitchen Hand', 3, 'perm', 'Take a 6 for free, with +1 strength.'],
  [18, 'Checker', 2, 'perm', 'Each time you take a die showing 5, get 2 more krone discount.'],
  [19, 'Interior Architect', 3, 'perm', 'Each time you take a die showing 3, receive 5 VP.'],
  [20, 'Detective', 2, 'perm', 'Each time you take a die showing 5, advance 2 on the Emperor track.'],
  [21, 'Chef', 3, 'once', 'Receive 1 strudel, 1 cake, 1 wine and 1 coffee.'],
  [22, 'Staff Manager', 3, 'perm', 'Each time you take a die showing 3, you may also hire a staff card (full cost).'],
  [23, 'Custodian', 5, 'perm', 'Each time a guest moves into a room, receive 1 krone.'],
  [24, 'Chief Waiter', 1, 'perm', 'Serve from your kitchen to guests for free.'],
  [25, 'Delivery Boy', 6, 'perm', 'Take guests from the board at no cost.'],
  [26, 'Conference Manager', 5, 'perm', 'Pay 1 krone to avoid the Emperor penalty.'],
  [27, 'Booking Manager', 4, 'end', 'Game end: 3 VP per occupied red room.'],
  [28, 'Concierge', 4, 'end', 'Game end: 3 VP per occupied blue room.'],
  [29, 'Secretary', 5, 'end', 'Game end: copy the best game-end staff of another player.'],
  [30, 'Reception Clerk', 4, 'end', 'Game end: 3 VP per occupied yellow room.'],
  [31, 'Chambermaid', 4, 'end', 'Game end: 1 VP per occupied room.'],
  [32, 'Assistant Manager', 4, 'end', 'Game end: 2 VP per staff card you hired.'],
  [33, 'Male Floor Housekeeper', 5, 'perm', 'Each time a guest with a 4-item order moves into a room, receive 4 VP.'],
  [34, 'Receptionist', 5, 'end', 'Game end: 1 VP per room tile in your hotel.'],
  [35, 'Page-boy', 2, 'once', 'Turn 2 prepared rooms of any colour to occupied.'],
  [36, 'Sommelier', 2, 'once', 'Receive 4 wine.'],
  [37, 'Room Service', 3, 'end', 'Game end: 2 VP per fully occupied room group.'],
  [38, 'Porter', 5, 'once', 'Complete one guest’s order from the supply.'],
  [39, 'Confectioner', 3, 'once', 'Receive 4 cake.'],
  [40, 'Marketing Director', 2, 'end', 'Game end: 5 VP per Politics card you claimed.'],
  [41, 'Operator', 3, 'end', 'Game end: 2× the VP of your Emperor track space.'],
  [42, 'Gardener', 3, 'perm', 'Each time you get the Emperor bonus, also receive 5 VP.'],
  [43, 'Barista', 3, 'once', 'Receive 4 coffee.'],
  [44, 'Larder Cook', 2, 'once', 'Receive 4 strudel.'],
  [45, 'Pool Attendant', 1, 'once', 'Advance 3 on the Emperor track.'],
  [46, 'Female Floor Housekeeper', 2, 'end', 'Game end: 5 VP per fully occupied floor.'],
  [47, 'Liftboy', 4, 'end', 'Game end: 5 VP per fully occupied column.'],
  [48, 'Hotel Manager', 4, 'end', 'Game end: 4 VP per set of 3 occupied rooms of different colours.'],
];
const STAFF = STAFF_DEFS.map(([id, name, cost, type, text]) => ({ id, name, cost, type, text }));
const STAFF_TYPE_LABEL = { once: 'One-time', opr: 'Once per round', perm: 'Permanent', end: 'Game end' };

// Politics cards. check(p) receives a player.
const POLITICS = [
  { id: 'A1', letter: 'A', text: 'Have 20 krone', vps: [8, 5, 3, 1], check: p => p.money >= 20 },
  { id: 'A2', letter: 'A', text: 'Emperor track space 10+', vps: [8, 5, 3, 1], check: p => p.emp >= 10 },
  { id: 'A3', letter: 'A', text: 'Hired 6+ staff', vps: [8, 5, 3, 1], check: p => p.staff.length >= 6 },
  { id: 'A4', letter: 'A', text: '12+ room tiles in hotel', vps: [8, 5, 3, 1], check: p => countRooms(p) >= 12 },
  { id: 'B1', letter: 'B', text: '2 floors fully occupied', vps: [12, 8, 5, 2], check: p => fullRows(p) >= 2 },
  { id: 'B2', letter: 'B', text: '2 columns fully occupied', vps: [12, 8, 5, 2], check: p => fullCols(p) >= 2 },
  { id: 'B3', letter: 'B', text: '6 room groups fully occupied', vps: [12, 8, 5, 2], check: p => fullGroups(p) >= 6 },
  { id: 'B4', letter: 'B', text: 'All rooms of one colour occupied', vps: [12, 8, 5, 2],
    check: p => ['R', 'Y', 'B'].some(c => occOfColor(p, c) === totalOfColor(c)) },
  { id: 'C1', letter: 'C', text: '3 occupied rooms of each colour', vps: [15, 10, 6, 3],
    check: p => ['R', 'Y', 'B'].every(c => occOfColor(p, c) >= 3) },
  { id: 'C2', letter: 'C', text: '4 red + 3 yellow occupied', vps: [15, 10, 6, 3],
    check: p => occOfColor(p, 'R') >= 4 && occOfColor(p, 'Y') >= 3 },
  { id: 'C3', letter: 'C', text: '4 yellow + 3 blue occupied', vps: [15, 10, 6, 3],
    check: p => occOfColor(p, 'Y') >= 4 && occOfColor(p, 'B') >= 3 },
  { id: 'C4', letter: 'C', text: '4 blue + 3 red occupied', vps: [15, 10, 6, 3],
    check: p => occOfColor(p, 'B') >= 4 && occOfColor(p, 'R') >= 3 },
];

// Emperor tiles: A for round 3, B for round 5, C for round 7.
const EMPEROR_TILES = [
  { id: 'A1', letter: 'A', bonus: '+3 krone', penalty: 'Lose 3 krone or 5 VP' },
  { id: 'A2', letter: 'A', bonus: 'Draw 3 staff, hire one at -3', penalty: 'Return 2 staff from hand or lose 5 VP' },
  { id: 'A3', letter: 'A', bonus: '2 dishes/drinks of your choice', penalty: 'Lose all kitchen cubes' },
  { id: 'A4', letter: 'A', bonus: 'Prepare a room for free', penalty: 'Remove highest unoccupied room or lose 5 VP' },
  { id: 'B1', letter: 'B', bonus: '1 strudel, cake, wine and coffee', penalty: 'Lose all cubes (kitchen and guests)' },
  { id: 'B2', letter: 'B', bonus: 'Draw 3 staff, hire one for free', penalty: 'Return 3 staff from hand or lose 7 VP' },
  { id: 'B3', letter: 'B', bonus: '+5 krone', penalty: 'Lose 5 krone or 7 VP' },
  { id: 'B4', letter: 'B', bonus: 'Free occupied room on floor 1-2', penalty: 'Lose 2 highest occupied rooms or 7 VP' },
  { id: 'C1', letter: 'C', bonus: '+8 VP', penalty: '-8 VP' },
  { id: 'C2', letter: 'C', bonus: '+2 VP per staff hired', penalty: '-2 VP per staff hired' },
  { id: 'C3', letter: 'C', bonus: 'Free occupied room anywhere', penalty: 'Lose 2 occupied rooms (top of a column)' },
  { id: 'C4', letter: 'C', bonus: 'Hire a staff card for free', penalty: 'Discard a game-end staff or lose 10 VP' },
];

const PLAYER_COLORS = ['#e07b39', '#7a5cc4', '#2b9c8f', '#c4407a'];
const BOT_NAMES = ['Anna', 'Franz', 'Sisi'];

// Room groups = orthogonally connected rooms of the same colour.
const GROUPS = [];
const GROUP_OF = {};
(function buildGroups() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GROUP_OF[r + ',' + c] !== undefined) continue;
      const color = LAYOUT[r][c];
      const cells = [];
      const stack = [[r, c]];
      GROUP_OF[r + ',' + c] = GROUPS.length;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        cells.push([cr, cc]);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = cr + dr, nc = cc + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          if (LAYOUT[nr][nc] !== color || GROUP_OF[nr + ',' + nc] !== undefined) continue;
          GROUP_OF[nr + ',' + nc] = GROUPS.length;
          stack.push([nr, nc]);
        }
      }
      GROUPS.push({ color, cells });
    }
  }
})();

function totalOfColor(color) {
  let n = 0;
  for (const row of LAYOUT) for (const ch of row) if (ch === color) n++;
  return n;
}
