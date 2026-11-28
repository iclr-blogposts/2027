/*
 * Glue between an interactive figure page and the blog post that embeds it in an <iframe>.
 * Load it before shared.js and the figure scripts, so the first render already uses the post's theme.
 *
 * - Theme: mirrors the post's <html data-theme> (al-folio's light/dark toggle) onto this page,
 *   and paints with the post's background color. shared.js's onThemeChange watches this page's
 *   own data-theme, so the figures redraw without any change to their code.
 * - Height: resizes the <iframe> to fit the figure, so nothing is cut off or padded at any width.
 *
 * Opened on its own (no embedding post), the page keeps the light defaults from vis.css.
 */
(() => {
  "use strict";

  let frame = null;
  let host = null;
  try {
    frame = window.frameElement;
    host = frame && parent.document.documentElement;
  } catch {
    // Cross-origin embedding: keep the defaults.
  }
  if (!frame || !host) return;

  const page = document.documentElement;

  function syncTheme() {
    // Set the paper color before data-theme, because changing data-theme triggers the redraw.
    const background = getComputedStyle(host).getPropertyValue("--global-bg-color").trim();
    if (background) page.style.setProperty("--theme", background);
    page.setAttribute("data-theme", host.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }

  function fitHeight() {
    frame.style.height = `${Math.ceil(page.getBoundingClientRect().height)}px`;
  }

  syncTheme();
  new MutationObserver(syncTheme).observe(host, { attributes: true, attributeFilter: ["data-theme"] });
  new ResizeObserver(fitHeight).observe(page);
})();
