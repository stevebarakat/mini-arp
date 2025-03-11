import { MIN_TEMPO, MAX_TEMPO } from "../constants/sequencer";

interface TempoControlProps {
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

export function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTempoChange(parseInt(e.target.value));
  };

  return (
    <div className="tempo-control">
      <label htmlFor="tempo">Tempo:</label>
      <input
        type="range"
        id="tempo"
        min={MIN_TEMPO}
        max={MAX_TEMPO}
        value={tempo}
        onChange={handleChange}
      />
      <span>{tempo} BPM</span>
    </div>
  );
}
