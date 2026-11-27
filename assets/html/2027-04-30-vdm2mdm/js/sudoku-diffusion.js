const root = document.getElementById("sudoku-diffusion");
const data = JSON.parse(root.querySelector(".trajectory-data").textContent);
const chart = root.querySelector(".unmasking-chart");
const slider = root.querySelector('input[type="range"]');
const status = root.querySelector(".load-status");
const retry = root.querySelector(".retry");
const schedules = [
  { id: "loglinear", label: "Log-linear" },
  { id: "cosine", label: "Cosine" },
  { id: "duo_cosine", label: "Cosine (DUO)" },
];
const models = [
  { id: "MDM", label: "MDM", color: "#548c2f", dash: "solid" },
  { id: "ReMDM", label: "ReMDM-conf", color: "#7a62c4", dash: "dash" },
];
const steps = data.sampling_steps;
const times = data.times;
const boards = models.map((model) => {
  const panel = root.querySelector(`[data-model="${model.id}"]`);
  const board = panel.querySelector(".sudoku-board");
  board.setAttribute("aria-rowcount", "9");
  board.setAttribute("aria-colcount", "9");
  const cells = [];
  for (let row = 0; row < 9; row++) {
    const rowNode = document.createElement("div");
    rowNode.setAttribute("role", "row");
    rowNode.style.display = "contents";
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("span");
      cell.className = "cell";
      cell.setAttribute("role", "cell");
      cell.dataset.index = String(row * 9 + col);
      rowNode.append(cell);
      cells.push(cell);
    }
    board.append(rowNode);
  }
  return { ...model, panel, board, cells };
});
let puzzleIndex = 0;
let scheduleID = schedules[0].id;
let step = Number(slider.value);
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
    input.name = `sudoku-trajectory-${kind}`;
    input.value = option.id;
    input.checked = index === 0;
    input.setAttribute("aria-label", option.description || option.label);
    const text = document.createElement("span");
    text.className = "option-label";
    text.append(option.label);
    label.append(input, text);
    container.append(label);
  });
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

function buildOverlay(style) {
  const layer = root.querySelector(".unmasking-overlay");
  const size = chart._fullLayout._size;
  layer.setAttribute("viewBox", `0 0 ${chart.layout.width} ${chart.layout.height}`);
  const group = svgNode("g", { transform: `translate(${size.l},${size.t})` });
  const future = svgNode("rect", { x: 0, y: 0, width: 0, height: size.h, fill: style.background, opacity: 0.65 });
  const line = svgNode("line", { y1: 0, y2: size.h, stroke: style.text, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.4 });
  const dots = models.map((model) => svgNode("circle", {
    r: 3.5, fill: model.id === "MDM" ? model.color : style.background, stroke: model.color, "stroke-width": 1.5,
  }));
  group.append(future, line, ...dots);
  layer.replaceChildren(group);
  overlay = { size, future, line, dots };
}

function paint() {
  const example = data.examples[puzzleIndex];
  const blankCount = 81 - example.clue_count;
  const trajectories = example.schedules[scheduleID];
  boards.forEach((model) => {
    const trajectory = trajectories[model.id];
    const values = trajectory.states[step];
    const conflicts = new Set(trajectory.conflicts[step]);
    const remasked = new Set(trajectory.remasked[step]);
    model.cells.forEach((cell, index) => {
      const value = values[index];
      const clue = example.puzzle[index] !== 0;
      cell.textContent = value || "";
      cell.classList.toggle("is-clue", clue);
      cell.classList.toggle("is-conflict", conflicts.has(index));
      cell.classList.toggle("is-remasked", remasked.has(index));
      const description = [value ? String(value) : "masked", clue ? "clue" : "generated"];
      if (conflicts.has(index)) description.push("in conflict");
      if (remasked.has(index)) description.push("remasked this step");
      cell.setAttribute("aria-label", description.join(", "));
      cell.title = `Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}: ${description.join(", ")}`;
    });
    model.panel.querySelector(".unmasked-count").textContent = `${trajectory.counts[step]}/${blankCount}`;
    model.panel.querySelector(".conflict-count").textContent = String(conflicts.size);
    model.board.setAttribute("aria-label", `${model.label}, puzzle ${puzzleIndex + 1}, step ${step}: ${trajectory.counts[step]} of ${blankCount} generated cells unmasked, ${conflicts.size} cells in conflict`);
  });
  const time = data.times[step];
  root.querySelector(".time-value").textContent = `Step ${step} / ${steps} \u00b7 t = ${time.toFixed(2)}`;
  slider.setAttribute("aria-valuetext", `Step ${step} of ${steps}, t = ${time.toFixed(2)}`);
  root.dataset.example = String(puzzleIndex);
  root.dataset.schedule = scheduleID;
  root.dataset.step = String(step);
  root.dataset.time = String(time);
  if (overlay && !building) {
    const x = time * overlay.size.w;
    overlay.future.setAttribute("width", x);
    overlay.line.setAttribute("x1", x);
    overlay.line.setAttribute("x2", x);
    models.forEach((model, index) => {
      overlay.dots[index].setAttribute("cx", x);
      overlay.dots[index].setAttribute("cy", (1 - trajectories[model.id].counts[step] / blankCount) * overlay.size.h);
    });
  }
}

function requestPaint() {
  if (paintFrame !== undefined) return;
  paintFrame = requestAnimationFrame(() => { paintFrame = undefined; paint(); });
}

function selectChartStep(event) {
  if (!event.points.length) return;
  step = Math.max(0, Math.min(steps, Math.round((1 - event.points[0].x) * steps)));
  slider.value = String(step);
  requestPaint();
}

function requestBuild() {
  const revision = ++buildRevision;
  root.setAttribute("aria-busy", "true");
  buildQueue = buildQueue.catch(() => {}).then(async () => {
    if (revision !== buildRevision) return;
    building = true;
    const style = theme();
    const example = data.examples[puzzleIndex];
    const blankCount = 81 - example.clue_count;
    const traces = models.map((model) => ({
      type: "scatter", mode: "lines", name: model.label, x: times,
      y: example.schedules[scheduleID][model.id].counts,
      line: { color: model.color, width: 2.5, shape: "hv", dash: model.dash },
      hovertemplate: `<b>${model.label}</b><br>t = %{x:.2f}<br>Revealed Tokens: %{y:.0f} / ${blankCount}<extra></extra>`,
    }));
    traces.push({
      type: "scatter", mode: "lines", name: "Expected (MDM)", x: times,
      y: example.schedules[scheduleID].expected,
      line: { color: "#808080", width: 1.8, dash: "dash" },
      hovertemplate: `<b>Expected (MDM)</b><br>t = %{x:.2f}<br>Revealed Tokens: %{y:.1f} / ${blankCount}<extra></extra>`,
    });
    const size = chart.getBoundingClientRect();
    const axis = { fixedrange: true, zeroline: false, gridcolor: style.grid, tickfont: { size: 10 }, automargin: true };
    await Plotly.react(chart, traces, {
      width: Math.round(size.width), height: Math.round(size.height), margin: { l: 44, r: 8, t: 10, b: 38 },
      font: { family: style.font, color: style.text, size: 11 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)", showlegend: false, hovermode: "closest", dragmode: false,
      hoverlabel: { bgcolor: style.background, bordercolor: style.grid, font: { size: 11 } },
      xaxis: { ...axis, range: [0, 1], tickvals: [0, 0.5, 1], title: { text: "t", standoff: 5, font: { size: 10 } } },
      yaxis: { ...axis, range: [0, blankCount], tickvals: [0, Math.round(blankCount / 2), blankCount],
        title: { text: "Revealed Tokens", standoff: 4, font: { size: 10 } } },
    }, { displayModeBar: false, displaylogo: false, scrollZoom: false });
    chart.removeListener("plotly_click", selectChartStep);
    chart.on("plotly_click", selectChartStep);
    building = false;
    if (revision !== buildRevision) return;
    buildOverlay(style);
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
  status.textContent = "Sudoku animation unavailable.";
  retry.hidden = false;
}

async function ensurePlotly() {
  if (window.Plotly) return;
  const library = document.querySelector('script[src*="plotly.js@"]');
  if (!library) throw new Error("Plotly unavailable");
  await new Promise((resolve, reject) => {
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

async function initialize() {
  retry.hidden = true;
  root.setAttribute("aria-busy", "true");
  try {
    await ensurePlotly();
    root.querySelector(".interactive-trajectory").hidden = false;
    paint();
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
    observersReady = true;
  } catch (error) { fail(); }
}

addOptions("puzzle", data.examples.map((example, index) => ({ id: String(index), label: String(index + 1), description: `Puzzle ${index + 1}: ${example.clue_count} initial clues` })));
addOptions("schedule", schedules);
root.addEventListener("change", (event) => {
  if (event.target.name === "sudoku-trajectory-puzzle") {
    puzzleIndex = Number(event.target.value); paint(); requestBuild();
  } else if (event.target.name === "sudoku-trajectory-schedule") {
    scheduleID = event.target.value; paint(); requestBuild();
  }
});
slider.addEventListener("input", () => { step = Number(slider.value); requestPaint(); });
retry.addEventListener("click", initialize);
initialize();
