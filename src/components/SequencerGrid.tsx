import { Grid } from "../machines/sequencerMachine";

type SequencerGridProps = {
  grid: Grid;
  currentStep: number;
  onToggleCell: (rowIndex: number, colIndex: number) => void;
};

export function SequencerGrid({
  grid,
  currentStep,
  onToggleCell,
}: SequencerGridProps) {
  return (
    <div className="note-grid">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-container">
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
