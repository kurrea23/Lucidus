#!/usr/bin/env bash
# Lucidus first-time setup script.
# Run once after cloning: bash setup.sh
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔${NC}  $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
fail() { echo -e "${RED}✘${NC}  $*"; exit 1; }

echo ""
echo "═══════════════════════════════════════════"
echo "  Lucidus setup"
echo "═══════════════════════════════════════════"
echo ""

# ── Python version ────────────────────────────────────────────────────────────
PY=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
MAJOR=$(echo "$PY" | cut -d. -f1)
MINOR=$(echo "$PY" | cut -d. -f2)
if [[ "$MAJOR" -lt 3 || ( "$MAJOR" -eq 3 && "$MINOR" -lt 11 ) ]]; then
  fail "Python 3.11+ required (found $PY). Install via pyenv or your package manager."
fi
ok "Python $PY"

# ── ffmpeg ────────────────────────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  fail "ffmpeg not found. Install it:\n  macOS:  brew install ffmpeg\n  Ubuntu: sudo apt install ffmpeg"
fi
ok "ffmpeg $(ffmpeg -version 2>&1 | awk 'NR==1 {print $3}')"

# ── Virtual environment ───────────────────────────────────────────────────────
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  ok "Created .venv"
else
  ok ".venv already exists"
fi
# shellcheck disable=SC1091
source .venv/bin/activate

# ── Dependencies ──────────────────────────────────────────────────────────────
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
ok "Dependencies installed"

# ── Config ────────────────────────────────────────────────────────────────────
if [[ ! -f config.yaml ]]; then
  cp config.example.yaml config.yaml
  ok "Created config.yaml from template"
else
  ok "config.yaml already exists"
fi

# ── .env ─────────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  cat > .env <<'EOF'
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Instagram (when enabled)
IG_ACCESS_TOKEN=
IG_BUSINESS_ACCOUNT_ID=

# Cloudflare R2 (for Instagram video hosting)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

# TikTok (when enabled)
TIKTOK_ACCESS_TOKEN=
TIKTOK_OPEN_ID=

# Cockpit auth (optional — only needed when exposing on the network)
COCKPIT_USER=
COCKPIT_PASS=
EOF
  ok "Created .env template — fill in your API keys"
else
  ok ".env already exists"
fi

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p videos/inbox videos/posted videos/failed data
ok "Created directory structure"

# ── Smoke test ────────────────────────────────────────────────────────────────
echo ""
echo "Running smoke test..."
if python tests/smoke.py; then
  ok "Smoke test passed"
else
  fail "Smoke test failed — check the output above"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Edit config.yaml (enable platforms, adjust schedule)"
echo "  3. For YouTube: download client_secrets.json from Google Cloud Console"
echo "  4. Run: source .venv/bin/activate && python -m src.main config.yaml"
echo "  5. Open: http://localhost:8765"
echo "═══════════════════════════════════════════"
echo ""
