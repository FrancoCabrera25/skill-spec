#!/usr/bin/env bash
# Installs the spec-draft / spec-impl skills into a coding agent other than
# (or in addition to) Claude Code. Run this from the root of the project
# where you want the skills available.
#
# Usage:
#   scripts/install-to-agent.sh <agent>
#
# <agent> is one of: claude | cursor | codex | antigravity | gemini
#
# The agent is always explicit — this script does not try to auto-detect
# which agent you're running, on purpose: guessing wrong and silently
# writing files to the wrong place is worse than typing the name.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_ROOT/skills/engineering"
PROJECT_ROOT="$(pwd)"

AGENT="${1:-}"
if [ -z "$AGENT" ]; then
  echo "Usage: $0 <claude|cursor|codex|antigravity|gemini>" >&2
  exit 1
fi

# Strips Claude Code-specific frontmatter keys (disable-model-invocation,
# argument-hint, allowed-tools) but keeps name/description and the full body.
# Other agents don't understand those keys, so we drop them rather than
# ship something that half-parses.
strip_claude_frontmatter() {
  local src="$1"
  awk '
    BEGIN { in_fm = 0; fm_done = 0 }
    /^---[[:space:]]*$/ && !fm_done {
      if (in_fm == 0) { in_fm = 1; next }
      else { in_fm = 0; fm_done = 1; next }
    }
    in_fm == 1 { next }
    fm_done == 0 { next }
    { print }
  ' "$src"
}

install_claude() {
  echo "Agent: claude -> symlinking into $PROJECT_ROOT/.claude/skills"
  "$REPO_ROOT/scripts/link-skills.sh" --project
}

install_cursor() {
  local target="$PROJECT_ROOT/.cursor/rules"
  mkdir -p "$target"
  for skill_dir in "$SKILLS_SRC"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    local name; name="$(basename "$skill_dir")"
    local out="$target/$name.mdc"
    {
      echo "---"
      description=$(sed -n 's/^description:[[:space:]]*//p' "$skill_dir/SKILL.md" | head -n1)
      echo "description: ${description:-$name skill}"
      echo "alwaysApply: false"
      echo "---"
      echo
      strip_claude_frontmatter "$skill_dir/SKILL.md"
    } > "$out"
    echo "Agent: cursor -> wrote $out (invoke with @$name)"
  done
}

install_codex() {
  local target="$PROJECT_ROOT/.codex/skills"
  mkdir -p "$target"
  local agents_md="$PROJECT_ROOT/AGENTS.md"
  [ -f "$agents_md" ] || : > "$agents_md"

  if ! grep -q '^## Skills$' "$agents_md" 2>/dev/null; then
    {
      echo
      echo "## Skills"
      echo
    } >> "$agents_md"
  fi

  for skill_dir in "$SKILLS_SRC"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    local name; name="$(basename "$skill_dir")"
    local out_dir="$target/$name"
    mkdir -p "$out_dir"
    strip_claude_frontmatter "$skill_dir/SKILL.md" > "$out_dir/SKILL.md"
    [ -f "$skill_dir/template.md" ] && cp "$skill_dir/template.md" "$out_dir/template.md"
    if ! grep -q "\.codex/skills/$name/SKILL.md" "$agents_md" 2>/dev/null; then
      echo "- \`$name\`: see \`.codex/skills/$name/SKILL.md\`" >> "$agents_md"
    fi
    echo "Agent: codex -> wrote $out_dir/SKILL.md, referenced from AGENTS.md"
  done
}

install_antigravity() {
  local target="$PROJECT_ROOT/.antigravity/skills"
  mkdir -p "$target"
  for skill_dir in "$SKILLS_SRC"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    local name; name="$(basename "$skill_dir")"
    local out_dir="$target/$name"
    mkdir -p "$out_dir"
    strip_claude_frontmatter "$skill_dir/SKILL.md" > "$out_dir/SKILL.md"
    [ -f "$skill_dir/template.md" ] && cp "$skill_dir/template.md" "$out_dir/template.md"
    echo "Agent: antigravity -> wrote $out_dir/SKILL.md"
  done
}

install_gemini() {
  local target="$PROJECT_ROOT/.gemini/skills"
  mkdir -p "$target"
  local gemini_md="$PROJECT_ROOT/GEMINI.md"
  [ -f "$gemini_md" ] || : > "$gemini_md"

  if ! grep -q '^## Skills$' "$gemini_md" 2>/dev/null; then
    {
      echo
      echo "## Skills"
      echo
    } >> "$gemini_md"
  fi

  for skill_dir in "$SKILLS_SRC"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    local name; name="$(basename "$skill_dir")"
    local out_dir="$target/$name"
    mkdir -p "$out_dir"
    strip_claude_frontmatter "$skill_dir/SKILL.md" > "$out_dir/SKILL.md"
    [ -f "$skill_dir/template.md" ] && cp "$skill_dir/template.md" "$out_dir/template.md"
    if ! grep -q "\.gemini/skills/$name/SKILL.md" "$gemini_md" 2>/dev/null; then
      echo "- \`$name\`: see \`.gemini/skills/$name/SKILL.md\`" >> "$gemini_md"
    fi
    echo "Agent: gemini -> wrote $out_dir/SKILL.md, referenced from GEMINI.md"
  done
}

case "$AGENT" in
  claude) install_claude ;;
  cursor) install_cursor ;;
  codex) install_codex ;;
  antigravity) install_antigravity ;;
  gemini) install_gemini ;;
  *)
    echo "Unknown agent '$AGENT'. Expected: claude | cursor | codex | antigravity | gemini" >&2
    exit 1
    ;;
esac

if [ ! -d "$PROJECT_ROOT/specs" ]; then
  echo
  echo "Note: $PROJECT_ROOT/specs does not exist yet. spec-draft will create"
  echo "specs/NN-slug.md and specs/.spec-config.yml the first time you run it,"
  echo "or you can create specs/ yourself now."
fi
