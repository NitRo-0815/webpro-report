import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export default function MultiStepQuestionnaire({
  questions,
  initialAnswers,
  onComplete,
  onCancel,
  introText,
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

  const [introDone, setIntroDone] = useState(() => !introText);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({ ...(initialAnswers || {}) }));
  const [history, setHistory] = useState([]);

  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typeTimerRef = useRef(null);
  const introAutoTimerRef = useRef(null);

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

  const current = introDone ? visibleQuestions[currentIndex] : { id: "__intro__", title: introText, options: [] };
  const currentValue = current ? answers[current.id] : undefined;

  const canGoBack = introDone && history.length > 0;
  const isLast = currentIndex >= visibleQuestions.length - 1;

  useLayoutEffect(() => {
    if (!current) return;
    const full = String(current.title ?? "");

    if (introAutoTimerRef.current) {
      clearTimeout(introAutoTimerRef.current);
      introAutoTimerRef.current = null;
    }

    if (typeTimerRef.current) {
      clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }

    setTypedText("");
    setIsTyping(true);

    let i = 0;
    const baseDelayMs = 55;
    const punctuationExtraMs = 220;

    const tick = () => {
      i += 1;
      const next = full.slice(0, i);
      setTypedText(next);

      if (i >= full.length) {
        setIsTyping(false);
        typeTimerRef.current = null;
        return;
      }

      const lastChar = full.charAt(i - 1);
      const extra = /[、。！？]/.test(lastChar) ? punctuationExtraMs : 0;
      typeTimerRef.current = setTimeout(tick, baseDelayMs + extra);
    };

    typeTimerRef.current = setTimeout(tick, baseDelayMs);

    return () => {
      if (typeTimerRef.current) {
        clearTimeout(typeTimerRef.current);
        typeTimerRef.current = null;
      }

      if (introAutoTimerRef.current) {
        clearTimeout(introAutoTimerRef.current);
        introAutoTimerRef.current = null;
      }
    };
  }, [current?.id]);

  useEffect(() => {
    if (introDone) return;
    if (!current) return;
    if (current.id !== "__intro__") return;
    if (isTyping) return;

    if (introAutoTimerRef.current) {
      clearTimeout(introAutoTimerRef.current);
    }

    introAutoTimerRef.current = setTimeout(() => {
      setIntroDone(true);
      introAutoTimerRef.current = null;
    }, 2000);

    return () => {
      if (introAutoTimerRef.current) {
        clearTimeout(introAutoTimerRef.current);
        introAutoTimerRef.current = null;
      }
    };
  }, [introDone, current?.id, isTyping]);

  const revealAll = () => {
    if (!current) return;
    if (!isTyping) return;

    if (typeTimerRef.current) {
      clearTimeout(typeTimerRef.current);
      typeTimerRef.current = null;
    }

    setTypedText(String(current.title ?? ""));
    setIsTyping(false);
  };

  const goBack = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      const last = prev[prev.length - 1];
      setAnswers(last.answers);
      setCurrentIndex(last.index);
      return next;
    });
  };

  const selectOption = value => {
    if (!current) return;
    if (isTyping) return;
    if (!introDone) return;

    const prevSnapshot = { index: currentIndex, answers };
    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);

    setHistory(prev => [...prev, prevSnapshot]);

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
      <div className="dialogue-layout">
        <div className="dialogue-box" onClick={revealAll}>
          <div className="dialogue-header">
            <div className="dialogue-speaker">マスター</div>
            <button
              className="nav-btn"
              onClick={e => {
                e.stopPropagation();
                goBack();
              }}
              disabled={!canGoBack}
            >
              戻る
            </button>
          </div>

          <div className="dialogue-text">{typedText}</div>
        </div>

        {introDone && !isTyping && (
          <div className="choices-panel">
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
        )}
      </div>
    </div>
  );
}
