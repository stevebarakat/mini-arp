import React from "react";
import * as Tone from "tone";

interface KeyboardProps {
  synth: Tone.Synth | undefined;
  startOctave?: number;
}

const KEYS = [
  { note: "C", isBlack: false },
  { note: "C#", isBlack: true },
  { note: "D", isBlack: false },
  { note: "D#", isBlack: true },
  { note: "E", isBlack: false },
  { note: "F", isBlack: false },
  { note: "F#", isBlack: true },
  { note: "G", isBlack: false },
  { note: "G#", isBlack: true },
  { note: "A", isBlack: false },
  { note: "A#", isBlack: true },
  { note: "B", isBlack: false },
];

export function Keyboard({ synth, startOctave = 3 }: KeyboardProps) {
  const handleNotePress = (note: string) => {
    if (!synth) return;
    synth.triggerAttackRelease(note, "8n");
  };

  const renderKey = (note: string, octave: number, isBlack: boolean) => {
    const fullNote = `${note}${octave}`;
    return (
      <div
        key={fullNote}
        className={`piano-key ${isBlack ? "black" : "white"}`}
        onMouseDown={() => handleNotePress(fullNote)}
        role="button"
        tabIndex={0}
        aria-label={fullNote}
      />
    );
  };

  const renderOctave = (octave: number) => {
    return (
      <div key={octave} className="octave">
        {KEYS.map(({ note, isBlack }) => renderKey(note, octave, isBlack))}
      </div>
    );
  };

  return (
    <div className="keyboard">
      {[0, 1].map((offset) => renderOctave(startOctave + offset))}
    </div>
  );
}
