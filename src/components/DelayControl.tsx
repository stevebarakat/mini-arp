import React, { useEffect } from "react";
import { EFFECT_PARAM_RANGES } from "../constants/sequencer";

type DelayControlProps = {
  delayTime: number;
  feedback: number;
  wet: number;
  onDelayTimeChange: (delayTime: number) => void;
  onFeedbackChange: (feedback: number) => void;
  onWetChange: (wet: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function DelayControl({
  delayTime,
  feedback,
  wet,
  onDelayTimeChange,
  onFeedbackChange,
  onWetChange,
  enabled,
  onToggle,
}: DelayControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("DelayControl received props:", {
      delayTime,
      feedback,
      wet,
      enabled,
    });
  }, [delayTime, feedback, wet, enabled]);

  const handleDelayTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing delay time to:", newValue);
    onDelayTimeChange(newValue);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing feedback to:", newValue);
    onFeedbackChange(newValue);
  };

  const handleWetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing wet mix to:", newValue);
    onWetChange(newValue);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log("Toggling delay:", newValue);
    onToggle(newValue);
  };

  return (
    <div className="effect-control delay-control">
      <div className="effect-header">
        <h3>Delay</h3>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggleChange}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="effect-param">
        <label htmlFor="delay-time">Time:</label>
        <input
          type="range"
          id="delay-time"
          min={EFFECT_PARAM_RANGES.delayTime.min}
          max={EFFECT_PARAM_RANGES.delayTime.max}
          step="0.01"
          value={delayTime}
          onChange={handleDelayTimeChange}
          disabled={!enabled}
        />
        <span>{delayTime.toFixed(2)} s</span>
      </div>

      <div className="effect-param">
        <label htmlFor="delay-feedback">Feedback:</label>
        <input
          type="range"
          id="delay-feedback"
          min={EFFECT_PARAM_RANGES.feedback.min}
          max={EFFECT_PARAM_RANGES.feedback.max}
          step="0.01"
          value={feedback}
          onChange={handleFeedbackChange}
          disabled={!enabled}
        />
        <span>{Math.round(feedback * 100)}%</span>
      </div>

      <div className="effect-param">
        <label htmlFor="delay-wet">Mix:</label>
        <input
          type="range"
          id="delay-wet"
          min={EFFECT_PARAM_RANGES.wet.min}
          max={EFFECT_PARAM_RANGES.wet.max}
          step="0.01"
          value={wet}
          onChange={handleWetChange}
          disabled={!enabled}
        />
        <span>{Math.round(wet * 100)}%</span>
      </div>
    </div>
  );
}
