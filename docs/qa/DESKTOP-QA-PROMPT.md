# OpenClaw QA Team — HammerLock AI Desktop DMG Testing

## Your Mission
You are the QA team for HammerLock AI Desktop (macOS Electron app). Your job is to install and test the latest DMG build, document every bug you find, and verify that features work correctly. You do NOT modify any source code — you only test, report, and verify.

## Setup
1. Open `HammerLock AI.dmg` from the Desktop
2. Drag HammerLock AI to Applications (or run directly from the DMG)
3. Launch HammerLock AI — you should see a cinematic splash screen, then the vault unlock page

## Test Matrix — Go through each item and report PASS/FAIL

### 1. App Launch & Splash
- [ ] Splash screen appears immediately on launch
- [ ] Splash animates (lock icon, particles, text reveal)
- [ ] App transitions smoothly to vault unlock page after ~3 seconds
- [ ] No blank white screen at any point

### 2. Vault & Onboarding
- [ ] First launch shows persona onboarding (name, role, industry)
- [ ] Can skip onboarding
- [ ] Can complete onboarding with all fields
- [ ] Vault password creation works
- [ ] Vault unlock with correct password works
- [ ] Vault unlock with wrong password shows error

### 3. Menu Bar (NEW)
- [ ] **HammerLock AI** menu: About, Hide, Quit all work
- [ ] **File > New Window** (⌘N) opens a new window
- [ ] **File > New Chat** (⇧⌘N) starts a fresh conversation
- [ ] **File > Settings** (⌘,) opens the API key modal
- [ ] **File > Close** (⌘W) closes the window
- [ ] **Edit** menu: Undo, Redo, Cut, Copy, Paste, Select All work in text input
- [ ] **View > Toggle Sidebar** (⌘B) hides/shows the sidebar
- [ ] **View > Zoom In/Out/Reset** work correctly
- [ ] **View > Full Screen** toggles fullscreen mode
- [ ] **Window > Minimize** works
- [ ] **Help > HammerLock AI Documentation** opens browser
- [ ] **Help > Report an Issue** opens GitHub issues
- [ ] **Help** shows version number

### 4. Sidebar
- [ ] Sidebar is visible on launch with commands, agents, chat history
- [ ] Language picker is always visible at the bottom (not pushed off screen)
- [ ] Lock button is always visible at the bottom
- [ ] Tab switcher (Commands / Agents) works
- [ ] Quick commands: Status, Help, Summarize are clickable and work
- [ ] Search button prefills "search " in input and focuses it
- [ ] Tools: System Status, My Persona, Generate Report, Share Chat, Export Chat, Upload PDF, API Keys
- [ ] Previous chats list shows conversation history
- [ ] Can rename a conversation by clicking its name
- [ ] Can delete a conversation with the X button
- [ ] Sidebar toggle button (hamburger) collapses/expands sidebar
- [ ] Collapsed sidebar: content is hidden, main chat area expands

### 5. Chat & Messages
- [ ] Can type a message and send with Enter
- [ ] AI responds (via Ollama or OpenAI depending on config)
- [ ] Typing indicator (animated dots) shows while AI is processing
- [ ] Timestamps appear on messages (HH:MM format)
- [ ] **Conversation auto-names** from first message (not "Chat 1")
- [ ] Auto-name updates to a better LLM-generated summary after a moment
- [ ] Hover over ANY message shows Copy button
- [ ] Hover over AI message shows Copy + Read Aloud + Save to Vault + Regenerate
- [ ] Copy button copies text and shows "Copied!" feedback
- [ ] Read Aloud plays TTS, icon changes to stop button
- [ ] Stop Reading stops TTS playback
- [ ] Save to Vault shows "Saved!" feedback
- [ ] Regenerate re-sends the last user message (only on latest AI message)
- [ ] New Chat (+ button or ⇧⌘N) resets to General agent and clears messages

### 6. Search (Brave)
- [ ] Type `search latest news` — should return web results with citations
- [ ] Click Search button in sidebar — prefills input, need to add query
- [ ] Type just `search` and press Enter — should show helpful prompt with examples
- [ ] Search results include clickable markdown links
- [ ] If Brave API key missing, shows clear error message

### 7. Voice Dictation
- [ ] Click microphone button — should request mic permission (first time)
- [ ] Recording indicator appears while listening
- [ ] Click again to stop — should transcribe via Whisper
- [ ] Transcribed text appears in the input field
- [ ] If OpenAI key missing, shows clear error about needing OPENAI_API_KEY
- [ ] Error messages are visible (not silently failing)

### 8. Agents
- [ ] Switch to Agents tab in sidebar
- [ ] Select each built-in agent: Creative Writer, Code Assistant, Research Analyst, etc.
- [ ] Agent name and icon appear in topbar when selected
- [ ] Agent-specific quick commands appear in sidebar
- [ ] New Chat resets back to General agent
- [ ] Custom agent creation: can name, describe, set system prompt

### 9. API Keys & Settings
- [ ] Click API Keys in sidebar (or ⌘,) — modal opens
- [ ] Can enter OpenAI API key
- [ ] Can enter other provider keys (Anthropic, Gemini, Groq, Mistral, DeepSeek, Brave)
- [ ] Saving keys shows success confirmation
- [ ] After saving, `status` command shows providers as "configured"
- [ ] Keys persist after app restart (stored in ~/.hammerlock/.env)

### 10. Language Support
- [ ] Language picker shows all 11 languages
- [ ] Switching language updates all UI labels immediately
- [ ] AI responses come back in the selected language
- [ ] Switching back to English works

### 11. Responsive Layout (NEW)
- [ ] Resize window to minimum size (800x600) — no UI overlap
- [ ] Traffic light buttons (close/minimize/maximize) don't overlap with sidebar or topbar content
- [ ] Topbar brand, title, and status don't overlap at narrow widths
- [ ] Sidebar items don't overflow or get cut off
- [ ] Chat feed scrolls properly at all window sizes
- [ ] Input area stays visible at all window sizes

### 12. Share & Export
- [ ] Share Chat generates a share link
- [ ] Export Chat downloads a text/markdown file
- [ ] Generate Report produces a summary

### 13. PDF Upload
- [ ] Upload PDF button opens file picker
- [ ] PDF text is extracted and sent with the next message
- [ ] "Summarize this PDF" prompt pill works after upload

### 14. Tutorial
- [ ] First launch (after clearing localStorage) shows 5-step tutorial
- [ ] Can navigate through all 5 steps with Next button
- [ ] Can skip tutorial with Skip button
- [ ] Tutorial doesn't show again after completion

### 15. Status Command
- [ ] Type `status` — shows HammerLock AI Status with all provider statuses
- [ ] Ollama shows "connected" or "offline" correctly
- [ ] OpenAI/Brave show "configured" when keys are set
- [ ] Persona shows "loaded" with correct path

## Bug Report Format
For each bug found, report:
```
**BUG**: [Short description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. ...
2. ...
3. ...
**Expected**: What should happen
**Actual**: What actually happens
**Screenshot**: [if applicable]
```

## Files You Should NOT Touch
These files are actively being developed. Do not modify them:
- `app/chat/page.tsx`
- `app/globals.css`
- `app/api/execute/route.ts`
- `app/api/transcribe/route.ts`
- `app/api/configure/route.ts`
- `app/api/share/route.ts`
- `electron/main.js`
- `lib/i18n.tsx`
- `.env.local`

## Files You CAN Work On
- `docs/qa/*` — QA reports and test results
- `docs/` — Documentation improvements
- `apps/mobile/` — Mobile app development
- Any new test files in a `tests/` directory
