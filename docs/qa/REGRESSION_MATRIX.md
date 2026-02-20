# HammerLock AI Regression Matrix

_Last updated: 2026-02-14_

This matrix tracks the manual/automated coverage for the current HammerLock AI surface (Next.js web console + Electron desktop wrapper).

## Test Environments

| Env | Build | Notes |
| --- | --- | --- |
| Desktop (Electron) | `npm run electron:dev` / `electron:build` dmg | Primary surface. Must include Brave key + bundled gateway. |
| Web (Next dev) | `npm run dev` | Used for quick UI validation; Brave search disabled unless API key injected. |
| API | `npm run dev` + REST | Used for credit, persona, transcription endpoints. |

## Feature Coverage

| Area | Scenario | Desktop | Web | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| **Vault bootstrap** | Create vault, set password, unlock | ✅ | ✅ | Pass (Electron build 2026-02-14) | Now stores KDF version + Argon2 fallback. |
| **KDF Migration** | Unlock legacy PBKDF vault & re-encrypt | 🚧 | 🚧 | Blocked – need legacy fixture | Verify `vault_kdf_version` is written post-unlock. |
| **Operator console** | Multi-conversation create/rename/delete | ✅ | ✅ | Pass (manual smoke) | Check localStorage settings migration. |
|  | Onboarding flow (name/role/style) | ✅ | ✅ | Pass (strings spot-checked) | Validate translations for en/es/pt-BR. |
|  | Voice input (mic permissions, Whisper fallback) | ✅ | ⚠️ | Partial – desktop pass, web blocked by missing key | Web requires OPENAI key; show actionable error when missing. |
|  | PDF upload + parse | ✅ | ✅ | Pass (sample PDF) | Enforce 10 MB limit + error toast. |
| **Brave search** | Search command with citations | ✅ | ⚠️ | Partial – desktop pass, web blocked pending BYOK | Desktop uses bundled key; web requires manual config. Check exhaustion path. |
| **Credits system** | Consume chat/search units, show paywall | ✅ | ⚠️ | Partial – desktop meter drops, corruption test pending | Confirm `/api/credits` matches local count; handle `credits.json` corruption. |
| **Desktop shell** | Gateway + Next autostart, quit handling | ✅ | ❌ | Pass (ports freed after quit) | Only desktop. Verify ports 3100/18789 freed on exit. |
| **Electron updates** | dmg signing + notarization script | 🚧 | ❌ | Blocked – waiting for Infra automation | Infra pipeline pending. Manual smoke for now. |
| **Landing page** | Feature list, CTA links, downloads | ✅ | ✅ | Pass (copy reviewed) | Ensure new copy matches Brave/search/credit story. |
| **Demo assets** | Operator console scripted flow | 🚧 | 🚧 | Blocked – waiting on recording | Waiting on refreshed recording/script. |

Legend: ✅ covered | ⚠️ partial coverage | 🚧 not started | ❌ not applicable.

## Open QA Blockers

1. **Argon2 upgrade validation** – need deterministic test plan once locksmith/vaultie land final migration code.
2. **Credits ledger corruption handling** – force-quit desktop while `credits.json` updating to ensure UI recovers.
3. **Voice transcription fallback** – add test verifying error copy when no OpenAI key is configured.

## Next Steps

- Automate smoke suite for desktop build once Infra pipeline lands (npm ci + lint + build + electron smoke script).
- Backfill Cypress (or Playwright) flow for onboarding + Brave search.
- Coordinate with Demokid to reuse demo environment as QA baseline.
