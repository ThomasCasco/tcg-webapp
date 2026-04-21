# TCG Marketplace AR

Pokemon-first marketplace MVP for semi-vendedores in Argentina.

Current implementation focus:
- Web PWA foundation with Next.js App Router
- Inventory and listing flows (UI + API stubs)
- Hybrid pricing suggestion endpoint
- Payment verification endpoint scaffold
- Supabase schema draft with RLS policies

## Getting Started

Install dependencies and run local dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Key Routes

- `/` product landing
- `/login` auth stub
- `/register` auth stub
- `/inventory` seller inventory panel
- `/listings` seller listing panel
- `/market` buyer-facing market index

## API Stubs

- `GET /api/health`
- `GET,POST /api/inventory`
- `GET,POST /api/listings`
- `POST /api/pricing/suggest`
- `POST /api/payments/verify`

## Project Structure

```text
app/
	(auth)/
	(dashboard)/
	(public)/
	api/
lib/
	domain/
	pricing/
	reputation/
supabase/
	schema.sql
```

## Learn More

Useful docs:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Supabase Docs](https://supabase.com/docs) - auth, database, storage and RLS.

## Next Steps

1. Connect Supabase auth/session in login/register flows.
2. Replace mock arrays with real queries.
3. Add webhook signature validation in payment verification.
4. Implement image capture + recognition pipeline for card detection.

