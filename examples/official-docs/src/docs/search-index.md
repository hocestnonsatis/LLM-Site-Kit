---
priority: high
category: integration
token_cost: 190
requires:
  - /docs/introduction
---

# Search Index (Zero-Compute BM25)

LLM-Site-Kit can build a **static BM25 search index** at build time. All scoring is precomputed; at runtime the MCP tool `search_documentation` only does lookups and simple arithmetic. This keeps agent tooling fast and suitable for low-resource or local LLM setups—no embeddings, no external search API.

## Enabling the index

In your Vite config, set `enableSearchIndex: true` in the LLM-Site-Kit plugin:

```js
llmSiteKit({
  docsDir: 'src/docs',
  basePath: '/docs',
  generatedModulePath: 'src/lib/llm-site-kit/generated.js',
  enableSearchIndex: true,  // default is false (opt-in)
})
```

When enabled, the plugin:

1. Tokenizes each .md/.mdx document (content + summary): lowercase, split on non-alphanumeric, optional stopword removal.
2. Builds an **inverted index**: term → list of (docId, term frequency). Computes IDF per term and document length for BM25.
3. Writes `search-index.json` next to `generated.js` (e.g. `src/lib/llm-site-kit/search-index.json`).

The index is **BM25** (k1=1.2, b=0.75). No embeddings or vector DB; fully local and JSON-serializable.

## MCP tool: search_documentation

Once the index exists, the MCP server (e.g. `npx llm-site-mcp`) registers the `search_documentation` tool. The agent sends a `query` string; the server tokenizes the query, scores documents using the pre-built index, and returns the **top-3** results with `path`, `summary`, and `relevance_score`.

Example: query "how to start MCP server" might return `/docs/mcp-server` with the highest score, then other related pages.

## Opt-in by design

Indexing can increase build time on large doc sets. `enableSearchIndex` defaults to `false` so small or non-search use cases are unaffected. Enable it when you want agents to discover pages by semantic (keyword) search without runtime cost.
