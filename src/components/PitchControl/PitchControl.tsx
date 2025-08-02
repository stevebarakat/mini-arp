import { MIN_PITCH_SHIFT, MAX_PITCH_SHIFT } from "../../constants";
import * as Slider from "@radix-ui/react-slider";
import styles from "./styles.module.css";

type PitchControlProps = {
  pitch: number;
  onPitchChange: (shift: number) => void;
};

function PitchControl({ pitch, onPitchChange }: PitchControlProps) {
  return (
    <div className={styles.sliderContainer}>
      <label htmlFor="pitch-slider" className={styles.label}>
        Pitch {pitch} semitones
        <Slider.Root
          id="pitch-slider"
          className={styles.sliderRoot}
          value={[pitch]}
          min={MIN_PITCH_SHIFT}
          max={MAX_PITCH_SHIFT}
          step={1}
          onValueChange={([value]) => onPitchChange(value)}
        >
          <Slider.Track className={styles.sliderTrack}>
            <Slider.Range className={styles.sliderRange} />
          </Slider.Track>
          <Slider.Thumb className={styles.sliderThumb} />
        </Slider.Root>
      </label>
    </div>
  );
}

export default PitchControl;
