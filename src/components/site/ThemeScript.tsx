// Inline, runs before paint to avoid a dark-mode flash. Mirrors the
// localStorage convention used by the existing Pages-Router site.
export function ThemeScript() {
  const code = `
(function () {
  try {
    var stored = window.localStorage.isDarkMode;
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === undefined ? system : stored === 'true';
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
