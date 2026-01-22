import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchAllSakeData } from "./utils/api.js";
import DotRadarHexChart from "./DotRadarHexChart.jsx";
import { buildBrandVectors } from "./utils/flavorVector.js";
import { initUserVector } from "./utils/recommend.js";
import { loadUserPreferenceVector, subscribeUserPreferenceVector } from "./utils/preferenceStorage.js";

export default function BrandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [brand, setBrand] = useState(null);
  const [brewery, setBrewery] = useState(null);
  const [area, setArea] = useState(null);
  const [tags, setTags] = useState([]);
  const [flavorTags, setFlavorTags] = useState([]);
  const [brandVector, setBrandVector] = useState(null);
  const [userVector, setUserVector] = useState(() => loadUserPreferenceVector() ?? initUserVector(6, 0.5));

  const goBackToList = () => {
    let q = location?.state?.brandListQuery;
    if (typeof q !== "string") {
      try {
        q = sessionStorage.getItem("brandListQuery") ?? "";
      } catch {
        q = "";
      }
    }

    navigate("/brands", {
      state: {
        brandListQuery: q,
        disableRouteFade: true,
      },
    });
  };

  useEffect(() => {
    const unsub = subscribeUserPreferenceVector(next => {
      setUserVector(next ?? initUserVector(6, 0.5));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const el = document.getElementById("stage-ui");
    if (el) el.scrollTop = 0;
  }, [id]);

  useEffect(() => {
    (async () => {
      const data = await fetchAllSakeData({ includeFlavorCharts: true });
      const brandsArr = Array.isArray(data?.brands) ? data.brands : [];
      const breweriesArr = Array.isArray(data?.breweries) ? data.breweries : [];
      const areasArr = Array.isArray(data?.areas) ? data.areas : [];
      const tagsArr = Array.isArray(data?.tags) ? data.tags : [];
      const brandFlavorTagsArr = Array.isArray(data?.brandFlavorTags) ? data.brandFlavorTags : [];

      const b = brandsArr.find(x => String(x.id) === String(id));
      setBrand(b);

      const { vectorByBrandId } = buildBrandVectors(data?.flavorCharts);
      setBrandVector(vectorByBrandId.get(String(b?.id)) ?? null);

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
    <div className="brand-detail-page">
      <div className="brand-detail-panel">
        <button className="nav-btn nav-btn-black brand-detail-back-fixed" type="button" onClick={goBackToList}>
          ← 一覧に戻る
        </button>
        <h2>{brand.name}</h2>
        <p>
          蔵元: {brewery ? (
            <Link className="brewery-link" to={`/brewery/${brewery.id}`}>
              {brewery.name}
            </Link>
          ) : (
            "不明"
          )}
        </p>
        <p>地域: {area ? area.name : "不明"}</p>
        <p>フレーバータグ: {flavorTags.length ? flavorTags.join(" / ") : "なし"}</p>

        <div className="radar-compare">
          <div className="radar-card">
            <div className="radar-title">銘柄</div>
            <DotRadarHexChart
              className="radar-chart radar-brand"
              values={brandVector ?? initUserVector(6, 0.5)}
              color="#1a1a1a"
              fillOpacity={0.12}
              outerColor="rgba(0,0,0,0.32)"
            />
          </div>
          <div className="radar-card">
            <div className="radar-title">あなたの好み</div>
            <DotRadarHexChart
              className="radar-chart radar-user"
              values={userVector ?? initUserVector(6, 0.5)}
              color="#b42323"
              fillOpacity={0.16}
              outerColor="rgba(0,0,0,0.32)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}