import React, { useMemo } from "react";

const DEFAULT_LABELS = ["華やか", "芳醇", "重厚", "穏やか", "軽快", "ドライ"];

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function snapToGrid(n, grid) {
  return Math.round(n / grid) * grid;
}

// 正六角形の頂点（6点）を中心 c と半径 r から計算する
// 角度は「上」を起点(-90度)として時計回り
function hexVertices(c, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
    pts.push({ x: c + Math.cos(a) * r, y: c + Math.sin(a) * r });
  }
  return pts;
}

// 線分(p1->p2)をドット列(rect)に変換する
// - stepはドット間隔（=ドットサイズ）
// - 座標はstep単位にスナップして荒さを安定させる
function lineToDots(p1, p2, step) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (!Number.isFinite(len) || len <= 0) {
    const x = snapToGrid(p1.x, step);
    const y = snapToGrid(p1.y, step);
    return [{ x, y }];
  }

  const count = Math.max(1, Math.floor(len / step));
  const seen = new Set();
  const out = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = snapToGrid(p1.x + dx * t, step);
    const y = snapToGrid(p1.y + dy * t, step);
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ x, y });
  }

  return out;
}

function polylineDots(points, step) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    out.push(...lineToDots(a, b, step));
  }
  return out;
}

function dedupeDots(dots) {
  const seen = new Set();
  const out = [];
  for (const d of dots) {
    const key = `${d.x},${d.y},${d.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

function normalizeValues(values) {
  // values: array(6) | object
  // objectの場合は以下を優先
  // - f1..f6
  // - index(0..5)
  const out = Array(6).fill(0);

  if (Array.isArray(values)) {
    for (let i = 0; i < 6; i++) {
      const n = Number(values[i]);
      out[i] = Number.isFinite(n) ? clamp01(n) : 0;
    }
    return out;
  }

  if (values && typeof values === "object") {
    for (let i = 0; i < 6; i++) {
      const key = `f${i + 1}`;
      const raw = values[key] ?? values[i];
      const n = Number(raw);
      out[i] = Number.isFinite(n) ? clamp01(n) : 0;
    }
    return out;
  }

  return out;
}

export default function DotRadarHexChart({
  values,
  size = 260,
  color = "#b42323",
  fillOpacity = 0.18,
  outerColor = "rgba(0,0,0,0.32)",
  labels = DEFAULT_LABELS,
  levels = 5,
  className,
}) {
  const dataDotSize = 4;
  const outerDotSize = 3;
  const gridDotSize = 2;
  const axisDotSize = 2;

  const c = size / 2;
  const r = size * 0.32;

  const safeValues = useMemo(() => normalizeValues(values), [values]);

  const safeLabels = useMemo(() => {
    const l = Array.isArray(labels) ? labels : [];
    return Array.from({ length: 6 }, (_, i) => String(l[i] ?? DEFAULT_LABELS[i] ?? ""));
  }, [labels]);

  const geom = useMemo(() => {
    const outer = hexVertices(c, r);

    const rings = [];
    for (let lv = 1; lv <= levels; lv++) {
      const t = lv / levels;
      rings.push(hexVertices(c, r * t));
    }

    const axes = outer.map(p => ({ a: { x: c, y: c }, b: p }));

    const dataPoly = safeValues.map((v, i) => {
      const a = -Math.PI / 2 + (i * (Math.PI * 2)) / 6;
      return { x: c + Math.cos(a) * r * v, y: c + Math.sin(a) * r * v };
    });

    const labelPoints = outer.map((p, i) => {
      // ラベルは少し外側へ
      const dx = p.x - c;
      const dy = p.y - c;
      const x = c + dx * 1.18;
      const y = c + dy * 1.18;
      return { x, y, i };
    });

    return { outer, rings, axes, dataPoly, labelPoints };
  }, [c, r, safeValues, levels]);

  const dots = useMemo(() => {
    const out = [];

    // 外枠（ドット大きめ）
    for (const p of polylineDots(geom.outer, outerDotSize)) {
      out.push({ x: p.x, y: p.y, size: outerDotSize, kind: "outer" });
    }

    // 補助線（同心六角形）
    for (const ring of geom.rings) {
      for (const p of polylineDots(ring, gridDotSize)) {
        out.push({ x: p.x, y: p.y, size: gridDotSize, kind: "grid" });
      }
    }

    // 軸
    for (const ax of geom.axes) {
      for (const p of lineToDots(ax.a, ax.b, axisDotSize)) {
        out.push({ x: p.x, y: p.y, size: axisDotSize, kind: "axis" });
      }
    }

    // データ輪郭（ドット）
    for (const p of polylineDots(geom.dataPoly, dataDotSize)) {
      out.push({ x: p.x, y: p.y, size: dataDotSize, kind: "data" });
    }

    return dedupeDots(out);
  }, [geom.axes, geom.dataPoly, geom.outer, geom.rings]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="hex radar chart"
    >
      {/* 塗り（ベタ。ドット化しない） */}
      <polygon
        points={geom.dataPoly.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill={color}
        fillOpacity={fillOpacity}
      />

      {/* ドット線群 */}
      {dots.map((d, idx) => {
        const fill =
          d.kind === "data"
            ? color
            : d.kind === "outer"
              ? outerColor
              : d.kind === "axis"
                ? "rgba(0,0,0,0.35)"
                : "rgba(0,0,0,0.22)";

        return <rect key={idx} x={d.x} y={d.y} width={d.size} height={d.size} fill={fill} />;
      })}

      {/* ラベル */}
      {geom.labelPoints.map(p => {
        const textAnchor = p.x < c - 6 ? "end" : p.x > c + 6 ? "start" : "middle";
        const dy = p.y < c ? "-0.25em" : "0.9em";
        return (
          <text
            key={p.i}
            className="dot-radar-label"
            x={p.x}
            y={p.y}
            textAnchor={textAnchor}
            dy={dy}
          >
            {safeLabels[p.i]}
          </text>
        );
      })}
    </svg>
  );
}
