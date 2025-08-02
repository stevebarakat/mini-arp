import { useCallback, useEffect, useRef, useState } from "react";

type KeyboardEventHandlers = {
  onKeyPress: (note: string) => void;
  onKeyRelease: (note: string, key: string) => void;
  onOctaveChange: (direction: "increment" | "decrement") => void;
};

export function useKeyboardEvents(
  currentOctave: number,
  { onKeyPress, onKeyRelease, onOctaveChange }: KeyboardEventHandlers
) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const pressedKeysRef = useRef<Set<string>>(new Set());

  const getKeyboardMapping = useCallback(() => {
    const mapping: { [key: string]: string } = {};

    // White keys (natural notes)
    const whiteKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"];
    const whiteNotes = ["C", "D", "E", "F", "G", "A", "B", "C", "D", "E", "F"];

    whiteKeys.forEach((key, index) => {
      const octaveOffset = Math.floor(index / 7);
      const noteOctave = currentOctave + octaveOffset;
      mapping[key] = `${whiteNotes[index]}${noteOctave}`;
    });

    // Black keys (sharp/flat notes)
    const blackKeys = ["w", "e", "t", "y", "u", "o", "p", "["];
    const blackNotes = ["C#", "D#", "F#", "G#", "A#", "C#", "D#", "F#"];

    blackKeys.forEach((key, index) => {
      const octaveOffset = Math.floor(index / 5);
      const noteOctave = currentOctave + octaveOffset;
      mapping[key] = `${blackNotes[index]}${noteOctave}`;
    });

    return mapping;
  }, [currentOctave]);

  const OCTAVE_CONTROLS: { [key: string]: "increment" | "decrement" } = {
    "=": "increment",
    "+": "increment",
    "-": "decrement",
    _: "decrement",
    z: "decrement",
    x: "increment",
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyboardMapping = getKeyboardMapping();
      const note = keyboardMapping[key];

      if (OCTAVE_CONTROLS[key]) {
        event.preventDefault();
        if (OCTAVE_CONTROLS[key] === "increment" && currentOctave < 6) {
          onOctaveChange("increment");
        } else if (OCTAVE_CONTROLS[key] === "decrement" && currentOctave > 2) {
          onOctaveChange("decrement");
        }
      } else if (note && !pressedKeysRef.current.has(key)) {
        event.preventDefault();
        pressedKeysRef.current.add(key);
        setPressedKeys((prev) => new Set(prev).add(key));
        onKeyPress(note);
      }
    },
    [onKeyPress, getKeyboardMapping, currentOctave, onOctaveChange]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyboardMapping = getKeyboardMapping();
      const note = keyboardMapping[key];

      if (note && pressedKeysRef.current.has(key)) {
        event.preventDefault();
        pressedKeysRef.current.delete(key);
        setPressedKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        onKeyRelease(note, key);
      }
    },
    [pressedKeys, onKeyRelease, getKeyboardMapping]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const clearKeyState = useCallback(() => {
    setPressedKeys(new Set());
    pressedKeysRef.current.clear();
  }, []);

  return {
    pressedKeys,
    clearKeyState,
  };
}
