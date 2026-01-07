import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    safeFetchJson("/sakenowa-data/api/brands").then(data => setBrands(data.brands));
  }, []);
  return (
    <div>
      <h1>銘柄一覧</h1>
      <ul>
        {brands.map(brand => (
          <li key={brand.id}>
            <Link to={`/brand/${brand.id}`}>{brand.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}