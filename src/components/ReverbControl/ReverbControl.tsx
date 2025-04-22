import { EFFECT_PARAM_RANGES } from "../../constants";
import Knob from "../Knob";
import "@/styles/effects.css";

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

function ReverbControl({
  decay,
  preDelay,
  wet,
  onDecayChange,
  onPreDelayChange,
  onWetChange,
  enabled,
}: ReverbControlProps) {
  return (
    <div className="effectKnobs">
      <Knob
        value={decay}
        min={EFFECT_PARAM_RANGES.decay.min}
        max={EFFECT_PARAM_RANGES.decay.max}
        step={0.1}
        label="DECAY"
        unit="s"
        onChange={onDecayChange}
        disabled={!enabled}
      />
      <Knob
        value={preDelay}
        min={EFFECT_PARAM_RANGES.preDelay.min}
        max={EFFECT_PARAM_RANGES.preDelay.max}
        step={0.01}
        label="PRE"
        unit="ms"
        onChange={onPreDelayChange}
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

export default ReverbControl;
