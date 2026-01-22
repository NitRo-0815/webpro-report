import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MultiStepQuestionnaire from "./MultiStepQuestionnaire.jsx";
import RecommendResultList from "./RecommendResultList.jsx";
import Stage from "./Stage.jsx";
import FadeOverlay from "./FadeOverlay.jsx";
import { buildBrandVectors } from "./utils/flavorVector.js";
import { kmeans } from "./utils/kmeans.js";
import { recommendAllFromCluster, userVectorFromAnswers } from "./utils/recommend.js";
import { fetchAllSakeData } from "./utils/api.js";
import { saveUserPreferenceVector } from "./utils/preferenceStorage.js";

// function toPrecheckCsv({ brands, points, assignments }) {
//   const brandById = new Map((Array.isArray(brands) ? brands : []).map(b => [String(b.id), b]));
//   const header = ["id", "name", "cluster", "feat_0", "feat_1", "feat_2", "feat_3", "feat_4", "feat_5"].join(",");
//   const lines = [header];

//   for (let i = 0; i < points.length; i++) {
//     const p = points[i];
//     const brand = brandById.get(String(p.id));
//     const name = brand?.name ?? "";
//     const cluster = assignments?.[i] ?? -1;
//     const v = Array.isArray(p?.vector) ? p.vector : [];
//     const feats = [0, 1, 2, 3, 4, 5].map(idx => {
//       const n = Number(v[idx]);
//       return Number.isFinite(n) ? String(n) : "";
//     });

//     const esc = s => `"${String(s).replaceAll('"', '""')}"`;
//     lines.push([esc(p.id), esc(name), String(cluster), ...feats].join(","));
//   }

//   return lines.join("\n");
// }

export default function RecommendSake() {
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);

  const [allData, setAllData] = useState(null);
  const [clusterModel, setClusterModel] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [pendingRestoreScroll, setPendingRestoreScroll] = useState(false);
  const [fadeOpen, setFadeOpen] = useState(false);
  const pendingStepRef = useRef(null);
  const pendingActionRef = useRef(null);

  useEffect(() => {
    const forceTop = !!location?.state?.forceTop;
    if (forceTop) {
      try {
        sessionStorage.removeItem("recommendStep");
        sessionStorage.removeItem("recommendAnswers");
        sessionStorage.removeItem("recommendResults");

        sessionStorage.removeItem("recommendScrollContainer");
        sessionStorage.removeItem("recommendScrollTop_stage");
        sessionStorage.removeItem("recommendScrollTop_window");
      } catch {
        // ignore
      }
      setAnswers({});
      setResults([]);
      setPendingRestoreScroll(false);
      pendingStepRef.current = null;
      pendingActionRef.current = null;
      setFadeOpen(false);
      setStep(1);
      return;
    }

    const shouldRestoreFromNav = !!location?.state?.restoreRecommend;
    const savedStep = sessionStorage.getItem("recommendStep");
    const shouldRestoreFromStorage = savedStep === "2";
    if (!shouldRestoreFromNav && !shouldRestoreFromStorage) return;

    try {
      const rawResults = sessionStorage.getItem("recommendResults");
      const rawAnswers = sessionStorage.getItem("recommendAnswers");
      const restoredResults = rawResults ? JSON.parse(rawResults) : [];
      const restoredAnswers = rawAnswers ? JSON.parse(rawAnswers) : {};

      if (Array.isArray(restoredResults)) {
        setResults(restoredResults);
        if (restoredAnswers && typeof restoredAnswers === "object") setAnswers(restoredAnswers);
        setStep(2);
        setPendingRestoreScroll(true);
      }
    } catch {
      // ignore
    }
  }, [location?.key]);

  useEffect(() => {
    if (!pendingRestoreScroll) return;
    if (step !== 2) return;

    const container = sessionStorage.getItem("recommendScrollContainer") || "stage";
    const stageTop = Number(sessionStorage.getItem("recommendScrollTop_stage") ?? "0");
    const winTop = Number(sessionStorage.getItem("recommendScrollTop_window") ?? "0");

    const restore = () => {
      const el = document.getElementById("stage-ui");
      if (container === "window") {
        if (Number.isFinite(winTop)) window.scrollTo(0, winTop);
        if (el && Number.isFinite(stageTop)) el.scrollTop = stageTop;
      } else {
        if (el && Number.isFinite(stageTop)) el.scrollTop = stageTop;
        if (Number.isFinite(winTop)) window.scrollTo(0, winTop);
      }
    };

    requestAnimationFrame(restore);
    setTimeout(restore, 50);
    setTimeout(restore, 250);
    setPendingRestoreScroll(false);
  }, [pendingRestoreScroll, step, results.length]);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);

    (async () => {
      try {
        const data = await fetchAllSakeData();
        if (cancelled) return;
        setAllData(data);

        const { points } = buildBrandVectors(data?.flavorCharts);
        if (points.length > 0) {
          const k = Math.max(2, Math.min(20, Math.round(Math.sqrt(points.length / 2))));
          const { centroids, assignments } = kmeans(points, k, { maxIterations: 50 });
          setClusterModel({ points, centroids, assignments, k });

          // try {
          //   const csv = toPrecheckCsv({ brands: data?.brands, points, assignments });
          //   sessionStorage.setItem("precheckClusterCsv", csv);
          // } catch {
          //   // ignore
          // }
        } else {
          setClusterModel(null);
        }
      } catch {
        if (!cancelled) {
          setAllData(null);
          setClusterModel(null);
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const questions = [
    {
      id: "pairing",
      title: "今日は、何に合わせてお酒を選びましょうか。",
      options: [
        { value: "食事と一緒に", label: "食事と一緒に" },
        { value: "デザートと一緒に", label: "デザートと一緒に" },
        { value: "おつまみと一緒に", label: "おつまみと一緒に" },
        { value: "そのまま", label: "そのまま" },
      ],
    },
    {
      id: "rice_detail",
      title: "お料理は、どんなものを召し上がりますか。",
      showIf: answers => answers?.pairing === "食事と一緒に",
      options: [
        { value: "肉系", label: "肉系" },
        { value: "魚系", label: "魚系" },
        { value: "野菜・あっさり", label: "野菜・あっさり" },
      ],
    },
    {
      id: "dessert_detail",
      title: "甘いものは、どんなものを召し上がりますか。",
      showIf: answers => answers?.pairing === "デザートと一緒に",
      options: [
        { value: "フルーツやショートケーキなど", label: "フルーツやショートケーキなど" },
        { value: "チョコレート系", label: "チョコレート系スイーツ" },
        { value: "和菓子", label: "和菓子" },
      ],
    },
    {
      id: "sweet_dry",
      title: "甘口と辛口でしたら、どちらがお好みですか。",
      options: [
        { value: "甘口がいい", label: "甘口がいい" },
        { value: "どちらでもない", label: "どちらでもない" },
        { value: "辛口がいい", label: "辛口がいい" },
      ],
    },
    {
      id: "richness",
      title: "味わいの印象はどれがお好みでしょうか。",
      options: [
        { value: "軽い", label: "軽い" },
        { value: "バランス", label: "バランス" },
        { value: "濃い", label: "濃い" },
      ],
    },
    {
      id: "aroma",
      title: "香りは、どんなタイプがお好きですか？",
      options: [
        { value: "華やか", label: "華やか" },
        { value: "穏やか", label: "穏やか" },
      ],
    },
  ];

  if (step !== 1 && step !== 2) return null;

  return (
    <Stage showScene={step === 1}>
      {step === 1 ? (
        <MultiStepQuestionnaire
          questions={questions}
          introText="いらっしゃいませ"
          initialAnswers={answers}
          onCancel={() => setStep(1)}
          onComplete={async ans => {
            setAnswers(ans);

            try {
              saveUserPreferenceVector(userVectorFromAnswers(ans, 6));
            } catch {
              // ignore
            }
            let data = allData;
            let model = clusterModel;

            if (!data) {
              data = await fetchAllSakeData();
              setAllData(data);
            }

            if (!model) {
              const { points } = buildBrandVectors(data?.flavorCharts);
              if (points.length > 0) {
                const k = Math.max(2, Math.min(20, Math.round(Math.sqrt(points.length / 2))));
                const { centroids, assignments } = kmeans(points, k, { maxIterations: 50 });
                model = { points, centroids, assignments, k };
                setClusterModel(model);
              }
            }

            let nextResults = [];
            if (model?.points?.length > 0 && Array.isArray(data?.brands)) {
              const rec = recommendAllFromCluster({
                answers: ans,
                brands: data.brands,
                points: model.points,
                centroids: model.centroids,
                assignments: model.assignments,
              });
              nextResults = rec.results;
            }

            if (nextResults.length === 0) {
              nextResults = recommendSakes(ans, data);
            }

            setResults(nextResults);
            try {
              sessionStorage.setItem("recommendStep", "2");
              sessionStorage.setItem("recommendAnswers", JSON.stringify(ans ?? {}));
              sessionStorage.setItem("recommendResults", JSON.stringify(nextResults ?? []));
            } catch {
              // ignore
            }

            pendingStepRef.current = 2;
            pendingActionRef.current = null;
            setFadeOpen(true);
          }}
        />
      ) : (
        <RecommendResultList
          answers={answers}
          results={results}
          allData={allData}
          onBack={() => {
            pendingStepRef.current = 1;
            pendingActionRef.current = () => {
              try {
                sessionStorage.removeItem("recommendStep");
                sessionStorage.removeItem("recommendAnswers");
                sessionStorage.removeItem("recommendResults");
                sessionStorage.removeItem("recommendScrollContainer");
                sessionStorage.removeItem("recommendScrollTop_stage");
                sessionStorage.removeItem("recommendScrollTop_window");
              } catch {
                // ignore
              }
            };
            setFadeOpen(true);
          }}
        />
      )}

      <FadeOverlay
        open={fadeOpen}
        mode="outIn"
        duration={600}
        onFadeOutComplete={() => {
          if (pendingStepRef.current != null) setStep(pendingStepRef.current);
          if (typeof pendingActionRef.current === "function") pendingActionRef.current();
        }}
        onComplete={() => {
          pendingStepRef.current = null;
          pendingActionRef.current = null;
          setFadeOpen(false);
        }}
      />
    </Stage>
  );
}

// 簡易スコアリング例（実際は要調整）
function recommendSakes(ans, data) {
  // タグ名ベースで定義（API側のタグID変更に強くする）
  const situationTagNames = {
    "ごはん": ["旨味", "辛口", "スッキリ"],
    "デザート": ["フルーティ", "甘味", "酸味"],
    "乾杯": ["フルーティ", "スッキリ", "酸味"],
    "一人でゆっくり": ["旨味", "酸味"],
    "おつまみ": ["スッキリ", "辛口", "酸味"],
  };
  const typeTagNames = {
    "しっかり": ["旨味"],
    "スッキリ": ["スッキリ"],
    "甘め": ["甘味", "フルーティ"],
    "香り重視": ["フルーティ"],
    "飲みやすさ": ["スッキリ", "フルーティ"],
    "個性・深み": ["旨味"],
  };

  // tagId→tagName
  const tagMap = {};
  const tags = Array.isArray(data?.tags) ? data.tags : [];
  tags.forEach(t => {
    tagMap[t.id] = t.tag;
  });

  // tagName -> tagId（同名が複数あるケースは想定しない）
  const tagNameToId = {};
  tags.forEach(t => {
    tagNameToId[t.tag] = t.id;
  });

  const resolveTagIdsFromNames = names => {
    return (names || [])
      .map(name => tagNameToId[name])
      .filter(id => typeof id === "number");
  };

  // brandId→tagId[]
  const brandTagMap = {};
  const brandFlavorTags = Array.isArray(data?.brandFlavorTags) ? data.brandFlavorTags : [];
  brandFlavorTags.forEach(e => {
    const key = String(e.brandId);
    const rawIds =
      e.tagIds ??
      e.flavorTagIds ??
      e.flavor_tags ??
      Object.values(e).find(v => Array.isArray(v)) ??
      [];
    const ids = Array.isArray(rawIds) ? rawIds.map(Number).filter(Number.isFinite) : [];
    brandTagMap[key] = ids;
  });

  // スコア付け
  const scored = data.brands.map(b => {
    const tagIds = brandTagMap[String(b.id)] || [];
    let score = 0;

    // シチュエーション一致
    const situationIds = resolveTagIdsFromNames(situationTagNames[ans.situation]);
    for (const id of situationIds) if (tagIds.includes(id)) score += 50;
    // タイプ一致
    const typeIds = resolveTagIdsFromNames(typeTagNames[ans.type]);
    for (const id of typeIds) if (tagIds.includes(id)) score += 20;
    return { ...b, score };
  });

  const fallback = (Array.isArray(data?.brands) ? data.brands : []).slice(0, 3).map(b => ({ ...b, score: 1 }));

  if (brandFlavorTags.length === 0) {
    return fallback;
  }

  const positive = scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (positive.length === 0) {
    return fallback;
  }

  // スコア順で上位3件
  return positive;
}