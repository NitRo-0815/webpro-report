import React from "react";

export default function SimpleLoadingOverlay({ progress }) {
  const safe = Math.max(0, Math.min(100, Number(progress) || 0));

  return (
    <div className="simple-loading-overlay" aria-live="polite" aria-busy="true">
      <div className="simple-loading-text">{safe}%</div>
    </div>
  );
}
