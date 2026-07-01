#!/bin/bash
# Sync upstream stackblitz-labs/bolt.diy prompt files into this fork
# while preserving our WebContainer-specific tweaks.

set -euo pipefail

UPSTREAM_REMOTE="${UPSTREAM_REMOTE:-upstream}"
UPSTREAM_BRANCH="${UPSTREAM_BRANCH:-main}"
PROMPT_FILES=(
  app/lib/common/prompts/prompts.ts
  app/lib/common/prompts/new-prompt.ts
  app/lib/common/prompts/optimized.ts
  app/lib/common/prompt-library.ts
)

echo "Fetching ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}..."
git fetch "${UPSTREAM_REMOTE}" "${UPSTREAM_BRANCH}" --depth=1

echo "Syncing prompt files from upstream..."
for file in "${PROMPT_FILES[@]}"; do
  if git cat-file -e "${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}:${file}" 2>/dev/null; then
    mkdir -p "$(dirname "$file")"
    git show "${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}:${file}" > "${file}.upstream"
    echo "  fetched ${file}"
  else
    echo "  upstream ${file} not found"
  fi
done

echo ""
echo "Upstream versions saved to *.upstream files."
echo "Manually merge improvements, then run:"
echo "  rm app/lib/common/prompts/*.upstream"
echo "After merging, verify with:"
echo "  pnpm lint:fix && pnpm run build"
