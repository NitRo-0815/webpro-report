import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import RecommendSake from "./RecommendSake.jsx";
import BrandDetail from "./BrandDetail.jsx";
import BrandList from "./BrandList.jsx";
import BreweryBrandList from "./BreweryBrandList.jsx";
import logoImg from "./images/logo.png";

export default function App() {
  // const downloadClusterCsv = () => {
  //   try {
  //     const csv = sessionStorage.getItem("precheckClusterCsv");
  //     if (!csv) {
  //       alert("クラスタCSVがまだ生成されていません。トップ画面を一度開いてから再実行してください。");
  //       return;
  //     }

  //     const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "cluster_dump.csv";
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     URL.revokeObjectURL(url);
  //   } catch {
  //     alert("CSVのダウンロードに失敗しました");
  //   }
  // };

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-header-left">
            <Link className="site-brand" to="/" state={{ forceTop: true }}>
              <img className="site-logo" src={logoImg} alt="" />
            </Link>
          </div>
          <div className="site-header-center">
            <div className="site-title">あなたのおすすめの日本酒が見つかるサイト</div>
          </div>
          <div className="site-header-right">
            <nav className="site-nav">
              <Link className="site-nav-link" to="/" state={{ forceTop: true }}>
                トップ
              </Link>
              <Link className="site-nav-link" to="/brands">
                銘柄一覧
              </Link>
              {/* <button className="site-nav-link" type="button" onClick={downloadClusterCsv}>
                クラスタCSV
              </button> */}
            </nav>
          </div>
        </div>
      </header>

      <div className="app-main">
        <Routes>
          <Route path="/" element={<RecommendSake />} />
          <Route path="/brands" element={<BrandList />} />
          <Route path="/brand/:id" element={<BrandDetail />} />
          <Route path="/brewery/:id" element={<BreweryBrandList />} />
        </Routes>
      </div>

      <footer className="app-footer">
        本サイトは <a href="https://sakenowa.com">さけのわデータ</a> を利用しています。
      </footer>
    </div>
  );
}