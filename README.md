# LLM-Site-Kit

**Vite-powered, headless web framework for the Agentic Web.** One codebase: rich human-facing site + token-optimized JSON for LLM crawlers and autonomous agents. **v1.0** — feature-complete.

---

## Why LLM-Site-Kit?

| For humans | For agents |
|------------|-----------|
| Normal SvelteKit/Vite app (HTML, CSS, JS) | Structured JSON with `content`, `meta`, and `data_llm_require` |
| Browse docs in the browser | MCP tools: list pages, read pages, **search docs** (BM25) |
| No change to your workflow | Zero-compute search at runtime; all indexing at build time |

**MCP (Model Context Protocol)** — Expose your docs as tools so Cursor, Claude Desktop, or any MCP client can discover and read your documentation. **Zero-Compute BM25 Search** — Enable a static search index at build; agents get `search_documentation` with no embeddings and no runtime scoring cost.

See [MASTER.md](./MASTER.md) for vision, architecture, and roadmap.

---

## Quick start

```bash
# Clone and install
git clone https://github.com/hocestnonsatis/LLM-Site-Kit.git
cd LLM-Site-Kit
npm install

# Build core package
npm run build --workspace=llm-site-kit

# Run the example (or official docs)
npm run dev
# Or: npm run dev:docs  (official documentation site)
```

Test the **agent response** (use the port Vite prints, e.g. 5173):

```bash
curl -A "GPTBot/1.0" http://localhost:5173/docs/core
```

You get JSON: `content`, `meta` (path, token_cost, priority), and `data_llm_require` (dependency hints for agents).

---

## MCP integration

The framework includes a **Zero-Config SSE Web Server** for MCP. No separate process or CLI—when you deploy your site, agents can connect over HTTP/SSE immediately.

- **SSE endpoint**: `GET https://your-site.com/mcp/sse` — clients open an EventStream and receive server-sent events.
- **Messages endpoint**: `POST https://your-site.com/mcp/messages` — clients send JSON-RPC messages here.

If your app uses the default SvelteKit hooks (from the template or `examples/agent-docs`), the `/mcp` routes are already handled via `handleMcpRequest` from `llm-site-kit`. No extra configuration required.

| Tool | Description |
|------|-------------|
| **list_documentation_pages** | All paths with summary and token_cost. |
| **read_documentation_page** | `{ path }` → full content, meta, and `data_llm_require`. |
| **search_documentation** | `{ query }` → top-3 pages by relevance (when search index is enabled). |

Programmatic use: `import { createMcpServer } from 'llm-site-kit/mcp'` or `import { handleMcpRequest } from 'llm-site-kit'` for web handling.

---

## Zero-Compute BM25 Search

Search is **build-time only**. No embeddings, no external API, no runtime scoring — ideal for local or low-resource LLMs.

1. Enable in your Vite config:

```js
llmSiteKit({
  docsDir: 'src/docs',
  basePath: '/docs',
  generatedModulePath: 'src/lib/llm-site-kit/generated.js',
  enableSearchIndex: true,   // default: false (opt-in)
})
```

2. Build: the plugin emits `search-index.json` next to `generated.js` (BM25 inverted index).
3. With the Zero-Config MCP web handler, the **search_documentation** tool is available at `/mcp/sse` and `/mcp/messages` and returns top-3 results for a natural-language query.

Opt-in by design — indexing can lengthen build on large doc sets; leave it `false` if you don’t need search.

---

## Create a new project

**From this repo (development):**

```bash
node packages/create-llm-site/bin/create-llm-site.js my-agent-docs
cd my-agent-docs
npm install
npm run dev
```

**When published (v1.0):**

```bash
npm create llm-site@latest my-agent-docs
cd my-agent-docs
npm install
npm run dev
```

---

## Monorepo structure

| Package / app | Description |
|---------------|-------------|
| **packages/llm-site-kit** | Core: AST .vllm parser (acorn), Vite plugin, agent detection, build-time payload, llm-sitemap.json, BM25 search index, MCP server. |
| **packages/create-llm-site** | Scaffolder for `npm create llm-site@latest` (SvelteKit template). |
| **examples/agent-docs** | Minimal SvelteKit example with agent routing. |
| **examples/official-docs** | Official documentation site (dogfooding): introduction, architecture, MCP server, search index. |

---

## Features (v1.0)

- **AST-based .vllm parser** — acorn + acorn-walk; extracts `LLM_Meta` and default-export content without regex or code execution.
- **Agent-aware routing** — Detection via `User-Agent`, `X-LLM-Client`, or `Accept: application/vnd.llm+json`; JSON for agents, HTML for humans.
- **Vite dev middleware** — Serves agent JSON on the fly from `.vllm` files in development.
- **Production (SvelteKit)** — Build-time `generated.js` + `hooks.server.ts` for agent routing (adapter-node or any Node server).
- **`.vllm` files** — `LLM_Meta` (priority, category, token_cost, requires) and default-export markdown; dependency graph validated at build.
- **llm-sitemap.json** — Emitted to `static/` or `dist/` with token costs, summaries, and `requires`.
- **MCP server** — `list_documentation_pages`, `read_documentation_page`, and (optional) `search_documentation`.
- **Zero-compute BM25 search** — Optional static index; `search_documentation` with no runtime inference cost.

---

## Publishing (maintainers)

Packages are versioned **1.0.0**. From the monorepo root:

```bash
npm run publish:all
```

This builds `llm-site-kit`, then runs `npm publish` in `llm-site-kit` and `create-llm-site`. Ensure you’re logged in (`npm login`) and have publish rights for both packages.

---

## License

MIT
