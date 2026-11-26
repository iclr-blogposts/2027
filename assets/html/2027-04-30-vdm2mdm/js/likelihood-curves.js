import { coarsenCurve, integrateCurve, integrationCoordinates, timeCurveToNoiseLevel } from "./likelihood-curves-math.js";
import { smoothCurve, smoothValue } from "./likelihood-curves-smoothing.js";

const root = document.getElementById("image-likelihood-curves");
const panels = Array.from(root.querySelectorAll(".curve-panel"));
const slider = root.querySelector('input[type="range"]');
const status = root.querySelector(".curve-status");
const retry = root.querySelector(".curve-retry");
const schedules = {
  VDM: [{ key: "cosine", label: "Cosine", color: "#e45756" }, { key: "linear", label: "Linear", color: "#3b82f6" }, { key: "quadratic", label: "Quadratic", color: "#26a269" }],
  MDM: [{ key: "loglinear", label: "Loglinear", color: "#e69f00" }, { key: "cosine", label: "Cosine", color: "#a855f7" }, { key: "duo_cosine", label: "Cosine (DUO)", color: "#0f9e9e" }],
};
const metrics = panels.map((panel) => panel.dataset.metric);
const dashes = ["solid", "dash", "dot"];
const frames = new Map();
let results;
let cache;
let family = "VDM";
let builtFamily;
let progress = 0.5;
let integrationBasis = "time";
let buildRevision = 0;
let buildQueue = Promise.resolve();
let building = false;
let animationFrame;
let observersReady = false;

function theme() {
  const style = getComputedStyle(root);
  return {
    text: style.getPropertyValue("--global-text-color").trim() || "#17181a",
    grid: style.getPropertyValue("--global-divider-color").trim() || "#d1d5db",
    background: style.getPropertyValue("--global-bg-color").trim() || "#fff",
    font: style.fontFamily,
  };
}

function lineLabel(schedule, index) {
  const name = document.createElement("span");
  name.className = "curve-area-name";
  const line = document.createElement("i");
  line.className = `curve-line ${dashes[index]}`;
  line.style.setProperty("--curve-color", schedule.color);
  line.setAttribute("aria-hidden", "true");
  name.append(line, schedule.label);
  return name;
}

function svgNode(name, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
}

function areaPath(display, xPixel, yPixel, baseline) {
  let path = "";
  let end;
  for (let i = 0; i < display.x.length; i++) {
    if (display.y[i] === null) {
      if (end !== undefined) path += ` L${end},${baseline} Z`;
      end = undefined;
      continue;
    }
    const x = xPixel(display.x[i]);
    const y = yPixel(display.y[i]);
    path += end === undefined ? ` M${x},${baseline} L${x},${y}` : ` L${x},${y}`;
    end = x;
  }
  if (end !== undefined) path += ` L${end},${baseline} Z`;
  return path;
}

function createOverlays(panel, selectedFamily, style) {
  const chart = panel.querySelector(".likelihood-chart");
  const metric = panel.dataset.metric;
  const curves = cache[selectedFamily][metric];
  const size = chart._fullLayout._size;
  const bounds = curves[0].bounds;
  const [logMin, logMax] = chart.layout.yaxis.range;
  const xPixel = (x) => (x - bounds[0]) / (bounds[1] - bounds[0]) * size.w;
  const yPixel = (y) => size.h * (1 - (Math.log10(y) - logMin) / (logMax - logMin));
  const areaLayer = panel.querySelector(".curve-area-layer");
  const markerLayer = panel.querySelector(".curve-marker-layer");
  for (const layer of [areaLayer, markerLayer]) {
    layer.replaceChildren();
    layer.setAttribute("viewBox", `0 0 ${chart.layout.width} ${chart.layout.height}`);
  }
  const defs = svgNode("defs");
  const areas = svgNode("g", { transform: `translate(${size.l},${size.t})` });
  const markers = svgNode("g", { transform: `translate(${size.l},${size.t})` });
  areaLayer.append(defs, areas);
  markerLayer.append(markers);
  const outputs = panel.querySelector(".curve-areas");
  outputs.replaceChildren();
  const overlays = schedules[selectedFamily].map((schedule, index) => {
    const id = `likelihood-${metric}-${schedule.key}`;
    const clip = svgNode("clipPath", { id, clipPathUnits: "userSpaceOnUse" });
    const rect = svgNode("rect", { x: 0, y: 0, width: size.w, height: size.h });
    clip.append(rect);
    defs.append(clip);
    areas.append(svgNode("path", { d: areaPath(curves[index].display, xPixel, yPixel, size.h), fill: schedule.color, "fill-opacity": 0.12, "clip-path": `url(#${id})` }));
    const line = svgNode("line", { y1: 0, y2: size.h, stroke: metric === "time_curve" ? style.text : schedule.color, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: 0.65 });
    const dot = svgNode("circle", { r: 3, fill: schedule.color, stroke: style.background, "stroke-width": 1 });
    markers.append(line, dot);
    const row = document.createElement("div");
    row.className = "curve-area-row";
    const output = document.createElement("output");
    output.className = "curve-area-number";
    output.setAttribute("aria-label", `${schedule.label} area`);
    output.setAttribute("aria-live", "off");
    row.append(lineLabel(schedule, index), output);
    outputs.append(row);
    return { rect, line, dot, output };
  });
  return { curves, overlays, size, xPixel, yPixel, cursorColor: style.text };
}

function paint() {
  if (building || builtFamily !== family) return;
  const coordinates = schedules[family].map((schedule) => integrationCoordinates(family, schedule.key, progress, integrationBasis, results[family].evaluation_nu_bounds));
  panels.forEach((panel) => {
    const frame = frames.get(panel);
    const isTime = panel.dataset.metric === "time_curve";
    const reverse = !isTime && family === "VDM";
    const shared = isTime ? integrationBasis === "time" : integrationBasis === "nu";
    schedules[family].forEach((schedule, index) => {
      const position = coordinates[index];
      const cursor = isTime ? position.time : position.nu;
      const pixel = Math.max(0, Math.min(frame.size.w, frame.xPixel(cursor)));
      const overlay = frame.overlays[index];
      overlay.rect.setAttribute("x", reverse ? pixel : 0);
      overlay.rect.setAttribute("width", reverse ? frame.size.w - pixel : pixel);
      overlay.line.setAttribute("x1", pixel);
      overlay.line.setAttribute("x2", pixel);
      overlay.line.setAttribute("stroke", shared ? frame.cursorColor : schedule.color);
      overlay.line.toggleAttribute("hidden", shared && index > 0);
      const value = smoothValue(frame.curves[index].display, cursor);
      overlay.dot.toggleAttribute("hidden", value === null || value <= 0);
      if (value !== null && value > 0) {
        overlay.dot.setAttribute("cx", pixel);
        overlay.dot.setAttribute("cy", frame.yPixel(value));
      }
      const integral = integrateCurve(frame.curves[index], cursor, reverse);
      overlay.output.textContent = integral.area.toFixed(4);
      overlay.output.title = panel.dataset.metric === "nu_curve" ? "Area under transformed time-bin averages" : "Area under observed bucket averages";
      overlay.output.dataset.area = String(integral.area);
      overlay.output.dataset.incomplete = String(integral.incomplete);
      overlay.output.dataset.cursor = String(cursor);
      overlay.output.dataset.time = String(position.time);
      overlay.output.dataset.nu = String(position.nu);
    });
  });
  const coordinate = integrationBasis === "nu" ? "\u03bd" : "t";
  const value = integrationBasis === "nu" ? coordinates[0].nu : progress;
  root.querySelectorAll(".curve-area-coordinate").forEach((label) => { label.textContent = coordinate; });
  root.querySelector(".curve-current-time").textContent = `${coordinate} = ${value.toFixed(2)}`;
  slider.setAttribute("aria-label", integrationBasis === "nu" ? "Integration progress over noise level" : "Integration progress over diffusion time");
  slider.setAttribute("aria-valuetext", `${Math.round(progress * 100)} percent, ${coordinate} = ${value.toFixed(2)}`);
  root.dataset.progress = String(progress);
  root.dataset.basis = integrationBasis;
  if (integrationBasis === "time") { root.dataset.time = String(progress); delete root.dataset.nu; }
  else { root.dataset.nu = String(value); delete root.dataset.time; }
  root.setAttribute("aria-busy", "false");
}

function requestPaint() {
  root.setAttribute("aria-busy", "true");
  if (animationFrame !== undefined) return;
  animationFrame = requestAnimationFrame(() => { animationFrame = undefined; paint(); });
}

function layout(chart, metric, selectedFamily, curves, style) {
  const isTime = metric === "time_curve";
  const values = curves.flatMap((curve) => curve.bins.map((bin) => bin.value)).filter((value) => value !== null && value > 0);
  const logRange = values.length ? [Math.floor(Math.log10(Math.min(...values))) - 0.05, Math.ceil(Math.log10(Math.max(...values))) + 0.05] : [-1, 1];
  const size = chart.getBoundingClientRect();
  const axis = { fixedrange: true, zeroline: false, showline: false, gridcolor: style.grid, tickfont: { size: 10 }, ticklen: 0 };
  return {
    width: Math.round(size.width), height: Math.round(size.height),
    margin: { l: 46, r: 8, t: 8, b: 38 },
    font: { family: style.font, size: 10, color: style.text },
    paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
    showlegend: false, hovermode: "closest", dragmode: false,
    hoverlabel: { bgcolor: style.background, bordercolor: style.grid, font: { size: 11 } },
    xaxis: { ...axis, range: curves[0].bounds, tickvals: isTime ? [0, 0.5, 1] : selectedFamily === "VDM" ? [-10, 0, 10] : [0, 5, 10],
      title: { text: isTime ? "Time t" : selectedFamily === "VDM" ? "\u03bd = log SNR" : "\u03bd = \u2212log \u03b1", font: { size: 10 }, standoff: 4 } },
    yaxis: { ...axis, type: "log", range: logRange, nticks: 4, exponentformat: "power", showexponent: "all",
      title: { text: isTime ? "Weighted expected error" : "Denoising integrand / \u03bd", font: { size: 10 }, standoff: 3 } },
  };
}

function requestBuild() {
  const revision = ++buildRevision;
  root.setAttribute("aria-busy", "true");
  buildQueue = buildQueue.catch(() => {}).then(async () => {
    if (revision !== buildRevision || !cache) return;
    building = true;
    const selectedFamily = family;
    const style = theme();
    await Promise.all(panels.map((panel) => {
      const metric = panel.dataset.metric;
      const chart = panel.querySelector(".likelihood-chart");
      const curves = cache[selectedFamily][metric];
      const traces = schedules[selectedFamily].map((schedule, index) => {
        const points = curves[index].display;
        return {
          type: "scatter", mode: "lines", x: points.x, y: points.y, customdata: points.customdata,
          name: schedule.label, connectgaps: false, line: { color: schedule.color, width: 2, dash: dashes[index] },
          hovertemplate: `<b>${schedule.label}</b><br>${metric === "time_curve" ? "t" : "\u03bd"} = %{x:.3f}<br>Display value: %{y:.4g}<br>${metric === "nu_curve" ? "Transformed bin average" : "Bucket mean"}: %{customdata[0]:.4g}<br>%{customdata[1]} draws in ${metric === "nu_curve" ? "source time bin" : "bucket"}<extra></extra>`,
        };
      });
      return Plotly.react(chart, traces, layout(chart, metric, selectedFamily, curves, style), { displayModeBar: false, displaylogo: false, scrollZoom: false });
    }));
    building = false;
    if (revision !== buildRevision) return;
    panels.forEach((panel) => {
      frames.set(panel, createOverlays(panel, selectedFamily, style));
      const chart = panel.querySelector(".likelihood-chart");
      chart.dataset.buckets = String(Math.max(...cache[selectedFamily][panel.dataset.metric].map((curve) => curve.bins.length)));
      chart.setAttribute("aria-label", `${selectedFamily}: ${panel.dataset.metric.replaceAll("_", " ")}, three evaluation schedules`);
    });
    const legend = root.querySelector(".curve-schedule-key");
    const label = document.createElement("span");
    label.className = "curve-legend-title";
    label.textContent = "Evaluation schedule";
    legend.replaceChildren(label);
    schedules[selectedFamily].forEach((schedule) => {
      const item = document.createElement("span");
      item.className = "curve-legend-item";
      const swatch = document.createElement("span");
      swatch.className = "curve-swatch";
      swatch.style.backgroundColor = schedule.color;
      swatch.setAttribute("aria-hidden", "true");
      item.append(swatch, schedule.label);
      legend.appendChild(item);
    });
    builtFamily = selectedFamily;
    root.dataset.family = selectedFamily;
    status.textContent = "";
    paint();
  }).catch(() => { building = false; if (revision === buildRevision) fail(); });
  return buildQueue;
}

function fail() {
  root.setAttribute("aria-busy", "false");
  root.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = true; });
  slider.disabled = true;
  status.textContent = "Likelihood curves unavailable.";
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
    document.head.appendChild(script);
  });
}

async function initialize() {
  retry.hidden = true;
  status.textContent = "Loading likelihood curves...";
  root.setAttribute("aria-busy", "true");
  try {
    const [vdm, mdm] = await Promise.all([root.dataset.vdmUrl, root.dataset.mdmUrl].map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Curve data unavailable");
      return response.json();
    }).concat(ensurePlotly()));
    results = { VDM: vdm, MDM: mdm };
    cache = Object.fromEntries(Object.keys(results).map((key) => [key, Object.fromEntries(metrics.map((metric) => [metric,
      schedules[key].map((schedule) => {
        const curve = metric === "nu_curve"
          ? timeCurveToNoiseLevel(coarsenCurve(results[key].time_curve[schedule.key], [0, 1], 40), key, schedule.key, results[key].evaluation_nu_bounds)
          : coarsenCurve(results[key][metric][schedule.key], metric === "time_curve" ? [0, 1] : results[key].evaluation_nu_bounds, 40);
        return { ...curve, display: smoothCurve(curve) };
      }),
    ]))]));
    await requestBuild();
    if (!retry.hidden) return;
    root.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = false; });
    slider.disabled = false;
    if (observersReady) return;
    new ResizeObserver(() => {
      if (panels.some((panel) => {
        const chart = panel.querySelector(".likelihood-chart");
        return chart.layout && chart.layout.width !== Math.round(chart.getBoundingClientRect().width);
      })) requestBuild();
    }).observe(root.querySelector(".curve-panels"));
    new MutationObserver(requestBuild).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    observersReady = true;
  } catch (error) { fail(); }
}

root.addEventListener("change", (event) => {
  if (event.target.name === "likelihood-curve-family") { family = event.target.value; requestBuild(); }
  else if (event.target.name === "likelihood-curve-integration") { integrationBasis = event.target.value; requestPaint(); }
});
slider.addEventListener("input", () => {
  progress = Number(slider.value) / 100;
  root.querySelector(".curve-time-value").textContent = `${slider.value}%`;
  requestPaint();
});
retry.addEventListener("click", initialize);
initialize();
