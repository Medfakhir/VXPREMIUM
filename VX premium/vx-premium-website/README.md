# VX Premium

Next.js foundation for the VX Premium streaming platform.

## Stack

- Next.js 16 with App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Netlify deployment
- Netlify Blobs for JSON data storage

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
```

## Deployment

The repository root contains `netlify.toml` with the website base directory. Netlify builds the app with Node.js 22 and publishes `.next`.

JSON data helpers live in `src/lib/json-store.ts`. Storage requires the Netlify runtime; use `netlify dev` when working with Blobs locally.
