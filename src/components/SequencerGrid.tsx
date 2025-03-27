import React from "react";
import { Grid } from "../machines/sequencerMachine";

type SequencerGridProps = {
  grid: Grid;
  currentStep: number;
  onToggleCell: (rowIndex: number, colIndex: number) => void;
  isPlaying: boolean;
};

export function SequencerGrid({
  grid,
  currentStep,
  onToggleCell,
  isPlaying,
}: SequencerGridProps) {
  return (
    <div className="sequencer-grid">
      <div className="grid-header">
        <h3>SEQUENCER</h3>
        <div className={`led-indicator ${isPlaying ? "pulsate" : ""}`}></div>
      </div>
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
      </div>
    </div>
  );
}
