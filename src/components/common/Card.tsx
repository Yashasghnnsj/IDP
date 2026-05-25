export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 rounded-2xl bg-white/70 backdrop-blur-lg shadow-lg border border-white/20 ${className}`}>
      {children}
    </div>
  );
}
