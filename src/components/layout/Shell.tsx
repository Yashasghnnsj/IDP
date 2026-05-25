import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineHome, HiOutlineMicrophone, HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineUser } from 'react-icons/hi2';

const tabs = [
  { path: '/dashboard', icon: HiOutlineHome, label: 'Home' },
  { path: '/recording', icon: HiOutlineMicrophone, label: 'Scan' },
  { path: '/reports', icon: HiOutlineDocumentText, label: 'Reports' },
  { path: '/assistant', icon: HiOutlineChatBubbleLeftRight, label: 'AI Chat' },
  { path: '/profile', icon: HiOutlineUser, label: 'Profile' },
];

export default function Shell() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 px-4 pt-6 pb-28 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <nav className="fixed bottom-4 left-4 right-4 glass-strong rounded-3xl shadow-lg flex justify-around items-center h-16 z-50 max-w-md mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
              location.pathname === path ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium mt-0.5">{label}</span>
            {location.pathname === path && (
              <motion.div layoutId="tab-indicator" className="absolute -top-1 w-8 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
