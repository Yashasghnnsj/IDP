const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[], model = 'google/gemini-2.5-pro'): Promise<string> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are AcuSound AI, a professional and helpful respiratory health chatbot assistant. 
You help users understand respiratory symptoms, cough analysis concepts, breathing exercises, and general wellness.
You must always include a friendly medical disclaimer when discussing specific diagnoses or symptoms: "AcuSound AI is not a substitute for professional medical diagnosis. Please consult a doctor for personalized medical advice."
Keep responses concise, helpful, and formatted beautifully using markdown.`
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'AcuSound PWA',
    },
    body: JSON.stringify({
      model: model,
      messages: [systemMessage, ...messages],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response received from the model.';
}
