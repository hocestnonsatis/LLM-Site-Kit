<script>
  import { page } from '$app/state';
  import { agentDocs } from '$lib/llm-site-kit/generated.js';

  const slug = $derived(page.params.slug);
  const path = $derived(`/docs/${slug}`);
  const doc = $derived(agentDocs[path]);
</script>

{#if doc}
  <h1>Doc: {slug}</h1>
  <pre>{doc.content}</pre>
  {#if doc.data_llm_require?.length}
    <p><strong>Requires:</strong> {doc.data_llm_require.join(', ')}</p>
  {/if}
{:else}
  <p>Not found.</p>
{/if}
<a href="/docs">← Docs</a>
