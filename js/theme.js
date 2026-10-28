// Themes. The hotel is the game as built; other themes rename cards, materials and wording and swap the art.
// The chosen theme is applied once, before the first render, by changing the shared game data in place.
// Museum names and texts come from docs/museum-theme.md.

const THEMES = {
  hotel: { id: 'hotel', title: 'Grand Hotel' },
  museum: {
  "id": "museum",
  "title": "The Curator",
  "tagline": "Restore your treasures, fill your galleries,<br>impress the Queen.",
  "guests": {
    "49": "Scarab Amulet",
    "50": "Canopic Jar",
    "51": "Faience Hippo",
    "52": "Painted Coffin Lid",
    "53": "Cat Statuette",
    "54": "Papyrus Scroll",
    "55": "Shabti Figures",
    "56": "Gold Collar",
    "57": "Granite Sphinx",
    "58": "Funerary Mask",
    "59": "Obelisk Fragment",
    "60": "Lotus Chalice",
    "61": "Tomb Painting",
    "62": "Colossal Head",
    "63": "Illuminated Psalter",
    "64": "Suit of Armour",
    "65": "Knight’s Sword",
    "66": "Tapestry Panel",
    "67": "Reliquary Casket",
    "68": "Stained-Glass Roundel",
    "69": "Astrolabe",
    "70": "Ivory Chess Set",
    "71": "Jewelled Crown",
    "72": "Ivory Diptych",
    "73": "Silver Chalice",
    "74": "Bronze Bell",
    "75": "Heraldic Shield",
    "76": "Renaissance Lute",
    "77": "Marble Torso",
    "78": "Red-figure Amphora",
    "79": "Bronze Helmet",
    "80": "Mosaic Panel",
    "81": "Philosopher’s Bust",
    "82": "Coin Hoard",
    "83": "Oil Lamp",
    "84": "Votive Relief",
    "85": "Gladiator’s Helmet",
    "86": "Bronze Mirror",
    "87": "Column Capital",
    "88": "Terracotta Figurine",
    "89": "Gold Laurel Wreath",
    "90": "Wax Tablet",
    "91": "Ammonite",
    "92": "Dinosaur Skull",
    "93": "Amethyst Geode",
    "94": "Butterfly Case",
    "95": "Narwhal Tusk",
    "96": "Meteorite",
    "97": "Coral Branch",
    "98": "Dodo Skeleton",
    "99": "Herbarium Sheet",
    "100": "Mammoth Tooth",
    "101": "Trilobite",
    "102": "Giant Clam",
    "103": "Barn Owl Specimen",
    "104": "Pterosaur Fossil"
  },
  "staff": {
    "1": [
      "Plasterer",
      "Once per season: receive 1 plaster."
    ],
    "2": [
      "Seamstress",
      "Once per season: receive 1 linen."
    ],
    "3": [
      "Varnisher",
      "Once per season: receive 1 varnish."
    ],
    "4": [
      "Gilder",
      "Once per season: receive 1 gold leaf."
    ],
    "5": [
      "Classics Scholar",
      "Each time you complete a Classical artefact’s restoration, receive 2 guineas."
    ],
    "6": [
      "Medievalist",
      "Each time you complete a Medieval artefact’s restoration, advance 1 on the Royal favour track."
    ],
    "7": [
      "Egyptologist",
      "Each time an Egyptian artefact goes on display, receive 1 guinea."
    ],
    "8": [
      "Naturalist",
      "Each time a Natural History piece goes on display, receive 2 prestige."
    ],
    "9": [
      "Glazier",
      "You open Medieval galleries at no cost."
    ],
    "10": [
      "Stonemason",
      "You open Classical galleries at no cost."
    ],
    "11": [
      "Carpenter",
      "You open Egyptian galleries at no cost."
    ],
    "12": [
      "Head Warder",
      "Each time you take a die showing 3 or 4, receive 2 prestige."
    ],
    "13": [
      "Quartermaster",
      "Each time you take a die showing 1 or 2, receive 1 extra material."
    ],
    "14": [
      "Exhibition Designer",
      "Each time you take a die showing 1 or 2, you may also open 1 gallery (pay cost)."
    ],
    "15": [
      "Errand Boy",
      "Die 4: advance on BOTH the Royal favour and guineas tracks for each die."
    ],
    "16": [
      "Cleaner",
      "Each time you take a die showing 4, receive 4 prestige."
    ],
    "17": [
      "Night Watchman",
      "Take a 6 for free, with +1 strength."
    ],
    "18": [
      "Bursar",
      "Each time you take a die showing 5, get 2 more guineas discount."
    ],
    "19": [
      "Lighting Engineer",
      "Each time you take a die showing 3, receive 5 prestige."
    ],
    "20": [
      "Antiquities Dealer",
      "Each time you take a die showing 5, advance 2 on the Royal favour track."
    ],
    "21": [
      "Conservator",
      "Receive 1 plaster, 1 linen, 1 varnish and 1 gold leaf."
    ],
    "22": [
      "Registrar",
      "Each time you take a die showing 3, you may also hire a staff card (full cost)."
    ],
    "23": [
      "Ticket Collector",
      "Each time an artefact goes on display, receive 1 guinea."
    ],
    "24": [
      "Workshop Foreman",
      "Apply materials from your storeroom for free."
    ],
    "25": [
      "Field Agent",
      "Take artefacts from the board at no cost."
    ],
    "26": [
      "Press Secretary",
      "Pay 1 guinea to avoid the Royal visit penalty."
    ],
    "27": [
      "Keeper of Classics",
      "Game end: 3 prestige per filled Classical gallery."
    ],
    "28": [
      "Keeper of Medieval Art",
      "Game end: 3 prestige per filled Medieval gallery."
    ],
    "29": [
      "Archivist",
      "Game end: copy the best game-end staff of another player."
    ],
    "30": [
      "Keeper of Egypt",
      "Game end: 3 prestige per filled Egyptian gallery."
    ],
    "31": [
      "Guide Lecturer",
      "Game end: 1 prestige per filled gallery."
    ],
    "32": [
      "Deputy Director",
      "Game end: 2 prestige per staff card you hired."
    ],
    "33": [
      "Senior Conservator",
      "Each time an artefact with a 4-item restoration goes on display, receive 4 prestige."
    ],
    "34": [
      "Catalogue Clerk",
      "Game end: 1 prestige per gallery in your museum."
    ],
    "35": [
      "Gallery Attendant",
      "Fill 2 open galleries of any department."
    ],
    "36": [
      "Chemist",
      "Receive 4 varnish."
    ],
    "37": [
      "Exhibition Curator",
      "Game end: 2 prestige per complete wing."
    ],
    "38": [
      "Restorer",
      "Complete one artefact’s restoration from the supply."
    ],
    "39": [
      "Weaver",
      "Receive 4 linen."
    ],
    "40": [
      "Publicist",
      "Game end: 5 prestige per Trustee commission you claimed."
    ],
    "41": [
      "Royal Liaison",
      "Game end: 2× the prestige of your Royal favour track space."
    ],
    "42": [
      "Society Hostess",
      "Each time you get the Royal visit bonus, also receive 5 prestige."
    ],
    "43": [
      "Gold Beater",
      "Receive 4 gold leaf."
    ],
    "44": [
      "Plaster Merchant",
      "Receive 4 plaster."
    ],
    "45": [
      "Photographer",
      "Advance 3 on the Royal favour track."
    ],
    "46": [
      "Floor Warden",
      "Game end: 5 prestige per completely filled floor."
    ],
    "47": [
      "Lift Operator",
      "Game end: 5 prestige per completely filled column."
    ],
    "48": [
      "Museum Director",
      "Game end: 4 prestige per set of 3 filled galleries of different colours."
    ]
  },
  "cubes": {
    "s": [
      "Plaster",
      "plaster"
    ],
    "c": [
      "Linen",
      "linen"
    ],
    "w": [
      "Varnish",
      "varnish"
    ],
    "k": [
      "Gold leaf",
      "gold leaf"
    ]
  },
  "types": {
    "R": "Classical",
    "Y": "Egyptian",
    "B": "Medieval",
    "G": "Specimen"
  },
  "players": [
    "You",
    "Ada",
    "Fitz",
    "Maud"
  ],
  "words": [
    [
      "Grand Hotel",
      "The Curator"
    ],
    [
      "keep the Emperor happy",
      "impress the Queen"
    ],
    [
      "Serve your guests",
      "Restore your treasures"
    ],
    [
      "Guests arriving",
      "Acquisitions"
    ],
    [
      "Your café",
      "Your workshop"
    ],
    [
      "Your hotel",
      "Your museum"
    ],
    [
      "Empty table",
      "Empty bench"
    ],
    [
      "free table",
      "free bench"
    ],
    [
      "a guest",
      "an artefact"
    ],
    [
      "into a room",
      "on display"
    ],
    [
      "Check in",
      "Display"
    ],
    [
      "checks",
      "displays"
    ],
    [
      "Emperor/krone",
      "Favour/£"
    ],
    [
      "Emperor & politics",
      "Royal visits & trustees"
    ],
    [
      "Emperor track",
      "Royal favour"
    ],
    [
      "Emperor",
      "Royal favour"
    ],
    [
      "politics",
      "commissions"
    ],
    [
      "Politics",
      "Commissions"
    ],
    [
      "guests",
      "artefacts"
    ],
    [
      "guest",
      "artefact"
    ],
    [
      "Guests",
      "Artefacts"
    ],
    [
      "Guest",
      "Artefact"
    ],
    [
      "invites",
      "acquires"
    ],
    [
      "invite",
      "acquire"
    ],
    [
      "Invite",
      "Acquire"
    ],
    [
      "café",
      "workshop"
    ],
    [
      "Café",
      "Workshop"
    ],
    [
      "seats",
      "benches"
    ],
    [
      "seat",
      "bench"
    ],
    [
      "Kitchen",
      "Storeroom"
    ],
    [
      "kitchen",
      "storeroom"
    ],
    [
      "Serving",
      "Applying"
    ],
    [
      "serves",
      "applies"
    ],
    [
      "Serve",
      "Apply"
    ],
    [
      "Prepare",
      "Open"
    ],
    [
      "prepare",
      "open"
    ],
    [
      "prepares",
      "opens"
    ],
    [
      "prepared",
      "opened"
    ],
    [
      "Prepared",
      "Open"
    ],
    [
      "Occupied",
      "Filled"
    ],
    [
      "occupied",
      "filled"
    ],
    [
      "rooms",
      "galleries"
    ],
    [
      "room",
      "gallery"
    ],
    [
      "Rooms",
      "Galleries"
    ],
    [
      "Room",
      "Gallery"
    ],
    [
      "krone",
      "guineas"
    ],
    [
      "Krone",
      "Guineas"
    ],
    [
      "VP",
      "prestige"
    ],
    [
      "Points",
      "Prestige"
    ],
    [
      "points",
      "prestige"
    ],
    [
      "dishes and drinks",
      "materials"
    ],
    [
      "dish or drink",
      "material"
    ],
    [
      "dish/drink",
      "material"
    ],
    [
      "dishes",
      "materials"
    ],
    [
      "drinks",
      "materials"
    ],
    [
      "strudel",
      "plaster"
    ],
    [
      "Strudel",
      "Plaster"
    ],
    [
      "cake",
      "linen"
    ],
    [
      "Cake",
      "Linen"
    ],
    [
      "wine",
      "varnish"
    ],
    [
      "Wine",
      "Varnish"
    ],
    [
      "coffee",
      "gold leaf"
    ],
    [
      "Coffee",
      "Gold leaf"
    ],
    [
      "orders",
      "restorations"
    ],
    [
      "order",
      "restoration"
    ],
    [
      "Order",
      "Restoration"
    ],
    [
      "tourists",
      "specimens"
    ],
    [
      "Tourists",
      "Specimens"
    ],
    [
      "hotel",
      "museum"
    ],
    [
      "Hotel",
      "Museum"
    ],
    [
      "rounds",
      "seasons"
    ],
    [
      "round",
      "season"
    ],
    [
      "Round",
      "Season"
    ],
    [
      "Log",
      "Journal"
    ]
  ]
},
};

function savedTheme() {
  const q = new URLSearchParams(location.search).get('theme');
  if (q && THEMES[q]) return q;
  try { const t = localStorage.getItem('theme'); if (t && THEMES[t]) return t; } catch (e) { /* storage blocked */ }
  return 'hotel';
}

const THEME = THEMES[savedTheme()];

// Picking a theme reloads the page so the game data starts clean.
function chooseTheme(id) {
  try { localStorage.setItem('theme', id); } catch (e) { /* storage blocked */ }
  const url = new URL(location.href);
  url.searchParams.delete('theme');
  location.replace(url.toString());
}

(function applyTheme(T) {
  document.documentElement.classList.add('theme-' + T.id);
  document.title = T.title;
  if (T.id === 'hotel') return;
  for (const g of GUESTS) if (T.guests[g.no]) g.name = T.guests[g.no];
  for (const s of STAFF) if (T.staff[s.id]) [s.name, s.text] = T.staff[s.id];
  for (const c of CUBES) [CUBE_INFO[c].name, CUBE_INFO[c].plural] = T.cubes[c];
  for (const c of Object.keys(T.types)) COLORS[c].guest = T.types[c];
  T.players.slice(1).forEach((n, i) => { BOT_NAMES[i] = n; });
})(THEME);

// Rewrites hotel wording on screen (text and labels only, never markup) for themes that have a word list.
const THEME_WORDS = (() => {
  if (!THEME.words) return null;
  const map = new Map(THEME.words);
  const keys = [...map.keys()].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return { map, re: new RegExp(`(?<![\\p{L}])(?:${keys.join('|')})(?![\\p{L}])`, 'gu') };
})();

function themeText(s) {
  return THEME_WORDS ? s.replace(THEME_WORDS.re, m => THEME_WORDS.map.get(m)) : s;
}

function themeDom(root) {
  if (!THEME_WORDS || !root) return;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.parentElement && n.parentElement.closest('[data-keep]')) continue;
    const t = themeText(n.nodeValue);
    if (t !== n.nodeValue) n.nodeValue = t;
  }
  for (const el of root.querySelectorAll('[aria-label],[title]')) {
    for (const a of ['aria-label', 'title']) if (el.hasAttribute(a)) el.setAttribute(a, themeText(el.getAttribute(a)));
  }
}
