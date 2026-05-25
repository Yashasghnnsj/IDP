export default function EmergencySOS() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="text-8xl mb-6">🆘</div>
      <h1 className="text-2xl font-bold text-red-600 mb-2">Emergency SOS</h1>
      <p className="text-gray-500 text-center mb-8">Call emergency services or notify your contacts</p>

      <a href="tel:108" className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-lg text-center shadow-lg mb-4 active:scale-95 transition">
        📞 Call Emergency (108)
      </a>

      <a href="sms:+1234567890?body=I%20need%20emergency%20help" className="w-full py-4 rounded-2xl glass text-gray-800 font-semibold text-center active:scale-95 transition">
        💬 Send SOS Message
      </a>

      <p className="text-xs text-gray-400 mt-8 text-center">
        Your location will be shared with your emergency contacts
      </p>
    </div>
  );
}
