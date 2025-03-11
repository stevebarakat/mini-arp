import { useEffect } from "react";
import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";
import { PitchControl } from "./components/PitchControl";
import { Keyboard } from "./components/Keyboard";
import { useMachine } from "@xstate/react";
import { synthMachine } from "./machines/synthMachine";
import { sequencerMachine } from "./machines/sequencerMachine";
import * as Tone from "tone";

function App() {
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const [synthState] = useMachine(synthMachine);

  const { grid, tempo, pitch, currentStep } = sequencerState.context;

  // Update the step when it changes in the machine
  useEffect(() => {
    const handleStepChange = (step: number) => {
      sequencerSend({ type: "STEP_CHANGE", step });
    };

    // Set up a callback for Tone.Transport
    const id = Tone.Transport.scheduleRepeat(() => {
      const step = Math.floor(Tone.Transport.ticks / 96) % 8;
      handleStepChange(step);
    }, "8n");

    return () => {
      Tone.Transport.clear(id);
    };
  }, [sequencerSend]);

  const togglePlayback = async () => {
    if (sequencerState.matches("playing")) {
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
  };

  const toggleCell = (rowIndex: number, colIndex: number) => {
    sequencerSend({ type: "TOGGLE_CELL", rowIndex, colIndex });
  };

  const updateTempo = (newTempo: number) => {
    sequencerSend({ type: "UPDATE_TEMPO", tempo: newTempo });
  };

  const updatePitch = (newPitch: number) => {
    sequencerSend({ type: "UPDATE_PITCH", pitch: newPitch });
  };

  const setRootNote = async (note: string) => {
    // First set the root note in the machine
    sequencerSend({ type: "SET_ROOT_NOTE", note });

    // If we're playing, stop and restart the sequence with the new root note
    if (sequencerState.matches("playing")) {
      // Stop the current sequence
      sequencerSend({ type: "STOP" });

      // Wait a bit for the sequence to stop completely
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start a new sequence with the updated root note
      try {
        await Tone.start();
        sequencerSend({ type: "PLAY" });
      } catch (error) {
        console.error("Error restarting sequence:", error);
      }
    }
  };

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
          isPlaying={sequencerState.matches("playing")}
          onStartSequence={togglePlayback}
          onStopSequence={togglePlayback}
        />

        <div className="controls-container">
          <TempoControl tempo={tempo} onTempoChange={updateTempo} />
          <PitchControl pitch={pitch} onPitchChange={updatePitch} />
        </div>
      </div>
    </div>
  );
}

export default App;
