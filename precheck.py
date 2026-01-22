#!/usr/bin/env python3
"""Clustering precheck visualization tool.

Reads a single CSV with columns:
  id, name(optional), cluster, feat_0..feat_{D-1}

Outputs images and an outlier list under --outdir:
  - scatter_pca.png
  - scatter_tsne.png (optional)
  - cluster_hist.png
  - outliers.csv

Dependencies:
  numpy, pandas, matplotlib, scikit-learn

"""

import argparse
import os
import sys
from typing import List, Tuple

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.decomposition import PCA
from sklearn.manifold import TSNE


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Clustering precheck visualization tool")
    p.add_argument("--input", required=True, help="Input CSV path")
    p.add_argument("--outdir", default="results", help="Output directory (default: results)")
    p.add_argument("--p_outlier", type=float, default=5.0, help="Outlier top p%% per cluster (default: 5)")
    p.add_argument("--do_tsne", action="store_true", help="Generate t-SNE scatter plot")
    p.add_argument("--tsne_perplexity", type=float, default=30.0, help="t-SNE perplexity (default: 30)")
    p.add_argument("--tsne_random_state", type=int, default=42, help="t-SNE random_state (default: 42)")
    p.add_argument(
        "--open",
        action="store_true",
        help="Open the output folder after finishing (Windows: Explorer / macOS: Finder)",
    )
    return p.parse_args()


def ensure_outdir(outdir: str) -> None:
    os.makedirs(outdir, exist_ok=True)


def find_feature_columns(df: pd.DataFrame) -> List[str]:
    feat_cols = [c for c in df.columns if c.startswith("feat_")]

    def key(c: str):
        try:
            return int(c.split("_", 1)[1])
        except Exception:
            return c

    feat_cols.sort(key=key)
    return feat_cols


def load_and_validate_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)

    required = {"id", "cluster"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")

    feat_cols = find_feature_columns(df)
    if not feat_cols:
        raise ValueError("No feature columns found. Expect columns like feat_0, feat_1, ...")

    return df


def drop_rows_with_nan(df: pd.DataFrame, feat_cols: List[str]) -> pd.DataFrame:
    before = len(df)
    mask = df[feat_cols].isna().any(axis=1)
    dropped = int(mask.sum())
    if dropped > 0:
        print(f"[WARN] Dropping rows with NaN in features: {dropped}/{before}", file=sys.stderr)
    return df.loc[~mask].copy()


def extract_arrays(df: pd.DataFrame, feat_cols: List[str]) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    ids = df["id"].astype(str).to_numpy()

    if "name" in df.columns:
        names = df["name"].astype(str).to_numpy()
    else:
        names = np.array([""] * len(df), dtype=object)

    labels = pd.to_numeric(df["cluster"], errors="coerce")
    if labels.isna().any():
        bad = int(labels.isna().sum())
        raise ValueError(f"cluster column has non-numeric values in {bad} rows.")
    labels = labels.astype(int).to_numpy()

    X = df[feat_cols].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=float)
    if np.isnan(X).any():
        raise ValueError("Found NaN in feature matrix after numeric coercion. Please clean the CSV.")

    return X, labels, ids, names


def label_to_colors(labels: np.ndarray) -> np.ndarray:
    unique = np.unique(labels)
    cmap = plt.get_cmap("tab20")
    color_map = {lab: cmap(i % 20) for i, lab in enumerate(unique)}
    return np.array([color_map[lab] for lab in labels])


def plot_scatter(points2d: np.ndarray, labels: np.ndarray, title: str, outpath: str) -> None:
    colors = label_to_colors(labels)

    plt.figure(figsize=(10, 8))
    plt.scatter(points2d[:, 0], points2d[:, 1], c=colors, s=18, alpha=0.85, linewidths=0)
    plt.title(title)
    plt.xlabel("dim1")
    plt.ylabel("dim2")

    unique = np.unique(labels)
    for lab in unique:
        idx = labels == lab
        plt.scatter([], [], c=[colors[idx][0]], s=40, label=f"cluster {lab}")
    plt.legend(loc="best", fontsize=9, frameon=True, ncols=2)

    plt.tight_layout()
    plt.savefig(outpath, dpi=160)
    plt.close()


def plot_cluster_hist(labels: np.ndarray, outpath: str) -> None:
    unique, counts = np.unique(labels, return_counts=True)
    order = np.argsort(unique)
    unique = unique[order]
    counts = counts[order]

    plt.figure(figsize=(10, 5))
    plt.bar([str(x) for x in unique], counts, color="gray", alpha=0.85)
    plt.title("Cluster counts")
    plt.xlabel("cluster")
    plt.ylabel("count")
    plt.tight_layout()
    plt.savefig(outpath, dpi=160)
    plt.close()


def compute_outliers(
    X: np.ndarray,
    labels: np.ndarray,
    ids: np.ndarray,
    names: np.ndarray,
    p_outlier: float,
) -> pd.DataFrame:
    if not (0.0 < p_outlier < 100.0):
        raise ValueError("--p_outlier must be in (0, 100)")

    rows = []
    unique = np.unique(labels)

    for lab in unique:
        idx = np.where(labels == lab)[0]
        Xc = X[idx]
        centroid = Xc.mean(axis=0)

        dists = np.linalg.norm(Xc - centroid, axis=1)

        order = np.argsort(dists)
        ranks = np.empty_like(order)
        ranks[order] = np.arange(len(dists))

        if len(dists) == 1:
            percentiles = np.array([100.0])
        else:
            percentiles = ranks / (len(dists) - 1) * 100.0

        thresh = 100.0 - p_outlier
        out_mask = percentiles >= thresh

        for local_i, is_out in enumerate(out_mask):
            if not is_out:
                continue
            global_i = idx[local_i]
            rows.append(
                {
                    "id": ids[global_i],
                    "name": names[global_i],
                    "cluster": int(lab),
                    "dist_to_centroid": float(dists[local_i]),
                    "percentile": float(percentiles[local_i]),
                }
            )

    df_out = pd.DataFrame(rows)
    if not df_out.empty:
        df_out = df_out.sort_values(["cluster", "percentile", "dist_to_centroid"], ascending=[True, False, False])
    return df_out


def open_outdir(path: str) -> None:
    # Best-effort (site-non-display dev tool).
    try:
        if sys.platform.startswith("win"):
            os.startfile(os.path.abspath(path))  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            os.system(f'open "{os.path.abspath(path)}"')
        else:
            os.system(f'xdg-open "{os.path.abspath(path)}"')
    except Exception:
        pass


def main() -> int:
    args = parse_args()
    ensure_outdir(args.outdir)

    df = load_and_validate_csv(args.input)
    feat_cols = find_feature_columns(df)
    df = drop_rows_with_nan(df, feat_cols)

    if len(df) == 0:
        print("[ERROR] No rows left after dropping NaNs.", file=sys.stderr)
        return 2

    X, labels, ids, names = extract_arrays(df, feat_cols)

    # PCA (required)
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X)
    scatter_pca_path = os.path.join(args.outdir, "scatter_pca.png")
    plot_scatter(X_pca, labels, "PCA scatter (colored by cluster)", scatter_pca_path)

    # t-SNE (optional)
    if args.do_tsne:
        tsne = TSNE(
            n_components=2,
            init="pca",
            learning_rate="auto",
            perplexity=float(args.tsne_perplexity),
            random_state=int(args.tsne_random_state),
        )
        X_tsne = tsne.fit_transform(X)
        scatter_tsne_path = os.path.join(args.outdir, "scatter_tsne.png")
        plot_scatter(X_tsne, labels, "t-SNE scatter (colored by cluster)", scatter_tsne_path)

    hist_path = os.path.join(args.outdir, "cluster_hist.png")
    plot_cluster_hist(labels, hist_path)

    outliers = compute_outliers(X, labels, ids, names, args.p_outlier)
    outliers_path = os.path.join(args.outdir, "outliers.csv")
    outliers.to_csv(outliers_path, index=False, encoding="utf-8-sig")

    print("[OK] Saved:")
    print(f"  - {scatter_pca_path}")
    if args.do_tsne:
        print(f"  - {os.path.join(args.outdir, 'scatter_tsne.png')}")
    print(f"  - {hist_path}")
    print(f"  - {outliers_path}")
    print(f"[INFO] Rows used: {len(X)} | dims: {X.shape[1]} | clusters: {len(np.unique(labels))}")

    if args.open:
        open_outdir(args.outdir)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
