import React, { useEffect, useMemo, useRef, useState } from "react";

export default function FadeOverlay({
  open,
  mode = "inOut",
  duration = 600,
  zIndex = 5000,
  onFadeInComplete,
  onFadeOutComplete,
  onComplete,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [phase, setPhase] = useState("idle");
  const phaseRef = useRef("idle");
  const stepRef = useRef("none");
  const stepTimeoutRef = useRef(null);
  const overallTimeoutRef = useRef(null);

  const sequence = useMemo(() => {
    if (mode === "inOut") {
      return {
        step1: { from: 1, to: 0, phase: "fadeIn" },
        step2: { from: 0, to: 1, phase: "fadeOut" },
      };
    }

    return {
      step1: { from: 0, to: 1, phase: "fadeOut" },
      step2: { from: 1, to: 0, phase: "fadeIn" },
    };
  }, [mode]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearStepTimeout = () => {
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
  };

  const clearOverallTimeout = () => {
    if (overallTimeoutRef.current) {
      clearTimeout(overallTimeoutRef.current);
      overallTimeoutRef.current = null;
    }
  };

  const runOpacityTransition = (from, to) => {
    setOpacity(from);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpacity(to);
      });
    });
  };

  useEffect(() => {
    if (!open) {
      clearStepTimeout();
      clearOverallTimeout();
      setIsMounted(false);
      setPhase("idle");
      stepRef.current = "none";
      return;
    }

    setIsMounted(true);
    setPhase(sequence.step1.phase);
    stepRef.current = "step1";

    clearOverallTimeout();
    overallTimeoutRef.current = setTimeout(() => {
      finish();
    }, Math.max(0, duration) * 2 + 400);

    clearStepTimeout();
    stepTimeoutRef.current = setTimeout(() => {
      if (stepRef.current === "step1") finalizeStep("step1");
    }, Math.max(0, duration) + 80);

    runOpacityTransition(sequence.step1.from, sequence.step1.to);

    return () => {
      clearStepTimeout();
      clearOverallTimeout();
    };
  }, [open, sequence, duration]);

  const runStep2 = () => {
    setPhase(sequence.step2.phase);
    stepRef.current = "step2";

    clearStepTimeout();
    stepTimeoutRef.current = setTimeout(() => {
      if (stepRef.current === "step2") finalizeStep("step2");
    }, Math.max(0, duration) + 80);

    runOpacityTransition(sequence.step2.from, sequence.step2.to);
  };

  const finish = () => {
    clearStepTimeout();
    clearOverallTimeout();
    setPhase("idle");
    stepRef.current = "none";
    setIsMounted(false);

    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  const finalizeStep = stepKey => {
    if (!open) return;
    if (stepRef.current !== stepKey) return;

    clearStepTimeout();

    const currentPhase = phaseRef.current;
    if (currentPhase === "fadeIn" && typeof onFadeInComplete === "function") {
      onFadeInComplete();
    }
    if (currentPhase === "fadeOut" && typeof onFadeOutComplete === "function") {
      onFadeOutComplete();
    }

    if (stepKey === "step1") {
      runStep2();
      return;
    }

    if (stepKey === "step2") {
      finish();
    }
  };

  const handleTransitionEnd = e => {
    if (e.propertyName !== "opacity") return;
    if (!open) return;

    const currentStep = stepRef.current;
    if (currentStep === "step1" || currentStep === "step2") {
      finalizeStep(currentStep);
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className="fade-overlay"
      style={{
        opacity,
        zIndex,
        transitionDuration: `${duration}ms`,
      }}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden
    />
  );
}
