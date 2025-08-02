import { setup, assign } from "xstate";
import * as Tone from "tone";
import {
  FILTER_CONFIG,
  EFFECTS_BUS,
  DELAY_CONFIG,
  REVERB_CONFIG,
  DISTORTION_CONFIG,
} from "../constants";

// Define the types of effects we support
export type EffectType = "filter" | "delay" | "reverb" | "distortion";

// Define the events that can be sent to the effects machine
type EffectsEvent =
  | { type: "INIT_EFFECTS" }
  | { type: "DISPOSE_EFFECTS" }
  | { type: "UPDATE_FILTER_FREQUENCY"; frequency: number }
  | { type: "UPDATE_FILTER_DEPTH"; depth: number }
  | { type: "UPDATE_FILTER_WET"; wet: number }
  | { type: "UPDATE_FILTER_RESONANCE"; resonance: number }
  | { type: "UPDATE_DELAY_TIME"; delayTime: number }
  | { type: "UPDATE_DELAY_FEEDBACK"; feedback: number }
  | { type: "UPDATE_DELAY_WET"; wet: number }
  | { type: "UPDATE_REVERB_DECAY"; decay: number }
  | { type: "UPDATE_REVERB_PREDELAY"; preDelay: number }
  | { type: "UPDATE_REVERB_WET"; wet: number }
  | { type: "UPDATE_DISTORTION_AMOUNT"; distortion: number }
  | { type: "UPDATE_DISTORTION_WET"; wet: number }
  | { type: "TOGGLE_EFFECT"; effect: EffectType; enabled: boolean };

// Define the context for the effects machine
export type EffectsContext = {
  // The main effects bus that all effects send to
  effectsBus: Tone.Channel | null;

  // Individual effects
  autoFilter: Tone.AutoFilter | null;
  delay: Tone.FeedbackDelay | null;
  reverb: Tone.Reverb | null;
  distortion: Tone.Distortion | null;

  // Channel senders for effects that don't have built-in send methods
  channelSenders: Record<string, Tone.Channel>;

  // Effect parameters
  // AutoFilter parameters
  filterFrequency: number;
  filterDepth: number;
  filterWet: number;
  filterResonance: number;

  // Delay parameters
  delayTime: number;
  delayFeedback: number;
  delayWet: number;

  // Reverb parameters
  reverbDecay: number;
  reverbPreDelay: number;
  reverbWet: number;

  // Distortion parameters
  distortionAmount: number;
  distortionWet: number;

  // Active effects
  activeEffects: EffectType[];

  // Last time the autoFilter was started
  lastAutoFilterStartTime: number;
};

// Timer management for autoFilter restarts
let autoFilterRestartTimer: number | null = null;

const clearAutoFilterRestartTimer = (): void => {
  if (autoFilterRestartTimer !== null) {
    clearTimeout(autoFilterRestartTimer);
    autoFilterRestartTimer = null;
  }
};

const stopAutoFilterSafely = (autoFilter: Tone.AutoFilter | null): void => {
  if (!autoFilter) return;

  try {
    autoFilter.stop();
  } catch {
    // AutoFilter was not running
  }
};

const startAutoFilterAtNextTick = (
  autoFilter: Tone.AutoFilter | null
): void => {
  if (!autoFilter) return;

  try {
    const now = Tone.now();
    autoFilter.start(now + 0.1);
  } catch {
    // Error handling for autoFilter start
  }
};

// Pure function to restart autoFilter with delay
const restartAutoFilterWithDelay = (
  autoFilter: Tone.AutoFilter | null
): void => {
  if (!autoFilter) return;

  clearAutoFilterRestartTimer();
  stopAutoFilterSafely(autoFilter);

  autoFilterRestartTimer = window.setTimeout(() => {
    startAutoFilterAtNextTick(autoFilter);
    autoFilterRestartTimer = null;
  }, 100);
};

const createEffectsBusWithDestination = (): Tone.Channel => {
  const effectsBus = new Tone.Channel().toDestination();
  effectsBus.receive(EFFECTS_BUS);
  Tone.Destination.volume.value = 0;
  return effectsBus;
};

const createAutoFilterWithConfiguration = (): Tone.AutoFilter => {
  const autoFilter = new Tone.AutoFilter({
    frequency: FILTER_CONFIG.frequency,
    type: FILTER_CONFIG.type,
    depth: FILTER_CONFIG.depth,
    baseFrequency: FILTER_CONFIG.baseFrequency,
    octaves: FILTER_CONFIG.octaves,
    filter: {
      type: FILTER_CONFIG.filter.type,
      rolloff: FILTER_CONFIG.filter.rolloff,
      Q: FILTER_CONFIG.filter.Q,
    },
    wet: FILTER_CONFIG.wet,
  });

  const startTime = Tone.now() + 0.1;
  autoFilter.start(startTime);

  return autoFilter;
};

const createFeedbackDelayWithConfiguration = (): Tone.FeedbackDelay => {
  return new Tone.FeedbackDelay({
    delayTime: DELAY_CONFIG.delayTime,
    feedback: DELAY_CONFIG.feedback,
    wet: DELAY_CONFIG.wet,
  });
};

const createReverbWithConfiguration = (): Tone.Reverb => {
  return new Tone.Reverb({
    decay: REVERB_CONFIG.decay,
    preDelay: REVERB_CONFIG.preDelay,
    wet: REVERB_CONFIG.wet,
  });
};

const createDistortionWithConfiguration = (): Tone.Distortion => {
  return new Tone.Distortion({
    distortion: DISTORTION_CONFIG.distortion,
    oversample: DISTORTION_CONFIG.oversample,
    wet: DISTORTION_CONFIG.wet,
  });
};

const createChannelSendersForAllEffects = (): Record<string, Tone.Channel> => ({
  autoFilter: new Tone.Channel(),
  delay: new Tone.Channel(),
  reverb: new Tone.Channel(),
  distortion: new Tone.Channel(),
});

const disposeAudioNodeSafely = (node: Tone.ToneAudioNode | null): void => {
  if (node) {
    try {
      node.dispose();
    } catch {
      // Error handling for audio node disposal
    }
  }
};

// Pure function to disconnect an audio node
const disconnectAudioNode = (node: Tone.ToneAudioNode | null): void => {
  if (node) {
    try {
      node.disconnect();
    } catch {
      // Error handling for audio node disconnection
    }
  }
};

// Pure function to create audio routing components
const createAudioRoutingComponents = () => {
  const preGain = new Tone.Gain(0.89);
  const limiter = new Tone.Limiter(-18);
  const finalBus = new Tone.Gain(0.85);
  const filterDistortionPath = new Tone.Gain();
  const delayPath = new Tone.Gain();
  const reverbPath = new Tone.Gain();

  return {
    preGain,
    limiter,
    finalBus,
    filterDistortionPath,
    delayPath,
    reverbPath,
  };
};

// Pure function to setup final audio chain
const setupFinalAudioChain = (
  finalBus: Tone.Gain,
  preGain: Tone.Gain,
  limiter: Tone.Limiter
): void => {
  finalBus.chain(preGain, limiter, Tone.Destination);
};

// Pure function to connect effects to paths
const connectEffectsToPaths = (
  context: EffectsContext,
  components: ReturnType<typeof createAudioRoutingComponents>
): void => {
  const { filterDistortionPath, delayPath, reverbPath, finalBus } = components;

  // Path 1: AutoFilter -> Distortion path
  if (context.autoFilter && context.distortion) {
    filterDistortionPath.chain(
      context.autoFilter,
      context.distortion,
      finalBus
    );
  } else if (context.autoFilter) {
    filterDistortionPath.chain(context.autoFilter, finalBus);
  } else if (context.distortion) {
    filterDistortionPath.chain(context.distortion, finalBus);
  } else {
    filterDistortionPath.connect(finalBus);
  }

  // Path 2: Clean delay path
  if (context.delay) {
    delayPath.chain(context.delay, finalBus);
  } else {
    delayPath.connect(finalBus);
  }

  // Path 3: Clean reverb path
  if (context.reverb) {
    reverbPath.chain(context.reverb, finalBus);
  } else {
    reverbPath.connect(finalBus);
  }
};

// Pure function to ensure audio routing is properly connected
const ensureAudioRouting = (context: EffectsContext): boolean => {
  if (!context.effectsBus) {
    console.warn("Effects bus not available for routing");
    return false;
  }

  try {
    // Disconnect all effects first
    disconnectAudioNode(context.autoFilter);
    disconnectAudioNode(context.delay);
    disconnectAudioNode(context.reverb);
    disconnectAudioNode(context.distortion);
    disconnectAudioNode(context.effectsBus);

    const components = createAudioRoutingComponents();
    setupFinalAudioChain(
      components.finalBus,
      components.preGain,
      components.limiter
    );

    // Connect input to all paths
    context.effectsBus.connect(components.filterDistortionPath);
    context.effectsBus.connect(components.delayPath);
    context.effectsBus.connect(components.reverbPath);

    connectEffectsToPaths(context, components);

    return true;
  } catch (error) {
    console.error("Error connecting effects:", error);
    return false;
  }
};

// Pure function to update filter frequency
const updateFilterFrequency = (
  autoFilter: Tone.AutoFilter | null,
  frequency: number
): void => {
  if (!autoFilter) {
    console.warn("Auto-filter not available for frequency update");
    return;
  }

  try {
    autoFilter.frequency.value = frequency;
    restartAutoFilterWithDelay(autoFilter);
  } catch (error) {
    console.error("Error updating filter frequency:", error);
  }
};

// Pure function to update filter depth
const updateFilterDepth = (
  autoFilter: Tone.AutoFilter | null,
  depth: number
): void => {
  if (!autoFilter) {
    console.warn("Auto-filter not available for depth update");
    return;
  }

  try {
    autoFilter.depth.value = depth;
    restartAutoFilterWithDelay(autoFilter);
  } catch (error) {
    console.error("Error updating filter depth:", error);
  }
};

// Pure function to update filter wet mix
const updateFilterWet = (
  autoFilter: Tone.AutoFilter | null,
  wet: number
): void => {
  if (!autoFilter) {
    console.warn("Auto-filter not available for wet mix update");
    return;
  }

  try {
    autoFilter.wet.value = wet;
  } catch (error) {
    console.error("Error updating filter wet mix:", error);
  }
};

// Pure function to update filter resonance
const updateFilterResonance = (
  autoFilter: Tone.AutoFilter | null,
  resonance: number
): void => {
  if (!autoFilter) {
    console.warn("Auto-filter not available for resonance update");
    return;
  }

  try {
    autoFilter.filter.Q.value = resonance;
  } catch (error) {
    console.error("Error updating filter resonance:", error);
  }
};

// Pure function to update delay time
const updateDelayTime = (
  delay: Tone.FeedbackDelay | null,
  delayTime: number
): void => {
  if (!delay) {
    console.warn("Delay effect not available for time update");
    return;
  }

  try {
    delay.delayTime.value = delayTime;
  } catch (error) {
    console.error("Error updating delay time:", error);
  }
};

// Pure function to update delay feedback
const updateDelayFeedback = (
  delay: Tone.FeedbackDelay | null,
  feedback: number
): void => {
  if (!delay) {
    console.warn("Delay effect not available for feedback update");
    return;
  }

  try {
    delay.feedback.value = feedback;
  } catch (error) {
    console.error("Error updating delay feedback:", error);
  }
};

// Pure function to update delay wet mix
const updateDelayWet = (
  delay: Tone.FeedbackDelay | null,
  wet: number
): void => {
  if (!delay) {
    console.warn("Delay effect not available for wet mix update");
    return;
  }

  try {
    delay.wet.value = wet;
  } catch (error) {
    console.error("Error updating delay wet mix:", error);
  }
};

// Pure function to update reverb decay
const updateReverbDecay = (reverb: Tone.Reverb | null, decay: number): void => {
  if (!reverb) {
    console.warn("Reverb effect not available for decay update");
    return;
  }

  try {
    reverb.decay = decay;
  } catch (error) {
    console.error("Error updating reverb decay:", error);
  }
};

// Pure function to update reverb pre-delay
const updateReverbPreDelay = (
  reverb: Tone.Reverb | null,
  preDelay: number
): void => {
  if (!reverb) {
    console.warn("Reverb effect not available for pre-delay update");
    return;
  }

  try {
    reverb.preDelay = preDelay;
  } catch (error) {
    console.error("Error updating reverb pre-delay:", error);
  }
};

// Pure function to update reverb wet mix
const updateReverbWet = (reverb: Tone.Reverb | null, wet: number): void => {
  if (!reverb) {
    console.warn("Reverb effect not available for wet mix update");
    return;
  }

  try {
    reverb.wet.value = wet;
  } catch (error) {
    console.error("Error updating reverb wet mix:", error);
  }
};

// Pure function to update distortion amount
const updateDistortionAmount = (
  distortion: Tone.Distortion | null,
  distortionAmount: number
): void => {
  if (!distortion) {
    console.warn("Distortion effect not available for amount update");
    return;
  }

  try {
    distortion.distortion = distortionAmount;
  } catch (error) {
    console.error("Error updating distortion amount:", error);
  }
};

// Pure function to update distortion wet mix
const updateDistortionWet = (
  distortion: Tone.Distortion | null,
  wet: number
): void => {
  if (!distortion) {
    console.warn("Distortion effect not available for wet mix update");
    return;
  }

  try {
    distortion.wet.value = wet;
  } catch (error) {
    console.error("Error updating distortion wet mix:", error);
  }
};

// Pure function to toggle effect wet values
const toggleEffectWet = (
  effect: EffectType,
  enabled: boolean,
  context: EffectsContext
): void => {
  switch (effect) {
    case "autoFilter":
      if (context.autoFilter) {
        context.autoFilter.wet.value = enabled ? context.filterWet : 0;
      }
      break;
    case "delay":
      if (context.delay) {
        context.delay.wet.value = enabled ? context.delayWet : 0;
      }
      break;
    case "reverb":
      if (context.reverb) {
        context.reverb.wet.value = enabled ? context.reverbWet : 0;
      }
      break;
    case "distortion":
      if (context.distortion) {
        context.distortion.distortion = enabled ? context.distortionAmount : 0;
      }
      break;
  }
};

// Pure function to update active effects list
const updateActiveEffects = (
  currentActiveEffects: EffectType[],
  effect: EffectType,
  enabled: boolean
): EffectType[] => {
  if (enabled && !currentActiveEffects.includes(effect)) {
    return [...currentActiveEffects, effect];
  } else if (!enabled && currentActiveEffects.includes(effect)) {
    return currentActiveEffects.filter((e) => e !== effect);
  }
  return currentActiveEffects;
};

// Create the effects machine
export const effectsMachine = setup({
  types: {
    context: {} as EffectsContext,
    events: {} as EffectsEvent,
  },
}).createMachine({
  id: "effects",
  initial: "inactive",
  context: {
    effectsBus: null,
    autoFilter: null,
    delay: null,
    reverb: null,
    distortion: null,
    channelSenders: {},
    filterFrequency: FILTER_CONFIG.frequency,
    filterDepth: FILTER_CONFIG.depth,
    filterWet: FILTER_CONFIG.wet,
    filterResonance: FILTER_CONFIG.filter.Q,
    delayTime: DELAY_CONFIG.delayTime,
    delayFeedback: DELAY_CONFIG.feedback,
    delayWet: DELAY_CONFIG.wet,
    reverbDecay: REVERB_CONFIG.decay,
    reverbPreDelay: REVERB_CONFIG.preDelay,
    reverbWet: REVERB_CONFIG.wet,
    distortionAmount: DISTORTION_CONFIG.distortion,
    distortionWet: DISTORTION_CONFIG.wet,
    activeEffects: [],
    lastAutoFilterStartTime: 0,
  },
  states: {
    inactive: {
      on: {
        INIT_EFFECTS: {
          target: "active",
          actions: assign({
            effectsBus: createEffectsBusWithDestination,
            autoFilter: createAutoFilterWithConfiguration,
            delay: createFeedbackDelayWithConfiguration,
            reverb: createReverbWithConfiguration,
            distortion: createDistortionWithConfiguration,
            channelSenders: createChannelSendersForAllEffects,
            activeEffects: () => [
              "autoFilter",
              "delay",
              "reverb",
              "distortion",
            ],
            lastAutoFilterStartTime: () => Tone.now(),
          }),
        },
      },
    },
    active: {
      entry: ({ context }) => {
        ensureAudioRouting(context);
      },
      on: {
        DISPOSE_EFFECTS: {
          target: "inactive",
          actions: assign({
            effectsBus: ({ context }) => {
              disposeAudioNodeSafely(context.effectsBus);
              return null;
            },
            autoFilter: ({ context }) => {
              if (context.autoFilter) {
                stopAutoFilterSafely(context.autoFilter);
                disposeAudioNodeSafely(context.autoFilter);
              }
              return null;
            },
            delay: ({ context }) => {
              disposeAudioNodeSafely(context.delay);
              return null;
            },
            reverb: ({ context }) => {
              disposeAudioNodeSafely(context.reverb);
              return null;
            },
            distortion: ({ context }) => {
              disposeAudioNodeSafely(context.distortion);
              return null;
            },
            channelSenders: ({ context }) => {
              Object.values(context.channelSenders).forEach(
                disposeAudioNodeSafely
              );
              return {};
            },
            activeEffects: () => [],
            lastAutoFilterStartTime: () => 0,
          }),
        },
        UPDATE_FILTER_FREQUENCY: {
          actions: assign({
            filterFrequency: ({ event, context }) => {
              updateFilterFrequency(context.autoFilter, event.frequency);
              ensureAudioRouting(context);
              return event.frequency;
            },
          }),
        },
        UPDATE_FILTER_DEPTH: {
          actions: assign({
            filterDepth: ({ event, context }) => {
              updateFilterDepth(context.autoFilter, event.depth);
              ensureAudioRouting(context);
              return event.depth;
            },
          }),
        },
        UPDATE_FILTER_WET: {
          actions: assign({
            filterWet: ({ event, context }) => {
              updateFilterWet(context.autoFilter, event.wet);
              ensureAudioRouting(context);
              return event.wet;
            },
          }),
        },
        UPDATE_FILTER_RESONANCE: {
          actions: assign({
            filterResonance: ({ event, context }) => {
              updateFilterResonance(context.autoFilter, event.resonance);
              ensureAudioRouting(context);
              return event.resonance;
            },
          }),
        },
        UPDATE_DELAY_TIME: {
          actions: assign({
            delayTime: ({ event, context }) => {
              updateDelayTime(context.delay, event.delayTime);
              ensureAudioRouting(context);
              return event.delayTime;
            },
          }),
        },
        UPDATE_DELAY_FEEDBACK: {
          actions: assign({
            delayFeedback: ({ event, context }) => {
              updateDelayFeedback(context.delay, event.feedback);
              ensureAudioRouting(context);
              return event.feedback;
            },
          }),
        },
        UPDATE_DELAY_WET: {
          actions: assign({
            delayWet: ({ event, context }) => {
              updateDelayWet(context.delay, event.wet);
              ensureAudioRouting(context);
              return event.wet;
            },
          }),
        },
        UPDATE_REVERB_DECAY: {
          actions: assign({
            reverbDecay: ({ event, context }) => {
              updateReverbDecay(context.reverb, event.decay);
              ensureAudioRouting(context);
              return event.decay;
            },
          }),
        },
        UPDATE_REVERB_PREDELAY: {
          actions: assign({
            reverbPreDelay: ({ event, context }) => {
              updateReverbPreDelay(context.reverb, event.preDelay);
              ensureAudioRouting(context);
              return event.preDelay;
            },
          }),
        },
        UPDATE_REVERB_WET: {
          actions: assign({
            reverbWet: ({ event, context }) => {
              updateReverbWet(context.reverb, event.wet);
              ensureAudioRouting(context);
              return event.wet;
            },
          }),
        },
        UPDATE_DISTORTION_AMOUNT: {
          actions: assign({
            distortionAmount: ({ event, context }) => {
              updateDistortionAmount(context.distortion, event.distortion);
              ensureAudioRouting(context);
              return event.distortion;
            },
          }),
        },
        UPDATE_DISTORTION_WET: {
          actions: assign({
            distortionWet: ({ event, context }) => {
              updateDistortionWet(context.distortion, event.wet);
              ensureAudioRouting(context);
              return event.wet;
            },
          }),
        },
        TOGGLE_EFFECT: {
          actions: assign({
            activeEffects: ({ event, context }) => {
              const newActiveEffects = updateActiveEffects(
                context.activeEffects,
                event.effect,
                event.enabled
              );
              toggleEffectWet(event.effect, event.enabled, context);
              ensureAudioRouting(context);
              return newActiveEffects;
            },
          }),
        },
      },
    },
  },
});

// Pure function to connect an instrument to the effects chain
export const connectToEffects = (
  instrument: Tone.ToneAudioNode,
  context: EffectsContext
): void => {
  if (!context.effectsBus) {
    console.warn("Effects bus not available for routing");
    instrument.toDestination();
    return;
  }

  // Disconnect the instrument from any existing connections
  instrument.disconnect();

  // Create a splitter for parallel routing
  const splitter = new Tone.Gain();
  instrument.connect(splitter);

  const { activeEffects } = context;

  // Connect to active effects in parallel
  if (activeEffects.includes("autoFilter") && context.autoFilter) {
    splitter.connect(context.autoFilter);
  }

  if (activeEffects.includes("delay") && context.delay) {
    splitter.connect(context.delay);
  }

  if (activeEffects.includes("reverb") && context.reverb) {
    splitter.connect(context.reverb);
  }

  if (activeEffects.includes("distortion") && context.distortion) {
    splitter.connect(context.distortion);
  }

  // If no effects are active, connect directly to destination
  if (activeEffects.length === 0) {
    splitter.toDestination();
  }

  // Ensure the effects chain is properly connected
  ensureAudioRouting(context);
};
