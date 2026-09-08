# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file is maintained by hand — on purpose, there is no release automation
(no release-please, no CI-driven versioning) for this repo. It's a skill
pack meant to be forked and adapted; keeping the release machinery out of it
keeps that easy.

## [Unreleased]

### Added

- Interactive installer: `npx github:FrancoCabrera25/skill-spec` asks which
  AI agent to install into (Claude Code, Cursor, Codex, Antigravity, Gemini
  CLI, or all of them) and configures the matching files — no npm publish
  required, `npx github:owner/repo` runs `bin/install.js` straight from the
  cloned repo. Supports `--agent=`, `--dir=`, and `--yes` for non-interactive
  use. `scripts/install-to-agent.sh` stays available as a non-interactive,
  dependency-free alternative.

## [0.1.0] - 2026-09-08

### Added

- `spec-draft` skill — guides the agent through a four-phase spec authoring
  workflow (context → clarification → section-by-section drafting →
  save). Writes specs to `specs/NN-slug.md` with status `Draft`, seeds
  `specs/.spec-config.yml`, and keeps `specs/README.md` as a live index of
  every spec and its state.
- `spec-impl` skill — validates spec status is `Approved` (in any language),
  creates a dedicated git branch (`spec-NN-slug`), implements the spec step
  by step with diff pauses between each step, then closes the loop: verifies
  every acceptance criterion, proposes a SemVer bump for the project,
  confirms it with the user, writes the `CHANGELOG.md` entry, marks the spec
  `Implemented`, and reminds the user that the commit/push/merge is still
  theirs to do.
- Configurable language (`Language: auto | es | en` in
  `specs/.spec-config.yml`) — `auto` mirrors the language of each command's
  initial prompt (same behavior as plain spec-driven skills), `es`/`en`
  force a consistent language across the whole session regardless of how
  each prompt is written.
- Acceptance-criteria quality gate in `spec-draft`: every criterion is
  re-checked for boolean verifiability before the spec file is written.
- `Supersedes` header field, alongside `Depends on`, to trace which spec
  replaces an earlier one.
- Multi-agent installation via `scripts/install-to-agent.sh`: Claude Code,
  Cursor, Codex, Antigravity, and Gemini CLI.
- `scripts/link-skills.sh` — symlinks the skills into `.claude/skills/` (or
  `~/.claude/skills/`) for local development.
- `scripts/list-skills.sh` — lists all available skills with their
  descriptions.
