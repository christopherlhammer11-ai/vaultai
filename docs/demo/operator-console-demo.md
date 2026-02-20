# Operator Console Demo Script

_Last updated: 2026-02-14_

This script walks through the new multi-conversation console, Brave search, credits, and voice/PDF tooling. Target length: 6 minutes.

## 0. Prep

- Launch the Electron build (`npm run electron:dev`) so Brave search + credits + voice transcription run locally.
- Ensure `.env.local` has `BRAVE_API_KEY` and OpenAI for Whisper.
- Seed persona (`~/.hammerlock/persona.md`) with founder profile.
- Start screen recording (1080p) and system audio.

## 1. Unlock + dashboard (0:00 – 1:00)

1. Show vault unlock screen – highlight Argon2 upgrade + “password never leaves device.”
2. Enter password, land on operator console with onboarding pills hidden (already completed).
3. Point out multi-chat sidebar + compute units meter footer.

Key callouts: encrypted vault, persistent persona, offline-first.

## 2. Multi-conversation flow (1:00 – 2:00)

1. Click “New Chat” → rename to “Investor prep”.
2. Paste sample question (“Summarize Series B market for AI infra tools”).
3. Show history panel storing conversation metadata locally (scroll).
4. Demonstrate quick persona tweak: `remember I prefer bullet points.`

## 3. Brave Search + credits (2:00 – 3:00)

1. Type `search latest EU AI Act compliance fine structure`.
2. Highlight inline citations + Brave attribution.
3. Pan to footer meter showing remaining compute units drop by 2.
4. Open `/settings` drawer → show “Add your own API key” (explain unlimited usage path).

## 4. Voice + PDF (3:00 – 4:15)

1. Click mic, dictate “summarize this week’s vault tasks”.
2. Stop recording, show transcription in seconds.
3. Drag a sample PDF (compliance checklist) into upload dropzone, show parsed output summary.

## 5. Export + share (4:15 – 5:00)

1. Use “Generate report” pill → show markdown summary.
2. Click “Export PDF” → show toast + downloaded file.
3. Mention local-only share links (24h expiry) for optional collaboration.

## 6. Desktop wrapper (5:00 – 6:00)

1. Open menubar → show gateway + Next server running.
2. Demonstrate `localhost:3100` from phone simulator (QR code + PWA instructions).
3. Close app → show processes exiting, ports freed.

## Follow-up assets

- Capture b-roll of compute meter, Brave search results, and voice waveform.
- Update `docs/runbook.md` with commands used in demo.
- Provide trimmed 30s teaser (search + credits) for landing page hero.

## 7. Teaser Cut (60 seconds)

- Hook (0-10s): Brave search result with citations overlay + compute meter ticking.
- Core (10-45s): Jump cuts of multi-conversation rename, persona reminder, voice dictation, PDF drop.
- Close (45-60s): Credits meter + "Encrypted. Local. Your rules." CTA linking to personalhammerlock.com/mobile.
- Aspect ratios: 16:9 for YouTube, 9:16 crop for socials.
- Add captions + subtle bass hit synced to search query.
