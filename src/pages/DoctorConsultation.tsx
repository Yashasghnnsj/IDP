import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { HiPhone, HiVideoCamera } from 'react-icons/hi2';

const doctors = [
  { name: 'Dr. Priya Sharma', spec: 'Pulmonologist', available: true },
  { name: 'Dr. Rajesh Kumar', spec: 'General Physician', available: true },
  { name: 'Dr. Ananya Patel', spec: 'Respiratory Specialist', available: false },
];

export default function DoctorConsultation() {
  return (
    <div>
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">Consult a Doctor</h1>
        <p className="text-white/70 text-sm">Connect with specialists</p>
      </GradientHeader>

      <div className="space-y-4 -mt-6 relative z-10">
        {doctors.map((doc) => (
          <Card key={doc.name}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{doc.name}</h3>
                <p className="text-xs text-gray-500">{doc.spec}</p>
                <span className={`text-xs font-medium ${doc.available ? 'text-green-600' : 'text-gray-400'}`}>
                  {doc.available ? 'Available now' : 'Offline'}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl bg-blue-100 text-blue-600 disabled:opacity-40" disabled={!doc.available}>
                  <HiPhone className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-xl bg-green-100 text-green-600 disabled:opacity-40" disabled={!doc.available}>
                  <HiVideoCamera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
