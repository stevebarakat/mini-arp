import { assign, setup } from "xstate";
import { SYNTH_CONFIG } from "../constants/sequencer";
import * as Tone from "tone";

export const synthMachine = setup({
  types: {
    context: {} as {
      synth: Tone.Synth | undefined;
    },
    events: {} as { type: "CREATE_SYNTH" } | { type: "DISPOSE_SYNTH" },
  },
}).createMachine({
  id: "synth",
  initial: "inactive",
  context: {
    synth: undefined,
  },
  entry: assign(() => ({
    synth: new Tone.Synth(SYNTH_CONFIG).toDestination(),
  })),
  exit: assign(() => ({
    synth: undefined,
  })),
  states: {
    inactive: {
      on: {
        CREATE_SYNTH: "active",
      },
    },
    active: {
      on: {
        DISPOSE_SYNTH: "inactive",
      },
    },
  },
});
