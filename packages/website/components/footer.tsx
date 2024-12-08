export default function Footer() {
  return (
    <div className="mt-auto p-6 text-xs border-t bg-black">
      <div className="max-w-xl mx-auto w-full text-neutral-100 justify-between flex items-center gap-2 flex-wrap">
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
