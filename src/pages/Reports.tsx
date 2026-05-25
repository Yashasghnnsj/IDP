import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { useHealthStore } from '../store/healthStore';
import { HiDocumentArrowDown } from 'react-icons/hi2';

export default function Reports() {
  const history = useHealthStore((s) => s.history);
  const latest = history[0];

  return (
    <div>
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">Reports</h1>
        <p className="text-white/70 text-sm">Download or share your diagnosis reports</p>
      </GradientHeader>

      <div className="space-y-4 -mt-6 relative z-10">
        <Card>
          <h3 className="font-semibold mb-1">Latest Report</h3>
          {latest ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">{latest.disease} — {Math.round(latest.confidence)}% confidence</p>
                <p className="text-xs text-gray-400">{new Date(latest.date).toLocaleDateString()}</p>
              </div>
              <button className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <HiDocumentArrowDown className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No reports yet. Complete a scan first.</p>
          )}
        </Card>

        <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium text-sm active:scale-95 transition">
          Download All Reports (PDF)
        </button>
      </div>
    </div>
  );
}
