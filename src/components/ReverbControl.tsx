import React, { useEffect } from "react";
import { EFFECT_PARAM_RANGES } from "../constants/sequencer";

type ReverbControlProps = {
  decay: number;
  preDelay: number;
  wet: number;
  onDecayChange: (decay: number) => void;
  onPreDelayChange: (preDelay: number) => void;
  onWetChange: (wet: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function ReverbControl({
  decay,
  preDelay,
  wet,
  onDecayChange,
  onPreDelayChange,
  onWetChange,
  enabled,
  onToggle,
}: ReverbControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("ReverbControl received props:", {
      decay,
      preDelay,
      wet,
      enabled,
    });
  }, [decay, preDelay, wet, enabled]);

  const handleDecayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing decay to:", newValue);
    onDecayChange(newValue);
  };

  const handlePreDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing pre-delay to:", newValue);
    onPreDelayChange(newValue);
  };

  const handleWetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing wet mix to:", newValue);
    onWetChange(newValue);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log("Toggling reverb:", newValue);
    onToggle(newValue);
  };

  return (
    <div className="effect-control reverb-control">
      <div className="effect-header">
        <h3>Reverb</h3>
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
        <label htmlFor="reverb-decay">Decay:</label>
        <input
          type="range"
          id="reverb-decay"
          min={EFFECT_PARAM_RANGES.decay.min}
          max={EFFECT_PARAM_RANGES.decay.max}
          step="0.1"
          value={decay}
          onChange={handleDecayChange}
          disabled={!enabled}
        />
        <span>{decay.toFixed(1)} s</span>
      </div>

      <div className="effect-param">
        <label htmlFor="reverb-predelay">Pre-Delay:</label>
        <input
          type="range"
          id="reverb-predelay"
          min={EFFECT_PARAM_RANGES.preDelay.min}
          max={EFFECT_PARAM_RANGES.preDelay.max}
          step="0.001"
          value={preDelay}
          onChange={handlePreDelayChange}
          disabled={!enabled}
        />
        <span>{(preDelay * 1000).toFixed(0)} ms</span>
      </div>

      <div className="effect-param">
        <label htmlFor="reverb-wet">Mix:</label>
        <input
          type="range"
          id="reverb-wet"
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
