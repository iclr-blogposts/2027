/*
 * Helpers shared by the interactive figures on this site.
 * Each figure reads its colors from CSS tokens on its own root element
 * (vis/vis.css), so it follows the light/dark theme (see vis/embed.js).
 */
(function (root) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  let idCounter = 0;

  function svgElement(parent, name, attributes = {}) {
    const element = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    parent.append(element);
    return element;
  }

  function svgText(parent, content, attributes) {
    svgElement(parent, "text", attributes).textContent = content;
  }

  // Returns a reader for the CSS custom properties defined on `element`.
  function tokens(element) {
    return (name) => getComputedStyle(element).getPropertyValue(name).trim();
  }

  // SVG ids are page-global, so every figure instance asks for its own.
  function uniqueId(prefix) {
    idCounter++;
    return `${prefix}-${idCounter}`;
  }

  // vis/embed.js mirrors the post's theme onto this page's <html data-theme>.
  function onThemeChange(callback) {
    new MutationObserver(callback).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function mountAll(name, mount) {
    document.querySelectorAll(`[data-vis="${name}"]`).forEach(mount);
  }

  root.Vis = Object.freeze({ svgElement, svgText, tokens, uniqueId, onThemeChange, mountAll });
})(globalThis);
