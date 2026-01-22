import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAllSakeData } from "./utils/api.js";
import menuTopImg from "./images/menu_top.png";
import menuMidImg from "./images/menu_mid.png";
import menuBotImg from "./images/menu_bot.png";

export default function BreweryBrandList() {
  const { id } = useParams();
  const [brands, setBrands] = useState([]);
  const [brewery, setBrewery] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await fetchAllSakeData({ includeFlavorCharts: false });
      const breweriesArr = Array.isArray(data?.breweries) ? data.breweries : [];
      const brandsArr = Array.isArray(data?.brands) ? data.brands : [];

      const br = breweriesArr.find(x => String(x.id) === String(id));
      setBrewery(br || null);
      setBrands(brandsArr);
    })();
  }, [id]);

  const filtered = useMemo(() => {
    return (Array.isArray(brands) ? brands : []).filter(b => String(b?.breweryId) === String(id));
  }, [brands, id]);

  return (
    <div className="brands-page">
      <div className="menu-frame">
        <div className="menu-top-wrap">
          <img className="menu-top" src={menuTopImg} alt="" />

          <div className="menu-top-title" aria-hidden>
            <div className="menu-top-title-main">{brewery?.name ?? "酒蔵"}</div>
            <div className="menu-top-title-sub">銘柄一覧</div>
          </div>
        </div>

        <div
          className="menu-mid"
          style={{
            backgroundImage: `url(${menuMidImg})`,
          }}
        >
          <div className="menu-mid-inner">
            <ul className="brand-list brand-list-big menu-list">
              {filtered.length === 0 ? (
                <li className="brand-empty">該当する銘柄がありません</li>
              ) : (
                filtered.map(brand => (
                  <li key={brand.id}>
                    <Link
                      to={`/brand/${brand.id}`}
                      state={{
                        backTo: {
                          pathname: `/brewery/${id}`,
                          state: {
                            disableRouteFade: true,
                          },
                        },
                      }}
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
