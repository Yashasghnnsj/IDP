import { useRef, useEffect } from 'react';

export function WaveformVisualizer({
  isActive,
  decibel = 50,
  barCount = 50,
  className = '',
}: {
  isActive: boolean;
  decibel?: number;
  barCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!isActive) return;

      const barWidth = rect.width / barCount;
      const maxH = rect.height * 0.8;
      const now = Date.now() * 0.005;

      for (let i = 0; i < barCount; i++) {
        const envelope = Math.sin(i * 0.15 + now) * 0.5 + 0.5;
        const h = envelope * (decibel / 100) * maxH;
        const x = i * barWidth;
        const alpha = 0.3 + (decibel / 100) * 0.5;
        ctx.fillStyle = `rgba(30, 136, 229, ${alpha})`;
        ctx.beginPath();
        ctx.roundRect(x, rect.height - h, barWidth - 2, h, [2]);
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, decibel, barCount]);

  return <canvas ref={canvasRef} className={`w-full h-20 rounded-xl ${className}`} />;
}
