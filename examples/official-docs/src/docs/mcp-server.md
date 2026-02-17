---
priority: high
category: integration
token_cost: 200
requires:
  - /docs/introduction
---

# MCP Server

LLM-Site-Kit exposes your documentation as an **MCP (Model Context Protocol)** server over the web. Any MCP client that supports HTTP/SSE (Cursor, Claude Desktop, custom agents) can list pages, read content, and—when the search index is enabled—search docs by natural language.

## Zero-Config SSE Web Server

No separate process or CLI. When your site is running (dev or deployed), the MCP server is available at:

- **SSE**: `GET https://your-site.com/mcp/sse` — open an EventStream to receive server-sent events.
- **Messages**: `POST https://your-site.com/mcp/messages` — send JSON-RPC messages.

The default SvelteKit hooks (template and `examples/agent-docs`) use `handleMcpRequest` from `llm-site-kit`, so `/mcp` routes work with no extra configuration. Deploy your site and agents can connect to `https://your-site.com/mcp/sse` immediately.

## Tools provided

- **list_documentation_pages** — No arguments. Returns all documentation paths with a short summary and `token_cost` for each. Use this to discover what the site offers before reading specific pages.
- **read_documentation_page** — Argument: `{ path: string }` (e.g. `/docs/setup`). Returns the full content, `meta`, and `data_llm_require` for that page. Use the exact path from `list_documentation_pages`.
- **search_documentation** — Argument: `{ query: string }`. Returns the **top-3** most relevant pages with `path`, `summary`, and `relevance_score`. Only available when the build was run with `enableSearchIndex: true` (see Search Index docs).

## Programmatic use

For web (SSE/Streamable HTTP), use the built-in handler in your SvelteKit `hooks.server.ts`:

```js
import { handleMcpRequest } from 'llm-site-kit';
// In handle(): if (url.pathname.startsWith('/mcp')) return handleMcpRequest(request, agentDocs, searchIndex);
```

To build a custom MCP server with your own transport:

```js
import { createMcpServer } from 'llm-site-kit/mcp';
import { agentDocs } from './generated.js';
import { searchIndex } from './search-index.json'; // optional

const server = createMcpServer(agentDocs, { searchIndex });
// Attach transport (e.g. WebStandardStreamableHTTPServerTransport) and connect.
```

When `searchIndex` is provided, the `search_documentation` tool is registered automatically.
