import { assign, setup } from "xstate";
import { SYNTH_CONFIG } from "../constants/sequencer";
import * as Tone from "tone";

export const synthMachine = setup({
  types: {
    context: {} as {
      synth: Tone.AMSynth | undefined;
    },
    events: {} as { type: "CREATE_SYNTH" } | { type: "DISPOSE_SYNTH" },
  },
}).createMachine({
  id: "synth",
  initial: "inactive",
  context: {
    synth: undefined,
  },
  entry: assign(() => {
    const synth = new Tone.AMSynth(SYNTH_CONFIG).toDestination();
    return {
      synth,
    };
  }),
  exit: assign(({ context }) => {
    if (context.synth) {
      context.synth.dispose();
    }
    return {
      synth: undefined,
    };
  }),
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
