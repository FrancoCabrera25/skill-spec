#!/usr/bin/env bash
# Lists the skills available in this repo, with their one-line description
# read straight from each SKILL.md frontmatter.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "No skills/ directory found at $SKILLS_DIR" >&2
  exit 1
fi

found=0
while IFS= read -r -d '' skill_md; do
  found=1
  name=$(sed -n 's/^name:[[:space:]]*//p' "$skill_md" | head -n1)
  description=$(sed -n 's/^description:[[:space:]]*//p' "$skill_md" | head -n1)
  skill_dir=$(dirname "$skill_md")
  printf '%-16s %s\n' "${name:-?}" "${description:-(no description)}"
  printf '%-16s %s\n\n' "" "$(realpath --relative-to="$REPO_ROOT" "$skill_dir")"
done < <(find "$SKILLS_DIR" -name SKILL.md -print0 | sort -z)

if [ "$found" -eq 0 ]; then
  echo "No SKILL.md files found under $SKILLS_DIR" >&2
  exit 1
fi
