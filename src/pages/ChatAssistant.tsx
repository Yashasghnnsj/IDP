import { useState, useRef, useEffect } from 'react';
import { GradientHeader } from '../components/common/GradientHeader';
import { HiPaperAirplane, HiSparkles } from 'react-icons/hi2';
import { sendChatMessage, ChatMessage } from '../services/api';

const MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 3.1 Pro Preview' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 3 Flash Preview' },
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your AcuSound AI health assistant. How can I help you today?" },
  ]);
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
          content: `⚠️ Connection Error: ${error.message || 'Please check your internet connection or try again.'}\n\n*Note: Ensure your OpenRouter API key in the environment is valid.*` 
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

      {/* Model Selector */}
      <div className="px-2 mb-4 relative z-20 -mt-6">
        <div className="glass border border-white/20 rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <HiSparkles className="w-5 h-5 text-blue-500 animate-pulse" />
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

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'glass text-gray-800 border border-white/20'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] p-3 rounded-2xl text-sm glass text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-xs">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Panel */}
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

