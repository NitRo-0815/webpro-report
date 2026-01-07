export function squaredDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}

export function meanVector(vectors, dim) {
  const m = Array(dim).fill(0);
  if (vectors.length === 0) return m;

  for (const v of vectors) {
    for (let i = 0; i < dim; i++) m[i] += v[i];
  }
  for (let i = 0; i < dim; i++) m[i] /= vectors.length;
  return m;
}

function pickInitialCentroids(points, k) {
  const chosen = new Set();
  const centroids = [];
  if (points.length === 0) return centroids;

  while (centroids.length < k && chosen.size < points.length) {
    const idx = Math.floor(Math.random() * points.length);
    if (chosen.has(idx)) continue;
    chosen.add(idx);
    centroids.push(points[idx].vector.slice());
  }

  while (centroids.length < k) {
    centroids.push(points[centroids.length % points.length].vector.slice());
  }

  return centroids;
}

export function kmeans(points, k, options = {}) {
  const maxIterations = Number.isFinite(options.maxIterations) ? options.maxIterations : 50;

  if (!Array.isArray(points) || points.length === 0) {
    return { centroids: [], assignments: [], iterations: 0 };
  }

  const dim = points[0].vector.length;
  const kk = Math.max(1, Math.min(k, points.length));
  let centroids = pickInitialCentroids(points, kk);
  let assignments = Array(points.length).fill(-1);
  let iterations = 0;

  for (; iterations < maxIterations; iterations++) {
    let changed = false;

    for (let i = 0; i < points.length; i++) {
      const v = points[i].vector;
      let best = 0;
      let bestDist = squaredDistance(v, centroids[0]);

      for (let c = 1; c < centroids.length; c++) {
        const d = squaredDistance(v, centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }

      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }

    const grouped = Array.from({ length: centroids.length }, () => []);
    for (let i = 0; i < points.length; i++) {
      grouped[assignments[i]].push(points[i].vector);
    }

    const next = centroids.map((c, idx) => {
      if (grouped[idx].length === 0) return c;
      return meanVector(grouped[idx], dim);
    });

    centroids = next;

    if (!changed) break;
  }

  return { centroids, assignments, iterations };
}
