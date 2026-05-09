# Sistem Manajemen RT

Aplikasi web manajemen Rukun Tetangga (RT) untuk mengelola data warga, iuran bulanan, dan persuratan — dengan peran admin (Ketua RT) dan warga.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/rt-app run dev` — run the frontend (port 19401)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Clerk Auth
- API: Express 5, OpenAPI-first (Orval codegen)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/db/src/schema/` — DB schema (kartu_keluarga, warga, iuran, surat, pengumuman)
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas
- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/rt-app/src/pages/` — all UI pages
- `artifacts/rt-app/src/App.tsx` — routing + layout

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks + Zod schemas, no manual typing
- Role-based access: Clerk `publicMetadata.role === 'admin'` distinguishes Ketua RT from Warga
- NIK privacy: NIK only visible in admin context; warga public profile omits it
- Payment proof: warga provides a URL (e.g. Google Drive link) for bukti bayar; admin verifies manually
- Mobile-first: sidebar on desktop, bottom nav on mobile

## Product

- **Data Warga & KK** (Admin): manage residents and household cards, link to Clerk accounts
- **Iuran Bulanan** (Admin): generate monthly dues, verify payment proofs, mark as paid
- **Iuran Saya** (Warga): view own dues, submit payment proof URL, see status
- **Persuratan** (Admin): process letter requests, update status diajukan → diproses → selesai
- **Pengajuan Surat** (Warga): submit letter requests (domisili, SKCK, usaha, dll), track status
- **Pengumuman**: admin creates announcements; warga reads them

## User preferences

- Indonesian UI (Bahasa Indonesia throughout)
- Payment methods: GOPAY 083893495975, DANA 081556567854, SeaBank 901501258859 (a/n Diana Rosliana)
- NIK privacy enforced — not shown to warga

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after any schema change
- Admin role: set via Clerk dashboard → Users → publicMetadata: `{ "role": "admin" }`
- API server runs on port 8080, frontend on port 19401; proxy routes `/api` to server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
