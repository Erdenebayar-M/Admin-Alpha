# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`/Users/eba/Work/Alpha/web/CONTEXT.md`** — the canonical domain glossary (Article, Block, Colour, Text alignment, Content column, etc.). This repo (Admin-Alpha) has no `CONTEXT.md` of its own: it edits content whose vocabulary is defined in the sibling `Alpha` repo, not here.
- **`/Users/eba/Work/Alpha/shared/docs/adr/`** — read ADRs that touch the area you're about to work in (e.g. `0001-article-body-as-typed-blocks.md`, `0003-author-colours-in-article-body.md`, `0004-text-alignment-in-article-body.md`).

If the sibling repo isn't present at that path in your environment, proceed silently rather than blocking — treat any domain terms inferable from this repo's own code/types as provisional. Don't suggest creating a local `CONTEXT.md` upfront; `/domain-modeling` (reached via `/grill-with-docs`) writes into the sibling repo's `CONTEXT.md` lazily when terms are resolved, since that's the vocabulary's actual home.

## File structure

Single-context in spirit, but cross-repo:

```
Alpha/                              (sibling repo, canonical domain home)
├── web/CONTEXT.md
└── shared/docs/adr/
    ├── 0001-article-body-as-typed-blocks.md
    ├── 0002-single-hand-picked-featured-article.md
    ├── 0003-author-colours-in-article-body.md
    └── 0004-text-alignment-in-article-body.md

Admin-Alpha/                        (this repo — no CONTEXT.md/docs/adr of its own)
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `Alpha/web/CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR in `Alpha/shared/docs/adr/`, surface it explicitly rather than silently overriding.
