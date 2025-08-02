import { useCallback } from "react";

type KeyboardMapping = { [key: string]: string };

const OCTAVE_CONTROLS: { [key: string]: "increment" | "decrement" } = {
  "=": "increment",
  "+": "increment",
  "-": "decrement",
  _: "decrement",
  z: "decrement",
  x: "increment",
};

export function useKeyboardMapping(currentOctave: number) {
  const getKeyboardMapping = useCallback((): KeyboardMapping => {
    const mapping: KeyboardMapping = {};

    // White keys (natural notes)
    const whiteKeys = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"];
    const whiteNotes = ["C", "D", "E", "F", "G", "A", "B", "C", "D", "E", "F"];

    whiteKeys.forEach((key, index) => {
      const octaveOffset = Math.floor(index / 7); // C, D, E, F, G, A, B, then C again
      const noteOctave = currentOctave + octaveOffset;
      mapping[key] = `${whiteNotes[index]}${noteOctave}`;
    });

    // Black keys (sharp/flat notes)
    const blackKeys = ["w", "e", "t", "y", "u", "o", "p", "["];
    const blackNotes = ["C#", "D#", "F#", "G#", "A#", "C#", "D#", "F#"];

    blackKeys.forEach((key, index) => {
      const octaveOffset = Math.floor(index / 5); // C#, D#, F#, G#, A#, then C# again
      const noteOctave = currentOctave + octaveOffset;
      mapping[key] = `${blackNotes[index]}${noteOctave}`;
    });

    return mapping;
  }, [currentOctave]);

  const handleOctaveControl = useCallback((key: string): boolean => {
    if (OCTAVE_CONTROLS[key]) {
      return true;
    }
    return false;
  }, []);

  return {
    getKeyboardMapping,
    handleOctaveControl,
    OCTAVE_CONTROLS,
  };
}
