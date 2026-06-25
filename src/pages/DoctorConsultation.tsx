import { useState, useEffect } from 'react';
import { GradientHeader } from '../components/common/GradientHeader';
import { Card } from '../components/common/Card';
import { HiPhone, HiVideoCamera } from 'react-icons/hi2';

const doctors = [
  { name: 'Dr. Priya Sharma', spec: 'Pulmonologist', available: true },
  { name: 'Dr. Rajesh Kumar', spec: 'General Physician', available: true },
  { name: 'Dr. Ananya Patel', spec: 'Respiratory Specialist', available: false },
];

export default function DoctorConsultation() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<string>('Locating nearby facilities...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const query = `[out:json];node["amenity"~"hospital|clinic"](around:5000,${latitude},${longitude});out 5;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            const fetchedHospitals = data.elements
              .filter((el: any) => el.tags && el.tags.name)
              .map((el: any) => ({
                id: el.id,
                name: el.tags.name,
                distance: getDistanceFromLatLonInKm(latitude, longitude, el.lat, el.lon).toFixed(1) + ' km away',
              }));
            
            setHospitals(fetchedHospitals);
            setLocationStatus(fetchedHospitals.length > 0 ? 'Nearby Hospitals & Clinics' : 'No hospitals found nearby.');
            setLoading(false);
          } catch (err) {
            setLocationStatus('Could not fetch nearby hospitals.');
            setLoading(false);
          }
        },
        (err) => {
          setLocationStatus('Location access denied. Online doctors only.');
          setLoading(false);
        }
      );
    } else {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2-lat1) * (Math.PI/180);
    const dLon = (lon2-lon1) * (Math.PI/180); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  return (
    <div>
      <GradientHeader>
        <h1 className="text-white text-xl font-bold">Consult & Care</h1>
        <p className="text-white/70 text-sm">Connect with specialists & facilities</p>
      </GradientHeader>

      <div className="space-y-4 -mt-6 relative z-10">
        <h2 className="text-sm font-bold text-gray-700 px-1 mt-4">{locationStatus}</h2>
        {loading && <p className="text-sm text-gray-500 px-1">Loading...</p>}
        {hospitals.map((hosp) => (
          <Card key={hosp.id}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{hosp.name}</h3>
                <p className="text-xs text-blue-600 font-medium">{hosp.distance}</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
                Directions
              </button>
            </div>
          </Card>
        ))}

        <h2 className="text-sm font-bold text-gray-700 px-1 mt-6">Online Specialists</h2>
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
