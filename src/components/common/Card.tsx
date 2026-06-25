export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`p-5 rounded-2xl bg-white/70 backdrop-blur-lg shadow-lg border border-white/20 ${className}`}>
      {children}
    </div>
  );
}
