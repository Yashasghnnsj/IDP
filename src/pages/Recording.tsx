import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { WaveformVisualizer } from '../components/recording/WaveformVisualizer';
import { Card } from '../components/common/Card';
import { HiMicrophone, HiStop, HiSparkles, HiArrowUpTray } from 'react-icons/hi2';
import { useHealthStore } from '../store/healthStore';

const MODELS = [
  { id: 'efficientnet', name: 'Deep Learning (EfficientNet)', icon: '🧠', desc: 'Neural network with GradCAM visualization' },
  { id: 'svm', name: 'Support Vector Machine (SVM)', icon: '📊', desc: 'Traditional ML classifier' },
  { id: 'knn', name: 'K-Nearest Neighbors (KNN)', icon: '📈', desc: 'Traditional ML classifier' },
  { id: 'rf', name: 'Random Forest', icon: '🌲', desc: 'Traditional ML classifier' },
];

const ACCEPTED_TYPES = [
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mpeg', 'audio/mp3',
  'audio/ogg', 'audio/webm',
  'audio/mp4', 'audio/x-m4a', 'audio/aac',
  'audio/flac',
];

const ACCEPTED_EXTENSIONS = '.wav,.mp3,.ogg,.webm,.m4a,.aac,.flac';

export default function Recording() {
  const nav = useNavigate();
  const { isRecording, decibel, duration, start, stop, error } = useAudioRecorder();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [source, setSource] = useState<'record' | 'upload' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setAudioBlob = useHealthStore((s) => s.setAudioBlob);
  const selectedModel = useHealthStore((s) => s.selectedModel);
  const setSelectedModel = useHealthStore((s) => s.setSelectedModel);

  const handleFile = useCallback((file: File) => {
    if (!file) return;
    const blob = new Blob([file], { type: file.type || 'audio/wav' });
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setAudioBlob(blob);
    setSource('upload');
  }, [audioUrl, setAudioBlob]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleToggle = async () => {
    if (isRecording) {
      const blob = await stop();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioBlob(blob);
      setSource('record');
    } else {
      setSource('record');
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
      <p className="text-gray-500 text-sm mb-6">Hold the microphone close to your mouth</p>

      {/* Model Selector */}
      <div className="w-full mb-6">
        <div className="flex items-center gap-2 mb-3">
          <HiSparkles className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Analysis Model</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`p-3 rounded-xl text-left transition-all active:scale-95 border ${
                selectedModel === m.id
                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                  : 'bg-white/50 border-gray-200/60 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              <p className={`text-xs font-semibold mt-1 ${selectedModel === m.id ? 'text-blue-700' : 'text-gray-700'}`}>
                {m.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Record Section */}
      <Card className="w-full text-center mb-4">
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

      {/* Divider */}
      <div className="flex items-center gap-3 w-full my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Upload Section */}
      <div
        className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <HiArrowUpTray className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {isDragging ? 'Drop audio file here' : 'Upload audio file'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              WAV, MP3, OGG, WebM, M4A, AAC, FLAC
            </p>
          </div>
        </div>
      </div>

      {/* Audio Player & Analyze */}
      {audioUrl && (
        <div className="mt-6 w-full flex flex-col items-center gap-3">
          <div className="w-full flex items-center gap-2 px-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              source === 'record' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
            }`}>
              {source === 'record' ? 'Recorded' : 'Uploaded'}
            </span>
          </div>
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
