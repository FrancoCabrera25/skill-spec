---
name: spec-impl
description: Implements an approved spec. Validates that the state means "Approved" (in any language), creates a git branch named after the spec, implements step by step with pauses to review diffs, then closes the loop by verifying acceptance criteria, bumping the project's SemVer version, and writing the CHANGELOG.md entry.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*), Bash(date:*)
---

# /spec-impl — Implementer of approved specs

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Spec workflow config (Language / AutoCreateBranch), if any:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true, Language: auto (defaults, no config file)"`

Top of CHANGELOG.md, if any (current project version lives here):
!`head -n 15 CHANGELOG.md 2>/dev/null || echo "No CHANGELOG.md at the project root yet"`

Today's date:
!`date +%F`

---

## Language

Resolve the working language before doing anything else, from the `Language` value in the session context above (same rule `spec-draft` uses):

- **`es`** → always reply in Spanish.
- **`en`** → always reply in English.
- **`auto`** (default) → mirror the language of `$ARGUMENTS`/the user's first message to this command. Stay in that language for the whole session.

## Instructions

Follow these five phases in strict order. **Do not advance to the next phase if the previous one did not complete correctly.**

---

### Phase 1 — Identify the spec

The received argument is: `$ARGUMENTS`

If `$ARGUMENTS` is empty:

- List the files available in `specs/` (you already have them above).
- Ask the user to specify the exact name of the spec.
- Stop and wait for an answer. Do not continue.

If `$ARGUMENTS` has a value:

- Look for the file in `specs/`. The user may have written the full name (`01-mvp-arkanoid`), only the number (`01`), or only the slug (`mvp-arkanoid`). Try to find the correct file in any of those cases.
- If you do not find the file, show the available specs and ask the user to correct the name.
- If you do find it, continue to Phase 2.

---

### Phase 2 — Validate the spec's state

Read the spec file you located in Phase 1 using the Read tool or `cat`.

In the file's contents, look for the line that contains the spec's state. The header label is typically `**Status:**` (English) or `**Estado:**` (Spanish), but it may use any language. Match by position (status line near the top of the spec) and by the surrounding state machine, not by the exact label.

**Absolute rule:** You can only continue if the state **means "Approved"** — regardless of the language used.

Treat any of the following (and their equivalents in other languages) as the **Approved** state and continue:

- English: `Approved`
- Spanish: `Aprobado`
- Portuguese: `Aprovado`
- French: `Approuvé`
- German: `Genehmigt`
- Italian: `Approvato`
- …or any other language's word that clearly means "approved"

Anything else (Draft / Borrador, In review / En revisión, Implemented / Implementado, Obsolete / Obsoleto, or any unrecognized value) means **stop** and show the error message below.

| State category                            | Examples (any language)                           | Action                                                                     |
| ----------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Approved                                  | `Approved`, `Aprobado`, `Aprovado`, `Approuvé`, … | Continue to Phase 3.                                                       |
| Draft                                     | `Draft`, `Borrador`, …                            | Stop. Show the error message below.                                        |
| In review                                 | `In review`, `En revisión`, …                     | Stop. Show the error message below.                                        |
| Implemented                               | `Implemented`, `Implementado`, …                  | Stop. Show the error message below.                                        |
| Obsolete                                  | `Obsolete`, `Obsoleto`, …                         | Stop. Show the error message below.                                        |
| State line not found / unrecognized value | —                                                 | Stop. The file does not follow the expected format. Tell this to the user. |

If you are unsure whether a value means "approved", **do not assume**. Stop and ask the user to clarify or to update the spec to the canonical wording.

**Standard error message when the state does not mean Approved:**

```
❌ I cannot implement this spec.

Current state: [STATE FOUND]
I only work with specs whose state means "Approved" (e.g. `Approved`, `Aprobado`,
or the equivalent in another language).

To continue you have two options:
  1. If the spec is ready to be implemented, open it and change the state
     to "Approved" (or the equivalent term your team uses) manually.
     That change is made by the human, not the agent.
  2. If the spec still needs work, use spec-draft [name] to resume it.
```

Do not offer alternatives, do not suggest "I can still start if you want". The block is intentional.

---

### Phase 3 — Create the git branch and switch to it

Once you have confirmed the state means `Approved`:

0. **Check the working tree first.** Look at the `git status --short` output in the session context above. If it is **not empty**, stop and show the pending changes, then ask:

   ```
   ⚠️ There are uncommitted changes in the working tree.
   Switching branches would carry them over. What do you want to do?
     1. Commit or stash them yourself, then re-run this command  (recommended)
     2. Continue anyway — the changes travel to the new branch
   ```

   Wait for the answer. **Do not stash or commit on the user's behalf** unless they explicitly ask for it. If the working tree is clean, skip straight to step 1 without mentioning it.

1. Derive the branch name from the spec file's full name, without the extension. Format: `spec-NN-slug`. Examples:

   - `01-mvp-arkanoid.md` → branch `spec-01-mvp-arkanoid`
   - `02-powerups.md` → branch `spec-02-powerups`

2. Read the `AutoCreateBranch` flag from the **Spec workflow config** shown in the session context above.

   - If the config file does not exist, the value is missing, or the value is unrecognized → treat it as `true` (the default).
   - Only an explicit `false` (in any capitalization) disables automatic branch creation.

   **If `AutoCreateBranch` is `true` (default):** proceed without asking.

   - If the branch **does not exist**: create it with `git checkout -b spec-NN-slug`.
   - If it **already exists**: this means previous work is being resumed. Switch to it, read `git log --oneline` on the branch, and tell the user which steps of the plan already look done and which step you propose to resume from. Wait for confirmation on the resume point before implementing anything.
   - In both cases: switch to the branch with `git checkout spec-NN-slug` and confirm the change was successful before continuing.

   **If `AutoCreateBranch` is `false`:** ask before touching git. Show:

   ```
   AutoCreateBranch is set to false.
   Create and switch to the branch spec-NN-slug? [y/N]
   ```

   - If the user answers **yes**: create/switch to the branch exactly as in the `true` case above.
   - If the user answers **no** or leaves it empty: **do not create any branch.** Tell the user you will implement on the current branch (the one shown in the session context above) and ask for explicit confirmation to continue there. Do not improvise — wait for the answer.

3. Visually confirm to the user the spec is ready and which branch is active:

   ```
   ✅ Ready to implement.

   Spec:   specs/NN-slug.md
   Branch: spec-NN-slug  (active)   (← or the current branch, if no new branch was created)
   State:  Approved   (← echo back the actual value found in the spec)
   ```

4. **Do not start implementing yet.** First show the spec summary to the user so they have it fresh. Extract and show:
   - The **objective** (the line after `**Objective:**` / `**Objetivo:**` / equivalent label).
   - The **scope** (the `## Scope` / `## Alcance` / equivalent section).
   - The **implementation plan** (the section with the numbered steps — `## Implementation plan` / `## Plan de implementación` / equivalent).
   - The **acceptance criteria** (the checklist — `## Acceptance criteria` / `## Criterios de aceptación` / equivalent).

Match section headings by meaning, not by exact wording — the spec may be authored in any language.

---

### Phase 4 — Implement step by step

After showing the spec summary, tell the user:

```
I am going to implement the spec following the implementation plan exactly.
I will pause after each step so you can review the diff.

Shall we start with Step 1?
```

Wait for explicit confirmation ("yes", "go ahead", "go", or equivalent). Do not start without it.

Once confirmed, follow these rules during the entire implementation:

**Never commit automatically.** Not per step, not at the end. You write the code and show the diff; committing is the user's decision and the user's command. Only commit if they explicitly ask you to.

**One rule above all:** implement what the spec says. If something in the spec looks suboptimal to you, mention it as an observation but implement what was agreed. Changes to the spec go into the spec, not into the code by surprise.

**Work rhythm:**

- Implement one step of the plan.
- Show a summary of which files you touched and what you did.
- Say: `Step N completed. Could you review the diff and let me know if I continue with Step N+1?`
- Wait for confirmation before continuing.

**If during the implementation you find an ambiguity** the spec does not resolve:

- Stop.
- Describe the ambiguity exactly.
- Present two or three concrete options.
- Wait for the user's decision.
- Do not improvise.

**If the user asks for something that is out of the spec's scope:**

- Remind them that it is out of this spec's scope.
- Suggest noting it down for the next spec.
- Do not implement it on this branch.

When every step of the plan is implemented, move to Phase 5. Do not consider the spec finished before that — implementing the last step is not the end of the job.

---

### Phase 5 — Close: verify, version, and log the change

This phase is what makes this skill different from a plain "implement the spec" command: implementing the code is not the finish line, a versioned, logged, reviewable change is.

**1. Verify acceptance criteria one by one.**

Go through the spec's acceptance-criteria checklist item by item with the user. For each one, ask for (or verify yourself, if you can run/inspect it) a yes/no answer against real behavior — not "I think it's fine". Do not mark the spec `Implemented` while any item is unresolved or failing.

- If all pass → continue to step 2.
- If any fail → stop here, describe what fails, and ask whether to fix it now (stay in Phase 4 for that) or record it as a known gap and downgrade the plan. Do not silently skip a failing criterion.

**2. Classify the change and propose a version bump.**

Read the current version from the top of `CHANGELOG.md` (session context above), following [Keep a Changelog](https://keepachangelog.com/) format — the most recent version header looks like `## [X.Y.Z] - YYYY-MM-DD`. If the file or a version header doesn't exist yet, treat the current version as `0.0.0`.

Ask the user (or infer from the spec's scope and confirm with them — never decide silently) which kind of change this is, using [Semantic Versioning](https://semver.org/):

- **Breaking / incompatible change** → bump **major** (`X+1.0.0`).
- **New feature, backward-compatible** → bump **minor** (`X.Y+1.0`).
- **Fix or small backward-compatible improvement** → bump **patch** (`X.Y.Z+1`).

Show the proposed bump explicitly, e.g.:

```
Current version: 1.2.0
This spec adds a backward-compatible feature → proposed next version: 1.3.0
Confirm the bump to 1.3.0? [Y/n]
```

**Wait for explicit confirmation before writing anything.** Never bump the version on your own judgment alone — same principle as "Approved is a human act": the version bump is a human act too, you only propose it.

**3. Write the CHANGELOG.md entry.**

Once confirmed, add a new entry at the top of `CHANGELOG.md` (create the file with a standard Keep a Changelog header if it doesn't exist yet), in the language resolved above. Use the date from the session context. Reference the spec so the entry is traceable:

```markdown
## [1.3.0] - 2026-09-08

### Added
- Levels and high-scores persistence (specs/03-levels-and-highscores.md).
```

(Use `### Fixed` for patch/bugfix changes, `### Changed` plus a clear breaking-change note for major bumps — standard Keep a Changelog section names, translated if `Language` is `es`: `### Agregado`, `### Corregido`, `### Cambiado`.)

**4. Update the spec file itself.**

- Change `**Status:**` (or its localized label) to `Implemented` / `Implementado` (or the repo's existing wording for that state).
- Add a new header line `**Implemented in:** vX.Y.Z` right after the date/objective block.

**5. Update the spec index.**

If `specs/README.md` exists (it should, `spec-draft` creates/maintains it), update this spec's row: state → `Implemented`, and note the version. If the index does not exist for some reason, create it rather than leaving the implemented spec untracked.

**6. Real closeout — don't stop at "implemented".**

Tell the user clearly that the job now has three things still pending, all of them **theirs to do, not yours**:

```
✅ Spec implemented, verified, and logged.

Spec:    specs/NN-slug.md        (Status: Implemented, Implemented in: v1.3.0)
Branch:  spec-NN-slug
Changes: CHANGELOG.md updated, specs/README.md index updated

Still pending on your side (I don't do these automatically):
  1. Review everything once more and make the final commit(s).
  2. Push the branch and open the PR.
  3. Merge spec-NN-slug into your main branch.
```

**Never commit, push, or merge on your own.** This phase writes to `CHANGELOG.md`, the spec file, and `specs/README.md` — nothing else, and none of it gets committed by you.

---

## Summary of expected behavior

```
spec-impl 01-mvp-arkanoid   (state: Approved)

  Phase 1  →  Finds specs/01-mvp-arkanoid.md
  Phase 2  →  Reads the state → "Approved" (or "Aprobado", etc.) → ✅ continues
  Phase 3  →  git checkout -b spec-01-mvp-arkanoid → git checkout spec-01-mvp-arkanoid
              Shows objective, scope, plan and criteria
  Phase 4  →  Implements step by step with pauses
  Phase 5  →  Verifies acceptance criteria → proposes version bump → user confirms
              → writes CHANGELOG.md entry → marks spec Implemented → updates specs/README.md
              → reminds user to commit, push and merge

spec-impl 02-powerups   (state: Draft / Borrador)

  Phase 1  →  Finds specs/02-powerups.md
  Phase 2  →  Reads the state → "Draft" → ❌ stops
              Shows the standard error message
              Does not create branch, does not touch code
```

**Branch creation is controlled by the `AutoCreateBranch` flag** in `specs/.spec-config.yml`. It defaults to `true` (create the branch automatically, as shown above). Set it to `false` to make Phase 3 ask `[y/N]` before creating any branch.

**Version bumps are always proposed, never silent.** Phase 5 reads `CHANGELOG.md`, proposes a SemVer bump based on the kind of change, and only writes once the user confirms.
