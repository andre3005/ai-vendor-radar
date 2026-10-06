# AI Vendor Risk Radar

A third-party-risk dashboard that rates AI vendors on data-protection criteria, tracks their incidents and shows where they store data. Built for BTMA 631 / BIMA 610, Haskayne School of Business, Group Project 1.

**Public URL:** _add after deploy_

**Team:** [member names]

> All vendors, incidents, authorities and numbers are **fictional**.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase URL and anon/publishable key
npm run dev
```

## Database

Supabase (PostgreSQL). Run `supabase/setup.sql` once in the Supabase SQL Editor, then set the reset PIN (see the end of that file). ERD source: `docs/ERD.md`.

Scores are computed in SQL (views `provider_score`, `provider_ranking`), never in the frontend.

## Stack

Vite, React, TypeScript, supabase-js (REST + Realtime), react-router (HashRouter), Recharts, Leaflet, motion, qrcode.react.

## AI-use statement

[Team to complete.] Claude was used for planning and the database script; Claude Code for implementation. The team tested the site, reviewed the results and presented the work.
