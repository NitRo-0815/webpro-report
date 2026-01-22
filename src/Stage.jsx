import React from "react";

import counterImg from "./images/background.png";
import master1Img from "./images/master1.png";
import master2Img from "./images/master2.png";

export default function Stage({ children, showScene = true }) {
  return (
    <div className={showScene ? "stage" : "stage stage-plain"}>
      {showScene && (
        <div className="stage-scene" aria-hidden>
          <img className="stage-layer stage-layer-bg" src={counterImg} alt="" />

          <img
            className="stage-layer stage-layer-master stage-master-frame stage-master-frame1"
            src={master1Img}
            alt=""
          />
          <img
            className="stage-layer stage-layer-master stage-master-frame stage-master-frame2"
            src={master2Img}
            alt=""
          />
        </div>
      )}

      <div className="stage-ui" id="stage-ui">
        {children}
      </div>
    </div>
  );
}
