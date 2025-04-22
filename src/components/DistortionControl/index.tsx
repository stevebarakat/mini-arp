import { EFFECT_PARAM_RANGES } from "../../constants";
import { Knob } from "../Knob";
import styles from "./styles.module.css";

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
  return (
    <div className={styles.effectControl}>
      <div className={styles.effectHeader}>
        <h3>DRIVE</h3>
        <div
          className={`${styles.ledIndicator} ${enabled ? styles.active : ""}`}
        ></div>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className={styles.toggleSlider}></span>
        </label>
      </div>

      <div className={styles.effectKnobs}>
        <Knob
          value={distortion}
          min={EFFECT_PARAM_RANGES.distortion.min}
          max={EFFECT_PARAM_RANGES.distortion.max}
          step={0.01}
          label="DRIVE"
          unit="%"
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
