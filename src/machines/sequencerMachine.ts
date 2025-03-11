import {
  DEFAULT_PITCH,
  DEFAULT_PATTERN,
  NOTES,
  STEPS,
  transposeNote,
  SYNTH_CONFIG,
  FILTER_CONFIG,
  EFFECTS_BUS,
} from "../constants/sequencer";
import { setup, assign, fromCallback } from "xstate";
import * as Tone from "tone";
import { DEFAULT_TEMPO } from "../constants/sequencer";

export type Grid = boolean[][];

// Define the intervals for note calculations
const INTERVALS = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

// Calculate semitones between two notes
const calculateSemitones = (fromNote: string, toNote: string): number => {
  const fromNoteName = fromNote.slice(0, -1);
  const fromOctave = parseInt(fromNote.slice(-1));
  const toNoteName = toNote.slice(0, -1);
  const toOctave = parseInt(toNote.slice(-1));

  const fromInterval = INTERVALS[fromNoteName as keyof typeof INTERVALS];
  const toInterval = INTERVALS[toNoteName as keyof typeof INTERVALS];

  // Calculate the total interval difference
  const octaveDiff = toOctave - fromOctave;
  const noteDiff = toInterval - fromInterval;

  return octaveDiff * 12 + noteDiff;
};

type SequencerEvent =
  | { type: "PLAY" }
  | { type: "STOP" }
  | { type: "UPDATE_NOTE"; note: string }
  | { type: "UPDATE_PITCH"; pitch: number }
  | { type: "SET_GRID"; grid: Grid }
  | { type: "SET_ROOT_NOTE"; note: string }
  | { type: "UPDATE_TEMPO"; tempo: number }
  | { type: "TOGGLE_CELL"; rowIndex: number; colIndex: number }
  | { type: "STEP_CHANGE"; step: number }
  | { type: "STORE_STEP_TRACKER_ID"; id: number }
  | { type: "UPDATE_FILTER_FREQUENCY"; frequency: number }
  | { type: "UPDATE_FILTER_DEPTH"; depth: number }
  | { type: "UPDATE_FILTER_WET"; wet: number };

type SequencerContext = {
  note: string;
  rootNote: string;
  tempo: number;
  currentStep: number;
  synth: Tone.AMSynth | null;
  sequence: Tone.Sequence | null;
  grid: Grid;
  pitch: number;
  stepTrackerId: number | null;
  effectsBus: Tone.Channel | null;
  autoFilter: Tone.AutoFilter | null;
  filterFrequency: number;
  filterDepth: number;
  filterWet: number;
  channelSender: Tone.Channel | null;
};

// Helper function to ensure audio routing is properly connected
const ensureAudioRouting = (context: SequencerContext) => {
  if (
    context.synth &&
    context.autoFilter &&
    context.effectsBus &&
    context.channelSender
  ) {
    // Check if we need to reconnect
    try {
      // First disconnect everything to start fresh
      context.synth.disconnect();
      context.autoFilter.disconnect();
      context.channelSender.disconnect();

      // Connect the synth to the autoFilter
      context.synth.connect(context.autoFilter);

      // Send the autoFilter output to the named bus
      context.autoFilter.connect(context.channelSender);
      context.channelSender.send(EFFECTS_BUS, 0); // Send at 0dB level

      console.log(
        `Audio routing re-established: synth -> autoFilter -> "${EFFECTS_BUS}" bus -> destination`
      );

      // Make sure the autoFilter is running
      context.autoFilter.start();

      return true;
    } catch (error) {
      console.error("Error reconnecting audio routing:", error);
      return false;
    }
  }
  return false;
};

export const sequencerMachine = setup({
  types: {
    context: {} as SequencerContext,
    events: {} as SequencerEvent,
  },
  actors: {
    stepTracker: fromCallback(({ sendBack }) => {
      const transport = Tone.getTransport();
      const id = transport.scheduleRepeat(() => {
        const step = Math.floor(transport.ticks / 96) % 8;
        sendBack({ type: "STEP_CHANGE", step });
      }, "8n");

      return () => transport.clear(id);
    }),
  },
}).createMachine({
  id: "sequencer",
  initial: "stopped",
  context: {
    note: "C4",
    rootNote: "C4",
    tempo: DEFAULT_TEMPO,
    currentStep: -1,
    synth: null,
    sequence: null,
    grid: DEFAULT_PATTERN,
    pitch: DEFAULT_PITCH,
    stepTrackerId: null,
    effectsBus: null,
    autoFilter: null,
    filterFrequency: FILTER_CONFIG.frequency,
    filterDepth: FILTER_CONFIG.depth,
    filterWet: FILTER_CONFIG.wet,
    channelSender: null,
  },
  entry: assign({
    // First create the effects bus
    effectsBus: () => {
      console.log(`Creating effects bus with name "${EFFECTS_BUS}"`);

      // Create a channel for the effects bus and connect it to the destination
      const effectsBus = new Tone.Channel().toDestination();

      // Register the channel as a receive point for the named bus
      effectsBus.receive(EFFECTS_BUS);

      // Set destination volume
      Tone.Destination.volume.value = 0;

      console.log(`Effects bus created and receiving on "${EFFECTS_BUS}"`);

      return effectsBus;
    },
    // Then create the channel sender
    channelSender: () => {
      console.log("Creating channel sender for effects routing");
      return new Tone.Channel();
    },
    // Then create the auto filter
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

      // Important: Start the LFO
      autoFilter.start();

      console.log("Auto-filter created with params:", {
        frequency: autoFilter.frequency.value,
        depth: autoFilter.depth.value,
        wet: autoFilter.wet.value,
      });

      return autoFilter;
    },
    // Finally create the synth and connect everything
    synth: ({ context }) => {
      console.log("Creating synth");

      // Create the synth
      const synth = new Tone.AMSynth(SYNTH_CONFIG);

      // We need a longer delay to ensure all components are fully initialized
      const connectAudio = () => {
        console.log("Checking audio components...");
        console.log("Components status:", {
          autoFilter: !!context.autoFilter,
          effectsBus: !!context.effectsBus,
          channelSender: !!context.channelSender,
        });

        if (context.autoFilter && context.effectsBus && context.channelSender) {
          // Set up the proper audio routing with send/receive
          console.log("Setting up audio routing with send/receive");

          // First disconnect everything to start fresh
          synth.disconnect();
          context.autoFilter.disconnect();
          context.channelSender.disconnect();

          // Connect the synth to the autoFilter
          synth.connect(context.autoFilter);

          // Send the autoFilter output to the named bus
          // We need to use a workaround since AutoFilter doesn't have send method directly
          context.autoFilter.connect(context.channelSender);
          context.channelSender.send(EFFECTS_BUS, 0); // Send at 0dB level

          console.log(
            `Audio routing established: synth -> autoFilter -> "${EFFECTS_BUS}" bus -> destination`
          );

          // Make sure the autoFilter is running
          context.autoFilter.start();

          return true;
        } else {
          console.warn("Not all audio components are ready yet");
          return false;
        }
      };

      // Try to connect immediately
      if (!connectAudio()) {
        // If not successful, try again with increasing delays
        setTimeout(() => {
          if (!connectAudio()) {
            setTimeout(() => {
              if (!connectAudio()) {
                // Final fallback to direct connection if components still aren't ready
                console.log(
                  "Connecting synth directly to destination (no effects) - all retries failed"
                );
                synth.toDestination();
              }
            }, 500);
          }
        }, 200);
      }

      return synth;
    },
  }),
  exit: assign({
    synth: ({ context }) => {
      if (context.synth) {
        context.synth.dispose();
      }
      return null;
    },
    sequence: ({ context }) => {
      if (context.sequence) {
        context.sequence.dispose();
      }
      return null;
    },
    autoFilter: ({ context }) => {
      if (context.autoFilter) {
        context.autoFilter.dispose();
      }
      return null;
    },
    effectsBus: ({ context }) => {
      if (context.effectsBus) {
        context.effectsBus.dispose();
      }
      return null;
    },
    channelSender: ({ context }) => {
      if (context.channelSender) {
        context.channelSender.dispose();
      }
      return null;
    },
  }),
  states: {
    stopped: {
      entry: assign(({ context }) => {
        // Clean up any existing sequence
        if (context.sequence) {
          context.sequence.stop();
        }
        Tone.getTransport().stop();
        Tone.getTransport().position = 0;
        if (context.synth) {
          context.synth.triggerRelease();
        }
        return {
          currentStep: -1,
        };
      }),
      on: {
        PLAY: {
          target: "playing",
          actions: assign(({ context }) => {
            // Always dispose of the previous sequence if it exists
            if (context.sequence) {
              context.sequence.dispose();
            }

            // Create a new sequence with the current root note
            let sequence = null;

            if (context.synth) {
              sequence = new Tone.Sequence(
                (time, step) => {
                  if (!context.synth) return;

                  context.grid.forEach((row, rowIndex) => {
                    if (row[step]) {
                      // Get the pattern note from the grid
                      const patternNote = NOTES[rowIndex];

                      // Calculate the interval from the root note to the pattern note
                      const interval = calculateSemitones("C4", patternNote);

                      // Apply the interval to the pressed key (root note)
                      const finalNote = transposeNote(
                        context.rootNote,
                        interval + context.pitch
                      );

                      context.synth?.triggerAttackRelease(
                        finalNote,
                        "8n",
                        time
                      );
                    }
                  });
                },
                Array.from({ length: STEPS }, (_, i) => i),
                "8n"
              );
            }

            // Start the transport
            Tone.getTransport().bpm.value = context.tempo;
            Tone.getTransport().position = 0;

            if (sequence) {
              sequence.start();
              Tone.getTransport().start();
            }

            return {
              sequence,
            };
          }),
        },
      },
    },
    playing: {
      invoke: {
        src: "stepTracker",
        id: "stepTracker",
      },
      on: {
        STOP: "stopped",
        STEP_CHANGE: {
          actions: assign({
            currentStep: ({ event }) => event.step,
          }),
        },
        STORE_STEP_TRACKER_ID: {
          actions: assign({
            stepTrackerId: ({ event }) => event.id,
          }),
        },
      },
    },
  },
  on: {
    UPDATE_NOTE: {
      actions: assign({
        note: ({ event }) => event.note,
      }),
    },
    UPDATE_PITCH: {
      actions: assign({
        pitch: ({ event }) => event.pitch,
      }),
    },
    SET_GRID: {
      actions: assign({
        grid: ({ event }) => event.grid,
      }),
    },
    SET_ROOT_NOTE: {
      actions: assign({
        rootNote: ({ event }) => event.note,
        sequence: () => null,
      }),
    },
    UPDATE_TEMPO: {
      actions: assign({
        tempo: ({ event }) => {
          Tone.getTransport().bpm.value = event.tempo;
          return event.tempo;
        },
      }),
    },
    TOGGLE_CELL: {
      actions: assign({
        grid: ({ context, event }) => {
          const { rowIndex, colIndex } = event;
          return context.grid.map((row, r) =>
            row.map((cell, c) => {
              if (c === colIndex) {
                // If this is the clicked cell, toggle it
                if (r === rowIndex) {
                  return !cell;
                }
                // If this is any other cell in the same column, deselect it
                return false;
              }
              // Keep other cells unchanged
              return cell;
            })
          );
        },
      }),
    },
    UPDATE_FILTER_FREQUENCY: {
      actions: assign({
        filterFrequency: ({ event, context }) => {
          if (context.autoFilter) {
            try {
              // Set the frequency value and log it
              context.autoFilter.frequency.value = event.frequency;
              console.log(`Updated filter frequency to ${event.frequency}Hz`);

              // Always restart the LFO to ensure it's running with the new settings
              context.autoFilter.start();

              // Ensure audio routing is properly connected
              ensureAudioRouting(context);

              // Log the current audio routing to verify connections
              console.log("Current audio routing:", {
                autoFilter: !!context.autoFilter,
                effectsBus: !!context.effectsBus,
                channelSender: !!context.channelSender,
              });
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

              // Always restart the LFO to ensure it's running with the new settings
              context.autoFilter.start();

              // Ensure audio routing is properly connected
              ensureAudioRouting(context);

              // Log the current audio routing to verify connections
              console.log("Current audio routing:", {
                autoFilter: !!context.autoFilter,
                effectsBus: !!context.effectsBus,
                channelSender: !!context.channelSender,
              });
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

              // Log the current audio routing to verify connections
              console.log("Current audio routing:", {
                autoFilter: !!context.autoFilter,
                effectsBus: !!context.effectsBus,
                channelSender: !!context.channelSender,
              });
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
  },
});
