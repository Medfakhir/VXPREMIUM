# VX Premium

Next.js control center for VX Premium users, subscriptions, and playlists.

## Stack

- Next.js 16 with App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Netlify deployment
- Netlify Blobs for JSON data storage

## Environment

Set these variables in the Netlify environment and in `.env.local` for development:

```bash
ADMIN_SETUP_KEY=at-least-16-characters
DATA_ENCRYPTION_KEY=at-least-32-characters
```

Generate strong values with:

```bash
openssl rand -base64 48
```

`ADMIN_SETUP_KEY` is only used to create the first owner account. `DATA_ENCRYPTION_KEY` encrypts Xtream passwords, M3U URLs, and EPG URLs before they are stored, and is also used to HMAC player device keys.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin area is at `/admin`.

Outside the Netlify runtime, JSON data is written to `.data/` so the full admin flow can be tested locally. Production uses Netlify Blobs with strong consistency.

## Admin

Open `/admin` and use the setup key to create the owner account. Admin accounts, users, playlists, sessions, and audit records are stored as JSON.

Sessions use Bearer tokens in `sessionStorage`; the admin area does not use cookies. Passwords are hashed with scrypt. Playlist secrets are encrypted with AES-256-GCM and are never returned to the browser after saving.

## Lines And Player Activation

The admin `Lines` page pairs a player MAC address and 6-digit device key with an active user and Xtream playlist. Device keys are never stored in plaintext; only an HMAC-SHA256 fingerprint is saved. Deleting a line, playlist, or user removes the linked lines, and deleting a line also removes its device record.

The player calls `POST /api/player/activate` with:

```json
{
  "mac": "50:10:00:2F:AB:CF",
  "deviceKey": "257850",
  "deviceName": "Android TV"
}
```

The response contains the line details and decrypted Xtream credentials for that device. M3U lines cannot be activated by the player. Failed activation attempts are limited to 20 per IP and MAC address per 15 minutes. Once a line playlist is active, the player revalidates it on launch and removes the saved line after a disabled, expired, deleted, or device-key mismatch response.

## Checks

```bash
npm run lint
npm run build
```

## Deployment

The repository root contains `netlify.toml` with the website base directory. Netlify builds the app with Node.js 22 and publishes `.next`.
