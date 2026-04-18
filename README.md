# Kids Money OS MVP

Kids Money OS is a mobile-first financial education app for parents and children.
The MVP connects daily behavior, allowance, saving, spending, interest, and borrowing into one timeline so a child can understand money flow and a parent can manage clear rules.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase Auth
- Supabase Postgres

## Current MVP Scope

- Parent sign up, sign in, and protected routes
- Parent and child account structure
- Home dashboard with balance, savings, borrowed amount, interest rate, and today's tasks
- Behavior rule creation
- Behavior log creation
- Parent approval and rejection for behavior logs
- Allowance, spend, save, unsave, borrow, repay, and interest transaction entry
- Child borrow request flow
- Parent borrow approval and rejection flow
- Monthly report generation
- Record timeline view
- Mock fallback mode when Supabase is not configured

## Project Structure

```text
src/
  actions/
    auth.ts
    finance.ts
    management.ts
  app/
    approvals/
    behaviors/
    child/[id]/
    child-mode/
    login/
    notifications/
    records/
    reports/
    settings/
  components/
    auth/
    finance/
    layout/
    records/
    ui/
  lib/
    auth.ts
    data.ts
    finance.ts
    format.ts
    mock-data.ts
    types.ts
    supabase/
docs/
  mvp-spec.md
supabase/
  schema.sql
```

## Local Setup

1. Move into the project folder.
2. Install dependencies.
3. Create `.env.local`.
4. Create a Supabase project.
5. Run `supabase/schema.sql` in the Supabase SQL editor.
6. Start the dev server.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

If these values are missing, the app falls back to local mock data so the UI can still be reviewed.

## Recommended Validation Flow

1. Sign up with a parent account at `/login`.
2. Open `/settings` and create at least one child profile.
3. Open `/behaviors` and create behavior rules.
4. Log a behavior.
5. Approve or reject it in `/approvals`.
6. Open a child page and create a borrow request.
7. Approve or reject the request in `/approvals`.
8. Add spend, save, or allowance transactions in `/settings`.
9. Generate a monthly report in `/reports`.

## Notes

- Auth is wired for Supabase SSR.
- The schema includes a trigger that creates a `profiles` row when a new Supabase auth user is created.
- Data reads use Supabase when configured and fall back to mock data otherwise.
- The current UI is optimized for MVP validation, not final production polish.
