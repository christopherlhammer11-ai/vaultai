# VaultAI Runbook

## Port Assignments

| Service             | Port  |
|---------------------|-------|
| Next.js Dev         | 3000  |
| Next.js Electron    | 3100  |
| OpenClaw Workstation| 18789 |
| OpenClaw VaultAI    | 19001 |

## Starting Services

### Next.js Dev Server
```bash
cd ~/vaultai && npm run dev
```

### OpenClaw Workstation Gateway
```bash
openclaw gateway
```

### OpenClaw VaultAI Gateway
```bash
openclaw --profile vaultai gateway
```

### Electron App (Dev)
```bash
cd ~/vaultai && npm run electron:dev
```

## Health Checks

```bash
# Gateway health
curl -s http://127.0.0.1:19001/health
curl -s http://127.0.0.1:18789/health

# Next.js API health
curl -s http://localhost:3000/api/health

# Check which ports are in use
lsof -nP -iTCP -sTCP:LISTEN | grep node
```

## Restarting Gateways

```bash
# Find and kill the process
lsof -nP -iTCP:19001 -sTCP:LISTEN
kill <PID>

# Restart
openclaw --profile vaultai gateway
```

## Deploying to Vercel

```bash
cd ~/vaultai && vercel --prod
```

Live URL: https://vaultai-rouge.vercel.app

## Building Electron

```bash
# Mac only
cd ~/vaultai && npm run electron:build:mac

# Output: dist-electron/VaultAI-*.dmg
```

## Fixing "No API Key" Error

Check that `.env.local` has the required keys:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_API_KEY=BSA...
```

For the OpenClaw gateway, check:
```
~/.openclaw-vaultai/agents/main/agent/auth-profiles.json
```
