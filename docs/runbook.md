# HammerLock AI Runbook

## Port Assignments

| Service             | Port  |
|---------------------|-------|
| Next.js Dev         | 3000  |
| Next.js Electron    | 3100  |
| OpenClaw Workstation| 18789 |
| OpenClaw HammerLock AI    | 19001 |

## Starting Services

### Next.js Dev Server
```bash
cd ~/hammerlock && npm run dev
```

### OpenClaw Workstation Gateway
```bash
openclaw gateway
```

### OpenClaw HammerLock AI Gateway
```bash
openclaw --profile hammerlock gateway
```

### Electron App (Dev)
```bash
cd ~/hammerlock && npm run electron:dev
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
openclaw --profile hammerlock gateway
```

## Deploying to Vercel

```bash
cd ~/hammerlock && vercel --prod
```

Live URL: https://hammerlock-rouge.vercel.app

## Building Electron

```bash
# Mac only
cd ~/hammerlock && npm run electron:build:mac

# Output: dist-electron/HammerLock-AI-*.dmg
```

## Electron Release CI
- Workflow: `.github/workflows/electron-release.yml`
- Trigger: pushing tags matching `v*`
- Runner: `macos-13`, builds via `npm run electron:build:mac`
- Signing secrets required in GitHub: `MAC_SIGNING_CERT` (base64 P12), `MAC_SIGNING_CERT_PASSWORD`, `APPLE_API_KEY` (base64 p8), `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`, `APPLE_TEAM_ID`
- Artifacts: uploads `dist-electron/*.dmg` to Actions + attaches DMG to the tag release

## Mobile Expo CI (pre-scaffold)
- Workflow: `.github/workflows/mobile-eas.yml`
- Trigger: pushes/PRs touching `apps/mobile/**` (plus manual dispatch)
- Runner: `macos-13`; job waits until `apps/mobile/package.json` exists
- Steps: `npm ci`, `npx expo-doctor`, and `eas build --profile preview` (local, iOS preview tarball)
- Secrets needed: `EXPO_TOKEN`
- Artifacts: uploads `build/mobile-ios-preview.tar.gz`

## Fixing "No API Key" Error

Check that `.env.local` has the required keys:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_API_KEY=BSA...
```

For the OpenClaw gateway, check:
```
~/.openclaw-hammerlock/agents/main/agent/auth-profiles.json
```
