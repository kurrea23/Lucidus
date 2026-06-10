/* ============================================================
   Festiplanner — the festival trip planner
   Plan everything between "we bought tickets" and "we're home":
   crew, tickets, travel, stay, money, gear, itinerary, info.
   Free tier: one trip, solo. Pro: unlimited trips + crew.
   ============================================================ */

/* ----------------------------- icons ----------------------------- */

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  trip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  crew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.7-3.4 3.4-5 6.5-5s5.8 1.6 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.3 4.4 1.8 5 4.4"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.6-4.4A8.5 8.5 0 1 1 21 12Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/></svg>',
  pack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7.5" width="16" height="13" rx="3"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5M4 12.5h16"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15.2 8.8c-.6-1-1.8-1.6-3.2-1.6-1.8 0-3.2 1-3.2 2.5 0 3.4 6.6 1.7 6.6 5 0 1.5-1.5 2.6-3.4 2.6-1.6 0-2.9-.7-3.5-1.8"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16.5 6.5 10c.3-1.2 1.2-2 2.5-2h6c1.3 0 2.2.8 2.5 2l1.5 6.5"/><rect x="3.5" y="14.5" width="17" height="5" rx="2"/><circle cx="7.5" cy="19.5" r="1.6"/><circle cx="16.5" cy="19.5" r="1.6"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18.5V6.5M3 14.5h18v4M3 11h18v0a3 3 0 0 0-3-3h-7v3.5"/><circle cx="6.5" cy="9" r="1.4"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M13 6v2M13 11v2M13 16v2"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.7 6.5 1.7 6.5H4.3S6 14.5 6 9.5Z"/><path d="M10.3 19.5a1.9 1.9 0 0 0 3.4 0"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 6.5 12 3l4 3.5"/><path d="M5 11v8.5h14V11"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18.5V6l11-2.5V16"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  vibe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12h3l2.5-7 4 14 3-9 1.8 2h4.7"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4.5"/><path d="M5 5c4-2.2 7 2 11 0v8c-4 2.2-7-2-11 0"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5ZM12.5 7.5l4 4"/></svg>',
};

const FEST_EMOJIS = ['🎪', '🎡', '🌵', '🌴', '🔥', '🦋', '🌈', '⚡️', '🍄', '🌙'];
const PACK_CATS = { Essentials: '🎟️', Camping: '⛺️', Clothes: '🧢', Tech: '🔋', Health: '🧴', Misc: '🎒' };
const SPEND_CATS = { Ticket: '🎟️', Travel: '🚐', Stay: '⛺️', Food: '🌮', Drinks: '🥤', Merch: '👕', Other: '✨' };
const TRAVEL_MODES = { drive: '🚗 Drive', fly: '✈️ Fly', train: '🚆 Train', bus: '🚌 Bus' };
const STAY_TYPES = { camping: '⛺️ Camping', hotel: '🏨 Hotel', airbnb: '🏡 Airbnb', rv: '🚐 RV', friend: '🛋️ Crash spot' };
const TICKET_STATUS = ['needed', 'bought', 'in hand'];
const ITIN_ICONS = { travel: '🚗', food: '🌮', stay: '🏕️', gate: '🎟️', music: '🎶', misc: '📍' };

/* ----------------------------- store ----------------------------- */

const KEY = 'festiplanner_v2';

const defaultState = () => ({
  onboarded: false,
  user: { name: '', email: '' },
  premium: false,
  settings: { theme: 'dark', haptics: true, notifications: true },
  inviteCode: 'FP-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
  friends: [],
  trips: [],
  activeTripId: null,
});

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (e) { /* corrupted state falls back to default */ }
  return defaultState();
}

function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
const uid = () => Math.random().toString(36).slice(2, 10);

function activeTrip() {
  return S.trips.find(t => t.id === S.activeTripId) || S.trips[0] || null;
}

function newTrip(data) {
  const t = {
    id: uid(),
    name: data.name,
    location: data.location || '',
    emoji: data.emoji || '🎪',
    start: data.start,
    end: data.end || data.start,
    budgetCap: Number(data.budgetCap) || 0,
    crewIds: [],
    rsvp: {},                 // friendId -> 'in' | 'maybe' | 'out'
    tickets: [{ id: uid(), person: 'me', status: 'needed', price: 0, note: '' }],
    travel: { mode: '', from: '', departDate: '', departTime: '', returnDate: '', returnTime: '', notes: '', rides: [] },
    stay: { type: '', name: '', address: '', checkIn: '', checkOut: '', conf: '', cost: 0, notes: '', spot: '' },
    itinerary: [],
    packing: [],
    expenses: [],              // {id,label,amount,cat,payer:'me'|friendId,shared:bool,ts}
    info: { venue: '', meet: '', rules: '', ice: '', notes: '' },
    dontMiss: [],              // {id, artist, day, time, note}
  };
  S.trips.push(t);
  S.activeTripId = t.id;
  save();
  return t;
}

function personName(pid) {
  if (pid === 'me') return S.user.name || 'You';
  return S.friends.find(f => f.id === pid)?.name || 'Friend';
}

function tripCrew(t) {
  return S.friends.filter(f => t.crewIds.includes(f.id) && f.status === 'joined');
}

/* ----------------------------- date utils ----------------------------- */

const DAY_MS = 86400000;
const toDate = s => new Date(s + 'T00:00:00');
const isoDay = d => d.toISOString().slice(0, 10);

function rangeDays(a, b) {
  const days = [];
  for (let t = toDate(a).getTime(); t <= toDate(b).getTime(); t += DAY_MS) days.push(isoDay(new Date(t)));
  return days;
}

/* itinerary spans departure → return when set, else festival dates */
function tripDays(t) {
  const a = t.travel.departDate && t.travel.departDate < t.start ? t.travel.departDate : t.start;
  const b = t.travel.returnDate && t.travel.returnDate > t.end ? t.travel.returnDate : t.end;
  return rangeDays(a, b);
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtRange(t) {
  const a = toDate(t.start), b = toDate(t.end);
  if (t.start === t.end) return `${MON[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
  if (a.getMonth() === b.getMonth()) return `${MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
  return `${MON[a.getMonth()]} ${a.getDate()} – ${MON[b.getMonth()]} ${b.getDate()}, ${b.getFullYear()}`;
}

function fmtDayShort(iso) {
  const d = toDate(iso);
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`;
}

function fmtTime(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

function countdownParts(t) {
  let diff = toDate(t.start).getTime() - Date.now();
  if (diff < 0) return null;
  const d = Math.floor(diff / DAY_MS); diff -= d * DAY_MS;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  return { d, h, m, s: Math.floor(diff / 1000) };
}

function tripPhase(t) {
  const today = isoDay(new Date());
  if (today < t.start) return 'upcoming';
  if (today > t.end) return 'past';
  return 'live';
}

const money = n => '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

/* ----------------------------- readiness ----------------------------- */

function readiness(t) {
  const items = [
    {
      label: 'Secure your ticket', icon: '🎟️',
      done: t.tickets.find(x => x.person === 'me')?.status !== 'needed',
      go: () => go('trip', null, 'tickets'),
    },
    {
      label: 'Plan how you get there', icon: '🚗',
      done: !!(t.travel.mode && t.travel.departDate),
      go: () => go('trip', null, 'logistics'),
    },
    {
      label: 'Sort where you sleep', icon: '🏕️',
      done: !!(t.stay.type && (t.stay.name || t.stay.address)),
      go: () => go('trip', null, 'logistics'),
    },
    {
      label: 'Set a trip budget', icon: '💸',
      done: t.budgetCap > 0,
      go: () => go('home', 'budget'),
    },
    {
      label: 'Start your packing list', icon: '🎒',
      done: t.packing.length >= 5,
      go: () => go('home', 'packing'),
    },
    {
      label: 'Build the itinerary', icon: '🗓️',
      done: t.itinerary.length >= 3,
      go: () => go('trip', null, 'itinerary'),
    },
    {
      label: 'Fill the info hub', icon: '📌',
      done: !!(t.info.venue && t.info.meet),
      go: () => go('home', 'info'),
    },
  ];
  if (S.premium || S.friends.length) {
    items.splice(1, 0, {
      label: 'Get the crew in', icon: '🫂',
      done: tripCrew(t).length > 0,
      go: () => go('crew'),
    });
  }
  const done = items.filter(i => i.done).length;
  return { items, done, total: items.length, next: items.find(i => !i.done) || null };
}

/* ----------------------------- money math ----------------------------- */

/* my total share of all expenses (shared split evenly across me + crew) */
function myShare(t) {
  const n = tripCrew(t).length + 1;
  return t.expenses.reduce((a, e) => {
    if (e.shared) return a + e.amount / n;
    return a + (e.payer === 'me' ? e.amount : 0);
  }, 0);
}

function myTotalSpend(t) {
  const ticket = Number(t.tickets.find(x => x.person === 'me')?.price) || 0;
  return ticket + myShare(t);
}

/* settle-up: balance per person = paid - owed (shared expenses only) */
function balances(t) {
  const people = ['me', ...tripCrew(t).map(f => f.id)];
  const n = people.length;
  const bal = Object.fromEntries(people.map(p => [p, 0]));
  for (const e of t.expenses) {
    if (!e.shared || n < 2) continue;
    if (bal[e.payer] === undefined) continue;
    bal[e.payer] += e.amount;
    for (const p of people) bal[p] -= e.amount / n;
  }
  return bal;
}

/* ----------------------------- dom helpers ----------------------------- */

const $ = sel => document.querySelector(sel);

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function haptic() {
  if (S.settings.haptics && navigator.vibrate) navigator.vibrate(8);
}

function toast(msg, icon = '') {
  const root = $('#toast-root');
  const t = el(`<div class="toast">${icon}${esc(msg)}</div>`);
  root.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2600);
}

let sheetClose = null;

function openSheet(contentEl, { onClose } = {}) {
  closeSheet();
  const backdrop = el('<div class="sheet-backdrop"></div>');
  const sheet = el('<div class="sheet"><div class="sheet-grab"></div></div>');
  sheet.appendChild(contentEl);
  backdrop.appendChild(sheet);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeSheet(); });
  $('#sheet-root').appendChild(backdrop);
  sheetClose = () => { backdrop.remove(); sheetClose = null; onClose && onClose(); };
  return sheetClose;
}

function closeSheet() { if (sheetClose) sheetClose(); }

function confirmSheet(title, sub, action, onYes, danger = true) {
  const c = el(`<div>
    <div class="sheet-title">${esc(title)}</div>
    <div class="sheet-sub">${esc(sub)}</div>
    <button class="btn btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-a="yes">${esc(action)}</button>
    <button class="btn btn-block btn-ghost mt12" data-a="no">Cancel</button>
  </div>`);
  c.querySelector('[data-a="yes"]').onclick = () => { closeSheet(); onYes(); };
  c.querySelector('[data-a="no"]').onclick = closeSheet;
  openSheet(c);
}

/* ----------------------------- router ----------------------------- */

let route = { tab: 'home', sub: null };
let tripSeg = 'itinerary'; // 'itinerary' | 'logistics' | 'tickets'
let itinDay = null;
let tickTimer = null;

function go(tab, sub = null, seg = null) {
  route = { tab, sub };
  if (seg) tripSeg = seg;
  render();
}

function render() {
  clearInterval(tickTimer);
  const v = $('#view');
  v.innerHTML = '';
  document.documentElement.dataset.theme = S.settings.theme;

  if (!S.onboarded) { v.appendChild(viewOnboard()); $('#tabbar').style.display = 'none'; return; }
  $('#tabbar').style.display = '';

  if (route.tab === 'home' && route.sub === 'packing') v.appendChild(viewPacking());
  else if (route.tab === 'home' && route.sub === 'budget') v.appendChild(viewBudget());
  else if (route.tab === 'home' && route.sub === 'info') v.appendChild(viewInfo());
  else if (route.tab === 'home' && route.sub === 'dontmiss') v.appendChild(viewDontMiss());
  else if (route.tab === 'home' && route.sub === 'checklist') v.appendChild(viewChecklist());
  else v.appendChild({ home: viewHome, trip: viewTrip, crew: viewCrew, profile: viewProfile }[route.tab]());

  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === route.tab));
  v.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ----------------------------- shared header ----------------------------- */

function pageHead(title, { logo = false } = {}) {
  const t = activeTrip();
  const r = t ? readiness(t) : null;
  const h = el(`<div class="page-head">
    <h1 class="page-title">${logo ? `<span class="logo-mark">🎪</span>` : ''}${esc(title)}</h1>
    <div class="head-actions">
      ${r ? `<span class="head-chip">${I.bolt.replace('<svg', '<svg width="18" height="18"')} ${r.done}/${r.total}</span>` : ''}
      <button class="head-bubble" data-a="about">${I.chat}</button>
    </div>
  </div>`);
  h.querySelector('[data-a="about"]').onclick = sheetAbout;
  return h;
}

function subHead(title, backTo) {
  const h = el(`<div class="page-head">
    <h1 class="page-title" style="font-size:34px;gap:14px">
      <button class="icon-btn" data-a="back" style="width:44px;height:44px">${I.back}</button>${esc(title)}
    </h1>
  </div>`);
  h.querySelector('[data-a="back"]').onclick = () => go(backTo);
  return h;
}

/* ----------------------------- onboarding ----------------------------- */

function viewOnboard() {
  const w = el(`<div class="onboard">
    <div class="ob-logo">🎪</div>
    <h1>Festiplanner</h1>
    <p>The festival trip planner. Tickets, travel, camp, money and your crew — sorted before the gates open.</p>
    <div class="field" style="text-align:left">
      <label>Your name</label>
      <input id="ob-name" placeholder="What should we call you?" autocomplete="given-name" />
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="start">Get Started</button>
  </div>`);
  w.querySelector('[data-a="start"]').onclick = () => {
    const name = w.querySelector('#ob-name').value.trim();
    if (!name) { toast('Tell us your name first'); return; }
    S.user.name = name;
    S.onboarded = true;
    save(); haptic();
    render();
    setTimeout(sheetNewTrip, 350);
  };
  return w;
}

/* ----------------------------- HOME ----------------------------- */

function viewHome() {
  const w = document.createElement('div');
  w.appendChild(pageHead('Festiplanner', { logo: true }));
  const t = activeTrip();

  if (!t) {
    const empty = el(`<div>
      <div class="card card-empty" style="min-height:240px">
        <div style="font-size:46px">🎪</div>
        <div>No trip planned yet</div>
        <button class="btn btn-primary" data-a="new">${I.plus} Plan a Festival Trip</button>
        <button class="btn btn-ghost" data-a="demo">Load demo trip</button>
      </div>
    </div>`);
    empty.querySelector('[data-a="new"]').onclick = sheetNewTrip;
    empty.querySelector('[data-a="demo"]').onclick = loadDemo;
    w.appendChild(empty);
    return w;
  }

  /* hero: countdown + readiness */
  const phase = tripPhase(t);
  const r = readiness(t);
  const crew = tripCrew(t);
  const pct = r.total ? r.done / r.total : 0;
  const C = 2 * Math.PI * 30;
  const hero = el(`<div class="fest-hero">
    <div class="fest-emoji">${t.emoji}</div>
    <div class="card-label">${I.cal} ${phase === 'live' ? 'Happening now' : phase === 'past' ? 'Wrapped' : 'Next trip'}</div>
    <div class="fest-name">${esc(t.name)} ${phase === 'live' ? '<span class="badge going">Live</span>' : ''}</div>
    <div class="fest-loc">${esc(t.location || fmtRange(t))}${t.location ? ' · ' + fmtRange(t) : ''}</div>
    ${phase === 'upcoming' ? `<div class="countdown" id="cd">
      <div class="cd-cell"><div class="n">–</div><div class="l">Days</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Hrs</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Min</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Sec</div></div>
    </div>` : ''}
    <button class="ready-strip" data-a="ready">
      <div class="ring" style="width:60px;height:60px;flex-shrink:0">
        <svg width="60" height="60" viewBox="0 0 70 70">
          <circle class="track" cx="35" cy="35" r="30" fill="none" stroke-width="6"/>
          <circle class="fill" cx="35" cy="35" r="30" fill="none" stroke-width="6"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
        </svg>
        <div class="ring-center"><div class="v" style="font-size:15px">${r.done}/${r.total}</div></div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:17px">${r.next ? 'Next up: ' + r.next.label : 'Trip fully sorted 🎉'}</div>
        <div class="muted" style="font-size:13.5px;font-weight:600;margin-top:2px">${r.done} of ${r.total} sorted · tap for checklist</div>
      </div>
      <span class="row-chev">${I.chev}</span>
    </button>
    ${crew.length ? `<div class="mt12" style="display:flex;align-items:center;gap:10px">
      <div class="avatar-stack">${crew.slice(0, 4).map(c => `<div class="avatar">${esc(c.name[0].toUpperCase())}</div>`).join('')}</div>
      <span class="muted" style="font-weight:600;font-size:14px">${crew.length} crew on this trip</span>
    </div>` : ''}
  </div>`);
  hero.querySelector('[data-a="ready"]').onclick = () => go('home', 'checklist');
  w.appendChild(hero);

  if (phase === 'upcoming') {
    const tick = () => {
      const p = countdownParts(t);
      const cd = hero.querySelector('#cd');
      if (!p || !cd) return;
      const ns = cd.querySelectorAll('.n');
      [p.d, p.h, p.m, p.s].forEach((v, i) => ns[i].textContent = v);
    };
    tick();
    tickTimer = setInterval(tick, 1000);
  }

  /* travel + stay snapshot */
  const tv = t.travel, st = t.stay;
  const grid = el(`<div class="grid-2 mt12">
    <button class="card" data-a="travel" style="text-align:left">
      <div class="card-label">${I.car} Getting there</div>
      ${tv.mode
        ? `<div class="card-big" style="font-size:21px">${TRAVEL_MODES[tv.mode]}</div>
           <div class="card-sub">${tv.departDate ? 'Set off ' + fmtDayShort(tv.departDate) + (tv.departTime ? ' · ' + fmtTime(tv.departTime) : '') : 'Departure not set'}</div>`
        : `<div class="card-big" style="font-size:21px">Not planned</div><div class="card-sub">Tap to plan travel</div>`}
    </button>
    <button class="card" data-a="stay" style="text-align:left">
      <div class="card-label">${I.bed} Staying</div>
      ${st.type
        ? `<div class="card-big" style="font-size:21px">${STAY_TYPES[st.type]}</div>
           <div class="card-sub">${esc(st.name || st.address || 'Details set')}</div>`
        : `<div class="card-big" style="font-size:21px">Not sorted</div><div class="card-sub">Tap to add your stay</div>`}
    </button>
  </div>`);
  grid.querySelector('[data-a="travel"]').onclick = () => go('trip', null, 'logistics');
  grid.querySelector('[data-a="stay"]').onclick = () => go('trip', null, 'logistics');
  w.appendChild(grid);

  /* tickets + budget snapshot */
  const myTicket = t.tickets.find(x => x.person === 'me');
  const needCount = t.tickets.filter(x => x.status === 'needed').length;
  const grid2 = el(`<div class="grid-2 mt12">
    <button class="card" data-a="tix" style="text-align:left">
      <div class="card-label">${I.ticket} Tickets</div>
      <div class="card-big" style="font-size:21px;text-transform:capitalize">${myTicket ? myTicket.status : 'Needed'}</div>
      <div class="card-sub">${needCount ? needCount + ' still needed' : 'Everyone covered'}</div>
    </button>
    <button class="card" data-a="budget" style="text-align:left">
      <div class="card-label">${I.money} My spend</div>
      <div class="card-big" style="font-size:21px">${money(myTotalSpend(t))}<small>${t.budgetCap ? ' /' + money(t.budgetCap) : ''}</small></div>
      ${t.budgetCap ? `<div class="bar"><i class="${myTotalSpend(t) > t.budgetCap ? 'over' : ''}" style="width:${Math.min(100, (myTotalSpend(t) / t.budgetCap) * 100)}%"></i></div>` : '<div class="card-sub">Tap to set a budget</div>'}
    </button>
  </div>`);
  grid2.querySelector('[data-a="tix"]').onclick = () => go('trip', null, 'tickets');
  grid2.querySelector('[data-a="budget"]').onclick = () => go('home', 'budget');
  w.appendChild(grid2);

  /* up next on the itinerary */
  const next = nextItinStop(t);
  if (next) {
    const card = el(`<div>
      <div class="section-label">Up next on the trip</div>
      <button class="card" data-a="itin" style="width:100%;text-align:left;display:flex;gap:14px;align-items:center">
        <div class="money-cat" style="font-size:21px">${ITIN_ICONS[next.kind] || '📍'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:19px;font-weight:750">${esc(next.title)}</div>
          <div class="card-sub" style="margin-top:2px">${fmtDayShort(next.day)}${next.time ? ' · ' + fmtTime(next.time) : ''}</div>
        </div>
        <span class="row-chev">${I.chev}</span>
      </button>
    </div>`);
    card.querySelector('[data-a="itin"]').onclick = () => { itinDay = next.day; go('trip', null, 'itinerary'); };
    w.appendChild(card);
  }

  /* MORE */
  const done = t.packing.filter(p => p.done).length;
  const more = el(`<div>
    <div class="section-label">More</div>
    <button class="more-row" data-a="packing"><span class="row-icon">${I.pack}</span>Packing &amp; Gear<span style="flex:1"></span><span class="muted" style="font-size:15px">${t.packing.length ? done + '/' + t.packing.length : ''}</span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="budget"><span class="row-icon">${I.money}</span>Money &amp; Splits<span style="flex:1"></span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="info"><span class="row-icon">${I.info}</span>Info Hub<span style="flex:1"></span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="dontmiss"><span class="row-icon">${I.music}</span>Don't-Miss List<span style="flex:1"></span><span class="muted" style="font-size:15px">${t.dontMiss.length || ''}</span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="crew"><span class="row-icon">${I.crew}</span>Crew &amp; Invites<span style="flex:1"></span>${S.premium ? '' : '<span class="badge gold">Pro</span>'}<span class="row-chev">${I.chev}</span></button>
  </div>`);
  more.querySelector('[data-a="packing"]').onclick = () => go('home', 'packing');
  more.querySelector('[data-a="budget"]').onclick = () => go('home', 'budget');
  more.querySelector('[data-a="info"]').onclick = () => go('home', 'info');
  more.querySelector('[data-a="dontmiss"]').onclick = () => go('home', 'dontmiss');
  more.querySelector('[data-a="crew"]').onclick = () => go('crew');
  w.appendChild(more);

  return w;
}

function nextItinStop(t) {
  const now = new Date();
  const today = isoDay(now);
  const nowT = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return t.itinerary
    .filter(s => !s.done && (s.day > today || (s.day === today && (s.time || '23:59') >= nowT)))
    .sort((a, b) => (a.day + (a.time || '00:00')).localeCompare(b.day + (b.time || '00:00')))[0] || null;
}

/* ----------------------------- READINESS CHECKLIST ----------------------------- */

function viewChecklist() {
  const w = document.createElement('div');
  w.appendChild(subHead('Checklist', 'home'));
  const t = activeTrip();
  if (!t) { go('home'); return w; }
  const r = readiness(t);

  w.appendChild(el(`<div class="card">
    <div class="card-label">${I.flag} ${esc(t.name)}</div>
    <div class="card-big">${r.done}<small> of ${r.total} sorted</small></div>
    <div class="bar"><i style="width:${(r.done / r.total) * 100}%"></i></div>
  </div>`));

  const group = el('<div class="row-group mt16"></div>');
  for (const item of r.items) {
    const row = el(`<button class="row">
      <span class="row-icon" style="font-size:21px">${item.icon}</span>
      <div class="row-body"><div class="row-title" style="${item.done ? 'color:var(--text-faint);text-decoration:line-through' : ''}">${esc(item.label)}</div></div>
      ${item.done ? `<span class="badge going">Done</span>` : `<span class="row-chev">${I.chev}</span>`}
    </button>`);
    row.onclick = item.go;
    group.appendChild(row);
  }
  w.appendChild(group);
  return w;
}

/* ----------------------------- TRIP ----------------------------- */

function viewTrip() {
  const w = document.createElement('div');
  w.appendChild(pageHead('Trip'));

  /* trip chips */
  const chips = el('<div class="chip-row"></div>');
  for (const t of S.trips) {
    const c = el(`<button class="chip ${t.id === activeTrip()?.id ? 'active' : ''}">${t.emoji} ${esc(t.name)}</button>`);
    c.onclick = () => { S.activeTripId = t.id; itinDay = null; save(); haptic(); render(); };
    chips.appendChild(c);
  }
  const add = el(`<button class="chip">＋ New</button>`);
  add.onclick = guardNewTrip;
  chips.appendChild(add);
  w.appendChild(chips);

  const t = activeTrip();
  if (!t) {
    const empty = el(`<div class="card card-empty mt16" style="min-height:220px">
      <div style="font-size:42px">🧳</div><div>Plan your first festival trip</div>
      <button class="btn btn-primary" data-a="new">${I.plus} New Trip</button>
    </div>`);
    empty.querySelector('[data-a="new"]').onclick = sheetNewTrip;
    w.appendChild(empty);
    return w;
  }

  const tog = el(`<div class="pill-toggle">
    <button data-m="itinerary" class="${tripSeg === 'itinerary' ? 'active' : ''}">Itinerary</button>
    <button data-m="logistics" class="${tripSeg === 'logistics' ? 'active' : ''}">Travel &amp; Stay</button>
    <button data-m="tickets" class="${tripSeg === 'tickets' ? 'active' : ''}">Tickets</button>
  </div>`);
  tog.querySelectorAll('button').forEach(b => b.onclick = () => { tripSeg = b.dataset.m; haptic(); render(); });
  w.appendChild(tog);

  if (tripSeg === 'itinerary') segItinerary(w, t);
  else if (tripSeg === 'logistics') segLogistics(w, t);
  else segTickets(w, t);

  return w;
}

/* --- itinerary segment --- */

function segItinerary(w, t) {
  const days = tripDays(t);
  if (!itinDay || !days.includes(itinDay)) itinDay = days[0];

  const strip = el('<div class="day-strip"></div>');
  for (const d of days) {
    const dt = toDate(d);
    const has = t.itinerary.some(s => s.day === d);
    const isFest = d >= t.start && d <= t.end;
    const cell = el(`<button class="day-cell ${d === itinDay ? 'active' : ''}">
      <div class="dow">${DOW[dt.getDay()]}</div><div class="dom">${dt.getDate()}</div>
      <div class="dot ${has ? '' : 'none'}" ${isFest ? '' : 'style="background:var(--warn)"'}></div>
    </button>`);
    cell.onclick = () => { itinDay = d; haptic(); render(); };
    strip.appendChild(cell);
  }
  w.appendChild(strip);

  const label = itinDay < t.start ? '🧳 Travel day' : itinDay > t.end ? '🧳 Heading home' : '🎪 Festival day';
  w.appendChild(el(`<div class="section-label">${label} · ${fmtDayShort(itinDay)}</div>`));

  const stops = t.itinerary.filter(s => s.day === itinDay)
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

  if (!stops.length) {
    w.appendChild(el(`<div class="empty-mini">Nothing planned for this day yet.<br/>Add stops — set off, check-in, gates open…</div>`));
  }

  for (const s of stops) {
    const card = el(`<div class="set-card">
      <div class="set-time"><div class="t">${s.time ? fmtTime(s.time) : '—'}</div><div class="d">${ITIN_ICONS[s.kind] || '📍'}</div></div>
      <div class="set-body">
        <div class="set-artist" style="${s.done ? 'color:var(--text-faint);text-decoration:line-through' : ''}">${esc(s.title)}</div>
        ${s.note ? `<div class="set-note">${esc(s.note)}</div>` : ''}
      </div>
      <button class="icon-btn ${s.done ? 'on' : ''}" data-a="done">${I.check}</button>
      <button class="icon-btn" data-a="del">${I.trash}</button>
    </div>`);
    card.querySelector('[data-a="done"]').onclick = () => { s.done = !s.done; save(); haptic(); render(); };
    card.querySelector('[data-a="del"]').onclick = () =>
      confirmSheet('Remove stop?', s.title, 'Remove', () => {
        t.itinerary = t.itinerary.filter(x => x.id !== s.id); save(); render();
      });
    w.appendChild(card);
  }

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Add Stop</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddStop(t, itinDay);
  w.appendChild(addBtn);

  if (!t.itinerary.length) {
    const starter = el(`<button class="btn btn-ghost btn-block mt12">✨ Add starter itinerary</button>`);
    starter.onclick = () => {
      const days2 = tripDays(t);
      const first = days2[0], last = days2[days2.length - 1];
      t.itinerary.push(
        { id: uid(), day: first, time: '09:00', title: 'Set off', kind: 'travel', note: 'Gas + coffee before the highway', done: false },
        { id: uid(), day: first, time: '13:00', title: 'Grocery & ice run', kind: 'food', note: '', done: false },
        { id: uid(), day: first, time: '15:00', title: 'Check in / set up camp', kind: 'stay', note: '', done: false },
        { id: uid(), day: t.start, time: '12:00', title: 'Gates open', kind: 'gate', note: 'IDs + tickets ready', done: false },
        { id: uid(), day: last, time: '10:00', title: 'Pack down & head home', kind: 'travel', note: 'Leave no trace', done: false },
      );
      save(); toast('Starter itinerary added'); render();
    };
    w.appendChild(starter);
  }
}

/* --- logistics segment (travel + stay) --- */

function segLogistics(w, t) {
  const tv = t.travel, st = t.stay;

  const travel = el(`<div class="card mt16">
    <div class="card-label">${I.car} Getting there</div>
    ${tv.mode ? `
      <div class="card-big" style="font-size:23px">${TRAVEL_MODES[tv.mode]}${tv.from ? ` <small>from ${esc(tv.from)}</small>` : ''}</div>
      <div class="kv-rows">
        ${tv.departDate ? kv('Set off', fmtDayShort(tv.departDate) + (tv.departTime ? ' · ' + fmtTime(tv.departTime) : '')) : ''}
        ${tv.returnDate ? kv('Head home', fmtDayShort(tv.returnDate) + (tv.returnTime ? ' · ' + fmtTime(tv.returnTime) : '')) : ''}
        ${tv.notes ? kv('Notes', esc(tv.notes)) : ''}
      </div>`
      : `<div class="card-empty" style="min-height:80px;font-size:16px">How is everyone getting there?</div>`}
    <button class="btn ${tv.mode ? 'btn-ghost' : 'btn-primary'} mt12" data-a="edit">${tv.mode ? 'Edit travel plan' : 'Plan travel'}</button>
  </div>`);
  travel.querySelector('[data-a="edit"]').onclick = () => sheetTravel(t);
  w.appendChild(travel);

  if (tv.mode === 'drive') {
    w.appendChild(el('<div class="section-label">🚗 Rides</div>'));
    const rg = el('<div class="card" style="padding:6px 18px"></div>');
    for (const r of tv.rides) {
      const row = el(`<div class="money-row">
        <div class="money-cat">🚗</div>
        <div class="money-body">
          <div class="money-label">${esc(r.driver)}'s car</div>
          <div class="money-sub">${esc(r.note || 'No riders listed')}</div>
        </div>
        <button class="swipe-del">${I.trash}</button>
      </div>`);
      row.querySelector('.swipe-del').onclick = () => { tv.rides = tv.rides.filter(x => x.id !== r.id); save(); render(); };
      rg.appendChild(row);
    }
    if (!tv.rides.length) rg.appendChild(el('<div class="empty-mini">No cars yet — who\'s driving?</div>'));
    w.appendChild(rg);
    const addR = el(`<div class="mt12"><button class="btn-dashed">${I.plus} Add Car</button></div>`);
    addR.querySelector('button').onclick = () => sheetRide(t);
    w.appendChild(addR);
  }

  const stay = el(`<div class="card mt16">
    <div class="card-label">${I.bed} Staying</div>
    ${st.type ? `
      <div class="card-big" style="font-size:23px">${STAY_TYPES[st.type]}${st.name ? ` <small>${esc(st.name)}</small>` : ''}</div>
      <div class="kv-rows">
        ${st.address ? kv('Address', esc(st.address)) : ''}
        ${st.checkIn ? kv('Check-in', esc(st.checkIn)) : ''}
        ${st.checkOut ? kv('Check-out', esc(st.checkOut)) : ''}
        ${st.conf ? kv('Confirmation', esc(st.conf)) : ''}
        ${st.cost ? kv('Cost', money(st.cost) + (tripCrew(t).length ? ` · ${money(st.cost / (tripCrew(t).length + 1))}/person` : '')) : ''}
        ${st.spot ? kv('📍 Our spot', esc(st.spot)) : ''}
        ${st.notes ? kv('Notes', esc(st.notes)) : ''}
      </div>`
      : `<div class="card-empty" style="min-height:80px;font-size:16px">Where is everyone sleeping?</div>`}
    <button class="btn ${st.type ? 'btn-ghost' : 'btn-primary'} mt12" data-a="edit">${st.type ? 'Edit stay' : 'Add stay'}</button>
  </div>`);
  stay.querySelector('[data-a="edit"]').onclick = () => sheetStay(t);
  w.appendChild(stay);
}

function kv(k, v) {
  return `<div class="kv"><span class="kv-k">${k}</span><span class="kv-v">${v}</span></div>`;
}

/* --- tickets segment --- */

function segTickets(w, t) {
  /* ensure a ticket row exists for me + each crew member */
  const people = ['me', ...tripCrew(t).map(f => f.id)];
  for (const p of people) {
    if (!t.tickets.some(x => x.person === p)) t.tickets.push({ id: uid(), person: p, status: 'needed', price: 0, note: '' });
  }
  t.tickets = t.tickets.filter(x => people.includes(x.person));
  save();

  const total = t.tickets.reduce((a, x) => a + (Number(x.price) || 0), 0);
  w.appendChild(el(`<div class="card mt16">
    <div class="card-label">${I.ticket} Ticket tracker</div>
    <div class="card-big">${t.tickets.filter(x => x.status !== 'needed').length}<small> / ${t.tickets.length} secured${total ? ' · ' + money(total) + ' total' : ''}</small></div>
    <div class="bar"><i style="width:${(t.tickets.filter(x => x.status !== 'needed').length / t.tickets.length) * 100}%"></i></div>
  </div>`));

  const group = el('<div class="row-group mt16"></div>');
  for (const tk of t.tickets) {
    const row = el(`<div class="row">
      <div class="avatar ${tk.person === 'me' ? 'me' : ''}" style="width:44px;height:44px;font-size:17px">${esc(personName(tk.person)[0].toUpperCase())}</div>
      <div class="row-body">
        <div class="row-title">${esc(personName(tk.person))}</div>
        <div class="row-sub">${tk.price ? money(tk.price) : 'No price set'}${tk.note ? ' · ' + esc(tk.note) : ''}</div>
      </div>
      <button class="badge ${tk.status === 'in hand' ? 'going' : tk.status === 'bought' ? 'gold' : 'conflict'}" data-a="cycle" style="border:none;cursor:pointer;padding:7px 12px;font-size:12px">${tk.status}</button>
      <button class="icon-btn" data-a="edit" style="width:34px;height:34px">${I.edit}</button>
    </div>`);
    row.querySelector('[data-a="cycle"]').onclick = () => {
      tk.status = TICKET_STATUS[(TICKET_STATUS.indexOf(tk.status) + 1) % TICKET_STATUS.length];
      save(); haptic(); render();
    };
    row.querySelector('[data-a="edit"]').onclick = () => sheetTicket(t, tk);
    group.appendChild(row);
  }
  w.appendChild(group);
  w.appendChild(el(`<div class="empty-mini" style="padding-top:18px">Tap the status to cycle: needed → bought → in hand.<br/>${S.premium ? 'Crew members get a row automatically.' : "Go Pro to track the whole crew's tickets."}</div>`));
}

/* ----------------------------- PACKING ----------------------------- */

function viewPacking() {
  const w = document.createElement('div');
  w.appendChild(subHead('Packing', 'home'));
  const t = activeTrip();
  if (!t) { go('home'); return w; }

  const done = t.packing.filter(p => p.done).length;
  w.appendChild(el(`<div class="card">
    <div class="card-label">${I.pack} ${esc(t.name)}</div>
    <div class="card-big">${done}<small> / ${t.packing.length} packed</small></div>
    <div class="bar"><i style="width:${t.packing.length ? (done / t.packing.length) * 100 : 0}%"></i></div>
  </div>`));

  /* shared gear first — the "who's bringing the tent" list */
  const shared = t.packing.filter(p => p.shared);
  if (shared.length || tripCrew(t).length) {
    w.appendChild(el(`<div class="section-label">🤝 Shared gear</div>`));
    const sg = el('<div class="card" style="padding:6px 18px"></div>');
    for (const p of shared) {
      const owner = p.assignee ? personName(p.assignee) : null;
      const row = el(`<div class="check-row ${p.done ? 'done' : ''}">
        <button class="checkbox">${I.check}</button>
        <div class="check-name">${esc(p.name)}${p.qty > 1 ? ` <span class="muted">×${p.qty}</span>` : ''}</div>
        <span class="check-meta" style="${owner ? '' : 'color:var(--bad)'}">${owner ? '@' + esc(owner) : 'unclaimed'}</span>
        <button class="swipe-del">${I.trash}</button>
      </div>`);
      row.querySelector('.checkbox').onclick = () => { p.done = !p.done; save(); haptic(); render(); };
      row.querySelector('.swipe-del').onclick = () => { t.packing = t.packing.filter(x => x.id !== p.id); save(); render(); };
      sg.appendChild(row);
    }
    if (!shared.length) sg.appendChild(el('<div class="empty-mini">Tent, canopy, cooler, speaker…<br/>add shared gear and assign an owner.</div>'));
    w.appendChild(sg);
  }

  /* personal by category */
  const cats = Object.keys(PACK_CATS).filter(c => t.packing.some(p => p.cat === c && !p.shared));
  for (const cat of cats) {
    w.appendChild(el(`<div class="section-label">${PACK_CATS[cat]} ${cat}</div>`));
    const group = el('<div class="card" style="padding:6px 18px"></div>');
    for (const p of t.packing.filter(p => p.cat === cat && !p.shared)) {
      const row = el(`<div class="check-row ${p.done ? 'done' : ''}">
        <button class="checkbox">${I.check}</button>
        <div class="check-name">${esc(p.name)}${p.qty > 1 ? ` <span class="muted">×${p.qty}</span>` : ''}</div>
        <button class="swipe-del">${I.trash}</button>
      </div>`);
      row.querySelector('.checkbox').onclick = () => { p.done = !p.done; save(); haptic(); render(); };
      row.querySelector('.swipe-del').onclick = () => { t.packing = t.packing.filter(x => x.id !== p.id); save(); render(); };
      group.appendChild(row);
    }
    w.appendChild(group);
  }

  if (!t.packing.length) {
    w.appendChild(el(`<div class="empty-mini">Your list is empty.<br/>Add gear before the group chat asks.</div>`));
  }

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Add Item</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddPacking(t);
  w.appendChild(addBtn);

  if (!t.packing.length) {
    const starter = el(`<button class="btn btn-ghost btn-block mt12">✨ Add camping starter pack</button>`);
    starter.onclick = () => {
      const items = [
        ['Wristband / ticket', 'Essentials', false], ['ID + cash', 'Essentials', false],
        ['Phone + charger', 'Tech', false], ['Power bank', 'Tech', false],
        ['Tent', 'Camping', true], ['Canopy / shade', 'Camping', true], ['Cooler + ice', 'Camping', true],
        ['Camp stove', 'Camping', true], ['Sleeping bag', 'Camping', false],
        ['Sunscreen', 'Health', false], ['Earplugs', 'Health', false], ['Refillable bottle', 'Health', false],
        ['Rain poncho', 'Clothes', false], ['Comfy shoes', 'Clothes', false], ['Fanny pack', 'Misc', false],
      ];
      for (const [name, cat, shared2] of items)
        t.packing.push({ id: uid(), name, cat, qty: 1, done: false, assignee: null, shared: shared2 });
      save(); toast('Starter pack added'); render();
    };
    w.appendChild(starter);
  }

  return w;
}

/* ----------------------------- MONEY ----------------------------- */

function viewBudget() {
  const w = document.createElement('div');
  w.appendChild(subHead('Money', 'home'));
  const t = activeTrip();
  if (!t) { go('home'); return w; }

  const mine = myTotalSpend(t);
  const left = t.budgetCap ? t.budgetCap - mine : null;
  const top = el(`<div class="card">
    <div class="card-label">${I.money} My trip cost</div>
    <div class="card-big">${money(mine)}<small>${t.budgetCap ? ' of ' + money(t.budgetCap) : ''}</small></div>
    ${t.budgetCap ? `<div class="card-sub" style="color:${left < 0 ? 'var(--bad)' : 'var(--good)'}">${left < 0 ? money(-left) + ' over budget' : money(left) + ' left'}</div>
    <div class="bar"><i class="${mine > t.budgetCap ? 'over' : ''}" style="width:${Math.min(100, (mine / t.budgetCap) * 100)}%"></i></div>` : ''}
    <div class="card-sub mt8">Your ticket + your share of shared expenses.</div>
    <button class="btn btn-ghost mt12" data-a="cap">${t.budgetCap ? 'Edit budget' : 'Set a budget'}</button>
  </div>`);
  top.querySelector('[data-a="cap"]').onclick = () => sheetBudgetCap(t);
  w.appendChild(top);

  /* settle up */
  const bal = balances(t);
  const crew = tripCrew(t);
  if (crew.length) {
    w.appendChild(el('<div class="section-label">⚖️ Settle up</div>'));
    const sg = el('<div class="card" style="padding:6px 18px"></div>');
    const entries = Object.entries(bal).filter(([, v]) => Math.abs(v) > 0.5);
    if (!entries.length) sg.appendChild(el('<div class="empty-mini">All square — no shared expenses yet.</div>'));
    for (const [pid, v] of entries) {
      sg.appendChild(el(`<div class="money-row">
        <div class="avatar ${pid === 'me' ? 'me' : ''}" style="width:42px;height:42px;font-size:16px">${esc(personName(pid)[0].toUpperCase())}</div>
        <div class="money-body"><div class="money-label">${esc(personName(pid))}</div></div>
        <div class="money-amt" style="color:${v >= 0 ? 'var(--good)' : 'var(--bad)'}">${v >= 0 ? 'gets back ' : 'owes '}${money(Math.abs(v))}</div>
      </div>`));
    }
    w.appendChild(sg);
  }

  /* expenses */
  w.appendChild(el(`<div class="section-label">Expenses</div>`));
  const list = el('<div class="card" style="padding:6px 18px"></div>');
  const sorted = [...t.expenses].sort((a, b) => b.ts - a.ts);
  for (const e of sorted) {
    const row = el(`<div class="money-row">
      <div class="money-cat">${SPEND_CATS[e.cat] || '✨'}</div>
      <div class="money-body">
        <div class="money-label">${esc(e.label)}</div>
        <div class="money-sub">${esc(personName(e.payer))} paid${e.shared ? ' · split with crew' : ''}</div>
      </div>
      <div class="money-amt">${money(e.amount)}</div>
      <button class="swipe-del">${I.trash}</button>
    </div>`);
    row.querySelector('.swipe-del').onclick = () => { t.expenses = t.expenses.filter(x => x.id !== e.id); save(); render(); };
    list.appendChild(row);
  }
  if (!sorted.length) list.appendChild(el('<div class="empty-mini">No expenses logged yet.</div>'));
  w.appendChild(list);

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Log Expense</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddExpense(t);
  w.appendChild(addBtn);
  return w;
}

/* ----------------------------- INFO HUB ----------------------------- */

function viewInfo() {
  const w = document.createElement('div');
  w.appendChild(subHead('Info Hub', 'home'));
  const t = activeTrip();
  if (!t) { go('home'); return w; }
  const inf = t.info;

  w.appendChild(el(`<div class="card">
    <div class="card-label">${I.info} The no-signal screen</div>
    <div class="card-sub" style="margin-top:0">Everything you'll frantically need at the gate, saved on your phone.</div>
  </div>`));

  const fields = [
    ['venue', '📍 Venue address', inf.venue],
    ['meet', '🚩 Meetup point', inf.meet],
    ['rules', '📋 Rules / allowed items', inf.rules],
    ['ice', '🆘 Emergency contact', inf.ice],
    ['notes', '📝 Notes', inf.notes],
  ];
  const group = el('<div class="row-group mt16"></div>');
  for (const [key, label, val] of fields) {
    const row = el(`<button class="row">
      <div class="row-body">
        <div class="row-sub" style="margin-top:0">${label}</div>
        <div class="row-title" style="margin-top:4px;${val ? '' : 'color:var(--text-faint)'}">${esc(val || 'Tap to add')}</div>
      </div>
      <span class="row-chev">${I.chev}</span>
    </button>`);
    row.onclick = () => sheetInfoField(t, key, label);
    group.appendChild(row);
  }
  w.appendChild(group);

  if (t.stay.spot) {
    w.appendChild(el(`<div class="card mt16">
      <div class="card-label">⛺️ Our spot</div>
      <div class="card-big" style="font-size:22px">${esc(t.stay.spot)}</div>
    </div>`));
  }
  return w;
}

/* ----------------------------- DON'T MISS (minor module) ----------------------------- */

function viewDontMiss() {
  const w = document.createElement('div');
  w.appendChild(subHead("Don't Miss", 'home'));
  const t = activeTrip();
  if (!t) { go('home'); return w; }

  w.appendChild(el(`<div class="card">
    <div class="card-label">${I.music} The non-negotiables</div>
    <div class="card-sub" style="margin-top:0">A short list of acts you refuse to miss. This is a trip planner — keep it to the essentials.</div>
  </div>`));

  const sorted = [...t.dontMiss].sort((a, b) => ((a.day || '') + (a.time || '')).localeCompare((b.day || '') + (b.time || '')));
  for (const s of sorted) {
    const card = el(`<div class="set-card">
      <div class="set-time"><div class="t">${s.time ? fmtTime(s.time) : '—'}</div><div class="d">${s.day ? fmtDayShort(s.day).split(' ')[0] : ''}</div></div>
      <div class="set-body">
        <div class="set-artist">${esc(s.artist)}</div>
        ${s.note ? `<div class="set-note">${esc(s.note)}</div>` : ''}
      </div>
      <button class="icon-btn" data-a="del">${I.trash}</button>
    </div>`);
    card.querySelector('[data-a="del"]').onclick = () => { t.dontMiss = t.dontMiss.filter(x => x.id !== s.id); save(); render(); };
    w.appendChild(card);
  }
  if (!sorted.length) w.appendChild(el('<div class="empty-mini">Nothing yet — add the few acts that matter.</div>'));

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Add Act</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetDontMiss(t);
  w.appendChild(addBtn);
  return w;
}

/* ----------------------------- CREW (premium) ----------------------------- */

function viewCrew() {
  const w = document.createElement('div');
  w.appendChild(pageHead('Crew'));

  if (!S.premium) {
    const lock = el(`<div class="card">
      <div class="lock-overlay">
        <div class="lo-ico">🔒</div>
        <h3>Trips are better with a crew</h3>
        <p>Invite friends, track RSVPs and everyone's tickets, split costs, and assign the shared gear.</p>
        <button class="btn btn-gold" data-a="up">${I.spark} Unlock Festiplanner Pro</button>
      </div>
    </div>
    <div class="section-label">What you get</div>
    <div class="card pw-perks" style="padding:10px 20px">
      ${perkRow('🎪', 'Unlimited festival trips', 'Plan the whole season, not just one weekend.')}
      ${perkRow('🫂', 'Invite your friends', 'RSVPs, ticket tracking and rides for the whole crew.')}
      ${perkRow('🤝', 'Shared gear & splits', 'Assign the tent, split the gas, settle up.')}
      ${perkRow('📄', 'Pro trip reports', 'Export the full plan for the group chat.')}
    </div>`);
    lock.querySelector('[data-a="up"]').onclick = sheetPaywall;
    w.appendChild(lock);
    return w;
  }

  /* invite code */
  const codeCard = el(`<div class="card">
    <div class="card-label">${I.share} Your invite code</div>
    <div class="code-box">${esc(S.inviteCode)}</div>
    <div class="grid-2" style="grid-template-columns:1fr 1fr;gap:10px">
      <button class="btn" data-a="copy">Copy</button>
      <button class="btn btn-primary" data-a="share">Share</button>
    </div>
  </div>`);
  codeCard.querySelector('[data-a="copy"]').onclick = async () => {
    try { await navigator.clipboard.writeText(S.inviteCode); toast('Code copied'); }
    catch { toast(S.inviteCode); }
  };
  codeCard.querySelector('[data-a="share"]').onclick = async () => {
    const text = `Join my festival trip on Festiplanner! Use code ${S.inviteCode}`;
    if (navigator.share) { try { await navigator.share({ text }); } catch { /* user cancelled */ } }
    else { try { await navigator.clipboard.writeText(text); toast('Invite copied'); } catch { toast(text); } }
  };
  w.appendChild(codeCard);

  /* add by code */
  const addCard = el(`<div class="card mt12">
    <div class="card-label">${I.plus.replace('stroke-width="2.4"', 'stroke-width="2"')} Add a friend</div>
    <div class="field" style="margin-top:6px"><input id="fr-code" placeholder="Friend's code or name" /></div>
    <button class="btn btn-block mt12" data-a="add">Send Invite</button>
  </div>`);
  addCard.querySelector('[data-a="add"]').onclick = () => {
    const v = addCard.querySelector('#fr-code').value.trim();
    if (!v) { toast('Enter a code or name'); return; }
    const name = v.replace(/^FP-/i, '').replace(/[^a-z0-9 ]/gi, '') || 'Friend';
    S.friends.push({ id: uid(), name: name[0].toUpperCase() + name.slice(1), status: 'invited' });
    save(); haptic(); toast('Invite sent ✉️'); render();
    const fid = S.friends[S.friends.length - 1].id;
    setTimeout(() => {
      const fr = S.friends.find(x => x.id === fid);
      if (fr && fr.status === 'invited') { fr.status = 'joined'; save(); toast(`${fr.name} joined 🎉`); if (route.tab === 'crew') render(); }
    }, 2500);
  };
  w.appendChild(addCard);

  /* friends + per-trip RSVP */
  const t = activeTrip();
  w.appendChild(el('<div class="section-label">Friends</div>'));
  const group = el('<div class="row-group"></div>');
  if (!S.friends.length) group.appendChild(el('<div class="empty-mini">No friends yet — send your code to the group chat.</div>'));
  for (const fr of S.friends) {
    const inCrew = t && t.crewIds.includes(fr.id);
    const rsvp = t ? (t.rsvp[fr.id] || (inCrew ? 'in' : '')) : '';
    const row = el(`<div class="row" style="flex-wrap:wrap">
      <div class="avatar" style="width:44px;height:44px;font-size:17px">${esc(fr.name[0].toUpperCase())}</div>
      <div class="row-body">
        <div class="row-title">${esc(fr.name)}</div>
        <div class="row-sub">${fr.status === 'invited' ? 'Invite pending…' : 'Friend'}</div>
      </div>
      <button class="swipe-del" data-a="del">${I.trash}</button>
      ${t && fr.status === 'joined' ? `<div class="seg-mini" style="width:100%;margin-top:10px;display:grid;grid-auto-columns:1fr">
        <button data-r="in" class="${rsvp === 'in' ? 'active' : ''}">✅ In</button>
        <button data-r="maybe" class="${rsvp === 'maybe' ? 'active' : ''}">🤔 Maybe</button>
        <button data-r="out" class="${rsvp === 'out' ? 'active' : ''}">❌ Out</button>
      </div>` : ''}
    </div>`);
    row.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      t.rsvp[fr.id] = b.dataset.r;
      if (b.dataset.r === 'in' && !t.crewIds.includes(fr.id)) t.crewIds.push(fr.id);
      if (b.dataset.r !== 'in') t.crewIds = t.crewIds.filter(id => id !== fr.id);
      save(); haptic(); render();
    });
    row.querySelector('[data-a="del"]').onclick = () =>
      confirmSheet('Remove friend?', `${fr.name} will be removed from all trips.`, 'Remove', () => {
        S.friends = S.friends.filter(x => x.id !== fr.id);
        for (const tr of S.trips) {
          tr.crewIds = tr.crewIds.filter(id => id !== fr.id);
          delete tr.rsvp[fr.id];
        }
        save(); render();
      });
    group.appendChild(row);
  }
  w.appendChild(group);

  if (t) {
    const crew = tripCrew(t);
    w.appendChild(el(`<div class="section-label">${esc(t.emoji)} ${esc(t.name)} crew</div>`));
    const cc = el('<div class="card" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"></div>');
    cc.appendChild(el(`<div class="avatar me">${esc((S.user.name[0] || 'Y').toUpperCase())}</div>`));
    for (const c of crew) cc.appendChild(el(`<div class="avatar">${esc(c.name[0].toUpperCase())}</div>`));
    cc.appendChild(el(`<span class="muted" style="font-weight:600">${crew.length ? `You + ${crew.length} locked in` : 'Just you so far'}</span>`));
    w.appendChild(cc);
  }

  return w;
}

function perkRow(ico, t, s) {
  return `<div class="pw-perk"><div class="pp-ico">${ico}</div><div><div class="pp-t">${t}</div><div class="pp-s">${s}</div></div></div>`;
}

/* ----------------------------- PROFILE ----------------------------- */

function viewProfile() {
  const w = document.createElement('div');
  w.appendChild(el(`<div class="page-head"><h1 class="page-title">Profile</h1></div>`));

  w.appendChild(el(`<div style="display:flex;align-items:center;gap:16px;margin:6px 4px 24px">
    <div class="avatar lg me">${esc((S.user.name[0] || '?').toUpperCase())}</div>
    <div>
      <div style="font-size:24px;font-weight:800">${esc(S.user.name || 'Festival Goer')} ${S.premium ? '<span class="badge gold">Pro</span>' : ''}</div>
      <div class="muted" style="margin-top:3px">${esc(S.user.email || 'No email set')}</div>
    </div>
  </div>`));

  w.appendChild(el('<div class="section-label">Settings</div>'));
  const g = el('<div class="row-group"></div>');

  g.appendChild(rowBtn(I.profile, 'Edit Profile', null, sheetEditProfile));
  g.appendChild(rowBtn(I.spark, S.premium ? 'Festiplanner Pro' : 'Upgrade to Pro',
    S.premium ? 'Active — thanks for the support!' : 'Unlimited trips + crew invites',
    S.premium ? () => toast('Pro is active ✨') : sheetPaywall));
  g.appendChild(rowBtn(I.crew, 'Friends', S.friends.length ? `${S.friends.length} friends` : 'Invite your crew', () => go('crew')));
  g.appendChild(rowBtn(I.doc, 'Export Trip Report', 'Download your full trip plan', exportReport));

  const notif = el(`<div class="row"><span class="row-icon">${I.bell}</span>
    <div class="row-body"><div class="row-title">Notifications</div></div>
    <button class="switch ${S.settings.notifications ? 'on' : ''}"></button></div>`);
  notif.querySelector('.switch').onclick = e => {
    S.settings.notifications = !S.settings.notifications; save(); haptic();
    e.target.classList.toggle('on', S.settings.notifications);
  };
  g.appendChild(notif);

  const appear = el(`<div class="row"><span class="row-icon">${I.moon}</span>
    <div class="row-body"><div class="row-title">Appearance</div></div>
    <div class="seg-mini">
      <button data-t="light" class="${S.settings.theme === 'light' ? 'active' : ''}">Light</button>
      <button data-t="dark" class="${S.settings.theme === 'dark' ? 'active' : ''}">Dark</button>
    </div></div>`);
  appear.querySelectorAll('.seg-mini button').forEach(b => b.onclick = () => {
    S.settings.theme = b.dataset.t; save(); haptic(); render();
  });
  g.appendChild(appear);

  const hap = el(`<div class="row"><span class="row-icon">${I.vibe}</span>
    <div class="row-body"><div class="row-title">Haptics</div></div>
    <button class="switch ${S.settings.haptics ? 'on' : ''}"></button></div>`);
  hap.querySelector('.switch').onclick = e => {
    S.settings.haptics = !S.settings.haptics; save(); haptic();
    e.target.classList.toggle('on', S.settings.haptics);
  };
  g.appendChild(hap);
  w.appendChild(g);

  /* trips management */
  w.appendChild(el('<div class="section-label">My Trips</div>'));
  const fg = el('<div class="row-group"></div>');
  if (!S.trips.length) fg.appendChild(el('<div class="empty-mini">No trips yet.</div>'));
  for (const t of S.trips) {
    const row = el(`<div class="row">
      <span class="row-icon" style="font-size:22px">${t.emoji}</span>
      <div class="row-body">
        <div class="row-title">${esc(t.name)}</div>
        <div class="row-sub">${fmtRange(t)}${t.location ? ' · ' + esc(t.location) : ''}</div>
      </div>
      <button class="swipe-del">${I.trash}</button>
    </div>`);
    row.querySelector('.swipe-del').onclick = () =>
      confirmSheet('Delete trip?', `${t.name} and all its data will be removed.`, 'Delete', () => {
        S.trips = S.trips.filter(x => x.id !== t.id);
        if (S.activeTripId === t.id) S.activeTripId = S.trips[0]?.id || null;
        save(); render();
      });
    fg.appendChild(row);
  }
  w.appendChild(fg);

  const addF = el(`<div class="mt12"><button class="btn-dashed">${I.plus} New Trip ${S.premium || !S.trips.length ? '' : '<span class="badge gold">Pro</span>'}</button></div>`);
  addF.querySelector('button').onclick = guardNewTrip;
  w.appendChild(addF);

  const danger = el(`<div class="mt24"><button class="btn btn-block btn-ghost btn-danger">Reset all data</button></div>`);
  danger.querySelector('button').onclick = () =>
    confirmSheet('Reset everything?', 'All trips, friends and settings will be erased.', 'Reset', () => {
      localStorage.removeItem(KEY); S = defaultState(); render();
    });
  w.appendChild(danger);

  w.appendChild(el('<div class="center muted mt24" style="font-size:13px;font-weight:600">Festiplanner v2.0 · Made for festival people 🎪</div>'));
  return w;
}

function rowBtn(icon, title, sub, onclick) {
  const r = el(`<button class="row">
    <span class="row-icon">${icon}</span>
    <div class="row-body"><div class="row-title">${esc(title)}</div>${sub ? `<div class="row-sub">${esc(sub)}</div>` : ''}</div>
    <span class="row-chev">${I.chev}</span>
  </button>`);
  r.onclick = onclick;
  return r;
}

/* ----------------------------- sheets ----------------------------- */

function guardNewTrip() {
  if (!S.premium && S.trips.length >= 1) { sheetPaywall(); return; }
  sheetNewTrip();
}

function sheetNewTrip() {
  let emoji = FEST_EMOJIS[0];
  const today = isoDay(new Date());
  const c = el(`<div>
    <div class="sheet-title">New Festival Trip</div>
    <div class="sheet-sub">Set it up once — plan the whole trip from here.</div>
    <div class="field"><label>Festival</label><input id="f-name" placeholder="e.g. Coachella, EDC, Bonnaroo…" /></div>
    <div class="field"><label>Location</label><input id="f-loc" placeholder="City / venue (optional)" /></div>
    <div class="field-row">
      <div class="field"><label>Starts</label><input id="f-start" type="date" value="${today}" /></div>
      <div class="field"><label>Ends</label><input id="f-end" type="date" value="${today}" /></div>
    </div>
    <div class="field"><label>My budget (optional)</label><input id="f-cap" type="number" inputmode="numeric" placeholder="$ total for the trip" /></div>
    <div class="field"><label>Vibe</label><div class="emoji-pick">${FEST_EMOJIS.map((e, i) =>
      `<button data-e="${e}" class="${i === 0 ? 'active' : ''}">${e}</button>`).join('')}</div></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Create Trip</button>
  </div>`);
  c.querySelectorAll('.emoji-pick button').forEach(b => b.onclick = () => {
    emoji = b.dataset.e;
    c.querySelectorAll('.emoji-pick button').forEach(x => x.classList.toggle('active', x === b));
  });
  c.querySelector('[data-a="save"]').onclick = () => {
    const name = c.querySelector('#f-name').value.trim();
    const start = c.querySelector('#f-start').value;
    let end = c.querySelector('#f-end').value || start;
    if (!name) { toast('Which festival?'); return; }
    if (!start) { toast('Pick a start date'); return; }
    if (end < start) end = start;
    newTrip({
      name, start, end, emoji,
      location: c.querySelector('#f-loc').value.trim(),
      budgetCap: c.querySelector('#f-cap').value,
    });
    closeSheet(); haptic(); toast(`${emoji} ${name} trip created`);
    go('home');
  };
  openSheet(c);
}

function sheetTravel(t) {
  const tv = t.travel;
  const c = el(`<div>
    <div class="sheet-title">Travel Plan</div>
    <div class="sheet-sub">${esc(t.emoji)} ${esc(t.name)}</div>
    <div class="field"><label>How</label><select id="tv-mode">
      <option value="">Choose…</option>
      ${Object.entries(TRAVEL_MODES).map(([k, v]) => `<option value="${k}" ${tv.mode === k ? 'selected' : ''}>${v}</option>`).join('')}
    </select></div>
    <div class="field"><label>From</label><input id="tv-from" value="${esc(tv.from)}" placeholder="Home city (optional)" /></div>
    <div class="field-row">
      <div class="field"><label>Set off</label><input id="tv-dd" type="date" value="${tv.departDate}" /></div>
      <div class="field"><label>Time</label><input id="tv-dt" type="time" value="${tv.departTime}" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Head home</label><input id="tv-rd" type="date" value="${tv.returnDate}" /></div>
      <div class="field"><label>Time</label><input id="tv-rt" type="time" value="${tv.returnTime}" /></div>
    </div>
    <div class="field"><label>Notes</label><input id="tv-notes" value="${esc(tv.notes)}" placeholder="Flight #s, route stops, pickup plan…" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save Travel Plan</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    tv.mode = c.querySelector('#tv-mode').value;
    tv.from = c.querySelector('#tv-from').value.trim();
    tv.departDate = c.querySelector('#tv-dd').value;
    tv.departTime = c.querySelector('#tv-dt').value;
    tv.returnDate = c.querySelector('#tv-rd').value;
    tv.returnTime = c.querySelector('#tv-rt').value;
    tv.notes = c.querySelector('#tv-notes').value.trim();
    save(); closeSheet(); haptic(); toast('Travel plan saved 🚗');
    go('trip', null, 'logistics');
  };
  openSheet(c);
}

function sheetRide(t) {
  const people = [S.user.name || 'Me', ...tripCrew(t).map(f => f.name)];
  const c = el(`<div>
    <div class="sheet-title">Add Car</div>
    <div class="field"><label>Driver</label><select id="r-driver">${people.map(p => `<option>${esc(p)}</option>`).join('')}</select></div>
    <div class="field"><label>Riders / car</label><input id="r-note" placeholder="e.g. Maya + Jake · grey 4Runner" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    t.travel.rides.push({ id: uid(), driver: c.querySelector('#r-driver').value, note: c.querySelector('#r-note').value.trim() });
    save(); closeSheet(); haptic(); render();
  };
  openSheet(c);
}

function sheetStay(t) {
  const st = t.stay;
  const c = el(`<div>
    <div class="sheet-title">Where You're Staying</div>
    <div class="sheet-sub">${esc(t.emoji)} ${esc(t.name)}</div>
    <div class="field"><label>Type</label><select id="st-type">
      <option value="">Choose…</option>
      ${Object.entries(STAY_TYPES).map(([k, v]) => `<option value="${k}" ${st.type === k ? 'selected' : ''}>${v}</option>`).join('')}
    </select></div>
    <div class="field"><label>Name</label><input id="st-name" value="${esc(st.name)}" placeholder="Campground / hotel name" /></div>
    <div class="field"><label>Address</label><input id="st-addr" value="${esc(st.address)}" placeholder="Address or lot" /></div>
    <div class="field-row">
      <div class="field"><label>Check-in</label><input id="st-in" value="${esc(st.checkIn)}" placeholder="Thu 3pm" /></div>
      <div class="field"><label>Check-out</label><input id="st-out" value="${esc(st.checkOut)}" placeholder="Mon 10am" /></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Confirmation #</label><input id="st-conf" value="${esc(st.conf)}" placeholder="ABC123" /></div>
      <div class="field"><label>Total cost</label><input id="st-cost" type="number" inputmode="numeric" value="${st.cost || ''}" placeholder="$" /></div>
    </div>
    <div class="field"><label>📍 Our spot (once you're set up)</label><input id="st-spot" value="${esc(st.spot)}" placeholder="Lot C, row 14, orange flag" /></div>
    <div class="field"><label>Notes</label><input id="st-notes" value="${esc(st.notes)}" placeholder="Quiet hours, shower tokens…" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save Stay</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    st.type = c.querySelector('#st-type').value;
    st.name = c.querySelector('#st-name').value.trim();
    st.address = c.querySelector('#st-addr').value.trim();
    st.checkIn = c.querySelector('#st-in').value.trim();
    st.checkOut = c.querySelector('#st-out').value.trim();
    st.conf = c.querySelector('#st-conf').value.trim();
    st.cost = Number(c.querySelector('#st-cost').value) || 0;
    st.spot = c.querySelector('#st-spot').value.trim();
    st.notes = c.querySelector('#st-notes').value.trim();
    save(); closeSheet(); haptic(); toast('Stay saved 🏕️');
    go('trip', null, 'logistics');
  };
  openSheet(c);
}

function sheetTicket(t, tk) {
  const c = el(`<div>
    <div class="sheet-title">${esc(personName(tk.person))}'s Ticket</div>
    <div class="field"><label>Status</label><select id="tk-status">${TICKET_STATUS.map(s =>
      `<option ${tk.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Price paid</label><input id="tk-price" type="number" inputmode="numeric" value="${tk.price || ''}" placeholder="$" /></div>
    <div class="field"><label>Note</label><input id="tk-note" value="${esc(tk.note)}" placeholder="GA+, payment plan, order #…" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    tk.status = c.querySelector('#tk-status').value;
    tk.price = Number(c.querySelector('#tk-price').value) || 0;
    tk.note = c.querySelector('#tk-note').value.trim();
    save(); closeSheet(); haptic(); render();
  };
  openSheet(c);
}

function sheetAddStop(t, day) {
  const days = tripDays(t);
  const c = el(`<div>
    <div class="sheet-title">Add Itinerary Stop</div>
    <div class="sheet-sub">${esc(t.emoji)} ${esc(t.name)}</div>
    <div class="field"><label>What</label><input id="s-title" placeholder="Set off, check-in, grocery run…" /></div>
    <div class="field"><label>Day</label><select id="s-day">${days.map(d =>
      `<option value="${d}" ${d === day ? 'selected' : ''}>${fmtDayShort(d)}</option>`).join('')}</select></div>
    <div class="field-row">
      <div class="field"><label>Time</label><input id="s-time" type="time" /></div>
      <div class="field"><label>Type</label><select id="s-kind">${Object.entries(ITIN_ICONS).map(([k, v]) =>
        `<option value="${k}">${v} ${k}</option>`).join('')}</select></div>
    </div>
    <div class="field"><label>Note</label><input id="s-note" placeholder="Optional" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add Stop</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    const title = c.querySelector('#s-title').value.trim();
    if (!title) { toast("What's the stop?"); return; }
    t.itinerary.push({
      id: uid(), title,
      day: c.querySelector('#s-day').value,
      time: c.querySelector('#s-time').value || '',
      kind: c.querySelector('#s-kind').value,
      note: c.querySelector('#s-note').value.trim(),
      done: false,
    });
    itinDay = c.querySelector('#s-day').value;
    save(); closeSheet(); haptic(); toast('Stop added 🗓️');
    if (route.tab !== 'trip') go('trip', null, 'itinerary'); else render();
  };
  openSheet(c);
}

function sheetAddPacking(t) {
  const crew = tripCrew(t);
  const c = el(`<div>
    <div class="sheet-title">Add Item</div>
    <div class="sheet-sub">${esc(t.emoji)} ${esc(t.name)} packing</div>
    <div class="field"><label>Item</label><input id="p-name" placeholder="What do you need?" /></div>
    <div class="field-row">
      <div class="field"><label>Category</label><select id="p-cat">${Object.keys(PACK_CATS).map(k =>
        `<option>${k}</option>`).join('')}</select></div>
      <div class="field"><label>Qty</label><input id="p-qty" type="number" inputmode="numeric" value="1" min="1" /></div>
    </div>
    <div class="field" style="display:flex;align-items:center;justify-content:space-between">
      <label style="margin:0">Shared gear (one per crew)</label>
      <button class="switch" id="p-shared"></button>
    </div>
    ${crew.length ? `<div class="field"><label>Who's bringing it</label>
      <select id="p-who"><option value="me">Me</option>${crew.map(fr =>
        `<option value="${fr.id}">${esc(fr.name)}</option>`).join('')}<option value="">Unclaimed</option></select></div>` : ''}
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add to List</button>
  </div>`);
  let shared = false;
  c.querySelector('#p-shared').onclick = e => { shared = !shared; e.target.classList.toggle('on', shared); };
  c.querySelector('[data-a="save"]').onclick = () => {
    const name = c.querySelector('#p-name').value.trim();
    if (!name) { toast('Name the item'); return; }
    t.packing.push({
      id: uid(), name,
      cat: c.querySelector('#p-cat').value,
      qty: Math.max(1, Number(c.querySelector('#p-qty').value) || 1),
      done: false,
      shared,
      assignee: shared ? (c.querySelector('#p-who')?.value ?? 'me') || null : null,
    });
    save(); closeSheet(); haptic(); toast('Item added 🎒');
    if (!(route.tab === 'home' && route.sub === 'packing')) go('home', 'packing'); else render();
  };
  openSheet(c);
}

function sheetAddExpense(t) {
  const crew = tripCrew(t);
  const c = el(`<div>
    <div class="sheet-title">Log Expense</div>
    <div class="sheet-sub">${esc(t.emoji)} ${esc(t.name)}</div>
    <div class="field"><label>What for</label><input id="e-label" placeholder="Gas, groceries, camp pass…" /></div>
    <div class="field-row">
      <div class="field"><label>Amount</label><input id="e-amt" type="number" inputmode="decimal" placeholder="$" /></div>
      <div class="field"><label>Category</label><select id="e-cat">${Object.keys(SPEND_CATS).map(k =>
        `<option>${k}</option>`).join('')}</select></div>
    </div>
    ${crew.length ? `
    <div class="field"><label>Who paid</label><select id="e-payer"><option value="me">Me</option>${crew.map(fr =>
      `<option value="${fr.id}">${esc(fr.name)}</option>`).join('')}</select></div>
    <div class="field" style="display:flex;align-items:center;justify-content:space-between">
      <label style="margin:0">Split evenly with crew</label>
      <button class="switch on" id="e-shared"></button>
    </div>` : ''}
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Log It</button>
  </div>`);
  let shared = crew.length > 0;
  const sw = c.querySelector('#e-shared');
  if (sw) sw.onclick = () => { shared = !shared; sw.classList.toggle('on', shared); };
  c.querySelector('[data-a="save"]').onclick = () => {
    const label = c.querySelector('#e-label').value.trim();
    const amount = Number(c.querySelector('#e-amt').value);
    if (!label) { toast('What was it for?'); return; }
    if (!amount || amount <= 0) { toast('Enter an amount'); return; }
    t.expenses.push({
      id: uid(), label, amount,
      cat: c.querySelector('#e-cat').value,
      payer: c.querySelector('#e-payer')?.value || 'me',
      shared,
      ts: Date.now(),
    });
    save(); closeSheet(); haptic(); toast('Expense logged 💸');
    if (!(route.tab === 'home' && route.sub === 'budget')) go('home', 'budget'); else render();
  };
  openSheet(c);
}

function sheetBudgetCap(t) {
  const c = el(`<div>
    <div class="sheet-title">My Trip Budget</div>
    <div class="sheet-sub">Ticket + travel + stay + everything else.</div>
    <div class="field"><label>Total budget</label><input id="b-cap" type="number" inputmode="numeric" value="${t.budgetCap || ''}" placeholder="$" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    t.budgetCap = Math.max(0, Number(c.querySelector('#b-cap').value) || 0);
    save(); closeSheet(); render();
  };
  openSheet(c);
}

function sheetInfoField(t, key, label) {
  const long = key === 'rules' || key === 'notes';
  const c = el(`<div>
    <div class="sheet-title">${label}</div>
    <div class="field">${long
      ? `<textarea id="i-val" rows="4" placeholder="Type it once, find it offline later">${esc(t.info[key])}</textarea>`
      : `<input id="i-val" value="${esc(t.info[key])}" placeholder="Type it once, find it offline later" />`}</div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    t.info[key] = c.querySelector('#i-val').value.trim();
    save(); closeSheet(); haptic(); render();
  };
  openSheet(c);
}

function sheetDontMiss(t) {
  const days = rangeDays(t.start, t.end);
  const c = el(`<div>
    <div class="sheet-title">Don't-Miss Act</div>
    <div class="field"><label>Artist</label><input id="d-artist" placeholder="Who can't you miss?" /></div>
    <div class="field-row">
      <div class="field"><label>Day</label><select id="d-day"><option value="">TBA</option>${days.map(d =>
        `<option value="${d}">${fmtDayShort(d)}</option>`).join('')}</select></div>
      <div class="field"><label>Time</label><input id="d-time" type="time" /></div>
    </div>
    <div class="field"><label>Note</label><input id="d-note" placeholder="Stage, meet spot… (optional)" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    const artist = c.querySelector('#d-artist').value.trim();
    if (!artist) { toast('Who?'); return; }
    t.dontMiss.push({
      id: uid(), artist,
      day: c.querySelector('#d-day').value,
      time: c.querySelector('#d-time').value,
      note: c.querySelector('#d-note').value.trim(),
    });
    save(); closeSheet(); haptic(); toast('Added 🎶');
    if (!(route.tab === 'home' && route.sub === 'dontmiss')) go('home', 'dontmiss'); else render();
  };
  openSheet(c);
}

function sheetEditProfile() {
  const c = el(`<div>
    <div class="sheet-title">Edit Profile</div>
    <div class="field"><label>Name</label><input id="u-name" value="${esc(S.user.name)}" /></div>
    <div class="field"><label>Email</label><input id="u-email" type="email" value="${esc(S.user.email)}" placeholder="you@email.com" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    S.user.name = c.querySelector('#u-name').value.trim() || S.user.name;
    S.user.email = c.querySelector('#u-email').value.trim();
    save(); closeSheet(); render();
  };
  openSheet(c);
}

function sheetQuickAdd() {
  const t = activeTrip();
  const c = el(`<div>
    <div class="sheet-title">Quick Add</div>
    <div class="action-grid">
      <button class="action-cell" data-a="trip"><div class="a-ico">🧳</div><div class="a-name">New Trip</div><div class="a-sub">${S.premium || !S.trips.length ? 'Plan a festival' : 'Pro feature'}</div></button>
      <button class="action-cell" data-a="stop"><div class="a-ico">🗓️</div><div class="a-name">Itinerary Stop</div><div class="a-sub">Set off, check-in…</div></button>
      <button class="action-cell" data-a="pack"><div class="a-ico">🎒</div><div class="a-name">Packing Item</div><div class="a-sub">Personal or shared</div></button>
      <button class="action-cell" data-a="exp"><div class="a-ico">💸</div><div class="a-name">Expense</div><div class="a-sub">Log &amp; split it</div></button>
      <button class="action-cell" data-a="act"><div class="a-ico">🎶</div><div class="a-name">Don't-Miss Act</div><div class="a-sub">The essentials only</div></button>
      <button class="action-cell" data-a="friend"><div class="a-ico">🫂</div><div class="a-name">Invite Friend ${S.premium ? '' : '· <span class="badge gold">Pro</span>'}</div><div class="a-sub">Build the crew</div></button>
    </div>
  </div>`);
  const need = fn => () => {
    closeSheet();
    if (!t) { toast('Plan a trip first'); sheetNewTrip(); return; }
    fn();
  };
  c.querySelector('[data-a="trip"]').onclick = () => { closeSheet(); guardNewTrip(); };
  c.querySelector('[data-a="stop"]').onclick = need(() => sheetAddStop(t, itinDay || tripDays(t)[0]));
  c.querySelector('[data-a="pack"]').onclick = need(() => sheetAddPacking(t));
  c.querySelector('[data-a="exp"]').onclick = need(() => sheetAddExpense(t));
  c.querySelector('[data-a="act"]').onclick = need(() => sheetDontMiss(t));
  c.querySelector('[data-a="friend"]').onclick = () => { closeSheet(); S.premium ? go('crew') : sheetPaywall(); };
  openSheet(c);
}

function sheetPaywall() {
  let plan = 'yearly';
  const c = el(`<div>
    <div class="paywall-hero">
      <span class="pw-badge">${I.spark.replace('<svg', '<svg width="15" height="15"')} Festiplanner Pro</span>
      <h2>The whole season.<br/>The whole crew.</h2>
      <p>Free covers one trip, solo. Pro unlocks everything else.</p>
    </div>
    <div class="pw-perks">
      ${perkRow('🎪', 'Unlimited festival trips', 'Plan every weekend on your calendar.')}
      ${perkRow('🫂', 'Friend invites & RSVPs', "Who's in, who's driving, who has tickets.")}
      ${perkRow('🤝', 'Shared gear & cost splits', 'Assign the tent. Split the gas. Settle up.')}
      ${perkRow('📄', 'Pro trip reports', 'Export the full plan for the group chat.')}
    </div>
    <div class="pw-plans">
      <button class="pw-plan" data-p="monthly">
        <div class="pl-name">Monthly</div><div class="pl-price">$4.99</div><div class="pl-per">per month</div>
      </button>
      <button class="pw-plan active" data-p="yearly">
        <div class="pl-save">Save 50%</div>
        <div class="pl-name">Yearly</div><div class="pl-price">$29.99</div><div class="pl-per">per year</div>
      </button>
    </div>
    <button class="btn btn-gold btn-block" data-a="buy">Unlock Pro</button>
    <button class="btn btn-block btn-ghost mt12" data-a="later">Maybe later</button>
    <div class="center muted mt12" style="font-size:12px">Demo build — no real charge. Tap unlock to try Pro.</div>
  </div>`);
  c.querySelectorAll('.pw-plan').forEach(b => b.onclick = () => {
    plan = b.dataset.p;
    c.querySelectorAll('.pw-plan').forEach(x => x.classList.toggle('active', x === b));
  });
  c.querySelector('[data-a="buy"]').onclick = () => {
    S.premium = true; save(); closeSheet(); haptic();
    toast(`Welcome to Pro ✨ (${plan})`);
    render();
  };
  c.querySelector('[data-a="later"]').onclick = closeSheet;
  openSheet(c);
}

function sheetAbout() {
  const c = el(`<div>
    <div class="sheet-title">🎪 Festiplanner</div>
    <div class="sheet-sub">The festival trip planner.</div>
    <div class="card" style="background:var(--card-2)">
      <p class="muted" style="margin:0;line-height:1.6;font-size:15px">
        Everything between "we bought tickets" and "we're home": crew RSVPs,
        ticket tracking, travel and rides, where you're sleeping, shared gear,
        cost splits with settle-up, the trip itinerary, and an offline info hub.
        Everything is stored on your device.
      </p>
    </div>
    <button class="btn btn-block mt16" data-a="ok">Let's go</button>
  </div>`);
  c.querySelector('[data-a="ok"]').onclick = closeSheet;
  openSheet(c);
}

/* ----------------------------- export ----------------------------- */

function exportReport() {
  const lines = [`FESTIPLANNER — TRIP REPORT`, `For: ${S.user.name}`, `Generated: ${new Date().toLocaleString()}`, ''];
  for (const t of S.trips) {
    lines.push('='.repeat(44), `${t.emoji} ${t.name.toUpperCase()} — ${fmtRange(t)}${t.location ? ' @ ' + t.location : ''}`, '');
    const crew = tripCrew(t);
    lines.push(`CREW: ${S.user.name}${crew.length ? ', ' + crew.map(c => c.name).join(', ') : ' (solo)'}`);
    lines.push('', 'TICKETS');
    for (const tk of t.tickets) lines.push(`  ${personName(tk.person)}: ${tk.status}${tk.price ? ' — ' + money(tk.price) : ''}`);
    if (t.travel.mode) {
      lines.push('', `TRAVEL — ${TRAVEL_MODES[t.travel.mode]}${t.travel.from ? ' from ' + t.travel.from : ''}`);
      if (t.travel.departDate) lines.push(`  Set off: ${fmtDayShort(t.travel.departDate)} ${fmtTime(t.travel.departTime)}`);
      if (t.travel.returnDate) lines.push(`  Return: ${fmtDayShort(t.travel.returnDate)} ${fmtTime(t.travel.returnTime)}`);
      for (const r of t.travel.rides) lines.push(`  Car: ${r.driver} — ${r.note}`);
    }
    if (t.stay.type) {
      lines.push('', `STAY — ${STAY_TYPES[t.stay.type]} ${t.stay.name}`);
      if (t.stay.address) lines.push(`  ${t.stay.address}`);
      if (t.stay.checkIn) lines.push(`  Check-in ${t.stay.checkIn} / out ${t.stay.checkOut}`);
      if (t.stay.conf) lines.push(`  Conf# ${t.stay.conf}`);
    }
    lines.push('', 'ITINERARY');
    const itin = [...t.itinerary].sort((a, b) => (a.day + (a.time || '')).localeCompare(b.day + (b.time || '')));
    if (!itin.length) lines.push('  (none)');
    for (const s of itin) lines.push(`  [${s.done ? 'x' : ' '}] ${fmtDayShort(s.day)} ${s.time ? fmtTime(s.time) : ''} — ${s.title}`);
    lines.push('', 'PACKING');
    for (const p of t.packing) lines.push(`  [${p.done ? 'x' : ' '}] ${p.name}${p.shared ? ` (shared — ${p.assignee ? personName(p.assignee) : 'unclaimed'})` : ''}`);
    lines.push('', `MONEY — my total ${money(myTotalSpend(t))}${t.budgetCap ? ' of ' + money(t.budgetCap) : ''}`);
    for (const e of t.expenses) lines.push(`  ${money(e.amount).padStart(8)}  ${e.label} — ${personName(e.payer)} paid${e.shared ? ', split' : ''}`);
    const bal = balances(t);
    for (const [pid, v] of Object.entries(bal)) if (Math.abs(v) > 0.5)
      lines.push(`  Settle: ${personName(pid)} ${v >= 0 ? 'gets back' : 'owes'} ${money(Math.abs(v))}`);
    if (t.dontMiss.length) {
      lines.push('', "DON'T MISS");
      for (const d of t.dontMiss) lines.push(`  ${d.artist}${d.day ? ' — ' + fmtDayShort(d.day) : ''} ${d.time ? fmtTime(d.time) : ''}`);
    }
    lines.push('');
  }
  if (!S.trips.length) lines.push('(no trips yet)');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'festiplanner-trip-report.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Trip report downloaded 📄');
}

/* ----------------------------- demo data ----------------------------- */

function loadDemo() {
  const base = new Date(Date.now() + 18 * DAY_MS);
  const d = n => isoDay(new Date(base.getTime() + n * DAY_MS));
  const t = newTrip({ name: 'Sunburst Valley', location: 'Indio, CA', emoji: '🌵', start: d(0), end: d(2), budgetCap: 1200 });
  t.tickets[0] = { id: uid(), person: 'me', status: 'in hand', price: 499, note: 'GA+' };
  t.travel = {
    mode: 'drive', from: 'Phoenix', departDate: d(-1), departTime: '09:00',
    returnDate: d(3), returnTime: '10:00', notes: 'Gas split via expenses', rides: [],
  };
  t.stay = {
    type: 'camping', name: 'Lakeview Campground', address: '81-800 Ave 51, Indio',
    checkIn: 'Thu 3pm', checkOut: 'Mon 10am', conf: 'SBV-2291', cost: 280,
    notes: 'Quiet hours after 2am', spot: '',
  };
  t.itinerary.push(
    { id: uid(), day: d(-1), time: '09:00', title: 'Set off from Phoenix', kind: 'travel', note: 'Gas + coffee first', done: false },
    { id: uid(), day: d(-1), time: '13:30', title: 'Grocery & ice run', kind: 'food', note: 'Costco off exit 42', done: false },
    { id: uid(), day: d(-1), time: '15:00', title: 'Check in & set up camp', kind: 'stay', note: '', done: false },
    { id: uid(), day: d(0), time: '12:00', title: 'Gates open', kind: 'gate', note: 'IDs + wristbands ready', done: false },
    { id: uid(), day: d(3), time: '10:00', title: 'Pack down & head home', kind: 'travel', note: 'Leave no trace', done: false },
  );
  t.packing.push(
    { id: uid(), name: 'Wristband', cat: 'Essentials', qty: 1, done: true, assignee: null, shared: false },
    { id: uid(), name: 'Tent', cat: 'Camping', qty: 1, done: false, assignee: 'me', shared: true },
    { id: uid(), name: 'Cooler + ice', cat: 'Camping', qty: 1, done: false, assignee: null, shared: true },
    { id: uid(), name: 'Power bank', cat: 'Tech', qty: 2, done: false, assignee: null, shared: false },
    { id: uid(), name: 'Sunscreen', cat: 'Health', qty: 1, done: false, assignee: null, shared: false },
    { id: uid(), name: 'Rain poncho', cat: 'Clothes', qty: 1, done: false, assignee: null, shared: false },
  );
  t.expenses.push(
    { id: uid(), label: 'Camping pass', amount: 280, cat: 'Stay', payer: 'me', shared: true, ts: Date.now() - 2 * DAY_MS },
    { id: uid(), label: 'Gas (est.)', amount: 90, cat: 'Travel', payer: 'me', shared: true, ts: Date.now() - DAY_MS },
  );
  t.info = {
    venue: 'Empire Polo Club, 81-800 Ave 51, Indio CA',
    meet: 'Left of the main soundboard',
    rules: 'No glass, no outside alcohol. CamelBaks OK (empty at gate).',
    ice: 'Mom — 480-555-0142',
    notes: '',
  };
  t.dontMiss.push({ id: uid(), artist: 'Night Pilots', day: d(0), time: '21:00', note: 'Main stage closer' });
  save();
  toast('Demo trip loaded 🌵');
  render();
}

/* ----------------------------- boot ----------------------------- */

document.querySelectorAll('#tabbar .tab').forEach(t => {
  const icon = t.querySelector('.tab-icon');
  icon.innerHTML = I[icon.dataset.icon];
  t.addEventListener('click', () => {
    haptic();
    if (t.dataset.tab === 'add') {
      if (!S.onboarded) return;
      sheetQuickAdd();
    } else {
      go(t.dataset.tab);
    }
  });
});

render();
