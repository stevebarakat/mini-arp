import { EFFECT_PARAM_RANGES } from "../../constants";
import { Knob } from "../Knob";
import styles from "./styles.module.css";

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
  onToggle,
}: ReverbControlProps) {
  return (
    <div className={styles.effectControl}>
      <div className={styles.effectHeader}>
        <h3>REVERB</h3>
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
    </div>
  );
}

export default ReverbControl;
