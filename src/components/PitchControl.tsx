import { MIN_PITCH_SHIFT, MAX_PITCH_SHIFT } from "../constants/sequencer";

interface PitchControlProps {
  pitchShift: number;
  onPitchChange: (shift: number) => void;
}

export function PitchControl({ pitchShift, onPitchChange }: PitchControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPitchChange(parseInt(e.target.value));
  };

  return (
    <div className="pitch-control">
      <label htmlFor="pitch">Pitch Shift:</label>
      <input
        type="range"
        id="pitch"
        min={MIN_PITCH_SHIFT}
        max={MAX_PITCH_SHIFT}
        value={pitchShift}
        onChange={handleChange}
      />
      <span>
        {pitchShift > 0 ? "+" : ""}
        {pitchShift} semitones
      </span>
    </div>
  );
}
