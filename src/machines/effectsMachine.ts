import { setup, assign } from "xstate";
import * as Tone from "tone";
import {
  FILTER_CONFIG,
  EFFECTS_BUS,
  DELAY_CONFIG,
  REVERB_CONFIG,
  DISTORTION_CONFIG,
} from "../constants/sequencer";

// Define the types of effects we support
export type EffectType = "autoFilter" | "delay" | "reverb" | "distortion";

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

// Keep track of the timer ID to avoid multiple restarts
let autoFilterRestartTimer: number | null = null;

// Helper function to safely restart the autoFilter
const safelyRestartAutoFilter = (autoFilter: Tone.AutoFilter | null) => {
  if (!autoFilter) return;

  // Clear any pending restart
  if (autoFilterRestartTimer !== null) {
    clearTimeout(autoFilterRestartTimer);
    autoFilterRestartTimer = null;
  }

  // Stop the autoFilter if it's running
  try {
    autoFilter.stop();
    console.log("AutoFilter stopped successfully");
  } catch {
    console.log("AutoFilter was not running");
  }

  // Schedule a restart with a delay
  autoFilterRestartTimer = window.setTimeout(() => {
    try {
      if (autoFilter) {
        // Use the current time plus a small offset to ensure it's in the future
        const now = Tone.now();
        autoFilter.start(now + 0.1);
        console.log("AutoFilter restarted successfully at time", now + 0.1);
      }
    } catch (error) {
      console.error("Error restarting autoFilter:", error);
    }
    autoFilterRestartTimer = null;
  }, 100);
};

// Helper function to ensure audio routing is properly connected
const ensureAudioRouting = (context: EffectsContext) => {
  if (!context.effectsBus) {
    console.warn("Effects bus not available for routing");
    return false;
  }

  let routingSuccess = true;

  try {
    // Disconnect all effects first
    if (context.autoFilter) context.autoFilter.disconnect();
    if (context.delay) context.delay.disconnect();
    if (context.reverb) context.reverb.disconnect();
    if (context.distortion) context.distortion.disconnect();
    if (context.effectsBus) context.effectsBus.disconnect();

    // Create a more aggressive limiter setup
    const preGain = new Tone.Gain(0.89); // Drive the input signal harder
    const limiter = new Tone.Limiter(-18); // Lower threshold for more aggressive limiting
    const finalBus = new Tone.Gain(0.85); // Boost the final output

    // Chain the final bus through the drive -> limiter -> destination
    finalBus.chain(preGain, limiter, Tone.Destination);

    // Create three parallel paths
    const filterDistortionPath = new Tone.Gain();
    const delayPath = new Tone.Gain();
    const reverbPath = new Tone.Gain();

    // Connect input to all paths
    context.effectsBus.connect(filterDistortionPath);
    context.effectsBus.connect(delayPath);
    context.effectsBus.connect(reverbPath);

    // Path 1: AutoFilter -> Distortion path
    if (context.autoFilter && context.distortion) {
      filterDistortionPath.chain(
        context.autoFilter,
        context.distortion,
        finalBus
      );
      console.log("Connected autoFilter -> distortion path");
    } else if (context.autoFilter) {
      filterDistortionPath.chain(context.autoFilter, finalBus);
      console.log("Connected autoFilter path only");
    } else if (context.distortion) {
      filterDistortionPath.chain(context.distortion, finalBus);
      console.log("Connected distortion path only");
    } else {
      filterDistortionPath.connect(finalBus);
    }

    // Path 2: Clean delay path
    if (context.delay) {
      delayPath.chain(context.delay, finalBus);
      console.log("Connected clean delay path");
    } else {
      delayPath.connect(finalBus);
    }

    // Path 3: Clean reverb path
    if (context.reverb) {
      reverbPath.chain(context.reverb, finalBus);
      console.log("Connected clean reverb path");
    } else {
      reverbPath.connect(finalBus);
    }

    console.log("Added parallel processing paths with shared limiter");
  } catch (error) {
    console.error("Error connecting effects:", error);
    routingSuccess = false;
  }

  return routingSuccess;
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
            // Create the effects bus
            effectsBus: () => {
              console.log(`Creating effects bus with name "${EFFECTS_BUS}"`);

              // Create a channel for the effects bus and connect it to the destination
              const effectsBus = new Tone.Channel().toDestination();

              // Register the channel as a receive point for the named bus
              effectsBus.receive(EFFECTS_BUS);

              // Set destination volume
              Tone.Destination.volume.value = 0;

              console.log(
                `Effects bus created and receiving on "${EFFECTS_BUS}"`
              );

              return effectsBus;
            },

            // Create the autoFilter
            autoFilter: () => {
              console.log("Creating auto-filter with config:", FILTER_CONFIG);

              // Create the auto filter effect with proper configuration
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

              // Important: Start the LFO with a specific time
              const startTime = Tone.now() + 0.1;
              autoFilter.start(startTime);

              console.log("Auto-filter created with params:", {
                frequency: autoFilter.frequency.value,
                depth: autoFilter.depth.value,
                wet: autoFilter.wet.value,
                resonance: autoFilter.filter.Q.value,
                startTime: startTime,
              });

              return autoFilter;
            },

            // Create the delay effect
            delay: () => {
              console.log("Creating delay effect with config:", DELAY_CONFIG);

              // Create the delay effect with proper configuration
              const delay = new Tone.FeedbackDelay({
                delayTime: DELAY_CONFIG.delayTime,
                feedback: DELAY_CONFIG.feedback,
                wet: DELAY_CONFIG.wet,
              });

              console.log("Delay effect created with params:", {
                delayTime: delay.delayTime.value,
                feedback: delay.feedback.value,
                wet: delay.wet.value,
              });

              return delay;
            },

            // Create the reverb effect
            reverb: () => {
              console.log("Creating reverb effect with config:", REVERB_CONFIG);

              // Create the reverb effect with proper configuration
              const reverb = new Tone.Reverb({
                decay: REVERB_CONFIG.decay,
                preDelay: REVERB_CONFIG.preDelay,
                wet: REVERB_CONFIG.wet,
              });

              console.log("Reverb effect created with params:", {
                decay: reverb.decay,
                preDelay: reverb.preDelay,
                wet: reverb.wet.value,
              });

              return reverb;
            },

            // Create the distortion effect
            distortion: () => {
              console.log(
                "Creating distortion effect with config:",
                DISTORTION_CONFIG
              );

              // Create the distortion effect with proper configuration
              const distortion = new Tone.Distortion({
                distortion: DISTORTION_CONFIG.distortion,
                oversample: DISTORTION_CONFIG.oversample,
                wet: DISTORTION_CONFIG.wet,
              });

              console.log("Distortion effect created with params:", {
                distortion: distortion.distortion,
                oversample: distortion.oversample,
                wet: distortion.wet.value,
              });

              return distortion;
            },

            // Create channel senders for each effect
            channelSenders: () => {
              console.log("Creating channel senders for effects routing");

              const senders: Record<string, Tone.Channel> = {
                autoFilter: new Tone.Channel(),
                delay: new Tone.Channel(),
                reverb: new Tone.Channel(),
                distortion: new Tone.Channel(),
              };

              return senders;
            },

            // Update active effects
            activeEffects: () => [
              "autoFilter",
              "delay",
              "reverb",
              "distortion",
            ],

            // Set the initial start time
            lastAutoFilterStartTime: () => Tone.now(),
          }),
        },
      },
    },
    active: {
      entry: ({ context }) => {
        // Ensure all effects are properly connected
        ensureAudioRouting(context);
      },
      on: {
        DISPOSE_EFFECTS: {
          target: "inactive",
          actions: assign({
            effectsBus: ({ context }) => {
              if (context.effectsBus) {
                context.effectsBus.dispose();
              }
              return null;
            },
            autoFilter: ({ context }) => {
              if (context.autoFilter) {
                // Make sure to stop before disposing
                try {
                  context.autoFilter.stop();
                } catch {
                  console.log("No need to stop autoFilter, it wasn't running");
                }
                context.autoFilter.dispose();
              }
              return null;
            },
            delay: ({ context }) => {
              if (context.delay) {
                context.delay.dispose();
                console.log("Delay effect disposed");
              }
              return null;
            },
            reverb: ({ context }) => {
              if (context.reverb) {
                context.reverb.dispose();
                console.log("Reverb effect disposed");
              }
              return null;
            },
            distortion: ({ context }) => {
              if (context.distortion) {
                context.distortion.dispose();
                console.log("Distortion effect disposed");
              }
              return null;
            },
            channelSenders: ({ context }) => {
              // Dispose all channel senders
              Object.values(context.channelSenders).forEach((sender) => {
                sender.dispose();
              });
              return {};
            },
            activeEffects: () => [],
            lastAutoFilterStartTime: () => 0,
          }),
        },
        UPDATE_FILTER_FREQUENCY: {
          actions: assign({
            filterFrequency: ({ event, context }) => {
              if (context.autoFilter) {
                try {
                  // Set the frequency value and log it
                  context.autoFilter.frequency.value = event.frequency;
                  console.log(
                    `Updated filter frequency to ${event.frequency}Hz`
                  );

                  // Safely restart the autoFilter
                  safelyRestartAutoFilter(context.autoFilter);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating filter frequency:", error);
                }
              } else {
                console.warn("Auto-filter not available for frequency update");
              }
              return event.frequency;
            },
          }),
        },
        UPDATE_FILTER_DEPTH: {
          actions: assign({
            filterDepth: ({ event, context }) => {
              if (context.autoFilter) {
                try {
                  // Set the depth value and log it
                  context.autoFilter.depth.value = event.depth;
                  console.log(`Updated filter depth to ${event.depth}`);

                  // Safely restart the autoFilter
                  safelyRestartAutoFilter(context.autoFilter);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating filter depth:", error);
                }
              } else {
                console.warn("Auto-filter not available for depth update");
              }
              return event.depth;
            },
          }),
        },
        UPDATE_FILTER_WET: {
          actions: assign({
            filterWet: ({ event, context }) => {
              if (context.autoFilter) {
                try {
                  // Set the wet value and log it
                  context.autoFilter.wet.value = event.wet;
                  console.log(`Updated filter wet mix to ${event.wet}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating filter wet mix:", error);
                }
              } else {
                console.warn("Auto-filter not available for wet mix update");
              }
              return event.wet;
            },
          }),
        },
        UPDATE_FILTER_RESONANCE: {
          actions: assign({
            filterResonance: ({ event, context }) => {
              if (context.autoFilter) {
                try {
                  // Set the resonance (Q) value and log it
                  context.autoFilter.filter.Q.value = event.resonance;
                  console.log(`Updated filter resonance to ${event.resonance}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating filter resonance:", error);
                }
              } else {
                console.warn("Auto-filter not available for resonance update");
              }
              return event.resonance;
            },
          }),
        },
        UPDATE_DELAY_TIME: {
          actions: assign({
            delayTime: ({ event, context }) => {
              if (context.delay) {
                try {
                  // Set the delay time value and log it
                  context.delay.delayTime.value = event.delayTime;
                  console.log(`Updated delay time to ${event.delayTime}s`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating delay time:", error);
                }
              } else {
                console.warn("Delay effect not available for time update");
              }
              return event.delayTime;
            },
          }),
        },
        UPDATE_DELAY_FEEDBACK: {
          actions: assign({
            delayFeedback: ({ event, context }) => {
              if (context.delay) {
                try {
                  // Set the feedback value and log it
                  context.delay.feedback.value = event.feedback;
                  console.log(`Updated delay feedback to ${event.feedback}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating delay feedback:", error);
                }
              } else {
                console.warn("Delay effect not available for feedback update");
              }
              return event.feedback;
            },
          }),
        },
        UPDATE_DELAY_WET: {
          actions: assign({
            delayWet: ({ event, context }) => {
              if (context.delay) {
                try {
                  // Set the wet value and log it
                  context.delay.wet.value = event.wet;
                  console.log(`Updated delay wet mix to ${event.wet}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating delay wet mix:", error);
                }
              } else {
                console.warn("Delay effect not available for wet mix update");
              }
              return event.wet;
            },
          }),
        },
        UPDATE_REVERB_DECAY: {
          actions: assign({
            reverbDecay: ({ event, context }) => {
              if (context.reverb) {
                try {
                  // Set the decay value and log it
                  context.reverb.decay = event.decay;
                  console.log(`Updated reverb decay to ${event.decay}s`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating reverb decay:", error);
                }
              } else {
                console.warn("Reverb effect not available for decay update");
              }
              return event.decay;
            },
          }),
        },
        UPDATE_REVERB_PREDELAY: {
          actions: assign({
            reverbPreDelay: ({ event, context }) => {
              if (context.reverb) {
                try {
                  // Set the preDelay value and log it
                  context.reverb.preDelay = event.preDelay;
                  console.log(`Updated reverb pre-delay to ${event.preDelay}s`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating reverb pre-delay:", error);
                }
              } else {
                console.warn(
                  "Reverb effect not available for pre-delay update"
                );
              }
              return event.preDelay;
            },
          }),
        },
        UPDATE_REVERB_WET: {
          actions: assign({
            reverbWet: ({ event, context }) => {
              if (context.reverb) {
                try {
                  // Set the wet value and log it
                  context.reverb.wet.value = event.wet;
                  console.log(`Updated reverb wet mix to ${event.wet}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating reverb wet mix:", error);
                }
              } else {
                console.warn("Reverb effect not available for wet mix update");
              }
              return event.wet;
            },
          }),
        },
        UPDATE_DISTORTION_AMOUNT: {
          actions: assign({
            distortionAmount: ({ event, context }) => {
              if (context.distortion) {
                try {
                  // Set the distortion value and log it
                  context.distortion.distortion = event.distortion;
                  console.log(
                    `Updated distortion amount to ${event.distortion}`
                  );

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating distortion amount:", error);
                }
              } else {
                console.warn(
                  "Distortion effect not available for amount update"
                );
              }
              return event.distortion;
            },
          }),
        },
        UPDATE_DISTORTION_WET: {
          actions: assign({
            distortionWet: ({ event, context }) => {
              if (context.distortion) {
                try {
                  // Set the wet value and log it
                  context.distortion.wet.value = event.wet;
                  console.log(`Updated distortion wet mix to ${event.wet}`);

                  // Ensure audio routing is properly connected
                  ensureAudioRouting(context);
                } catch (error) {
                  console.error("Error updating distortion wet mix:", error);
                }
              } else {
                console.warn(
                  "Distortion effect not available for wet mix update"
                );
              }
              return event.wet;
            },
          }),
        },
        TOGGLE_EFFECT: {
          actions: assign({
            activeEffects: ({ event, context }) => {
              const { effect, enabled } = event;
              const currentActiveEffects = [...context.activeEffects];

              if (enabled && !currentActiveEffects.includes(effect)) {
                // Add the effect to active effects
                console.log(`Enabling effect: ${effect}`);
                currentActiveEffects.push(effect);
                if (effect === "autoFilter" && context.autoFilter) {
                  context.autoFilter.wet.value = context.filterWet;
                }
                if (effect === "delay" && context.delay) {
                  context.delay.wet.value = context.delayWet;
                }
                if (effect === "reverb" && context.reverb) {
                  context.reverb.wet.value = context.reverbWet;
                }
                if (effect === "distortion" && context.distortion) {
                  context.distortion.distortion = context.distortionAmount;
                }
              } else if (!enabled && currentActiveEffects.includes(effect)) {
                // Remove the effect from active effects
                console.log(`Disabling effect: ${effect}`);
                const index = currentActiveEffects.indexOf(effect);
                currentActiveEffects.splice(index, 1);
                if (effect === "autoFilter" && context.autoFilter) {
                  context.autoFilter.wet.value = 0;
                }
                if (effect === "delay" && context.delay) {
                  context.delay.wet.value = 0;
                }
                if (effect === "reverb" && context.reverb) {
                  context.reverb.wet.value = 0;
                }
                if (effect === "distortion" && context.distortion) {
                  context.distortion.distortion = 0;
                }
              }

              // Ensure audio routing is properly connected
              ensureAudioRouting(context);

              return currentActiveEffects;
            },
          }),
        },
      },
    },
  },
});

// Helper function to connect an instrument to the effects chain
export const connectToEffects = (
  instrument: Tone.ToneAudioNode,
  context: EffectsContext
) => {
  if (!context.effectsBus) {
    console.warn("Effects bus not available for routing");
    instrument.toDestination();
    return;
  }

  console.log("Connecting instrument to parallel effects chains");

  // Disconnect the instrument from any existing connections
  instrument.disconnect();

  // Create a split point for parallel routing
  const splitter = new Tone.Gain();
  instrument.connect(splitter);

  // Connect to each active effect in parallel
  const activeEffects = context.activeEffects;

  // Connect to autoFilter if active
  if (activeEffects.includes("autoFilter") && context.autoFilter) {
    console.log("Connecting instrument to autoFilter");
    splitter.connect(context.autoFilter);
  }

  // Connect to delay if active
  if (activeEffects.includes("delay") && context.delay) {
    console.log("Connecting instrument to delay");
    splitter.connect(context.delay);
  }

  // Connect to reverb if active
  if (activeEffects.includes("reverb") && context.reverb) {
    console.log("Connecting instrument to reverb");
    splitter.connect(context.reverb);
  }

  // Connect to distortion if active
  if (activeEffects.includes("distortion") && context.distortion) {
    console.log("Connecting instrument to distortion");
    splitter.connect(context.distortion);
  }

  // If no effects are active, connect directly to destination
  if (activeEffects.length === 0) {
    console.log(
      "No active effects, connecting instrument directly to destination"
    );
    splitter.toDestination();
  }

  // Ensure the effects chain is properly connected
  ensureAudioRouting(context);

  console.log("Instrument connected to effects chains");
};
