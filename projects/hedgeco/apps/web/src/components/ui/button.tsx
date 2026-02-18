// Placeholder button component for Sprint 1 build
export function Button({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}