# Night Build Snapshot
Generated: 2026-02-11T19:52:53Z

## Port Check
```
node      78140 miahammer   17u  IPv6 0xe184708ca23ba446      0t0  TCP *:3000 (LISTEN)
node      78461 miahammer   15u  IPv4 0x5efc9b145ea35541      0t0  TCP 127.0.0.1:18789 (LISTEN)
node      78461 miahammer   16u  IPv6 0x3ea56ac15cd9678f      0t0  TCP [::1]:18789 (LISTEN)
node      78461 miahammer   20u  IPv4 0x37973c1559601c85      0t0  TCP 127.0.0.1:18792 (LISTEN)
node      94537 miahammer   17u  IPv6 0x477fd6a233a51c79      0t0  TCP *:3001 (LISTEN)
node      94765 miahammer   15u  IPv4 0x2a31440ffdbd5c62      0t0  TCP 127.0.0.1:19001 (LISTEN)
node      94765 miahammer   16u  IPv6 0x1e7ae8ea9703a916      0t0  TCP [::1]:19001 (LISTEN)
node      94765 miahammer   20u  IPv4 0x27d22006db5de56a      0t0  TCP 127.0.0.1:19004 (LISTEN)
```

## Gateway Health
```
HammerLock AI gateway (19001): UP (serving Control UI)
Next.js (3000): UP
/api/health: {"status":"ready"}
```

## Git State
```
0012422 feat: add standalone ui
70eb013 chore: update setup script
9bb227f feat: add armored hammerlock mascot
3468272 chore: bootstrap hammerlock repo
ab827d7 Add files via upload
---
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   bin/hammerlock.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/
	vault.json

no changes added to commit (use "git add" and/or "git commit -a")
```

## Node Version
```
v25.6.0
```

## Auth Check
```
OpenAI key present: True
```

## File Tree (source only)
```
.
./.env.local
./.git
./.gitignore
./.next
./LICENSE
./README.md
./app
./app/globals.css
./app/layout.tsx
./app/page.tsx
./bin
./bin/hammerlock.js
./docs
./docs/night-build-snapshot.md
./lib
./lib/vault
./lib/vault/defaultVault.ts
./lib/vault/parseVault.ts
./lib/vault/schema.ts
./next-env.d.ts
./next.config.js
./node_modules
./package-lock.json
./package.json
./public
./public/hammerlock-logo.svg
./scripts
./scripts/install.sh
./templates
./templates/.env.example
./templates/vault.template.json
./tsconfig.json
./vault.json
```
