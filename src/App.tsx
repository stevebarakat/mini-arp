import { useState } from "react";
import { useSequencer } from "./hooks/useSequencer";
import { Controls } from "./components/Controls";
import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";
import { PitchControl } from "./components/PitchControl";
import { Keyboard } from "./components/Keyboard";
import { useMachine } from "@xstate/react";
import { synthMachine } from "./machines/synthMachine";

function App() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [synthState] = useMachine(synthMachine);
  const {
    state,
    grid,
    tempo,
    pitch,
    togglePlayback,
    toggleCell,
    updateTempo,
    updatePitch,
  } = useSequencer({
    onStepChange: setCurrentStep,
  });

  return (
    <div className="container">
      <div className="sequencer">
        <h1>Tone.js Arpeggiator</h1>

        <Controls
          isPlaying={state.matches("playing")}
          onPlayClick={togglePlayback}
        />

        <SequencerGrid
          grid={grid}
          currentStep={currentStep}
          onToggleCell={toggleCell}
        />

        <Keyboard synth={synthState.context.synth} startOctave={3} />

        <div className="controls-container">
          <TempoControl tempo={tempo} onTempoChange={updateTempo} />
          <PitchControl pitch={pitch} onPitchChange={updatePitch} />
        </div>
      </div>
    </div>
  );
}

export default App;
