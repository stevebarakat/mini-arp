import { NOTES, STEPS } from "../constants/sequencer";
import { createMachine, assign } from "xstate";
import { Grid } from "../hooks/useSequencer";

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid };

type SequencerContext = {
  note: string;
  grid: Grid;
  pitch: number;
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
    pitch: 0,
    grid: Array(NOTES.length)
      .fill(null)
      .map(() => Array(STEPS).fill(false)) as Grid,
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
  },
});
