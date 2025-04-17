// This gets injected into the bundle
export function createInlineWorker(code: string) {
  const blob = new Blob([code], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}
