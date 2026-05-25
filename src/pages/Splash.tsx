import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import lottie from 'lottie-web';
import animationData from '../assets/animations/lung-pulse.json';

export default function Splash() {
  const nav = useNavigate();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const anim = lottie.loadAnimation({
      container: container.current,
      animationData,
      renderer: 'svg',
      loop: false,
      autoplay: true,
    });
    anim.addEventListener('complete', () => nav('/onboarding'));
    return () => anim.destroy();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-cyan-400">
      <div ref={container} className="w-40 h-40 mb-6" />
      <h1 className="text-3xl font-bold text-white">AcuSound</h1>
      <p className="text-white/70 mt-2">AI Respiratory Detection</p>
    </div>
  );
}
