/* ============================================================
   Festiplanner
   Single-module app: state store, views, sheets, router.
   Free tier: one festival. Pro: unlimited festivals + crew.
   ============================================================ */

/* ----------------------------- icons ----------------------------- */

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l4-7 4 9 4-11 3 9h3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  crew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.7-3.4 3.4-5 6.5-5s5.8 1.6 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.3 4.4 1.8 5 4.4"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.6-4.4A8.5 8.5 0 1 1 21 12Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5S3.5 15 3.5 8.9C3.5 6 5.7 4 8.2 4c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.5 0 4.7 2 4.7 4.9 0 6.1-8.5 11.6-8.5 11.6Z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5S3.5 15 3.5 8.9C3.5 6 5.7 4 8.2 4c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.5 0 4.7 2 4.7 4.9 0 6.1-8.5 11.6-8.5 11.6Z"/></svg>',
  pack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7.5" width="16" height="13" rx="3"/><path d="M9 7.5V6a3 3 0 0 1 6 0v1.5M4 12.5h16"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15.2 8.8c-.6-1-1.8-1.6-3.2-1.6-1.8 0-3.2 1-3.2 2.5 0 3.4 6.6 1.7 6.6 5 0 1.5-1.5 2.6-3.4 2.6-1.6 0-2.9-.7-3.5-1.8"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5a6 6 0 0 1 12 0c0 5 1.7 6.5 1.7 6.5H4.3S6 14.5 6 9.5Z"/><path d="M10.3 19.5a1.9 1.9 0 0 0 3.4 0"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5ZM12.5 7.5l4 4"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 6.5 12 3l4 3.5"/><path d="M5 11v8.5h14V11"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18.5V6l11-2.5V16"/><circle cx="6.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  vibe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12h3l2.5-7 4 14 3-9 1.8 2h4.7"/></svg>',
};

const FEST_EMOJIS = ['🎪', '🎡', '🌵', '🌴', '🔥', '🦋', '🌈', '⚡️', '🍄', '🌙'];
const PACK_CATS = { Essentials: '🎟️', Camping: '⛺️', Clothes: '🧢', Tech: '🔋', Health: '🧴', Misc: '🎒' };
const SPEND_CATS = { Ticket: '🎟️', Travel: '🚐', Stay: '⛺️', Food: '🌮', Drinks: '🥤', Merch: '👕', Other: '✨' };

/* ----------------------------- store ----------------------------- */

const KEY = 'festiplanner_v1';

const defaultState = () => ({
  onboarded: false,
  user: { name: '', email: '' },
  premium: false,
  settings: { theme: 'dark', haptics: true, notifications: true },
  inviteCode: 'FP-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
  friends: [],
  festivals: [],
  activeFestivalId: null,
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

function activeFest() {
  return S.festivals.find(f => f.id === S.activeFestivalId) || S.festivals[0] || null;
}

function setActiveFest(id) { S.activeFestivalId = id; save(); }

function newFestival(data) {
  const f = {
    id: uid(),
    name: data.name,
    location: data.location || '',
    emoji: data.emoji || '🎪',
    start: data.start,
    end: data.end || data.start,
    budgetCap: Number(data.budgetCap) || 0,
    schedule: [],
    packing: [],
    expenses: [],
    crewIds: [],
  };
  S.festivals.push(f);
  S.activeFestivalId = f.id;
  save();
  return f;
}

/* ----------------------------- date utils ----------------------------- */

const DAY_MS = 86400000;
const toDate = s => new Date(s + 'T00:00:00');

function festDays(f) {
  const days = [];
  for (let t = toDate(f.start).getTime(); t <= toDate(f.end).getTime(); t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtRange(f) {
  const a = toDate(f.start), b = toDate(f.end);
  if (f.start === f.end) return `${MON[a.getMonth()]} ${a.getDate()}, ${a.getFullYear()}`;
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

function countdownParts(f) {
  const target = toDate(f.start).getTime();
  let diff = target - Date.now();
  if (diff < 0) return null;
  const d = Math.floor(diff / DAY_MS); diff -= d * DAY_MS;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

function festPhase(f) {
  const today = new Date().toISOString().slice(0, 10);
  if (today < f.start) return 'upcoming';
  if (today > f.end) return 'past';
  return 'live';
}

const money = n => '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

/* schedule conflicts: overlapping "going" sets on the same day */
function conflictsFor(f) {
  const going = f.schedule.filter(s => s.going);
  const bad = new Set();
  for (const a of going) for (const b of going) {
    if (a.id >= b.id || a.day !== b.day) continue;
    const aEnd = a.end || addHour(a.start), bEnd = b.end || addHour(b.start);
    if (a.start < bEnd && b.start < aEnd) { bad.add(a.id); bad.add(b.id); }
  }
  return bad;
}

function addHour(t) {
  const [h, m] = t.split(':').map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

/* sheets */
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
let tickTimer = null;

function go(tab, sub = null) {
  route = { tab, sub };
  render();
}

function render() {
  clearInterval(tickTimer);
  const v = $('#view');
  v.innerHTML = '';
  document.documentElement.dataset.theme = S.settings.theme;

  if (!S.onboarded) { v.appendChild(viewOnboard()); $('#tabbar').style.display = 'none'; return; }
  $('#tabbar').style.display = '';

  const views = { home: viewHome, plan: viewPlan, crew: viewCrew, profile: viewProfile };
  if (route.tab === 'home' && route.sub === 'packing') v.appendChild(viewPacking());
  else if (route.tab === 'home' && route.sub === 'budget') v.appendChild(viewBudget());
  else v.appendChild(views[route.tab]());

  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === route.tab));
  v.scrollTop = 0;
  window.scrollTo(0, 0);
}

/* ----------------------------- shared header ----------------------------- */

function pageHead(title, { logo = false } = {}) {
  const f = activeFest();
  const goingCount = f ? f.schedule.filter(s => s.going).length : 0;
  const h = el(`<div class="page-head">
    <h1 class="page-title">${logo ? `<span class="logo-mark">🎪</span>` : ''}${esc(title)}</h1>
    <div class="head-actions">
      <span class="head-chip">${I.bolt.replace('<svg', '<svg width="18" height="18"')} ${goingCount}</span>
      <button class="head-bubble" data-a="about">${I.chat}</button>
    </div>
  </div>`);
  h.querySelector('[data-a="about"]').onclick = sheetAbout;
  return h;
}

/* ----------------------------- onboarding ----------------------------- */

function viewOnboard() {
  const w = el(`<div class="onboard">
    <div class="ob-logo">🎪</div>
    <h1>Festiplanner</h1>
    <p>Plan every festival like a pro. Schedules, packing, budget and your crew — in one place.</p>
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
    setTimeout(sheetNewFestival, 350);
  };
  return w;
}

/* ----------------------------- HOME ----------------------------- */

function viewHome() {
  const w = document.createElement('div');
  w.appendChild(pageHead('Festiplanner', { logo: true }));
  const f = activeFest();

  if (!f) {
    const empty = el(`<div>
      <div class="card card-empty" style="min-height:240px">
        <div style="font-size:46px">🎪</div>
        <div>No festival yet</div>
        <button class="btn btn-primary" data-a="new">${I.plus} Create Festival</button>
        <button class="btn btn-ghost" data-a="demo">Load demo data</button>
      </div>
    </div>`);
    empty.querySelector('[data-a="new"]').onclick = sheetNewFestival;
    empty.querySelector('[data-a="demo"]').onclick = loadDemo;
    w.appendChild(empty);
    return w;
  }

  /* hero with live countdown */
  const phase = festPhase(f);
  const crew = S.friends.filter(fr => f.crewIds.includes(fr.id));
  const hero = el(`<div class="fest-hero">
    <div class="fest-emoji">${f.emoji}</div>
    <div class="card-label">${I.cal} ${phase === 'live' ? 'Happening now' : phase === 'past' ? 'Wrapped' : 'Next festival'}</div>
    <div class="fest-name">${esc(f.name)} ${phase === 'live' ? '<span class="badge going">Live</span>' : ''}</div>
    <div class="fest-loc">${esc(f.location || fmtRange(f))}${f.location ? ' · ' + fmtRange(f) : ''}</div>
    ${phase === 'upcoming' ? `<div class="countdown" id="cd">
      <div class="cd-cell"><div class="n">–</div><div class="l">Days</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Hrs</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Min</div></div>
      <div class="cd-cell"><div class="n">–</div><div class="l">Sec</div></div>
    </div>` : ''}
    ${crew.length ? `<div class="mt16" style="display:flex;align-items:center;gap:10px">
      <div class="avatar-stack">${crew.slice(0, 4).map(c => `<div class="avatar">${esc(c.name[0].toUpperCase())}</div>`).join('')}</div>
      <span class="muted" style="font-weight:600;font-size:14px">${crew.length} in your crew</span>
    </div>` : ''}
  </div>`);
  w.appendChild(hero);

  if (phase === 'upcoming') {
    const tick = () => {
      const p = countdownParts(f);
      const cd = hero.querySelector('#cd');
      if (!p || !cd) return;
      const ns = cd.querySelectorAll('.n');
      [p.d, p.h, p.m, p.s].forEach((v, i) => ns[i].textContent = v);
    };
    tick();
    tickTimer = setInterval(tick, 1000);
  }

  /* up next + budget */
  const next = nextGoingSet(f);
  const spent = f.expenses.reduce((a, e) => a + e.amount, 0);
  const grid = el(`<div class="grid-2 mt12">
    <div class="card">
      <div class="card-label">${I.music} Up Next</div>
      ${next
        ? `<div class="card-big" style="font-size:24px">${esc(next.artist)}</div>
           <div class="card-sub">${fmtDayShort(next.day)} · ${fmtTime(next.start)}${next.stage ? ' · ' + esc(next.stage) : ''}</div>`
        : `<div class="card-big" style="font-size:24px">No sets<br/>planned</div>`}
    </div>
    <button class="card" data-a="budget" style="text-align:left">
      <div class="card-label">${I.money} Budget</div>
      <div class="card-big" style="font-size:26px">${money(spent)}<small>${f.budgetCap ? ' /' + money(f.budgetCap) : ''}</small></div>
      ${f.budgetCap ? `<div class="bar"><i class="${spent > f.budgetCap ? 'over' : ''}" style="width:${Math.min(100, (spent / f.budgetCap) * 100)}%"></i></div>` : '<div class="card-sub">Tap to track spend</div>'}
    </button>
  </div>`);
  grid.querySelector('[data-a="budget"]').onclick = () => go('home', 'budget');
  w.appendChild(grid);

  /* packing snapshot */
  const done = f.packing.filter(p => p.done).length, total = f.packing.length;
  const pct = total ? done / total : 0;
  const C = 2 * Math.PI * 62;
  const packCard = el(`<div>
    <div class="section-label">Packing</div>
    <button class="card" data-a="pack" style="width:100%;text-align:left;display:flex;align-items:center;gap:18px">
      <div class="ring" style="width:104px;height:104px;flex-shrink:0">
        <svg width="104" height="104" viewBox="0 0 140 140">
          <circle class="track" cx="70" cy="70" r="62" fill="none" stroke-width="11"/>
          <circle class="fill" cx="70" cy="70" r="62" fill="none" stroke-width="11"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
        </svg>
        <div class="ring-center"><div class="v" style="font-size:24px">${total ? Math.round(pct * 100) + '%' : '—'}</div></div>
      </div>
      <div style="flex:1">
        <div class="card-big" style="font-size:23px">${total ? `${done} of ${total} packed` : 'Nothing on your list'}</div>
        <div class="card-sub">${total ? 'Keep it going — tap to open your list' : 'Tap to start your packing list'}</div>
      </div>
      <span class="row-chev">${I.chev}</span>
    </button>
  </div>`);
  packCard.querySelector('[data-a="pack"]').onclick = () => go('home', 'packing');
  w.appendChild(packCard);

  /* MORE */
  const more = el(`<div>
    <div class="section-label">More</div>
    <button class="more-row" data-a="packing"><span class="row-icon">${I.pack}</span>Packing List<span style="flex:1"></span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="budget"><span class="row-icon">${I.money}</span>Budget Tracker<span style="flex:1"></span><span class="row-chev">${I.chev}</span></button>
    <button class="more-row" data-a="crew"><span class="row-icon">${I.crew}</span>Crew &amp; Invites<span style="flex:1"></span>${S.premium ? '' : '<span class="badge gold">Pro</span>'}<span class="row-chev">${I.chev}</span></button>
  </div>`);
  more.querySelector('[data-a="packing"]').onclick = () => go('home', 'packing');
  more.querySelector('[data-a="budget"]').onclick = () => go('home', 'budget');
  more.querySelector('[data-a="crew"]').onclick = () => go('crew');
  w.appendChild(more);

  return w;
}

function nextGoingSet(f) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const nowT = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return f.schedule
    .filter(s => s.going && (s.day > today || (s.day === today && s.start >= nowT)))
    .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start))[0] || null;
}

/* ----------------------------- PLAN ----------------------------- */

let planMode = 'schedule'; // 'schedule' | 'lineup'
let planDay = null;

function viewPlan() {
  const w = document.createElement('div');
  w.appendChild(pageHead('Plan'));

  /* festival chips */
  const chips = el('<div class="chip-row"></div>');
  for (const f of S.festivals) {
    const c = el(`<button class="chip ${f.id === activeFest()?.id ? 'active' : ''}">${f.emoji} ${esc(f.name)}</button>`);
    c.onclick = () => { setActiveFest(f.id); planDay = null; haptic(); render(); };
    chips.appendChild(c);
  }
  const add = el(`<button class="chip">＋ New</button>`);
  add.onclick = guardNewFestival;
  chips.appendChild(add);
  w.appendChild(chips);

  const f = activeFest();
  if (!f) {
    const empty = el(`<div class="card card-empty mt16" style="min-height:220px">
      <div style="font-size:42px">🗓️</div><div>Create a festival to start planning</div>
      <button class="btn btn-primary" data-a="new">${I.plus} Create Festival</button>
    </div>`);
    empty.querySelector('[data-a="new"]').onclick = sheetNewFestival;
    w.appendChild(empty);
    return w;
  }

  /* mode toggle */
  const tog = el(`<div class="pill-toggle">
    <button data-m="schedule" class="${planMode === 'schedule' ? 'active' : ''}">My Schedule</button>
    <button data-m="lineup" class="${planMode === 'lineup' ? 'active' : ''}">Full Lineup</button>
  </div>`);
  tog.querySelectorAll('button').forEach(b => b.onclick = () => { planMode = b.dataset.m; haptic(); render(); });
  w.appendChild(tog);

  /* day strip */
  const days = festDays(f);
  if (!planDay || !days.includes(planDay)) planDay = days[0];
  const strip = el('<div class="day-strip"></div>');
  for (const d of days) {
    const dt = toDate(d);
    const has = f.schedule.some(s => s.day === d && (planMode === 'lineup' || s.going));
    const cell = el(`<button class="day-cell ${d === planDay ? 'active' : ''}">
      <div class="dow">${DOW[dt.getDay()]}</div><div class="dom">${dt.getDate()}</div>
      <div class="dot ${has ? '' : 'none'}"></div>
    </button>`);
    cell.onclick = () => { planDay = d; haptic(); render(); };
    strip.appendChild(cell);
  }
  w.appendChild(strip);

  /* sets */
  const conflicts = conflictsFor(f);
  let sets = f.schedule
    .filter(s => s.day === planDay && (planMode === 'lineup' || s.going))
    .sort((a, b) => a.start.localeCompare(b.start));

  if (!sets.length) {
    w.appendChild(el(`<div class="empty-mini">${planMode === 'schedule'
      ? 'Nothing on your schedule for this day.<br/>Heart sets in the lineup or add one below.'
      : 'No sets added for this day yet.'}</div>`));
  }

  for (const s of sets) {
    const isConflict = s.going && conflicts.has(s.id);
    const card = el(`<div class="set-card ${s.going ? 'is-going' : ''}">
      <div class="set-time"><div class="t">${fmtTime(s.start)}</div><div class="d">${s.end ? '→ ' + fmtTime(s.end) : ''}</div></div>
      <div class="set-body">
        <div class="set-artist">${esc(s.artist)} ${isConflict ? '<span class="badge conflict">Clash</span>' : ''}</div>
        ${s.stage ? `<div class="set-stage">${esc(s.stage)}</div>` : ''}
        ${s.note ? `<div class="set-note">${esc(s.note)}</div>` : ''}
      </div>
      <button class="icon-btn ${s.going ? 'on' : ''}" data-a="go">${s.going ? I.heartFill : I.heart}</button>
      <button class="icon-btn" data-a="del">${I.trash}</button>
    </div>`);
    card.querySelector('[data-a="go"]').onclick = () => { s.going = !s.going; save(); haptic(); render(); };
    card.querySelector('[data-a="del"]').onclick = () =>
      confirmSheet('Remove set?', `${s.artist} · ${fmtTime(s.start)}`, 'Remove', () => {
        f.schedule = f.schedule.filter(x => x.id !== s.id); save(); render();
      });
    w.appendChild(card);
  }

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Add Set</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddSet(f, planDay);
  w.appendChild(addBtn);

  return w;
}

/* ----------------------------- PACKING ----------------------------- */

function subHead(title, backTo) {
  const h = el(`<div class="page-head">
    <h1 class="page-title" style="font-size:34px;gap:14px">
      <button class="icon-btn" data-a="back" style="width:44px;height:44px">${I.back}</button>${esc(title)}
    </h1>
  </div>`);
  h.querySelector('[data-a="back"]').onclick = () => go(backTo);
  return h;
}

function viewPacking() {
  const w = document.createElement('div');
  w.appendChild(subHead('Packing', 'home'));
  const f = activeFest();
  if (!f) { go('home'); return w; }

  const done = f.packing.filter(p => p.done).length;
  w.appendChild(el(`<div class="card">
    <div class="card-label">${I.pack} ${esc(f.name)}</div>
    <div class="card-big">${done}<small> / ${f.packing.length} packed</small></div>
    <div class="bar"><i style="width:${f.packing.length ? (done / f.packing.length) * 100 : 0}%"></i></div>
  </div>`));

  const cats = Object.keys(PACK_CATS).filter(c => f.packing.some(p => p.cat === c));
  for (const cat of cats) {
    w.appendChild(el(`<div class="section-label">${PACK_CATS[cat]} ${cat}</div>`));
    const group = el('<div class="card" style="padding:6px 18px"></div>');
    for (const p of f.packing.filter(p => p.cat === cat)) {
      const assignee = S.friends.find(fr => fr.id === p.assignee);
      const row = el(`<div class="check-row ${p.done ? 'done' : ''}">
        <button class="checkbox">${I.check}</button>
        <div class="check-name">${esc(p.name)}${p.qty > 1 ? ` <span class="muted">×${p.qty}</span>` : ''}</div>
        ${assignee ? `<span class="check-meta">@${esc(assignee.name)}</span>` : ''}
        <button class="swipe-del">${I.trash}</button>
      </div>`);
      row.querySelector('.checkbox').onclick = () => { p.done = !p.done; save(); haptic(); render(); };
      row.querySelector('.swipe-del').onclick = () => { f.packing = f.packing.filter(x => x.id !== p.id); save(); render(); };
      group.appendChild(row);
    }
    w.appendChild(group);
  }

  if (!f.packing.length) {
    w.appendChild(el(`<div class="empty-mini">Your list is empty.<br/>Add essentials before the gates open.</div>`));
  }

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Add Item</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddPacking(f);
  w.appendChild(addBtn);

  if (!f.packing.length) {
    const starter = el(`<button class="btn btn-ghost btn-block mt12">✨ Add starter pack (12 essentials)</button>`);
    starter.onclick = () => {
      const items = [
        ['Wristband / ticket', 'Essentials'], ['ID + cash', 'Essentials'], ['Phone + charger', 'Tech'],
        ['Power bank', 'Tech'], ['Tent', 'Camping'], ['Sleeping bag', 'Camping'],
        ['Sunscreen', 'Health'], ['Earplugs', 'Health'], ['Refillable bottle', 'Health'],
        ['Rain poncho', 'Clothes'], ['Comfy shoes', 'Clothes'], ['Fanny pack', 'Misc'],
      ];
      for (const [name, cat] of items) f.packing.push({ id: uid(), name, cat, qty: 1, done: false, assignee: null });
      save(); toast('Starter pack added'); render();
    };
    w.appendChild(starter);
  }

  return w;
}

/* ----------------------------- BUDGET ----------------------------- */

function viewBudget() {
  const w = document.createElement('div');
  w.appendChild(subHead('Budget', 'home'));
  const f = activeFest();
  if (!f) { go('home'); return w; }

  const spent = f.expenses.reduce((a, e) => a + e.amount, 0);
  const left = f.budgetCap ? f.budgetCap - spent : null;
  const top = el(`<div class="card">
    <div class="card-label">${I.money} ${esc(f.name)}</div>
    <div class="card-big">${money(spent)}<small>${f.budgetCap ? ' of ' + money(f.budgetCap) : ' spent'}</small></div>
    ${f.budgetCap ? `<div class="card-sub" style="color:${left < 0 ? 'var(--bad)' : 'var(--good)'}">${left < 0 ? money(-left) + ' over budget' : money(left) + ' left to spend'}</div>
    <div class="bar"><i class="${spent > f.budgetCap ? 'over' : ''}" style="width:${Math.min(100, (spent / f.budgetCap) * 100)}%"></i></div>` : ''}
    <button class="btn btn-ghost mt16" data-a="cap">${f.budgetCap ? 'Edit budget' : 'Set a budget'}</button>
  </div>`);
  top.querySelector('[data-a="cap"]').onclick = () => sheetBudgetCap(f);
  w.appendChild(top);

  /* per-category breakdown */
  const byCat = {};
  for (const e of f.expenses) byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
  const catKeys = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  if (catKeys.length) {
    w.appendChild(el(`<div class="section-label">By category</div>`));
    const cc = el('<div class="chip-row"></div>');
    for (const c of catKeys) cc.appendChild(el(`<span class="chip">${SPEND_CATS[c] || '✨'} ${c} · ${money(byCat[c])}</span>`));
    w.appendChild(cc);
  }

  w.appendChild(el(`<div class="section-label">Expenses</div>`));
  const list = el('<div class="card" style="padding:6px 18px"></div>');
  const sorted = [...f.expenses].sort((a, b) => b.ts - a.ts);
  for (const e of sorted) {
    const row = el(`<div class="money-row">
      <div class="money-cat">${SPEND_CATS[e.cat] || '✨'}</div>
      <div class="money-body">
        <div class="money-label">${esc(e.label)}</div>
        <div class="money-sub">${e.cat}</div>
      </div>
      <div class="money-amt">${money(e.amount)}</div>
      <button class="swipe-del">${I.trash}</button>
    </div>`);
    row.querySelector('.swipe-del').onclick = () => { f.expenses = f.expenses.filter(x => x.id !== e.id); save(); render(); };
    list.appendChild(row);
  }
  if (!sorted.length) list.appendChild(el('<div class="empty-mini">No expenses logged yet.</div>'));
  w.appendChild(list);

  const addBtn = el(`<div class="mt16"><button class="btn-dashed">${I.plus} Log Expense</button></div>`);
  addBtn.querySelector('button').onclick = () => sheetAddExpense(f);
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
        <h3>Your crew runs on Pro</h3>
        <p>Invite friends, build a shared crew per festival, and split the packing list together.</p>
        <button class="btn btn-gold" data-a="up">${I.spark} Unlock Festiplanner Pro</button>
      </div>
    </div>
    <div class="section-label">What you get</div>
    <div class="card pw-perks" style="padding:10px 20px">
      ${perkRow('🎪', 'Unlimited festivals', 'Plan every weekend of the season, not just one.')}
      ${perkRow('🫂', 'Invite your friends', 'Share a code, build your crew, see who’s in.')}
      ${perkRow('🎒', 'Shared packing', 'Assign items so the tent never gets forgotten.')}
      ${perkRow('📄', 'Pro reports', 'Export full trip reports for the group chat.')}
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
    const text = `Join my festival crew on Festiplanner! Use code ${S.inviteCode}`;
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
    /* simulate the friend accepting shortly after */
    const fid = S.friends[S.friends.length - 1].id;
    setTimeout(() => {
      const fr = S.friends.find(x => x.id === fid);
      if (fr && fr.status === 'invited') { fr.status = 'joined'; save(); toast(`${fr.name} joined your crew 🎉`); if (route.tab === 'crew') render(); }
    }, 2500);
  };
  w.appendChild(addCard);

  /* friends list */
  w.appendChild(el('<div class="section-label">Friends</div>'));
  const f = activeFest();
  const group = el('<div class="row-group"></div>');
  if (!S.friends.length) group.appendChild(el('<div class="empty-mini">No friends yet — send your code to the group chat.</div>'));
  for (const fr of S.friends) {
    const inCrew = f && f.crewIds.includes(fr.id);
    const row = el(`<div class="row">
      <div class="avatar" style="width:44px;height:44px;font-size:17px">${esc(fr.name[0].toUpperCase())}</div>
      <div class="row-body">
        <div class="row-title">${esc(fr.name)}</div>
        <div class="row-sub">${fr.status === 'invited' ? 'Invite pending…' : 'In your friends'}</div>
      </div>
      ${f && fr.status === 'joined' ? `<button class="btn ${inCrew ? '' : 'btn-ghost'}" data-a="crew" style="padding:9px 16px;font-size:14px">${inCrew ? '✓ ' + esc(f.emoji) + ' Crew' : 'Add to crew'}</button>` : ''}
      <button class="swipe-del" data-a="del">${I.trash}</button>
    </div>`);
    const cb = row.querySelector('[data-a="crew"]');
    if (cb) cb.onclick = () => {
      f.crewIds = inCrew ? f.crewIds.filter(id => id !== fr.id) : [...f.crewIds, fr.id];
      save(); haptic(); render();
    };
    row.querySelector('[data-a="del"]').onclick = () =>
      confirmSheet('Remove friend?', `${fr.name} will be removed from all crews.`, 'Remove', () => {
        S.friends = S.friends.filter(x => x.id !== fr.id);
        for (const fest of S.festivals) fest.crewIds = fest.crewIds.filter(id => id !== fr.id);
        save(); render();
      });
    group.appendChild(row);
  }
  w.appendChild(group);

  if (f) {
    const crew = S.friends.filter(fr => f.crewIds.includes(fr.id));
    w.appendChild(el(`<div class="section-label">${esc(f.emoji)} ${esc(f.name)} crew</div>`));
    const cc = el('<div class="card" style="display:flex;align-items:center;gap:14px"></div>');
    cc.appendChild(el(`<div class="avatar me">${esc((S.user.name[0] || 'Y').toUpperCase())}</div>`));
    for (const c of crew) cc.appendChild(el(`<div class="avatar">${esc(c.name[0].toUpperCase())}</div>`));
    cc.appendChild(el(`<span class="muted" style="font-weight:600">${crew.length ? `You + ${crew.length} going` : 'Just you so far'}</span>`));
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

  const idCard = el(`<div style="display:flex;align-items:center;gap:16px;margin:6px 4px 24px">
    <div class="avatar lg me">${esc((S.user.name[0] || '?').toUpperCase())}</div>
    <div>
      <div style="font-size:24px;font-weight:800">${esc(S.user.name || 'Festival Goer')} ${S.premium ? '<span class="badge gold">Pro</span>' : ''}</div>
      <div class="muted" style="margin-top:3px">${esc(S.user.email || 'No email set')}</div>
    </div>
  </div>`);
  w.appendChild(idCard);

  w.appendChild(el('<div class="section-label">Settings</div>'));
  const g = el('<div class="row-group"></div>');

  g.appendChild(rowBtn(I.profile, 'Edit Profile', null, sheetEditProfile));
  g.appendChild(rowBtn(I.spark, S.premium ? 'Festiplanner Pro' : 'Upgrade to Pro',
    S.premium ? 'Active — thanks for the support!' : 'Unlimited festivals + crew invites',
    S.premium ? () => toast('Pro is active ✨') : sheetPaywall));
  g.appendChild(rowBtn(I.crew, 'Friends', S.friends.length ? `${S.friends.length} friends` : 'Invite your crew', () => go('crew')));
  g.appendChild(rowBtn(I.doc, 'Export Report', 'Download your festival data', exportReport));

  /* notifications switch */
  const notif = el(`<div class="row"><span class="row-icon">${I.bell}</span>
    <div class="row-body"><div class="row-title">Notifications</div></div>
    <button class="switch ${S.settings.notifications ? 'on' : ''}"></button></div>`);
  notif.querySelector('.switch').onclick = e => {
    S.settings.notifications = !S.settings.notifications; save(); haptic();
    e.target.classList.toggle('on', S.settings.notifications);
  };
  g.appendChild(notif);

  /* appearance */
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

  /* haptics */
  const hap = el(`<div class="row"><span class="row-icon">${I.vibe}</span>
    <div class="row-body"><div class="row-title">Haptics</div></div>
    <button class="switch ${S.settings.haptics ? 'on' : ''}"></button></div>`);
  hap.querySelector('.switch').onclick = e => {
    S.settings.haptics = !S.settings.haptics; save(); haptic();
    e.target.classList.toggle('on', S.settings.haptics);
  };
  g.appendChild(hap);
  w.appendChild(g);

  /* festivals management */
  w.appendChild(el('<div class="section-label">My Festivals</div>'));
  const fg = el('<div class="row-group"></div>');
  if (!S.festivals.length) fg.appendChild(el('<div class="empty-mini">No festivals yet.</div>'));
  for (const f of S.festivals) {
    const row = el(`<div class="row">
      <span class="row-icon" style="font-size:22px">${f.emoji}</span>
      <div class="row-body">
        <div class="row-title">${esc(f.name)}</div>
        <div class="row-sub">${fmtRange(f)}${f.location ? ' · ' + esc(f.location) : ''}</div>
      </div>
      <button class="swipe-del">${I.trash}</button>
    </div>`);
    row.querySelector('.swipe-del').onclick = () =>
      confirmSheet('Delete festival?', `${f.name} and all its data will be removed.`, 'Delete', () => {
        S.festivals = S.festivals.filter(x => x.id !== f.id);
        if (S.activeFestivalId === f.id) S.activeFestivalId = S.festivals[0]?.id || null;
        save(); render();
      });
    fg.appendChild(row);
  }
  w.appendChild(fg);

  const addF = el(`<div class="mt12"><button class="btn-dashed">${I.plus} Add Festival ${S.premium || !S.festivals.length ? '' : '<span class="badge gold">Pro</span>'}</button></div>`);
  addF.querySelector('button').onclick = guardNewFestival;
  w.appendChild(addF);

  const danger = el(`<div class="mt24"><button class="btn btn-block btn-ghost btn-danger">Reset all data</button></div>`);
  danger.querySelector('button').onclick = () =>
    confirmSheet('Reset everything?', 'All festivals, friends and settings will be erased.', 'Reset', () => {
      localStorage.removeItem(KEY); S = defaultState(); render();
    });
  w.appendChild(danger);

  w.appendChild(el('<div class="center muted mt24" style="font-size:13px;font-weight:600">Festiplanner v1.0 · Made for festival people 🎪</div>'));
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

function guardNewFestival() {
  if (!S.premium && S.festivals.length >= 1) { sheetPaywall(); return; }
  sheetNewFestival();
}

function sheetNewFestival() {
  let emoji = FEST_EMOJIS[0];
  const today = new Date().toISOString().slice(0, 10);
  const c = el(`<div>
    <div class="sheet-title">New Festival</div>
    <div class="sheet-sub">Set it up once — plan everything from here.</div>
    <div class="field"><label>Name</label><input id="f-name" placeholder="e.g. Coachella, EDC, Glasto…" /></div>
    <div class="field"><label>Location</label><input id="f-loc" placeholder="City / venue (optional)" /></div>
    <div class="field-row">
      <div class="field"><label>Starts</label><input id="f-start" type="date" min="2000-01-01" value="${today}" /></div>
      <div class="field"><label>Ends</label><input id="f-end" type="date" min="2000-01-01" value="${today}" /></div>
    </div>
    <div class="field"><label>Budget (optional)</label><input id="f-cap" type="number" inputmode="numeric" placeholder="$ total budget" /></div>
    <div class="field"><label>Vibe</label><div class="emoji-pick">${FEST_EMOJIS.map((e, i) =>
      `<button data-e="${e}" class="${i === 0 ? 'active' : ''}">${e}</button>`).join('')}</div></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Create Festival</button>
  </div>`);
  c.querySelectorAll('.emoji-pick button').forEach(b => b.onclick = () => {
    emoji = b.dataset.e;
    c.querySelectorAll('.emoji-pick button').forEach(x => x.classList.toggle('active', x === b));
  });
  c.querySelector('[data-a="save"]').onclick = () => {
    const name = c.querySelector('#f-name').value.trim();
    const start = c.querySelector('#f-start').value;
    let end = c.querySelector('#f-end').value || start;
    if (!name) { toast('Give it a name'); return; }
    if (!start) { toast('Pick a start date'); return; }
    if (end < start) end = start;
    newFestival({
      name, start, end, emoji,
      location: c.querySelector('#f-loc').value.trim(),
      budgetCap: c.querySelector('#f-cap').value,
    });
    closeSheet(); haptic(); toast(`${emoji} ${name} created`);
    go('plan');
  };
  openSheet(c);
}

function sheetAddSet(f, day) {
  const days = festDays(f);
  const c = el(`<div>
    <div class="sheet-title">Add Set</div>
    <div class="sheet-sub">${esc(f.emoji)} ${esc(f.name)}</div>
    <div class="field"><label>Artist / event</label><input id="s-artist" placeholder="Who's playing?" /></div>
    <div class="field"><label>Day</label><select id="s-day">${days.map(d =>
      `<option value="${d}" ${d === day ? 'selected' : ''}>${fmtDayShort(d)}</option>`).join('')}</select></div>
    <div class="field-row">
      <div class="field"><label>Starts</label><input id="s-start" type="time" value="18:00" /></div>
      <div class="field"><label>Ends</label><input id="s-end" type="time" /></div>
    </div>
    <div class="field"><label>Stage</label><input id="s-stage" placeholder="Main Stage, Yuma, Tent 3… (optional)" /></div>
    <div class="field"><label>Note</label><input id="s-note" placeholder="Meet at the left rail… (optional)" /></div>
    <div class="field" style="display:flex;align-items:center;justify-content:space-between">
      <label style="margin:0">I'm going</label>
      <button class="switch on" id="s-going"></button>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add to Lineup</button>
  </div>`);
  let going = true;
  c.querySelector('#s-going').onclick = e => { going = !going; e.target.classList.toggle('on', going); };
  c.querySelector('[data-a="save"]').onclick = () => {
    const artist = c.querySelector('#s-artist').value.trim();
    const start = c.querySelector('#s-start').value;
    if (!artist) { toast('Who are you seeing?'); return; }
    if (!start) { toast('Pick a start time'); return; }
    f.schedule.push({
      id: uid(), artist, day: c.querySelector('#s-day').value,
      start, end: c.querySelector('#s-end').value || '',
      stage: c.querySelector('#s-stage').value.trim(),
      note: c.querySelector('#s-note').value.trim(),
      going,
    });
    save(); closeSheet(); haptic(); toast('Set added 🎶');
    planDay = c.querySelector('#s-day') ? f.schedule[f.schedule.length - 1].day : planDay;
    if (route.tab !== 'plan') go('plan'); else render();
  };
  openSheet(c);
}

function sheetAddPacking(f) {
  const c = el(`<div>
    <div class="sheet-title">Add Item</div>
    <div class="sheet-sub">${esc(f.emoji)} ${esc(f.name)} packing list</div>
    <div class="field"><label>Item</label><input id="p-name" placeholder="What do you need?" /></div>
    <div class="field-row">
      <div class="field"><label>Category</label><select id="p-cat">${Object.keys(PACK_CATS).map(k =>
        `<option>${k}</option>`).join('')}</select></div>
      <div class="field"><label>Qty</label><input id="p-qty" type="number" inputmode="numeric" value="1" min="1" /></div>
    </div>
    ${S.premium && S.friends.some(x => x.status === 'joined') ? `<div class="field"><label>Assign to</label>
      <select id="p-who"><option value="">Me</option>${S.friends.filter(x => x.status === 'joined').map(fr =>
        `<option value="${fr.id}">${esc(fr.name)}</option>`).join('')}</select></div>` : ''}
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Add to List</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    const name = c.querySelector('#p-name').value.trim();
    if (!name) { toast('Name the item'); return; }
    f.packing.push({
      id: uid(), name,
      cat: c.querySelector('#p-cat').value,
      qty: Math.max(1, Number(c.querySelector('#p-qty').value) || 1),
      done: false,
      assignee: c.querySelector('#p-who')?.value || null,
    });
    save(); closeSheet(); haptic(); toast('Item added 🎒');
    if (!(route.tab === 'home' && route.sub === 'packing')) go('home', 'packing'); else render();
  };
  openSheet(c);
}

function sheetAddExpense(f) {
  const c = el(`<div>
    <div class="sheet-title">Log Expense</div>
    <div class="sheet-sub">${esc(f.emoji)} ${esc(f.name)} budget</div>
    <div class="field"><label>What for</label><input id="e-label" placeholder="GA+ ticket, gas, tacos…" /></div>
    <div class="field-row">
      <div class="field"><label>Amount</label><input id="e-amt" type="number" inputmode="decimal" placeholder="$" /></div>
      <div class="field"><label>Category</label><select id="e-cat">${Object.keys(SPEND_CATS).map(k =>
        `<option>${k}</option>`).join('')}</select></div>
    </div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Log It</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    const label = c.querySelector('#e-label').value.trim();
    const amount = Number(c.querySelector('#e-amt').value);
    if (!label) { toast('What was it for?'); return; }
    if (!amount || amount <= 0) { toast('Enter an amount'); return; }
    f.expenses.push({ id: uid(), label, amount, cat: c.querySelector('#e-cat').value, ts: Date.now() });
    save(); closeSheet(); haptic(); toast('Expense logged 💸');
    if (!(route.tab === 'home' && route.sub === 'budget')) go('home', 'budget'); else render();
  };
  openSheet(c);
}

function sheetBudgetCap(f) {
  const c = el(`<div>
    <div class="sheet-title">Festival Budget</div>
    <div class="sheet-sub">How much are you giving ${esc(f.name)} this year?</div>
    <div class="field"><label>Total budget</label><input id="b-cap" type="number" inputmode="numeric" value="${f.budgetCap || ''}" placeholder="$" /></div>
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-a="save">Save</button>
  </div>`);
  c.querySelector('[data-a="save"]').onclick = () => {
    f.budgetCap = Math.max(0, Number(c.querySelector('#b-cap').value) || 0);
    save(); closeSheet(); render();
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
  const f = activeFest();
  const c = el(`<div>
    <div class="sheet-title">Quick Add</div>
    <div class="action-grid">
      <button class="action-cell" data-a="fest"><div class="a-ico">🎪</div><div class="a-name">New Festival</div><div class="a-sub">${S.premium || !S.festivals.length ? 'Start planning' : 'Pro feature'}</div></button>
      <button class="action-cell" data-a="set"><div class="a-ico">🎶</div><div class="a-name">Add Set</div><div class="a-sub">Build your schedule</div></button>
      <button class="action-cell" data-a="pack"><div class="a-ico">🎒</div><div class="a-name">Packing Item</div><div class="a-sub">Don't forget it</div></button>
      <button class="action-cell" data-a="exp"><div class="a-ico">💸</div><div class="a-name">Expense</div><div class="a-sub">Track the damage</div></button>
      <button class="action-cell" data-a="friend" style="grid-column:1/-1"><div class="a-ico">🫂</div><div class="a-name">Invite a Friend ${S.premium ? '' : '· <span class="badge gold">Pro</span>'}</div><div class="a-sub">Get the crew together</div></button>
    </div>
  </div>`);
  const need = fn => () => {
    closeSheet();
    if (!f) { toast('Create a festival first'); sheetNewFestival(); return; }
    fn();
  };
  c.querySelector('[data-a="fest"]').onclick = () => { closeSheet(); guardNewFestival(); };
  c.querySelector('[data-a="set"]').onclick = need(() => sheetAddSet(f, planDay || festDays(f)[0]));
  c.querySelector('[data-a="pack"]').onclick = need(() => sheetAddPacking(f));
  c.querySelector('[data-a="exp"]').onclick = need(() => sheetAddExpense(f));
  c.querySelector('[data-a="friend"]').onclick = () => { closeSheet(); S.premium ? go('crew') : sheetPaywall(); };
  openSheet(c);
}

function sheetPaywall() {
  let plan = 'yearly';
  const c = el(`<div>
    <div class="paywall-hero">
      <span class="pw-badge">${I.spark.replace('<svg', '<svg width="15" height="15"')} Festiplanner Pro</span>
      <h2>The whole season.<br/>The whole crew.</h2>
      <p>Free covers one festival, solo. Pro unlocks everything else.</p>
    </div>
    <div class="pw-perks">
      ${perkRow('🎪', 'Unlimited festivals', 'Plan every event on your calendar.')}
      ${perkRow('🫂', 'Friend invites & crews', 'Share your code, squad up per festival.')}
      ${perkRow('🎒', 'Shared packing lists', 'Assign items across the crew.')}
      ${perkRow('📄', 'Pro trip reports', 'Export everything for the group chat.')}
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
    <div class="sheet-sub">Your festival co-pilot.</div>
    <div class="card" style="background:var(--card-2)">
      <p class="muted" style="margin:0;line-height:1.6;font-size:15px">
        Build your set schedule and catch clashes, pack with a progress ring,
        keep the budget honest, and squad up with your crew.
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
  const lines = [`FESTIPLANNER — FESTIVAL REPORT`, `For: ${S.user.name}`, `Generated: ${new Date().toLocaleString()}`, ''];
  for (const f of S.festivals) {
    lines.push(`${'='.repeat(40)}`, `${f.emoji} ${f.name.toUpperCase()} — ${fmtRange(f)}${f.location ? ' @ ' + f.location : ''}`, '');
    lines.push('SCHEDULE');
    const sched = [...f.schedule].sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
    if (!sched.length) lines.push('  (none)');
    for (const s of sched) lines.push(`  ${fmtDayShort(s.day)} ${fmtTime(s.start)}  ${s.artist}${s.stage ? ' @ ' + s.stage : ''}${s.going ? '  ★ going' : ''}`);
    lines.push('', 'PACKING');
    if (!f.packing.length) lines.push('  (none)');
    for (const p of f.packing) lines.push(`  [${p.done ? 'x' : ' '}] ${p.name}${p.qty > 1 ? ' ×' + p.qty : ''} (${p.cat})`);
    const spent = f.expenses.reduce((a, e) => a + e.amount, 0);
    lines.push('', `BUDGET — spent ${money(spent)}${f.budgetCap ? ' of ' + money(f.budgetCap) : ''}`);
    for (const e of f.expenses) lines.push(`  ${money(e.amount).padStart(8)}  ${e.label} (${e.cat})`);
    lines.push('');
  }
  if (!S.festivals.length) lines.push('(no festivals yet)');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'festiplanner-report.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Report downloaded 📄');
}

/* ----------------------------- demo data ----------------------------- */

function loadDemo() {
  const base = new Date(Date.now() + 18 * DAY_MS);
  const iso = d => d.toISOString().slice(0, 10);
  const d1 = iso(base), d2 = iso(new Date(base.getTime() + DAY_MS)), d3 = iso(new Date(base.getTime() + 2 * DAY_MS));
  const f = newFestival({ name: 'Sunburst Valley', location: 'Indio, CA', emoji: '🌵', start: d1, end: d3, budgetCap: 1200 });
  f.schedule.push(
    { id: uid(), artist: 'Mirage Theory', day: d1, start: '17:30', end: '18:30', stage: 'Main Stage', note: '', going: true },
    { id: uid(), artist: 'Velvet Echo', day: d1, start: '18:00', end: '19:00', stage: 'Oasis Tent', note: 'b2b set', going: true },
    { id: uid(), artist: 'Night Pilots', day: d1, start: '21:00', end: '22:30', stage: 'Main Stage', note: 'meet left rail', going: true },
    { id: uid(), artist: 'Golden Hour', day: d2, start: '16:00', end: '17:00', stage: 'Sunset Stage', note: '', going: false },
    { id: uid(), artist: 'KOSMO', day: d2, start: '22:00', end: '23:30', stage: 'Oasis Tent', note: '', going: true },
    { id: uid(), artist: 'The Wildfires', day: d3, start: '20:30', end: '22:00', stage: 'Main Stage', note: 'closing set 🔥', going: true },
  );
  f.packing.push(
    { id: uid(), name: 'Wristband', cat: 'Essentials', qty: 1, done: true, assignee: null },
    { id: uid(), name: 'ID + cash', cat: 'Essentials', qty: 1, done: true, assignee: null },
    { id: uid(), name: 'Tent', cat: 'Camping', qty: 1, done: false, assignee: null },
    { id: uid(), name: 'Power bank', cat: 'Tech', qty: 2, done: false, assignee: null },
    { id: uid(), name: 'Sunscreen', cat: 'Health', qty: 1, done: false, assignee: null },
    { id: uid(), name: 'Rain poncho', cat: 'Clothes', qty: 1, done: false, assignee: null },
  );
  f.expenses.push(
    { id: uid(), label: 'GA+ ticket', amount: 499, cat: 'Ticket', ts: Date.now() - 3 * DAY_MS },
    { id: uid(), label: 'Camping pass', amount: 140, cat: 'Stay', ts: Date.now() - 2 * DAY_MS },
    { id: uid(), label: 'Gas split', amount: 45, cat: 'Travel', ts: Date.now() - DAY_MS },
  );
  save();
  toast('Demo festival loaded 🌵');
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
