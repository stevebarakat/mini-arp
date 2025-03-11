import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";
import { PitchControl } from "./components/PitchControl";
import { Keyboard } from "./components/Keyboard";
import { EffectsPanel } from "./components/EffectsPanel";
import { useMachine } from "@xstate/react";
import { synthMachine } from "./machines/synthMachine";
import { sequencerMachine } from "./machines/sequencerMachine";
import * as Tone from "tone";

// Define the state values type for type safety
type SequencerStateValue = "playing" | "stopped";

function App() {
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const [synthState] = useMachine(synthMachine);

  const { grid, tempo, pitch, currentStep } = sequencerState.context;

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
          synth={synthState.context.synth}
          startOctave={3}
          onNotePress={setRootNote}
          isPlaying={sequencerState.matches("playing" as SequencerStateValue)}
          onStartSequence={togglePlayback}
          onStopSequence={togglePlayback}
        />

        <div className="controls-container">
          <TempoControl tempo={tempo} onTempoChange={updateTempo} />
          <PitchControl pitch={pitch} onPitchChange={updatePitch} />
        </div>

        <EffectsPanel synth={synthState.context.synth} />
      </div>
    </div>
  );
}

export default App;
