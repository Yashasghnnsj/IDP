import { useNavigate } from 'react-router-dom';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { HiChartBar, HiCog6Tooth, HiShieldCheck, HiInformationCircle } from 'react-icons/hi2';

const menuItems = [
  { label: 'Health Statistics', icon: HiChartBar, to: '/history' },
  { label: 'Settings', icon: HiCog6Tooth, to: '/settings' },
  { label: 'Privacy & Security', icon: HiShieldCheck },
  { label: 'About AcuSound', icon: HiInformationCircle },
];

export default function Profile() {
  const nav = useNavigate();

  return (
    <div>
      <GradientHeader>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold">Y</div>
          <div>
            <h1 className="text-white text-xl font-bold">Yashas</h1>
            <p className="text-white/70 text-sm">yashas@example.com</p>
          </div>
        </div>
      </GradientHeader>

      <div className="space-y-2 -mt-6 relative z-10">
        {menuItems.map(({ label, icon: Icon, to }) => (
          <button key={label} onClick={() => to && nav(to)}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition">
            <Icon className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-sm">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
