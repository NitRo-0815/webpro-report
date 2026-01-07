import React, { useEffect, useState } from "react";
import MultiStepQuestionnaire from "./MultiStepQuestionnaire.jsx";
import RecommendResultList from "./RecommendResultList.jsx";
import { buildBrandVectors } from "./utils/flavorVector.js";
import { kmeans } from "./utils/kmeans.js";
import { recommendAllFromCluster } from "./utils/recommend.js";
import { fetchAllSakeData } from "./utils/api.js";

export default function RecommendSake() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState(null);
  const [clusterModel, setClusterModel] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

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

  // 質問画面
  if (step === 1) {
    return (
      <MultiStepQuestionnaire
        questions={questions}
        initialAnswers={answers}
        onCancel={() => setStep(1)}
        onComplete={async ans => {
          setAnswers(ans);
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
          setStep(2);
        }}
      />
    );
  }

  // 結果一覧画面
  if (step === 2) {
    return (
      <RecommendResultList
        answers={answers}
        results={results}
        allData={allData}
        onBack={() => setStep(1)}
      />
    );
  }

  return null;
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