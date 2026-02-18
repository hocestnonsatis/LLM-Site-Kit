# LLM-Site-Kit

Vite + SvelteKit framework for the **Agentic Web**: one codebase for humans (HTML) and agents (JSON + MCP).

- **Humans** — Normal docs site in the browser.
- **Agents** — Same content as structured JSON; optional [MCP](https://modelcontextprotocol.io) server so Cursor, Claude, or any client can list, read, and search your docs.

[Repository](https://github.com/hocestnonsatis/LLM-Site-Kit) · [Issues](https://github.com/hocestnonsatis/LLM-Site-Kit/issues)

---

## Quick start

```bash
git clone https://github.com/hocestnonsatis/LLM-Site-Kit.git
cd LLM-Site-Kit
npm install
npm run build --workspace=llm-site-kit
npm run dev
```

Then open the example at the printed URL (e.g. `http://localhost:5173`). Agent response: `curl -A "GPTBot/1.0" http://localhost:5173/docs/core` returns JSON.

---

## Create a new project

From this repo:

```bash
node packages/create-llm-site/bin/create-llm-site.js my-docs
cd my-docs && npm install && npm run dev
```

When the package is published: `npm create llm-site@latest my-docs`

---

## How it works

1. **Docs** — Markdown (`.md`/`.mdx`) in a folder (e.g. `src/docs`) with YAML frontmatter (`priority`, `category`, `token_cost`, `requires`).
2. **Vite plugin** — Builds a `generated.js` payload and optionally `search-index.json` (BM25, no embeddings).
3. **SvelteKit hooks** — Detect agent requests (e.g. `User-Agent`, `Accept: application/vnd.llm+json`) and serve JSON for doc paths; HTML for everyone else.
4. **MCP (zero-config)** — Same hooks serve `/mcp`: GET for SSE, POST for JSON-RPC. No extra process. Tools: `list_documentation_pages`, `read_documentation_page`, and (if search index is enabled) `search_documentation`.

Configure MCP clients (e.g. Cursor) with URL `http://localhost:PORT/mcp` (or your deployed site + `/mcp`).

---

## Vite config (minimal)

```js
import { llmSiteKit } from 'llm-site-kit';

export default {
  plugins: [
    llmSiteKit({
      docsDir: 'src/docs',
      basePath: '/docs',
      enableSearchIndex: true,  // optional: enables search_documentation
    }),
  ],
};
```

Hooks: for any request under `/mcp`, call `handleMcpRequest(request, agentDocs, searchIndex)` from `llm-site-kit`. The template and examples already do this.

---

## Repo layout

| Path | Purpose |
|------|---------|
| `packages/llm-site-kit` | Core: Vite plugin, agent detection, MCP web handler, BM25 search. |
| `packages/create-llm-site` | Scaffold for new projects. |
| `examples/agent-docs` | Minimal example. |
| `examples/official-docs` | Full docs site (with search). |

---

## License

MIT
