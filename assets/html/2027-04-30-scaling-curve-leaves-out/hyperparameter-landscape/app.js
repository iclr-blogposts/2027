/*
 * Rendering for the hyperparameter landscape figure. The math lives in core.js.
 * Markup comes from hyperparameter-landscape.html.
 * Add ?mode=talk to the page URL to show SMALL / MID / LARGE buttons for presenting.
 */
(() => {
  "use strict";

  const model = globalThis.HyperparameterLandscape;
  const { svgElement, svgText, tokens, uniqueId, onThemeChange, mountAll } = globalThis.Vis;

  // Plot frame in SVG units. The frame shows the slice from -1 to 1 on both axes.
  const FRAME = { x: 40, y: 10, size: 300 };
  const CENTER = { x: FRAME.x + FRAME.size / 2, y: FRAME.y + FRAME.size / 2 };
  const UNIT = FRAME.size / 2;
  const CONTOUR_LEVELS = [1.0, 0.6, 0.35];
  const DOT_COUNT = 40;
  const DOTS = randomPoints(DOT_COUNT, 7);
  const ROTATION_DEG = (-model.ANGLE * 180) / Math.PI; // SVG y points down
  const GLIDE_MS = 700;
  const talkMode = new URLSearchParams(location.search).get("mode") === "talk";

  // Seeded (Mulberry32) so the same configurations appear on every redraw.
  function randomPoints(count, seed) {
    let state = seed;
    const next = () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return Array.from({ length: count }, () => [next() * 1.9 - 0.95, next() * 1.9 - 0.95]);
  }

  function toScreen(a, b) {
    return { x: CENTER.x + a * UNIT, y: CENTER.y - b * UNIT };
  }

  // rough.js has no rotation option, so each ellipse sits in a rotated group.
  // A fixed seed keeps the hand-drawn wobble from flickering while the slider moves.
  function drawEllipse(parent, rc, level, scale, options) {
    const { radius1, radius2 } = model.contourGeometry(level, scale);
    const group = svgElement(parent, "g", { transform: `rotate(${ROTATION_DEG} ${CENTER.x} ${CENTER.y})` });
    group.append(rc.ellipse(CENTER.x, CENTER.y, radius1 * UNIT * 2, radius2 * UNIT * 2, options));
    return { radius1, radius2 };
  }

  // Handwritten label in the top-right corner with an arrow to a point inside the good region.
  function drawGoodRegionNote(svg, rc, longRadius, accent) {
    const longAxis = model.ANGLE + Math.PI / 2;
    const reach = Math.min(longRadius * 0.6, 0.35);
    const target = toScreen(Math.cos(longAxis) * reach, Math.sin(longAxis) * reach);
    const label = { x: FRAME.x + FRAME.size - 92, y: FRAME.y + 34 };
    svg.append(
      rc.curve(
        [
          [label.x + 10, label.y + 8],
          [label.x - 6, label.y + 40],
          [target.x + 6, target.y - 4],
        ],
        { stroke: accent, strokeWidth: 1.4, roughness: 0.8, seed: 5 }
      )
    );
    svgText(svg, "good region", { x: label.x, y: label.y, class: "vis-hand", fill: accent });
  }

  // Returns how many of the fixed configurations land in the good region.
  function drawPlot(svg, clipId, scale, color) {
    svg.replaceChildren();
    const rc = rough.svg(svg);
    const ink = color("--vis-ink");
    const soft = color("--vis-soft");
    const accent = color("--vis-accent");

    const clip = svgElement(svgElement(svg, "defs"), "clipPath", { id: clipId });
    svgElement(clip, "rect", { x: FRAME.x, y: FRAME.y, width: FRAME.size, height: FRAME.size });
    const inside = svgElement(svg, "g", { "clip-path": `url(#${clipId})` });

    CONTOUR_LEVELS.forEach((level, i) => {
      drawEllipse(inside, rc, level, scale, { stroke: soft, strokeWidth: 1, seed: 11 + i });
    });
    const good = drawEllipse(inside, rc, model.EPSILON, scale, {
      stroke: accent,
      strokeWidth: 2,
      seed: 3,
      fill: accent,
      fillStyle: "hachure",
      hachureGap: 6,
      fillWeight: 0.8,
    });

    let hits = 0;
    for (const [a, b] of DOTS) {
      const landed = model.evaluateSlice(a, b, scale) <= model.EPSILON;
      if (landed) hits++;
      const { x, y } = toScreen(a, b);
      svgElement(inside, "circle", {
        cx: x,
        cy: y,
        r: landed ? 4.2 : 3,
        fill: landed ? accent : "none",
        stroke: landed ? accent : soft,
        "stroke-width": 1.3,
      });
    }

    svgElement(inside, "circle", { cx: CENTER.x, cy: CENTER.y, r: 3, fill: ink });
    svg.append(rc.rectangle(FRAME.x, FRAME.y, FRAME.size, FRAME.size, { stroke: ink, strokeWidth: 1.4, roughness: 0.8, seed: 21 }));
    drawGoodRegionNote(svg, rc, good.radius2, accent);

    svgText(svg, "HP COMBINATION A", {
      x: CENTER.x,
      y: FRAME.y + FRAME.size + 24,
      "text-anchor": "middle",
      fill: soft,
      "font-size": 10,
    });
    svgText(svg, "HP COMBINATION B", {
      x: FRAME.x - 14,
      y: CENTER.y,
      "text-anchor": "middle",
      fill: soft,
      "font-size": 10,
      transform: `rotate(-90 ${FRAME.x - 14} ${CENTER.y})`,
    });
    return hits;
  }

  // For each direction: how far you can move from the optimum and stay in the good region.
  // Lengths share one scale, normalized to the widest possible (a softened direction at LARGE).
  function drawRoom(svg, scale, color) {
    svg.replaceChildren();
    const rc = rough.svg(svg);
    const ink = color("--vis-ink");
    const soft = color("--vis-soft");
    const accent = color("--vis-accent");
    const { sensitivities } = model.landscape(scale);
    const widest = Math.sqrt(model.EPSILON / model.landscape(1).sensitivities[1]);
    const left = 34;
    const maxWidth = 210;

    svgText(svg, "HOW FAR CAN YOU MOVE?", { x: 0, y: 10, fill: soft, "font-size": 10 });
    sensitivities.forEach((sensitivity, i) => {
      const y = 36 + i * 26;
      const width = Math.max((Math.sqrt(model.EPSILON / sensitivity) / widest) * maxWidth, 6);
      const x0 = left + (maxWidth - width) / 2;
      const x1 = x0 + width;
      const stroke = i === 0 ? accent : ink;
      svgText(svg, `d${i + 1}`, { x: 0, y: y + 4, fill: ink, "font-size": 11 });
      svg.append(rc.line(x0, y, x1, y, { stroke, strokeWidth: 2, roughness: 0.9, seed: 40 + i }));
      svg.append(rc.line(x0, y - 5, x0, y + 5, { stroke, strokeWidth: 1.2, roughness: 0.5, seed: 50 + i }));
      svg.append(rc.line(x1, y - 5, x1, y + 5, { stroke, strokeWidth: 1.2, roughness: 0.5, seed: 60 + i }));
    });
  }

  function mount(root) {
    const plotSvg = root.querySelector(".vis-hp-plot");
    const roomSvg = root.querySelector(".vis-hp-room");
    const slider = root.querySelector(".vis-hp-scale");
    const hitCount = root.querySelector(".vis-hp-hit-count");
    const stepRow = root.querySelector(".vis-hp-steps");
    const stepButtons = stepRow.querySelectorAll("button");
    const color = tokens(root);
    const clipId = uniqueId("vis-hp-clip");

    function render() {
      const scale = Number(slider.value);
      hitCount.textContent = drawPlot(plotSvg, clipId, scale, color);
      drawRoom(roomSvg, scale, color);
      stepButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(Number(button.dataset.scale) === scale));
      });
    }

    // Step buttons glide the slider to the target so the audience sees the change happen.
    function glideTo(target) {
      const start = Number(slider.value);
      const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : GLIDE_MS;
      const startTime = performance.now();
      function frame(now) {
        const progress = duration ? Math.min((now - startTime) / duration, 1) : 1;
        const eased = progress * progress * (3 - 2 * progress);
        slider.value = progress === 1 ? target : start + (target - start) * eased;
        render();
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    root.querySelector(".vis-hp-dot-total").textContent = DOT_COUNT;
    stepRow.hidden = !talkMode;
    stepButtons.forEach((button) => button.addEventListener("click", () => glideTo(Number(button.dataset.scale))));
    slider.addEventListener("input", render);
    onThemeChange(render);
    render();
  }

  mountAll("hyperparameter-landscape", mount);
})();
