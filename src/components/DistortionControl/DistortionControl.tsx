import { EFFECT_PARAM_RANGES } from "../../constants";
import Knob from "../Knob";
import "@/styles/effects.css";

type DistortionControlProps = {
  distortion: number;
  wet: number;
  onDistortionChange: (distortion: number) => void;
  onWetChange: (wet: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

function DistortionControl({
  distortion,
  wet,
  onDistortionChange,
  onWetChange,
  enabled,
}: DistortionControlProps) {
  return (
    <div className="effectControl">
      <div className="effectKnobs">
        <Knob
          value={distortion}
          min={EFFECT_PARAM_RANGES.distortion.min}
          max={EFFECT_PARAM_RANGES.distortion.max}
          step={0.01}
          label="DRIVE"
          unit=""
          onChange={onDistortionChange}
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

export default DistortionControl;
