#!/usr/bin/env bash
# Run the full project (backend + frontend). Execute from project root: ./run.sh
# Requires: Node.js, MongoDB running (default: mongodb://localhost:27017)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Vérifier si le port MongoDB est ouvert (évite ECONNREFUSED au démarrage)
if command -v nc &>/dev/null; then
  if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB ne répond pas sur localhost:27017. Démarrez MongoDB puis relancez."
    echo "   Voir DEMARRAGE.md (ex: sudo systemctl start mongod)"
    exit 1
  fi
fi

echo "=== Installing backend dependencies ==="
npm install

echo "=== Installing frontend dependencies ==="
cd agent-hub-main && npm install && cd "$ROOT"

echo "=== Starting backend (port 4000) ==="
npm run server &
BACKEND_PID=$!

echo "=== Starting frontend (port 5173 or 8080) ==="
cd agent-hub-main && npm run dev &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping backend (PID $BACKEND_PID) and frontend (PID $FRONTEND_PID)..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:5173 (or port shown by Vite)"
echo "Press Ctrl+C to stop both."
wait
