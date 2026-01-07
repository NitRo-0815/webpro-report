import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

async function safeFetchJson(path) {
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

export default function BrandDetail() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [brewery, setBrewery] = useState(null);
  const [area, setArea] = useState(null);
  const [tags, setTags] = useState([]);
  const [flavorTags, setFlavorTags] = useState([]);

  useEffect(() => {
    // 必要なデータをすべて取得
    Promise.all([
      safeFetchJson("/sakenowa-data/api/brands"),
      safeFetchJson("/sakenowa-data/api/breweries"),
      safeFetchJson("/sakenowa-data/api/areas"),
      safeFetchJson("/sakenowa-data/api/flavor-tags"),
      safeFetchJson("/sakenowa-data/api/brand-flavor-tags"),
    ]).then(([brands, breweries, areas, flavorTagsData, brandFlavorTagsData]) => {
      const normalizeArray = (raw, key) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === "object" && key && Array.isArray(raw[key])) return raw[key];
        return [];
      };

      const normalizeBrandFlavorTags = raw => {
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
      };

      const brandsArr = normalizeArray(brands, "brands");
      const breweriesArr = normalizeArray(breweries, "breweries");
      const areasArr = normalizeArray(areas, "areas");
      const tagsArr = normalizeArray(flavorTagsData, "tags");
      const brandFlavorTagsArr = normalizeBrandFlavorTags(brandFlavorTagsData);

      const b = brandsArr.find(x => String(x.id) === String(id));
      setBrand(b);
      const br = breweriesArr.find(x => String(x.id) === String(b?.breweryId));
      setBrewery(br);
      const ar = areasArr.find(x => String(x.id) === String(br?.areaId));
      setArea(ar);
      setTags(tagsArr);

      const brandTag = brandFlavorTagsArr.find(x => String(x.brandId) === String(b?.id));
      const rawIds =
        brandTag?.tagIds ??
        brandTag?.flavorTagIds ??
        brandTag?.flavor_tags ??
        (brandTag ? Object.values(brandTag).find(v => Array.isArray(v)) : undefined) ??
        [];
      const ids = Array.isArray(rawIds) ? rawIds.map(Number).filter(Number.isFinite) : [];

      setFlavorTags(ids.map(tid => tagsArr.find(t => Number(t.id) === Number(tid))?.tag));
    });
  }, [id]);

  if (!brand) return <div>読み込み中...</div>;

  return (
    <div>
      <h2>{brand.name}</h2>
      <p>蔵元: {brewery ? brewery.name : "不明"}</p>
      <p>地域: {area ? area.name : "不明"}</p>
      <p>フレーバータグ: {flavorTags.length ? flavorTags.join(" / ") : "なし"}</p>
    </div>
  );
}