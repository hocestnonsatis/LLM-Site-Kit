/// <reference types="@sveltejs/kit" />

declare module '$lib/llm-site-kit/generated.js' {
  export const agentDocs: Record<
    string,
    {
      content: string;
      meta: { path: string; token_cost?: number; priority?: string; category?: string; [key: string]: unknown };
      data_llm_require?: string[];
    }
  >;
}
