import React from "react";
import Switch from "../Switch";
import Button from "../Button";
import styles from "./Keyboard.module.css";

type KeyboardControlsProps = {
  isStickyKeys: boolean;
  currentOctave: number;
  onToggleStickyKeys: (checked: boolean) => void;
  onOctaveChange: (octave: number) => void;
};

function KeyboardControls({
  isStickyKeys,
  currentOctave,
  onToggleStickyKeys,
  onOctaveChange,
}: KeyboardControlsProps) {
  return (
    <div className={styles.keyboardControls}>
      <Switch checked={isStickyKeys} onCheckedChange={onToggleStickyKeys}>
        Sticky Keys
      </Switch>
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
