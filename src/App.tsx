import { useState } from "react";
import { useSequencer } from "./hooks/useSequencer";
import { Controls } from "./components/Controls";
import { SequencerGrid } from "./components/SequencerGrid";
import { TempoControl } from "./components/TempoControl";

function App() {
  const [currentStep, setCurrentStep] = useState(-1);
  const { isPlaying, grid, tempo, togglePlayback, toggleCell, updateTempo } =
    useSequencer({
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

        <TempoControl tempo={tempo} onTempoChange={updateTempo} />
      </div>
    </div>
  );
}

export default App;
