export const THEME_STORAGE_KEY = "theme-preference";

const SET_THEME_BEFORE_PAINT = `try{var theme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(theme==="light"||theme==="dark")document.documentElement.dataset.theme=theme}catch(e){}`;

// has to run before first paint or a reload flashes the wrong theme, see
// the "preventing flash before hydration" guide in next's docs. the type
// flips to text/plain on the client so react doesn't warn about a script it
// rendered, the browser already ran it from the server html
export function ThemeInlineScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      // biome-ignore lint/security/noDangerouslySetInnerHtml: constant string, nothing user supplied
      dangerouslySetInnerHTML={{ __html: SET_THEME_BEFORE_PAINT }}
    />
  );
}
