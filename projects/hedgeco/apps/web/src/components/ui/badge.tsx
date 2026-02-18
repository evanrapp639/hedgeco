// Placeholder badge component for Sprint 1 build
export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 ${className}`}>{children}</span>;
}