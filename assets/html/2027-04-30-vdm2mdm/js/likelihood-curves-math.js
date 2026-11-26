const measured = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function noiseLevel(family, schedule, time, bounds) {
  const [low, high] = bounds;
  let nu;
  if (family === "VDM") {
    if (schedule === "linear") nu = high + (low - high) * time;
    else if (schedule === "quadratic") nu = high + (low - high) * time * time;
    else {
      const first = Math.atan(Math.exp(-high / 2));
      const last = Math.atan(Math.exp(-low / 2));
      nu = -2 * Math.log(Math.tan(first + (last - first) * time));
    }
  } else {
    const alphaMin = Math.exp(-high);
    let alpha;
    if (schedule === "loglinear") alpha = 1 - (1 - alphaMin) * time;
    else if (schedule === "cosine") alpha = Math.cos(Math.acos(alphaMin) * time);
    else alpha = 1 - Math.sin(Math.asin(1 - alphaMin) * time);
    nu = -Math.log(clamp(alpha, alphaMin, 1));
  }
  return clamp(nu, low, high);
}

export function scheduleTime(family, schedule, nu, bounds) {
  const [low, high] = bounds;
  let time;
  if (family === "VDM") {
    const fraction = clamp((high - nu) / (high - low), 0, 1);
    if (schedule === "linear") time = fraction;
    else if (schedule === "quadratic") time = Math.sqrt(fraction);
    else {
      const first = Math.atan(Math.exp(-high / 2));
      const last = Math.atan(Math.exp(-low / 2));
      time = (Math.atan(Math.exp(-nu / 2)) - first) / (last - first);
    }
  } else {
    const alphaMin = Math.exp(-high);
    const alpha = clamp(Math.exp(-nu), alphaMin, 1);
    if (schedule === "loglinear") time = (1 - alpha) / (1 - alphaMin);
    else if (schedule === "cosine") time = Math.acos(alpha) / Math.acos(alphaMin);
    else time = Math.asin(1 - alpha) / Math.asin(1 - alphaMin);
  }
  return clamp(time, 0, 1);
}

export function integrationCoordinates(family, schedule, progress, basis, bounds) {
  const fraction = clamp(progress, 0, 1);
  if (basis === "nu") {
    const [low, high] = bounds;
    const nu = family === "VDM" ? high + (low - high) * fraction : low + (high - low) * fraction;
    return { time: scheduleTime(family, schedule, nu, bounds), nu };
  }
  return { time: fraction, nu: noiseLevel(family, schedule, fraction, bounds) };
}

// Merge observed neighbors by width, preserving their integral and any missing buckets.
export function coarsenCurve(source, bounds, targetBuckets = 40) {
  const values = source.mean || source.variance_contribution_per_unit_nu;
  const edges = [bounds[0], ...source.x.slice(1).map((x, i) => (source.x[i] + x) / 2), bounds[1]];
  const stride = Math.max(1, Math.ceil(values.length / targetBuckets));
  const bins = [];
  for (let start = 0; start < values.length; start += stride) {
    const end = Math.min(start + stride, values.length);
    if (values.slice(start, end).every(measured)) {
      let area = 0;
      let draws = 0;
      for (let i = start; i < end; i++) {
        area += values[i] * (edges[i + 1] - edges[i]);
        draws += source.draws_per_bin[i];
      }
      bins.push({ left: edges[start], right: edges[end], value: end === start + 1 ? values[start] : area / (edges[end] - edges[start]), draws });
    } else {
      for (let i = start; i < end; i++) {
        bins.push({ left: edges[i], right: edges[i + 1], value: measured(values[i]) ? values[i] : null, draws: source.draws_per_bin[i] });
      }
    }
  }
  return { bins, bounds: bounds.slice(), sourceBuckets: values.length };
}

// Transform bin boundaries, not conditional means, so each bin keeps its area.
export function timeCurveToNoiseLevel(curve, family, schedule, bounds) {
  const bins = curve.bins.map((bin) => {
    const first = noiseLevel(family, schedule, bin.left, bounds);
    const last = noiseLevel(family, schedule, bin.right, bounds);
    const left = Math.min(first, last);
    const right = Math.max(first, last);
    return {
      left, right,
      value: bin.value === null ? null : bin.value * (bin.right - bin.left) / (right - left),
      draws: bin.draws,
    };
  });
  if (family === "VDM") bins.reverse();
  return { bins, bounds: bounds.slice(), sourceBuckets: curve.sourceBuckets };
}

export function integrateCurve(curve, cursor, reverse = false) {
  let area = 0;
  let missingWidth = 0;
  for (const bin of curve.bins) {
    const width = Math.max(0, reverse ? bin.right - Math.max(bin.left, cursor) : Math.min(bin.right, cursor) - bin.left);
    if (bin.value === null) missingWidth += width;
    else area += width * bin.value;
  }
  return { area, incomplete: missingWidth > 1e-9 };
}

export function curveValue(curve, x) {
  const bin = curve.bins.find((bin, i) => x >= bin.left && (x < bin.right || i === curve.bins.length - 1 && x <= bin.right));
  return bin ? bin.value : null;
}

export function stepCurve(curve) {
  const x = [];
  const y = [];
  const draws = [];
  for (const bin of curve.bins) {
    x.push(bin.left, bin.right);
    y.push(bin.value, bin.value);
    draws.push(bin.draws, bin.draws);
  }
  return { x, y, draws };
}
