import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { ConfidenceMeter } from '../components/diagnostic/ConfidenceMeter';
import { useHealthStore } from '../store/healthStore';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

const riskColors = { Low: 'text-green-600', Moderate: 'text-yellow-600', High: 'text-red-600' };
const riskBgs = { Low: 'bg-green-100', Moderate: 'bg-yellow-100', High: 'bg-red-100' };
const riskBadgeBgs = { Low: 'bg-green-500/10 border-green-200', Moderate: 'bg-yellow-500/10 border-yellow-200', High: 'bg-red-500/10 border-red-200' };

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
          {result.model_used && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Analyzed with <span className="font-medium text-gray-500">{result.model_used}</span>
            </div>
          )}
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
          <Card className="w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Report</h3>
                <p className="text-xs text-gray-400">Automated respiratory analysis</p>
              </div>
            </div>
            <div className="text-sm leading-relaxed">
              <MarkdownRenderer content={result.llm_explanation} />
            </div>
          </Card>
        )}

        <div className="w-full mb-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl bg-indigo-100 text-indigo-700 font-semibold active:scale-95 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download Report
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full print:hidden">
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
