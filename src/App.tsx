import { useState, useEffect, useRef } from "react";
import { useMachine } from "@xstate/react";
import * as Tone from "tone";
import { sequencerMachine, effectsMachine, EffectType } from "./machines";
import SequencerGrid from "./components/SequencerGrid";
import TempoControl from "./components/TempoControl";
import PitchControl from "./components/PitchControl";
import Keyboard from "./components/Keyboard";
import EffectsTabs from "./components/EffectsTabs";
import styles from "./styles/App.module.css";

// Define the state values type for type safety
type SequencerStateValue = "playing" | "stopped";

function App() {
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const [effectsState, effectsSend] = useMachine(effectsMachine);
  const isConnectedRef = useRef(false);

  const { grid, tempo, pitch, currentStep, synth, hiHatPattern } =
    sequencerState.context;

  const {
    filterFrequency,
    filterDepth,
    filterWet,
    filterResonance,
    delayTime,
    delayFeedback,
    delayWet,
    reverbDecay,
    reverbPreDelay,
    reverbWet,
    distortionAmount,
    distortionWet,
    activeEffects,
  } = effectsState.context;

  // Add state for active keys
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Add state for arpeggiator mode
  const [isArpeggiatorMode, setIsArpeggiatorMode] = useState(false);

  // Initialize effects when the app starts
  useEffect(() => {
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
    effectsState,
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

  // Filter effect handlers
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

  function toggleFilter(enabled: boolean) {
    effectsSend({ type: "TOGGLE_EFFECT", effect: "autofilter", enabled });
  }

  // Delay effect handlers
  function updateDelayTime(delayTime: number) {
    effectsSend({ type: "UPDATE_DELAY_TIME", delayTime });
  }

  function updateDelayFeedback(feedback: number) {
    effectsSend({ type: "UPDATE_DELAY_FEEDBACK", feedback });
  }

  function updateDelayWet(wet: number) {
    effectsSend({ type: "UPDATE_DELAY_WET", wet });
  }

  function toggleDelay(enabled: boolean) {
    effectsSend({ type: "TOGGLE_EFFECT", effect: "delay", enabled });
  }

  // Reverb effect handlers
  function updateReverbDecay(decay: number) {
    effectsSend({ type: "UPDATE_REVERB_DECAY", decay });
  }

  function updateReverbPreDelay(preDelay: number) {
    effectsSend({ type: "UPDATE_REVERB_PREDELAY", preDelay });
  }

  function updateReverbWet(wet: number) {
    effectsSend({ type: "UPDATE_REVERB_WET", wet });
  }

  function toggleReverb(enabled: boolean) {
    effectsSend({ type: "TOGGLE_EFFECT", effect: "reverb", enabled });
  }

  // Distortion effect handlers
  function updateDistortionAmount(distortion: number) {
    effectsSend({ type: "UPDATE_DISTORTION_AMOUNT", distortion });
  }

  function updateDistortionWet(wet: number) {
    effectsSend({ type: "UPDATE_DISTORTION_WET", wet });
  }

  function toggleDistortion(enabled: boolean) {
    effectsSend({ type: "TOGGLE_EFFECT", effect: "distortion", enabled });
  }

  // Helper function to check if an effect is active
  function isEffectActive(effect: EffectType): boolean {
    return activeEffects.includes(effect);
  }

  function toggleHiHat(step: number) {
    sequencerSend({ type: "TOGGLE_HI_HAT", step });
  }

  function handleKeyClick(note: string) {
    if (note) {
      // Only handle actual notes, not empty strings
      if (sequencerState.matches("playing")) {
        if (isArpeggiatorMode) {
          // If arpeggiator mode is enabled, transpose without stopping
          sequencerSend({ type: "TRANSPOSE_TO_NOTE", note });
        } else {
          // If arpeggiator mode is disabled, restart the sequence
          sequencerSend({ type: "STOP" });
          setTimeout(() => {
            sequencerSend({ type: "SET_ROOT_NOTE", note });
            sequencerSend({ type: "PLAY" });
          }, 100);
        }
      } else {
        // If stopped, set the root note and start playing
        sequencerSend({ type: "SET_ROOT_NOTE", note });
        togglePlayback();
      }
      setActiveKeys([note]); // Update to the current active note
    } else {
      // When note is empty string (key release), just clear active keys
      // Don't stop the sequence - let it continue playing
      setActiveKeys([]);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.sequencer}>
        <div className={styles.controlsContainer}>
          <SequencerGrid
            grid={grid}
            currentStep={currentStep % 8}
            pattern={hiHatPattern}
            onToggleStep={toggleHiHat}
            onToggleCell={toggleCell}
          />
          <div>
            <EffectsTabs
              filterFrequency={filterFrequency}
              filterDepth={filterDepth}
              filterWet={filterWet}
              filterResonance={filterResonance}
              delayTime={delayTime}
              delayFeedback={delayFeedback}
              delayWet={delayWet}
              reverbDecay={reverbDecay}
              reverbPreDelay={reverbPreDelay}
              reverbWet={reverbWet}
              distortionAmount={distortionAmount}
              distortionWet={distortionWet}
              onFrequencyChange={updateFilterFrequency}
              onDepthChange={updateFilterDepth}
              onFilterWetChange={updateFilterWet}
              onResonanceChange={updateFilterResonance}
              onDelayTimeChange={updateDelayTime}
              onFeedbackChange={updateDelayFeedback}
              onDelayWetChange={updateDelayWet}
              onDecayChange={updateReverbDecay}
              onPreDelayChange={updateReverbPreDelay}
              onReverbWetChange={updateReverbWet}
              onDistortionChange={updateDistortionAmount}
              onDistortionWetChange={updateDistortionWet}
              isEffectActive={isEffectActive}
              onToggleFilter={toggleFilter}
              onToggleDelay={toggleDelay}
              onToggleReverb={toggleReverb}
              onToggleDistortion={toggleDistortion}
            />
            <div className={styles.sequencerControls}>
              <TempoControl tempo={tempo} onTempoChange={updateTempo} />
              <PitchControl pitch={pitch} onPitchChange={updatePitch} />
            </div>
          </div>
        </div>
        <Keyboard
          activeKeys={activeKeys}
          onKeyClick={handleKeyClick}
          isArpeggiatorMode={isArpeggiatorMode}
          onToggleArpeggiatorMode={setIsArpeggiatorMode}
          onStopArpeggiator={() => sequencerSend({ type: "STOP" })}
        />
      </div>
    </div>
  );
}

export default App;
