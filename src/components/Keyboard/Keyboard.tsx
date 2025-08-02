import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import * as Tone from "tone";
import { INSTRUMENT_TYPES } from "../../constants";
import styles from "./Keyboard.module.css";
import Button from "../Button";

interface SharedKeyboardProps {
  activeKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  instrumentType?: string;
  ref?: React.RefObject<{
    playNote: (note: string) => void;
  }>;
}

const Keyboard = ({
  activeKeys = [],
  octaveRange = { min: 4, max: 5 },
  onKeyClick = () => {},
  instrumentType = INSTRUMENT_TYPES.SYNTH,
  ref,
}: SharedKeyboardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<Tone.PolySynth | null>(null);
  const [currentInstrumentType, setCurrentInstrumentType] =
    useState(instrumentType);
  const [isStickyKeys, setIsStickyKeys] = useState(false);
  const [stickyNote, setStickyNote] = useState<string | null>(null);

  // Keep track of currently playing notes
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  // Define notes for one octave in order (important for layout)
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

  // Create a keyboard with the specified octave range
  const keys: { note: string; isSharp: boolean }[] = [];
  for (let o = octaveRange.min; o <= octaveRange.max; o++) {
    octave.forEach((key) => {
      const note = `${key.note}${o}`;
      // Only include notes from G3 to C5
      const noteValue = Tone.Frequency(note).toMidi();
      const g3Value = Tone.Frequency("G3").toMidi();
      const c5Value = Tone.Frequency("C6").toMidi();

      if (noteValue >= g3Value && noteValue <= c5Value) {
        keys.push({ note, isSharp: key.isSharp });
      }
    });
  }

  // Update current instrument type when prop changes
  useEffect(() => {
    if (currentInstrumentType !== instrumentType) {
      setCurrentInstrumentType(instrumentType);
      setIsLoaded(false);
    }
  }, [instrumentType, currentInstrumentType]);

  // Handle key press
  const handleKeyPress = useCallback(
    (note: string) => {
      if (!instrument || !isLoaded) return;

      try {
        if (Tone.context.state !== "running") {
          Tone.start();
        }

        if (isStickyKeys) {
          if (stickyNote === note) {
            // If clicking the same note, release it
            setStickyNote(null);
            setActiveNotes((prev) => {
              const next = new Set(prev);
              next.delete(note);
              return next;
            });
            onKeyClick("");
          } else {
            // If clicking a different note, switch to it
            if (stickyNote) {
              setActiveNotes((prev) => {
                const next = new Set(prev);
                next.delete(stickyNote);
                next.add(note);
                return next;
              });
            } else {
              setActiveNotes((prev) => {
                const next = new Set(prev);
                next.add(note);
                return next;
              });
            }
            setStickyNote(note);
            onKeyClick(note);
          }
        } else {
          // In non-sticky mode, just trigger the callback and set active note
          setActiveNotes(new Set([note]));
          onKeyClick(note);
        }
      } catch (e) {
        console.error("Error handling key press:", e);
      }
    },
    [instrument, isLoaded, isStickyKeys, stickyNote, onKeyClick]
  );

  // Handle key release
  const handleKeyRelease = useCallback(
    (note: string) => {
      if (!instrument || !isLoaded) return;

      try {
        // Only release if this note is actually active and we're not in sticky mode
        if (activeNotes.has(note) && !isStickyKeys) {
          setActiveNotes(new Set());
          onKeyClick("");
        }
      } catch (e) {
        console.error("Error handling key release:", e);
      }
    },
    [instrument, isLoaded, isStickyKeys, onKeyClick, activeNotes]
  );

  // Release all notes when unmounting or changing instruments
  useEffect(() => {
    return () => {
      if (instrument && activeNotes.size > 0) {
        const notes = Array.from(activeNotes);
        instrument.triggerRelease(notes);
        setActiveNotes(new Set());
      }
    };
  }, [instrument, activeNotes]);

  // Initialize the instrument
  useEffect(() => {
    let currentInstrument: Tone.PolySynth | null = null;

    const initializeInstrument = async () => {
      try {
        // Dispose of the old instrument if it exists
        if (instrument) {
          // Release any active notes before disposing
          if (activeNotes.size > 0) {
            const notes = Array.from(activeNotes);
            instrument.triggerRelease(notes);
            setActiveNotes(new Set());
          }
          instrument.dispose();
        }

        currentInstrument = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "triangle",
          },
        }).toDestination();

        setIsLoaded(true);
        setInstrument(currentInstrument);

        // Start audio context
        await Tone.start();
        console.log("Audio context started");
      } catch (e) {
        console.error("Error initializing instrument:", e);
        setIsLoaded(true);
      }
    };

    if (!instrument || currentInstrumentType !== instrumentType) {
      initializeInstrument();
    }

    return () => {
      if (currentInstrumentType !== instrumentType && currentInstrument) {
        currentInstrument.dispose();
      }
    };
  }, [instrumentType, currentInstrumentType, instrument, activeNotes]);

  // Modify playNote to use a longer note duration for better envelope effect
  const playNote = async (note: string) => {
    if (instrument && isLoaded) {
      try {
        // Ensure audio context is running
        if (Tone.context.state !== "running") {
          await Tone.start();
        }
        // Use a longer note duration to hear the envelope effect
        instrument.triggerAttackRelease(note, "4n");
      } catch (e) {
        console.error("Error playing note:", e);
        setTimeout(() => {
          setIsLoaded(true);
        }, 3000);
      }
    }
  };

  const toggleStickyKeys = () => {
    setIsStickyKeys(!isStickyKeys);
    if (isStickyKeys) {
      // When turning off sticky keys, release any held note
      setStickyNote(null);
      onKeyClick("");
    }
  };

  const WhiteKey = React.memo(
    ({
      isActive,
      onPointerDown,
      onPointerUp,
    }: {
      isActive: boolean;
      onPointerDown: () => void;
      onPointerUp: () => void;
    }) => (
      <div
        className={`${styles.whiteKey} ${
          isActive ? styles.whiteKeyActive : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      />
    )
  );

  const BlackKey = React.memo(
    ({
      isActive,
      position,
      width,
      onPointerDown,
      onPointerUp,
      onPointerEnter,
      onPointerLeave,
    }: {
      isActive: boolean;
      position: number;
      width: number;
      onPointerDown: () => void;
      onPointerUp: () => void;
      onPointerEnter: () => void;
      onPointerLeave: () => void;
    }) => (
      <div
        className={`${styles.blackKey} ${
          isActive ? styles.blackKeyActive : ""
        }`}
        style={{ left: `${position}%`, width: `${width}%` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      />
    )
  );
  const renderWhiteKeys = useCallback(() => {
    return keys
      .filter((key) => !key.isSharp)
      .map((key, index) => {
        const isActive = activeKeys.includes(key.note);
        return (
          <WhiteKey
            key={`white-${key.note}-${index}`}
            isActive={isActive}
            onPointerDown={() => {
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
          />
        );
      });
  }, [keys, activeKeys, WhiteKey, handleKeyPress, handleKeyRelease]);

  const renderBlackKeys = useCallback(() => {
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

        return (
          <BlackKey
            key={`black-${key.note}-${index}`}
            isActive={isActive}
            position={position}
            width={whiteKeyWidth * 0.7}
            onPointerDown={() => {
              handleKeyPress(key.note);
            }}
            onPointerUp={() => handleKeyRelease(key.note)}
            onPointerEnter={() => {
              // Optional: Add hover behavior here if needed
            }}
            onPointerLeave={() => {
              // Optional: Add hover behavior here if needed
            }}
          />
        );
      });
  }, [keys, activeKeys, BlackKey, handleKeyPress, handleKeyRelease]);

  // Expose the playNote method to parent components via ref
  useImperativeHandle(ref, () => ({
    playNote,
  }));

  return (
    <div className={styles.keyboardContainer}>
      <Button
        className={`${styles.button} ${
          isStickyKeys ? styles.buttonActive : ""
        }`}
        onClick={toggleStickyKeys}
        aria-pressed={isStickyKeys}
      >
        Hold
      </Button>
      <div className={styles.keyboard}>
        <div className={styles.pianoKeys}>
          <div className={styles.leftShadow} />
          {renderWhiteKeys()}
          <div className={styles.rightShadow} />
          {renderBlackKeys()}
        </div>
      </div>
    </div>
  );
};

export default Keyboard;
