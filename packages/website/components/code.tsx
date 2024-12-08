export default function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={`bg-neutral-100 p-1 rounded-md text-sm ${className}`}>
      {children}
    </code>
  );
}
