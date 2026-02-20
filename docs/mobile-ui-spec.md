# HammerLock AI Mobile App — MVP UI Spec

_Last updated: 2026-02-14 · Author: DemoKid_

## 1. Purpose & Principles

- **Goal:** Deliver a touch-first HammerLock AI client that feels purpose-built for phones without losing the clarity of the desktop chat experience.
- **Principles:**
  1. **Security-first unlock** — biometrics + passphrase fallback with clear affordances.
  2. **Chat stays in focus** — single-column conversation optimized for thumbs, quick toggles, and low-friction voice input.
  3. **Predictable controls** — persistent access to settings and session info without clutter.
  4. **Resilient keyboard handling** — nothing jumps or hides while typing; composer always visible.

## 2. Translating Web Chat → Mobile

| Web Element (current) | Mobile Expression |
| --- | --- |
| Left column: vault picker + conversation threads | Slide-in drawer revealed via hamburger in the Chat header. Shows vault status, active sessions, quick switch. |
| Top app bar with status + actions | Compact header with vault avatar, title, and overflow menu. System status indicators (online/syncing) live here. |
| Desktop command palette (`/` commands) | Inline composer shortcuts: pill chips above keyboard for recent commands + long-press on message bubble for actions. |
| Wide message canvas with hover affordances | Taller bubbles with tap targets; actions surfaced via swipe (reply) and long-press (copy, pin). |
| Input row with text, voice, attachment buttons | Sticky composer pinned to safe area; mic button on right, attachment on left, send button becomes glowing primary when text present. |

## 3. Screen Specs

### 3.1 Vault Unlock Screen

**Purpose:** Gate the app behind device biometrics (Face ID / Touch ID) with a fallback passphrase to keep Zero Knowledge posture.

**Layout:**
1. **Background:** Vault gradient + subtle particles to imply encryption in progress.
2. **Mid-card:**
   - Vault logo + vault name.
   - Status label ("Secure • Face ID ready" / "Offline • Passphrase required").
   - Primary CTA button reflecting available biometric ("Unlock with Face ID").
3. **Secondary CTA:** "Use vault passphrase" text button.
4. **Footer:** small print linking to account switch + security notice.

**States:**
- **Idle (Biometric ready):** CTA pulses gently; Face ID prompt auto-triggers on screen entry.
- **Biometric scanning:** Show spinner + "Authenticating…"; block other inputs for 2s.
- **Success:** Green flash, haptic tap, transition to Chat with fade.
- **Failure:** Shake animation, inline error ("Face ID failed. Try again or enter passphrase."). After 3 failures, auto-focus passphrase field.
- **Passphrase entry:**
  - Reveal secure text field in the card.
  - Keyboard pushes card upward (see keyboard handling). `Return` key becomes "Unlock".
  - Provide "Show" toggle + "Forgot?" link.

**Interactions:**
- Swipe down dismisses biometric prompt (if user wants passphrase).
- Tapping device back (Android) or Cancel returns to idle state without leaving app.

### 3.2 Chat Screen

**Structure:**
1. **Header (56–64 px height):**
   - Left: vault avatar + chevron (opens vault drawer).
   - Center: current chat title or "HammerLock AI"; sublabel for model/status.
   - Right: icons for search and overflow menu (includes clear chat, export, settings).
2. **Conversation list:** Scrollable area with message bubbles.
3. **Inline system cards:** (Model switch, warnings) full-width cards anchored to timeline.
4. **Composer module:** sticky to safe-area bottom.

**Message Bubbles:**
- **Bot messages:** left-aligned, cool gray background, optional inline actions row (copy, re-run) as tappable icons under bubble.
- **User messages:** right-aligned, saturated accent background with white text, optionally referencing attachments thumbs.
- **Grouping:** adjacency merges bubbles with shared timestamp cluster; include timestamp chips between groups.
- **Selection & reply:**
  - Swipe right on any bubble to trigger quote/inline reply composer.
  - Long-press opens action sheet (Copy text, Pin, Delete for me, Report issue).

**Voice & attachments:**
- **Left of composer:** `+` icon → sheet for attachments (images, files) and quick commands.
- **Input field:** multi-line, rounded, grows up to 4 lines; placeholder references slash commands.
- **Right cluster:**
  - When empty: mic button (tap & hold to dictate). Waveform overlay appears while recording; release to send, swipe left to cancel.
  - When text present: send button replaces mic; mic moves into left-side quick chips as dedicated icon for persistent access.

**Keyboard handling:**
- Composer transitions with keyboard, pinned above system keyboard using safe-area insets.
- Conversation view shortens via `padding-bottom = keyboard height + composer height` to keep most recent messages visible.
- On iOS, use interactive dismissal (pull down to hide keyboard) without losing draft text.
- On Android, adjustResize mode with smooth scroll-to-bottom on focus.
- When voice input active, temporarily lock scroll to avoid accidental jumps.

**Empty state:**
- illustration + "Welcome back" text.
- Quick-start chips ("Summarize my day", "Draft a note").
- Tapping chip injects text and focuses keyboard.

### 3.3 Settings Screen

Accessible from Chat overflow or as its own tab in future. For MVP, presented as modal stack.

**Sections:**
1. **Account**
   - Profile (avatar, email) with editable display name.
   - Linked devices list.
2. **Security**
   - Toggle biometric unlock (Face ID/Touch ID/Android Biometrics).
   - "Require passphrase after" timing selector (Immediate / 5 min / 1 hr / Never during session).
   - Session log with recent unlock attempts.
3. **Chat Preferences**
   - Default model dropdown.
   - Message bubble density (Comfortable / Compact).
   - Voice input preferences (tap-to-record vs press-and-hold).
   - Keyboard accessory row toggles (show slash commands, quick actions).
4. **Notifications**
   - Push toggles for mentions, completed tasks.
5. **About**
   - App version, legal links, send diagnostics.

**Interactions:**
- Uses native stack navigation: selecting sub-setting opens detail screen.
- Save happens inline; toggles respond instantly with toast confirmations for critical items (e.g., biometrics disabled).

## 4. Cross-Screen Patterns

### 4.1 Biometric Unlock Flow
1. App launch → Vault Unlock screen enters.
2. System biometric sheet auto-invokes. Success → decrypt session keys, navigate to Chat.
3. If device lacks biometrics or user opts out:
   - Passphrase entry is primary; once unlocked, offer to enable biometrics via Settings > Security.
4. Backgrounding > X minutes (user-defined) forces re-authentication. On resume, show modal overlay over Chat requiring Face ID/passphrase before interaction.

### 4.2 Keyboard & Safe Area Strategy
- Use a global keyboard observer to emit height + animation curve to all subscribers (composer, scroll view) for synchronized motion.
- Respect bottom safe area even when keyboard hidden (esp. iPhone with home indicator).
- When replying inline, pin reply pill above composer so it stays visible as keyboard animates.

### 4.3 Message Bubble Interaction Details
- Tap once: deselect any reply context.
- Long-press: open contextual sheet anchored to bubble; highlight with subtle scale + shadow.
- Swipe right: reveal reply arrow; completing gesture inserts quoted bubble in composer.
- Swipe left (user messages only): delete/undo strip for 3 seconds.

### 4.4 Voice Input Placement & Behavior
- Primary mic button sits at right edge of composer in idle state for thumb reach.
- When text present (send button visible), mic becomes a floating circular button above keyboard on the right, maintaining quick access.
- States: idle, recording (red waveform + timer), review (playback snippet with trash/send), sending.
- Accessibility: double-tap mic toggles; haptic cues for start/stop possible on supported devices.

## 5. Future Hooks (Not MVP but pre-considered)
- Bottom nav for future tabs (Home, Chat, Files, Settings) — reserve safe-area space so composer can coexist later.
- Quick actions on lock screen widgets for "Drop a thought" using voice.
- Offline draft storage with queued send once unlock succeeds.

## 6. Open Questions / Next Steps
1. Confirm encryption UX copy with security/legal.
2. Define color tokens to ensure parity with desktop brand system.
3. Validate gesture set with accessibility review (VoiceOver/ TalkBack focus order around composer + mic button).
4. Prototype keyboard + voice transitions in Figma for motion tuning.

---

This document establishes the initial MVP contract. Update as flows harden or when additional screens (History, Notifications) join the scope.