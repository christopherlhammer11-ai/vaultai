# HammerLock AI Security Architecture

## Encryption

- **Algorithm:** AES-256-GCM (NIST-approved authenticated encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations using SHA-256
- **Salt:** 16 random bytes generated via `crypto.getRandomValues()`
- **IV:** 12 random bytes, generated fresh for every `encrypt()` call
- **Password Verification:** SHA-256 hash of `salt + password`, stored in localStorage

## What's Encrypted

- Persona data
- Chat history
- User settings stored in the vault

## What's NOT Encrypted

- Application code and UI assets
- Static configuration (package.json, next.config.js)
- Environment variables (.env.local)

## Key Management

- **CryptoKey** is held in memory only (via `useRef`) — never serialized, logged, or written to storage
- **Key derivation** happens client-side using the Web Crypto API
- **No server-side keys** — the server never sees your password or encryption key

## When Keys Are Wiped

- On browser tab close (`beforeunload` event)
- On manual lock (Lock button in chat sidebar)
- On session end (closing the app)

## Rate Limiting

- After 5 failed unlock attempts, a 30-second cooldown is enforced
- Attempt count is stored in `sessionStorage` (resets on tab close)
- Cooldown timer is displayed in the unlock UI

## Known Limitations

- **localStorage 5MB cap** — large chat histories may approach this limit
- **No server-side backup** — if you clear browser data, your vault is gone
- **No password recovery** — the password IS the encryption key; we cannot recover it
- **Single-device** — vault data lives on the device where it was created
