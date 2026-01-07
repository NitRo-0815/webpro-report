import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAllSakeData } from "./utils/api.js";

export default function BrandDetail() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [brewery, setBrewery] = useState(null);
  const [area, setArea] = useState(null);
  const [tags, setTags] = useState([]);
  const [flavorTags, setFlavorTags] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await fetchAllSakeData({ includeFlavorCharts: false });
      const brandsArr = Array.isArray(data?.brands) ? data.brands : [];
      const breweriesArr = Array.isArray(data?.breweries) ? data.breweries : [];
      const areasArr = Array.isArray(data?.areas) ? data.areas : [];
      const tagsArr = Array.isArray(data?.tags) ? data.tags : [];
      const brandFlavorTagsArr = Array.isArray(data?.brandFlavorTags) ? data.brandFlavorTags : [];

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
    })();
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