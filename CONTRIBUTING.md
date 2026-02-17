# Contributing to LLM-Site-Kit

Thank you for your interest in contributing. This document explains how to set up the monorepo, test your changes, and follow our commit conventions.

## Table of contents

- [Local setup](#local-setup)
- [Testing your changes](#testing-your-changes)
- [Commit message standards](#commit-message-standards)

---

## Local setup

### Prerequisites

- **Node.js** >= 18 (we recommend v20; CI uses v20)
- **npm** (comes with Node)

### Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_ORG/LLM-Site-Kit.git
   cd LLM-Site-Kit
   ```

2. **Install dependencies**

   From the repo root, install all workspace dependencies:

   ```bash
   npm install
   ```

3. **Build the core package**

   The examples depend on the local `llm-site-kit` package. Build it once (or use `--watch` while developing):

   ```bash
   npm run build --workspace=llm-site-kit
   ```

4. **Run the dev server**

   - **Example app (agent-docs):**  
     `npm run dev`  
     Serves the minimal example at e.g. `http://localhost:5173`.

   - **Official docs (dogfooding):**  
     `npm run dev:docs`  
     Serves the documentation site.

   Use the port Vite prints (e.g. 5173 or 5174).

5. **Verify agent response**

   ```bash
   curl -A "GPTBot/1.0" http://localhost:5173/docs/core
   ```

   You should get JSON with `content`, `meta`, and `data_llm_require`.

---

## Testing your changes

### Vite plugin changes

If you change the plugin (`packages/llm-site-kit/src/plugin.ts`), .vllm resolution, or build-time output (`generated.js`, `search-index.json`, `llm-sitemap.json`):

1. Rebuild the core package:  
   `npm run build --workspace=llm-site-kit`
2. Restart or rely on Vite’s reload, then run an example:  
   `npm run dev` or `npm run dev:docs`
3. Confirm:
   - Agent JSON is returned for doc routes (e.g. `curl -A "GPTBot/1.0" http://localhost:5173/docs/...`).
   - `src/lib/llm-site-kit/generated.js` (and `search-index.json` if `enableSearchIndex: true`) is updated after build.
   - Full monorepo build passes:  
     `npm run build`

### MCP server changes

If you change the MCP server (`packages/llm-site-kit/src/mcp.ts`), CLI (`cli-mcp.ts`), or search index usage:

1. Rebuild:  
   `npm run build --workspace=llm-site-kit`
2. From an example app (e.g. `examples/agent-docs` or `examples/official-docs`), ensure the app has been built at least once so `generated.js` (and optionally `search-index.json`) exists.
3. From the **example app directory** (or repo root if your MCP client is configured to use it), start the MCP server:  
   `npx llm-site-mcp`
4. With an MCP client (e.g. Cursor, Claude Desktop), verify:
   - `list_documentation_pages` returns the expected paths.
   - `read_documentation_page` returns content for a given path.
   - If the example has `enableSearchIndex: true`, `search_documentation` returns top results for a query.

### AST parser / .vllm parsing

If you change the .vllm parser (`parse-vllm-ast.ts`, `parse-vllm.ts`):

1. Rebuild `llm-site-kit` and run `npm run build` to ensure all examples still build.
2. Manually test with .vllm files that use different structures (e.g. in `examples/official-docs/src/docs/` or `examples/agent-docs/src/docs/`).
3. Run the type checker:  
   `npx tsc --noEmit` in `packages/llm-site-kit`.

### Full check before opening a PR

From the repo root:

```bash
npm run build
npx tsc --noEmit --project packages/llm-site-kit
```

CI runs the same build and type-check on push/PR to `main`.

---

## Commit message standards

We follow **Conventional Commits** so history and changelogs stay clear.

### Format

```
<type>(<scope>): <short description>

[optional body]
```

- **type** (required): `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, etc.
- **scope** (optional): e.g. `plugin`, `mcp`, `search-index`, `parser`, `examples`.
- **description**: imperative, lowercase start, no period at the end.

### Types

| Type     | Use for |
|----------|--------|
| `feat`   | New feature (e.g. new MCP tool, plugin option). |
| `fix`    | Bug fix (parsing, routing, token calculation, etc.). |
| `docs`   | Documentation only (README, CONTRIBUTING, comments). |
| `chore`  | Tooling, config, dependencies (no production code change). |
| `refactor` | Code change that doesn’t fix a bug or add a feature. |
| `test`   | Adding or updating tests. |
| `ci`     | CI/CD or GitHub Actions changes. |

### Examples

```text
feat(plugin): add enableSearchIndex option for BM25 index
fix(mcp): normalize path in read_documentation_page
docs: add CONTRIBUTING and issue/PR templates
chore(deps): bump acorn to 8.14.0
refactor(parser): extract tokenize into search-index module
ci: run type-check in llm-site-kit on Node 20
```

### Scope ideas

- `plugin` — Vite plugin
- `mcp` — MCP server and CLI
- `search-index` — BM25 index and search_documentation
- `parser` — .vllm AST parsing
- `sitemap` — llm-sitemap.json generation
- `examples` — agent-docs, official-docs

---

Thank you for contributing to LLM-Site-Kit.
