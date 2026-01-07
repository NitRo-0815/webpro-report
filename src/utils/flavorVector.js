export const FLAVOR_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6"];

export function normalizeFlavorCharts(raw) {
  const base = raw?.flavorCharts ?? raw?.flavor_charts ?? raw;
  if (Array.isArray(base)) return base;
  if (!base || typeof base !== "object") return [];

  for (const v of Object.values(base)) {
    if (Array.isArray(v)) return v;
  }

  if (base.brandId != null) return [base];

  return [];
}

export function flavorChartToVector(chart) {
  if (!chart || typeof chart !== "object") return null;
  const v = FLAVOR_KEYS.map(k => {
    const n = Number(chart[k]);
    return Number.isFinite(n) ? n : null;
  });
  if (v.some(x => x == null)) return null;
  return v;
}

export function computeMinMax(vectors) {
  const dim = FLAVOR_KEYS.length;
  const min = Array(dim).fill(Number.POSITIVE_INFINITY);
  const max = Array(dim).fill(Number.NEGATIVE_INFINITY);

  for (const vec of vectors) {
    for (let i = 0; i < dim; i++) {
      const x = vec[i];
      if (x < min[i]) min[i] = x;
      if (x > max[i]) max[i] = x;
    }
  }

  return { min, max };
}

export function normalizeVector(vec, stats) {
  const { min, max } = stats;
  return vec.map((x, i) => {
    const denom = max[i] - min[i];
    if (!Number.isFinite(denom) || denom === 0) return 0.5;
    return (x - min[i]) / denom;
  });
}

export function buildBrandVectors(flavorChartsRaw) {
  const flavorCharts = normalizeFlavorCharts(flavorChartsRaw);
  const rawVectors = [];
  const byBrandId = new Map();

  for (const c of flavorCharts) {
    const brandId = c?.brandId ?? c?.brand_id ?? c?.id;
    const vec = flavorChartToVector(c);
    if (brandId == null || !vec) continue;
    rawVectors.push(vec);
    byBrandId.set(String(brandId), vec);
  }

  if (rawVectors.length === 0) {
    return {
      stats: { min: Array(FLAVOR_KEYS.length).fill(0), max: Array(FLAVOR_KEYS.length).fill(1) },
      points: [],
      vectorByBrandId: new Map(),
    };
  }

  const stats = computeMinMax(rawVectors);
  const points = [];
  const vectorByBrandId = new Map();

  for (const [brandId, vec] of byBrandId.entries()) {
    const normalized = normalizeVector(vec, stats);
    points.push({ id: String(brandId), vector: normalized });
    vectorByBrandId.set(String(brandId), normalized);
  }

  return { stats, points, vectorByBrandId };
}
