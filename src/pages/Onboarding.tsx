import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  { title: 'AI-Powered Detection', desc: 'Advanced respiratory analysis using machine learning', icon: '🫁' },
  { title: 'Real-time Monitoring', desc: 'Track your lung health with daily scans', icon: '📊' },
  { title: 'Instant Results', desc: 'Get AI-powered diagnosis in seconds', icon: '⚡' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-cyan-400 p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          className="text-center"
        >
          <div className="text-7xl mb-6">{slides[step].icon}</div>
          <h2 className="text-2xl font-bold text-white mb-3">{slides[step].title}</h2>
          <p className="text-white/70 max-w-xs">{slides[step].desc}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2 mt-10 mb-10">
        {slides.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
      <button
        onClick={() => step < 2 ? setStep(step + 1) : nav('/login')}
        className="bg-white text-blue-600 font-semibold px-10 py-3 rounded-full shadow-lg"
      >
        {step < 2 ? 'Next' : 'Get Started'}
      </button>
    </div>
  );
}
