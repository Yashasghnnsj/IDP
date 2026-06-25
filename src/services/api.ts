const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const CHAT_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemma-4-31b-it:free',
];

export async function sendChatMessage(messages: ChatMessage[], model = CHAT_MODELS[0]): Promise<string> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are AcuSound AI, a professional and helpful respiratory health chatbot assistant.
You help users understand respiratory symptoms, cough analysis concepts, breathing exercises, and general wellness.
You must always include a friendly medical disclaimer when discussing specific diagnoses or symptoms: "AcuSound AI is not a substitute for professional medical diagnosis. Please consult a doctor for personalized medical advice."
Keep responses concise, helpful, and format them beautifully using markdown. Use **bold** for important terms, *italics* for emphasis, and bullet lists for clarity. End every response that discusses a health concern with the disclaimer in *italic*.`
  };

  let lastError: Error | null = null;

  for (const modelId of CHAT_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AcuSound PWA',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [systemMessage, ...messages],
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(errorData.error?.message || `API error: ${response.status}`);
        console.warn(`[AcuSound] Chat model ${modelId} failed:`, lastError.message);
        continue;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AcuSound] Chat model ${modelId} failed:`, err.message);
    }
  }

  throw new Error(lastError?.message || 'All chat models failed. Please try again.');
}
