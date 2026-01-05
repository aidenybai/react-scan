/**
 * Copies text to clipboard with fallback for HTTP / IP LAN environments
 * where navigator.clipboard is not available.
 */
export function copyText(text: string): Promise<void> | void {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for HTTP / IP LAN
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();

  document.execCommand("copy");
  document.body.removeChild(ta);
}
