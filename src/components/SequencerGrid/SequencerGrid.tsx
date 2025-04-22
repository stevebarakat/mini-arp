import { Grid } from "../../machines/sequencerMachine";
import styles from "./styles.module.css";

type SequencerGridProps = {
  grid: Grid;
  currentStep: number;
  pattern: boolean[];
  onToggleStep: (step: number) => void;
  onToggleCell: (rowIndex: number, colIndex: number) => void;
};

function SequencerGrid({
  grid,
  currentStep,
  pattern,
  onToggleStep,
  onToggleCell,
}: SequencerGridProps) {
  return (
    <div className={styles.gridContainer}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.gridRow}>
          <div className={styles.rowLabel}>{rowIndex + 1}</div>
          <div className={styles.rowCells}>
            {row.map((isSelected, colIndex) => (
              <div
                key={colIndex}
                className={`${styles.gridCell} ${
                  isSelected ? styles.selected : ""
                } ${colIndex === currentStep ? styles.current : ""}`}
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
      <div className={styles.gridRow}>
        <div className={styles.rowLabel}>H</div>
        <div className={styles.rowCells}>
          {pattern.map((isActive, step) => (
            <div
              key={step}
              className={`${styles.gridCell} ${
                isActive ? styles.selected : ""
              } ${currentStep === step ? styles.current : ""}`}
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
  );
}

export default SequencerGrid;
