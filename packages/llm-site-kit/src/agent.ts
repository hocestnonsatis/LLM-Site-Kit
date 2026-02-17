/**
 * Agent detection: identify requests from LLM crawlers / AI agents
 * so we can serve token-optimized payloads instead of full HTML.
 */

/** Known bot User-Agent substrings (case-insensitive). */
const AGENT_UA_PATTERNS = [
  'GPTBot',
  'ChatGPT-User',
  'Google-Extended',
  'Claude-Web',
  'Anthropic-AI',
  'PerplexityBot',
  'cohere-ai',
  'LLM-Site-Kit', // our own agent client
];

/** Header that can explicitly request the LLM/agent representation. */
export const LLM_CLIENT_HEADER = 'X-LLM-Client';

/** Accept header value for LLM-optimized JSON. */
export const ACCEPT_LLM_JSON = 'application/vnd.llm+json';

export interface AgentDetectionOptions {
  /** Custom User-Agent substrings to treat as agent. */
  userAgentPatterns?: string[];
  /** Header name for explicit agent request (default: X-LLM-Client). */
  llmClientHeader?: string;
  /** If true, Accept: application/vnd.llm+json also triggers agent response. */
  checkAcceptHeader?: boolean;
}

/**
 * Returns true if the request appears to come from an LLM/AI agent
 * (User-Agent heuristics, X-LLM-Client, or Accept header).
 */
export function isAgentRequest(
  request: Request,
  options: AgentDetectionOptions = {}
): boolean {
  const ua = request.headers.get('user-agent') ?? '';
  const patterns = options.userAgentPatterns ?? AGENT_UA_PATTERNS;
  const llmHeader = options.llmClientHeader ?? LLM_CLIENT_HEADER;
  const checkAccept = options.checkAcceptHeader ?? true;

  if (request.headers.get(llmHeader)) return true;
  if (checkAccept && request.headers.get('accept')?.includes(ACCEPT_LLM_JSON)) return true;
  const lower = ua.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}
