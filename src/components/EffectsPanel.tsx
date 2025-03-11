import React, { useState, useEffect } from "react";
import * as Tone from "tone";

interface EffectsPanelProps {
  synth: Tone.AMSynth | undefined;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({ synth }) => {
  // State for effects
  const [reverb, setReverb] = useState<Tone.Reverb | null>(null);
  const [delay, setDelay] = useState<Tone.FeedbackDelay | null>(null);
  const [distortion, setDistortion] = useState<Tone.Distortion | null>(null);
  // Add channel merger for parallel processing
  const [, setMerger] = useState<Tone.Merge | null>(null);

  // State for effect parameters
  const [reverbEnabled, setReverbEnabled] = useState(false);
  const [reverbDecay, setReverbDecay] = useState(1.5);

  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayTime, setDelayTime] = useState(0.25);
  const [delayFeedback, setDelayFeedback] = useState(0.5);

  const [distortionEnabled, setDistortionEnabled] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.4);

  // Initialize effects
  useEffect(() => {
    if (!synth) return;

    // Create a channel merger to combine parallel paths
    const newMerger = new Tone.Merge().toDestination();

    // Create effects
    const newReverb = new Tone.Reverb({
      decay: reverbDecay,
      wet: 0, // Start disabled
    });

    const newDelay = new Tone.FeedbackDelay({
      delayTime: delayTime,
      feedback: delayFeedback,
      wet: 0, // Start disabled
    });

    const newDistortion = new Tone.Distortion({
      distortion: distortionAmount,
      wet: 0, // Start disabled
    });

    // Set up parallel signal flow using a simpler approach:
    // 1. Disconnect synth from any previous connections
    synth.disconnect();

    // 2. Create three parallel paths directly from the synth

    // Path 1: Synth -> Distortion -> Merger input 0
    synth.connect(newDistortion);
    newDistortion.connect(newMerger, 0, 0);

    // Path 2: Synth -> Reverb -> Merger input 1
    synth.connect(newReverb);
    newReverb.connect(newMerger, 0, 1);

    // Path 3: Synth -> Delay -> Merger input 1 (mixed with reverb)
    synth.connect(newDelay);
    newDelay.connect(newMerger, 0, 1);

    // Store effects in state
    setReverb(newReverb);
    setDelay(newDelay);
    setDistortion(newDistortion);
    setMerger(newMerger);

    // Cleanup function
    return () => {
      newReverb.dispose();
      newDelay.dispose();
      newDistortion.dispose();
      newMerger.dispose();

      // Reconnect synth directly to destination
      if (synth) {
        synth.disconnect();
        synth.toDestination();
      }
    };
  }, [delayFeedback, delayTime, distortionAmount, reverbDecay, synth]);

  // Handle effect parameter changes
  useEffect(() => {
    if (reverb) {
      reverb.decay = reverbDecay;
      reverb.wet.value = reverbEnabled ? 0.5 : 0;
    }
  }, [reverb, reverbDecay, reverbEnabled]);

  useEffect(() => {
    if (delay) {
      delay.delayTime.value = delayTime;
      delay.feedback.value = delayFeedback;
      delay.wet.value = delayEnabled ? 0.5 : 0;
    }
  }, [delay, delayTime, delayFeedback, delayEnabled]);

  useEffect(() => {
    if (distortion) {
      distortion.distortion = distortionAmount;
      distortion.wet.value = distortionEnabled ? 0.5 : 0;
    }
  }, [distortion, distortionAmount, distortionEnabled]);

  return (
    <div className="effects-panel">
      <h3>Effects</h3>

      <div className="effect-control">
        <div className="effect-header">
          <label>
            <input
              type="checkbox"
              checked={distortionEnabled}
              onChange={(e) => setDistortionEnabled(e.target.checked)}
            />
            Distortion
          </label>
        </div>
        <div className="effect-params">
          <label>
            Amount:
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={distortionAmount}
              onChange={(e) => setDistortionAmount(parseFloat(e.target.value))}
              disabled={!distortionEnabled}
            />
            <span>{Math.round(distortionAmount * 100)}%</span>
          </label>
        </div>
      </div>

      <div className="effect-control">
        <div className="effect-header">
          <label>
            <input
              type="checkbox"
              checked={reverbEnabled}
              onChange={(e) => setReverbEnabled(e.target.checked)}
            />
            Reverb
          </label>
        </div>
        <div className="effect-params">
          <label>
            Decay:
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={reverbDecay}
              onChange={(e) => setReverbDecay(parseFloat(e.target.value))}
              disabled={!reverbEnabled}
            />
            <span>{reverbDecay.toFixed(1)}s</span>
          </label>
        </div>
      </div>

      <div className="effect-control">
        <div className="effect-header">
          <label>
            <input
              type="checkbox"
              checked={delayEnabled}
              onChange={(e) => setDelayEnabled(e.target.checked)}
            />
            Delay
          </label>
        </div>
        <div className="effect-params">
          <label>
            Time:
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={delayTime}
              onChange={(e) => setDelayTime(parseFloat(e.target.value))}
              disabled={!delayEnabled}
            />
            <span>{delayTime.toFixed(2)}s</span>
          </label>
          <label>
            Feedback:
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={delayFeedback}
              onChange={(e) => setDelayFeedback(parseFloat(e.target.value))}
              disabled={!delayEnabled}
            />
            <span>{Math.round(delayFeedback * 100)}%</span>
          </label>
        </div>
      </div>
    </div>
  );
};
