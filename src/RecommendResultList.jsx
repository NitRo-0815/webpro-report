import React from "react";
import { Link } from "react-router-dom";
import menuTopImg from "./images/menu_top.png";
import menuMidImg from "./images/menu_mid.png";
import menuBotImg from "./images/menu_bot.png";

export default function RecommendResultList({ answers, results, allData, onBack }) {
  const saveScroll = () => {
    const el = document.getElementById("stage-ui");
    const stageTop = el ? el.scrollTop : 0;
    const winTop = window.scrollY ?? 0;

    const container = el && stageTop > 0 ? "stage" : winTop > 0 ? "window" : "stage";
    try {
      sessionStorage.setItem("recommendScrollContainer", container);
      sessionStorage.setItem("recommendScrollTop_stage", String(stageTop ?? 0));
      sessionStorage.setItem("recommendScrollTop_window", String(winTop ?? 0));
    } catch {
      // ignore
    }
  };

  return (
    <div className="brands-page recommend-result-page">
      <button className="nav-btn menu-fixed-back" onClick={onBack} type="button">
        トップに戻る
      </button>

      <div className="menu-frame">
        <div className="menu-top-wrap">
          <img className="menu-top" src={menuTopImg} alt="" />
          <div className="menu-top-title" aria-hidden>
            <div className="menu-top-title-main">本日のおすすめ</div>
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
            <ul className="menu-list">
              {results.length === 0 && <li>該当するお酒がありませんでした</li>}
              {results.map(sake => (
                <li key={sake.id}>
                  <Link
                    to={`/brand/${sake.id}`}
                    state={{
                      backTo: {
                        pathname: "/",
                        state: { restoreRecommend: true },
                      },
                    }}
                    onClick={saveScroll}
                  >
                    {sake.name}
                  </Link>
                </li>
              ))}
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