import { useState, useEffect, useRef } from "react";
import SequencerGrid from "./components/SequencerGrid";
import TempoControl from "./components/TempoControl";
import PitchControl from "./components/PitchControl";
import FilterControl from "./components/FilterControl";
import DelayControl from "./components/DelayControl";
import ReverbControl from "./components/ReverbControl";
import DistortionControl from "./components/DistortionControl";
import { useMachine } from "@xstate/react";
import { sequencerMachine } from "./machines/sequencerMachine";
import { effectsMachine } from "./machines/effectsMachine";
import * as Tone from "tone";
import { EffectType } from "./machines/effectsMachine";
import Keyboard from "./components/Keyboard";
import styles from "./styles/App.module.css";
import "@/styles/effects.css";
import * as Tabs from "@radix-ui/react-tabs";

// Define the state values type for type safety
type SequencerStateValue = "playing" | "stopped";

function EffectsTabs({
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
  onFrequencyChange,
  onDepthChange,
  onFilterWetChange,
  onResonanceChange,
  onDelayTimeChange,
  onFeedbackChange,
  onDelayWetChange,
  onDecayChange,
  onPreDelayChange,
  onReverbWetChange,
  onDistortionChange,
  onDistortionWetChange,
  isEffectActive,
  onToggleFilter,
  onToggleDelay,
  onToggleReverb,
  onToggleDistortion,
}: {
  filterFrequency: number;
  filterDepth: number;
  filterWet: number;
  filterResonance: number;
  delayTime: number;
  delayFeedback: number;
  delayWet: number;
  reverbDecay: number;
  reverbPreDelay: number;
  reverbWet: number;
  distortionAmount: number;
  distortionWet: number;
  onFrequencyChange: (value: number) => void;
  onDepthChange: (value: number) => void;
  onFilterWetChange: (value: number) => void;
  onResonanceChange: (value: number) => void;
  onDelayTimeChange: (value: number) => void;
  onFeedbackChange: (value: number) => void;
  onDelayWetChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onPreDelayChange: (value: number) => void;
  onReverbWetChange: (value: number) => void;
  onDistortionChange: (value: number) => void;
  onDistortionWetChange: (value: number) => void;
  isEffectActive: (effect: EffectType) => boolean;
  onToggleFilter: (enabled: boolean) => void;
  onToggleDelay: (enabled: boolean) => void;
  onToggleReverb: (enabled: boolean) => void;
  onToggleDistortion: (enabled: boolean) => void;
}) {
  return (
    <div className="effectControl">
      <Tabs.Root className={styles.tabsRoot} defaultValue="filter">
        <Tabs.List className={styles.tabsList}>
          <Tabs.Trigger className={styles.tabsTrigger} value="filter">
            Filter
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="delay">
            Delay
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="reverb">
            Reverb
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="distortion">
            Distortion
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className={styles.tabsContent} value="filter">
          <FilterControl
            frequency={filterFrequency}
            depth={filterDepth}
            wet={filterWet}
            resonance={filterResonance}
            onFrequencyChange={onFrequencyChange}
            onDepthChange={onDepthChange}
            onWetChange={onFilterWetChange}
            onResonanceChange={onResonanceChange}
            enabled={isEffectActive("autoFilter")}
            onToggle={onToggleFilter}
          />
        </Tabs.Content>
        <Tabs.Content className={styles.tabsContent} value="delay">
          <DelayControl
            delayTime={delayTime}
            feedback={delayFeedback}
            wet={delayWet}
            onDelayTimeChange={onDelayTimeChange}
            onFeedbackChange={onFeedbackChange}
            onWetChange={onDelayWetChange}
            enabled={isEffectActive("delay")}
            onToggle={onToggleDelay}
          />
        </Tabs.Content>
        <Tabs.Content className={styles.tabsContent} value="reverb">
          <ReverbControl
            decay={reverbDecay}
            preDelay={reverbPreDelay}
            wet={reverbWet}
            onDecayChange={onDecayChange}
            onPreDelayChange={onPreDelayChange}
            onWetChange={onReverbWetChange}
            enabled={isEffectActive("reverb")}
            onToggle={onToggleReverb}
          />
        </Tabs.Content>
        <Tabs.Content className={styles.tabsContent} value="distortion">
          <DistortionControl
            distortion={distortionAmount}
            wet={distortionWet}
            onDistortionChange={onDistortionChange}
            onWetChange={onDistortionWetChange}
            enabled={isEffectActive("distortion")}
            onToggle={onToggleDistortion}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

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
    effectsSend({ type: "TOGGLE_EFFECT", effect: "autoFilter", enabled });
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
    // Toggle the distortion effect
    effectsSend({ type: "TOGGLE_EFFECT", effect: "distortion", enabled });
  }

  // Helper function to check if an effect is active
  function isEffectActive(effect: EffectType): boolean {
    return activeEffects.includes(effect);
  }

  const toggleHiHat = (step: number) => {
    sequencerSend({ type: "TOGGLE_HI_HAT", step });
  };

  const handleKeyClick = (note: string) => {
    if (note) {
      // Only handle actual notes, not empty strings
      setRootNote(note);
      setActiveKeys([note]); // Set the clicked note as active
      if (!sequencerState.matches("playing")) {
        togglePlayback();
      }
    } else {
      setActiveKeys([]); // Clear active keys on release
      if (sequencerState.matches("playing")) {
        togglePlayback(); // Stop the sequencer when key is released
      }
    }
  };

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
          <div className={styles.controlGroup}>
            <div className="effectControl">
              <TempoControl tempo={tempo} onTempoChange={updateTempo} />
              <PitchControl pitch={pitch} onPitchChange={updatePitch} />
            </div>
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
          </div>
        </div>
        <Keyboard activeKeys={activeKeys} onKeyClick={handleKeyClick} />
      </div>
    </div>
  );
}

export default App;
