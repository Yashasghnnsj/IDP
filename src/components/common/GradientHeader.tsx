export function GradientHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-violet-600 pt-12 pb-16 px-5 rounded-b-[40px]">
      {children}
    </div>
  );
}
