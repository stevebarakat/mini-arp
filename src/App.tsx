import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { useMachine, useSelector } from "@xstate/react";
import { start } from "tone";
import { sequencerMachine, effectsMachine, EffectType } from "./machines";
import LoadingSpinner from "./components/LoadingSpinner";
import styles from "./styles/App.module.css";

// Lazy load components for code splitting
const SequencerGrid = lazy(() => import("./components/SequencerGrid"));
const TempoControl = lazy(() => import("./components/TempoControl"));
const PitchControl = lazy(() => import("./components/PitchControl"));
const Keyboard = lazy(() => import("./components/Keyboard"));
const EffectsTabs = lazy(() => import("./components/EffectsTabs"));

function App() {
  const [, sequencerSend, sequencerActorRef] = useMachine(sequencerMachine);
  const [, effectsSend, effectsActorRef] = useMachine(effectsMachine);
  const isConnectedRef = useRef(false);

  // Use selectors to avoid unnecessary re-renders
  const isEffectsActive = useSelector(effectsActorRef, (state) =>
    state.matches("active")
  );
  const hasEffectsBus = useSelector(
    effectsActorRef,
    (state) => !!state.context.effectsBus
  );
  const effectsContext = useSelector(effectsActorRef, (state) => state.context);

  // Sequencer state selectors
  const isPlaying = useSelector(sequencerActorRef, (state) =>
    state.matches("playing")
  );
  const grid = useSelector(sequencerActorRef, (state) => state.context.grid);
  const tempo = useSelector(sequencerActorRef, (state) => state.context.tempo);
  const pitch = useSelector(sequencerActorRef, (state) => state.context.pitch);
  const currentStep = useSelector(
    sequencerActorRef,
    (state) => state.context.currentStep
  );
  const synth = useSelector(sequencerActorRef, (state) => state.context.synth);
  const hiHatPattern = useSelector(
    sequencerActorRef,
    (state) => state.context.hiHatPattern
  );

  // Effects state selectors
  const filterFrequency = useSelector(
    effectsActorRef,
    (state) => state.context.filterFrequency
  );
  const filterDepth = useSelector(
    effectsActorRef,
    (state) => state.context.filterDepth
  );
  const filterWet = useSelector(
    effectsActorRef,
    (state) => state.context.filterWet
  );
  const filterResonance = useSelector(
    effectsActorRef,
    (state) => state.context.filterResonance
  );
  const delayTime = useSelector(
    effectsActorRef,
    (state) => state.context.delayTime
  );
  const delayFeedback = useSelector(
    effectsActorRef,
    (state) => state.context.delayFeedback
  );
  const delayWet = useSelector(
    effectsActorRef,
    (state) => state.context.delayWet
  );
  const reverbDecay = useSelector(
    effectsActorRef,
    (state) => state.context.reverbDecay
  );
  const reverbPreDelay = useSelector(
    effectsActorRef,
    (state) => state.context.reverbPreDelay
  );
  const reverbWet = useSelector(
    effectsActorRef,
    (state) => state.context.reverbWet
  );
  const distortionAmount = useSelector(
    effectsActorRef,
    (state) => state.context.distortionAmount
  );
  const distortionWet = useSelector(
    effectsActorRef,
    (state) => state.context.distortionWet
  );
  const activeEffects = useSelector(
    effectsActorRef,
    (state) => state.context.activeEffects
  );

  // Add state for active keys
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  // Add state for arpeggiator mode
  const [isArpeggiatorMode, setIsArpeggiatorMode] = useState(false);

  // Initialize effects when the app starts
  useEffect(() => {
    effectsSend({ type: "INIT_EFFECTS" });
  }, [effectsSend]);

  useEffect(() => {
    if (synth && hasEffectsBus && !isConnectedRef.current && isEffectsActive) {
      // Set the ref to prevent multiple connections
      isConnectedRef.current = true;

      // Use a small delay to ensure all components are fully initialized
      setTimeout(() => {
        sequencerSend({
          type: "CONNECT_TO_EFFECTS",
          effectsContext: effectsContext,
        });
      }, 200);
    }

    // Reset the connection flag if either the synth or effects bus is removed
    if (!synth || !hasEffectsBus) {
      isConnectedRef.current = false;
    }
  }, [synth, hasEffectsBus, sequencerSend, isEffectsActive, effectsContext]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      sequencerSend({ type: "STOP" });
    } else {
      try {
        await start();
        sequencerSend({ type: "PLAY" });
      } catch (error) {
        console.error("Error toggling playback:", error);
        sequencerSend({ type: "STOP" });
      }
    }
  }, [isPlaying, sequencerSend]);

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

  const handleKeyClick = useCallback(
    (note: string) => {
      if (note) {
        // Only handle actual notes, not empty strings
        if (isPlaying) {
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
    },
    [isPlaying, sequencerSend, isArpeggiatorMode, togglePlayback]
  );

  const onStopArpeggiator = useCallback(() => {
    sequencerSend({ type: "STOP" });
  }, [sequencerSend]);

  const handleToggleArpeggiatorMode = useCallback((checked: boolean) => {
    setIsArpeggiatorMode(checked);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.sequencer}>
        <div className={styles.controlsContainer}>
          <Suspense fallback={<LoadingSpinner />}>
            <SequencerGrid
              grid={grid}
              currentStep={currentStep % 8}
              pattern={hiHatPattern}
              onToggleStep={toggleHiHat}
              onToggleCell={toggleCell}
            />
          </Suspense>
          <div>
            <Suspense fallback={<LoadingSpinner />}>
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
            </Suspense>
            <div className={styles.sequencerControls}>
              <Suspense fallback={<LoadingSpinner />}>
                <TempoControl tempo={tempo} onTempoChange={updateTempo} />
                <PitchControl pitch={pitch} onPitchChange={updatePitch} />
              </Suspense>
            </div>
          </div>
        </div>
        <Suspense fallback={<LoadingSpinner />}>
          <Keyboard
            activeKeys={activeKeys}
            onKeyClick={handleKeyClick}
            isArpeggiatorMode={isArpeggiatorMode}
            onToggleArpeggiatorMode={handleToggleArpeggiatorMode}
            onStopArpeggiator={onStopArpeggiator}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default App;
