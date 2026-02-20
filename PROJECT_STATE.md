# HammerLock AI — Project State (v0.1.0)
**Last updated:** Feb 15, 2025

---

## Architecture

```
Electron (main.js) → splash.html → Next.js (port 3100)
                                     ├── /vault    (unlock/create vault)
                                     ├── /chat     (main chat UI)
                                     └── /api/*    (LLM routing, search, TTS, PDF)
```

- **Desktop:** Electron 40 + Next.js 14 standalone
- **Crypto:** AES-256-GCM via @noble/hashes, vault master password
- **LLM:** Cloud-first (OpenAI → Anthropic → Gemini → Groq → Mistral → DeepSeek), Ollama fallback
- **Search:** Brave API with location enrichment + result sorting
- **PII:** Anonymized before cloud calls, restored after response
- **Voice:** OpenAI Whisper (transcribe) + OpenAI TTS (nova voice) + browser Speech fallback
- **Storage:** `~/.hammerlock/` (persona.md, .env, notes/, vault data)

---

## File Structure

```
app/
├── layout.tsx                     # Root layout + electron drag bar
├── page.tsx                       # Landing/marketing page
├── globals.css                    # All styles (4600+ lines)
├── chat/page.tsx                  # Main chat UI (~1800 lines)
├── vault/page.tsx                 # Vault login/create + welcome sequence
├── agents/page.tsx                # Agent documentation
├── get-app/page.tsx               # Download page
├── success/page.tsx               # Stripe checkout success
└── api/
    ├── execute/route.ts           # Core: LLM routing, search, commands (1400+ lines)
    ├── tts/route.ts               # OpenAI TTS → mp3 stream
    ├── transcribe/route.ts        # OpenAI Whisper transcription
    ├── pdf-parse/route.ts         # PDF text extraction
    ├── health/route.ts            # Provider health check
    ├── credits/route.ts           # Compute credit balance
    ├── checkout/route.ts          # Stripe payment
    ├── webhook/route.ts           # Stripe webhooks
    ├── save-persona/route.ts      # Persona file writer
    ├── report/route.ts            # Report generation
    ├── share/route.ts             # Chat sharing
    ├── configure/route.ts         # API key configuration
    └── local-ip/route.ts          # Network IP for mobile QR

lib/
├── agents.ts                      # 6 built-in agents + custom agent system
├── anonymize.ts                   # PII scrubbing for cloud LLM calls
├── compute-credits.ts             # Credit tracking (chat/search units)
├── crypto.ts                      # Argon2ID KDF + AES-256 encryption
├── i18n.tsx                       # 11 languages (en, es, pt-BR, fr, de, zh, ja, ko, ar, hi, ru)
├── subscription-store.tsx         # Stripe subscription state
├── vault-store.tsx                # Vault state management (React context)
└── vault/                         # Vault schema, defaults, JSON parsing

electron/
├── main.js                        # Electron main process (splash → gateway → next → vault)
└── splash.html                    # Cinematic startup animation

public/
├── hammerlock-logo.png, icon-*.png   # App icons
├── manifest.json                  # PWA manifest
└── sw.js                          # Service worker
```

---

## LLM Providers (execute/route.ts)

| Provider | Model | Multi-turn | Priority |
|----------|-------|-----------|----------|
| OpenAI | gpt-4o-mini (configurable) | ✅ | 1st |
| Anthropic | claude-sonnet-4-5-20250929 | ✅ | 2nd |
| Gemini | gemini-2.0-flash | ✅ | 3rd |
| Groq | llama-3.3-70b-versatile | ✅ | 4th |
| Mistral | mistral-small-latest | ✅ | 5th |
| DeepSeek | deepseek-chat | ✅ | 6th |
| Ollama | phi3 (local) | ❌ (flattened) | Fallback |
| OpenClaw | gateway CLI | ❌ | Last resort |

All cloud providers use multi-turn message arrays with anonymized history (20 messages).

---

## Command Handlers (execute/route.ts)

| Pattern | Handler | What it does |
|---------|---------|-------------|
| `status` | runStatus() | Show provider/vault status |
| `tell me about myself` / `!load-persona` | LLM narration | Natural persona summary |
| `remember: ...` | Append to persona.md | Save user info |
| `read file ...` | readFileSafe() | Read from ~/.hammerlock/ (sandboxed) |
| `load plan` | readFileSafe(planPath) | Read plan.md |
| `switch to [language]` | langSwitchMap | Switch UI + LLM language |
| `read this out loud: ...` | Strip prefix, route to LLM | TTS prefix handling |
| `remind me ...` / `daily reminder ...` | Parse time, save to persona | Reminders (client scheduler fires them) |
| `track my mood: ...` | Log with date, LLM warm reply | Mood tracking |
| `summarize my week/chat` | Scan 30 msgs, LLM synthesis | Conversation summary |
| `create note: ...` | Write to ~/.hammerlock/notes/ | Note creation |
| `encrypt this note: ...` | Base64 encode + save as .vault | Encrypted note |
| `decrypt ...` | Read + base64 decode | Decrypt note |
| `analyze this image` | Route to LLM with vision prompt | Image description |
| `upload file: ...` | Guidance response | File upload instructions |
| `weather/news/...` (auto) | needsWebSearch() → Brave → LLM | Real-time search |

---

## Search System

- **Auto-trigger:** 25+ regex patterns in `needsWebSearch()` for weather, news, scores, restaurants, etc.
- **Enrichment:** `enrichSearchQuery()` appends city + state + zip from `CITY_DATA` map (50+ US cities)
- **Persona fallback:** If no city in query, pulls from `extractUserLocation(persona)`
- **Result sorting:** `sortSearchResults()` boosts weather.com/accuweather URLs with city slug in path
- **Weather formatting:** Voice-friendly "Right now in [City]:" format, no tables
- **Sources:** Numbered compact list with domain + age, "real-time as of" tag for weather

---

## Chat Page Features (chat/page.tsx)

- **Messages:** 20-message history sent to LLM, auto-scroll, markdown rendering
- **Voice input:** MediaRecorder → Whisper transcription → auto-send (no Enter needed)
- **Silence detection:** Web Audio API AnalyserNode, auto-stop after 2s silence
- **Auto-TTS:** Voice replies auto-speak, "talk to me" enters live convo mode
- **TTS:** OpenAI tts-1 (nova voice), browser SpeechSynthesis fallback
- **PDF upload:** Paperclip button + drag-and-drop, 10MB max
- **Image upload:** Drag-and-drop or paperclip, dataURL attachment
- **Reminder scheduler:** 30s interval checks persona reminders vs system clock, fires notification + TTS
- **Sidebar:** Commands/Tools tabs, agent switcher, conversation list with groups
- **6 agents:** General, Strategist, Counsel, Analyst, Researcher, Operator, Writer + custom
- **Onboarding:** 4-step tutorial on first load
- **Export:** JSON chat export, share link generation
- **Regenerate:** Re-send last user message
- **Copy/Read aloud:** Per-message action buttons

---

## Electron Desktop (electron/main.js)

- **Startup:** Splash → Gateway + Next.js (parallel) → crossfade to /vault
- **Window:** 1280x860, minWidth 800, `titleBarStyle: "hiddenInset"`
- **Drag regions:** vault-page + welcome-overlay + console-topbar are `drag`, all buttons/inputs are `no-drag`
- **Security:** contextIsolation + sandbox, no nodeIntegration
- **Menu:** File (New Window/Chat, Settings), Edit, View (Toggle Sidebar, Zoom, DevTools in dev), Window, Help
- **Ports:** Next.js on 3100, Gateway on 18789

---

## CSS Architecture (globals.css)

- **Design system:** CSS custom properties (--bg-primary, --accent #00ff88, --radius-*, --space-*)
- **Console layout:** Flexbox sidebar (260px) + main (flex: 1)
- **Message styles:** Green left border (AI), right border (user), error styling
- **Custom bullets:** Green dot ::before on ul, numbered circles on ol
- **Responsive:** 1100px (sidebar shrinks), 900px (sidebar → horizontal strip), 480px (mobile)
- **Electron:** Traffic light padding, drag regions, no-drag holes
- **Animations:** messageSlideIn, welcomeFadeOut, lockBurst, brandReveal, scan, glowPulse

---

## Build & Deploy

```bash
# Dev
npm run dev                        # Next.js dev server on :3000
npm run electron:dev               # Electron + Next.js dev

# Production
npm run build                      # Next.js production build
npm run electron:build:mac         # Build macOS DMG (signed)

# Output
dist-electron/HammerLock-AI.dmg          # macOS installer (~250MB)
```

**Signing:** Developer ID Application: Christopher Hammer (89Q438GN53)
**Notarization:** Configured but skipped (needs Apple credentials)

---

## User Persona (current)

```
Name: chris
Location: San Ramon, CA 94583
Role: stuff
Uses HammerLock AI for: i like to think outloud
Communication style: casual
I have 2 kids and my wife is pregnant
Reminder: drink water (daily at 10am)
Reminder: 'Hey, test complete! (daily at 5:42)
```

---

## Known Issues / TODO

- [ ] Notarization not working (needs Apple API credentials)
- [ ] Ollama multi-turn: history is flattened to single prompt string
- [ ] Image analysis relies on text LLM (no vision model integration yet)
- [ ] Encrypt/decrypt uses base64 (not real AES-256 — needs master key flow)
- [ ] Reminder scheduler runs client-side only (resets on page refresh)
- [ ] No persistent conversation storage across sessions (in-memory only)
- [ ] Service worker registered but minimal offline support

---

## Session History (v0.1.0 patches)

### Session 1 — Core fixes
- Input cursor alignment
- Source cards → compact numbered list
- Memory: 20-message history + persona parsing
- Images in chat: resizable with max 400px
- UI polish: tight spacing throughout
- Persona narration (natural, not raw bullets)
- Tax/search formatting rules
- TTS trigger ("read this out loud")
- Reminders, mood tracking, summarization
- Encrypt/decrypt commands
- Image analysis, file upload guidance
- Language switching (15 languages)
- Voice auto-send loop (sendCommandRef pattern)

### Session 2 — Search + UX fixes
- Weather: location enrichment (city → city, state, zip)
- Weather: voice-friendly output, no tables, "Right now:" format
- Weather: result sorting (weather.com preferred)
- Location memory: pre-loaded San Ramon, prompt if missing
- Green dots CSS: fixed clipping under left margin
- Responsive layout: 1100px/900px breakpoints, sidebar collapse
- Voice: silence detection (2s auto-stop), live convo mode
- Reminders: real 30s scheduler + notification + TTS
- Notes: create/encrypt/decrypt to ~/.hammerlock/notes/
- Drag-and-drop file upload with visual overlay
- Window drag fix: vault-page + welcome-overlay now draggable
