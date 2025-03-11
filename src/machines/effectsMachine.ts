import { setup, assign } from "xstate";
import * as Tone from "tone";
import { FILTER_CONFIG, EFFECTS_BUS } from "../constants/sequencer";

// Define the types of effects we support
export type EffectType = "autoFilter" | "delay" | "reverb" | "distortion";

// Define the events that can be sent to the effects machine
type EffectsEvent =
  | { type: "INIT_EFFECTS" }
  | { type: "DISPOSE_EFFECTS" }
  | { type: "UPDATE_FILTER_FREQUENCY"; frequency: number }
  | { type: "UPDATE_FILTER_DEPTH"; depth: number }
  | { type: "UPDATE_FILTER_WET"; wet: number }
  | { type: "UPDATE_FILTER_RESONANCE"; resonance: number };

// Define the context for the effects machine
export type EffectsContext = {
  // The main effects bus that all effects send to
  effectsBus: Tone.Channel | null;

  // Individual effects
  autoFilter: Tone.AutoFilter | null;

  // Channel senders for effects that don't have built-in send methods
  channelSenders: Record<string, Tone.Channel>;

  // Effect parameters
  filterFrequency: number;
  filterDepth: number;
  filterWet: number;
  filterResonance: number;

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
  if (
    context.autoFilter &&
    context.effectsBus &&
    context.channelSenders["autoFilter"]
  ) {
    try {
      // Disconnect everything first
      context.autoFilter.disconnect();
      context.channelSenders["autoFilter"].disconnect();

      // Connect autoFilter to its channel sender
      context.autoFilter.connect(context.channelSenders["autoFilter"]);

      // Send from channel sender to effects bus
      context.channelSenders["autoFilter"].send(EFFECTS_BUS, 0);

      console.log(
        `Audio routing re-established: autoFilter -> "${EFFECTS_BUS}" bus -> destination`
      );

      // Safely restart the autoFilter
      safelyRestartAutoFilter(context.autoFilter);

      return true;
    } catch (error) {
      console.error("Error reconnecting audio routing:", error);
      return false;
    }
  }
  return false;
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
    channelSenders: {},
    filterFrequency: FILTER_CONFIG.frequency,
    filterDepth: FILTER_CONFIG.depth,
    filterWet: FILTER_CONFIG.wet,
    filterResonance: FILTER_CONFIG.filter.Q,
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

            // Create channel senders for each effect
            channelSenders: () => {
              console.log("Creating channel senders for effects routing");

              const senders: Record<string, Tone.Channel> = {
                autoFilter: new Tone.Channel(),
              };

              return senders;
            },

            // Update active effects
            activeEffects: () => ["autoFilter"],

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
      },
    },
  },
});

// Helper function to connect an instrument to the effects chain
export const connectToEffects = (
  instrument: Tone.ToneAudioNode,
  context: EffectsContext
) => {
  if (!context.autoFilter) {
    console.warn("No effects available to connect to");
    instrument.toDestination();
    return;
  }

  console.log("Connecting instrument to effects chain");

  // Disconnect the instrument from any existing connections
  instrument.disconnect();

  // Connect to the first effect in the chain
  instrument.connect(context.autoFilter);

  // Ensure the effects chain is properly connected
  ensureAudioRouting(context);

  console.log("Instrument connected to effects chain");
};
