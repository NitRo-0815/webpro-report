import React, { useState } from "react";

export default function RecommendQuestion({ onSubmit }) {
  const [situation, setSituation] = useState("");
  const [type, setType] = useState("");

  const handleSubmit = e => {
    console.log("submit", situation, type);
    e.preventDefault();
    if (situation && type) {
      onSubmit({ situation, type });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>今日は何と一緒に飲みますか？</h2>
      <select value={situation} onChange={e => setSituation(e.target.value)} required>
        <option value="">選択してください</option>
        <option value="ごはん">ごはん</option>
        <option value="デザート">デザート</option>
        <option value="乾杯">乾杯</option>
        <option value="一人でゆっくり">一人でゆっくり</option>
        <option value="おつまみ">おつまみ</option>
      </select>
      <h2>好みのタイプを選んでください</h2>
      <select value={type} onChange={e => setType(e.target.value)} required>
        <option value="">選択してください</option>
        <option value="しっかり">しっかり</option>
        <option value="スッキリ">スッキリ</option>
        <option value="甘め">甘め</option>
        <option value="香り重視">香り重視</option>
        <option value="飲みやすさ">飲みやすさ</option>
        <option value="個性・深み">個性・深み</option>
      </select>
      <button type="submit">おすすめを見る</button>
    </form>
  );
}