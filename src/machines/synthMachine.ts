import { assign, setup } from "xstate";
import { SYNTH_CONFIG } from "../constants/sequencer";
import * as Tone from "tone";

// Create effects chain
const createEffectsChain = () => {
  // Final limiter to prevent clipping
  const limiter = new Tone.Limiter(-1).toDestination();

  // Compressor for punch and sustain
  const compressor = new Tone.Compressor({
    threshold: -30,
    ratio: 12,
    attack: 0.002,
    release: 0.15,
    knee: 5,
  }).connect(limiter);

  // BitCrusher for extra grit
  const bitCrusher = new Tone.BitCrusher(4).connect(compressor);

  // Distortion after compression for more controlled distortion
  const distortion = new Tone.Distortion({
    distortion: 1.5,
    wet: 0.7,
  }).connect(bitCrusher);

  // Create a splitter node for parallel processing
  const splitter = new Tone.Gain().connect(distortion);

  // Reverb path (parallel to distortion)
  const reverb = new Tone.Reverb({
    decay: 2.5,
    preDelay: 0.1,
    wet: 0.3,
  }).connect(compressor); // Connect directly to compressor

  // Delay path (parallel to distortion)
  const delay = new Tone.PingPongDelay({
    delayTime: "8n",
    feedback: 0.3,
    wet: 0.25,
  }).connect(compressor); // Connect directly to compressor

  const chorus = new Tone.Chorus({
    frequency: 0,
    delayTime: 0,
    depth: 0,
    wet: 0,
  }).connect(splitter); // Connect to splitter

  // Connect chorus to delay and reverb for parallel processing
  chorus.connect(delay);
  chorus.connect(reverb);

  const filter = new Tone.Filter({
    frequency: 3000,
    type: "lowpass",
    rolloff: -24,
    Q: 2,
  }).connect(chorus);

  return {
    input: filter,
    effects: [
      filter,
      chorus,
      splitter,
      delay,
      reverb,
      distortion,
      bitCrusher,
      compressor,
      limiter,
    ],
  };
};

export const synthMachine = setup({
  types: {
    context: {} as {
      synth: Tone.AMSynth | undefined;
      effects: Tone.ToneAudioNode[] | undefined;
    },
    events: {} as { type: "CREATE_SYNTH" } | { type: "DISPOSE_SYNTH" },
  },
}).createMachine({
  id: "synth",
  initial: "inactive",
  context: {
    synth: undefined,
    effects: undefined,
  },
  entry: assign(() => {
    const effectsChain = createEffectsChain();
    const synth = new Tone.AMSynth(SYNTH_CONFIG).connect(effectsChain.input);
    return {
      synth,
      effects: effectsChain.effects,
    };
  }),
  exit: assign(({ context }) => {
    if (context.effects) {
      context.effects.forEach((effect) => effect.dispose());
    }
    if (context.synth) {
      context.synth.dispose();
    }
    return {
      synth: undefined,
      effects: undefined,
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
