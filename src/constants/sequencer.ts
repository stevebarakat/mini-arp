export const BASE_NOTES = ["B", "G", "E", "C"] as const;
export const DEFAULT_OCTAVE = 4;
export const MIN_PITCH_SHIFT = -24; // 2 octaves down
export const MAX_PITCH_SHIFT = 24; // 2 octaves up
export const DEFAULT_PITCH = 0;

// Default pattern for the sequencer grid
// Creates an ascending arpeggio pattern
export const DEFAULT_PATTERN = [
  [true, false, false, false, false, false, false, false], // B
  [false, true, false, false, false, false, false, true], // G
  [false, false, true, false, true, false, true, false], // E
  [false, false, false, true, false, true, false, false], // C
];

// Helper function to transpose a note by semitones
export function transposeNote(note: string, semitones: number): string {
  const noteMap = [
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
  const noteName = note.slice(0, -1); // Remove octave number
  const octave = parseInt(note.slice(-1));

  const currentIndex = noteMap.indexOf(noteName);
  const newIndex = (currentIndex + semitones) % 12;
  const octaveShift = Math.floor((currentIndex + semitones) / 12);

  return `${noteMap[newIndex < 0 ? newIndex + 12 : newIndex]}${
    octave + octaveShift
  }`;
}

// Generate the default notes
export const NOTES = BASE_NOTES.map(
  (note) => `${note}${DEFAULT_OCTAVE}`
) as string[];
export const STEPS = 8;
export const MIN_TEMPO = 60;
export const MAX_TEMPO = 200;
export const DEFAULT_TEMPO = 120;

export const SYNTH_CONFIG = {
  harmonicity: 3, // Ratio between carrier and modulator frequencies
  oscillator: {
    type: "fatsquare" as const,
    spread: 60,
    count: 5,
  },
  envelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.4,
    release: 0.6,
  },
  modulation: {
    type: "square" as const, // Modulator waveform
    phase: 0,
  },
  modulationEnvelope: {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 0.4,
  },
  volume: -8,
  detune: 10,
};
