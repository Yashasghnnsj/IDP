import { useNavigate } from 'react-router-dom';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { useHealthStore } from '../store/healthStore';

const riskColors = { Low: 'text-green-600 bg-green-100', Moderate: 'text-yellow-600 bg-yellow-100', High: 'text-red-600 bg-red-100' };

export default function History() {
  const nav = useNavigate();
  const history = useHealthStore((s) => s.history);

  const mockHistory = history.length > 0 ? history : [
    { id: '1', date: new Date().toISOString(), disease: 'Healthy', confidence: 92, risk: 'Low' as const },
    { id: '2', date: new Date(Date.now() - 86400000).toISOString(), disease: 'Healthy', confidence: 88, risk: 'Low' as const },
  ];

  return (
    <div>
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">Scan History</h1>
        <p className="text-white/70 text-sm">Your previous respiratory analyses</p>
      </GradientHeader>

      <div className="space-y-4 -mt-6 relative z-10">
        {mockHistory.map((scan) => (
          <Card key={scan.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{scan.disease}</h3>
              <p className="text-xs text-gray-400">{new Date(scan.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">{Math.round(scan.confidence)}%</span>
              <p className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskColors[scan.risk]}`}>{scan.risk}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
