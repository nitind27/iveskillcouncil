# Quick Setup

1. **Copy environment**: `cp env.template .env` (or copy `env.template` to `.env` and edit).
2. **Install**: `npm install`
3. **Database**: `npx prisma generate && npx prisma db push`
4. **Optional seed**: `npm run db:seed`
5. **Run**: `npm run dev` → http://localhost:3000

See [README.md](./README.md) for full documentation. SMTP and folder structure: `docs/`.
