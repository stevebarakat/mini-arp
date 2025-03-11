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

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string }
  | { type: "UPDATE_TEMPO"; tempo: number }
  | { type: "TOGGLE_CELL"; rowIndex: number; colIndex: number }
  | { type: "STEP_CHANGE"; step: number }
  | { type: "STORE_STEP_TRACKER_ID"; id: number }
  | { type: "CONNECT_TO_EFFECTS"; effectsContext: EffectsContext };

type SequencerContext = {
  note: string;
  rootNote: string;
  tempo: number;
  currentStep: number;
  synth: Tone.AMSynth | null;
  sequence: Tone.Sequence | null;
  grid: Grid;
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
        const step = Math.floor(transport.ticks / 96) % 8;
        sendBack({ type: "STEP_CHANGE", step });
      }, "8n");

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
    sequence: null,
    grid: DEFAULT_PATTERN,
    pitch: DEFAULT_PITCH,
    stepTrackerId: null,
    isConnectedToEffects: false,
  },
  entry: assign({
    // Create the synth
    synth: () => {
      console.log("Creating synth");

      // Create the synth
      const synth = new Tone.AMSynth(SYNTH_CONFIG);

      console.log("Synth created");

      return synth;
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
          Tone.Transport.stop();
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
          actions: assign({
            rootNote: ({ event }) => event.note,
          }),
        },
        UPDATE_TEMPO: {
          actions: [
            assign({
              tempo: ({ event }) => event.tempo,
            }),
            ({ context }) => {
              Tone.Transport.bpm.value = context.tempo;
            },
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) => {
              const newGrid = [...context.grid];
              newGrid[event.rowIndex] = [...newGrid[event.rowIndex]];
              newGrid[event.rowIndex][event.colIndex] =
                !newGrid[event.rowIndex][event.colIndex];
              return newGrid;
            },
          }),
        },
        CONNECT_TO_EFFECTS: {
          actions: [
            ({ context, event }) => {
              if (context.synth) {
                console.log("Connecting synth to effects");
                connectToEffects(context.synth, event.effectsContext);
                return true;
              }
              return false;
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
          Tone.Transport.bpm.value = context.tempo;
        },
        assign({
          sequence: ({ context }) => {
            // Create a new sequence
            const seq = new Tone.Sequence(
              (time, step) => {
                // For each step, check which notes should be played
                context.grid.forEach((row, rowIndex) => {
                  if (row[step]) {
                    // Calculate the note to play based on the root note and row
                    const baseNote = NOTES[rowIndex];
                    const semitones = calculateSemitones(
                      context.rootNote,
                      baseNote
                    );
                    const noteToPlay = transposeNote(
                      context.rootNote,
                      semitones + context.pitch
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
              },
              [0, 1, 2, 3, 4, 5, 6, 7],
              "8n"
            );

            // Start the sequence
            seq.start(0);
            Tone.Transport.start();

            return seq;
          },
        }),
        // Start the step tracker using enqueueActions
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
          actions: assign({
            rootNote: ({ event }) => event.note,
          }),
        },
        UPDATE_TEMPO: {
          actions: [
            assign({
              tempo: ({ event }) => event.tempo,
            }),
            ({ context }) => {
              Tone.Transport.bpm.value = context.tempo;
            },
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) => {
              const newGrid = [...context.grid];
              newGrid[event.rowIndex] = [...newGrid[event.rowIndex]];
              newGrid[event.rowIndex][event.colIndex] =
                !newGrid[event.rowIndex][event.colIndex];
              return newGrid;
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
                return true;
              }
              return false;
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
            Tone.Transport.clear(context.stepTrackerId);
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
    },
  ],
});
