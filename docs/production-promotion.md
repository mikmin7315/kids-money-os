# Production Promotion

Do not promote a release until the production Supabase backend and the release
configuration both pass their read-only gates.

```powershell
vercel env run -e production -- npm run preflight:release
vercel env run -e production -- npm run pre-promote
```

`pre-promote` verifies backend reachability, service-role authentication,
required tables, migration-specific columns, and required RPC routes without
writing data or printing secrets.

It cannot inspect PostgreSQL indexes, duplicate rows, publication membership,
or existing-user impact. Before promotion, run
`supabase/release-preflight.sql` in the Supabase SQL editor and confirm:

- every required table and Realtime publication check is true;
- every duplicate query returns zero rows;
- at least one administrator remains;
- all release migrations have been applied in the documented order.

After those checks pass, merge the release PR and verify the production login,
support, privacy, terms, account-deletion, consent, PIN lockout, approval, and
notification flows.
