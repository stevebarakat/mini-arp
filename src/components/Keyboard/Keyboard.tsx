import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import * as Tone from "tone";
import { INSTRUMENT_TYPES } from "../../constants";
import styles from "./Keyboard.module.css";
import { WhiteKey, BlackKey } from "./KeyboardKey";
import KeyboardControls from "./KeyboardControls";

type KeyboardProps = {
  activeKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  instrumentType?: string;
  ref?: React.RefObject<{
    playNote: (note: string) => void;
  }>;
};

// Keyboard mapping for QWERTY layout (common in music apps)
// Note: This is now generated dynamically based on current octave

// Octave control keys
const OCTAVE_CONTROLS: { [key: string]: "increment" | "decrement" } = {
  "=": "increment",
  "+": "increment",
  "-": "decrement",
  _: "decrement",
  z: "decrement",
  x: "increment",
};

function Keyboard({
  activeKeys = [],
  octaveRange = { min: 4, max: 5 },
  onKeyClick = () => {},
  instrumentType = INSTRUMENT_TYPES.SYNTH,
  ref,
}: KeyboardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<Tone.PolySynth | null>(null);
  const [currentInstrumentType, setCurrentInstrumentType] =
    useState(instrumentType);
  const [isStickyKeys, setIsStickyKeys] = useState(false);
  const [stickyNote, setStickyNote] = useState<string | null>(null);

  // Keep track of currently playing notes
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  // Keep track of computer keyboard pressed keys
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Current octave for keyboard mapping
  const [currentOctave, setCurrentOctave] = useState(4);

  // Create a keyboard with the specified octave range
  const keys = useMemo(() => {
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

    const keysArray: { note: string; isSharp: boolean }[] = [];
    for (let o = octaveRange.min; o <= octaveRange.max; o++) {
      octave.forEach((key) => {
        const note = `${key.note}${o}`;
        // Only include notes from G3 to C5
        const noteValue = Tone.Frequency(note).toMidi();
        const g3Value = Tone.Frequency("G3").toMidi();
        const c5Value = Tone.Frequency("C6").toMidi();

        if (noteValue >= g3Value && noteValue <= c5Value) {
          keysArray.push({ note, isSharp: key.isSharp });
        }
      });
    }
    return keysArray;
  }, [octaveRange.min, octaveRange.max]);

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
          // In non-sticky mode, add the note to active notes
          setActiveNotes((prev) => {
            const next = new Set(prev);
            next.add(note);
            return next;
          });
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
    (note: string, key: string) => {
      if (!instrument || !isLoaded) return;

      try {
        // Only release if this note is actually active and we're not in sticky mode
        if (activeNotes.has(note) && !isStickyKeys) {
          setActiveNotes((prev) => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });

          // Check if this was the last key being released
          const remainingPressedKeys = new Set(pressedKeys);
          remainingPressedKeys.delete(key);

          // Only stop the arpeggiator if no more keys are pressed
          if (remainingPressedKeys.size === 0) {
            onKeyClick("");
          }
        }
      } catch (e) {
        console.error("Error handling key release:", e);
      }
    },
    [instrument, isLoaded, isStickyKeys, onKeyClick, activeNotes, pressedKeys]
  );

  // Generate keyboard mapping based on current octave
  const getKeyboardMapping = useCallback(() => {
    const mapping: { [key: string]: string } = {};

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

    // Alternative mappings for some keys
    const altWhiteKeys = ["z", "x", "c", "v", "b", "n", "m"];
    const altWhiteNotes = ["C", "D", "E", "F", "G", "A", "B"];

    altWhiteKeys.forEach((key, index) => {
      mapping[key] = `${altWhiteNotes[index]}${currentOctave}`;
    });

    const altBlackKeys = ["q", "r", "5", "6", "7", "i", "9", "0"];
    const altBlackNotes = ["C#", "D#", "F#", "G#", "A#", "C#", "D#", "F#"];

    altBlackKeys.forEach((key, index) => {
      const octaveOffset = Math.floor(index / 5);
      const noteOctave = currentOctave + octaveOffset;
      mapping[key] = `${altBlackNotes[index]}${noteOctave}`;
    });

    return mapping;
  }, [currentOctave]);

  // Handle computer keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyboardMapping = getKeyboardMapping();
      const note = keyboardMapping[key];

      if (note && !pressedKeys.has(key)) {
        event.preventDefault();
        setPressedKeys((prev) => new Set(prev).add(key));
        handleKeyPress(note);
      } else if (OCTAVE_CONTROLS[key]) {
        event.preventDefault();
        if (OCTAVE_CONTROLS[key] === "increment" && currentOctave < 6) {
          setCurrentOctave((prev) => prev + 1);
        } else if (OCTAVE_CONTROLS[key] === "decrement" && currentOctave > 2) {
          setCurrentOctave((prev) => prev - 1);
        }
      }
    },
    [pressedKeys, handleKeyPress, getKeyboardMapping, currentOctave]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyboardMapping = getKeyboardMapping();
      const note = keyboardMapping[key];

      if (note && pressedKeys.has(key)) {
        event.preventDefault();
        setPressedKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        handleKeyRelease(note, key);
      }
    },
    [pressedKeys, handleKeyRelease, getKeyboardMapping]
  );

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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

  function toggleStickyKeys(checked: boolean) {
    setIsStickyKeys(checked);
    if (!checked) {
      // When turning off sticky keys, release any held note
      setStickyNote(null);
      onKeyClick("");
    }
  }

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
            onPointerUp={() => handleKeyRelease(key.note, "")}
          />
        );
      });
  }, [keys, activeKeys, handleKeyPress, handleKeyRelease]);

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
            onPointerUp={() => handleKeyRelease(key.note, "")}
            onPointerEnter={() => {
              // Optional: Add hover behavior here if needed
            }}
            onPointerLeave={() => {
              // Optional: Add hover behavior here if needed
            }}
          />
        );
      });
  }, [keys, activeKeys, handleKeyPress, handleKeyRelease]);

  // Expose the playNote method to parent components via ref
  useImperativeHandle(ref, () => ({
    playNote,
  }));

  return (
    <div className={styles.keyboardContainer}>
      <KeyboardControls
        isStickyKeys={isStickyKeys}
        currentOctave={currentOctave}
        onToggleStickyKeys={toggleStickyKeys}
        onOctaveChange={setCurrentOctave}
      />
      <div className={styles.keyboard}>
        <div className={styles.pianoKeys}>
          <div className={styles.leftShadow} />
          {renderWhiteKeys()}
          <div className={styles.rightShadow} />
          {renderBlackKeys()}
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
