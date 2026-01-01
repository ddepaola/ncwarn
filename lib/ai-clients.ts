import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// OpenAI client (GPT-4, etc.)
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Anthropic client (Claude)
export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Perplexity client (uses OpenAI-compatible API)
export const perplexity = process.env.PPLX_API_KEY
  ? new OpenAI({
      apiKey: process.env.PPLX_API_KEY,
      baseURL: 'https://api.perplexity.ai',
    })
  : null;

// Google Gemini - simplified fetch-based client
export async function geminiGenerate(prompt: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

// Helper to generate text using any available provider
export async function generateText(
  prompt: string,
  preferredProvider: 'openai' | 'anthropic' | 'gemini' | 'perplexity' = 'openai'
): Promise<string | null> {
  try {
    switch (preferredProvider) {
      case 'openai':
        if (openai) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
          });
          return response.choices[0]?.message?.content || null;
        }
        break;

      case 'anthropic':
        if (anthropic) {
          const response = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          });
          const textBlock = response.content.find(block => block.type === 'text');
          return textBlock && textBlock.type === 'text' ? textBlock.text : null;
        }
        break;

      case 'gemini':
        return await geminiGenerate(prompt);

      case 'perplexity':
        if (perplexity) {
          const response = await perplexity.chat.completions.create({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: prompt }],
          });
          return response.choices[0]?.message?.content || null;
        }
        break;
    }

    // Fallback chain
    if (openai) return generateText(prompt, 'openai');
    if (anthropic) return generateText(prompt, 'anthropic');
    if (process.env.GOOGLE_GEMINI_API_KEY) return geminiGenerate(prompt);
    if (perplexity) return generateText(prompt, 'perplexity');

    return null;
  } catch (error) {
    console.error(`AI generation error (${preferredProvider}):`, error);
    return null;
  }
}
