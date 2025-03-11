import { assign, setup } from "xstate";
import { DEFAULT_TEMPO } from "../constants/sequencer";
import * as Tone from "tone";
export const transportMachine = setup({
  types: {
    context: {} as {
      tempo: number;
    },
    events: {} as
      | { type: "PLAY" }
      | { type: "STOP" }
      | { type: "UPDATE_TEMPO"; tempo: number },
  },
}).createMachine({
  id: "transport",
  initial: "stopped",
  context: {
    tempo: DEFAULT_TEMPO,
  },
  on: {
    UPDATE_TEMPO: {
      actions: assign(({ event }) => {
        Tone.getTransport().bpm.value = event.tempo;
        return {
          tempo: event.tempo,
        };
      }),
    },
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
});
