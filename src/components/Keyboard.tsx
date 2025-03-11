import React from "react";

// Define a type that includes the methods we need
interface SynthInterface {
  triggerAttack: (note: string, time?: number) => void;
  triggerRelease: (time?: number) => void;
}

interface KeyboardProps {
  synth: SynthInterface | undefined;
  startOctave?: number;
  onNotePress?: (note: string) => void;
  isPlaying: boolean;
  onStartSequence: () => Promise<void>;
  onStopSequence: () => void;
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

export function Keyboard({
  synth,
  startOctave = 3,
  onNotePress,
  isPlaying,
  onStartSequence,
  onStopSequence,
}: KeyboardProps) {
  const handleNotePress = async (note: string) => {
    if (!synth) return;

    // Play the note on the synth
    synth.triggerAttack(note);

    // Set the root note for the arpeggiator
    if (onNotePress) {
      onNotePress(note);
    }

    // Start the sequence if not already playing
    if (!isPlaying) {
      await onStartSequence();
    }
  };

  const handleNoteRelease = () => {
    if (!synth) return;

    // Release the note on the synth
    synth.triggerRelease();

    // Stop the sequence if playing
    if (isPlaying) {
      onStopSequence();
    }
  };

  const renderKey = (note: string, octave: number, isBlack: boolean) => {
    const fullNote = `${note}${octave}`;
    return (
      <div
        key={fullNote}
        className={`piano-key ${isBlack ? "black" : "white"}`}
        onMouseDown={() => handleNotePress(fullNote)}
        onMouseUp={handleNoteRelease}
        onMouseLeave={handleNoteRelease}
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
