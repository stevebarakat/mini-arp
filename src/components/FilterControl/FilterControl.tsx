import { FILTER_PARAM_RANGES } from "@/constants";
import Knob from "@/components/Knob";
import "@/styles/effects.css";

type FilterControlProps = {
  frequency: number;
  depth: number;
  wet: number;
  resonance: number;
  onFrequencyChange: (frequency: number) => void;
  onDepthChange: (depth: number) => void;
  onWetChange: (wet: number) => void;
  onResonanceChange: (resonance: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export default function FilterControl({
  frequency,
  depth,
  wet,
  resonance,
  onFrequencyChange,
  onDepthChange,
  onWetChange,
  onResonanceChange,
  enabled,
  onToggle,
}: FilterControlProps) {
  return (
    <div className="effectControl">
      <div className="effectHeader">
        <h3>FILTER</h3>
        <div className={`ledIndicator ${enabled ? "active" : ""}`}></div>
        <label className="toggleSwitch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="toggleSlider"></span>
        </label>
      </div>

      <div className="effectKnobs">
        <Knob
          value={frequency}
          min={FILTER_PARAM_RANGES.frequency.min}
          max={FILTER_PARAM_RANGES.frequency.max}
          step={0.1}
          label="FREQ"
          unit="Hz"
          onChange={onFrequencyChange}
          disabled={!enabled}
        />
        <Knob
          value={depth}
          min={FILTER_PARAM_RANGES.depth.min}
          max={FILTER_PARAM_RANGES.depth.max}
          step={0.01}
          label="DEPTH"
          unit="%"
          onChange={onDepthChange}
          disabled={!enabled}
        />
        <Knob
          value={resonance}
          min={FILTER_PARAM_RANGES.Q.min}
          max={FILTER_PARAM_RANGES.Q.max}
          step={0.1}
          label="RES"
          onChange={onResonanceChange}
          disabled={!enabled}
        />
        <Knob
          value={wet}
          min={FILTER_PARAM_RANGES.wet.min}
          max={FILTER_PARAM_RANGES.wet.max}
          step={0.01}
          label="MIX"
          unit="%"
          onChange={onWetChange}
          disabled={!enabled}
        />
      </div>
    </div>
  );
}
