// navigator.clipboard is undefined on non-HTTPS origins and older browsers —
// fall back to the old execCommand trick instead of silently doing nothing
export function copyToClipboard(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
