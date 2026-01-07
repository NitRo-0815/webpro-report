import { squaredDistance } from "./kmeans.js";

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function initUserVector(dim, value = 0.5) {
  return Array(dim).fill(value);
}

export function applyDelta(vec, delta) {
  const out = vec.slice();
  for (let i = 0; i < out.length; i++) out[i] = clamp01(out[i] + (delta[i] ?? 0));
  return out;
}

export function updateUserVector(userVector, questionId, answerValue) {
  const v = Array.isArray(userVector) ? userVector : initUserVector(6, 0.5);

  const richnessDeltas = {
    "軽い": [0, 0, 0, 0, 0, 1.0],
    "バランス": [0, 0, 0, 0, 0, 0],
    "濃い": [0, 0, 1.0, 0, 0, 0],
  };

  const pairingDeltas = {
    "食事と一緒に": [0, 0, 0, 0.5, 1.0, 0],
    "デザートと一緒に": [0, 0, 0, 0, 0, 0],
    "おつまみと一緒に": [0, 0, 1.0, 0, 0, 0],
    "そのまま": [0, 0, 0, 0, 0, 1.0],
  };

  const riceDetailDeltas = {
    "肉系": [0, 1.0, 1.0, 0, 0, 0],
    "魚系": [0, 0, 0, 1.0, 0, 1.0],
    "野菜・あっさり": [0, 0, 0, 1.0, 0, 1.0],
  };

  const dessertDetailDeltas = {
    "フルーツやショートケーキなど": [1.0, 0.6, 0, 0, 0, 0],
    "チョコレート系": [0, 1.0, 1.0, 0, 0, 0],
    "和菓子": [0, 0.6, 0, 0.8, 0.4, 0.8],
  };

  const sweetDryDeltas = {
    "甘口がいい": [0.6, 0.4, 0, 0, -0.5, 0],
    "どちらでもない": [0, 0, 0, 0, 0, 0],
    "辛口がいい": [0, 0, 0, 0, 1.0, 0.2],
  };

  const aromaDeltas = {
    "華やか": [1.0, 0, 0, 0, 0, 0],
    "穏やか": [0, 0, 0, 1.0, 0, 0],
  };

  if (questionId === "pairing" && pairingDeltas[answerValue]) {
    return applyDelta(v, pairingDeltas[answerValue]);
  }
  if (questionId === "rice_detail" && riceDetailDeltas[answerValue]) {
    return applyDelta(v, riceDetailDeltas[answerValue]);
  }
  if (questionId === "dessert_detail" && dessertDetailDeltas[answerValue]) {
    return applyDelta(v, dessertDetailDeltas[answerValue]);
  }
  if (questionId === "sweet_dry" && sweetDryDeltas[answerValue]) {
    return applyDelta(v, sweetDryDeltas[answerValue]);
  }
  if (questionId === "richness" && richnessDeltas[answerValue]) {
    return applyDelta(v, richnessDeltas[answerValue]);
  }
  if (questionId === "aroma" && aromaDeltas[answerValue]) {
    return applyDelta(v, aromaDeltas[answerValue]);
  }

  return v.slice();
}

export function userVectorFromAnswers(answers, dim = 6) {
  let v = initUserVector(dim, 0.5);

  if (answers?.pairing) {
    v = updateUserVector(v, "pairing", answers.pairing);
  }

  if (answers?.rice_detail) {
    v = updateUserVector(v, "rice_detail", answers.rice_detail);
  }

  if (answers?.dessert_detail) {
    v = updateUserVector(v, "dessert_detail", answers.dessert_detail);
  }

  if (answers?.sweet_dry) {
    v = updateUserVector(v, "sweet_dry", answers.sweet_dry);
  }

  if (answers?.richness) {
    v = updateUserVector(v, "richness", answers.richness);
  }

  if (answers?.aroma) {
    v = updateUserVector(v, "aroma", answers.aroma);
  }

  return v;
}

export function nearestClusterIndex(userVector, centroids) {
  if (!Array.isArray(centroids) || centroids.length === 0) return -1;
  let best = 0;
  let bestDist = squaredDistance(userVector, centroids[0]);
  for (let i = 1; i < centroids.length; i++) {
    const d = squaredDistance(userVector, centroids[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function recommendAllFromCluster({ answers, brands, points, centroids, assignments }) {
  const userVector = userVectorFromAnswers(answers, 6);
  const clusterIndex = nearestClusterIndex(userVector, centroids);

  if (clusterIndex < 0) {
    return { results: [], userVector, clusterIndex };
  }

  const brandById = new Map((Array.isArray(brands) ? brands : []).map(b => [String(b.id), b]));

  const items = [];
  for (let i = 0; i < points.length; i++) {
    if (assignments[i] !== clusterIndex) continue;
    const p = points[i];
    const brand = brandById.get(String(p.id));
    if (!brand) continue;

    const dist = Math.sqrt(squaredDistance(userVector, p.vector));
    items.push({ ...brand, dist });
  }

  items.sort((a, b) => a.dist - b.dist);

  const results = items.map(({ dist, ...rest }) => rest);

  return { results, userVector, clusterIndex };
}
