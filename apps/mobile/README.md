# HammerLock AI Mobile

Expo/React Native prototype for the HammerLock AI operator console. The app implements the MVP flows described in `docs/mobile-ui-spec.md` and reuses the shared `lib/crypto` module for Argon2id/PBKDF2 key derivation.

## Getting started

```bash
cd apps/mobile
npm install
npm run start
```

- `npm run ios` / `npm run android` launch a simulator or a connected device.
- `npm run web` runs the experience in a browser for quick iteration.

> **Heads-up:** the project uses `expo-standard-web-crypto` and `react-native-get-random-values` to polyfill the Web Crypto APIs (`crypto.subtle`) that `lib/crypto.ts` depends on. When building a custom dev client or production binary (EAS), these polyfills work out of the box.

## Demo credentials

The unlock screen is wired to a demo secret so designers and reviewers can get to the chat UI without provisioning a real vault:

- **Passphrase:** `vault-demo-passphrase`
- Face ID/Touh ID is simulated and internally feeds the same passphrase through the shared Argon2id/KDF pipeline before unlocking the session.

Once unlocked, sending a chat message will use the shared `encrypt` helper and show a snippet of the ciphertext so we can verify that the same salt + key derivation logic from the desktop app executes on device.
