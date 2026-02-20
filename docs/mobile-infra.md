# HammerLock AI Mobile Infra Runbook

_Last updated: 2026-02-14 — Infra_

## 1. Overview
HammerLock AI’s mobile client will be built as a React Native app using Expo + EAS (Expo Application Services). The control surface lives in a shared codebase with the web/electron clients, but mobile compilation relies on Expo-managed native projects. The pipeline below standardizes build + release so HammerLock AI engineers can ship reproducible TestFlight builds without leaking keys or coupling tightly to local machines.

## 2. EAS Build Setup
1. **Tooling prerequisites**
   - `npm install -g eas-cli`
   - Ensure Node 20 LTS, Xcode (latest stable), and fastlane CLIs are installed.
   - Sign in to Expo: `eas login` (use the shared HammerLock AI Expo account stored in 1Password).
2. **Project bootstrap**
   - Inside repo: `cd mobile && npx create-expo-app@latest hammerlock-mobile --template expo-template blank` (or wire up existing mobile package).
   - Configure `app.json/app.config.ts` with `expo.extra` for API base URLs, release channel, and Sentry DSN (no secrets here; only identifiers).
   - Initialize EAS: `eas init --id hammerlock-mobile` to bind project to the Expo dashboard.
3. **Managed credentials**
   - iOS: run `eas credentials` to upload the shared HammerLock AI Apple Distribution cert + push key (stored in 1Password). EAS will manage provisioning profiles.
   - Android (future): store keystore in Expo credentials store; keep backup in the infra vault.
4. **Build profiles** (`eas.json`)
   - Define `production`, `preview`, `development` profiles with distinct release channels (`production`, `beta`, `dev`) and `.env.*` selectors.
   - Example snippet:
     ```json
     {
       "build": {
         "development": { "developmentClient": true, "distribution": "internal" },
         "preview": { "distribution": "internal", "channel": "beta" },
         "production": { "channel": "production" }
       }
     }
     ```
5. **Command flow**
   - QA/internal: `eas build --platform ios --profile preview`
   - Store submission: `eas build --platform ios --profile production`
   - Artifacts and logs live in Expo dashboard; link them in release tickets.

## 3. TestFlight Distribution
1. **App Store Connect linkage**
   - Use the HammerLock AI Apple Developer team. App identifier: `ai.hammerlock.mobile` (reserve via App Store Connect → Certificates, Identifiers & Profiles).
   - Configure bundle ID inside `app.json` (`expo.ios.bundleIdentifier`).
2. **Upload path**
   - EAS automatically uploads builds to App Store Connect when the account is linked. Verify in Expo dashboard under _Build details → Submit to App Store_.
   - Alternative manual upload: download the `.ipa` artifact and run `xcrun altool --upload-app --type ios --file <build>.ipa --apple-id <apple_id> --password <app-specific-pass>`.
3. **Internal testing**
   - Create TestFlight groups: `Infra`, `Core dev`, `Stakeholders`.
   - Add release notes referencing the associated HammerLock AI release tag.
   - Gate production promotion on automated smoke tests (see Section 4) + stakeholder sign-off recorded in Linear ticket.
4. **Versioning**
   - Align `expo.version` with semantic version from the server release. Increment `ios.buildNumber` per build to avoid TestFlight rejection.

## 4. Health + Verification Steps
1. **Smoke checks (CI or local)**
   - `npm run lint:mobile` (placeholder; add ESLint config once app scaffolds exist).
   - `npx expo-doctor`
   - Detox/E2E suite (once ready) executed in CI using Expo’s managed workflow or local simulators.
2. **Device validation**
   - Run `npx expo run:ios --device` for debug hardware tests before shipping to TestFlight.

## 5. Monorepo vs Separate Repo
| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Monorepo (current)** | Shared UI primitives, single source of truth for types (API schemas, auth helpers), easier atomic changes across web/electron/mobile, simpler version alignment. | Larger install footprint, more complex tooling (need Expo + Next + Electron dependencies), requires workspace-aware package manager (pnpm/npm workspaces). | ✅ Preferred. Keep mobile under `packages/mobile` or `apps/mobile` with Turborepo/Nx caching. |
| **Separate repo** | Smaller clone, simpler mobile-specific tooling, easier onboarding for mobile-only contributors. | Harder to share API typings, risk of drift between clients, requires extra infra for cross-repo CI + release alignment. | ❌ Use only if compliance demands strict isolation. |

**Action:** Maintain monorepo. Introduce workspace layout (`apps/web`, `apps/mobile`, `apps/electron`, `packages/ui`, etc.) and use Turborepo for incremental builds.

## 6. API Key Handling (Server-Side Only)
1. **Principle**: Expo/React Native bundles are client-facing; never embed OpenAI/Anthropic/API keys in the app. Treat the mobile app as an untrusted client.
2. **Approach**
   - Mobile app authenticates with HammerLock AI backend (Cognito/Supabase/custom) via OAuth/passwordless.
   - Backend issues short-lived session tokens (JWT) and proxies all AI/provider requests; secrets remain on the server.
   - Use feature-scoped capability flags (returned via API) so the mobile app can enable/disable features without exposing credentials.
3. **Secure channel**
   - Enforce HTTPS (TLS 1.3). Pinning optional but recommended for higher assurance (Expo config `expo.ios.infoPlist.NSAppTransportSecurity`).
4. **Runtime configuration**
   - Store only non-sensitive settings (API base URL, telemetry toggles) in `expo.extra`. For environment-specific overrides use EAS secrets (serverless env vars) combined with remote config endpoint at runtime.
5. **Incident response**
   - Server tracks key usage per mobile session; if compromise detected, revoke the session token—no need to rotate upstream API keys exposed client-side because none are shipped.

## 7. Next Steps
- [ ] Scaffold `apps/mobile` with Expo template, add to workspace.
- [ ] Create `eas.json`, `app.config.ts`, and `expo.env.ts` with the settings above.
- [ ] Add CI job (GitHub Actions) running `eas build --profile preview --non-interactive` on release branches; artifacts auto-upload.
- [ ] Document TestFlight smoke testing checklist in `docs/releases/testflight.md`.
- [ ] Integrate over-the-air updates (EAS Update) for critical fixes.
