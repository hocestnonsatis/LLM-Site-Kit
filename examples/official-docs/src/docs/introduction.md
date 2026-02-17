---
priority: high
category: getting-started
token_cost: 180
requires: []
---

# Introduction

**LLM-Site-Kit** is a Vite-powered, headless web framework built for the **Agentic Web**. It lets you serve one codebase in two ways: a rich human-facing site (HTML, CSS, JS) and a token-optimized JSON payload for LLM crawlers and autonomous agents.

## Why LLM-Site-Kit?

- **Dual experience** — Same content, two delivery modes. Humans get your normal SvelteKit (or Vite) app; agents get structured JSON with content, metadata, and dependency hints (`data_llm_require`).
- **Build-time first** — No runtime LLM calls. Documentation is compiled from `.md` / `.mdx` files (Markdown + YAML frontmatter) at build time into a static payload and optional BM25 search index. Zero inference cost for search.
- **MCP-ready** — Expose your docs as Model Context Protocol tools (`list_documentation_pages`, `read_documentation_page`, `search_documentation`) so any MCP client (Cursor, Claude Desktop, custom agents) can discover and read your docs.
- **Lightweight** — Markdown + frontmatter parser (gray-matter), no embeddings by default. Optional BM25 search index keeps agent tooling fast on low-resource environments.

## Core concepts

- **.md / .mdx files** — Each doc is a Markdown file with YAML frontmatter (priority, category, token_cost, requires) and a body of markdown content.
- **Agent detection** — The framework detects LLM clients via `User-Agent` (e.g. GPTBot, Claude-Web), `X-LLM-Client` header, or `Accept: application/vnd.llm+json`.
- **Sitemap** — `llm-sitemap.json` is emitted at build with paths, token costs, summaries, and `requires` for crawler budgeting.

Read **Architecture** next to see how the pipeline (plugin, middleware, build) works.
