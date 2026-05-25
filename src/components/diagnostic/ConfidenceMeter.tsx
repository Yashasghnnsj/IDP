export function ConfidenceMeter({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="bold" fill={color}>
          {Math.round(value)}%
        </text>
      </svg>
      <span className="text-sm text-gray-600 mt-1">{label}</span>
    </div>
  );
}
