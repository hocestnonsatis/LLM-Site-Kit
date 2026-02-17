---
priority: high
category: core-concept
token_cost: 120
requires:
  - /docs/setup
---

# Core Concepts

LLM-Site-Kit serves **dual experiences** from one codebase:

- **Human visitor** → Normal static or SSR site (HTML, CSS, JS).
- **AI agent / crawler** → Token-optimized payload (JSON with content + metadata).

Agent detection uses `User-Agent` (e.g. GPTBot, Claude-Web), the `X-LLM-Client` header, or `Accept: application/vnd.llm+json`.

<code-example lang="bash" role="usage">
curl -A "GPTBot/1.0" http://localhost:5173/docs/core
</code-example>

@constraint: Read /docs/setup before advanced topics.
