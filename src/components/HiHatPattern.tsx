import React from "react";

type HiHatPatternProps = {
  pattern: boolean[];
  currentStep: number;
  onToggleStep: (step: number) => void;
};

export function HiHatPattern({
  pattern,
  currentStep,
  onToggleStep,
}: HiHatPatternProps) {
  return (
    <div className="hi-hat-pattern">
      <div className="pattern-label">Hi-Hat Pattern</div>
      <div className="pattern-grid">
        {pattern.map((isActive, step) => (
          <div
            key={step}
            className={`pattern-cell ${isActive ? "active" : ""} ${
              currentStep === step ? "current" : ""
            }`}
            onClick={() => onToggleStep(step)}
            role="button"
            tabIndex={0}
            aria-label={`Hi-hat step ${step + 1}`}
            aria-pressed={isActive}
          />
        ))}
      </div>
    </div>
  );
}
