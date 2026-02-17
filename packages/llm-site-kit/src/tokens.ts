/**
 * Token cost estimation for agent budgeting.
 * Industry-standard approximation: ~4 characters per token (English-heavy text).
 */

/** Default characters per token (e.g. OpenAI, Claude use ~4 for English). */
export const DEFAULT_CHARS_PER_TOKEN = 4;

/**
 * Estimate token count from raw text.
 * Uses Math.ceil(text.length / charsPerToken).
 * Prefer LLM_Meta.token_cost when set; use this when it is not.
 */
export function estimateTokenCost(
  text: string,
  charsPerToken: number = DEFAULT_CHARS_PER_TOKEN
): number {
  if (!text || charsPerToken <= 0) return 0;
  return Math.ceil(text.length / charsPerToken);
}
