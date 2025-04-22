import { MIN_TEMPO, MAX_TEMPO } from "../../constants";
import { Knob } from "../Knob";
import styles from "./styles.module.css";

type TempoControlProps = {
  tempo: number;
  onTempoChange: (tempo: number) => void;
};

export function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
  return (
    <div className={styles.controlModule}>
      <div className={styles.moduleKnobs}>
        <Knob
          value={tempo}
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          step={1}
          label="BPM"
          onChange={onTempoChange}
        />
      </div>
    </div>
  );
}
