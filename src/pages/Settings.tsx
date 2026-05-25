import { useState } from 'react';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div>
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">Settings</h1>
        <p className="text-white/70 text-sm">Configure your preferences</p>
      </GradientHeader>

      <div className="space-y-4 -mt-6 relative z-10">
        <Card>
          <h3 className="font-semibold mb-4">Preferences</h3>
          {[
            { label: 'Push Notifications', value: notifications, set: setNotifications },
            { label: 'Dark Mode', value: darkMode, set: setDarkMode },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex justify-between items-center py-2">
              <span className="text-sm">{label}</span>
              <button
                onClick={() => set(!value)}
                className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Account</h3>
          <button className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium text-sm active:scale-95 transition">
            Delete Account
          </button>
        </Card>

        <p className="text-center text-xs text-gray-400">AcuSound v1.0.0</p>
      </div>
    </div>
  );
}
