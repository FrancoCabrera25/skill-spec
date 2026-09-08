[English](README.md) · [Español](README-es.md)

<p align="center">
  <h1 align="center">skill-spec</h1>
  <p align="center">Spec-driven design skills for Claude Code, Cursor, Codex, Antigravity, and Gemini CLI.</p>
  <p align="center">Design the feature. Approve it. Implement it step by step. Close it with a version and a changelog entry.</p>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="Skills" src="https://img.shields.io/badge/skills-2-blue">
  <img alt="Agents" src="https://img.shields.io/badge/agents-5-blue">
</p>

## Quick start

```bash
cd ~/your-project
npx github:FrancoCabrera25/skill-spec
```

It asks which AI agent you're installing into (Claude Code, Cursor, Codex,
Antigravity, Gemini CLI, or all of them) and configures the right files for
that agent. No npm publish, no global install — `npx github:owner/repo`
clones the repo and runs it on the spot. Non-interactive:

```bash
npx github:FrancoCabrera25/skill-spec --agent=cursor
```

## Skills

| Skill | Command | Description | Argument |
| --- | --- | --- | --- |
| `spec-draft` | `spec-draft [short-topic]` | Designs the feature document by asking clarifying questions. | — |
| `spec-impl` | `spec-impl <NN-slug>` | Validates the spec is approved, implements it step by step, then verifies acceptance criteria, bumps the project's version, and writes the `CHANGELOG.md` entry. | `<NN-slug>` |

---

## Table of contents

- [What spec-driven design is](#what-spec-driven-design-is)
- [The problem it solves](#the-problem-it-solves)
- [Anatomy of a useful spec](#anatomy-of-a-useful-spec)
- [How this skill pack works](#how-this-skill-pack-works)
- [When to use specs and when not](#when-to-use-specs-and-when-not)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [License](#license)

---

## What spec-driven design is

Spec-driven design (also called spec-driven development) is an approach
where **the spec is the main work artifact, not the code**. The code is the
consequence of the spec, not the other way around.

It sounds obvious — "document before coding" isn't new — but spec-driven
design is more specific than that: the spec **isn't optional or
decorative documentation written after the fact**. It's the contract that
guides execution, it's versioned in the same repo as the code, and it's kept
alive as the project evolves. If the code diverges from the spec, one of the
two is wrong, and you can point at which.

Each spec captures the decisions of a single feature. Specs live in
`specs/` as `.md` files numbered sequentially (`specs/01-*.md`,
`specs/02-*.md`, ...), and together they form the project's design decision
log — the answer to "why does this work this way?" six months from now.

The idea traces back to plain old "spec before code" software engineering
practice, sharpened for a world where an AI agent can write the code in
seconds.

## The problem it solves

When you work with an LLM coding agent, there's a very concrete phenomenon:
if you ask it *"build me a shopping cart with discounts and coupons"*, it's
going to improvise. It will make dozens of implicit design decisions
(classes or functions? where does discount logic live? how are coupons
named and stored?) without you seeing any of them. And each one becomes an
expensive coupling to revert later.

This isn't new to AI — humans improvise too — but it's sharper here for
three reasons:

1. **Generation speed hides the cost of decisions.** A human writing a
   module by hand has time to think between lines. An agent does it in
   seconds, so the decisions go invisible.
2. **Every conversation starts from scratch.** Without a spec, the next
   session doesn't know what you decided before, and may improvise in the
   opposite direction.
3. **Context fills up fast.** Without a stable document to point to, you end
   up re-explaining the same decisions by hand in every prompt.

The spec solves all three: it makes decisions explicit, it persists across
sessions as a file in the repo, and it loads once as reference material.

## Anatomy of a useful spec

Not every document does the job. A useful spec has these parts — the
`spec-draft` skill will not save one that's missing any of the required
ones:

1. **Goal in one sentence.** If it doesn't fit in a sentence, the feature is
   too big — split it before writing anything else.
2. **Explicit scope, in and out.** The "out of scope" is as important as
   the "in scope" — it's what stops "while we're at it" scope creep during
   implementation.
3. **Data model** with concrete names, when the feature introduces new
   structures.
4. **Ordered implementation plan.** Numbered steps, each leaving the system
   in a working state.
5. **Acceptance criteria** — a verifiable boolean checklist. This skill pack
   enforces this one with an explicit quality gate (see below) instead of
   just recommending it.
6. **Decisions made and discarded**, each with a short reason. This is the
   section with the most long-term value — it's what answers "why does
   persistence use a versioned key?" three months from now.

## How this skill pack works

### `spec-draft` — four phases

1. **Context.** Reads the project's memory file, trying in this order and
   stopping at the first hit: `CLAUDE.md` → `AGENTS.md` → `GEMINI.md` →
   `README.md`. That order is deliberate: it adapts to whichever agent is
   actually running the skill (Claude Code reads `CLAUDE.md`, Codex and many
   others read `AGENTS.md`, Gemini CLI reads `GEMINI.md`), falling back to
   the plain `README.md` if none of the agent-specific files exist. It also
   reads the current `specs/` listing and, if previous specs exist, the two
   most recent ones — to match the project's existing numbering, section
   wording, and language, instead of starting a style of its own.
2. **Clarification.** Asks questions in blocks of 3-5 — scope, data,
   integration, persistence, UX/states, risks — until it can answer three
   questions without assuming anything: which files change, what the first
   and last executable steps are, and how to verify the feature is done.
3. **Drafting.** Writes the spec using `spec-draft/template.md` as the
   shape to follow. If Phase 2 left nothing to assume, it writes the whole
   spec in one pass; otherwise it goes section by section with your
   confirmation on each. Either way, before saving it re-checks every
   acceptance criterion for boolean verifiability and rewrites or asks about
   anything vague ("works well", "fast enough" with no number, ...).
4. **Save.** Writes `specs/NN-slug.md` with status `Draft`, seeds
   `specs/.spec-config.yml` with defaults if it doesn't exist yet, and adds
   or updates this spec's row in the `specs/README.md` index. It never marks
   a spec `Approved` — that's a deliberate human act, done by opening the
   file and changing the status by hand.

### `spec-impl` — five phases

1. **Identify** the spec file from a number, slug, or full name.
2. **Validate** that its status means "Approved" — in *any* language
   (`Approved`, `Aprobado`, `Approuvé`, ...). Anything else stops here with
   an explanation; the skill never offers to "start anyway".
3. **Branch.** Creates and switches to `spec-NN-slug` (or asks first, if
   `AutoCreateBranch: false`), then shows the spec's objective, scope, plan,
   and acceptance criteria before touching any code.
4. **Implement**, one plan step at a time, pausing after each one for you to
   review the diff. Ambiguities the spec doesn't resolve stop the flow with
   concrete options instead of being improvised away. It never commits on
   its own.
5. **Close** (the phase this pack adds on top of the base method): once
   every step is done, it verifies each acceptance criterion with you,
   classifies the change (breaking / feature / fix), proposes the matching
   SemVer bump by reading the current version off the top of
   `CHANGELOG.md`, waits for your confirmation, then writes the changelog
   entry, marks the spec `Implemented` with `Implemented in: vX.Y.Z`,
   updates the `specs/README.md` index, and reminds you that committing,
   pushing, and merging the branch are still yours to do.

### How it reads your project

Both skills are context-aware rather than assuming a blank project:

- They read your project's memory file (`CLAUDE.md`/`AGENTS.md`/
  `GEMINI.md`/`README.md`, first match wins) so they know what the project
  is and how it's organized before asking or writing anything.
- They read `specs/` to pick up numbering, section wording, and — unless
  `Language` is pinned in the config — the language already in use, so a
  new spec matches the existing ones instead of drifting.
- They read `specs/.spec-config.yml` for `AutoCreateBranch` and `Language`,
  and only fall back to defaults when the file doesn't exist.
- `spec-impl` also reads the top of `CHANGELOG.md` to know the current
  project version before proposing a bump.

## When to use specs and when not

This has a cost — don't apply it to everything.

**Yes, write a spec, when:**
- The task touches more than two files.
- There are decisions expensive to revert (data schemas, formats, APIs).
- The feature will take more than one agent session.
- Something else will reuse this as a contract (another spec, a skill, a hook).
- It's something you'll forget the reasoning behind in a week.

**No, use a direct prompt, when:**
- It's a point bug fix.
- It's a mechanical refactor (renames, file moves).
- It's an exploratory experiment where the goal is to discover the decision,
  not execute a known one.
- It fits in a prompt and is understood at first read.
- It's a one-off task that won't be repeated.

## Installation

### Recommended: `npx`

```bash
cd ~/your-project
npx github:FrancoCabrera25/skill-spec
```

Asks interactively which agent to install into — `claude`, `cursor`,
`codex`, `antigravity`, `gemini`, or `all` — and writes the right files for
it. Flags for non-interactive use:

```bash
npx github:FrancoCabrera25/skill-spec --agent=<agent> [--dir=/path/to/project] [--yes]
```

| Agent | What gets written |
| --- | --- |
| `claude` | Symlinks each skill into `.claude/skills/` (project-scoped) |
| `cursor` | Generates `.cursor/rules/spec-draft.mdc` and `spec-impl.mdc` — invoke with `@spec-draft`, `@spec-impl` |
| `codex` | Adds a `## Skills` block to `AGENTS.md` and copies skill bodies into `.codex/skills/` |
| `antigravity` | Copies skill bodies into `.antigravity/skills/` |
| `gemini` | Adds a `## Skills` block to `GEMINI.md` and copies skill bodies into `.gemini/skills/` |

Frontmatter fields specific to Claude Code (`argument-hint`,
`disable-model-invocation`, `allowed-tools`) are dropped for every other
agent; the skill's actual instructions are copied as-is.

For the method to work you also need a `specs/` folder at your project
root — `spec-draft` creates it (with `.spec-config.yml`) the first time you
run it, or you can create it yourself:

```bash
mkdir specs
```

### Alternative: clone + script (manual, scriptable, no Node needed)

```bash
git clone https://github.com/francocabrera25/skill-spec ~/.skill-spec
cd ~/your-project
~/.skill-spec/scripts/install-to-agent.sh <agent>   # claude | cursor | codex | antigravity | gemini
```

Same result as the `npx` flow, non-interactive — useful for scripting or CI,
or if you'd rather not run Node. `<agent>` is always explicit; the script
does not try to guess which agent you're running.

Or, for Claude Code specifically, copy the skill folders by hand:

```bash
# Personal (all your projects)
mkdir -p ~/.claude/skills
cp -r skills/engineering/spec-draft ~/.claude/skills/
cp -r skills/engineering/spec-impl ~/.claude/skills/

# Or per-project (versioned in git)
mkdir -p .claude/skills
cp -r skills/engineering/spec-draft .claude/skills/
cp -r skills/engineering/spec-impl .claude/skills/
```

## Usage

```bash
# 1. Design the spec with clarifying questions
spec-draft levels-and-highscores

# Reads CLAUDE.md/AGENTS.md/GEMINI.md/README.md and existing specs/, asks
# questions in blocks, drafts the spec, and saves it as
# specs/03-levels-and-highscores.md with status Draft.

# 2. Re-read the spec outside the chat and approve it manually
#    (open the file, change Status: Draft -> Approved)

# 3. Implement the approved spec
spec-impl 03-levels-and-highscores

# Validates status is Approved, creates branch spec-03-levels-and-highscores,
# shows the spec summary, implements step by step with diff pauses, then
# verifies acceptance criteria, proposes a version bump, writes the
# CHANGELOG.md entry, and marks the spec Implemented.
```

## Configuration

`specs/.spec-config.yml`:

```yaml
AutoCreateBranch: true   # false makes spec-impl ask [y/N] before creating any branch
Language: auto           # auto | es | en — see below
```

**`Language`** controls the language both skills reply in:

- `auto` (default) — mirrors the language of each command's initial prompt,
  same as most spec-driven tools. Write the first message in Spanish, get
  Spanish; write it in English, get English.
- `es` / `en` — pins the language regardless of how any individual prompt
  is written, useful for a team that wants every spec and every changelog
  entry in the same language no matter who's typing that day.

## Design highlights

A few things this pack does deliberately, worth calling out on their own:

- **`spec-impl` closes the loop**, it doesn't stop at the last implementation
  step. Phase 5 verifies acceptance criteria, proposes a SemVer bump, writes
  the `CHANGELOG.md` entry, and marks the spec `Implemented` before handing
  control back.
- **Configurable language**, not just auto-mirrored. `Language: es|en` in
  `specs/.spec-config.yml` pins the language for a whole team/project.
- **A live spec index.** `specs/README.md` is kept up to date by both
  skills automatically instead of being a static, optional doc.
- **An explicit acceptance-criteria quality gate** in `spec-draft`, not just
  advice in a "common mistakes" list.
- **`Supersedes`** header field, alongside `Depends on`, to trace which
  spec replaces an older one.
- **Multi-agent from day one**: Claude Code, Cursor, Codex, Antigravity, and
  Gemini CLI.
- **No release automation for this repo itself.** The `CHANGELOG.md` is
  maintained by hand, on purpose, to keep this easy to fork.

## License

MIT
