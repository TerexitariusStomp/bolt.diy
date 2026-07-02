import { describe, it, expect } from 'vitest';
import { streamText } from './stream-text';
import type { Message } from 'ai';

/**
 * End-to-end smoke test for the app creation system using Nvidia NIM via OpenAI-Like.
 * This actually calls the configured LLM and asks it to generate a small app,
 * then verifies the response contains a valid bolt artifact with styling.
 *
 * Run manually with the Cloudflare / production secrets:
 *   OPENAI_LIKE_API_BASE_URL=https://integrate.api.nvidia.com/v1 \
 *   OPENAI_LIKE_API_KEY=... \
 *   npx vitest run app/lib/.server/llm/e2e-app-creation.manual-test.ts
 */
describe('e2e app creation', () => {
  it('generates a beautiful styled todo app from a single prompt', async () => {
    const baseUrl = process.env.OPENAI_LIKE_API_BASE_URL || '';
    const apiKey = process.env.OPENAI_LIKE_API_KEY || '';

    if (!baseUrl || !apiKey) {
      throw new Error(
        'OPENAI_LIKE_API_BASE_URL and OPENAI_LIKE_API_KEY are required. Set them in the environment to run this test.',
      );
    }

    const message: Omit<Message, 'id'> = {
      role: 'user',
      content: `[Model: qwen/qwen3-next-80b-a3b-instruct]\n\n[Provider: OpenAILike]\n\nCreate a beautiful, dark-themed todo app with React + Vite + Tailwind. The app should be centered on screen, have a polished card with a border, a primary button with a nice color, input with focus ring, and small Lucide icons. No bullet lists. Keep it simple and functional.`,
    };

    const result = await streamText({
      messages: [message],
      env: { OPENAI_LIKE_API_BASE_URL: baseUrl, OPENAI_LIKE_API_KEY: apiKey } as any,
      chatMode: 'build',
    });

    let fullText = '';
    let streamError: any = null;

    for await (const part of result.fullStream) {
      if (part.type === 'text-delta') {
        fullText += part.textDelta;
      } else if (part.type === 'error') {
        streamError = part.error;
        console.error('LLM stream error:', part.error);
      }
    }

    console.log('Generated response length:', fullText.length);
    console.log('Generated response preview:', fullText.slice(0, 500));

    if (streamError) {
      throw new Error(
        `LLM stream failed: ${streamError.message || streamError}. The API key may be invalid or the provider may be unavailable.`,
      );
    }

    expect(fullText).toContain('<boltArtifact');
    expect(fullText).toContain('<boltAction');
    expect(fullText).toContain('type="start"');
    expect(fullText).toContain('tailwind.config');
    expect(fullText).toContain('src/index.css');
    expect(fullText).toContain('src/App.jsx');
    expect(fullText.length).toBeGreaterThan(500);

    // Check for common anti-patterns that make apps look bad
    const lowercase = fullText.toLowerCase();
    expect(lowercase).not.toContain('bg-white');
    expect(lowercase).not.toContain('text-white');
    expect(lowercase).not.toContain('text-black');
    expect(lowercase).not.toContain('bg-black');
  }, 120000);
});
