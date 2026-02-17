## Description

<!-- Short description of what this PR does -->

## Checklist

Please confirm the following where they apply to your changes:

- [ ] **AST parser** — If you changed `.vllm` parsing (`parse-vllm-ast.ts` / `parse-vllm.ts`), you ran a full build and verified doc routes and generated payload still work (e.g. `npm run build` and `curl -A "GPTBot/1.0" http://localhost:5173/docs/...`).
- [ ] **Token calculation** — If your change touches `tokens.ts` or how `token_cost` is computed or exposed, you confirmed sitemap and agent payload still show correct (or intended) token values.
- [ ] **MCP & search index** — If you changed the MCP server or search index, you verified `list_documentation_pages`, `read_documentation_page`, and (when enabled) `search_documentation` still work (e.g. via `/mcp/sse` and an MCP client that supports HTTP/SSE).
- [ ] **Requires / dependencies** — Your change does not introduce broken `requires` links (missing targets); the plugin’s dependency validation did not report new warnings for the examples or your test docs.

## Testing

<!-- How did you test this? (e.g. ran `npm run build`, tested in agent-docs, ran MCP in Cursor) -->

## Related issues

<!-- Link any related issues, e.g. "Closes #123" -->
