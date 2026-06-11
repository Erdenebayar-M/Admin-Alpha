@AGENTS.md

# CLAUDE.md — Mongolian Writing App Admin Panel

## Context

Admin panel for a Mongolian spelling/dictation learning app (grades 1-4).
Backend: Express + Prisma + PostgreSQL (runs on localhost:3000)
Admin: Next.js 14 App Router (runs on localhost:3002)

## Key domain concepts

- Tasks: content items with task_id, type (42 TT_ types — defined in task-types.ts, re-exported via task-defaults.ts), skill (S1-S8), level (M0-M5), grade_band (G12/G24)
- G12 types (16): TT_LISTEN_CHOOSE, TT_LETTER_FILL, TT_IMAGE_WORD_MATCH, TT_COPY_WRITE, TT_CHOOSE_CORRECT, TT_FILL_WRITE, TT_MISSING_LETTER, TT_WORD_SET_DICTATION, TT_CAPITAL_PUNCTUATION, TT_SIMPLE_SUFFIX, TT_FIND_ERROR, TT_SELF_CHECK, TT_TWO_WORD_DICTATION, TT_WORD_ENDING, TT_SENTENCE_FILL, TT_MIXED_REVIEW
- G24 types (23): TT_WORD_FORM_CHOOSE, TT_LONG_VOWEL_FILL, TT_REDUCED_VOWEL, TT_SUFFIX_CHOOSE, TT_SHORT_SENTENCE_DICTATION, TT_FIX_ERROR, TT_CONSONANT_CONFUSION, TT_WORD_FORM_FIX, TT_LONG_VOWEL_IN_SENTENCE, TT_REDUCED_VOWEL_IN_SENTENCE, TT_CASE_SUFFIX, TT_BASIC_COMMA, TT_TWO_SENTENCE_DICTATION, TT_FIND_OMITTED_LETTER, TT_MIXED_WORD_SET, TT_SUFFIX_WRITE, TT_SENTENCE_BOUNDARY, TT_MINI_TEXT_DICTATION, TT_OWN_WRITING_CORRECTION, TT_LONG_VOWEL_CHALLENGE, TT_COMPOUND_SUFFIX, TT_MIXED_CHECKPOINT, TT_EXPLAINED_CORRECTION (TT_CAPITAL_PUNCTUATION shared)
- v3 interaction-form types (3, both grade bands): TT_MATCH_PAIRS (Холбож тааруулах, options.pairs), TT_ASSEMBLE_WORD (Угсрах, options.tiles+correct_order), TT_TAP_FIND_ERROR (Алдаа олж товших, options.sentence+error_word_index+correct_text)
- interaction_form field: auto-derived from task category (CHOOSE/FILL/TRANSCRIBE/CORRECT/MATCH/ASSEMBLE/TAP) via deriveInteractionForm() in task-defaults.ts; sent in every POST /tasks payload
- source field: set to HUMAN by the backend for all hand-created tasks; AI for LLM-generated drafts
- Content pipeline: Agent1 (generator) → Agent2 (spelling validator) → Agent3 (distractor checker) → Agent4 (pedagogical) → HUMAN REVIEW → approved/rejected
- Review statuses: pending | ai_passed | ai_flagged | human_approved | human_rejected | needs_revision
- Error codes: full 38-code set A1–H4 (Mongolian orthography errors)

## Layout

- All pages fill the full screen width — no `max-w-*` or `mx-auto` on page-level wrappers
- Use `px-4 sm:px-6` for horizontal padding only

## Code rules

- All components in src/components/, pages in src/app/
- Use React Query for server state, Zustand for UI state
- shadcn/ui + Tailwind only — no extra UI libraries
- API calls go through src/lib/api.ts client
- No `any` types
- Mongolian strings use UTF-8, no special encoding needed

## Code structure (SOLID — single responsibility per module)

Keep modules focused; do not let these grow back into "god files". Each entry point below is a thin barrel/orchestrator that delegates to focused modules:

- `lib/task-defaults.ts` — barrel: compute fns (`computeDefaults`, `deriveInteractionForm`, `deriveImageSide`, `parseLines`) + `export *` from `lib/task-types.ts` (blueprints/info/types) and `lib/task-labels.ts` (label maps). Import task data from `@/lib/task-defaults` regardless of which file it lives in.
- `components/tasks/ContentForm.tsx` — only `TYPE_CONTENT_MAP` (task type → form component) + the dispatch. Per-type create forms live in `components/tasks/forms/` grouped by interaction family (choice/fill/correction/dictation/match-assemble/self-check); shared blocks in `forms/sections.tsx`, types in `forms/types.ts`.
- `hooks/useTaskForm.ts` — composes `hooks/task-form/`: `state.ts` (FormState/INITIAL_FORM/validation), `build-options.ts` (pure option/answer builders), `mutations.ts` (create + media upload).
- `components/review/TaskPreview.tsx` — display/edit orchestrator; per-type display sections in `task-preview/sections.tsx`, presentational helpers in `task-preview/helpers.tsx`.

Adding a task type: add data to `task-types.ts`, a form component to the matching `forms/*` file, one line to `TYPE_CONTENT_MAP`, and (if needed) a display section in `task-preview/sections.tsx`. No edits to the orchestrators' logic.
