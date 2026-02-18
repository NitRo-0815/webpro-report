export async function safeFetchJson(path) {
  const res = await fetch(path);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}`);
  }

  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON but got '${ct}' for ${path}`);
  }

  return res.json();
}

export function normalizeArray(raw, key) {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object" && key && Array.isArray(raw[key])) return raw[key];
  return [];
}

export function normalizeBrandFlavorTags(raw) {
  const base = raw?.brandFlavorTags ?? raw;
  if (Array.isArray(base)) return base;
  if (!base || typeof base !== "object") return [];
  if (Array.isArray(base.brandFlavorTags)) return base.brandFlavorTags;
  if (base.brandId != null) return [base];

  for (const v of Object.values(base)) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      for (const vv of Object.values(v)) {
        if (Array.isArray(vv)) return vv;
      }
    }
  }

  return Object.entries(base)
    .map(([brandId, tagIds]) => ({
      brandId: Number(brandId),
      tagIds: Array.isArray(tagIds) ? tagIds : [],
    }))
    .filter(x => Number.isFinite(x.brandId));
}

export async function getBrands() {
  const json = await safeFetchJson("/sakenowa-data/api/brands");
  return normalizeArray(json, "brands");
}

export async function getBreweries() {
  const json = await safeFetchJson("/sakenowa-data/api/breweries");
  return normalizeArray(json, "breweries");
}

export async function getAreas() {
  const json = await safeFetchJson("/sakenowa-data/api/areas");
  return normalizeArray(json, "areas");
}

export async function getFlavorTags() {
  const json = await safeFetchJson("/sakenowa-data/api/flavor-tags");
  return normalizeArray(json, "tags");
}

export async function getBrandFlavorTags() {
  const json = await safeFetchJson("/sakenowa-data/api/brand-flavor-tags");
  return normalizeBrandFlavorTags(json);
}

export async function getFlavorCharts() {
  return safeFetchJson("/sakenowa-data/api/flavor-charts");
}

let lightDataCache = null;
let lightPromiseCache = null;
let fullDataCache = null;
let fullPromiseCache = null;

// API一括取得
export async function fetchAllSakeData({ includeFlavorCharts = true } = {}) {
  if (fullDataCache) return fullDataCache;
  if (includeFlavorCharts && fullPromiseCache) return fullPromiseCache;
  if (!includeFlavorCharts) {
    if (lightDataCache) return lightDataCache;
    if (lightPromiseCache) return lightPromiseCache;
  }

  const p = (async () => {
    try {
      const requests = [
        safeFetchJson("/sakenowa-data/api/brands"),
        safeFetchJson("/sakenowa-data/api/flavor-tags"),
        safeFetchJson("/sakenowa-data/api/brand-flavor-tags"),
        safeFetchJson("/sakenowa-data/api/breweries"),
        safeFetchJson("/sakenowa-data/api/areas"),
      ];

      if (includeFlavorCharts) {
        requests.push(safeFetchJson("/sakenowa-data/api/flavor-charts"));
      }

      const [brandsJson, tagsJson, bfJson, breweriesJson, areasJson, flavorChartsJson] =
        await Promise.all(requests);

      const brands = normalizeArray(brandsJson, "brands");
      const tags = normalizeArray(tagsJson, "tags");
      const brandFlavorTags = normalizeBrandFlavorTags(bfJson);
      const breweries = normalizeArray(breweriesJson, "breweries");
      const areas = normalizeArray(areasJson, "areas");

      const result = {
        brands,
        tags,
        brandFlavorTags,
        breweries,
        areas,
        flavorCharts: includeFlavorCharts ? flavorChartsJson : null,
      };

      if (includeFlavorCharts) {
        fullDataCache = result;
        lightDataCache = result;
      } else {
        lightDataCache = result;
      }

      return result;
    } finally {
      if (includeFlavorCharts) {
        fullPromiseCache = null;
      } else {
        lightPromiseCache = null;
      }
    }
  })();

  if (includeFlavorCharts) {
    fullPromiseCache = p;
  } else {
    lightPromiseCache = p;
  }

  return p;
}

export function clearSakeDataCache() {
  lightDataCache = null;
  fullDataCache = null;
  lightPromiseCache = null;
  fullPromiseCache = null;
}
