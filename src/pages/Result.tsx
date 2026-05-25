import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { ConfidenceMeter } from '../components/diagnostic/ConfidenceMeter';

const mockResults = [
  { disease: 'Healthy', confidence: 92, risk: 'Low' as const, desc: 'No significant abnormalities detected' },
];

export default function Result() {
  const nav = useNavigate();
  const [result] = useState(mockResults[0]);

  const riskColors = { Low: 'text-green-600', Moderate: 'text-yellow-600', High: 'text-red-600' };
  const riskBgs = { Low: 'bg-green-100', Moderate: 'bg-yellow-100', High: 'bg-red-100' };

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
        <ConfidenceMeter value={result.confidence} label="Overall Confidence" color="#2563eb" />

        <Card className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Diagnosis</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskBgs[result.risk]} ${riskColors[result.risk]}`}>
              {result.risk} Risk
            </span>
          </div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">{result.disease}</h2>
          <p className="text-gray-500 text-sm">{result.desc}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => nav('/history')} className="py-3 rounded-xl glass font-medium text-sm active:scale-95 transition">
            View History
          </button>
          <button onClick={() => nav('/recording')} className="py-3 rounded-xl bg-blue-600 text-white font-medium text-sm active:scale-95 transition">
            New Scan
          </button>
        </div>
      </div>
    </div>
  );
}
