import React, { useEffect, useMemo, useState } from "react";

export default function MultiStepQuestionnaire({
  questions,
  initialAnswers,
  onComplete,
  onCancel,
}) {
  const normalizedQuestions = useMemo(() => {
    return (Array.isArray(questions) ? questions : []).map(q => ({
      id: q.id,
      title: q.title,
      options: Array.isArray(q.options) ? q.options : [],
      required: q.required !== false,
      showIf: typeof q.showIf === "function" ? q.showIf : null,
    }));
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...(initialAnswers || {}) }));

  const visibleQuestions = useMemo(() => {
    return normalizedQuestions.filter(q => {
      if (!q.showIf) return true;
      try {
        return !!q.showIf(answers);
      } catch {
        return false;
      }
    });
  }, [normalizedQuestions, answers]);

  useEffect(() => {
    if (visibleQuestions.length === 0) return;
    if (currentIndex <= visibleQuestions.length - 1) return;
    setCurrentIndex(visibleQuestions.length - 1);
  }, [visibleQuestions, currentIndex]);

  const current = visibleQuestions[currentIndex];
  const currentValue = current ? answers[current.id] : undefined;

  const canGoBack = currentIndex > 0;
  const isLast = currentIndex >= visibleQuestions.length - 1;

  const goBack = () => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  };

  const selectOption = value => {
    if (!current) return;
    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);

    const nextVisibleQuestions = normalizedQuestions.filter(q => {
      if (!q.showIf) return true;
      try {
        return !!q.showIf(nextAnswers);
      } catch {
        return false;
      }
    });

    const nextIsLast = currentIndex >= nextVisibleQuestions.length - 1;
    if (nextIsLast) {
      onComplete?.(nextAnswers);
      return;
    }

    setCurrentIndex(Math.min(currentIndex + 1, nextVisibleQuestions.length - 1));
  };

  if (!current) return null;

  return (
    <div className="questionnaire">
      <div className="questionnaire-left">
        <div className="question-card">
          <div className="question-title">{current.title}</div>
        </div>

        <div className="question-nav">
          <button className="nav-btn" onClick={goBack} disabled={!canGoBack}>
            戻る
          </button>
        </div>
      </div>

      <div className="questionnaire-right">
        <div className="answer-window">
          <div className="answer-hint">選択してください</div>
          <div className="options-grid">
            {current.options.map(opt => {
              const value = opt.value;
              const label = opt.label ?? String(opt.value);
              const selected = currentValue === value;

              return (
                <button
                  key={String(value)}
                  type="button"
                  className={selected ? "option-btn selected" : "option-btn"}
                  onClick={() => selectOption(value)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
