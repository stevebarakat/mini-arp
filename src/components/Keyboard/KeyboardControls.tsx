import React from "react";
import Button from "../Button";
import Toggle from "./Toggle";
import styles from "./Keyboard.module.css";

type KeyboardControlsProps = {
  isStickyKeys: boolean;
  currentOctave: number;
  onToggleStickyKeys: (checked: boolean) => void;
  onOctaveChange: (octave: number) => void;
  isArpeggiatorMode: boolean;
  onToggleArpeggiatorMode: (checked: boolean) => void;
};

function KeyboardControls({
  isStickyKeys,
  currentOctave,
  onToggleStickyKeys,
  onOctaveChange,
  isArpeggiatorMode,
  onToggleArpeggiatorMode,
}: KeyboardControlsProps) {
  return (
    <div className={styles.keyboardControls}>
      <div className={styles.switchGroup}>
        <Toggle
          checked={isStickyKeys}
          onChange={onToggleStickyKeys}
          label="Sticky Keys"
          id="sticky-keys-toggle"
        />
        <Toggle
          checked={isArpeggiatorMode}
          onChange={onToggleArpeggiatorMode}
          label="Arpeggiator Mode"
          id="arpeggiator-mode-toggle"
        />
      </div>
      <div className={styles.octaveControl}>
        <Button
          className={styles.octaveButton}
          onClick={() => onOctaveChange(Math.max(2, currentOctave - 1))}
          disabled={currentOctave <= 2}
        >
          -
        </Button>
        <span className={styles.octaveDisplay}>Octave {currentOctave}</span>
        <Button
          className={styles.octaveButton}
          onClick={() => onOctaveChange(Math.min(6, currentOctave + 1))}
          disabled={currentOctave >= 6}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export default KeyboardControls;
