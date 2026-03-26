#!/usr/bin/env node

/**
 * agent-dream example using OpenAI as the consolidation backend.
 *
 * Requirements:
 *   npm install openai
 *   export OPENAI_API_KEY=sk-...
 *
 * This shows how to use a real LLM to merge daily logs into long-term memory.
 */

// const OpenAI = require('openai');
const { dream } = require('../src/index');

async function main() {
  // Uncomment to use real OpenAI:
  // const openai = new OpenAI();

  const result = await dream({
    memoryFile: '/tmp/agent-dream-demo/memory.md',
    logsDir: '/tmp/agent-dream-demo/logs',
    stateFile: '/tmp/agent-dream-demo/state.json',

    consolidate: async (longTermMemory, newLogs) => {
      const logsText = newLogs
        .map((l) => `### ${l.date}\n${l.content}`)
        .join('\n\n');

      const prompt = [
        'You are a memory consolidation system for an AI agent.',
        'Below is the agent\'s current long-term memory and new daily logs.',
        'Merge the new information into the long-term memory.',
        'Keep it concise. Preserve important facts, decisions, and lessons learned.',
        'Remove redundancy. Output only the updated memory.',
        '',
        '## Current Long-Term Memory',
        longTermMemory || '(empty — first consolidation)',
        '',
        '## New Daily Logs',
        logsText,
      ].join('\n');

      // --- Real OpenAI call (uncomment to use) ---
      // const response = await openai.chat.completions.create({
      //   model: 'gpt-4o-mini',
      //   messages: [{ role: 'user', content: prompt }],
      //   temperature: 0.3,
      // });
      // return response.choices[0].message.content;

      // --- Stub for demo purposes ---
      console.log('[stub] Would send prompt to OpenAI (%d chars)', prompt.length);
      return longTermMemory + '\n\n' + logsText;
    },

    onPhase: ({ name, status }) => {
      console.log(`[${name}] ${status}`);
    },
  });

  console.log(`\nProcessed: ${result.processed}, Skipped: ${result.skipped}`);
}

main().catch(console.error);
