import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { WaveformVisualizer } from '../components/recording/WaveformVisualizer';
import { Card } from '../components/common/Card';
import { HiMicrophone, HiStop } from 'react-icons/hi2';
import { useHealthStore } from '../store/healthStore';

export default function Recording() {
  const nav = useNavigate();
  const { isRecording, decibel, duration, start, stop, error } = useAudioRecorder();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const setAudioBlob = useHealthStore((s) => s.setAudioBlob);

  const handleToggle = async () => {
    if (isRecording) {
      const blob = await stop();
      setAudioUrl(URL.createObjectURL(blob));
      setAudioBlob(blob);
    } else {
      await start();
    }
  };

  const handleAnalyze = () => {
    nav('/ai-processing');
  };

  const fmt = (ms: number) => `${Math.floor(ms / 1000)}s`;

  return (
    <div className="flex flex-col items-center pt-8">
      <h1 className="text-xl font-bold mb-2">Record Breath</h1>
      <p className="text-gray-500 text-sm mb-8">Hold the microphone close to your mouth</p>

      <Card className="w-full text-center mb-8">
        <WaveformVisualizer isActive={isRecording} decibel={decibel} />
        <div className="text-center mt-4">
          <div className="text-3xl font-bold text-blue-600">{fmt(duration)}</div>
          <div className="text-sm text-gray-400">Duration</div>
        </div>
        <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${decibel}%` }} />
        </div>
        <div className="text-sm text-gray-500 mt-1">Volume: {decibel}%</div>
      </Card>

      {error && (
        <div className="w-full p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600'
        }`}
      >
        {isRecording ? <HiStop className="w-10 h-10 text-white" /> : <HiMicrophone className="w-10 h-10 text-white" />}
      </button>
      <p className="text-sm text-gray-500 mt-3">{isRecording ? 'Tap to stop' : 'Tap to record'}</p>

      {audioUrl && (
        <div className="mt-6 w-full flex flex-col items-center gap-3">
          <audio src={audioUrl} controls className="w-full rounded-xl" />
          <button onClick={handleAnalyze}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition">
            Analyze Recording
          </button>
        </div>
      )}
    </div>
  );
}
