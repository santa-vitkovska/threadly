import type { Message } from '../firebase/firestore';

/**
 * Summarize recent messages using AI
 * Note: This requires an API key to be configured
 * Placeholder implementation - user will need to add their API key
 */
export const summarizeMessages = async (messages: Message[]): Promise<string> => {
  if (messages.length === 0) {
    return 'No messages to summarize';
  }

  // Get the last 50 messages for context
  const recentMessages = messages.slice(-50);
  
  // Format messages for AI
  const messageTexts = recentMessages
    .filter((msg) => msg.type === 'text')
    .map((msg) => msg.text)
    .join('\n');

  if (!messageTexts) {
    return 'No text messages found to summarize';
  }

  // TODO: Replace with actual AI API call
  // Example with OpenAI (user needs to add API key):
  /*
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes chat conversations concisely.',
        },
        {
          role: 'user',
          content: `Please summarize the following chat messages:\n\n${messageTexts}`,
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI summary');
  }

  const data = await response.json();
  return data.choices[0].message.content;
  */

  // Placeholder implementation
  const wordCount = messageTexts.split(/\s+/).length;
  return `This conversation contains ${recentMessages.length} messages with approximately ${wordCount} words. [AI summarization requires API key configuration]`;
};

