// localStorage throws in safari private mode, when a browser blocks site data,
// and on the server where window doesn't exist. the try/catch eats all three
export const safeLocalStorage = {
  getItem(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};
