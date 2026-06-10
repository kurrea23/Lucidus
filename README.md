# 🎪 Lucidus — Festival Planner

A full festival-planning app for festival goers, styled after the Pep AI design language:
near-black canvas, soft dark cards, heavy white type, uppercase micro-labels, pill toggles,
and a glowing center action button.

## Run it

No build step, no dependencies. Serve the folder and open it on your phone or in a
mobile viewport:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

It's also an installable PWA (Add to Home Screen) and stores everything locally on-device.

## Features

**Free tier**
- 🎪 One festival with live countdown (days / hrs / min / sec)
- 🎶 Set schedule builder — full lineup vs. "My Schedule", per-day strip, heart sets
  you're going to, automatic **clash detection** for overlapping sets
- 🎒 Packing list with categories, quantities, progress ring, and a one-tap starter pack
- 💸 Budget tracker — set a cap, log expenses by category, see what's left (or how far over)
- 📄 Export a full trip report
- 🌗 Light/Dark appearance, haptics, local-only data, reset

**Lucidus Pro (premium)**
- 🎪 **Unlimited festivals** — plan the whole season, switch between them with chips
- 🫂 **Friend invites & crews** — share your invite code, add friends, build a crew per festival
- 🎒 Shared packing — assign items to crew members
- Paywall is a demo: $4.99/mo or $29.99/yr plans, "Unlock Pro" flips the flag locally

## Structure

- `index.html` — shell + tab bar
- `styles.css` — the design system
- `app.js` — store (localStorage), router, views (Home / Plan / Crew / Profile), sheets
- `manifest.webmanifest` — PWA install metadata
