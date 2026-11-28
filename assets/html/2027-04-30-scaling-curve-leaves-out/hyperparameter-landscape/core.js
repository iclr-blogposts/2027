/*
 * Synthetic six-dimensional hyperparameter landscape. No DOM.
 * The browser (global HyperparameterLandscape) and Node tests share this file.
 *
 * Loss gap = sum of lambda_i * z_i^2, where z = Q^T x and Q is a fixed product of plane rotations.
 * Scale s in [0, 1] eases t = s^2 (3 - 2s); lambda_1 = 1, the other five = exp(t log 0.03).
 * The good region is loss gap <= EPSILON. These are illustrative numbers, not fitted values.
 */
(function (root) {
  "use strict";

  const DIMENSIONS = 6;
  const EPSILON = 0.2;
  const SOFTEST_SENSITIVITY = 0.03;
  // The 2D slice shows principal directions 1 and 2, displayed rotated by this angle.
  const ANGLE = Math.PI / 6;
  const ROTATIONS = [
    [0, 1, 0.4],
    [1, 2, 0.7],
    [2, 3, -0.5],
    [3, 4, 0.6],
    [4, 5, -0.3],
  ];

  function requireFinite(value, name) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  }

  function copyPoint(point) {
    if (!Array.isArray(point) || point.length !== DIMENSIONS) {
      throw new TypeError("Expected a six-dimensional array");
    }
    for (let i = 0; i < DIMENSIONS; i++) requireFinite(point[i], `point[${i}]`);
    return point.slice();
  }

  function rotate(point, inverse) {
    const rotated = copyPoint(point);
    const rotations = inverse ? ROTATIONS.slice().reverse() : ROTATIONS;
    for (const [i, j, angle] of rotations) {
      const c = Math.cos(angle);
      const s = Math.sin(inverse ? -angle : angle);
      const a = rotated[i];
      const b = rotated[j];
      rotated[i] = c * a - s * b;
      rotated[j] = s * a + c * b;
    }
    return rotated;
  }

  function landscape(scale) {
    requireFinite(scale, "scale");
    if (scale < 0 || scale > 1) throw new RangeError("scale must be in [0, 1]");
    const t = scale * scale * (3 - 2 * scale);
    const soft = Math.exp(t * Math.log(SOFTEST_SENSITIVITY));
    return { scale, epsilon: EPSILON, sensitivities: [1, soft, soft, soft, soft, soft] };
  }

  function evaluate(point, scale) {
    const z = rotate(point, true);
    const { sensitivities } = landscape(scale);
    return z.reduce((loss, value, i) => loss + sensitivities[i] * value * value, 0);
  }

  // Maps display coordinates (a, b) to principal coordinates; the other four stay at the optimum.
  function slicePrincipal(a, b) {
    requireFinite(a, "a");
    requireFinite(b, "b");
    const c = Math.cos(ANGLE);
    const s = Math.sin(ANGLE);
    return [c * a + s * b, -s * a + c * b, 0, 0, 0, 0];
  }

  function evaluateSlice(a, b, scale) {
    const z = slicePrincipal(a, b);
    const { sensitivities } = landscape(scale);
    return sensitivities[0] * z[0] ** 2 + sensitivities[1] * z[1] ** 2;
  }

  // Semi-axes of the contour ellipse at `level` in the display slice.
  function contourGeometry(level, scale) {
    requireFinite(level, "level");
    if (level <= 0) throw new RangeError("level must be positive");
    const { sensitivities } = landscape(scale);
    return {
      radius1: Math.sqrt(level / sensitivities[0]),
      radius2: Math.sqrt(level / sensitivities[1]),
      angle: ANGLE,
    };
  }

  const api = Object.freeze({
    DIMENSIONS,
    EPSILON,
    ANGLE,
    landscape,
    evaluate,
    toPrincipal: (point) => rotate(point, true),
    fromPrincipal: (point) => rotate(point, false),
    slicePrincipal,
    evaluateSlice,
    contourGeometry,
  });
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HyperparameterLandscape = api;
})(globalThis);
