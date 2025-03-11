import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";
import { PitchControl } from "./components/PitchControl";
import { FilterControl } from "./components/FilterControl";
import { Keyboard } from "./components/Keyboard";
import { useMachine } from "@xstate/react";
import { sequencerMachine } from "./machines/sequencerMachine";
import { effectsMachine } from "./machines/effectsMachine";
import * as Tone from "tone";
import { useEffect, useRef } from "react";

// Define the state values type for type safety
type SequencerStateValue = "playing" | "stopped";

function App() {
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const [effectsState, effectsSend] = useMachine(effectsMachine);
  const isConnectedRef = useRef(false);

  const { grid, tempo, pitch, currentStep, synth } = sequencerState.context;

  const { filterFrequency, filterDepth, filterWet, filterResonance } =
    effectsState.context;

  // Initialize effects when the app starts
  useEffect(() => {
    console.log("Initializing effects");
    effectsSend({ type: "INIT_EFFECTS" });
  }, [effectsSend]);

  // Connect the sequencer to the effects when both are initialized
  useEffect(() => {
    if (
      synth &&
      effectsState.context.effectsBus &&
      !isConnectedRef.current &&
      effectsState.matches("active")
    ) {
      console.log("Connecting sequencer to effects");

      // Set the ref to prevent multiple connections
      isConnectedRef.current = true;

      // Use a small delay to ensure all components are fully initialized
      setTimeout(() => {
        sequencerSend({
          type: "CONNECT_TO_EFFECTS",
          effectsContext: effectsState.context,
        });
      }, 200);
    }

    // Reset the connection flag if either the synth or effects bus is removed
    if (!synth || !effectsState.context.effectsBus) {
      isConnectedRef.current = false;
    }
  }, [
    synth,
    effectsState.context.effectsBus,
    sequencerSend,
    effectsState.matches,
  ]);

  async function togglePlayback() {
    if (sequencerState.matches("playing" as SequencerStateValue)) {
      sequencerSend({ type: "STOP" });
    } else {
      try {
        await Tone.start();
        sequencerSend({ type: "PLAY" });
      } catch (error) {
        console.error("Error toggling playback:", error);
        sequencerSend({ type: "STOP" });
      }
    }
  }

  function toggleCell(rowIndex: number, colIndex: number) {
    sequencerSend({ type: "TOGGLE_CELL", rowIndex, colIndex });
  }

  function updateTempo(newTempo: number) {
    sequencerSend({ type: "UPDATE_TEMPO", tempo: newTempo });
  }

  function updatePitch(newPitch: number) {
    sequencerSend({ type: "UPDATE_PITCH", pitch: newPitch });
  }

  async function setRootNote(note: string) {
    // First set the root note in the machine
    sequencerSend({ type: "SET_ROOT_NOTE", note });

    // If we're playing, stop and restart the sequence with the new root note
    if (sequencerState.matches("playing" as SequencerStateValue)) {
      // Stop the current sequence
      sequencerSend({ type: "STOP" });

      // Wait a bit for the sequence to stop completely
      await new Promise(function (resolve) {
        setTimeout(resolve, 100);
      });

      // Start a new sequence with the updated root note
      try {
        await Tone.start();
        sequencerSend({ type: "PLAY" });
      } catch (error) {
        console.error("Error restarting sequence:", error);
      }
    }
  }

  function updateFilterFrequency(frequency: number) {
    effectsSend({ type: "UPDATE_FILTER_FREQUENCY", frequency });
  }

  function updateFilterDepth(depth: number) {
    effectsSend({ type: "UPDATE_FILTER_DEPTH", depth });
  }

  function updateFilterWet(wet: number) {
    effectsSend({ type: "UPDATE_FILTER_WET", wet });
  }

  function updateFilterResonance(resonance: number) {
    effectsSend({ type: "UPDATE_FILTER_RESONANCE", resonance });
  }

  return (
    <div className="container">
      <div className="sequencer">
        <h1>Tone.js Arpeggiator</h1>

        <SequencerGrid
          grid={grid}
          currentStep={currentStep}
          onToggleCell={toggleCell}
        />

        <Keyboard
          synth={synth || undefined}
          startOctave={3}
          onNotePress={setRootNote}
          isPlaying={sequencerState.matches("playing" as SequencerStateValue)}
          onStartSequence={togglePlayback}
          onStopSequence={togglePlayback}
        />

        <div className="controls-container">
          <TempoControl tempo={tempo} onTempoChange={updateTempo} />
          <PitchControl pitch={pitch} onPitchChange={updatePitch} />
          <FilterControl
            frequency={filterFrequency}
            depth={filterDepth}
            wet={filterWet}
            resonance={filterResonance}
            onFrequencyChange={updateFilterFrequency}
            onDepthChange={updateFilterDepth}
            onWetChange={updateFilterWet}
            onResonanceChange={updateFilterResonance}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
