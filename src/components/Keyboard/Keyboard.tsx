import React, {
  useState,
  useEffect,
  useImperativeHandle,
  useCallback,
} from "react";
import { INSTRUMENT_TYPES } from "../../constants";
import styles from "./Keyboard.module.css";
import { WhiteKey, BlackKey } from "./KeyboardKey";
import KeyboardControls from "./KeyboardControls";
import {
  useKeyboardEvents,
  useInstrument,
  useNoteState,
  useKeyboardKeys,
} from "./hooks";
import { KeyboardProps, KeyboardRef } from "./types";

function Keyboard({
  activeKeys = [],
  octaveRange = { min: 4, max: 5 },
  onKeyClick = () => {},
  instrumentType = INSTRUMENT_TYPES.SYNTH,
  isArpeggiatorMode = false,
  onToggleArpeggiatorMode = () => {},
  onStopArpeggiator = () => {},
  ref,
}: KeyboardProps) {
  const [currentOctave, setCurrentOctave] = useState(4);

  const { instrument, playNote } = useInstrument(instrumentType);

  const {
    activeNotes,
    isStickyKeys,
    handleKeyPress,
    handleKeyRelease,
    handleMouseDownDirect,
    handleMouseUpDirect,
    handleGlobalMouseUp,
    toggleStickyKeys,
    clearNoteState,
  } = useNoteState();

  const { renderWhiteKeys, renderBlackKeys } = useKeyboardKeys(octaveRange);

  const { clearKeyState } = useKeyboardEvents(currentOctave, {
    onKeyPress: (note: string) => handleKeyPress(note, onKeyClick),
    onKeyRelease: (note: string, key: string) =>
      handleKeyRelease(note, key, onStopArpeggiator),
    onOctaveChange: (direction: "increment" | "decrement") => {
      if (direction === "increment" && currentOctave < 6) {
        setCurrentOctave((prev) => prev + 1);
      } else if (direction === "decrement" && currentOctave > 2) {
        setCurrentOctave((prev) => prev - 1);
      }
    },
  });

  // Clear key state when octave changes
  useEffect(() => {
    clearKeyState();
    clearNoteState();
  }, [clearKeyState, clearNoteState, currentOctave]);

  useEffect(() => {
    const handleMouseUp = () => handleGlobalMouseUp(onKeyClick);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleGlobalMouseUp, onKeyClick]);

  const handleToggleStickyKeys = useCallback(
    (checked: boolean) => {
      toggleStickyKeys(checked);
      if (!checked) {
        // When disabling sticky keys, clear any active notes
        onKeyClick("");
      }
    },
    [toggleStickyKeys, onKeyClick]
  );

  const handleMouseDown = useCallback(
    (note: string) => {
      handleMouseDownDirect(note, onKeyClick, onStopArpeggiator);
    },
    [handleMouseDownDirect, onKeyClick, onStopArpeggiator]
  );

  const handleMouseUp = useCallback(() => {
    handleMouseUpDirect(onStopArpeggiator);
  }, [handleMouseUpDirect, onStopArpeggiator]);

  const handleOctaveChange = useCallback((octave: number) => {
    setCurrentOctave(octave);
  }, []);

  const whiteKeyData = renderWhiteKeys(
    activeKeys,
    handleMouseDown,
    handleMouseUp
  );
  const blackKeyData = renderBlackKeys(
    activeKeys,
    handleMouseDown,
    handleMouseUp
  );

  useImperativeHandle(
    ref,
    (): KeyboardRef => ({
      playNote,
    })
  );

  return (
    <div className={styles.keyboardContainer}>
      <KeyboardControls
        isStickyKeys={isStickyKeys}
        currentOctave={currentOctave}
        onToggleStickyKeys={handleToggleStickyKeys}
        onOctaveChange={handleOctaveChange}
        isArpeggiatorMode={isArpeggiatorMode}
        onToggleArpeggiatorMode={onToggleArpeggiatorMode}
      />
      <div className={styles.keyboard}>
        <div className={styles.pianoKeys}>
          <div className={styles.leftShadow} />
          {whiteKeyData.map((keyData) => (
            <WhiteKey
              key={keyData.key}
              isActive={keyData.isActive}
              onPointerDown={keyData.onPointerDown}
              onPointerUp={keyData.onPointerUp}
            />
          ))}
          <div className={styles.rightShadow} />
          {blackKeyData.map((keyData) => (
            <BlackKey
              key={keyData.key}
              isActive={keyData.isActive}
              position={keyData.position}
              width={keyData.width}
              onPointerDown={keyData.onPointerDown}
              onPointerUp={keyData.onPointerUp}
              onPointerEnter={() => {}}
              onPointerLeave={() => {}}
            />
          ))}
        </div>
      </div>
      <div className={styles.keyboardHelp}>
        <small>
          Use computer keyboard: A S D F G H J K L ; ' (white keys) | W E T Y U
          O P [ (black keys) | <strong>Octave {currentOctave}</strong> (+/- or
          Z/X to change)
        </small>
      </div>
    </div>
  );
}

export default Keyboard;
