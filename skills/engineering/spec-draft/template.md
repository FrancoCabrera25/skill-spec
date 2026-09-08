# Template for a useful spec

This file is the reference the `spec-draft` skill consults when generating specs. Each section includes its purpose and a minimal example. **It is not text to be copied verbatim** — it is the shape the skill must respect.

---

## Header

Every spec starts with metadata in a blockquote (no tables, no code blocks, simple as shown below) format:

```markdown
# SPEC NN — Short, descriptive title

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02
> **Supersedes:** SPEC 04 (optional — only if this spec replaces an earlier one)
> **Date:** YYYY-MM-DD
> **Objective:** A single sentence. If you need two sentences, the feature is too big.
```

Once implemented, the header gains one more line (added by `spec-impl`, never by hand):

```markdown
> **Implemented in:** v1.3.0
```

**Valid states (English default / Spanish equivalent):**

| English       | Español         | Meaning                                                                    |
| ------------- | ---------------- | --------------------------------------------------------------------------- |
| `Draft`       | `Borrador`       | Generated, awaiting human review.                                          |
| `In review`   | `En revisión`    | The human is iterating on it, possibly with the agent.                     |
| `Approved`    | `Aprobado`       | Authorized for implementation. The only state `spec-impl` will act on.     |
| `Implemented` | `Implementado`   | Code complete, acceptance criteria verified, version bumped.               |
| `Obsolete`    | `Obsoleto`       | Replaced by another spec (see `Supersedes` on the replacing spec).         |

> Pick one language per repo and stay consistent — `spec-draft` resolves the working language from `specs/.spec-config.yml` (`Language: auto|es|en`) and reuses whatever the existing specs in the repo already use. `spec-impl` accepts state words in **any** language: it matches by meaning, not by exact string.

**Objective rule:** one sentence that a human reads in 5 seconds and understands what is going to be built. If it doesn't fit in one sentence, split the feature.

**`Depends on` / `Supersedes` rule:** `Depends on` points to specs this one builds on top of. `Supersedes` points to an older spec this one fully replaces — when that happens, the older spec's own `Status` should be moved to `Obsolete` by hand once this one is approved (neither skill edits another spec's file automatically).

---

## Section 1 — Why this spec exists (optional)

For specs that take non-obvious decisions or break project patterns, a brief section explaining the **why** of the work. Not the what — the what comes later.

For simple specs, omit it.

---

## Section 2 — Scope

Two explicit sub-blocks. **Both are mandatory.**

```markdown
## Scope

**In:**

- Concrete thing one.
- Concrete thing two.

**Out of scope (for future specs):**

- Something that could be done but not now.
- Something that came up in the conversation but is not in.
```

**Why "out" matters:** it captures the things the user mentioned during the question phase but were decided to be deferred. Without that record, during implementation there will be a temptation to slip them in "while we're at it".

---

## Section 3 — Data model

The concrete structures that appear or change. Use real code, not abstract pseudocode.

```markdown
## Data model

\`\`\`js
// Game state
const state = {
level: 1,
score: 0,
highScores: [/* { score, level, date } */],
};
\`\`\`

Conventions:

- Coordinates: origin top-left.
- Velocities in pixels/frame.
```

If the feature introduces no new data, write it explicitly: _"This feature introduces no new data structures. It reuses the model from SPEC 01."_

---

## Section 4 — Implementation plan

Numbered steps. Each step must leave the system in a **functional and runnable** state. No "implement half and continue tomorrow".

```markdown
## Implementation plan

1. Create file X with an empty skeleton.
2. Implement function A in X. Manual test: run Y, see Z.
3. Wire X to existing module W.
4. ...
```

**Rules:**

- Each step must be commitable on its own.
- If a step requires more than 30–50 lines of code, split it.
- The last step of the plan is **not** "test everything" — that is the acceptance criteria.

---

## Section 5 — Acceptance criteria

Boolean checklist. Each item can be verified with yes or no. `spec-draft` runs a quality gate over this section before saving — every item must survive it.

```markdown
## Acceptance criteria

- [ ] The game loads without errors in the console.
- [ ] Breaking a brick adds exactly 10 points.
- [ ] Reloading the page preserves the high-scores.
```

**Anti-patterns to avoid:**

- ❌ "That it works well." → not verifiable.
- ❌ "Good UX." → subjective.
- ❌ "No bugs." → not operational.
- ❌ "Fast enough." → no threshold. Ask for the concrete number (e.g. "loads in <2s").
- ✅ "Pressing Esc pauses the game and shows the menu." → verifiable, boolean.

---

## Section 6 — Decisions taken and discarded

The section that has the most value 3 months from now. Capture **what you considered**, not just what you chose.

```markdown
## Decisions

- **Yes:** localStorage for persistence. Fits in <5MB and we don't need queries.
- **No:** IndexedDB. Overengineering for this case.
- **Yes:** versioned key (`save:v1`). Lets us migrate the schema later without breaking.
- **No:** cloud sync. Goes in another spec if it ever lands.
```

Each decision ideally has a brief reason. Decisions without a reason are the first ones to be questioned later.

---

## Section 7 — Identified risks (optional)

Only when there are non-obvious risks. Simple table:

```markdown
## Risks

| Risk                                  | Mitigation                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------- |
| localStorage disabled in private mode | Fallback to in-memory object. The game still runs, it just doesn't persist. |
| Future incompatible schema            | Key includes `:v1`. Migration documented in `persistence.js`.               |
```

For small specs or very contained features, omit it.

---

## Final section — What is NOT in (reinforcement)

Repeat explicitly at the end what **will not** be done in this spec. This repetition is deliberate — the Scope section already says it, but at the end of the document it serves as a reminder when someone reads only the last lines.

```markdown
## What is **not** in this spec

- Visual editor (another spec if it ever lands).
- Multiplayer.
- Mobile version.

Each one of those, if it lands, goes in its own spec.
```

---

## Global rules about the whole document

- **One sentence per idea.** If a sentence has two commas and a semicolon, split it.
- **Concrete names.** If you say "the levels module", say `src/levels.js`. If you say "a key", give the exact string.
- **No TODOs.** A TODO in a spec means the decision was not made. Make it or note it as a pending decision with a reason.
- **No long executable code.** The spec describes; the code is written afterwards. Short snippets to illustrate data structures are fine; full functions are not.
- **Standard markdown.** No weird extensions. It must render on GitHub without surprises.
- **Every acceptance criterion is boolean-verifiable.** No exceptions — see Section 5.
