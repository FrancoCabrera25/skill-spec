---
name: spec-draft
description: Designs and develops specs following the spec-driven method. Asks clarifying questions before proposing structure, and builds the spec section by section. Use it when starting a large feature, before writing code.
disable-model-invocation: true
argument-hint: 'short feature description or requirement'
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /spec-draft — Guided spec designer

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist yet"`

Spec workflow config (Language / AutoCreateBranch), if any:
!`cat specs/.spec-config.yml 2>/dev/null || echo "No specs/.spec-config.yml yet — Language defaults to auto, AutoCreateBranch defaults to true"`

---

This skill helps you produce a useful spec following the spec-driven method. **You don't write code here.** Your job is to help the user clarify what they want to build, ask questions when something is not well-defined enough, and develop the spec section by section until it is ready to be saved into `specs/`.

## Philosophy

A spec is not decorative documentation. It is the contract that drives later execution. If the spec is vague, the code will improvise. That is why this flow is **deliberately slow during the definition phase** and **fast during the writing phase**.

Read `template.md` (in the same directory as this skill) to see the full structure the spec will follow. Lean on it at every step.

## Language

Resolve the working language before doing anything else, using the `Language` value read from `specs/.spec-config.yml` in the session context above:

- **`es`** — always reply in Spanish, regardless of the language of `$ARGUMENTS` or of the user's messages.
- **`en`** — always reply in English, regardless of the language of `$ARGUMENTS` or of the user's messages.
- **`auto`** (default, or if the config file does not exist yet) — mirror the language of the *initial* prompt: if `$ARGUMENTS` (or the user's first message to this skill) is in Spanish, reply in Spanish; if it is in English, reply in English. Stay in that language for the rest of the session even if the user later switches — don't flip mid-conversation on a stray word.

Whichever language you land on, use it consistently for every question, confirmation, and the spec content itself (headings, section labels, state words) in this run.

## Command flow

- Follow the four phases in order. **Never skip Phase 2** — the questions are the whole point. If the user wants to go faster, remind them that the cost of a bad spec gets paid later in code. (Phase 3 does have a fast path once Phase 2 is genuinely complete; see below.)

### Phase 1 — Understand the context

Before asking questions about the feature, make sure you have project context:

1. Read the project-memory file, if one exists. Try in order and stop at the first hit: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`. This adapts the skill to whichever agent is running it (Claude Code, Cursor, Codex, Antigravity, Gemini CLI, ...).
2. Look at the `specs/` listing in the session context above to see which specs already exist and how they are numbered.
3. If previous specs exist, read at least the two most recent ones to pick up the project's conventions — including the exact wording they use for states, section headings, and (unless `Language` is explicitly fixed in the config) the language they are written in. A new spec must match the existing ones.

If the `$ARGUMENTS` argument comes in empty, ask the user for an initial **single-sentence** description of what they want to build. If the description does not fit in one sentence, that is the first signal that the feature is too big — suggest splitting it before continuing.

### Phase 2 — Clarify through questions

This is the most important phase of the command. Your job here is to **detect ambiguities and ask**, not to assume.

Ask questions in blocks of 3 to 5 at a time (not one single question followed by another single question — that is exhausting). After each block, wait for an answer before continuing.

**Question categories you should always consider:**

- **Scope:** What is in and what is NOT? Which parts of the feature are deferred to another spec?
- **Data:** What new structures are introduced? How are they named? Where do they live?
- **Integration:** Does this feature depend on previous specs? Does it modify or replace something existing, or only add?
- **Persistence:** Is anything saved between sessions? Where? With what versioning?
- **UX and states:** What does it look like when it works? What does it look like when it fails? Are there intermediate states?
- **Risks:** What can break this? What happens in the degraded case?
- **Closed decisions:** Is there any decision the user has already made and does not want to reopen?

**How to phrase the questions:**

- Use concrete questions, not open-ended ones. ❌ "How do you imagine persistence?" → ✅ "Is persistence localStorage, IndexedDB, or a JSON file on disk?"
- When you offer options, give 2–4, mark which one is your recommendation and why.
- If your agent exposes a native multiple-choice question tool (in Claude Code: `AskUserQuestion`), use it for these blocks instead of writing the options as prose — the user picks instead of typing. Put your recommendation first and label it. Fall back to a numbered markdown list when no such tool exists.
- If you spot an answer that would open Pandora's box (e.g. "and we also want multiplayer"), point out that it deserves its own spec and ask whether we leave it out of this one's scope.

**When to stop asking:**

Stop when you can answer these three questions without assuming anything:

1. Which files will appear or change?
2. What is the first executable step and what is the last one?
3. How do I verify the feature is finished?

If you still cannot answer one of them, keep asking.

### Phase 3 — Write the spec

Once Phase 2 is closed, decide how to write it:

**If you already have all the information you need** — meaning you can answer the three Phase 2 questions (which files change, what the first and last executable steps are, how to verify it is finished) **without assuming anything** — then **do not go section by section**. Write the complete spec and jump straight to Phase 4 to save the file. Do not ask for section-by-section confirmation, and do not show a draft for approval first: the user already answered everything in Phase 2, and re-asking is friction. The user reviews the saved file and asks for changes if needed.

**Only if information is still missing** (the user cut Phase 2 short, an answer was vague, or some section cannot be written without inventing something), develop the sections **one by one**, showing each one and waiting for confirmation before moving to the next.

In both cases the content follows the same order:

1. **Header** (state, dependencies, supersedes, date, one-sentence objective). The one-sentence objective is critical — if it does not fit in one sentence, go back to Phase 2.
2. **Scope** (what is in and what is NOT). The "not in" must be explicit.
3. **Data model** (concrete structures with real names). If the feature introduces no new data, skip this section and say so explicitly.
4. **Implementation plan** (numbered steps, each leaving the system functional).
5. **Acceptance criteria** (boolean checklist, not aspirational).
6. **Decisions taken and discarded** (with brief justification).
7. **Identified risks** (only if applicable — if no relevant risks exist, skip it).

**Acceptance-criteria quality gate (mandatory, run this before moving to Phase 4):**

Before saving, re-read every acceptance criterion you drafted, one by one, and check it is genuinely verifiable with a yes/no answer against observable behavior — not a feeling. Reject and rewrite (or ask the user to make concrete) anything like "it works well", "good UX", "no bugs", "fast enough". This is not just advice in a "common mistakes" list — treat it as a checklist item you must actually run before the file is written. If a criterion cannot be made verifiable without inventing a threshold (e.g. "fast" → how many ms?), ask the user for the concrete number instead of guessing it.

**After each section (only in the section-by-section mode):**

- Show it formatted in markdown.
- Ask: "Does this section stay like this or do you want to tweak it?"
- If the user requests changes, apply them and show again.
- Only move to the next section once the user confirms.

**Common mistakes to avoid:**

- Putting things into the implementation plan that are not in the scope.
- Assuming file names or structures the user did not confirm.
- Skipping the decisions section — that section is the one with the most long-term value.

### Phase 4 — Save the spec

When the content is ready (either because you had everything, or because all sections were confirmed):

1. Determine the next sequential number from the `specs/` listing in the session context. Take the highest existing number and add one, zero-padded to two digits. If the last one is `02-powerups.md`, this one will be `03-`. If `specs/` is empty or missing, start at `01-`.
2. Generate a short kebab-case slug from the objective (e.g. `levels-and-highscores`). See **Arguments** below for when `$ARGUMENTS` is the slug instead.
3. Use the date from the session context above for the `**Date:**` field. **Never write a date you did not read from there.**
4. Write the file directly at `specs/NN-slug.md` with all the sections. **Do not ask for permission to write it and do not ask whether the file name works** — announce the path in the final confirmation. Only ask if the target file already exists.
5. Mark the state as `Draft` by default (or the equivalent word used by the existing specs in this repo, or the state word in the resolved `Language`). **Do not mark it as `Approved` automatically** — the user does that once they have re-read it.
6. If the header lists `**Depends on:**` or `**Supersedes:**` references, check that each referenced spec actually exists in `specs/`. If one does not, say so instead of writing a dangling reference. When a new spec supersedes an older one, remind the user that the older spec's own state should be moved to `Obsolete` by hand once this one is approved — this skill does not edit other specs' state.
7. **Update the spec index at `specs/README.md`.** If it exists, add or update the row for this spec (`NN | title | Draft` plus dependency/supersedes links) instead of leaving the index stale. If `specs/README.md` does not exist yet, create it with a short intro (see the template shipped in this repo) and a table with a first row for this spec.
8. **Seed the config file if it does not exist.** Check for `specs/.spec-config.yml`. If it is **missing**, create it with the default content below. If it **already exists, leave it untouched** — never overwrite the user's settings.

   ```yaml
   # spec workflow configuration
   #
   # AutoCreateBranch — controls whether spec-impl creates the git branch automatically.
   #   true  (default) → spec-impl creates and switches to spec-NN-slug without asking
   #   false            → spec-impl asks for [y/N] confirmation before creating the branch
   AutoCreateBranch: true
   #
   # Language — controls which language this skill and spec-impl reply in.
   #   auto (default) → mirror the language of each command's initial prompt
   #   es              → always reply in Spanish
   #   en              → always reply in English
   Language: auto
   ```

9. Confirm to the user:
   - Path of the created file.
   - Reminder: the spec is in `Draft` state. Change it to `Approved` once you have re-read it.
   - If you just created `specs/.spec-config.yml`, mention it exists and what `AutoCreateBranch` and `Language` default to.
   - Next step: once reviewed and approved, run `spec-impl NN-slug` to implement it.
   - **Stop here.** Do not propose implementing the spec, writing code, or taking any further action beyond this confirmation.

## Hard rules

- **Never write code during this command.** Only the spec's `.md` file, and the `specs/README.md` index, at the end.
- **Never propose implementing the spec after saving it.** Your job ends when the file is written. The user runs `spec-impl` when they are ready.
- **Never assume decisions the user did not confirm.** If you are missing information, ask — in Phase 2, which is where the questions belong.
- **Do not re-ask in Phase 3 what was already answered in Phase 2.** If the information is complete, write the whole spec and save it. Section-by-section confirmation is the fallback for incomplete information, not the default.
- **Never skip the acceptance-criteria quality gate.** Every criterion must be boolean-verifiable before the file is written.
- **If the user wants to speed up and skip Phase 2**, remind them: "Questions now save hours later. Are you sure you want to skip them?". If they insist, respect their decision but record it in the spec's decisions section ("Quick definition without detailed clarification").
- **If the feature is too big** (does not fit in one sentence, touches more than three areas of the system, requires decisions in four or more domains), propose splitting it into two or more specs before continuing.

## Tone when asking questions

Be direct and specific. Do not apologize for asking. Do not use phrases like "if you don't mind..." or "could you maybe...". The user invoked this skill precisely because they want you to ask questions. Use concrete questions, one per line when there are several, and number them so they are easy to answer.

Example of a well-formed block:

> Before writing the data model I need to clarify three things:
>
> 1. **Persistence.** localStorage, IndexedDB, or a JSON file on disk? Recommendation: localStorage if the data fits in <5MB and does not need queries.
> 2. **Schema versioning.** What happens when the format changes? Options: (a) version prefix in the key, (b) ignore and rebuild, (c) migrate on load.
> 3. **Privacy.** Is the data sensitive? If yes, is it encrypted? Is it deleted on logout?

## Arguments

`$ARGUMENTS` is **the feature description**, not the file name. Treat it as the starting point for Phase 1 and derive the slug from the objective in Phase 4.

The one exception: if `$ARGUMENTS` is already a single kebab-case token with no spaces (e.g. `spec-draft levels-and-highscores`), it is ambiguous between a description and a slug — use it as the slug **and** as the seed of the description, without asking for confirmation.

If invoked without arguments, start by asking for the one-sentence description.
