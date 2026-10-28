# Art prompt for Grand Hotel

Copy the **style brief** into the image AI first, then ask for assets one batch at a time
(e.g. "Using the style brief, make the 14 Artist portraits below"). Asking for every image in one go
gives inconsistent results, so keep the brief pinned and work through the batches.

The file names match the game data, so finished images can be dropped into `img/` and wired in by name.

---

## Style brief (paste this first)

> You are illustrating **Grand Hotel**, a cosy board-game app set in a grand hotel in Vienna around 1905.
> The look is a **modern, flat editorial illustration with a Viennese Secession (Jugendstil) touch**:
> clean shapes, soft paper grain, thin ink outlines, gentle shading, no photorealism, no 3D render look.
>
> **Palette**: warm ivory paper `#F6F1E8`, deep navy `#1E2A44`, muted gold `#C99A2E`,
> and four category colours used as accents: red `#B3473C`, yellow `#C99A2E`, blue `#3D6AA3`, green `#4C8656`.
> Skin tones and clothing in natural, slightly desaturated period colours.
>
> **Characters**: friendly, a little whimsical, period-accurate Edwardian / Belle Époque clothing.
> Head-and-shoulders bust, three-quarter view, looking slightly towards the viewer, neutral pose,
> centred in frame with some headroom. Every character is an original invented person
> (do not depict real historical figures or copy existing board-game artwork).
>
> **Composition rules**: square 1:1, 1024×1024, subject fills about 70% of the frame,
> plain flat background in the requested colour tint, no text, no letters, no numbers, no borders,
> no frames, no watermarks, no logos. Must stay readable when shown as a 48 px circle on a phone.
>
> **Consistency**: same line weight, same lighting (soft light from upper left), same level of detail
> and the same palette across every image in the set.

---

## 1. Guest portraits (56 images)

Bust portrait per the style brief. Background: a pale tint of the category colour
(red `#F1DAD6`, yellow `#F4E7C6`, blue `#D8E2EF`, green `#DCEADD`). Add one small prop that tells you
who they are (listed below). File: `img/guests/<no>-<name>.png`.


**Artist (yellow)**

- `img/guests/49-sculptor.png` — Sculptor: chisel and a small marble bust
- `img/guests/50-musician.png` — Musician: violin over the shoulder
- `img/guests/51-composer.png` — Composer: sheet music and a quill
- `img/guests/52-tailor.png` — Tailor: tape measure around the neck
- `img/guests/53-dancer.png` — Dancer: ballet pose, tulle collar
- `img/guests/54-portrait-painter.png` — Portrait Painter: small easel and brush
- `img/guests/55-photographer.png` — Photographer: brass box camera
- `img/guests/56-vocalist.png` — Vocalist: hand on chest mid-song
- `img/guests/57-architect.png` — Architect: rolled blueprints and set square
- `img/guests/58-actress.png` — Actress: theatrical cape and feathered hat
- `img/guests/59-poet.png` — Poet: feather quill and notebook
- `img/guests/60-jewelry-designer.png` — Jewelry Designer: loupe and a sparkling ring
- `img/guests/61-painter.png` — Painter: beret and paint palette
- `img/guests/62-opera-singer.png` — Opera Singer: dramatic costume, theatre mask brooch

**Noble (blue)**

- `img/guests/63-dame.png` — Dame: single red rose, pearl choker
- `img/guests/64-duchess.png` — Duchess: tiara and white swan-feather stole
- `img/guests/65-knight-of-the-empire.png` — Knight of the Empire: ceremonial sword and medal sash
- `img/guests/66-landgrave.png` — Landgrave: castle crest on the coat
- `img/guests/67-sovereign.png` — Sovereign: ermine collar, eagle brooch
- `img/guests/68-princess.png` — Princess: small crown, lace gown
- `img/guests/69-countess.png` — Countess: folding fan
- `img/guests/70-elector.png` — Elector: ceremonial robe and scroll
- `img/guests/71-baron.png` — Baron: top hat and monocle
- `img/guests/72-prince.png` — Prince: military dress uniform with epaulettes
- `img/guests/73-count.png` — Count: ornate key on a chain
- `img/guests/74-earl.png` — Earl: hunting jacket, stag-head pin
- `img/guests/75-baroness.png` — Baroness: diamond necklace
- `img/guests/76-duke.png` — Duke: riding crop and riding jacket

**Citizen (red)**

- `img/guests/77-apothecary.png` — Apothecary: glass flask
- `img/guests/78-post-councillor.png` — Post Councillor: postal uniform and letters
- `img/guests/79-privy-councillor.png` — Privy Councillor: wax seal and documents
- `img/guests/80-professor-emeritus.png` — Professor Emeritus: mortarboard and spectacles
- `img/guests/81-general.png` — General: plumed helmet and medals
- `img/guests/82-senior-councillor.png` — Senior Councillor: civil-service frock coat, columns behind
- `img/guests/83-councillor-of-commerce.png` — Councillor of Commerce: leather briefcase and pocket watch
- `img/guests/84-court-counsellor.png` — Court Counsellor: small scales of justice
- `img/guests/85-major.png` — Major: army officer uniform with medal
- `img/guests/86-veterinary-councillor.png` — Veterinary Councillor: horse at his shoulder, stethoscope
- `img/guests/87-medical-councillor.png` — Medical Councillor: doctor’s bag and stethoscope
- `img/guests/88-procurator.png` — Procurator: clipboard of contracts
- `img/guests/89-lord-high-commissioner.png` — Lord High Commissioner: chain of office
- `img/guests/90-senior-legal-secretary.png` — Senior Legal Secretary: fountain pen and ledger

**Tourist (green)**

- `img/guests/91-tezcatlipoca.png` — Tezcatlipoca: jaguar-pelt cloak, adventurous traveller
- `img/guests/92-capt-goldhaken.png` — Capt. Goldhaken: sea captain’s cap and anchor badge
- `img/guests/93-mr-horsa.png` — Mr. Horsa: equestrian traveller with horse
- `img/guests/94-michael-ingalls.png` — Michael Ingalls: wide-brim prairie hat
- `img/guests/95-mr-boydell.png` — Mr. Boydell: stack of books, travelling scholar
- `img/guests/96-mr-oundo.png` — Mr. Oundo: globe-trotter with a small globe
- `img/guests/97-e-gizia.png` — E. Gizia: explorer with a folded map
- `img/guests/98-m-polo.png` — M. Polo: compass and travelling cloak
- `img/guests/99-cramersopholus.png` — Cramersopholus: brass telescope, astronomer
- `img/guests/100-farmer-franz.png` — Farmer Franz: straw hat and wheat sheaf
- `img/guests/101-brother-uwe.png` — Brother Uwe: monk’s habit and a beer stein
- `img/guests/102-conductor.png` — Conductor: railway conductor cap and ticket punch
- `img/guests/103-durgoing.png` — Durgoing: leather suitcase with travel stickers
- `img/guests/104-macleod.png` — MacLeod: tartan scarf, mountain backdrop

---

## 2. Staff portraits (48 images)

Same bust format, background ivory `#F3EDE2`. Hotel staff of 1905 in uniform, each holding the tool of
their trade. File: `img/staff/<no>-<name>.png`.

- `img/staff/01-breakfast-server.png` — Breakfast Server (Once per round: receive 1 strudel)
- `img/staff/02-waitress.png` — Waitress (Once per round: receive 1 cake)
- `img/staff/03-barkeeper.png` — Barkeeper (Once per round: receive 1 wine)
- `img/staff/04-sous-chef.png` — Sous-Chef (Once per round: receive 1 coffee)
- `img/staff/05-groom.png` — Groom (Each time you complete a red guest’s order, receive 2 krone)
- `img/staff/06-stableman.png` — Stableman (Each time you complete a blue guest’s order, advance 1 on the Emperor track)
- `img/staff/07-masseuse.png` — Masseuse (Each time a yellow guest moves into a room, receive 1 krone)
- `img/staff/08-tour-guide.png` — Tour Guide (Each time a green guest moves into a room, receive 2 VP)
- `img/staff/09-butler.png` — Butler (You prepare blue rooms at no cost)
- `img/staff/10-chauffeur.png` — Chauffeur (You prepare red rooms at no cost)
- `img/staff/11-florist.png` — Florist (You prepare yellow rooms at no cost)
- `img/staff/12-executive-housekeeper.png` — Executive Housekeeper (Each time you take a die showing 3 or 4, receive 2 VP)
- `img/staff/13-restaurant-manager.png` — Restaurant Manager (Each time you take a die showing 1 or 2, receive 1 extra dish/drink)
- `img/staff/14-decorator.png` — Decorator (Each time you take a die showing 1 or 2, you may also prepare 1 room (pay cost))
- `img/staff/15-bootblack.png` — Bootblack (Die 4: advance on BOTH the Emperor and Krone track for each die)
- `img/staff/16-laundress.png` — Laundress (Each time you take a die showing 4, receive 4 VP)
- `img/staff/17-kitchen-hand.png` — Kitchen Hand (Take a 6 for free, with +1 strength)
- `img/staff/18-checker.png` — Checker (Each time you take a die showing 5, get 2 more krone discount)
- `img/staff/19-interior-architect.png` — Interior Architect (Each time you take a die showing 3, receive 5 VP)
- `img/staff/20-detective.png` — Detective (Each time you take a die showing 5, advance 2 on the Emperor track)
- `img/staff/21-chef.png` — Chef (Receive 1 strudel, 1 cake, 1 wine and 1 coffee)
- `img/staff/22-staff-manager.png` — Staff Manager (Each time you take a die showing 3, you may also hire a staff card (full cost))
- `img/staff/23-custodian.png` — Custodian (Each time a guest moves into a room, receive 1 krone)
- `img/staff/24-chief-waiter.png` — Chief Waiter (Serve from your kitchen to guests for free)
- `img/staff/25-delivery-boy.png` — Delivery Boy (Take guests from the board at no cost)
- `img/staff/26-conference-manager.png` — Conference Manager (Pay 1 krone to avoid the Emperor penalty)
- `img/staff/27-booking-manager.png` — Booking Manager (Game end: 3 VP per occupied red room)
- `img/staff/28-concierge.png` — Concierge (Game end: 3 VP per occupied blue room)
- `img/staff/29-secretary.png` — Secretary (Game end: copy the best game-end staff of another player)
- `img/staff/30-reception-clerk.png` — Reception Clerk (Game end: 3 VP per occupied yellow room)
- `img/staff/31-chambermaid.png` — Chambermaid (Game end: 1 VP per occupied room)
- `img/staff/32-assistant-manager.png` — Assistant Manager (Game end: 2 VP per staff card you hired)
- `img/staff/33-male-floor-housekeeper.png` — Male Floor Housekeeper (Each time a guest with a 4-item order moves into a room, receive 4 VP)
- `img/staff/34-receptionist.png` — Receptionist (Game end: 1 VP per room tile in your hotel)
- `img/staff/35-page-boy.png` — Page-boy (Turn 2 prepared rooms of any colour to occupied)
- `img/staff/36-sommelier.png` — Sommelier (Receive 4 wine)
- `img/staff/37-room-service.png` — Room Service (Game end: 2 VP per fully occupied room group)
- `img/staff/38-porter.png` — Porter (Complete one guest’s order from the supply)
- `img/staff/39-confectioner.png` — Confectioner (Receive 4 cake)
- `img/staff/40-marketing-director.png` — Marketing Director (Game end: 5 VP per Politics card you claimed)
- `img/staff/41-operator.png` — Operator (Game end: 2× the VP of your Emperor track space)
- `img/staff/42-gardener.png` — Gardener (Each time you get the Emperor bonus, also receive 5 VP)
- `img/staff/43-barista.png` — Barista (Receive 4 coffee)
- `img/staff/44-larder-cook.png` — Larder Cook (Receive 4 strudel)
- `img/staff/45-pool-attendant.png` — Pool Attendant (Advance 3 on the Emperor track)
- `img/staff/46-female-floor-housekeeper.png` — Female Floor Housekeeper (Game end: 5 VP per fully occupied floor)
- `img/staff/47-liftboy.png` — Liftboy (Game end: 5 VP per fully occupied column)
- `img/staff/48-hotel-manager.png` — Hotel Manager (Game end: 4 VP per set of 3 occupied rooms of different colours)

---

## 3. Food and drink icons (4 images)

Single object, centred, transparent background (PNG with alpha), 512×512, same style brief.
They are shown at 16–28 px, so keep them chunky and simple with a strong silhouette.

- `img/items/strudel.png` — a slice of apple strudel, golden pastry, light sugar dusting
- `img/items/cake.png` — a slice of Sachertorte-style chocolate cake with whipped cream
- `img/items/wine.png` — a glass of red wine
- `img/items/coffee.png` — a Viennese coffee cup with saucer, whipped cream on top

---

## 4. Player avatars (4 images)

Hotel owners, bust format, circular-crop safe (keep the head well inside the centre).
Backgrounds: orange `#E07B39`, purple `#7A5CC4`, teal `#2B9C8F`, pink `#C4407A` at 25% tint.

- `img/players/you.png` — a young hotelier in a top hat and waistcoat
- `img/players/anna.png` — a confident hotel proprietress in a wide summer hat
- `img/players/franz.png` — a bearded hotelier with a bow tie
- `img/players/sisi.png` — an elegant hotelier holding a single red rose

---

## 5. Hotel and scenery

- `img/scene/hotel-facade.png` — 3:4 portrait, a grand five-bay Viennese hotel façade at dusk,
  four storeys of windows, mansard roof, café tables with striped awning at street level.
  Flat, symmetrical, front-on view, no people, no text on signs.
- `img/scene/menu-hero.png` — 16:9, 1920×1080, the same hotel on a Viennese street at golden hour,
  a horse-drawn carriage, a café terrace; leave the left third calm and empty for the game title.
- `img/scene/emperor.png` — bust of an invented, kindly elderly emperor with white side-whiskers,
  white uniform and sash, navy background. Must not resemble any real monarch.
- `img/scene/room-<colour>-free.png` and `img/scene/room-<colour>-occupied.png` for colour = red, yellow, blue:
  square 512×512, a hotel room door seen front-on in that colour; "free" has the door slightly open with a
  made bed visible, "occupied" has the door closed with a "do not disturb" tag (no words, use a moon symbol).

---

## Delivery checklist

- PNG, sRGB, exact file names above, square unless stated.
- No text anywhere in the images.
- Check a few images at 48 px before doing the full batch; if faces turn to mush, ask for "simpler shapes, larger features".

