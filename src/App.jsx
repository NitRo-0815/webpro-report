import React from "react";
import { Routes, Route } from "react-router-dom";
import RecommendSake from "./RecommendSake.jsx";
import BrandDetail from "./BrandDetail.jsx";

export default function App() {
  return (
    <div className="app">
      <div className="app-main">
        <Routes>
          <Route path="/" element={<RecommendSake />} />
          <Route path="/brand/:id" element={<BrandDetail />} />
        </Routes>
      </div>

      <footer className="app-footer">
        本サイトは <a href="https://sakenowa.com">さけのわデータ</a> を利用しています。
      </footer>
    </div>
  );
}