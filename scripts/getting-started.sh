#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║                  HammerLock AI — Getting Started                   ║
# ║         Your encrypted AI assistant, set up in 2 minutes     ║
# ╚══════════════════════════════════════════════════════════════╝
set -euo pipefail

# ── Colors & formatting ──────────────────────────────────────
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[38;5;48m"
CYAN="\033[38;5;45m"
YELLOW="\033[38;5;220m"
RED="\033[38;5;196m"
PURPLE="\033[38;5;141m"
RESET="\033[0m"
CHECK="${GREEN}✓${RESET}"
ARROW="${CYAN}→${RESET}"
LOCK="${GREEN}🔐${RESET}"

banner() {
  echo ""
  echo -e "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║                                                      ║"
  echo "  ║            🔐  HammerLock AI — Getting Started             ║"
  echo "  ║                                                      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${RESET}"
}

section() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━ $1 ━━━${RESET}"
  echo ""
}

tip() {
  echo -e "  ${YELLOW}💡 TIP:${RESET} $1"
}

step() {
  echo -e "  ${ARROW} ${BOLD}$1${RESET}"
  echo -e "    ${DIM}$2${RESET}"
  echo ""
}

cmd() {
  echo -e "    ${GREEN}\$ $1${RESET}"
}

wait_key() {
  echo ""
  echo -e "  ${DIM}Press Enter to continue...${RESET}"
  read -r
}

# ── Start ────────────────────────────────────────────────────
clear
banner

echo -e "  ${DIM}Welcome! This guide walks you through everything you need"
echo -e "  to get the most out of HammerLock AI — from first launch to"
echo -e "  power-user features.${RESET}"

wait_key

# ══════════════════════════════════════════════════════════════
section "1/7  FIRST LAUNCH"
# ══════════════════════════════════════════════════════════════

step "Open HammerLock AI" \
     "Double-click HammerLock AI.app. A cinematic splash screen plays while the engine boots."

step "Create your vault password" \
     "This password is YOUR encryption key. It never leaves your device."

echo -e "  ${LOCK} ${BOLD}Security notes:${RESET}"
echo -e "    • AES-256 encryption — military-grade, on your machine"
echo -e "    • We ${BOLD}never${RESET} see, store, or recover your password"
echo -e "    • Use a strong password (12+ chars, mixed case, numbers, symbols)"
echo -e "    • If you forget it, your data is gone — that's the point"
echo ""

tip "HammerLock AI locks automatically when you close the window. Just enter your password next time."

wait_key

# ══════════════════════════════════════════════════════════════
section "2/7  SET UP YOUR PERSONA"
# ══════════════════════════════════════════════════════════════

echo -e "  On first chat, HammerLock AI asks 4 quick questions:"
echo ""
echo -e "    ${PURPLE}1.${RESET} What should I call you?"
echo -e "    ${PURPLE}2.${RESET} What do you do? (founder, engineer, lawyer...)"
echo -e "    ${PURPLE}3.${RESET} What will you use HammerLock AI for?"
echo -e "    ${PURPLE}4.${RESET} How should I talk to you? (casual, detailed, concise...)"
echo ""
echo -e "  This builds your ${BOLD}encrypted persona${RESET} — HammerLock AI uses it to"
echo -e "  personalize every response. You can update it anytime:"
echo ""
cmd "\"remember that I prefer bullet points\""
cmd "\"my timezone is PST\""
cmd "\"I'm now working on a fitness supplement brand\""
echo ""

tip "Your persona is stored encrypted in your local vault — never sent to any server."

wait_key

# ══════════════════════════════════════════════════════════════
section "3/7  CONNECT YOUR AI PROVIDERS"
# ══════════════════════════════════════════════════════════════

echo -e "  HammerLock AI supports ${BOLD}7 LLM providers${RESET}. Click the ${BOLD}🔑 API Keys${RESET}"
echo -e "  button in the sidebar to configure them."
echo ""
echo -e "  ${BOLD}Recommended setup:${RESET}"
echo ""
echo -e "    ${CHECK} ${BOLD}OpenAI${RESET} (GPT-4o-mini) — best all-around, powers voice too"
echo -e "    ${CHECK} ${BOLD}Anthropic${RESET} (Claude) — excellent for analysis & writing"
echo -e "    ${CHECK} ${BOLD}Google Gemini${RESET} — fast and free tier available"
echo ""
echo -e "  ${BOLD}Optional providers:${RESET}"
echo ""
echo -e "    ${DIM}○${RESET} ${BOLD}Groq${RESET} (Llama 3.3) — blazing fast inference"
echo -e "    ${DIM}○${RESET} ${BOLD}Mistral${RESET} — strong European alternative"
echo -e "    ${DIM}○${RESET} ${BOLD}DeepSeek${RESET} — cost-effective reasoning"
echo -e "    ${DIM}○${RESET} ${BOLD}Ollama${RESET} — 100% local, zero cloud (install from ollama.ai)"
echo ""
echo -e "  ${BOLD}For web search:${RESET}"
echo -e "    ${DIM}○${RESET} ${BOLD}Brave Search API${RESET} — add a key for live web results"
echo ""

tip "Keys are encrypted in your vault. HammerLock AI auto-routes to the best available provider."
echo ""
tip "Get free API keys: OpenAI (platform.openai.com), Gemini (aistudio.google.com), Groq (console.groq.com)"

wait_key

# ══════════════════════════════════════════════════════════════
section "4/7  MASTER THE AGENTS"
# ══════════════════════════════════════════════════════════════

echo -e "  HammerLock AI has ${BOLD}6 specialized agents${RESET} + custom agent creation."
echo -e "  Switch agents using the dropdown in the top bar."
echo ""
echo -e "    ${CYAN}🎯 Strategist${RESET}  — competitive analysis, GTM plans, M&A"
echo -e "    ${CYAN}⚖️  Counsel${RESET}     — legal research, compliance, contract review"
echo -e "    ${CYAN}📈 Analyst${RESET}     — financial modeling, scenario analysis"
echo -e "    ${CYAN}📚 Researcher${RESET}  — deep research, literature synthesis"
echo -e "    ${CYAN}🔧 Operator${RESET}    — task tracking, SOPs, project management"
echo -e "    ${CYAN}✍️  Writer${RESET}      — drafts, emails, proposals, blog posts"
echo ""
echo -e "  ${BOLD}Create custom agents:${RESET}"
echo -e "    Click ${BOLD}+ New Agent${RESET} in the agent dropdown. Set a name,"
echo -e "    personality, expertise, and custom instructions."
echo ""

tip "Each agent has quick commands in the sidebar. Try them!"
echo ""
tip "Example: Switch to Strategist and type \"competitive analysis for [your industry]\""

wait_key

# ══════════════════════════════════════════════════════════════
section "5/7  POWER USER COMMANDS"
# ══════════════════════════════════════════════════════════════

echo -e "  ${BOLD}Sidebar Quick Commands:${RESET}"
echo ""
echo -e "    ${GREEN}/status${RESET}         — check system status and connected providers"
echo -e "    ${GREEN}/search${RESET} [query] — live web search with cited sources"
echo -e "    ${GREEN}/summarize${RESET}      — summarize current conversation"
echo -e "    ${GREEN}/help${RESET}           — show all capabilities"
echo ""
echo -e "  ${BOLD}Sidebar Tools:${RESET}"
echo ""
echo -e "    ${GREEN}📎 Upload PDF${RESET}   — attach and analyze any PDF (max 10MB)"
echo -e "    ${GREEN}🎙️  Voice Input${RESET}  — click mic to dictate (uses Whisper)"
echo -e "    ${GREEN}📤 Share Chat${RESET}   — generate a 24hr shareable link"
echo -e "    ${GREEN}📊 Report${RESET}       — auto-generate session report"
echo -e "    ${GREEN}💾 Export${RESET}       — download chat as .txt file"
echo ""
echo -e "  ${BOLD}Memory Commands (type naturally):${RESET}"
echo ""
cmd "\"remember that I'm launching in Q2 2026\""
cmd "\"note: our target market is 25-40 year olds\""
cmd "\"load my persona\""
cmd "\"load my plan\"  (reads ~/.hammerlock/plan.md)"
echo ""

tip "Multi-conversation: Click '+ New Chat' in the sidebar. Organize chats into folders."
echo ""
tip "Keyboard: Enter = send, Shift+Enter = new line"

wait_key

# ══════════════════════════════════════════════════════════════
section "6/7  PRIVACY & SECURITY"
# ══════════════════════════════════════════════════════════════

echo -e "  HammerLock AI is built privacy-first. Here's what happens:"
echo ""
echo -e "    ${LOCK} ${BOLD}Encryption${RESET}"
echo -e "    Everything stored on disk is AES-256 encrypted."
echo -e "    Your password derives the key — we never have it."
echo ""
echo -e "    ${LOCK} ${BOLD}PII Anonymization${RESET}"
echo -e "    Before any query hits a cloud API, HammerLock AI's anonymizer"
echo -e "    strips names, emails, phone numbers, and addresses."
echo -e "    The LLM never sees your real personal data."
echo ""
echo -e "    ${LOCK} ${BOLD}Local-First Architecture${RESET}"
echo -e "    Your vault, persona, conversations, and files stay on"
echo -e "    your machine. Nothing is uploaded. Nothing is synced."
echo ""
echo -e "    ${LOCK} ${BOLD}Zero-Knowledge Design${RESET}"
echo -e "    We can't read your data. We can't recover your password."
echo -e "    We can't see your conversations. By design."
echo ""

tip "Use Ollama for 100% air-gapped operation — zero cloud dependency."

wait_key

# ══════════════════════════════════════════════════════════════
section "7/7  LANGUAGE & MOBILE"
# ══════════════════════════════════════════════════════════════

echo -e "  ${BOLD}Change Language:${RESET}"
echo -e "    Click the 🌐 globe icon in the sidebar to switch between"
echo -e "    11 languages: English, Portuguese, Spanish, French, German,"
echo -e "    Chinese, Japanese, Korean, Arabic, Hindi, Russian."
echo ""
echo -e "    The AI responses also come back in your selected language!"
echo ""
echo -e "  ${BOLD}Mobile Access (PWA):${RESET}"
echo -e "    While HammerLock AI desktop is running, open your phone browser to:"
echo ""
echo -e "    ${GREEN}http://[your-local-ip]:3100${RESET}"
echo ""
echo -e "    • ${BOLD}iPhone:${RESET} Safari → Share → Add to Home Screen"
echo -e "    • ${BOLD}Android:${RESET} Chrome → Menu → Install App"
echo ""
echo -e "    Same encrypted vault, mobile-friendly interface."
echo ""

tip "The landing page shows a QR code for easy mobile setup."

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                                                      ║"
echo "  ║              🎉  You're all set!                     ║"
echo "  ║                                                      ║"
echo "  ║   Open HammerLock AI and start with:                       ║"
echo "  ║     \"Tell me about yourself\"                         ║"
echo "  ║     \"Search for [anything]\"                          ║"
echo "  ║     \"Help me draft a [document]\"                     ║"
echo "  ║                                                      ║"
echo "  ║   Questions? info@personalhammerlock.com                ║"
echo "  ║                                                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
