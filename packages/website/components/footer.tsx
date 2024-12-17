export default function Footer() {
  return (
    <div className="mt-auto border-t bg-black p-6 text-xs">
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2 text-neutral-100">
        <div className="flex gap-2">
          <div>© 2024 Million Software, Inc.</div>
        </div>
        <div>
          {' '}
          <a
            className="underline"
            href="https://github.com/aidenybai/react-scan"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
