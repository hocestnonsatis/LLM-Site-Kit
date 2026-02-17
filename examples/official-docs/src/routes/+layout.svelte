<script>
  // Root layout — LLM-Site-Kit official docs
</script>

<nav>
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
  <a href="/docs/introduction">Introduction</a>
  <a href="/docs/architecture">Architecture</a>
  <a href="/docs/mcp-server">MCP Server</a>
  <a href="/docs/search-index">Search Index</a>
</nav>

<main>
  <slot />
</main>

<style>
  :global(main) {
    font-family: system-ui, sans-serif;
    max-width: 65ch;
    margin: 2rem auto;
    padding: 0 1.25rem;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  a {
    color: #0d7377;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  :global(code) {
    background: #f0f0f0;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  :global(pre) {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
</style>
