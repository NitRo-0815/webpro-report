import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";
import { registerSW } from "virtual:pwa-register";

const container = document.getElementById("root");
const root = createRoot(container);

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent("pwa:need-refresh", {
        detail: {
          updateSW,
        },
      })
    );
  },
});

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);