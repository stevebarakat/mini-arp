import { EFFECT_PARAM_RANGES } from "../../constants";
import { Knob } from "../Knob";
import styles from "./styles.module.css";

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

export default function DelayControl({
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
    <div className={styles.effectControl}>
      <div className={styles.effectHeader}>
        <h3>DELAY</h3>
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
