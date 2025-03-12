import { NOTES, transposeNote } from "../constants/sequencer";
import { Grid } from "../machines/sequencerMachine";

type SequencerGridProps = {
  pitch: number;
  grid: Grid;
  currentStep: number;
  onToggleCell: (rowIndex: number, colIndex: number) => void;
};

export function SequencerGrid({
  pitch,
  grid,
  currentStep,
  onToggleCell,
}: SequencerGridProps) {
  // Function to get the transposed note label
  const getTransposedNoteLabel = (baseNote: string) => {
    return transposeNote(baseNote, pitch).slice(0, -1); // Remove octave number from display
  };

  return (
    <div className="note-grid">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-container">
          <div className="row-label">
            {getTransposedNoteLabel(NOTES[rowIndex])}
          </div>
          <div className="note-row">
            {row.map((isSelected, colIndex) => (
              <div
                key={colIndex}
                className={`note-cell ${isSelected ? "selected" : ""} ${
                  colIndex === currentStep ? "current" : ""
                }`}
                onClick={() => onToggleCell(rowIndex, colIndex)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
