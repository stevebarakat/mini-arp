import { useState } from "react";
import { useSequencer } from "./hooks/useSequencer";
import { Controls } from "./components/Controls";
import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";
import { PitchControl } from "./components/PitchControl";

function App() {
  const [currentStep, setCurrentStep] = useState(-1);
  const {
    isPlaying,
    grid,
    tempo,
    pitchShift,
    togglePlayback,
    toggleCell,
    updateTempo,
    updatePitchShift,
  } = useSequencer({
    onStepChange: setCurrentStep,
  });

  return (
    <div className="container">
      <div className="sequencer">
        <h1>Tone.js Arpeggiator</h1>

        <Controls isPlaying={isPlaying} onPlayClick={togglePlayback} />

        <SequencerGrid
          grid={grid}
          currentStep={currentStep}
          onToggleCell={toggleCell}
        />

        <div className="controls-container">
          <TempoControl tempo={tempo} onTempoChange={updateTempo} />
          <PitchControl
            pitchShift={pitchShift}
            onPitchChange={updatePitchShift}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
