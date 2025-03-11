export const NOTES = ["B4", "G4", "E4", "C4"] as const;
export const STEPS = 8;
export const MIN_TEMPO = 60;
export const MAX_TEMPO = 200;
export const DEFAULT_TEMPO = 120;

export const SYNTH_CONFIG = {
  oscillator: {
    type: "triangle" as const,
  },
  envelope: {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 1,
  },
};
