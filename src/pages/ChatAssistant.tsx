import { useState, useRef, useEffect } from 'react';
import { GradientHeader } from '../components/common/GradientHeader';
import { HiPaperAirplane, HiSparkles } from 'react-icons/hi2';
import { sendChatMessage, ChatMessage } from '../services/api';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

const MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 3.1 Pro Preview' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 3 Flash Preview' },
];

const AVATAR_AI = (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  </div>
);

const AVATAR_USER = (
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center shrink-0 shadow-sm">
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  </div>
);

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: `Hello! I'm your **AcuSound AI** health assistant. How can I help you today?

I can provide information on:

* **Respiratory symptoms** (like cough, shortness of breath)
* **Cough analysis concepts** (how a cough can be characterized)
* **Breathing exercises**
* **General wellness tips** related to respiratory health

*AcuSound AI is not a substitute for professional medical diagnosis. Please consult a doctor for personalized medical advice.*`
};

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-pro');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const currentHistory = [...messages, userMessage];
      const reply = await sendChatMessage(currentHistory, selectedModel);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm having trouble connecting. Please check your internet connection and try again.\n\n*Error: ${error.message || 'Connection failed'}*`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">AI Health Chat</h1>
        <p className="text-white/70 text-sm">Ask about your respiratory health</p>
      </GradientHeader>

      <div className="px-2 mb-4 relative z-20 -mt-6">
        <div className="glass border border-white/20 rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold text-gray-700">AI Model</span>
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent border-0 text-sm font-semibold text-blue-600 outline-none cursor-pointer focus:ring-0"
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id} className="text-gray-900 bg-white">
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {m.role === 'assistant' ? AVATAR_AI : AVATAR_USER}
            <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'glass text-gray-800 border border-white/20'
            }`}>
              {m.role === 'user' ? (
                <p className="whitespace-pre-line">{m.content}</p>
              ) : (
                <MarkdownRenderer content={m.content} isChat={true} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            {AVATAR_AI}
            <div className="max-w-[75%] p-3.5 rounded-2xl text-sm glass text-gray-500 flex items-center gap-2 border border-white/20">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-xs text-gray-400">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 p-2 glass rounded-2xl mt-2 border border-white/20">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
          placeholder={loading ? "AI is processing..." : "Type your message..."}
          className="flex-1 px-4 py-2 bg-transparent outline-none text-sm disabled:opacity-50 text-gray-800"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-blue-600 text-white disabled:bg-blue-400 disabled:cursor-not-allowed transition"
        >
          <HiPaperAirplane className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
