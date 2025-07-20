// /frontend/data/memory/memoryManager.js

import sampleMemory from './memorySchema';

// Simulated in-memory DB (replace with real DB access later)
let memoryDB = [sampleMemory];

// Utility: lowercase match
const includesKeyword = (text, keyword) =>
  text.toLowerCase().includes(keyword.toLowerCase());

/**
 * Get relevant memory summaries for a given input.
 */
export function getRelevantMemory(userId, companionId, inputText) {
  const userMemory = memoryDB.find(
    (m) => m.userId === userId && m.companionId === companionId
  );
  if (!userMemory) return [];

  const matched = userMemory.memories.filter((mem) =>
    mem.keywords?.some((kw) => includesKeyword(inputText, kw))
  );

  return matched.map((mem) => mem.summary);
}

/**
 * Add a new memory block
 */
export function addMemory(userId, companionId, memoryBlock) {
  let record = memoryDB.find(
    (m) => m.userId === userId && m.companionId === companionId
  );
  if (!record) {
    record = {
      userId,
      companionId,
      memories: []
    };
    memoryDB.push(record);
  }

  memoryBlock.id = `mem_${Date.now()}`;
  memoryBlock.createdAt = new Date().toISOString();
  memoryBlock.lastReinforced = memoryBlock.createdAt;
  record.memories.push(memoryBlock);
  return memoryBlock;
}

/**
 * Manually reinforce (refresh) a memory's importance
 */
export function reinforceMemory(userId, companionId, memoryId) {
  const record = memoryDB.find(
    (m) => m.userId === userId && m.companionId === companionId
  );
  const mem = record?.memories?.find((m) => m.id === memoryId);
  if (mem) mem.lastReinforced = new Date().toISOString();
}

/**
 * For development: get all memory for a user-companion pair
 */
export function getAllMemory(userId, companionId) {
  return memoryDB.find(
    (m) => m.userId === userId && m.companionId === companionId
  )?.memories || [];
}

/**
 * Inject memory into system prompt
 */
export function injectMemoryToPrompt(userId, companionId, inputText, basePrompt) {
  const memorySummaries = getRelevantMemory(userId, companionId, inputText);
  if (!memorySummaries.length) return basePrompt;

  const memoryContext = `You remember these facts about the user:\n- ${memorySummaries.join('\n- ')}`;

  return [
    { role: 'system', content: memoryContext },
    ...basePrompt
  ];
}

/**
 * Extract potential memory from conversation text using AI
 */
export async function extractMemoryFromChat(messages, openai) {
  const prompt = `Extract long-term facts about the user or their life from this conversation:

${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond in JSON like:
[
  {
    "label": "Paul's parents",
    "summary": "They live in Florida and have a cat named Mimi.",
    "keywords": ["parents", "Mimi", "Florida"],
    "type": "person",
    "details": {
      "location": "Florida",
      "pets": ["Mimi"]
    },
    "decayResistant": true
  }
]`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (e) {
    console.error('Failed to parse extracted memory:', e);
    return [];
  }
} 
