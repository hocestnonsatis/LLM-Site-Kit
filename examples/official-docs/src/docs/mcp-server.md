---
priority: high
category: integration
token_cost: 200
requires:
  - /docs/introduction
---

# MCP Server

LLM-Site-Kit exposes your documentation as an **MCP (Model Context Protocol)** server. Any MCP client (Cursor, Claude Desktop, custom agents) can list pages, read content, and—when the search index is enabled—search docs by natural language.

## Starting the server

After building your project (so that `src/lib/llm-site-kit/generated.js` exists), run from the **project root**:

```bash
npx llm-site-mcp
```

The server uses **stdio** transport: it reads from stdin and writes to stdout. Configure your MCP client to run this command and communicate over stdio.

Override the path to the generated payload if needed:

```bash
LLM_SITE_GENERATED_PATH=src/lib/llm-site-kit/generated.js npx llm-site-mcp
```

## Tools provided

- **list_documentation_pages** — No arguments. Returns all documentation paths with a short summary and `token_cost` for each. Use this to discover what the site offers before reading specific pages.
- **read_documentation_page** — Argument: `{ path: string }` (e.g. `/docs/setup`). Returns the full content, `meta`, and `data_llm_require` for that page. Use the exact path from `list_documentation_pages`.
- **search_documentation** — Argument: `{ query: string }`. Returns the **top-3** most relevant pages with `path`, `summary`, and `relevance_score`. Only available when the build was run with `enableSearchIndex: true` (see Search Index docs).

## Programmatic use

You can create an MCP server in code and attach your own transport:

```js
import { createMcpServer } from 'llm-site-kit/mcp';
import { agentDocs } from './generated.js';
import { searchIndex } from './search-index.json'; // optional

const server = createMcpServer(agentDocs, { searchIndex });
// Attach transport (e.g. stdio, HTTP) and connect.
```

When `searchIndex` is provided, the `search_documentation` tool is registered automatically.
