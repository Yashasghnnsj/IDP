import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import lottie from 'lottie-web';
import animationData from '../assets/animations/ai-brain.json';

export default function AIProcessing() {
  const nav = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById('lottie-brain');
    if (!container) return;
    const anim = lottie.loadAnimation({
      container,
      animationData,
      renderer: 'svg',
      loop: true,
      autoplay: true,
    });
    return () => anim.destroy();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => nav('/result'), 500);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div id="lottie-brain" className="w-36 h-36" />
      <h2 className="text-xl font-bold mt-6">Analyzing Your Breath</h2>
      <p className="text-gray-500 text-sm mt-2">AI neural network processing audio patterns</p>
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-8 overflow-hidden">
        <motion.div className="h-full bg-blue-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-gray-400 mt-2">{progress}%</p>
      <p className="text-xs text-gray-300 mt-6 max-w-xs text-center">
        Extracting respiratory features &bull; Classifying lung sounds &bull; Generating report
      </p>
    </div>
  );
}
