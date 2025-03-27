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
  startOctave = 2,
  onNotePress,
  isPlaying,
  onStartSequence,
  onStopSequence,
}: KeyboardProps) {
  const [isStickyKeys, setIsStickyKeys] = React.useState(false);
  const [activeNote, setActiveNote] = React.useState<string | null>(null);

  const handleNotePress = async (note: string) => {
    if (!synth) return;

    if (isStickyKeys && activeNote === note) {
      handleNoteRelease();
      return;
    }

    if (isStickyKeys && activeNote) {
      synth.triggerRelease();
    }

    synth.triggerAttack(note);
    setActiveNote(note);

    if (onNotePress) {
      onNotePress(note);
    }

    if (!isPlaying) {
      await onStartSequence();
    }
  };

  const handleNoteRelease = () => {
    if (!synth || isStickyKeys) return;

    synth.triggerRelease();
    setActiveNote(null);

    if (isPlaying) {
      onStopSequence();
    }
  };

  const toggleStickyKeys = () => {
    setIsStickyKeys(!isStickyKeys);
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
          HOLD
        </button>
      </div>
      <div className="keyboard-section">
        <div className="keyboard">
          {[0, 1, 2, 3].map((offset) => renderOctave(startOctave + offset))}
        </div>
      </div>
    </div>
  );
}
