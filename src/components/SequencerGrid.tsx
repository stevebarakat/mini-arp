import { Grid } from "../machines/sequencerMachine";

type SequencerGridProps = {
  grid: Grid;
  currentStep: number;
  pattern: boolean[];
  onToggleStep: (step: number) => void;
  onToggleCell: (rowIndex: number, colIndex: number) => void;
};

export function SequencerGrid({
  grid,
  currentStep,
  pattern,
  onToggleStep,
  onToggleCell,
}: SequencerGridProps) {
  return (
    <div className="sequencer-grid">
      <div className="grid-container">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            <div className="row-label">{rowIndex + 1}</div>
            <div className="row-cells">
              {row.map((isSelected, colIndex) => (
                <div
                  key={colIndex}
                  className={`grid-cell ${isSelected ? "selected" : ""} ${
                    colIndex === currentStep ? "current" : ""
                  }`}
                  onClick={() => onToggleCell(rowIndex, colIndex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Step ${colIndex + 1}, Row ${rowIndex + 1}`}
                  aria-pressed={isSelected}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="pattern-row">
          <div className="row-label">H</div>
          <div className="pattern-cells">
            {pattern.map((isActive, step) => (
              <div
                key={step}
                className={`pattern-cell ${isActive ? "selected" : ""} ${
                  currentStep === step ? "current" : ""
                }`}
                onClick={() => onToggleStep(step)}
                role="button"
                tabIndex={0}
                aria-label={`Hi-hat step ${step + 1}`}
                aria-pressed={isActive}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
