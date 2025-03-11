import {
  DEFAULT_PITCH,
  DEFAULT_PATTERN,
  NOTES,
  STEPS,
  transposeNote,
} from "../constants/sequencer";
import { createMachine, assign } from "xstate";
import * as Tone from "tone";
import { DEFAULT_TEMPO } from "../constants/sequencer";

export type Grid = boolean[][];

// Define the intervals for note calculations
const INTERVALS = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

// Calculate semitones between two notes
const calculateSemitones = (fromNote: string, toNote: string): number => {
  const fromNoteName = fromNote.slice(0, -1);
  const fromOctave = parseInt(fromNote.slice(-1));
  const toNoteName = toNote.slice(0, -1);
  const toOctave = parseInt(toNote.slice(-1));

  const fromInterval = INTERVALS[fromNoteName as keyof typeof INTERVALS];
  const toInterval = INTERVALS[toNoteName as keyof typeof INTERVALS];

  // Calculate the total interval difference
  const octaveDiff = toOctave - fromOctave;
  const noteDiff = toInterval - fromInterval;

  return octaveDiff * 12 + noteDiff;
};

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string }
  | { type: "UPDATE_TEMPO"; tempo: number }
  | { type: "TOGGLE_CELL"; rowIndex: number; colIndex: number }
  | { type: "STEP_CHANGE"; step: number };

type SequencerContext = {
  note: string;
  grid: Grid;
  pitch: number;
  rootNote: string;
  tempo: number;
  currentStep: number;
  synth: Tone.AMSynth | null;
  sequence: Tone.Sequence | null;
};

export const sequencerMachine = createMachine({
  id: "sequencer",
  initial: "stopped",
  types: {} as {
    context: SequencerContext;
    events: SequencerEvent;
  },
  context: {
    note: "C4",
    rootNote: "C4",
    pitch: DEFAULT_PITCH,
    grid: DEFAULT_PATTERN,
    tempo: DEFAULT_TEMPO,
    currentStep: -1,
    synth: null,
    sequence: null,
  },
  entry: assign({
    synth: () => {
      return new Tone.AMSynth().toDestination();
    },
  }),
  exit: assign({
    synth: ({ context }) => {
      if (context.synth) {
        context.synth.dispose();
      }
      return null;
    },
    sequence: ({ context }) => {
      if (context.sequence) {
        context.sequence.dispose();
      }
      return null;
    },
  }),
  states: {
    stopped: {
      entry: assign(({ context }) => {
        // Clean up any existing sequence
        if (context.sequence) {
          context.sequence.stop();
        }
        Tone.getTransport().stop();
        Tone.getTransport().position = 0;
        if (context.synth) {
          context.synth.triggerRelease();
        }
        return {
          currentStep: -1,
        };
      }),
      on: {
        PLAY: {
          target: "playing",
          actions: assign(({ context }) => {
            // Always dispose of the previous sequence if it exists
            if (context.sequence) {
              context.sequence.dispose();
            }

            // Create a new sequence with the current root note
            let sequence = null;

            if (context.synth) {
              sequence = new Tone.Sequence(
                (time, step) => {
                  if (!context.synth) return;

                  context.grid.forEach((row, rowIndex) => {
                    if (row[step]) {
                      // Get the pattern note from the grid
                      const patternNote = NOTES[rowIndex];

                      // Calculate the interval from the root note to the pattern note
                      const interval = calculateSemitones("C4", patternNote);

                      // Apply the interval to the pressed key (root note)
                      const finalNote = transposeNote(
                        context.rootNote,
                        interval + context.pitch
                      );

                      context.synth?.triggerAttackRelease(
                        finalNote,
                        "8n",
                        time
                      );
                    }
                  });
                },
                Array.from({ length: STEPS }, (_, i) => i),
                "8n"
              );
            }

            // Start the transport
            Tone.getTransport().bpm.value = context.tempo;
            Tone.getTransport().position = 0;

            if (sequence) {
              sequence.start();
              Tone.getTransport().start();
            }

            return {
              sequence,
            };
          }),
        },
      },
    },
    playing: {
      on: {
        STOP: "stopped",
        STEP_CHANGE: {
          actions: assign({
            currentStep: ({ event }) => event.step,
          }),
        },
      },
    },
  },
  on: {
    UPDATE_NOTE: {
      actions: assign({
        note: ({ event }) => event.note,
      }),
    },
    UPDATE_PITCH: {
      actions: assign({
        pitch: ({ event }) => event.pitch,
      }),
    },
    SET_GRID: {
      actions: assign({
        grid: ({ event }) => event.grid,
      }),
    },
    SET_ROOT_NOTE: {
      actions: assign({
        rootNote: ({ event }) => event.note,
        sequence: () => null,
      }),
    },
    UPDATE_TEMPO: {
      actions: assign({
        tempo: ({ event }) => {
          Tone.getTransport().bpm.value = event.tempo;
          return event.tempo;
        },
      }),
    },
    TOGGLE_CELL: {
      actions: assign({
        grid: ({ context, event }) => {
          const { rowIndex, colIndex } = event;
          return context.grid.map((row, r) =>
            row.map((cell, c) => {
              if (c === colIndex) {
                // If this is the clicked cell, toggle it
                if (r === rowIndex) {
                  return !cell;
                }
                // If this is any other cell in the same column, deselect it
                return false;
              }
              // Keep other cells unchanged
              return cell;
            })
          );
        },
      }),
    },
  },
});
