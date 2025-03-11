import { DEFAULT_PITCH, DEFAULT_PATTERN } from "../constants/sequencer";
import { setup, assign } from "xstate";
import { Grid } from "../hooks/useSequencer";

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string };

type SequencerContext = {
  note: string;
  rootNote: string;
  pitch: number;
  grid: Grid;
};

export const sequencerMachine = setup({
  types: {
    context: {} as SequencerContext,
    events: {} as SequencerEvent,
  },
}).createMachine({
  id: "sequencer",
  initial: "stopped",
  context: {
    note: "C4",
    rootNote: "C4",
    pitch: DEFAULT_PITCH,
    grid: DEFAULT_PATTERN,
  },
  states: {
    stopped: {
      on: {
        PLAY: "playing",
      },
    },
    playing: {
      on: {
        STOP: "stopped",
      },
    },
  },
  on: {
    UPDATE_NOTE: {
      actions: assign(({ context, event }) => ({
        ...context,
        note: event.note,
      })),
    },
    UPDATE_PITCH: {
      actions: assign(({ context, event }) => ({
        ...context,
        pitch: event.pitch,
      })),
    },
    SET_GRID: {
      actions: assign(({ context, event }) => ({
        ...context,
        grid: event.grid,
      })),
    },
    SET_ROOT_NOTE: {
      actions: assign(({ context, event }) => ({
        ...context,
        rootNote: event.note,
      })),
    },
  },
});
