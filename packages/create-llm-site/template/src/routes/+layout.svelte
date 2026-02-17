<script>
  // Root layout
</script>

<nav>
  <a href="/">Home</a>
  <a href="/docs/setup">Setup</a>
  <a href="/docs/core">Core</a>
</nav>

<main>
  <slot />
</main>

<style>
  :global(main) {
    font-family: system-ui, sans-serif;
    max-width: 60ch;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  nav {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  a {
    color: #0d7377;
  }
  :global(code) {
    background: #eee;
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }
</style>
