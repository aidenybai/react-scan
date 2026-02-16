export default function Footer() {
  return (
    <div className="border-t border-white/10 px-6 py-4 text-xs text-white/40">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <div>&copy; {new Date().getFullYear()} Million Software, Inc.</div>
        <a
          className="hover:text-white/70 transition-colors"
          href="https://github.com/aidenybai/react-scan"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
