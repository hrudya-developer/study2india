# Study2India web

The rebuilt study2india.com: a college discovery platform for every field of study in India.
Next.js (App Router) with PostgreSQL through Drizzle ORM. The old Vite site in `../client` stays untouched until this one replaces it.

## Data rule

Every figure shown on the site comes from a row in `sources` (publisher, URL, date checked).
A value we have not verified is stored as NULL and shown as "Not recorded".
Fees are stored with the basis they were published in (per year, whole course, per semester) and are never converted.

## Local setup

Requirements: Node.js 22 or newer and PostgreSQL 16.

1. Create a database and a user for it in PostgreSQL.
2. Copy `.env.example` to `.env` and put that database's connection string in `DATABASE_URL`.
3. Install, create the tables, load the reference data, and start:

```zsh
cd web
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The site runs at http://localhost:3000.

## What is in the database so far

- 36 states and union territories
- 20 fields of study with 47 courses (durations only where the regulator fixes them)
- 15 entrance exams with their conducting bodies and official sites

College data is loaded in phases from official sources only (NIRF, NMC, DCI, INC, VCI, NCISM, AICTE, UGC, AISHE and the counselling authorities). Drop official ranking files into `data/nirf/<year>/` in the format the seed script reads, then run `npm run db:seed` again; it is safe to re-run.

Home page sections for rankings and states appear automatically once that data exists.

## Leads

The "Talk to a counsellor" form saves to the `leads` table in this app. Moving leads to a CRM is a later decision.

## Production build

```zsh
cd web
npm ci
npm run db:migrate
npm run build
npm run start
```

`npm run build` needs `DATABASE_URL` set, because the home page is rendered from the database and refreshed every 10 minutes.
