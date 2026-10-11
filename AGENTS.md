<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## TripCooker launch boundaries

- Keep TripCooker separate from the saved Library integration experiment.
- The supported planner uses editable templates; do not advertise a real AI concierge, bookings, group collaboration, or split payments.
- Live identity and plan grants are server-owned. Keep Supabase service role and Stripe secrets out of client modules and logs.
- Use `supabase/launch.sql` for the new live project. Legacy `schema.sql` is a demo reference without production access policies.
- Run `npm test`, `npm run lint`, and `npm run build`. Local PostgreSQL and simulated API tests are not real-account, SMTP, payment, or deployment proof.
- Finish hosted acceptance and operator policy/support setup before enabling production payments or posting promotion drafts.
