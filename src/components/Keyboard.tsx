import React, { useEffect } from "react";

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
  { note: "C", isBlack: false, key: "a" },
  { note: "C#", isBlack: true, key: "w" },
  { note: "D", isBlack: false, key: "s" },
  { note: "D#", isBlack: true, key: "e" },
  { note: "E", isBlack: false, key: "d" },
  { note: "F", isBlack: false, key: "f" },
  { note: "F#", isBlack: true, key: "t" },
  { note: "G", isBlack: false, key: "g" },
  { note: "G#", isBlack: true, key: "y" },
  { note: "A", isBlack: false, key: "h" },
  { note: "A#", isBlack: true, key: "u" },
  { note: "B", isBlack: false, key: "j" },
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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const keyMapping = KEYS.find((k) => k.key === key);

      if (keyMapping) {
        e.preventDefault();
        const note = `${keyMapping.note}${startOctave}`;
        await handleNotePress(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const keyMapping = KEYS.find((k) => k.key === key);

      if (keyMapping && !isStickyKeys) {
        e.preventDefault();
        handleNoteRelease();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    synth,
    startOctave,
    isStickyKeys,
    isPlaying,
    onStartSequence,
    onStopSequence,
  ]);

  const renderKey = (
    note: string,
    octave: number,
    isBlack: boolean,
    key: string
  ) => {
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
        aria-label={`${fullNote} (${key.toUpperCase()})`}
        aria-pressed={isActive}
      />
    );
  };

  const renderOctave = (octave: number) => {
    return (
      <div key={octave} className="octave">
        {KEYS.map(({ note, isBlack, key }) =>
          renderKey(note, octave, isBlack, key)
        )}
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
