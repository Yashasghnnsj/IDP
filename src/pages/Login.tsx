import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex flex-col justify-center p-6 bg-gradient-to-b from-blue-600 to-cyan-400">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
        <p className="text-gray-500 mb-8 text-sm">Sign in to continue</p>

        <input
          placeholder="Email / Phone"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 mb-4 outline-none focus:border-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 mb-6 outline-none focus:border-blue-500"
        />

        <button
          onClick={() => nav('/dashboard')}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
        >
          Login
        </button>

        <div className="flex justify-between mt-4 text-sm">
          <Link to="/register" className="text-blue-600">Create Account</Link>
          <button className="text-gray-500">Forgot Password?</button>
        </div>
      </motion.div>
    </div>
  );
}
