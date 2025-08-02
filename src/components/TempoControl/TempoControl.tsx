import { MIN_TEMPO, MAX_TEMPO } from "../../constants";
import * as Slider from "@radix-ui/react-slider";
import styles from "./tempo-control.module.css";

type TempoControlProps = {
  tempo: number;
  onTempoChange: (tempo: number) => void;
};

function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
  return (
    <div className={styles.sliderContainer}>
      <label htmlFor="tempo-slider" className={styles.label}>
        Tempo: {tempo} bpm
      </label>
      <Slider.Root
        id="tempo-slider"
        className={styles.sliderRoot}
        value={[tempo]}
        min={MIN_TEMPO}
        max={MAX_TEMPO}
        step={1}
        onValueChange={([value]) => onTempoChange(value)}
      >
        <Slider.Track className={styles.sliderTrack}>
          <Slider.Range className={styles.sliderRange} />
        </Slider.Track>
        <Slider.Thumb className={styles.sliderThumb} />
      </Slider.Root>
    </div>
  );
}

export default TempoControl;
