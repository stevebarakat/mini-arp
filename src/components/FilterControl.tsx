import React, { useEffect } from "react";
import { FILTER_PARAM_RANGES } from "../constants/sequencer";

type FilterControlProps = {
  frequency: number;
  depth: number;
  wet: number;
  resonance: number;
  onFrequencyChange: (frequency: number) => void;
  onDepthChange: (depth: number) => void;
  onWetChange: (wet: number) => void;
  onResonanceChange: (resonance: number) => void;
};

export function FilterControl({
  frequency,
  depth,
  wet,
  resonance,
  onFrequencyChange,
  onDepthChange,
  onWetChange,
  onResonanceChange,
}: FilterControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("FilterControl received props:", {
      frequency,
      depth,
      wet,
      resonance,
    });
  }, [frequency, depth, wet, resonance]);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing frequency to:", newValue);
    onFrequencyChange(newValue);
  };

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing depth to:", newValue);
    onDepthChange(newValue);
  };

  const handleWetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing wet mix to:", newValue);
    onWetChange(newValue);
  };

  const handleResonanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    console.log("Changing resonance to:", newValue);
    onResonanceChange(newValue);
  };

  return (
    <div className="filter-control">
      <h3>Auto-Filter</h3>

      <div className="filter-param">
        <label htmlFor="filter-frequency">LFO Speed:</label>
        <input
          type="range"
          id="filter-frequency"
          min={FILTER_PARAM_RANGES.frequency.min}
          max={FILTER_PARAM_RANGES.frequency.max}
          step="0.1"
          value={frequency}
          onChange={handleFrequencyChange}
        />
        <span>{frequency.toFixed(1)} Hz</span>
      </div>

      <div className="filter-param">
        <label htmlFor="filter-depth">Depth:</label>
        <input
          type="range"
          id="filter-depth"
          min={FILTER_PARAM_RANGES.depth.min}
          max={FILTER_PARAM_RANGES.depth.max}
          step="0.01"
          value={depth}
          onChange={handleDepthChange}
        />
        <span>{Math.round(depth * 100)}%</span>
      </div>

      <div className="filter-param">
        <label htmlFor="filter-resonance">Resonance:</label>
        <input
          type="range"
          id="filter-resonance"
          min={FILTER_PARAM_RANGES.Q.min}
          max={FILTER_PARAM_RANGES.Q.max}
          step="0.1"
          value={resonance}
          onChange={handleResonanceChange}
        />
        <span>{resonance.toFixed(1)}</span>
      </div>

      <div className="filter-param">
        <label htmlFor="filter-wet">Mix:</label>
        <input
          type="range"
          id="filter-wet"
          min={FILTER_PARAM_RANGES.wet.min}
          max={FILTER_PARAM_RANGES.wet.max}
          step="0.01"
          value={wet}
          onChange={handleWetChange}
        />
        <span>{Math.round(wet * 100)}%</span>
      </div>
    </div>
  );
}
