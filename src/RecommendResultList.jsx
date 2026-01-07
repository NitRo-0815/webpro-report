import React from "react";
import { Link } from "react-router-dom";

export default function RecommendResultList({ answers, results, allData, onBack }) {
  return (
    <div>
      <h2>あなたにおすすめのお酒</h2>
      <ul>
        {results.length === 0 && <li>該当するお酒がありませんでした</li>}
        {results.map(sake => (
          <li key={sake.id}>
            <Link to={`/brand/${sake.id}`}>{sake.name}</Link>
          </li>
        ))}
      </ul>
      <button onClick={onBack}>質問に戻る</button>
    </div>
  );
}