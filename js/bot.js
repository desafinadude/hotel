// A simple heuristic bot. It plans one action per turn by scoring every
// available die, and answers engine prompts with greedy choices.

const Bot = {
  async turn(p) {
    const t = S.turn;
    await sleep(Hooks.botDelay);
    await this.freeActions(p);
    if (cafeFree(p) >= 0) {
      let best = null, bestV = 1;
      S.display.forEach((g, slot) => {
        if (!g) return;
        const cost = guestCost(p, slot);
        if (cost > p.money) return;
        const v = this.guestValue(p, g) - cost * 1.1;
        if (v > bestV) { best = slot; bestV = v; }
      });
      if (best !== null && takeGuest(p, best)) {
        t.guestTaken = true;
        await sleep(Hooks.botDelay);
      }
    }
    const plan = this.planAction(p);
    if (!plan) {
      if (!t.extra) { t.passed = true; log(`${p.name} passes`, p.idx); }
      return;
    }
    p._plan = plan;
    await doAction(p, plan.space);
    p._plan = null;
    await sleep(Hooks.botDelay * 0.5);
    await this.freeActions(p);
  },

  // Check-ins, serving from the kitchen, once-per-round staff and politics.
  async freeActions(p) {
    for (let guard = 0; guard < 20; guard++) {
      let acted = false;
      p.staff.forEach((e, i) => { if (e.card.type === 'opr' && !e.tapped && useOpr(p, i)) acted = true; });
      const movable = this.movableCubes(p);
      if (movable && (hasStaff(p, 24) || (p.money >= 1 && (movable >= 2 || this.serveCompletes(p) || S.round >= 6)))) {
        if (serveFromKitchen(p)) acted = true;
      }
      for (let i = 0; i < 3; i++) {
        const g = p.cafe[i];
        if (g && isComplete(g) && freeRoomsFor(p, g.color).length) {
          if (await checkIn(p, i)) { acted = true; await sleep(Hooks.botDelay * 0.5); }
        }
      }
      for (const i of claimablePolitics(p)) if (claimPolitics(p, i)) acted = true;
      if (!acted) return;
    }
  },

  needs(p) {
    const need = { s: 0, c: 0, w: 0, k: 0 };
    for (const g of p.cafe) if (g) for (const c of missing(g)) need[c]++;
    return need;
  },

  netNeeds(p) {
    const need = this.needs(p);
    for (const c of CUBES) need[c] = Math.max(0, need[c] - p.kitchen[c]);
    return need;
  },

  movableCubes(p) {
    const need = this.needs(p);
    return CUBES.reduce((n, c) => n + Math.min(need[c], p.kitchen[c]), 0);
  },

  serveCompletes(p) {
    return p.cafe.some(g => {
      if (!g) return false;
      const m = missing(g);
      const cnt = {};
      for (const c of m) cnt[c] = (cnt[c] || 0) + 1;
      return m.length <= 3 && Object.keys(cnt).every(c => p.kitchen[c] >= cnt[c]);
    });
  },

  rewardValue(rws) {
    let v = 0;
    for (const r of rws) {
      switch (r.t) {
        case 'k': case 'e': case 'v': v += r.n; break;
        case 'c': v += 2; break;
        case 'g': v += 2.5; break;
        case 'r': v += { pay: 1.5, m1: 2, free: 3, free12: 2.5 }[r.mode]; break;
        case 't': v += 4; break;
        case 's': v += r.n >= 99 ? 4 : 1 + r.n * 0.8; break;
        case 'd': v += r.n * 0.7; break;
        case 'x': v += r.n >= 99 ? 5 : 3; break;
        case 'a': v += 5; break;
      }
    }
    return v;
  },

  guestValue(p, g) {
    let v = g.vp + this.rewardValue(g.rewards) - missing(g).length * 1.4;
    const roomy = freeRoomsFor(p, g.color).length > 0 ||
      placeableCells(p, 'pay').some(c => g.color === 'G' || LAYOUT[c.r][c.c] === g.color);
    v += roomy ? 0.5 : -1.5;
    if (S.round >= 6) v -= missing(g).length * (S.round - 5);
    return v;
  },

  staffValue(p, card) {
    const left = 8 - S.round;
    const occ = countOcc(p);
    const estOcc = Math.min(20, occ + left * 1.6);
    switch (card.id) {
      case 1: case 2: case 3: case 4: return left * 1.3;
      case 5: case 6: case 7: case 8: return left * 0.8;
      case 9: case 10: case 11: return left * 0.9;
      case 12: case 13: case 14: case 16: case 19: case 20: return left;
      case 15: case 17: case 23: case 33: return left * 0.8;
      case 18: return 1.5;
      case 22: case 24: return left * 0.6;
      case 25: return left * 1.1;
      case 26: return 2;
      case 42: return 4;
      case 21: return 4;
      case 35: return freeRoomsFor(p, 'any').length >= 2 ? 7 : 2;
      case 36: case 39: case 43: case 44: {
        const c = { 36: 'w', 39: 'c', 43: 'k', 44: 's' }[card.id];
        const need = this.netNeeds(p)[c];
        return Math.min(4, need) * 2.2 + (4 - Math.min(4, need)) * 0.7;
      }
      case 38: return p.cafe.some(g => g && !isComplete(g)) ? 5 : 0;
      case 45: return 3;
      case 27: case 28: case 30: return 3 * (estOcc / 3) * 0.7;
      case 31: return estOcc * 0.8;
      case 32: return 2 * (p.staff.length + 1 + left * 0.5);
      case 34: return Math.min(20, countRooms(p) + left * 1.5) * 0.8;
      case 37: return 2 * (estOcc / 2) * 0.6;
      case 40: return 5 * (p.politics.length + 1);
      case 41: return 8;
      case 46: case 47: return 5 * (estOcc > 10 ? 1 : 0.5);
      case 48: return 4 * (estOcc / 3) * 0.6;
      case 29: return 6;
    }
    return 1;
  },

  roomDemand(p) {
    const demand = { R: 0, Y: 0, B: 0, G: 0 };
    for (const g of p.cafe) if (g) demand[g.color]++;
    for (const c of ['R', 'Y', 'B']) demand[c] = Math.max(0, demand[c] - freeRoomsFor(p, c).length);
    const spare = freeRoomsFor(p, 'any').length;
    const colored = demand.R + demand.Y + demand.B;
    demand.G = Math.max(0, demand.G - Math.max(0, spare - colored));
    return demand;
  },

  bestCubeSplit(p, sub, n) {
    const [a, b] = sub === 1 ? ['s', 'c'] : ['w', 'k'];
    const need = this.netNeeds(p);
    let best = n, bestV = -1;
    for (let x = n; x >= Math.ceil(n / 2); x--) {
      const useful = Math.min(x, need[a]) + Math.min(n - x, need[b]);
      const v = useful * 2.5 + (n - useful) * 0.7;
      if (v > bestV + 1e-9) { bestV = v; best = x; }
    }
    return { x: best, v: bestV };
  },

  evalSub(p, sub, n, space) {
    if (sub === 1 || sub === 2) return this.bestCubeSplit(p, sub, n).v;
    if (sub === 3) {
      const cells = placeableCells(p, 'pay');
      if (!cells.length) return 0;
      const d = this.roomDemand(p);
      const demand = d.R + d.Y + d.B + d.G;
      const zero = cells.filter(c => c.cost === 0).length;
      const affordable = Math.min(n, zero + Math.floor(p.money / 1.5));
      const useful = Math.min(affordable, demand);
      return useful * 3.5 + Math.min(affordable - useful, 2) * (S.round <= 4 ? 1 : 0.3);
    }
    if (sub === 4) {
      if (space === 4 && hasStaff(p, 15)) return n * 2;
      const scoringSoon = [3, 5, 7].some(r => r >= S.round && r - S.round <= 1);
      const empV = p.emp >= EMP_MAX ? 0.4 : scoringSoon ? 1.3 : 0.9;
      const monV = p.money >= MONEY_MAX ? 0 : p.money < 6 ? 1.1 : 0.6;
      return n * Math.max(empV, monV);
    }
    if (sub === 5) {
      const discount = n + (space === 5 && hasStaff(p, 18) ? 2 : 0);
      let best = 0;
      for (const card of p.hand) {
        const cost = Math.max(0, card.cost - discount);
        if (cost > p.money) continue;
        best = Math.max(best, this.staffValue(p, card) - cost);
      }
      return best;
    }
    return 0;
  },

  triggerValue(p, face) {
    let v = 0;
    if ((face === 1 || face === 2) && hasStaff(p, 14)) v += 1;
    if ((face === 3 || face === 4) && hasStaff(p, 12)) v += 2;
    if (face === 3 && hasStaff(p, 19)) v += 5;
    if (face === 4 && hasStaff(p, 16)) v += 4;
    if (face === 5 && hasStaff(p, 20)) v += 2;
    return v;
  },

  planAction(p) {
    const t = S.turn;
    let best = null;
    for (let space = 1; space <= 6; space++) {
      if (!canUseSpace(p, space)) continue;
      const fee = space === 6 && !hasStaff(p, 17) ? 1 : 0;
      for (const { sub, str } of actionStrengths(p, space)) {
        const trig = this.triggerValue(p, space);
        const v = this.evalSub(p, sub, str, space) - fee + trig;
        if (!best || v > best.v) best = { space, sub, str, boost: false, v };
        if (!t.boost && p.money >= fee + 2) {
          const vb = this.evalSub(p, sub, str + 1, space) - fee - 1.2 + trig;
          if (vb > best.v) best = { space, sub, str: str + 1, boost: true, v: vb };
        }
      }
    }
    return best;
  },

  cellScore(p, { r, c }, occupied) {
    const color = LAYOUT[r][c];
    const g = GROUP_OF[key(r, c)];
    let v = 0;
    if (occupied) {
      v += r + 1;
      const others = GROUPS[g].cells.filter(([gr, gc]) => !(gr === r && gc === c));
      if (!p.claimedGroups[g] && others.every(([gr, gc]) => p.rooms[gr][gc] === 'occ')) {
        v += GROUP_BONUS[color][GROUPS[g].cells.length] * (color === 'Y' ? 1.1 : 1);
      }
      return v;
    }
    const d = this.roomDemand(p);
    if (d[color] > 0) v += 4;
    else if (d.G > 0) v += 2.5;
    v += (DOOR_VP[key(r, c)] || 0);
    v -= roomCost(p, r, c, 'pay') * 1.1;
    v += 0.3 * r; // higher rooms score more when occupied
    return v;
  },

  decide(p, pr) {
    const opts = pr.options || [];
    const firstOk = () => {
      const o = opts.find(o => !o.disabled);
      return o ? o.value : null;
    };
    switch (pr.tag) {
      case 'strength': {
        const plan = p._plan;
        const o = plan && opts.find(o => !o.disabled && o.sub === plan.sub && o.value.boost === plan.boost);
        return o ? o.value : firstOk();
      }
      case 'cubes': {
        const sub = pr.meta.a === 's' ? 1 : 2;
        return this.bestCubeSplit(p, sub, pr.meta.n).x;
      }
      case 'split4': {
        const n = pr.meta.n;
        if (p.emp >= EMP_MAX) return 0;
        const scoringSoon = [3, 5, 7].some(r => r >= S.round && r - S.round <= 1);
        if (p.money < 4) return Math.max(0, n - (4 - p.money));
        if (scoringSoon || p.money >= 10) return Math.min(n, EMP_MAX - p.emp + 1);
        return Math.ceil(n / 2);
      }
      case 'room': {
        let best = null, bestV = -Infinity;
        for (const cell of pr.cells) {
          const v = this.cellScore(p, cell, pr.meta && pr.meta.occupied);
          if (v > bestV) { bestV = v; best = cell; }
        }
        if (pr.allowSkip && bestV < 0 && countRooms(p) >= 3) return null;
        return best;
      }
      case 'turn': case 'checkin': {
        let best = null, bestV = -Infinity;
        for (const cell of pr.cells) {
          const v = this.cellScore(p, cell, true);
          if (v > bestV) { bestV = v; best = cell; }
        }
        return best;
      }
      case 'removeRoom': {
        let best = null, bestV = Infinity;
        for (const cell of pr.cells) {
          const v = this.cellScore(p, cell, true);
          if (v < bestV) { bestV = v; best = cell; }
        }
        return best;
      }
      case 'staff': {
        let best = null, bestV = 0.5;
        for (const o of opts) {
          if (o.disabled) continue;
          const v = this.staffValue(p, o.card) - o.cost;
          if (v > bestV) { bestV = v; best = o.value; }
        }
        if (best === null && !pr.allowSkip) return firstOk();
        return best;
      }
      case 'guest': {
        let best = null, bestV = -2;
        for (const o of opts) {
          if (o.disabled) continue;
          const v = this.guestValue(p, o.guest);
          if (v > bestV) { bestV = v; best = o.value; }
        }
        return best === null && !pr.allowSkip ? firstOk() : best;
      }
      case 'cube': {
        const need = this.netNeeds(p);
        let best = 'w';
        for (const c of CUBES) if (need[c] > need[best]) best = c;
        return best;
      }
      case 'porter': {
        let best = null, bestM = -1;
        for (const o of opts) {
          if (o.disabled) continue;
          const m = missing(o.guest).length;
          if (m > bestM) { bestM = m; best = o.value; }
        }
        return best;
      }
      case 'penalty': {
        const a = opts[0];
        if (a.disabled) return false;
        if (/occupied/.test(a.label)) return false;
        if (/game-end/.test(a.label)) {
          const worst = Math.min(...p.staff.filter(e => e.card.type === 'end').map(e => endStaffVP(p, e.card.id)));
          return worst < 10;
        }
        return true;
      }
      case 'discardHand': {
        let best = 0, bestV = Infinity;
        opts.forEach(o => { const v = this.staffValue(p, o.card); if (v < bestV) { bestV = v; best = o.value; } });
        return best;
      }
      case 'discardEnd': {
        let best = opts[0].value, bestV = Infinity;
        opts.forEach(o => { const v = endStaffVP(p, o.card.id); if (v < bestV) { bestV = v; best = o.value; } });
        return best;
      }
      case 'confManager': return true;
    }
    return firstOk();
  },
};

if (typeof module !== 'undefined') module.exports = { Bot };
