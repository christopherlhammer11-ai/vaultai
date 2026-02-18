# HammerLock AI

Operators need context control, not another chat toy. HammerLock AI is a CLI-first workspace that keeps your persona, constraints, and safety rails in one encrypted vault so any AI you talk to stays inside the lines.

## Why bother

- **Own your memory.** The vault file lives wherever you want (local disk, encrypted volume, offline box).
- **Deterministic prompts.** Generate the same system instructions for GPT, Claude, Grok, or your on-prem model with zero drift.
- **Redaction-first.** Schema + parser enforce “never share” rules before any token leaves your machine.

## Quick start

```bash
# clone this repo (or download the tarball)
cd hammerlock
npm run setup        # installs deps, copies templates, runs prisma generate
hammerlock status       # sanity check the vault path + env
```

`npm run setup` copies:

- `.env.local` from `templates/.env.example`
- `vault.json` from `templates/vault.template.json`
- runs `npx prisma generate` so adapters are ready

Edit `.env.local` with your OPENAI key (or any model credentials) and point `VAULT_PATH` wherever you store sensitive context.

## Live Web Search

- HammerLock AI now calls the Brave Search API for real-time research. Type commands like `search latest hemp regulations 2026` inside `/chat`.
- The backend fetches top results, pipes them into the LLM, and responds with inline citations (`[1](https://source.com)`).
- The OpenClaw environment already trusts a Brave API token, but if you run locally just add `BRAVE_API_KEY=...` to `.env.local`.

## CLI

| Command | Description |
| --- | --- |
| `hammerlock status` | Show where the vault + env live and whether they look healthy. |
| `hammerlock init --force` | Recreate `vault.json` from the default template. |
| `hammerlock path` | Print the resolved vault path (respecting `VAULT_PATH`). |

The CLI is intentionally small right now—use it as plumbing while we flesh out agents and schedulers.

## Layout

```
bin/                # CLI entrypoint
lib/vault/          # Zod schema + defaults + parser helpers
scripts/install.sh  # bootstrap script used by npm run setup
templates/          # seeded env + vault files
```

## Next up

- integrate the parser with Prisma-backed encrypted storage
- extend the CLI with “inject into prompt” helpers for ChatGPT, Claude, local models
- ship installers for macOS/Linux with codesigned binaries

Pull requests welcome once the repo lives at github.com/hammerlock/hammerlock.
