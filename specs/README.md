# Specs

This folder is the project's design decision log. Each feature that goes
through the spec-driven workflow gets one numbered file here:
`specs/NN-slug.md`, written by the `spec-draft` skill and implemented by the
`spec-impl` skill (see [`skills/engineering/`](../skills/engineering/) at the
repo root of `skill-spec`, or wherever this project installed the skills).

Configuration for both skills lives in `specs/.spec-config.yml` (see
`.spec-config.yml.example` next to this file for the defaults —
`AutoCreateBranch` and `Language`). `spec-draft` creates it automatically
with the defaults the first time it saves a spec, if it doesn't exist yet.

## States

| State         | Meaning                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `Draft`       | `spec-draft` generated it, the human hasn't re-read it yet.                 |
| `In review`   | The human is iterating on it, possibly with the agent.                      |
| `Approved`    | The human read and authorized it. `spec-impl` only works with this state.   |
| `Implemented` | Code exists, acceptance criteria verified, version bumped in `CHANGELOG.md`.|
| `Obsolete`    | Replaced by another spec (see that spec's `Supersedes` field).              |

State labels are language-agnostic to `spec-impl` — `Approved`, `Aprobado`,
or the equivalent in any language all work; it matches by meaning. Pick one
language for this project's specs (`Language` in `.spec-config.yml`) and stay
consistent.

## Index

This table is kept up to date automatically: `spec-draft` adds a row when it
saves a new spec, `spec-impl` updates the row (state + version) when it
closes one. If you add or edit a spec by hand, update the row yourself too.

| # | Title | Status | Depends on | Supersedes | Implemented in |
| - | ----- | ------ | ---------- | ---------- | --------------- |
