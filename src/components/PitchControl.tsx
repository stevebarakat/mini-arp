import { MIN_PITCH_SHIFT, MAX_PITCH_SHIFT } from "../constants";

type PitchControlProps = {
  pitch: number;
  onPitchChange: (shift: number) => void;
};

export function PitchControl({ pitch, onPitchChange }: PitchControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPitchChange(parseInt(e.target.value));
  };

  return (
    <div className="pitch-control">
      <div>
        <label htmlFor="pitch">Pitch Shift:</label>{" "}
        <output>
          {pitch > 0 ? "+" : ""}
          {pitch} semitones
        </output>
      </div>
      <input
        type="range"
        id="pitch"
        min={MIN_PITCH_SHIFT}
        max={MAX_PITCH_SHIFT}
        value={pitch}
        onChange={handleChange}
      />
    </div>
  );
}
