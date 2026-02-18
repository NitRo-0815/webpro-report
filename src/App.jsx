import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import RecommendSake from "./RecommendSake.jsx";
import BrandDetail from "./BrandDetail.jsx";
import BrandList from "./BrandList.jsx";
import BreweryBrandList from "./BreweryBrandList.jsx";
import FadeOverlay from "./FadeOverlay.jsx";
import SimpleLoadingOverlay from "./SimpleLoadingOverlay.jsx";
import logoImg from "./images/logo.png";

export default function App() {
  const location = useLocation();
  const [bootLoading, setBootLoading] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [fadeOpen, setFadeOpen] = useState(false);
  const pendingLocationRef = useRef(null);
  const [pwaNeedRefresh, setPwaNeedRefresh] = useState(false);
  const [pwaUpdateSW, setPwaUpdateSW] = useState(null);

  useEffect(() => {
    let p = 0;
    setBootProgress(0);
    setBootLoading(true);

    const id = setInterval(() => {
      const next = Math.min(100, p + Math.floor(3 + Math.random() * 7));
      p = next;
      setBootProgress(next);
      if (next >= 100) {
        clearInterval(id);
        setBootLoading(false);
      }
    }, 80);

    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (location.key === displayLocation.key) return;

    const disableRouteFade = !!location?.state?.disableRouteFade;
    if (disableRouteFade) {
      pendingLocationRef.current = null;
      setFadeOpen(false);
      setDisplayLocation(location);
      return;
    }

    pendingLocationRef.current = location;
    if (!fadeOpen) setFadeOpen(true);
  }, [displayLocation.key, fadeOpen, location]);

  useEffect(() => {
    const onNeedRefresh = e => {
      const fn = e?.detail?.updateSW;
      if (typeof fn === "function") {
        setPwaUpdateSW(() => fn);
      }
      setPwaNeedRefresh(true);
    };

    window.addEventListener("pwa:need-refresh", onNeedRefresh);
    return () => window.removeEventListener("pwa:need-refresh", onNeedRefresh);
  }, []);

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
            <div className="site-title">
              <span className="site-title-line site-title-line1">あなたにおすすめの日本酒が</span>
              <span className="site-title-line site-title-line2">見つかるサイト</span>
            </div>
          </div>
          <div className="site-header-right">
            <nav className="site-nav">
              <Link className="site-nav-link" to="/" state={{ forceTop: true }}>
                トップ
              </Link>
              <Link className="site-nav-link" to="/brands">
                銘柄一覧
              </Link>
              <button
                className="site-nav-link"
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
              >
                更新
              </button>
              {/* <button className="site-nav-link" type="button" onClick={downloadClusterCsv}>
                クラスタCSV
              </button> */}
            </nav>
          </div>
        </div>
        {pwaNeedRefresh && (
          <div className="pwa-update-bar" role="status" aria-live="polite">
            <div className="pwa-update-text">更新があります</div>
            <div className="pwa-update-actions">
              <button
                className="pwa-update-btn"
                type="button"
                onClick={() => {
                  if (typeof pwaUpdateSW === "function") {
                    pwaUpdateSW(true);
                    return;
                  }
                  window.location.reload();
                }}
              >
                更新する
              </button>
              <button
                className="pwa-update-btn"
                type="button"
                onClick={() => {
                  setPwaNeedRefresh(false);
                }}
              >
                後で
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="app-main">
        <Routes location={displayLocation}>
          <Route path="/" element={<RecommendSake />} />
          <Route path="/brands" element={<BrandList />} />
          <Route path="/brand/:id" element={<BrandDetail />} />
          <Route path="/brewery/:id" element={<BreweryBrandList />} />
        </Routes>
      </div>

      <footer className="app-footer">
        本サイトは <a href="https://sakenowa.com">さけのわデータ</a> を利用しています。
      </footer>

      <nav className="mobile-bottom-nav" aria-label="スマホ用ナビゲーション">
        <Link className="mobile-bottom-nav-link" to="/" state={{ forceTop: true }}>
          トップ
        </Link>
        <Link className="mobile-bottom-nav-link" to="/brands">
          銘柄一覧
        </Link>
        <button
          className="mobile-bottom-nav-link"
          type="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          更新
        </button>
      </nav>

      <FadeOverlay
        open={fadeOpen}
        mode="outIn"
        duration={600}
        onFadeOutComplete={() => {
          if (pendingLocationRef.current) {
            setDisplayLocation(pendingLocationRef.current);
          }
        }}
        onComplete={() => {
          pendingLocationRef.current = null;
          setFadeOpen(false);
        }}
      />

      {bootLoading && <SimpleLoadingOverlay progress={bootProgress} />}
    </div>
  );
}