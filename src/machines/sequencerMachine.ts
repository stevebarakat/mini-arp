import { NOTES, STEPS } from "../constants/sequencer";
import { createMachine, assign } from "xstate";
import { Grid } from "../hooks/useSequencer";

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "SET_GRID"; grid: Grid };

type SequencerContext = {
  note: string;
  grid: Grid;
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
        note: event.type === "UPDATE_NOTE" ? event.note : context.note,
      })),
    },
    SET_GRID: {
      actions: assign(({ context, event }) => ({
        ...context,
        grid: event.type === "SET_GRID" ? event.grid : context.grid,
      })),
    },
  },
});
