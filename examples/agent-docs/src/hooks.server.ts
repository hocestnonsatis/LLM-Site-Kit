/**
 * SvelteKit server hooks: agent-aware routing.
 * For requests identified as LLM/agent, serve JSON payload from pre-built agent docs
 * instead of HTML. Humans get the normal SvelteKit response.
 * /mcp/* is handled by zero-config MCP web handler (GET /mcp/sse, POST /mcp/messages).
 */
import { isAgentRequest, handleMcpRequest } from 'llm-site-kit';
import { agentDocs } from '$lib/llm-site-kit/generated.js';

const DOCS_BASE = '/docs';

export async function handle({ event, resolve }) {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/mcp')) {
    return handleMcpRequest(request, agentDocs, undefined);
  }

  if (request.method !== 'GET' || !url.pathname.startsWith(DOCS_BASE)) {
    return resolve(event);
  }

  if (!isAgentRequest(request)) {
    return resolve(event);
  }

  const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  const key = pathname === '' ? DOCS_BASE : pathname;
  const payload = agentDocs[key];

  if (!payload) {
    return resolve(event);
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
