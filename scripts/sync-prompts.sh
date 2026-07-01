#!/bin/bash
# Fetch prompt files from the tracked upstream prompt repository
# https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
# Run this script periodically to review new prompt improvements.

set -euo pipefail

PROMPT_REPO="https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools"
CLONE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/bolt-app-builder-prompts"

echo "Cloning/updating prompt repo at ${CLONE_DIR}..."
if [ -d "${CLONE_DIR}/.git" ]; then
  git -C "${CLONE_DIR}" pull --depth=1
else
  rm -rf "${CLONE_DIR}"
  git clone --depth=1 "${PROMPT_REPO}" "${CLONE_DIR}"
fi

echo ""
echo "Relevant prompt files:"
echo "  - ${CLONE_DIR}/Open Source prompts/Bolt/Prompt.txt"
echo "  - ${CLONE_DIR}/Lovable/Agent Prompt.txt"
echo "  - ${CLONE_DIR}/v0 Prompts and Tools/Prompt.txt"
echo ""
echo "Review these files and manually merge improvements into:"
echo "  app/lib/common/prompts/new-prompt.ts"
echo "  app/lib/common/prompts/prompts.ts"
