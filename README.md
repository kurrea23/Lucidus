# 🎪 Festiplanner

**The festival trip planner.** Everything between "we bought tickets" and "we're home":
crew, tickets, travel, lodging, money, gear, and the trip itinerary — in a clean,
modern mobile design (near-black canvas, soft dark cards, heavy white type, pill
toggles, glowing center action button).

This is a trip-planning app branded for festivals — not a set-schedule app. A small
"don't-miss list" is the only artist-related feature.

## Run it

No build step, no dependencies. Serve the folder and open it on your phone or in a
mobile viewport:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Installable as a PWA (Add to Home Screen); all data stored locally on-device.

## Features

**Free tier (one trip, solo)**
- 🧭 **Trip readiness score** on Home — "6 of 8 sorted" with the next milestone to tackle
- 🎟️ Ticket tracker: needed → bought → in hand, with price and notes
- 🚗 Travel plan: mode, set-off/return times, car & ride assignments
- 🏕️ Stay: camping/hotel/Airbnb, address, check-in/out, confirmation #, "our spot" pin
- 🗓️ Trip itinerary: day strip spanning departure → return, logistics stops
  (set off, grocery run, check-in, gates open), starter template
- 🎒 Packing with **shared gear** ("who's bringing the tent") and a camping starter pack
- 💸 Money: trip budget, expense log, even splits, who-owes-who settle-up
- 📌 Info hub: venue address, meetup point, rules, ICE contact — the no-signal screen
- 🎶 Don't-miss list (minor): the few acts you refuse to miss
- 📄 Trip report export, 🌗 light/dark, haptics, live countdown

**Festiplanner Pro (premium)**
- 🎪 **Unlimited festival trips** — switch with chips on the Trip tab
- 🫂 **Friend invites & crews** — share your code, per-trip RSVPs (in/maybe/out)
- 🤝 Crew tickets tracked per person, shared gear assignment, expense splits across the crew
- Demo paywall: $4.99/mo or $29.99/yr, "Unlock Pro" flips the flag locally

## Structure

- `index.html` — shell + tab bar (Home / Trip / + / Crew / Profile)
- `styles.css` — the design system
- `app.js` — store (localStorage), router, views, sheets
- `manifest.webmanifest` — PWA install metadata
- `ROADMAP.md` — the path to a full product (offline, Supabase backend, payments, App Store)
