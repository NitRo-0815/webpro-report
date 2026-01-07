import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBrands } from "./utils/api.js";

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  useEffect(() => {
    getBrands().then(setBrands);
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