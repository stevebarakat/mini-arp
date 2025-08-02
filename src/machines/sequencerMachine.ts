import {
  DEFAULT_PITCH,
  DEFAULT_PATTERN,
  NOTES,
  transposeNote,
  SYNTH_CONFIG,
} from "../constants";
import { setup, assign, fromCallback, enqueueActions } from "xstate";
import { AMSynth, NoiseSynth, Sequence, getTransport, Frequency } from "tone";
import { DEFAULT_TEMPO } from "../constants";
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
} as const;

// Calculate semitones between two notes
const calculateSemitones = (fromNote: string, toNote: string): number => {
  const fromNoteName = fromNote.slice(0, -1);
  const fromOctave = parseInt(fromNote.slice(-1));
  const toNoteName = toNote.slice(0, -1);
  const toOctave = parseInt(toNote.slice(-1));

  const fromInterval = INTERVALS[fromNoteName as keyof typeof INTERVALS];
  const toInterval = INTERVALS[toNoteName as keyof typeof INTERVALS];

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
} as const;

// Default hi-hat pattern (8 steps)
export const DEFAULT_HI_HAT_PATTERN = Array(8)
  .fill(false)
  .map((_, i) => i % 2 === 0);

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string }
  | { type: "TRANSPOSE_TO_NOTE"; note: string }
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
  synth: AMSynth | null;
  noiseSynth: NoiseSynth | null;
  sequence: Sequence | null;
  grid: Grid;
  hiHatPattern: boolean[];
  pitch: number;
  stepTrackerId: number | null;
  isConnectedToEffects: boolean;
};

// Pure functions for grid manipulation
const createDeepGridCopy = (grid: Grid): Grid => {
  return grid.map((row) => [...row]);
};

const toggleGridCell = (
  grid: Grid,
  rowIndex: number,
  colIndex: number
): Grid => {
  const newGrid = createDeepGridCopy(grid);

  if (newGrid[rowIndex][colIndex]) {
    newGrid[rowIndex][colIndex] = false;
  } else {
    for (let rowIdx = 0; rowIdx < newGrid.length; rowIdx++) {
      newGrid[rowIdx][colIndex] = false;
    }
    newGrid[rowIndex][colIndex] = true;
  }

  return newGrid;
};

const toggleHiHatStep = (pattern: boolean[], step: number): boolean[] => {
  const newPattern = [...pattern];
  newPattern[step] = !newPattern[step];
  return newPattern;
};

// Pure function to calculate note to play
const calculateNoteToPlay = (
  rootNote: string,
  rowIndex: number,
  pitch: number
): string => {
  const baseNote = NOTES[rowIndex];
  const patternInterval = calculateSemitones("C4", baseNote);
  return transposeNote(rootNote, patternInterval + pitch);
};

// Pure function to create sequence callback
const createSequenceCallback =
  (context: SequencerContext) => (time: number, step: number) => {
    // Play melodic pattern
    context.grid.forEach((row, rowIndex) => {
      if (row[step % 8]) {
        const noteToPlay = calculateNoteToPlay(
          context.rootNote,
          rowIndex,
          context.pitch
        );

        if (context.synth) {
          context.synth.triggerAttackRelease(noteToPlay, "8n", time);
        }
      }
    });

    // Play hi-hat pattern
    if (context.hiHatPattern[step] && context.noiseSynth) {
      context.noiseSynth.triggerAttackRelease("8n", time);
    }
  };

// Pure function to create and start sequence
const createAndStartSequence = (context: SequencerContext): Sequence => {
  const seq = new Sequence(
    createSequenceCallback(context),
    Array.from({ length: 8 }, (_, i) => i),
    "8n"
  );

  seq.start(0);
  getTransport().start();
  return seq;
};

// Pure function to recreate sequence
const recreateSequence = (context: SequencerContext): void => {
  if (context.sequence) {
    context.sequence.dispose();
    const newSequence = createAndStartSequence(context);
    context.sequence = newSequence;
  }
};

// Pure function to connect synths to effects
const connectSynthsToEffects = (
  context: SequencerContext,
  effectsContext: EffectsContext
): void => {
  if (context.synth) {
    connectToEffects(context.synth, effectsContext);
  }
  if (context.noiseSynth) {
    connectToEffects(context.noiseSynth, effectsContext);
  }
};

// Pure function to update tempo
const updateTempo = (tempo: number): void => {
  getTransport().bpm.value = tempo;
};

// Pure function to stop transport and sequence
const stopTransportAndSequence = (context: SequencerContext): void => {
  if (context.sequence) {
    context.sequence.stop();
  }
  getTransport().stop();
};

// Pure function to clean up step tracker
const cleanupStepTracker = (context: SequencerContext): void => {
  if (context.stepTrackerId !== null) {
    getTransport().clear(context.stepTrackerId);
  }
};

// Pure function to dispose resources
const disposeResources = (context: SequencerContext): void => {
  if (context.sequence) {
    context.sequence.dispose();
  }
  if (context.synth) {
    context.synth.dispose();
  }
  if (context.noiseSynth) {
    context.noiseSynth.dispose();
  }
};

export const sequencerMachine = setup({
  types: {
    context: {} as SequencerContext,
    events: {} as SequencerEvent,
  },
  actors: {
    stepTracker: fromCallback(({ sendBack }) => {
      const transport = getTransport();
      const id = transport.scheduleRepeat(() => {
        const step = Math.floor(transport.ticks / 96) % 8;
        sendBack({ type: "STEP_CHANGE", step });
      }, "8n");

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
    synth: () => new AMSynth(SYNTH_CONFIG),
    noiseSynth: () => new NoiseSynth(HI_HAT_CONFIG),
  }),
  states: {
    stopped: {
      entry: ({ context }) => stopTransportAndSequence(context),
      on: {
        PLAY: { target: "playing" },
        UPDATE_NOTE: {
          actions: assign({ note: ({ event }) => event.note }),
        },
        UPDATE_PITCH: {
          actions: assign({ pitch: ({ event }) => event.pitch }),
        },
        SET_GRID: {
          actions: assign({ grid: ({ event }) => event.grid }),
        },
        SET_ROOT_NOTE: {
          actions: assign({ rootNote: ({ event }) => event.note }),
        },
        TRANSPOSE_TO_NOTE: {
          actions: assign({ rootNote: ({ event }) => event.note }),
        },
        UPDATE_TEMPO: {
          actions: [
            assign({ tempo: ({ event }) => event.tempo }),
            ({ context }) => updateTempo(context.tempo),
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) =>
              toggleGridCell(context.grid, event.rowIndex, event.colIndex),
          }),
        },
        TOGGLE_HI_HAT: {
          actions: assign({
            hiHatPattern: ({ context, event }) =>
              toggleHiHatStep(context.hiHatPattern, event.step),
          }),
        },
        CONNECT_TO_EFFECTS: {
          actions: [
            ({ context, event }) =>
              connectSynthsToEffects(context, event.effectsContext),
            assign({ isConnectedToEffects: () => true }),
          ],
        },
      },
    },
    playing: {
      entry: [
        ({ context }) => updateTempo(context.tempo),
        assign({
          sequence: ({ context }) => createAndStartSequence(context),
        }),
        enqueueActions(({ enqueue }) => {
          enqueue.spawnChild("stepTracker");
        }),
      ],
      on: {
        STOP: { target: "stopped" },
        UPDATE_NOTE: {
          actions: assign({ note: ({ event }) => event.note }),
        },
        UPDATE_PITCH: {
          actions: [
            assign({ pitch: ({ event }) => event.pitch }),
            ({ context }) => recreateSequence(context),
          ],
        },
        SET_GRID: {
          actions: assign({ grid: ({ event }) => event.grid }),
        },
        SET_ROOT_NOTE: {
          actions: [
            assign({ rootNote: ({ event }) => event.note }),
            ({ context }) => recreateSequence(context),
          ],
        },
        TRANSPOSE_TO_NOTE: {
          actions: [
            assign({ rootNote: ({ event }) => event.note }),
            ({ context }) => recreateSequence(context),
          ],
        },
        UPDATE_TEMPO: {
          actions: [
            assign({ tempo: ({ event }) => event.tempo }),
            ({ context }) => updateTempo(context.tempo),
          ],
        },
        TOGGLE_CELL: {
          actions: assign({
            grid: ({ context, event }) =>
              toggleGridCell(context.grid, event.rowIndex, event.colIndex),
          }),
        },
        TOGGLE_HI_HAT: {
          actions: assign({
            hiHatPattern: ({ context, event }) =>
              toggleHiHatStep(context.hiHatPattern, event.step),
          }),
        },
        STEP_CHANGE: {
          actions: assign({ currentStep: ({ event }) => event.step }),
        },
        STORE_STEP_TRACKER_ID: {
          actions: assign({ stepTrackerId: ({ event }) => event.id }),
        },
        CONNECT_TO_EFFECTS: {
          actions: [
            ({ context, event }) =>
              connectSynthsToEffects(context, event.effectsContext),
            assign({ isConnectedToEffects: () => true }),
          ],
        },
      },
      exit: ({ context }) => {
        stopTransportAndSequence(context);
        cleanupStepTracker(context);
      },
    },
  },
  exit: ({ context }) => disposeResources(context),
});
