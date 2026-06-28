#!/bin/sh
set -e

# Detect if running inside Docker or locally
if [ -d /app/backend ] && [ -d /app/frontend ]; then
  # --- Docker mode ---
  BACKEND_DIR=/app/backend
  FRONTEND_DIR=/app/frontend
  BACKEND_BIN=./server
  FRONTEND_CMD="node apps/web/server.js"
else
  # --- Local mode ---
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  BACKEND_DIR="$SCRIPT_DIR/apps/backend"
  FRONTEND_DIR="$SCRIPT_DIR/apps/web"
  BACKEND_BIN=./api
  FRONTEND_CMD="npm run dev"

  # Build backend binary if needed
  if [ ! -f "$BACKEND_DIR/api" ]; then
    echo "[start.sh] Building backend binary..."
    cd "$BACKEND_DIR"
    if command -v make >/dev/null 2>&1; then
      make build
    elif command -v go >/dev/null 2>&1; then
      go build -o api ./cmd/api
    else
      echo "[start.sh] ERROR: Neither make nor go found — cannot build backend" >&2
      exit 1
    fi
    cd "$SCRIPT_DIR"
  fi
fi

# Start backend in background
echo "[start.sh] Starting backend from $BACKEND_DIR ..."
cd "$BACKEND_DIR"
$BACKEND_BIN &

# Start frontend in foreground
echo "[start.sh] Starting frontend from $FRONTEND_DIR ..."
cd "$FRONTEND_DIR"
exec $FRONTEND_CMD
