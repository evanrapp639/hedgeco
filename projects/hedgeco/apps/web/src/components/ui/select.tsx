// Placeholder select component for Sprint 1 build
export function Select({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`border rounded p-2 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border rounded p-2 ${className}`}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="border rounded mt-1 bg-white">{children}</div>;
}

export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return <div className="p-2 hover:bg-gray-100 cursor-pointer">{children}</div>;
}