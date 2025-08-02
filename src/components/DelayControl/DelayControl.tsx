import { EFFECT_PARAM_RANGES } from "../../constants";
import Knob from "../Knob";

type DelayControlProps = {
  delayTime: number;
  feedback: number;
  wet: number;
  onDelayTimeChange: (delayTime: number) => void;
  onFeedbackChange: (feedback: number) => void;
  onWetChange: (wet: number) => void;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
};

function DelayControl({
  delayTime,
  feedback,
  wet,
  onDelayTimeChange,
  onFeedbackChange,
  onWetChange,
  enabled,
}: DelayControlProps) {
  return (
    <div className="effectKnobs">
      <Knob
        value={delayTime}
        min={EFFECT_PARAM_RANGES.delayTime.min}
        max={EFFECT_PARAM_RANGES.delayTime.max}
        step={0.01}
        label="TIME"
        unit="ms"
        onChange={onDelayTimeChange}
        disabled={!enabled}
      />
      <Knob
        value={feedback}
        min={EFFECT_PARAM_RANGES.feedback.min}
        max={EFFECT_PARAM_RANGES.feedback.max}
        step={0.01}
        label="FB"
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
  );
}

export default DelayControl;
