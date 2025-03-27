import React from "react";

type HiHatPatternProps = {
  pattern: boolean[];
  currentStep: number;
  onToggleStep: (step: number) => void;
  isPlaying: boolean;
};

export function HiHatPattern({
  pattern,
  currentStep,
  onToggleStep,
  isPlaying,
}: HiHatPatternProps) {
  return (
    <div className="hi-hat-grid">
      <div className="grid-header">
        <h3>HI-HAT</h3>
        <div className={`led-indicator ${isPlaying ? "pulsate" : ""}`}></div>
      </div>
      <div className="pattern-container">
        <div className="pattern-row">
          <div className="row-label">H</div>
          <div className="pattern-cells">
            {pattern.map((isActive, step) => (
              <div
                key={step}
                className={`pattern-cell ${isActive ? "selected" : ""} ${
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
      </div>
    </div>
  );
}
