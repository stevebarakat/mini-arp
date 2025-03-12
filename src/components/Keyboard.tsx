import React from "react";

type SynthInterface = {
  triggerAttack: (note: string, time?: number) => void;
  triggerRelease: (time?: number) => void;
};

type KeyboardProps = {
  synth: SynthInterface | undefined;
  startOctave?: number;
  onNotePress?: (note: string) => void;
  isPlaying: boolean;
  onStartSequence: () => Promise<void>;
  onStopSequence: () => void;
};

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
  const [isStickyKeys, setIsStickyKeys] = React.useState(false);
  const [activeNote, setActiveNote] = React.useState<string | null>(null);

  const handleNotePress = async (note: string) => {
    if (!synth) return;

    // If sticky keys is on and we're pressing the same note, release it
    if (isStickyKeys && activeNote === note) {
      handleNoteRelease();
      return;
    }

    // If sticky keys is on and we're pressing a different note, release the previous note
    if (isStickyKeys && activeNote) {
      synth.triggerRelease();
    }

    // Play the note on the synth
    synth.triggerAttack(note);
    setActiveNote(note);

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

    // Don't release if sticky keys is on
    if (isStickyKeys) return;

    // Release the note on the synth
    synth.triggerRelease();
    setActiveNote(null);

    // Stop the sequence if playing
    if (isPlaying) {
      onStopSequence();
    }
  };

  const toggleStickyKeys = () => {
    setIsStickyKeys(!isStickyKeys);
    // If turning sticky keys off, release any active note
    if (isStickyKeys && activeNote && synth) {
      synth.triggerRelease();
      setActiveNote(null);
      if (isPlaying) {
        onStopSequence();
      }
    }
  };

  const renderKey = (note: string, octave: number, isBlack: boolean) => {
    const fullNote = `${note}${octave}`;
    const isActive = activeNote === fullNote;
    return (
      <div
        key={fullNote}
        className={`piano-key ${isBlack ? "black" : "white"} ${
          isActive ? "active" : ""
        }`}
        onMouseDown={() => handleNotePress(fullNote)}
        onMouseUp={handleNoteRelease}
        onMouseLeave={handleNoteRelease}
        role="button"
        tabIndex={0}
        aria-label={fullNote}
        aria-pressed={isActive}
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
    <div className="keyboard-container">
      <div className="keyboard-controls">
        <button
          className={`sticky-keys-button ${isStickyKeys ? "active" : ""}`}
          onClick={toggleStickyKeys}
          aria-pressed={isStickyKeys}
        >
          Sticky Keys {isStickyKeys ? "On" : "Off"}
        </button>
      </div>
      <div className="keyboard">
        {[0, 1].map((offset) => renderOctave(startOctave + offset))}
      </div>
    </div>
  );
}
