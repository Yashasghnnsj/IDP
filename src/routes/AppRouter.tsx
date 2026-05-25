import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from '../components/layout/Shell';
import Splash from '../pages/Splash';
import Onboarding from '../pages/Onboarding';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Recording from '../pages/Recording';
import AIProcessing from '../pages/AIProcessing';
import Result from '../pages/Result';
import History from '../pages/History';
import Reports from '../pages/Reports';
import ChatAssistant from '../pages/ChatAssistant';
import EmergencySOS from '../pages/EmergencySOS';
import DoctorConsultation from '../pages/DoctorConsultation';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/splash" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Shell />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recording" element={<Recording />} />
          <Route path="/ai-processing" element={<AIProcessing />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assistant" element={<ChatAssistant />} />
          <Route path="/sos" element={<EmergencySOS />} />
          <Route path="/consultation" element={<DoctorConsultation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
