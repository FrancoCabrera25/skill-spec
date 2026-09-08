#!/usr/bin/env bash
# Symlinks every skill under skills/engineering/ into Claude Code's skills
# directory, so local edits to this repo take effect immediately.
#
# Usage:
#   scripts/link-skills.sh            # personal install, ~/.claude/skills
#   scripts/link-skills.sh --project  # project install, ./.claude/skills (run from your project root)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills/engineering"

if [ "${1:-}" = "--project" ]; then
  TARGET_DIR="$(pwd)/.claude/skills"
else
  TARGET_DIR="$HOME/.claude/skills"
fi

mkdir -p "$TARGET_DIR"

for skill_dir in "$SKILLS_SRC"/*/; do
  [ -f "$skill_dir/SKILL.md" ] || continue
  name="$(basename "$skill_dir")"
  link="$TARGET_DIR/$name"
  if [ -L "$link" ] || [ -e "$link" ]; then
    rm -rf "$link"
  fi
  ln -s "$(realpath "$skill_dir")" "$link"
  echo "Linked $name -> $link"
done
