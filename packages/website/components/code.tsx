export default function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={`rounded-md bg-neutral-100 p-1 text-sm ${className}`}>
      {children}
    </code>
  );
}
