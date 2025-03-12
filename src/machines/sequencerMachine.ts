import {
  DEFAULT_PITCH,
  DEFAULT_PATTERN,
  NOTES,
  transposeNote,
  SYNTH_CONFIG,
} from "../constants/sequencer";
import { setup, assign, fromCallback, enqueueActions } from "xstate";
import * as Tone from "tone";
import { DEFAULT_TEMPO } from "../constants/sequencer";
import { connectToEffects, EffectsContext } from "./effectsMachine";

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

// Hi-hat pattern configuration
const HI_HAT_CONFIG = {
  noise: {
    type: "white" as const,
  },
  envelope: {
    attack: 0.001,
    decay: 0.05,
    sustain: 0,
    release: 0.05,
  },
  volume: -15,
  filter: {
    type: "highpass" as const,
    frequency: 5000,
    Q: 1,
  },
};

// Default hi-hat pattern (16 steps)
export const DEFAULT_HI_HAT_PATTERN = Array(16)
  .fill(false)
  .map((_, i) => i % 2 === 0);

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string }
  | { type: "UPDATE_TEMPO"; tempo: number }
  | { type: "TOGGLE_CELL"; rowIndex: number; colIndex: number }
  | { type: "TOGGLE_HI_HAT"; step: number }
  | { type: "STEP_CHANGE"; step: number }
  | { type: "STORE_STEP_TRACKER_ID"; id: number }
  | { type: "CONNECT_TO_EFFECTS"; effectsContext: EffectsContext };

type SequencerContext = {
  note: string;
  rootNote: string;
  tempo: number;
  currentStep: number;
  synth: Tone.AMSynth | null;
  noiseSynth: Tone.NoiseSynth | null;
  sequence: Tone.Sequence | null;
  grid: Grid;
  hiHatPattern: boolean[];
  pitch: number;
  stepTrackerId: number | null;
  isConnectedToEffects: boolean;
};

export const sequencerMachine = setup({
  types: {
    context: {} as SequencerContext,
    events: {} as SequencerEvent,
  },
  actors: {
    stepTracker: fromCallback(({ sendBack }) => {
      const transport = Tone.getTransport();
      const id = transport.scheduleRepeat(() => {
        const step = Math.floor(transport.ticks / 96) % 16; // Changed to 16 steps
        sendBack({ type: "STEP_CHANGE", step });
      }, "16n");

      // Send the ID back to the parent machine
      sendBack({ type: "STORE_STEP_TRACKER_ID", id });

      return () => transport.clear(id);
    }),
  },
}).createMachine({
  id: "sequencer",
  initial: "stopped",
  context: {
    note: "C4",
    rootNote: "C4",
    tempo: DEFAULT_TEMPO,
    currentStep: -1,
    synth: null,
    noiseSynth: null,
    sequence: null,
    grid: DEFAULT_PATTERN,
    hiHatPattern: DEFAULT_HI_HAT_PATTERN,
    pitch: DEFAULT_PITCH,
    stepTrackerId: null,
    isConnectedToEffects: false,
  },
  entry: assign({
    // Create the synth
    synth: () => {
      console.log("Creating synth");
      const synth = new Tone.AMSynth(SYNTH_CONFIG);
      console.log("Synth created");
      return synth;
    },
    // Create the noise synth for hi-hats
    noiseSynth: () => {
      console.log("Creating noise synth for hi-hats");
      const noiseSynth = new Tone.NoiseSynth(HI_HAT_CONFIG);
      console.log("Noise synth created");
      return noiseSynth;
    },
  }),
  states: {
    stopped: {
      entry: [
        ({ context }) => {
          console.log("Entering stopped state");
          if (context.sequence) {
            context.sequence.stop();
          }
          Tone.getTransport().stop();
        },
      ],
      on: {
        PLAY: {
          target: "playing",
        },
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
          actions: [
            assign({
              rootNote: ({ event }) => event.note,
            }),
            ({ event }) => {
              console.log(`Root note changed to ${event.note}`);
            },
          ],
        },
        UPDATE_TEMPO: {
          actions: [
            assign({
              tempo: ({ event }) => event.tempo,
            }),
            ({ context }) => {
              Tone.getTransport().bpm.value = context.tempo;
            },
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) => {
              const newGrid = [...context.grid];

              // Create a deep copy of the grid
              for (let i = 0; i < newGrid.length; i++) {
                newGrid[i] = [...newGrid[i]];
              }

              // If the cell is already selected, just deselect it
              if (newGrid[event.rowIndex][event.colIndex]) {
                newGrid[event.rowIndex][event.colIndex] = false;
              } else {
                // If the cell is not selected, first deselect any other cells in the same column
                for (let rowIdx = 0; rowIdx < newGrid.length; rowIdx++) {
                  newGrid[rowIdx][event.colIndex] = false;
                }
                // Then select the clicked cell
                newGrid[event.rowIndex][event.colIndex] = true;
              }

              return newGrid;
            },
          }),
        },
        TOGGLE_HI_HAT: {
          actions: assign({
            hiHatPattern: ({ context, event }) => {
              const newPattern = [...context.hiHatPattern];
              newPattern[event.step] = !newPattern[event.step];
              return newPattern;
            },
          }),
        },
        CONNECT_TO_EFFECTS: {
          actions: [
            ({ context, event }) => {
              if (context.synth) {
                console.log("Connecting synth to effects");
                connectToEffects(context.synth, event.effectsContext);
              }
              if (context.noiseSynth) {
                console.log("Connecting hi-hat to effects");
                connectToEffects(context.noiseSynth, event.effectsContext);
              }
              return true;
            },
            assign({
              isConnectedToEffects: () => {
                return true;
              },
            }),
          ],
        },
      },
    },
    playing: {
      entry: [
        ({ context }) => {
          console.log("Entering playing state");
          Tone.getTransport().bpm.value = context.tempo;
        },
        assign({
          sequence: ({ context }) => {
            console.log(
              `Creating sequence with root note: ${context.rootNote}`
            );

            // Create a new sequence
            const seq = new Tone.Sequence(
              (time, step) => {
                // Play melodic pattern
                context.grid.forEach((row, rowIndex) => {
                  if (row[step % 8]) {
                    // Use modulo 8 for melodic pattern
                    // Calculate the note to play based on the root note and row
                    const baseNote = NOTES[rowIndex];
                    const patternInterval = calculateSemitones("C4", baseNote);
                    const noteToPlay = transposeNote(
                      context.rootNote,
                      patternInterval + context.pitch
                    );

                    // Play the note
                    if (context.synth) {
                      context.synth.triggerAttackRelease(
                        noteToPlay,
                        "16n",
                        time
                      );
                    }
                  }
                });

                // Play hi-hat pattern
                if (context.hiHatPattern[step] && context.noiseSynth) {
                  context.noiseSynth.triggerAttackRelease("16n", time);
                }
              },
              Array.from({ length: 16 }, (_, i) => i), // 16-step sequence
              "16n"
            );

            // Start the sequence
            seq.start(0);
            Tone.getTransport().start();

            return seq;
          },
        }),
        // Start the step tracker
        enqueueActions(({ enqueue }) => {
          enqueue.spawnChild("stepTracker");
        }),
      ],
      on: {
        STOP: {
          target: "stopped",
        },
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
          actions: [
            assign({
              rootNote: ({ event }) => event.note,
            }),
            ({ event }) => {
              console.log(`Root note changed to ${event.note} while playing`);
            },
          ],
        },
        UPDATE_TEMPO: {
          actions: [
            assign({
              tempo: ({ event }) => event.tempo,
            }),
            ({ context }) => {
              Tone.getTransport().bpm.value = context.tempo;
            },
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) => {
              const newGrid = [...context.grid];

              // Create a deep copy of the grid
              for (let i = 0; i < newGrid.length; i++) {
                newGrid[i] = [...newGrid[i]];
              }

              // If the cell is already selected, just deselect it
              if (newGrid[event.rowIndex][event.colIndex]) {
                newGrid[event.rowIndex][event.colIndex] = false;
              } else {
                // If the cell is not selected, first deselect any other cells in the same column
                for (let rowIdx = 0; rowIdx < newGrid.length; rowIdx++) {
                  newGrid[rowIdx][event.colIndex] = false;
                }
                // Then select the clicked cell
                newGrid[event.rowIndex][event.colIndex] = true;
              }

              return newGrid;
            },
          }),
        },
        TOGGLE_HI_HAT: {
          actions: assign({
            hiHatPattern: ({ context, event }) => {
              const newPattern = [...context.hiHatPattern];
              newPattern[event.step] = !newPattern[event.step];
              return newPattern;
            },
          }),
        },
        STEP_CHANGE: {
          actions: assign({
            currentStep: ({ event }) => event.step,
          }),
        },
        STORE_STEP_TRACKER_ID: {
          actions: assign({
            stepTrackerId: ({ event }) => event.id,
          }),
        },
        CONNECT_TO_EFFECTS: {
          actions: [
            ({ context, event }) => {
              if (context.synth) {
                console.log("Connecting synth to effects");
                connectToEffects(context.synth, event.effectsContext);
              }
              if (context.noiseSynth) {
                console.log("Connecting hi-hat to effects");
                connectToEffects(context.noiseSynth, event.effectsContext);
              }
              return true;
            },
            assign({
              isConnectedToEffects: () => {
                return true;
              },
            }),
          ],
        },
      },
      exit: [
        ({ context }) => {
          if (context.sequence) {
            context.sequence.stop();
          }
          if (context.stepTrackerId !== null) {
            Tone.getTransport().clear(context.stepTrackerId);
          }
        },
      ],
    },
  },
  exit: [
    ({ context }) => {
      // Clean up resources
      if (context.sequence) {
        context.sequence.dispose();
      }
      if (context.synth) {
        context.synth.dispose();
      }
      if (context.noiseSynth) {
        context.noiseSynth.dispose();
      }
    },
  ],
});
