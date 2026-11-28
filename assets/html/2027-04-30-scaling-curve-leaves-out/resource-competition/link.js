/*
 * Lets the post turn on interference from elsewhere in the text without any script in the post.
 * The post's "+ INTERFERENCE" link targets this figure's <iframe> by name and points at
 * resource-competition.html#interference. Following it navigates only the iframe's fragment,
 * so the figure keeps its state; this script then switches interference on and scrolls the
 * figure into view in the post.
 */
(() => {
  "use strict";

  const HASH = "#interference";

  function followLink() {
    if (location.hash !== HASH) return;
    // Clear the fragment so the next click on the same link fires hashchange again.
    history.replaceState(null, "", location.pathname + location.search);

    const button = document.querySelector(".vis-rc-interference");
    if (button && button.getAttribute("aria-pressed") !== "true") button.click();

    let frame = null;
    try {
      frame = window.frameElement;
    } catch {
      // Cross-origin embedding: nothing to scroll.
    }
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    (frame || document.documentElement).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  window.addEventListener("hashchange", followLink);
  followLink();
})();
