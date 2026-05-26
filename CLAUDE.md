@AGENTS.md

# CLAUDE.md — Mongolian Writing App Admin Panel

## Context

Admin panel for a Mongolian spelling/dictation learning app (grades 1-4).
Backend: Express + Prisma + PostgreSQL (runs on localhost:3000)
Admin: Next.js 14 App Router (runs on localhost:3002)

## Key domain concepts

- Tasks: content items with task_id, type (39 TT_ types from blueprints — see task-defaults.ts), skill (S1-S8), level (M0-M5), grade_band (G12/G24)
- G12 types (16): TT_LISTEN_CHOOSE, TT_LETTER_FILL, TT_IMAGE_WORD_MATCH, TT_COPY_WRITE, TT_CHOOSE_CORRECT, TT_FILL_WRITE, TT_MISSING_LETTER, TT_WORD_SET_DICTATION, TT_CAPITAL_PUNCTUATION, TT_SIMPLE_SUFFIX, TT_FIND_ERROR, TT_SELF_CHECK, TT_TWO_WORD_DICTATION, TT_WORD_ENDING, TT_SENTENCE_FILL, TT_MIXED_REVIEW
- G24 types (23): TT_WORD_FORM_CHOOSE, TT_LONG_VOWEL_FILL, TT_REDUCED_VOWEL, TT_SUFFIX_CHOOSE, TT_SHORT_SENTENCE_DICTATION, TT_FIX_ERROR, TT_CONSONANT_CONFUSION, TT_WORD_FORM_FIX, TT_LONG_VOWEL_IN_SENTENCE, TT_REDUCED_VOWEL_IN_SENTENCE, TT_CASE_SUFFIX, TT_BASIC_COMMA, TT_TWO_SENTENCE_DICTATION, TT_FIND_OMITTED_LETTER, TT_MIXED_WORD_SET, TT_SUFFIX_WRITE, TT_SENTENCE_BOUNDARY, TT_MINI_TEXT_DICTATION, TT_OWN_WRITING_CORRECTION, TT_LONG_VOWEL_CHALLENGE, TT_COMPOUND_SUFFIX, TT_MIXED_CHECKPOINT, TT_EXPLAINED_CORRECTION (TT_CAPITAL_PUNCTUATION shared)
- Content pipeline: Agent1 (generator) → Agent2 (spelling validator) → Agent3 (distractor checker) → Agent4 (pedagogical) → HUMAN REVIEW → approved/rejected
- Review statuses: pending | ai_passed | ai_flagged | human_approved | human_rejected | needs_revision
- Error codes: A1/A2/A3, B1-B4, C1-C6, D3/D5, E1/E2/E7, G1/G2, H1/H4 (Mongolian orthography errors)

## Code rules

- All components in src/components/, pages in src/app/
- Use React Query for server state, Zustand for UI state
- shadcn/ui + Tailwind only — no extra UI libraries
- API calls go through src/lib/api.ts client
- No `any` types
- Mongolian strings use UTF-8, no special encoding needed
