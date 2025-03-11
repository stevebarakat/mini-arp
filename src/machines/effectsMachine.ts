import { assign, setup } from "xstate";
import * as Tone from "tone";
export const effectsMachine = setup({
  types: {
    context: {} as {
      reverb: boolean;
      delay: boolean;
      distortion: boolean;
    },
    events: {} as
      | { type: "TOGGLE_REVERB"; channel: Tone.Channel; checked: boolean }
      | { type: "TOGGLE_DELAY"; channel: Tone.Channel; checked: boolean }
      | { type: "TOGGLE_DISTORTION"; channel: Tone.Channel; checked: boolean },
  },
}).createMachine({
  id: "effects",
  initial: "idle",
  context: {
    reverb: false,
    delay: false,
    distortion: false,
  },
  states: {
    idle: {
      on: {
        TOGGLE_REVERB: "active",
        TOGGLE_DELAY: "active",
        TOGGLE_DISTORTION: "active",
      },
    },
    active: {
      on: {
        TOGGLE_REVERB: {
          actions: assign(({ context, event }) => {
            const channel = event.channel.connect(
              new Tone.Reverb(55).toDestination()
            );
            return {
              reverb: !context.reverb,
              channel,
            };
          }),
        },
        TOGGLE_DELAY: {
          actions: assign(({ context, event }) => {
            const channel = event.channel.connect(
              new Tone.Delay(0.5, 0.5).toDestination()
            );
            return {
              delay: event.checked,
              channel,
            };
          }),
        },
        TOGGLE_DISTORTION: {
          actions: assign(({ context, event }) => {
            const channel = event.channel.connect(
              new Tone.Distortion(0.5).toDestination()
            );
            return {
              distortion: !context.distortion,
              channel,
            };
          }),
        },
      },
    },
  },
});
