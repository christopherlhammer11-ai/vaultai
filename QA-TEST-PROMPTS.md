# HammerLock AI QA Test Prompts
### Complete Test Matrix — February 2026

---

## 1. General Conversation (Is it a real assistant?)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 1.1 | `hello` | Short friendly greeting (1-2 sentences). No mention of encryption, AES-256, or app development. |
| 1.2 | `what can you help me with?` | Lists general capabilities: questions, recipes, planning, research, writing, etc. NOT restricted to any single domain. |
| 1.3 | `can i get a slow cooked tri tip recipe?` | Gives an actual recipe with ingredients and steps. Does NOT suggest app ideas. |
| 1.4 | `what's 247 times 38?` | Returns 9,386. Quick math, no fluff. |
| 1.5 | `write me a short birthday message for my wife` | Writes a warm, personal birthday message. |
| 1.6 | `explain blockchain like I'm 10` | Simple, age-appropriate explanation. No jargon. |
| 1.7 | `help me plan a date night` | Gives real suggestions: dinner ideas, activities, etc. |

**PASS criteria:** Responses are natural, helpful, general-purpose. No mention of encryption or technical architecture unless asked.

---

## 2. Conversation Memory (Does it remember context?)

Run these IN ORDER in the same chat:

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 2.1 | `my name is Chris and I live in San Ramon, CA` | Acknowledges name and location. |
| 2.2 | `I have 2 kids and my wife is pregnant` | Acknowledges family info. |
| 2.3 | `what should we do today as a family?` | Suggests family-friendly activities in San Ramon, CA. References kids and pregnant wife (not extreme activities). |
| 2.4 | `nah, weather is bad. indoor options?` | Pivots to indoor activities still in San Ramon area. Remembers the family context. |
| 2.5 | `what about just eating somewhere?` | Suggests restaurants, remembers San Ramon and family (kid-friendly spots). |
| 2.6 | `summarize our conversation so far` | Accurate summary that mentions: Chris, San Ramon, family, looking for activities/restaurants, weather was bad. |

**PASS criteria:** Each response references info from earlier messages. No "I don't know where you live" or "Could you tell me more about yourself?" after already being told.

---

## 3. Web Search (Does it find real-time info?)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 3.1 | `what's the weather in San Ramon CA today?` | Auto-triggers web search. Returns real weather data with source links. |
| 3.2 | `what's the news today?` | Auto-triggers search. Returns formatted headlines with sections (US, World, Sports, etc.) and source links. |
| 3.3 | `best restaurants in San Ramon CA` | Auto-triggers search. Returns real restaurants with names, not hallucinated ones. |
| 3.4 | `search latest AI news` | Explicit search trigger. Returns 10 results with thumbnails, domains, and snippets. |
| 3.5 | `how much is Bitcoin right now?` | Auto-triggers search. Returns current price with source. |
| 3.6 | `what are the Olympics results today?` | Auto-triggers search. Returns real results. |
| 3.7 | `slow cooker tri tip recipe` | Auto-triggers search (recipe keyword). Returns real recipe from the web. |

**PASS criteria:**
- Search auto-triggers without needing "search" prefix
- Results include source links with thumbnails
- LLM summary is well-formatted with headers and bullets
- Sources section appears below with clickable cards
- No hallucinated/fake information

---

## 4. Response Formatting (Does it look premium?)

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 4.1 | `give me a detailed comparison of React vs Vue` | Response uses: **bold headers**, bullet points, maybe a comparison table. Well-structured. |
| 4.2 | `write me a project plan for launching a mobile app` | Uses numbered lists, sections with headers, clear structure. |
| 4.3 | `explain the US tax brackets for 2025` | Uses formatted table or organized list. Dollar amounts bolded. |
| 4.4 | `search top 10 movies of 2025` | LLM summary is sectioned. Sources below have linked titles, thumbnails, domains. |

**PASS criteria:**
- Headers (h1, h2, h3) render with proper weight and sizing
- Bullet lists have custom green dots
- Numbered lists have green circle badges
- Bold text is bright white
- Code snippets have accent-colored chip styling
- Links are green with smooth underline
- Tables have styled headers and hover rows

---

## 5. Voice Input & Output (TTS)

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 5.1 | Click mic, say "What time is it in Tokyo?" | Voice is transcribed correctly. AI responds with Tokyo time. |
| 5.2 | Click speaker icon on any AI response | Audio plays back using OpenAI TTS (natural female voice "nova"). Not robotic browser voice. |
| 5.3 | Click speaker icon again while playing | Audio stops immediately. |
| 5.4 | Click speaker on a long response with markdown | Markdown is stripped. Audio plays clean text only (no "hashtag hashtag" or "asterisk"). |

**PASS criteria:** Voice input transcribes accurately. TTS plays natural-sounding audio. Toggling works.

---

## 6. File Vault (Encrypted storage)

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 6.1 | Click "My Vault" in sidebar | Vault panel opens. Shows item count. Empty state if new. |
| 6.2 | Click "New Note" in vault panel | Note form appears with title field and text area. |
| 6.3 | Write a note, click Save | Note appears in vault list with "note" tag and today's date. |
| 6.4 | Search for the note by typing in vault search bar | Note appears in filtered results. |
| 6.5 | Upload a PDF via the + button | PDF is parsed and auto-saved to vault. Appears in vault list as "pdf" type. |
| 6.6 | Click Send icon on a vault file | File content loads as chat context (attachment chip appears). |
| 6.7 | Click Copy icon on a vault file | Content copied to clipboard. |
| 6.8 | Click Trash icon on a vault file | File removed from vault list. |
| 6.9 | On an AI response, click Archive button | Response saved to vault as "snippet" type. "Saved to Vault!" toast appears. |
| 6.10 | Close and reopen vault panel | All saved files persist (encrypted in localStorage). |
| 6.11 | Lock vault (sidebar lock button), then unlock | Vault files still present after unlock (encrypted/decrypted correctly). |

**PASS criteria:** Files persist across sessions. Encryption doesn't corrupt data. Search works. All actions (save, delete, copy, use in chat) function correctly.

---

## 7. PDF Upload & Analysis

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 7.1 | Click + button, select a PDF file | File parses successfully. Attachment chip appears below input. |
| 7.2 | Send message "summarize this document" with PDF attached | AI gives accurate summary of the PDF content. |
| 7.3 | Ask a specific question about the PDF content | AI answers using the PDF text as context. |
| 7.4 | Upload a large PDF (5-10MB) | Parses without error. May take a moment. |
| 7.5 | Upload a non-PDF file (.docx, .txt) | Error message: "Supported formats: PDF, PNG, JPG, GIF, WebP" |
| 7.6 | Upload a file over 10MB | Error message: "File too large (max 10MB)" |

**PASS criteria:** PDFs parse and provide usable context. Error handling is clean. Auto-saved to vault.

---

## 8. Agents (Specialized modes)

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 8.1 | Switch to "Strategist" agent in sidebar | Agent badge appears in topbar and input bar. |
| 8.2 | Ask "analyze the competitive landscape for AI assistants" | Response is strategic/analytical in tone, not generic. |
| 8.3 | Click X on agent chip in input bar | Returns to General agent. Badge disappears. |
| 8.4 | Click "New Chat" while agent is active | New chat opens AND agent resets to General. |
| 8.5 | Switch to "Writer" agent, ask "write a cold outreach email" | Response is in professional writing style. |
| 8.6 | Create a custom agent (sidebar > Agents > Create) | Custom agent appears in agent list with chosen icon and color. |

**PASS criteria:** Agents change response tone/style. Switching and resetting work. Custom agents persist.

---

## 9. Sidebar & Layout

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 9.1 | Click collapse button on sidebar | Sidebar slides closed. Floating hamburger menu button appears. |
| 9.2 | Check if chat area expands to fill space | Messages should use more horizontal width (960px max when sidebar closed). |
| 9.3 | Click hamburger button | Sidebar reopens. |
| 9.4 | Create 5+ new chats | All appear in sidebar conversation list. Can switch between them. |
| 9.5 | Right-click a conversation | Rename mode activates. Can type new name and press Enter. |
| 9.6 | Delete a conversation (trash icon) | Conversation removed. Active chat switches to another. |

**PASS criteria:** Sidebar toggle works smoothly. Chat expands when sidebar hidden. Conversations persist and can be managed.

---

## 10. Persona & Memory

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 10.1 | `remember: I love sushi and hate cilantro` | "Got it, I'll remember that" confirmation. |
| 10.2 | `remember: My dog's name is Max` | Saved to persona. |
| 10.3 | `tell me about myself` | Shows persona with all remembered items. |
| 10.4 | `suggest a dinner for tonight` | Should factor in sushi preference and cilantro avoidance. |
| 10.5 | New chat > `what's my dog's name?` | Should know "Max" from persona (persona persists across chats). |

**PASS criteria:** Persona info saves, loads, and influences AI responses across conversations.

---

## 11. Quick Commands

| # | Prompt | Expected Behavior |
|---|--------|-------------------|
| 11.1 | `status` | Shows system status: vault, persona, provider connections. |
| 11.2 | `help` | Shows available commands and capabilities. |
| 11.3 | Click "Generate Report" in sidebar | Generates a formatted summary report of the current conversation. |
| 11.4 | Click "Export Chat" in sidebar | Downloads conversation as text/markdown file. |
| 11.5 | Click "Share Chat" in sidebar | Creates a shareable link (or shows share dialog). |

---

## 12. Edge Cases & Error Handling

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 12.1 | Send empty message (just spaces) | Send button disabled. Nothing sent. |
| 12.2 | Send while AI is still responding | Can still type (input not disabled). Previous response completes normally. |
| 12.3 | Disconnect internet, then send a message | Graceful error message, not a crash. |
| 12.4 | Type in Portuguese: "oi, tudo bem?" | Responds in English (UI language), understands Portuguese input. |
| 12.5 | Very long message (1000+ chars) | Handles without breaking layout. Textarea expands. |
| 12.6 | Rapid fire 5 messages quickly | Handles queue without duplicating or losing messages. |

---

## 13. Multi-Language

| # | Action | Expected Behavior |
|---|--------|-------------------|
| 13.1 | Switch language to Portuguese (sidebar) | All UI labels change to Portuguese. |
| 13.2 | Send a message in English | AI responds in Portuguese (matches UI language). |
| 13.3 | Switch back to English | UI returns to English. AI responds in English. |

---

## Scoring

| Category | Tests | Pass | Fail | Notes |
|----------|-------|------|------|-------|
| 1. General Conversation | 7 | | | |
| 2. Conversation Memory | 6 | | | |
| 3. Web Search | 7 | | | |
| 4. Response Formatting | 4 | | | |
| 5. Voice I/O | 4 | | | |
| 6. File Vault | 11 | | | |
| 7. PDF Upload | 6 | | | |
| 8. Agents | 6 | | | |
| 9. Sidebar & Layout | 6 | | | |
| 10. Persona & Memory | 5 | | | |
| 11. Quick Commands | 5 | | | |
| 12. Edge Cases | 6 | | | |
| 13. Multi-Language | 3 | | | |
| **TOTAL** | **76** | | | |

---

*Generated for HammerLock AI v0.1.0 — February 2026*
