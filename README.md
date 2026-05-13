# Food App

This project is configured for:

- Frontend and backend on `Netlify`
- Authentication on `Supabase Auth`
- Database on `Supabase Postgres` through `Prisma`

## Local setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase and Razorpay values
3. Install dependencies
4. Push the Prisma schema to your database
5. Seed sample data if needed
6. Start the dev server

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Required environment variables

Set these in both local `.env` and Netlify site settings:

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

## Supabase database values

Use your Supabase Postgres connection strings like this:

- `DATABASE_URL`: pooled connection string, usually the Supabase pooler on port `6543`
- `DIRECT_URL`: direct connection string, usually the database host on port `5432`

Prisma uses:

- `DATABASE_URL` at runtime
- `DIRECT_URL` for schema operations like `prisma db push`

## Netlify deployment

This repo includes a `netlify.toml` that runs:

```bash
npm run build:netlify
```

That build command runs:

```bash
prisma generate && prisma db push && next build
```

## Netlify steps

1. Push this repo to GitHub
2. Create a new Netlify site from the repo
3. Add all required environment variables in Netlify
4. Deploy the site

## Important note

This project no longer assumes a local SQLite production database. If you previously used `dev.db`, that data will not automatically appear in Supabase Postgres. If you want, the next step can be creating a one-time migration path for your existing local data.

The existing SQLite migrations in `prisma/migrations` are legacy from the previous setup. For this Netlify + Supabase Postgres flow, the deploy currently uses `prisma db push` to apply the schema to the Postgres database.
