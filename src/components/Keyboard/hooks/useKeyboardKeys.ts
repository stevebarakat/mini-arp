import { useMemo, useCallback } from "react";
import { Frequency } from "tone";

type KeyData = { note: string; isSharp: boolean };

export function useKeyboardKeys(octaveRange: { min: number; max: number }) {
  const keys = useMemo(() => {
    const octave = [
      { note: "C", isSharp: false },
      { note: "C#", isSharp: true },
      { note: "D", isSharp: false },
      { note: "D#", isSharp: true },
      { note: "E", isSharp: false },
      { note: "F", isSharp: false },
      { note: "F#", isSharp: true },
      { note: "G", isSharp: false },
      { note: "G#", isSharp: true },
      { note: "A", isSharp: false },
      { note: "A#", isSharp: true },
      { note: "B", isSharp: false },
    ];

    const keysArray: KeyData[] = [];
    for (let o = octaveRange.min; o <= octaveRange.max; o++) {
      octave.forEach((key) => {
        const note = `${key.note}${o}`;
        const noteValue = Frequency(note).toMidi();
        const g3Value = Frequency("G3").toMidi();
        const c5Value = Frequency("C6").toMidi();

        if (noteValue >= g3Value && noteValue <= c5Value) {
          keysArray.push({ note, isSharp: key.isSharp });
        }
      });
    }
    return keysArray;
  }, [octaveRange.min, octaveRange.max]);

  const renderWhiteKeys = useCallback(
    (
      activeKeys: string[],
      onMouseDown: (note: string) => void,
      onMouseUp: () => void
    ) => {
      return keys
        .filter((key) => !key.isSharp)
        .map((key, index) => {
          const isActive = activeKeys.includes(key.note);
          return {
            key: `white-${key.note}-${index}`,
            note: key.note,
            isActive,
            onPointerDown: () => onMouseDown(key.note),
            onPointerUp: onMouseUp,
          };
        });
    },
    [keys]
  );

  const renderBlackKeys = useCallback(
    (
      activeKeys: string[],
      onMouseDown: (note: string) => void,
      onMouseUp: () => void
    ) => {
      const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length;

      return keys
        .filter((key) => key.isSharp)
        .map((key, index) => {
          const isActive = activeKeys.includes(key.note);
          const keyIndex = keys.findIndex((k) => k.note === key.note);
          const whiteKeysBefore = keys
            .slice(0, keyIndex)
            .filter((k) => !k.isSharp).length;
          const position = (whiteKeysBefore - 0.3) * whiteKeyWidth;

          return {
            key: `black-${key.note}-${index}`,
            note: key.note,
            isActive,
            position,
            width: whiteKeyWidth * 0.7,
            onPointerDown: () => onMouseDown(key.note),
            onPointerUp: onMouseUp,
            onPointerEnter: () => {},
            onPointerLeave: () => {},
          };
        });
    },
    [keys]
  );

  return {
    keys,
    renderWhiteKeys,
    renderBlackKeys,
  };
}
