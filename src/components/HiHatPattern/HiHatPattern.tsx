import styles from "./styles.module.css";

type HiHatPatternProps = {
  pattern: boolean[];
  currentStep: number;
  onToggleStep: (step: number) => void;
  isPlaying: boolean;
};

export default function HiHatPattern({
  pattern,
  currentStep,
  onToggleStep,
  isPlaying,
}: HiHatPatternProps) {
  return (
    <div className={styles.hiHatGrid}>
      <div className={styles.gridHeader}>
        <h3>HI-HAT</h3>
        <div
          className={`${styles.ledIndicator} ${
            isPlaying ? styles.pulsate : ""
          }`}
        ></div>
      </div>
      <div className={styles.patternContainer}>
        <div className={styles.patternRow}>
          <div className={styles.rowLabel}>H</div>
          <div className={styles.patternCells}>
            {pattern.map((isActive, step) => (
              <div
                key={step}
                className={`${styles.patternCell} ${
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
    </div>
  );
}
