/*
 * Drawing only. core.js owns every learning decision.
 * Style rule: outlines are crisp SVG lines; the crayon texture is used for fills only;
 * rough.js is used only for the handwritten annotation arrows.
 */
(function (root) {
  "use strict";

  const core = root.ResourceCompetition;
  const { svgElement, svgText } = root.Vis;
  const SLOT = 38;
  const GAP = 6;
  const COLUMNS = 7;
  const PIP = 16;
  const MAX_FEATURES = 8;
  const ROW_HEIGHT = 30;
  const NARROW_BELOW_PX = 520;
  const BULB_GLASS =
    "M24 6C15 6 10 13 10 19.5C10 25 13 28 16 31C17.5 32.5 18 34 18 36L30 36C30 34 30.5 32.5 32 31C35 28 38 25 38 19.5C38 13 33 6 24 6Z";

  // Wide: models side by side. Narrow (phones): models stacked so text stays readable.
  const LAYOUTS = {
    wide: {
      width: 700,
      height: 396,
      incomingRight: 368,
      fork: {
        from: [350, 70],
        to: [
          [150, 120],
          [530, 120],
        ],
      },
      forkNote: [400, 44],
      models: [
        [0, 140],
        [380, 140],
      ],
    },
    narrow: {
      width: 360,
      height: 680,
      incomingRight: 360,
      fork: { from: [343, 64], to: [[250, 120]] },
      forkNote: [14, 106],
      models: [
        [0, 140],
        [0, 420],
      ],
    },
  };

  // The same grain and wobble as the post's Takeaway bulb.
  function createCrayonFilter(parent, id) {
    const defs = svgElement(parent, "svg", { class: "vis-defs", "aria-hidden": "true" });
    const filter = svgElement(defs, "filter", { id, x: "-20%", y: "-20%", width: "140%", height: "140%" });
    svgElement(filter, "feTurbulence", { type: "fractalNoise", baseFrequency: 1.3, numOctaves: 3, seed: 4, result: "grainNoise" });
    svgElement(filter, "feColorMatrix", {
      in: "grainNoise",
      type: "matrix",
      values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.45",
      result: "grain",
    });
    svgElement(filter, "feComposite", { in: "SourceGraphic", in2: "grain", operator: "in", result: "textured" });
    svgElement(filter, "feTurbulence", { type: "fractalNoise", baseFrequency: 0.05, numOctaves: 2, seed: 9, result: "wobble" });
    svgElement(filter, "feDisplacementMap", { in: "textured", in2: "wobble", scale: 2, xChannelSelector: "R", yChannelSelector: "G" });
    return `url(#${id})`;
  }

  // How often a topic shows up, in words.
  function frequencyTag(frequency) {
    if (frequency >= 0.5) return "COMMON";
    if (frequency >= 0.15) return "SOMETIMES";
    return "RARE";
  }

  function renderTopics(container, topics, catalog, crayon) {
    container.replaceChildren(
      ...catalog.tasks.map((task, i) => {
        const item = document.createElement("div");
        item.className = "vis-rc-topic";
        const swatch = document.createElement("i");
        swatch.style.background = `var(${topics[i].color})`;
        swatch.style.filter = crayon;
        const name = document.createElement("b");
        name.textContent = topics[i].name;
        const tag = document.createElement("span");
        tag.textContent = frequencyTag(task.frequency);
        item.append(swatch, name, tag);
        return item;
      })
    );
  }

  function crayonBlock(ctx, x, y, width, height, fill) {
    svgElement(ctx.svg, "rect", { x, y, width, height, fill, filter: ctx.crayon });
  }

  function frame(ctx, x, y, width, height, stroke, strokeWidth = 1.2) {
    svgElement(ctx.svg, "rect", { x, y, width, height, fill: "none", stroke, "stroke-width": strokeWidth });
  }

  function drawIncoming(ctx, rc, layout, recent) {
    const { svg, color, colorOf } = ctx;
    svgText(svg, "INCOMING", { x: 0, y: 12, fill: color("--vis-soft"), "font-size": 10 });
    recent.forEach((featureId, i) => {
      const newest = i === recent.length - 1;
      const size = newest ? 34 : 20;
      const x = layout.incomingRight - size - (recent.length - 1 - i) * 26 - (newest ? 0 : 14);
      crayonBlock(ctx, x, newest ? 22 : 29, size, size, colorOf(featureId));
    });
    const [fx, fy] = layout.fork.from;
    layout.fork.to.forEach(([tx, ty], i) => {
      svg.append(
        rc.curve(
          [
            [fx, fy],
            [(fx + tx) / 2, fy + (ty - fy) * 0.35],
            [tx, ty],
          ],
          { stroke: color("--vis-ink"), strokeWidth: 1.3, roughness: 0.8, seed: 2 + i }
        )
      );
    });
    svgText(svg, "same signal, both models", { x: layout.forkNote[0], y: layout.forkNote[1], class: "vis-hand", fill: color("--vis-soft") });
  }

  // Each slot is one unit of capacity. Colored width is the strength a feature keeps there.
  function drawSlots(ctx, model, [x0, y0]) {
    model.slots.forEach((slot, i) => {
      const x = x0 + (i % COLUMNS) * (SLOT + GAP);
      const y = y0 + 12 + Math.floor(i / COLUMNS) * (SLOT + GAP);
      let offset = 0;
      for (const part of slot.parts) {
        crayonBlock(ctx, x + offset, y, SLOT * part.strength, SLOT, ctx.colorOf(part.featureId));
        offset += SLOT * part.strength;
      }
      const justChanged = model.last && model.last.slot === i;
      frame(ctx, x, y, SLOT, SLOT, ctx.color(justChanged ? "--vis-accent" : "--vis-ink"), justChanged ? 2.4 : 1.2);
    });
  }

  function keepsTop(y0) {
    return y0 + 12 + 2 * (SLOT + GAP) + 22;
  }

  // The blog's idea bulb, scaled down. It glows in proportion to how much of the topic is kept,
  // and gets rays once the whole topic is kept.
  function drawBulb(ctx, x, y, coverage) {
    const paper = ctx.color("--vis-paper");
    const ink = ctx.color("--vis-ink");
    const complete = coverage > 0.999;
    const group = svgElement(ctx.svg, "g", { transform: `translate(${x} ${y}) scale(0.62)` });
    svgElement(group, "path", { d: BULB_GLASS, fill: paper });
    if (coverage > 0) {
      svgElement(group, "path", { d: BULB_GLASS, fill: "#ffe27a", opacity: complete ? 1 : 0.15 + coverage * 0.4, filter: ctx.crayon });
    }
    if (complete) {
      svgElement(group, "path", {
        d: "M24 -5L24 0.5M7 1.5L10.8 5.6M41 1.5L37.2 5.6",
        stroke: "#f2a900",
        "stroke-width": 2.6,
        "stroke-linecap": "round",
        filter: ctx.crayon,
      });
    }
    svgElement(group, "path", { d: BULB_GLASS, fill: "none", stroke: ink, "stroke-width": 2.2, "stroke-linejoin": "round" });
    svgElement(group, "path", { d: "M20 27L22 21L24 27L26 21L28 27", fill: "none", stroke: ink, "stroke-width": 1.7 });
    svgElement(group, "rect", { x: 18, y: 37.5, width: 12, height: 3.5, rx: 1, fill: paper, stroke: ink, "stroke-width": 1.7 });
  }

  // One row per topic, one square per feature: filled = kept, crossed = seen but dropped, dashed = not seen yet.
  function drawKeeps(ctx, model, catalog, [x0, y0]) {
    const { svg, color, colorOf } = ctx;
    const result = core.metrics(model, catalog);
    const top = keepsTop(y0);
    svgText(svg, "WHAT IT KEEPS", { x: x0, y: top, fill: color("--vis-soft"), "font-size": 10 });
    catalog.tasks.forEach((task, row) => {
      const y = top + 14 + row * ROW_HEIGHT;
      const fill = colorOf(`${task.id}:1`);
      catalog.features
        .filter((feature) => feature.taskId === task.id)
        .forEach((feature, i) => {
          const x = x0 + i * (PIP + 6);
          const strength = result.strengths[feature.id];
          if (strength > 0) {
            svgElement(svg, "rect", { x, y, width: PIP * strength, height: PIP, fill });
            frame(ctx, x, y, PIP, PIP, fill, 1);
          } else if (model.seen.has(feature.id)) {
            frame(ctx, x, y, PIP, PIP, fill, 1);
            svgElement(svg, "path", {
              d: `M${x + 3} ${y + 3}L${x + PIP - 3} ${y + PIP - 3}M${x + PIP - 3} ${y + 3}L${x + 3} ${y + PIP - 3}`,
              stroke: fill,
              "stroke-width": 1.2,
            });
          } else {
            svgElement(svg, "rect", { x, y, width: PIP, height: PIP, fill: "none", stroke: color("--vis-line"), "stroke-dasharray": "2 2" });
          }
        });
      drawBulb(ctx, x0 + MAX_FEATURES * (PIP + 6) + 6, y - 9, result.tasks[row].coverage);
    });
    return result;
  }

  // Handwritten callout for the headline moment: the small model has seen the rare topic but kept none of it.
  // With interference on, anything seen keeps at least a sliver, so the callout naturally stays hidden.
  function drawRareNote(ctx, catalog, small, [x0, y0]) {
    const rarest = catalog.tasks.reduce((low, task) => (task.frequency < low.frequency ? task : low));
    const row = catalog.tasks.indexOf(rarest);
    const seen = small.unretained.some((feature) => feature.taskId === rarest.id);
    if (frequencyTag(rarest.frequency) !== "RARE" || !seen || small.tasks[row].coverage > 0) return;
    const y = keepsTop(y0) + 14 + catalog.tasks.length * ROW_HEIGHT + 10;
    svgText(ctx.svg, "rare topic never stays", { x: x0 + 40, y, class: "vis-hand", fill: ctx.color("--vis-accent") });
  }

  // ctx: { svg, color, crayon, colorOf }
  function render(ctx, simulation, recent) {
    const { svg } = ctx;
    const layout = svg.clientWidth < NARROW_BELOW_PX ? LAYOUTS.narrow : LAYOUTS.wide;
    svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    svg.replaceChildren();
    const rc = rough.svg(svg);
    drawIncoming(ctx, rc, layout, recent);

    const results = simulation.models.map((model, index) => {
      const origin = layout.models[index];
      const name = index === 0 ? "SMALL" : "LARGE";
      svgText(svg, `${name} · ${model.slots.length} SLOTS`, {
        x: origin[0],
        y: origin[1],
        fill: ctx.color("--vis-ink"),
        "font-size": 11,
        "font-weight": 600,
      });
      drawSlots(ctx, model, origin);
      return drawKeeps(ctx, model, simulation.catalog, origin);
    });

    drawRareNote(ctx, simulation.catalog, results[0], layout.models[0]);
  }

  root.ResourceView = Object.freeze({ render, renderTopics, createCrayonFilter });
})(globalThis);
