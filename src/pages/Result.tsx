import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { ConfidenceMeter } from '../components/diagnostic/ConfidenceMeter';
import { useHealthStore } from '../store/healthStore';

const riskColors = { Low: 'text-green-600', Moderate: 'text-yellow-600', High: 'text-red-600' };
const riskBgs = { Low: 'bg-green-100', Moderate: 'bg-yellow-100', High: 'bg-red-100' };

export default function Result() {
  const nav = useNavigate();
  const result = useHealthStore((s) => s.currentResult);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <p className="text-gray-500 mb-4">No analysis result found.</p>
        <button
          onClick={() => nav('/recording')}
          className="py-3 px-8 rounded-xl bg-blue-600 text-white font-semibold active:scale-95 transition"
        >
          Start New Recording
        </button>
      </div>
    );
  }

  const confPct = Math.round(result.confidence * 100);

  return (
    <div>
      <GradientHeader>
        <div className="text-center">
          <motion.h1 initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-3xl font-bold">
            Analysis Complete
          </motion.h1>
        </div>
      </GradientHeader>

      <div className="-mt-12 relative z-10 flex flex-col items-center gap-4">
        <ConfidenceMeter value={confPct} label="Overall Confidence" color="#2563eb" />

        <Card className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Diagnosis</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskBgs[result.risk]} ${riskColors[result.risk]}`}>
              {result.risk} Risk
            </span>
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">{result.predicted_class}</h2>
          <p className="text-gray-500 text-sm">{result.description}</p>
        </Card>

        {result.mel_b64 && (
          <Card className="w-full">
            <h3 className="font-semibold text-lg mb-3">Breathing Sound Analysis</h3>
            <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
              <img
                src={`data:image/png;base64,${result.mel_b64}`}
                alt="Mel spectrogram"
                className="w-full rounded-lg"
              />
              {result.heatmap_b64 && (
                <img
                  src={`data:image/png;base64,${result.heatmap_b64}`}
                  alt="GradCAM heatmap overlay"
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  style={{ opacity: 0.55, mixBlendMode: 'multiply' }}
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Spectrogram &bull; Highlighted regions show where the AI detected patterns
            </p>
          </Card>
        )}

        {result.llm_explanation && (
          <Card className="w-full">
            <h3 className="font-semibold text-lg mb-3">AI Report</h3>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.llm_explanation}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => nav('/history')}
            className="py-3 rounded-xl glass font-medium text-sm active:scale-95 transition"
          >
            View History
          </button>
          <button
            onClick={() => nav('/recording')}
            className="py-3 rounded-xl bg-blue-600 text-white font-medium text-sm active:scale-95 transition"
          >
            New Scan
          </button>
        </div>
      </div>
    </div>
  );
}
