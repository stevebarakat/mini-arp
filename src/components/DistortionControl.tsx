import React, { useEffect } from "react";
import { EFFECT_PARAM_RANGES } from "../constants/sequencer";

type DistortionControlProps = {
  distortion: number;
  wet: number;
  onDistortionChange: (distortion: number) => void;
  onWetChange: (wet: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function DistortionControl({
  distortion,
  wet,
  onDistortionChange,
  onWetChange,
  enabled,
  onToggle,
}: DistortionControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("DistortionControl received props:", {
      distortion,
      wet,
      enabled,
    });
  }, [distortion, wet, enabled]);

  const handleDistortionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing distortion to:", newValue);
    onDistortionChange(newValue);
  };

  const handleWetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing wet mix to:", newValue);
    onWetChange(newValue);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log("Toggling distortion:", newValue);
    onToggle(newValue);
  };

  return (
    <div className="effect-control distortion-control">
      <div className="effect-header">
        <h3>Distortion</h3>
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
        <label htmlFor="distortion-amount">Amount:</label>
        <input
          type="range"
          id="distortion-amount"
          min={EFFECT_PARAM_RANGES.distortion.min}
          max={EFFECT_PARAM_RANGES.distortion.max}
          step="0.01"
          value={distortion}
          onChange={handleDistortionChange}
          disabled={!enabled}
        />
        <span>{Math.round(distortion * 100)}%</span>
      </div>

      <div className="effect-param">
        <label htmlFor="distortion-wet">Mix:</label>
        <input
          type="range"
          id="distortion-wet"
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
