@AGENTS.md

# CLAUDE.md — Mongolian Writing App Admin Panel

## Context

Admin panel for a Mongolian spelling/dictation learning app (grades 1-4).
Backend: Express + Prisma + PostgreSQL (runs on localhost:3000)
Admin: Next.js 14 App Router (runs on localhost:3002)

## Key domain concepts

- Tasks: content items with task_id, type (TT1-TT14), skill (S1-S8), level (M0-M3), grade_band (G12/G24)
- Content pipeline: Agent1 (generator) → Agent2 (spelling validator) → Agent3 (distractor checker) → Agent4 (pedagogical) → HUMAN REVIEW → approved/rejected
- Review statuses: pending | ai_passed | ai_flagged | human_approved | human_rejected | needs_revision
- Error codes: A, B, C1/C2, D, E1/E2, G1/G2, H4 (Mongolian orthography errors)

## Code rules

- All components in src/components/, pages in src/app/
- Use React Query for server state, Zustand for UI state
- shadcn/ui + Tailwind only — no extra UI libraries
- API calls go through src/lib/api.ts client
- No `any` types
- Mongolian strings use UTF-8, no special encoding needed
