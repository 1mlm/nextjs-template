import { useState } from "react";

// navigator.clipboard doesn't exist on http and old browsers, so fall back to
// the ancient execCommand trick (yes it still works lol). resolves false
// instead of throwing so callers only say "copied" when it really copied
export async function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);
  return didCopy;
}

// the copy -> "copied!" -> back to normal dance every copy button does
export function useCopyToClipboard(feedbackMs = 1000) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    const didCopy = await copyToClipboard(text);
    if (!didCopy) return false;
    setCopied(true);
    setTimeout(() => setCopied(false), feedbackMs);
    return true;
  };

  return { copied, copy };
}
