import { MIN_TEMPO, MAX_TEMPO } from "../constants/sequencer";
import { Knob } from "./Knob";

type TempoControlProps = {
  tempo: number;
  onTempoChange: (tempo: number) => void;
};

export function TempoControl({ tempo, onTempoChange }: TempoControlProps) {
  return (
    <div className="control-module tempo-control">
      <div className="module-header">
        <h3>TEMPO</h3>
      </div>
      <div className="module-knobs">
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
