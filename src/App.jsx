import React from "react";
import { Routes, Route } from "react-router-dom";
import RecommendSake from "./RecommendSake.jsx";
import BrandDetail from "./BrandDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RecommendSake />} />
      <Route path="/brand/:id" element={<BrandDetail />} />
    </Routes>
  );
}