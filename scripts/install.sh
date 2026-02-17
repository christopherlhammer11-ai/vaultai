#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  echo "[hammerlock] $1"
}

copy_if_missing() {
  local source=$1
  local target=$2
  if [[ -f "$target" ]]; then
    log "✓ $(basename "$target") already exists"
  else
    cp "$source" "$target"
    log "→ created $(basename "$target")"
  fi
}

log "Installing npm dependencies"
npm install

log "Seeding template files"
copy_if_missing templates/.env.example .env.local
copy_if_missing templates/vault.template.json vault.json

if command -v npx >/dev/null 2>&1; then
  log "Running prisma generate"
  npx prisma generate >/dev/null || log "prisma generate failed (OK if you haven't configured schema yet)"
else
  log "npx not found; skipping prisma generate"
fi

log "Setup complete"
