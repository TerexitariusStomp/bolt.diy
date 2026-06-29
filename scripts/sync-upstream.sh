#!/usr/bin/env bash
set -euo pipefail

# Sync script: pulls latest changes from upstream bolt.diy
# and merges them into our fork while preserving customizations

echo "=== Syncing with upstream bolt.diy ==="

git fetch upstream

UPSTREAM_COMMIT=$(git rev-parse upstream/main)
LOCAL_COMMIT=$(git rev-parse HEAD)

if [ "$UPSTREAM_COMMIT" = "$LOCAL_COMMIT" ]; then
  echo "Already up to date with upstream."
  exit 0
fi

echo "Upstream has new changes. Merging..."
git merge upstream/main --no-edit

if [ $? -ne 0 ]; then
  echo ""
  echo "Merge conflicts detected. Resolve them manually, then:"
  echo "  git add ."
  echo "  git commit"
  echo ""
  echo "Key files we customize (likely conflict zones):"
  echo "  - app/utils/constants.ts (DEFAULT_MODEL)"
  echo "  - app/lib/modules/llm/manager.ts (getDefaultProvider)"
  echo "  - app/routes/_index.tsx (page title)"
  echo "  - wrangler.toml (custom domain)"
  exit 1
fi

echo ""
echo "Sync complete. Push to your fork with:"
echo "  git push origin main"
