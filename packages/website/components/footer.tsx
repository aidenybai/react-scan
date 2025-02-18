export default function Footer() {
  return (
    <div className="flex-1 mt-auto border-t border-t-white/20 bg-black p-6 text-xs">
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-2 text-neutral-100">
        <div className="flex gap-2">
          <div>© {new Date().getFullYear()} Million Software, Inc.</div>
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
