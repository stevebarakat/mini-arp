import { MIN_PITCH_SHIFT, MAX_PITCH_SHIFT } from "../../constants";
import Knob from "../Knob";

type PitchControlProps = {
  pitch: number;
  onPitchChange: (shift: number) => void;
};

function PitchControl({ pitch, onPitchChange }: PitchControlProps) {
  const handleChange = (value: number) => {
    onPitchChange(value);
  };

  return (
    <Knob
      value={pitch}
      min={MIN_PITCH_SHIFT}
      max={MAX_PITCH_SHIFT}
      onChange={handleChange}
      label="Pitch"
      unit="st"
    />
  );
}

export default PitchControl;
