import { useNavigate } from 'react-router-dom';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { HiMicrophone, HiDocumentText, HiChatBubbleLeftRight, HiUserGroup } from 'react-icons/hi2';

const quickActions = [
  { label: 'Reports', icon: HiDocumentText, to: '/reports', color: 'text-blue-500' },
  { label: 'AI Chat', icon: HiChatBubbleLeftRight, to: '/assistant', color: 'text-green-500' },
  { label: 'Doctor', icon: HiUserGroup, to: '/consultation', color: 'text-purple-500' },
];

export default function Dashboard() {
  const nav = useNavigate();

  return (
    <div>
      <GradientHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-xl font-bold">Good Morning</h1>
            <p className="text-white/70 text-sm">Your respiratory health looks good</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="text-center -mt-8 relative z-10 mx-2">
        <h2 className="text-lg font-semibold mb-4">Start Respiratory Analysis</h2>
        <div className="w-full h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mb-4">
          <div className="flex items-end gap-1 h-12">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-1.5 bg-blue-400 rounded-full"
                style={{ height: `${20 + Math.sin(i * 0.5 + Date.now() * 0.001) * 30 + 30}%`, opacity: 0.6 }} />
            ))}
          </div>
        </div>
        <button onClick={() => nav('/recording')}
          className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition active:scale-95">
          <HiMicrophone className="w-8 h-8" />
        </button>
        <p className="text-sm text-gray-500 mt-2">Tap to record your breath</p>
      </Card>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {quickActions.map(({ label, icon: Icon, to, color }) => (
          <button key={label} onClick={() => nav(to)}
            className="glass rounded-2xl p-4 flex flex-col items-center shadow-sm active:scale-95 transition">
            <Icon className={`w-7 h-7 ${color} mb-1`} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      <button onClick={() => nav('/sos')}
        className="mt-6 w-full py-4 rounded-2xl bg-red-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <span className="text-lg">🆘</span> Emergency SOS
      </button>
    </div>
  );
}
