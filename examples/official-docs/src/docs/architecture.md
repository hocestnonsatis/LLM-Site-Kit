---
priority: high
category: core-concept
token_cost: 220
requires:
  - /docs/introduction
---

# Architecture

This page describes how LLM-Site-Kit works under the hood: the Markdown + frontmatter pipeline, Vite plugin lifecycle, and agent middleware.

## Pipeline overview

1. **Source** — Documentation lives in `.md` or `.mdx` files (e.g. `src/docs/introduction.md`). Each file has a YAML frontmatter block at the top (priority, category, token_cost, requires) and a Markdown body.
2. **Parse** — The framework uses **gray-matter** to parse the file: frontmatter becomes `LLM_Meta`, the rest is content. No code execution; standard Markdown tooling (syntax highlighting, Prettier) works.
3. **Build** — The Vite plugin runs at `config`, `buildStart`, and `writeBundle`. It walks the docs directory, parses each `.md`/`.mdx`, and produces:
   - `generated.js` — A module exporting `agentDocs`: a map of path → `{ content, meta, data_llm_require }`.
   - `llm-sitemap.json` — Sitemap with path, token_cost, summary, requires, priority, category.
   - `search-index.json` (optional) — BM25 inverted index when `enableSearchIndex: true`.
4. **Runtime** — In development, Vite middleware serves agent JSON on the fly from parsed doc files. In production (e.g. SvelteKit), `hooks.server.ts` checks `isAgentRequest(request)` and, for `/docs/*`, returns `agentDocs[path]` as JSON.

## Frontmatter parsing

The doc parser (`parse-markdown`) does the following:

- Uses gray-matter to split the file into `data` (frontmatter) and `content` (body).
- Maps frontmatter keys to `LLMMeta`: priority, category, token_cost, requires, stability, lang.
- Token estimation and sitemap use **content only** (frontmatter excluded) so token costs reflect the actual text agents receive.

## Middleware and agent detection

`isAgentRequest(request)` returns true if any of the following holds:

- `User-Agent` matches known LLM crawler patterns (e.g. GPTBot, Claude-Web).
- The request includes header `X-LLM-Client`.
- The request `Accept` header includes `application/vnd.llm+json`.

When true, the server responds with JSON instead of HTML for doc routes. Humans get the normal SvelteKit response.

## Dependency graph

Each doc can declare `requires: ["/docs/other"]` in frontmatter. The plugin validates that every required path exists in the built set and emits `data_llm_require` in the payload so agents know which pages to read first. The sitemap also includes `requires` for crawler budgeting.
