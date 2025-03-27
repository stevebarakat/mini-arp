import { EFFECT_PARAM_RANGES } from "../constants/sequencer";
import { Knob } from "./Knob";

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
  return (
    <div className="effect-control delay-control">
      <div className="effect-header">
        <h3>DELAY</h3>
        <div className={`led-indicator ${enabled ? "active" : ""}`}></div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="effect-knobs">
        <Knob
          value={delayTime}
          min={EFFECT_PARAM_RANGES.delayTime.min}
          max={EFFECT_PARAM_RANGES.delayTime.max}
          step={0.01}
          label="TIME"
          unit="s"
          onChange={onDelayTimeChange}
          disabled={!enabled}
        />
        <Knob
          value={feedback}
          min={EFFECT_PARAM_RANGES.feedback.min}
          max={EFFECT_PARAM_RANGES.feedback.max}
          step={0.01}
          label="FEED"
          unit="%"
          onChange={onFeedbackChange}
          disabled={!enabled}
        />
        <Knob
          value={wet}
          min={EFFECT_PARAM_RANGES.wet.min}
          max={EFFECT_PARAM_RANGES.wet.max}
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
