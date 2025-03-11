import React, { useEffect } from "react";
import { EFFECT_PARAM_RANGES } from "../constants/sequencer";

type CompressorControlProps = {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  wet: number;
  onThresholdChange: (threshold: number) => void;
  onRatioChange: (ratio: number) => void;
  onAttackChange: (attack: number) => void;
  onReleaseChange: (release: number) => void;
  onKneeChange: (knee: number) => void;
  onWetChange: (wet: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function CompressorControl({
  threshold,
  ratio,
  attack,
  release,
  knee,
  wet,
  onThresholdChange,
  onRatioChange,
  onAttackChange,
  onReleaseChange,
  onKneeChange,
  onWetChange,
  enabled,
  onToggle,
}: CompressorControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("CompressorControl received props:", {
      threshold,
      ratio,
      attack,
      release,
      knee,
      wet,
      enabled,
    });
  }, [threshold, ratio, attack, release, knee, wet, enabled]);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing threshold to:", newValue);
    onThresholdChange(newValue);
  };

  const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing ratio to:", newValue);
    onRatioChange(newValue);
  };

  const handleAttackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing attack to:", newValue);
    onAttackChange(newValue);
  };

  const handleReleaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing release to:", newValue);
    onReleaseChange(newValue);
  };

  const handleKneeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing knee to:", newValue);
    onKneeChange(newValue);
  };

  const handleWetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing wet mix to:", newValue);
    onWetChange(newValue);
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    console.log("Toggling compressor:", newValue);
    onToggle(newValue);
  };

  return (
    <div className="effect-control compressor-control">
      <div className="effect-header">
        <h3>Compressor</h3>
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
        <label htmlFor="compressor-threshold">Threshold:</label>
        <input
          type="range"
          id="compressor-threshold"
          min={EFFECT_PARAM_RANGES.threshold.min}
          max={EFFECT_PARAM_RANGES.threshold.max}
          step="1"
          value={threshold}
          onChange={handleThresholdChange}
          disabled={!enabled}
        />
        <span>{threshold} dB</span>
      </div>

      <div className="effect-param">
        <label htmlFor="compressor-ratio">Ratio:</label>
        <input
          type="range"
          id="compressor-ratio"
          min={EFFECT_PARAM_RANGES.ratio.min}
          max={EFFECT_PARAM_RANGES.ratio.max}
          step="0.5"
          value={ratio}
          onChange={handleRatioChange}
          disabled={!enabled}
        />
        <span>{ratio}:1</span>
      </div>

      <div className="effect-param">
        <label htmlFor="compressor-attack">Attack:</label>
        <input
          type="range"
          id="compressor-attack"
          min={EFFECT_PARAM_RANGES.attack.min}
          max={EFFECT_PARAM_RANGES.attack.max}
          step="0.001"
          value={attack}
          onChange={handleAttackChange}
          disabled={!enabled}
        />
        <span>{(attack * 1000).toFixed(0)} ms</span>
      </div>

      <div className="effect-param">
        <label htmlFor="compressor-release">Release:</label>
        <input
          type="range"
          id="compressor-release"
          min={EFFECT_PARAM_RANGES.release.min}
          max={EFFECT_PARAM_RANGES.release.max}
          step="0.01"
          value={release}
          onChange={handleReleaseChange}
          disabled={!enabled}
        />
        <span>{(release * 1000).toFixed(0)} ms</span>
      </div>

      <div className="effect-param">
        <label htmlFor="compressor-knee">Knee:</label>
        <input
          type="range"
          id="compressor-knee"
          min={EFFECT_PARAM_RANGES.knee.min}
          max={EFFECT_PARAM_RANGES.knee.max}
          step="1"
          value={knee}
          onChange={handleKneeChange}
          disabled={!enabled}
        />
        <span>{knee} dB</span>
      </div>

      <div className="effect-param">
        <label htmlFor="compressor-wet">Mix:</label>
        <input
          type="range"
          id="compressor-wet"
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
