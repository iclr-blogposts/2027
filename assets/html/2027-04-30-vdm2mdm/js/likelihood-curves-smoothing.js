import { monotoneX } from "./third-party/d3-shape-3.2.0-monotone.js";

function smoothSegment(bins) {
  const points = [];
  const append = (x, logY) => points.push({ x, y: Math.exp(logY) });
  const context = {
    moveTo: append,
    lineTo: append,
    closePath() {},
    bezierCurveTo(x1, y1, x2, y2, x3, y3) {
      const first = points[points.length - 1];
      const x0 = first.x;
      const y0 = Math.log(first.y);
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        const u = 1 - t;
        const x = u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3;
        const y = u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3;
        append(x, y);
      }
    },
  };
  const interpolation = monotoneX(context);
  interpolation.lineStart();
  interpolation.point(bins[0].left, Math.log(bins[0].value));
  bins.forEach((bin) => interpolation.point((bin.left + bin.right) / 2, Math.log(bin.value)));
  interpolation.point(bins[bins.length - 1].right, Math.log(bins[bins.length - 1].value));
  interpolation.lineEnd();
  return points;
}

// Smooth only positive, contiguous runs; the measured bins remain untouched.
export function smoothCurve(curve) {
  const segments = [];
  let run = [];
  for (const bin of curve.bins) {
    if (bin.value !== null && bin.value > 0) run.push(bin);
    else if (run.length) { segments.push(smoothSegment(run)); run = []; }
  }
  if (run.length) segments.push(smoothSegment(run));
  const x = [];
  const y = [];
  const customdata = [];
  let index = 0;
  for (const segment of segments) {
    if (x.length) { x.push(null); y.push(null); customdata.push(null); }
    for (const point of segment) {
      while (index < curve.bins.length - 1 && (point.x > curve.bins[index].right || !(curve.bins[index].value > 0))) index++;
      x.push(point.x);
      y.push(point.y);
      customdata.push([curve.bins[index].value, curve.bins[index].draws]);
    }
  }
  return { segments, x, y, customdata };
}

export function smoothValue(display, x) {
  const points = display.segments.find((segment) => x >= segment[0].x && x <= segment[segment.length - 1].x);
  if (!points) return null;
  let low = 0;
  let high = points.length - 1;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].x <= x) low = middle;
    else high = middle;
  }
  const fraction = (x - points[low].x) / (points[high].x - points[low].x);
  return Math.exp(Math.log(points[low].y) * (1 - fraction) + Math.log(points[high].y) * fraction);
}
