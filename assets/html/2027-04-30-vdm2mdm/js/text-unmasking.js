let plotlyReady;

function initializeTextDiffusion(root) {
  const revealedOnly = root.dataset.countMode === "revealed";
  const data = JSON.parse(root.querySelector(".story-data").textContent);
  const chart = root.querySelector(".unmasking-chart");
  const slider = root.querySelector('input[type="range"]');
  const body = root.querySelector(".sequence-text");
  const status = root.querySelector(".load-status");
  const retry = root.querySelector(".retry");
  const schedules = [
    { id: "loglinear", label: "Log-linear", color: "#e69f00" },
    { id: "cosine", label: "Cosine", color: "#a855f7" },
    { id: "duo_cosine", label: "Cosine (DUO)", color: "#0f9e9e" },
  ];
  const steps = data.sampling_steps;
  const times = data.times.slice().reverse();
  const stories = data.examples;
  let storyIndex = 0;
  let scheduleID = schedules[0].id;
  let step = Number(slider.value);
  let words = [];
  let overlay;
  let paintFrame;
  let buildRevision = 0;
  let buildQueue = Promise.resolve();
  let building = false;
  let observersReady = false;

  function addOptions(kind, options) {
    const container = root.querySelector(`.${kind}-options`);
    options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `${root.id}-${kind}`;
      input.value = option.id;
      input.checked = index === 0;
      input.setAttribute("aria-label", option.description || option.label);
      const text = document.createElement("span");
      text.className = "option-label";
      if (option.color) {
        const dot = document.createElement("i");
        dot.className = "schedule-dot";
        dot.style.setProperty("--schedule-color", option.color);
        dot.setAttribute("aria-hidden", "true");
        text.append(dot);
      }
      text.append(option.label);
      label.append(input, text);
      container.append(label);
    });
  }

  function drawStory() {
    const story = stories[storyIndex];
    const trajectory = story.trajectories[scheduleID];
    const fragment = document.createDocumentFragment();
    words = trajectory.words.map((word, index) => {
      const span = document.createElement("span");
      span.className = "story-word is-masked";
      span.dataset.word = String(index);
      const text = document.createElement("span");
      text.className = "word-text";
      const prefix = document.createElement("span");
      prefix.className = "prefix-highlight";
      prefix.title = "Sentence starter";
      const pieces = word.pieces.map((piece) => {
        const element = document.createElement("span");
        element.className = "word-piece";
        element.textContent = piece.text;
        element.dataset.step = String(piece.step);
        if (piece.tokens.every((token) => token < trajectory.prefix_token_count)) prefix.append(element);
        else text.append(element);
        return { element, reveal: piece.step };
      });
      if (prefix.hasChildNodes()) text.prepend(prefix);
      span.append(text);
      fragment.append(document.createTextNode(word.before), span);
      return { element: span, pieces };
    });
    fragment.append(document.createTextNode(trajectory.trailing));
    body.replaceChildren(fragment);
    body.scrollTop = 0;
    body.setAttribute("aria-label", `Sentence starter ${storyIndex + 1}: ${story.starter} Generated continuation`);
  }

  function theme() {
    const style = getComputedStyle(root);
    return {
      text: style.getPropertyValue("--global-text-color").trim() || "#17181a",
      grid: style.getPropertyValue("--global-divider-color").trim() || "#d1d5db",
      background: style.getPropertyValue("--global-bg-color").trim() || "#fff",
      font: style.fontFamily,
    };
  }

  function svgNode(name, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function buildOverlay(style, maxCount) {
    const layer = root.querySelector(".unmasking-overlay");
    const size = chart._fullLayout._size;
    layer.setAttribute("viewBox", `0 0 ${chart.layout.width} ${chart.layout.height}`);
    const group = svgNode("g", { transform: `translate(${size.l},${size.t})` });
    const future = svgNode("rect", { class: "unmasking-future", x: 0, y: 0, width: 0, height: size.h, fill: style.background, opacity: 0.4 });
    const line = svgNode("line", { y1: 0, y2: size.h, stroke: style.text, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.4 });
    const dots = schedules.map((schedule) => svgNode("circle", {
      r: schedule.id === scheduleID ? 4 : 2.5, fill: schedule.color,
      stroke: style.background, "stroke-width": 1, opacity: schedule.id === scheduleID ? 1 : 0.5,
    }));
    group.append(future, line, ...dots);
    layer.replaceChildren(group);
    overlay = { size, future, line, dots, maxCount };
  }

  function plottedCount(trajectory, index) {
    return trajectory.counts[index] - (revealedOnly ? trajectory.prefix_token_count : 0);
  }

  function paint() {
    const story = stories[storyIndex];
    const trajectory = story.trajectories[scheduleID];
    const count = plottedCount(trajectory, step);
    // Keep the latest revealed batch highlighted until the next tokens arrive.
    const latest = trajectory.token_reveal_steps.reduce((last, reveal) => reveal > 0 && reveal <= step ? Math.max(last, reveal) : last, -1);
    words.forEach((word) => {
      word.pieces.forEach((piece) => { piece.element.classList.toggle("is-masked", piece.reveal > step); });
      word.element.classList.toggle("is-masked", word.pieces.some((piece) => piece.reveal > step));
      word.element.classList.toggle("is-new", latest > 0 && word.pieces.some((piece) => piece.reveal === latest));
      if (word.pieces.some((piece) => piece.reveal <= step)) {
        word.element.removeAttribute("role");
        word.element.removeAttribute("aria-label");
      } else {
        word.element.setAttribute("role", "img");
        word.element.setAttribute("aria-label", "Masked word");
      }
    });
    const time = data.times[step];
    root.querySelector(".time-value").textContent = `t = ${time.toFixed(3)}`;
    slider.setAttribute("aria-valuetext", `${Math.round(step / steps * 100)} percent sampled, t = ${time.toFixed(3)}, ${count} tokens ${revealedOnly ? "revealed" : "unmasked"}`);
    root.dataset.model = "ddit";
    root.dataset.example = String(storyIndex);
    root.dataset.schedule = scheduleID;
    root.dataset.step = String(step);
    root.dataset.time = String(time);
    root.dataset.unmasked = String(count);
    if (overlay && !building) {
      const x = time * overlay.size.w;
      overlay.future.setAttribute("width", x);
      overlay.line.setAttribute("x1", x);
      overlay.line.setAttribute("x2", x);
      schedules.forEach((schedule, index) => {
        const actual = plottedCount(story.trajectories[schedule.id], step);
        overlay.dots[index].setAttribute("cx", x);
        overlay.dots[index].setAttribute("cy", (1 - actual / overlay.maxCount) * overlay.size.h);
      });
    }
  }

  function requestPaint() {
    if (paintFrame !== undefined) return;
    paintFrame = requestAnimationFrame(() => { paintFrame = undefined; paint(); });
  }

  function requestBuild() {
    const revision = ++buildRevision;
    root.setAttribute("aria-busy", "true");
    buildQueue = buildQueue.catch(() => {}).then(async () => {
      if (revision !== buildRevision) return;
      building = true;
      const style = theme();
      const story = stories[storyIndex];
      const maxCount = data.sequence_length - (revealedOnly ? story.trajectories[scheduleID].prefix_token_count : 0);
      const traces = schedules.flatMap((schedule) => {
        const selected = schedule.id === scheduleID;
        const trajectory = story.trajectories[schedule.id];
        const offset = revealedOnly ? trajectory.prefix_token_count : 0;
        const common = { type: "scatter", mode: "lines", x: times, opacity: selected ? 1 : 0.35 };
        return [
          { ...common, name: `${schedule.label}: expected`, y: trajectory.expected.map((value) => value - offset).reverse(),
            line: { color: schedule.color, width: selected ? 2 : 1.5, dash: "dash" },
            hovertemplate: `<b>${schedule.label}</b><br>t = %{x:.3f}<br>Expected: %{y:.1f} tokens<extra></extra>` },
          { ...common, name: `${schedule.label}: actual`, y: trajectory.counts.map((value) => value - offset).reverse(),
            line: { color: schedule.color, width: selected ? 2.5 : 1.5, shape: "hv" },
            hovertemplate: `<b>${schedule.label}</b><br>t = %{x:.3f}<br>Actual: %{y:.0f} tokens<extra></extra>` },
        ];
      });
      const size = chart.getBoundingClientRect();
      const axis = { fixedrange: true, zeroline: false, gridcolor: style.grid, tickfont: { size: 10 }, automargin: true };
      await Plotly.react(chart, traces, {
        width: Math.round(size.width), height: Math.round(size.height), margin: { l: 44, r: 7, t: 12, b: 34 },
        font: { family: style.font, color: style.text, size: 11 },
        paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", showlegend: false, hovermode: "closest", dragmode: false,
        hoverlabel: { bgcolor: style.background, bordercolor: style.grid, font: { size: 11 } },
        xaxis: { ...axis, range: [0, 1], tickvals: [0, 0.5, 1], title: { text: "t", standoff: 5, font: { size: 10 } } },
        yaxis: { ...axis, range: [0, maxCount], tickvals: [0, Math.round(maxCount / 2), maxCount],
          title: { text: revealedOnly
            ? "Revealed Tokens (\u2248 (D-|\u{1D4A6}|)\u03b1<sub>s</sub>)"
            : "Unmasked Tokens (|\u{1D4A6}|+(D-|\u{1D4A6}|)(\u03b1<sub>t</sub>-\u03b1<sub>1</sub>)/(1-\u03b1<sub>1</sub>))",
            standoff: 3, font: { size: revealedOnly ? 10 : 8 } } },
      }, { displayModeBar: false, displaylogo: false, scrollZoom: false });
      building = false;
      if (revision !== buildRevision) return;
      buildOverlay(style, maxCount);
      paint();
      root.setAttribute("aria-busy", "false");
      status.textContent = "";
    }).catch(fail);
    return buildQueue;
  }

  function fail() {
    building = false;
    root.setAttribute("aria-busy", "false");
    root.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = true; });
    slider.disabled = true;
    status.textContent = "Text animation unavailable.";
    retry.hidden = false;
  }

  async function initialize() {
    retry.hidden = true;
    root.setAttribute("aria-busy", "true");
    try {
      await ensurePlotly();
      root.querySelector(".interactive-trajectory").hidden = false;
      drawStory();
      await requestBuild();
      if (!retry.hidden) return;
      root.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = false; });
      slider.disabled = false;
      if (observersReady) return;
      new ResizeObserver(() => {
        const size = chart.getBoundingClientRect();
        if (chart.layout && (chart.layout.width !== Math.round(size.width) || chart.layout.height !== Math.round(size.height))) requestBuild();
      }).observe(root.querySelector(".unmasking-plot"));
      new MutationObserver(requestBuild).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      chart.on("plotly_click", (event) => {
        if (!event.points.length) return;
        step = Math.max(0, Math.min(steps, Math.round((1 - event.points[0].x) * steps)));
        slider.value = String(step);
        requestPaint();
      });
      observersReady = true;
    } catch (error) { fail(); }
  }

  addOptions("starter", stories.map((story, index) => ({ id: String(index), label: String(index + 1), description: `Sentence starter ${index + 1}: ${story.starter}` })));
  addOptions("schedule", schedules);
  root.addEventListener("change", (event) => {
    if (event.target.name === `${root.id}-starter`) {
      storyIndex = Number(event.target.value); drawStory(); paint(); requestBuild();
    } else if (event.target.name === `${root.id}-schedule`) {
      scheduleID = event.target.value; drawStory(); paint(); requestBuild();
    }
  });
  slider.addEventListener("input", () => { step = Number(slider.value); requestPaint(); });
  retry.addEventListener("click", initialize);
  initialize();
}

async function ensurePlotly() {
  if (window.Plotly) return;
  if (!plotlyReady) {
    const library = document.querySelector('script[src*="plotly.js@"]');
    if (!library) throw new Error("Plotly unavailable");
    plotlyReady = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = library.src;
      script.integrity = library.integrity;
      script.crossOrigin = library.crossOrigin;
      script.async = true;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }
  try { await plotlyReady; }
  catch (error) { plotlyReady = undefined; throw error; }
}

document.querySelectorAll(".text-diffusion").forEach(initializeTextDiffusion);
