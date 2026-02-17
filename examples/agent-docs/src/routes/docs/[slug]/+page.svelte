<script>
  import { page } from '$app/state';
  import { agentDocs } from '$lib/llm-site-kit/generated.js';
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/github.min.css';

  marked.use({ breaks: true });

  function highlightCodeBlocks(html) {
    const preRegex = /<pre><code class="language-(\w*)">([\s\S]*?)<\/code><\/pre>/g;
    return html.replace(preRegex, (_, lang, code) => {
      const decoded = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
      try {
        const highlighted = hljs.highlight(decoded, { language: lang || 'plaintext' }).value;
        return `<pre><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`;
      } catch {
        return `<pre><code class="language-${lang || 'plaintext'}">${code}</code></pre>`;
      }
    });
  }

  const slug = $derived(page.params.slug);
  const path = $derived(`/docs/${slug}`);
  const doc = $derived(agentDocs[path]);
  const renderedContent = $derived(
    doc ? highlightCodeBlocks(marked.parse(doc.content)) : ''
  );
</script>

{#if doc}
  <article class="doc-content">
    <h1>Doc: {slug}</h1>
    {@html renderedContent}
    {#if doc.data_llm_require?.length}
      <p class="requires">Requires: {doc.data_llm_require.join(', ')}</p>
    {/if}
  </article>
{:else}
  <p>Not found.</p>
{/if}
<a href="/docs">← Docs</a>

<style>
  .doc-content {
    line-height: 1.6;
    color: #1a1a1a;
    background: #fff;
    padding: 1.25rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .doc-content :global(h1) {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    padding-bottom: 0.25rem;
  }

  .doc-content :global(h2) {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem 0;
    padding-bottom: 0.2rem;
  }

  .doc-content :global(h3) {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 1.25rem 0 0.4rem 0;
  }

  .doc-content :global(p) {
    margin: 0 0 1rem 0;
  }

  .doc-content :global(ul),
  .doc-content :global(ol) {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
  }

  .doc-content :global(li) {
    margin-bottom: 0.25rem;
  }

  .doc-content :global(pre) {
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
    font-size: 0.875rem;
    line-height: 1.45;
  }

  .doc-content :global(pre code) {
    background: none;
    padding: 0;
    border-radius: 0;
  }

  .doc-content :global(:not(pre) > code) {
    background: #f0f0f0;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .doc-content .requires {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e1e4e8;
    font-size: 0.9rem;
    color: #57606a;
  }
</style>
