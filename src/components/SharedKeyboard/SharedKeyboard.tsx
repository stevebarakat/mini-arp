import React, { useState, useEffect, useImperativeHandle } from "react";
import * as Tone from "tone";
import { INSTRUMENT_TYPES } from "@/consts";
import "./shared-keyboard.css";

interface SharedKeyboardProps {
  activeKeys?: string[];
  highlightedKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  instrumentType?: string;
  ref?: React.RefObject<{
    playNote: (note: string) => void;
  }>;
}

const SharedKeyboard = ({
  activeKeys = [],
  highlightedKeys = [],
  octaveRange = { min: 4, max: 5 },
  onKeyClick = () => {},
  instrumentType = INSTRUMENT_TYPES.PIANO,
  ref,
}: SharedKeyboardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<
    Tone.PolySynth | Tone.Sampler | null
  >(null);
  const [currentInstrumentType, setCurrentInstrumentType] =
    useState(instrumentType);
  const [isStickyKeys, setIsStickyKeys] = useState(false);
  const [stickyNote, setStickyNote] = useState<string | null>(null);

  // Define notes for one octave - using sharp notation
  const octave = [
    { note: "C", isSharp: false, label: "C" },
    { note: "C#", isSharp: true, label: "C♯", flatLabel: "D♭" },
    { note: "D", isSharp: false, label: "D" },
    { note: "D#", isSharp: true, label: "D♯", flatLabel: "E♭" },
    { note: "E", isSharp: false, label: "E" },
    { note: "F", isSharp: false, label: "F" },
    { note: "F#", isSharp: true, label: "F♯", flatLabel: "G♭" },
    { note: "G", isSharp: false, label: "G" },
    { note: "G#", isSharp: true, label: "G♯", flatLabel: "A♭" },
    { note: "A", isSharp: false, label: "A" },
    { note: "A#", isSharp: true, label: "A♯", flatLabel: "B♭" },
    { note: "B", isSharp: false, label: "B" },
  ];
  // Create a keyboard with the specified octave range
  const keys: { note: string; isSharp: boolean; label: string }[] = [];
  for (let o = octaveRange.min; o <= octaveRange.max; o++) {
    octave.forEach((key) => {
      const note = `${key.note}${o}`;
      // Only include notes from G3 to C5
      const noteValue = Tone.Frequency(note).toMidi();
      const g3Value = Tone.Frequency("G3").toMidi();
      const c5Value = Tone.Frequency("C6").toMidi();

      if (noteValue >= g3Value && noteValue <= c5Value) {
        keys.push({ ...key, note });
      }
    });
  }

  // Initialize the instrument
  useEffect(() => {
    if (currentInstrumentType !== instrumentType) {
      setCurrentInstrumentType(instrumentType);
      setIsLoaded(false);
      if (instrument) {
        instrument.dispose();
      }
    }

    const initializeInstrument = async () => {
      try {
        let newInstrument: Tone.PolySynth | Tone.Sampler;

        // Use Tone.js built-in samples for reliability
        if (instrumentType === INSTRUMENT_TYPES.SYNTH) {
          newInstrument = new Tone.PolySynth(Tone.Synth, {
            envelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.3,
              release: 1,
            },
          }).toDestination();
          setIsLoaded(true);
          setInstrument(newInstrument as Tone.PolySynth); // Type assertion to fix type error
        } else {
          // For sampled instruments, use different configurations based on instrument type
          const baseUrl = "https://tonejs.github.io/audio/salamander/";
          let sampleConfig: Partial<Tone.SamplerOptions> = {
            urls: {
              A0: "A0.mp3",
              C1: "C1.mp3",
              "D#1": "Ds1.mp3",
              "F#1": "Fs1.mp3",
              A1: "A1.mp3",
              C2: "C2.mp3",
              "D#2": "Ds2.mp3",
              "F#2": "Fs2.mp3",
              A2: "A2.mp3",
              C3: "C3.mp3",
              "D#3": "Ds3.mp3",
              "F#3": "Fs3.mp3",
              A3: "A3.mp3",
              C4: "C4.mp3",
              "D#4": "Ds4.mp3",
              "F#4": "Fs4.mp3",
              A4: "A4.mp3",
              C5: "C5.mp3",
              "D#5": "Ds5.mp3",
              "F#5": "Fs5.mp3",
              A5: "A5.mp3",
              C6: "C6.mp3",
              "D#6": "Ds6.mp3",
              "F#6": "Fs6.mp3",
              A6: "A6.mp3",
              C7: "C7.mp3",
              "D#7": "Ds7.mp3",
              "F#7": "Fs7.mp3",
              A7: "A7.mp3",
            },
            baseUrl: "",
            onload: () => {},
            onerror: () => {},
          };

          // Customize the synth based on instrument type
          switch (instrumentType) {
            case INSTRUMENT_TYPES.PIANO:
              // Use default piano samples
              break;

            case INSTRUMENT_TYPES.XYLO:
              // Use local xylophone samples in MP3 format
              const xyloUrls: Record<string, string> = {};

              // Define available notes and octaves for xylophone samples
              const xyloNotes = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ];

              // Add available samples for octaves 4-7
              // For octave 4, exclude C, D, and E which are missing
              const xyloNotesOctave4 = ["F", "F#", "G", "G#", "A", "A#", "B"];
              xyloNotesOctave4.forEach((note) => {
                const noteWithOctave = `${note}4`;
                // Use URL-safe filenames (Fs instead of F#)
                const safeNote = note.replace("#", "s");
                xyloUrls[noteWithOctave] = `${safeNote}4.mp3`;
              });

              // Add available samples for octaves 5-7
              [5, 6, 7].forEach((octave) => {
                xyloNotes.forEach((note) => {
                  // Only include notes that we have samples for
                  const noteWithOctave = `${note}${octave}`;
                  // Use URL-safe filenames (Cs instead of C#)
                  const safeNote = note.replace("#", "s");
                  xyloUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              // Add C8 separately (the only note in octave 8)
              xyloUrls["C8"] = "C8.mp3";

              // Create a sampler with the xylophone samples
              newInstrument = new Tone.Sampler({
                urls: xyloUrls,
                baseUrl: "/audio/xylo-mp3/",
                onload: () => {
                  console.log("Xylophone samples loaded successfully!");
                  setIsLoaded(true);
                  setInstrument(newInstrument);
                },
                onerror: (error: Error) => {
                  console.error("Error loading xylophone samples:", error);
                  setIsLoaded(true);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.FLUTE:
              // Use local flute samples in MP3 format
              const fluteUrls: Record<string, string> = {};

              // Define available notes and octaves for flute samples
              const fluteNotes = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ];

              // Add available samples for octaves 3-6
              [4, 5, 6].forEach((octave) => {
                fluteNotes.forEach((note) => {
                  // Only include notes that we have samples for
                  const noteWithOctave = `${note}${octave}`;
                  // Use URL-safe filenames (Cs instead of C#)
                  const safeNote = note.replace("#", "s");
                  fluteUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              // Add C#7 and B3 separately (the only notes in each octave)
              fluteUrls["B3"] = "B3.mp3";
              fluteUrls["C#7"] = "Cs7.mp3";

              // Create a sampler with the flute samples
              newInstrument = new Tone.Sampler({
                urls: fluteUrls,
                baseUrl: "/audio/flute-mp3/",
                onload: () => {
                  console.log("Flute samples loaded successfully!");
                  setIsLoaded(true);
                  setInstrument(newInstrument);
                },
                onerror: (error: Error) => {
                  console.error("Error loading flute samples:", error);
                  setIsLoaded(true);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.VIOLIN:
              // Use local violin samples in MP3 format
              const violinUrls: Record<string, string> = {};

              // Define available notes and octaves for violin samples
              const violinNotes = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ];

              // Add available samples for octaves 3-6
              // For octave 3, only include the available notes (A, G#, B, A#)
              const violinNotesOctave3 = ["G#", "A", "A#", "B"];
              violinNotesOctave3.forEach((note) => {
                const noteWithOctave = `${note}3`;
                // Use URL-safe filenames (Gs instead of G#)
                const safeNote = note.replace("#", "s");
                violinUrls[noteWithOctave] = `${safeNote}3.mp3`;
              });

              // Add available samples for octaves 4-6
              [4, 5, 6].forEach((octave) => {
                violinNotes.forEach((note) => {
                  // Only include notes that we have samples for
                  const noteWithOctave = `${note}${octave}`;
                  // Use URL-safe filenames (Cs instead of C#)
                  const safeNote = note.replace("#", "s");
                  violinUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });

              // Add available notes for octave 7 (C7, C#7, D7, D#7, E7)
              const violinNotesOctave7 = ["C", "C#", "D", "D#", "E"];
              violinNotesOctave7.forEach((note) => {
                const noteWithOctave = `${note}7`;
                // Use URL-safe filenames (Cs instead of C#)
                const safeNote = note.replace("#", "s");
                violinUrls[noteWithOctave] = `${safeNote}7.mp3`;
              });

              // Create a sampler with the violin samples
              newInstrument = new Tone.Sampler({
                urls: violinUrls,
                baseUrl: "/audio/violin-mp3/",
                onload: () => {
                  console.log("Violin samples loaded successfully!");
                  setIsLoaded(true);
                  setInstrument(newInstrument);
                },
                onerror: (error: Error) => {
                  console.error("Error loading violin samples:", error);
                  setIsLoaded(true);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.CELLO:
              // Use local cello samples in MP3 format
              const celloUrls: Record<string, string> = {};

              // Define available notes and octaves for cello samples
              const celloNotes = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ];

              // Add available samples for octaves 2-4
              [2, 3, 4].forEach((octave) => {
                celloNotes.forEach((note) => {
                  // Only include notes that we have samples for
                  const noteWithOctave = `${note}${octave}`;
                  // Use URL-safe filenames (Cs instead of C#)
                  const safeNote = note.replace("#", "s");
                  celloUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });

              // For octave 5, only include the notes we have samples for
              const availableNotesOctave5 = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
              ];
              availableNotesOctave5.forEach((note) => {
                const noteWithOctave = `${note}5`;
                // Use URL-safe filenames (Cs instead of C#)
                const safeNote = note.replace("#", "s");
                celloUrls[noteWithOctave] = `${safeNote}5.mp3`;
              });

              // Create a sampler with the cello samples
              newInstrument = new Tone.Sampler({
                urls: celloUrls,
                baseUrl: "/audio/cello-mp3/",
                onload: () => {
                  console.log("Cello samples loaded successfully!");
                  setIsLoaded(true);
                  setInstrument(newInstrument);
                },
                onerror: (error: Error) => {
                  console.error("Error loading cello samples:", error);
                  setIsLoaded(true);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.HORN:
              // Use local horn samples in MP3 format
              const hornUrls: Record<string, string> = {};

              // Define available notes and octaves for horn samples
              const hornNotes = [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ];

              // Add available samples for octaves 1-2
              [1, 2].forEach((octave) => {
                // Only include notes that exist for octave 1 (just A#1 and B1)
                if (octave === 1) {
                  ["A#", "B"].forEach((note) => {
                    const noteWithOctave = `${note}${octave}`;
                    // Use URL-safe filenames (As instead of A#)
                    const safeNote = note.replace("#", "s");
                    hornUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                  });
                } else {
                  // Include all notes for octave 2
                  hornNotes.forEach((note) => {
                    const noteWithOctave = `${note}${octave}`;
                    // Use URL-safe filenames (Cs instead of C#)
                    const safeNote = note.replace("#", "s");
                    hornUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                  });
                }
              });

              // Add available samples for octaves 3-4
              [3, 4].forEach((octave) => {
                hornNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  // Use URL-safe filenames (Cs instead of C#)
                  const safeNote = note.replace("#", "s");
                  hornUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });

              // For octave 5, only include the notes we have samples for
              const hornNotesOctave5 = ["C", "C#", "D", "D#", "E", "F"];
              hornNotesOctave5.forEach((note) => {
                const noteWithOctave = `${note}5`;
                // Use URL-safe filenames (Cs instead of C#)
                const safeNote = note.replace("#", "s");
                hornUrls[noteWithOctave] = `${safeNote}5.mp3`;
              });

              // Create a sampler with the horn samples
              newInstrument = new Tone.Sampler({
                urls: hornUrls,
                baseUrl: "/audio/horn-mp3/",
                onload: () => {
                  console.log("Horn samples loaded successfully!");
                  setIsLoaded(true);
                  setInstrument(newInstrument);
                },
                onerror: (error: Error) => {
                  console.error("Error loading horn samples:", error);
                  setIsLoaded(true);
                },
              }).toDestination();
              return;
          }

          // Common configuration for sampled instruments
          sampleConfig = {
            ...sampleConfig,
            baseUrl,
            onload: () => {
              console.log(`${instrumentType} samples loaded successfully!`);
              setIsLoaded(true);
              setInstrument(newInstrument);
            },
            onerror: (error: Error) => {
              console.error(`Error loading ${instrumentType} samples:`, error);
              setIsLoaded(true);
            },
          };

          // Create the sampler with the appropriate configuration
          newInstrument = new Tone.Sampler(sampleConfig).toDestination();
        }

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
      if (instrument) {
        instrument.dispose();
      }
    };
  }, [instrumentType, currentInstrumentType, instrument]);

  // Play a note
  const playNote = async (note: string) => {
    if (instrument && isLoaded) {
      try {
        // Ensure audio context is running
        if (Tone.context.state !== "running") {
          await Tone.start();
        }
        instrument.triggerAttackRelease(note, "2n");
      } catch (e) {
        console.error("Error playing note:", e);
        setTimeout(() => {
          setIsLoaded(true);
        }, 3000);
      }
    }
  };

  // Handle key press
  const handleKeyPress = (note: string) => {
    if (isStickyKeys) {
      if (stickyNote === note) {
        // If clicking the same note, release it
        setStickyNote(null);
        onKeyClick("");
      } else {
        // If clicking a different note, switch to it
        setStickyNote(note);
        onKeyClick(note);
      }
    } else {
      // In non-sticky mode, just trigger the note
      onKeyClick(note);
    }
  };

  // Handle key release
  const handleKeyRelease = () => {
    if (!isStickyKeys) {
      // Only trigger release in non-sticky mode
      onKeyClick("");
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

  // Render white keys
  const renderWhiteKeys = () => {
    return keys
      .filter((key) => !key.isSharp)
      .map((key, index) => {
        const isActive =
          activeKeys.includes(key.note) || stickyNote === key.note;
        const isHighlighted = highlightedKeys.includes(key.note);

        return (
          <div
            key={`white-${key.note}-${index}`}
            className={`white-key ${isActive ? "active" : ""} ${
              isHighlighted ? "highlighted" : ""
            }`}
            onPointerDown={() => handleKeyPress(key.note)}
            onPointerUp={handleKeyRelease}
            onPointerLeave={handleKeyRelease}
          />
        );
      });
  };

  // Render black keys
  const renderBlackKeys = () => {
    // Calculate positions for black keys
    const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length; // percentage width

    return keys
      .filter((key) => key.isSharp)
      .map((key, index) => {
        const isActive =
          activeKeys.includes(key.note) || stickyNote === key.note;
        const isHighlighted = highlightedKeys.includes(key.note);

        // Find the index of this black key in the full keys array
        const keyIndex = keys.findIndex((k) => k.note === key.note);
        // Calculate how many white keys came before this black key
        const whiteKeysBefore = keys
          .slice(0, keyIndex)
          .filter((k) => !k.isSharp).length;
        // Position is based on white keys
        const position = (whiteKeysBefore - 0.3) * whiteKeyWidth;

        return (
          <div
            key={`black-${key.note}-${index}`}
            className={`black-key ${isActive ? "active" : ""} ${
              isHighlighted ? "highlighted" : ""
            }`}
            style={{ left: `${position}%`, width: `${whiteKeyWidth * 0.7}%` }}
            onPointerDown={() => handleKeyPress(key.note)}
            onPointerUp={handleKeyRelease}
            onPointerLeave={handleKeyRelease}
          />
        );
      });
  };

  // Expose the playNote method to parent components via ref
  useImperativeHandle(ref, () => ({
    playNote,
  }));

  return (
    <>
      <button
        className={`sticky-keys-button ${isStickyKeys ? "active" : ""}`}
        onClick={toggleStickyKeys}
        aria-pressed={isStickyKeys}
      >
        HOLD
      </button>
      <div className="shared-keyboard">
        <div className="piano-keys">
          {renderWhiteKeys()}
          {renderBlackKeys()}
        </div>
      </div>
    </>
  );
};

export default SharedKeyboard;
