import React, { useEffect } from "react";

type FilterControlProps = {
  frequency: number;
  depth: number;
  wet: number;
  onFrequencyChange: (frequency: number) => void;
  onDepthChange: (depth: number) => void;
  onWetChange: (wet: number) => void;
};

export function FilterControl({
  frequency,
  depth,
  wet,
  onFrequencyChange,
  onDepthChange,
  onWetChange,
}: FilterControlProps) {
  // Log when props change to help with debugging
  useEffect(() => {
    console.log("FilterControl received props:", { frequency, depth, wet });
  }, [frequency, depth, wet]);

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

  return (
    <div className="filter-control">
      <h3>Auto-Filter</h3>

      <div className="filter-param">
        <label htmlFor="filter-frequency">LFO Speed:</label>
        <input
          type="range"
          id="filter-frequency"
          min="0.1"
          max="10"
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
          min="0"
          max="1"
          step="0.01"
          value={depth}
          onChange={handleDepthChange}
        />
        <span>{Math.round(depth * 100)}%</span>
      </div>

      <div className="filter-param">
        <label htmlFor="filter-wet">Mix:</label>
        <input
          type="range"
          id="filter-wet"
          min="0"
          max="1"
          step="0.01"
          value={wet}
          onChange={handleWetChange}
        />
        <span>{Math.round(wet * 100)}%</span>
      </div>
    </div>
  );
}
