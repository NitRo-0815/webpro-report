import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchAllSakeData } from "./utils/api.js";
import menuTopImg from "./images/menu_top.png";
import menuMidImg from "./images/menu_mid.png";
import menuBotImg from "./images/menu_bot.png";

export default function BrandList() {
  const location = useLocation();
  const [brands, setBrands] = useState([]);
  const [breweries, setBreweries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(() => {
    const fromNav = location?.state?.brandListQuery;
    if (typeof fromNav === "string") return fromNav;
    const saved = sessionStorage.getItem("brandListQuery");
    return saved ?? "";
  });

  useEffect(() => {
    let canceled = false;
    setIsLoading(true);
    fetchAllSakeData({ includeFlavorCharts: false })
      .then(data => {
        if (canceled) return;
        setBrands(Array.isArray(data?.brands) ? data.brands : []);
        setBreweries(Array.isArray(data?.breweries) ? data.breweries : []);
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("brandListQuery", query);
  }, [query]);

  useEffect(() => {
    const raw = sessionStorage.getItem("brandListScrollY");
    const y = raw == null ? null : Number(raw);
    if (!Number.isFinite(y)) return;
    const restore = () => {
      window.scrollTo(0, y);
    };
    requestAnimationFrame(restore);
    setTimeout(restore, 50);
  }, []);

  const breweryNameById = useMemo(() => {
    const map = new Map();
    for (const b of Array.isArray(breweries) ? breweries : []) {
      map.set(String(b.id), String(b.name ?? ""));
    }
    return map;
  }, [breweries]);

  const normalize = s => String(s ?? "").normalize("NFKC").toLowerCase().trim();

  const filteredBrands = useMemo(() => {
    const q = normalize(query);
    if (!q) return brands;

    return (Array.isArray(brands) ? brands : []).filter(brand => {
      const name = normalize(brand?.name);
      const breweryName = normalize(breweryNameById.get(String(brand?.breweryId)));
      const kana = normalize(brand?.kana ?? brand?.furigana ?? brand?.nameKana);
      return name.includes(q) || breweryName.includes(q) || (kana && kana.includes(q));
    });
  }, [brands, breweryNameById, query]);

  const saveScroll = () => {
    sessionStorage.setItem("brandListScrollY", String(window.scrollY ?? 0));
  };

  return (
    <div className="brands-page brand-list-page">
      <div className="menu-frame">
        <div className="menu-top-wrap">
          <img className="menu-top" src={menuTopImg} alt="" />

          <div className="menu-top-title" aria-hidden>
            <div className="menu-top-title-main">銘柄一覧</div>
            <div className="menu-top-title-sub">MENU</div>
          </div>
        </div>

        <div
          className="menu-mid"
          style={{
            backgroundImage: `url(${menuMidImg})`,
          }}
        >
          <div className="menu-mid-inner">
            <div className="brand-search-row">
              <input
                className="brand-search"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="銘柄名・蔵元名で検索"
              />
            </div>
            <ul className="brand-list brand-list-big menu-list">
              {isLoading ? (
                <li className="brand-empty">読み込み中...</li>
              ) : filteredBrands.length === 0 ? (
                <li className="brand-empty">該当する銘柄がありません</li>
              ) : (
                filteredBrands.map(brand => (
                  <li key={brand.id}>
                    <Link
                      to={`/brand/${brand.id}`}
                      state={{
                        backTo: {
                          pathname: "/brands",
                          state: {
                            brandListQuery: query,
                            disableRouteFade: true,
                          },
                        },
                      }}
                      onClick={saveScroll}
                    >
                      {brand.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        <div className="menu-bottom-wrap">
          <img className="menu-bottom" src={menuBotImg} alt="" />

        </div>
      </div>
    </div>
  );
}