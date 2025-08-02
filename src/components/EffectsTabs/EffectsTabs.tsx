import * as Tabs from "@radix-ui/react-tabs";
import { EffectType } from "../../machines/effectsMachine";
import styles from "../../styles/App.module.css";
import FilterControl from "../FilterControl";
import DelayControl from "../DelayControl";
import ReverbControl from "../ReverbControl";
import DistortionControl from "../DistortionControl";

type EffectsTabsProps = {
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
};

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
}: EffectsTabsProps) {
  return (
    <>
      <Tabs.Root defaultValue="filter">
        <Tabs.List className={styles.tabsList}>
          <Tabs.Trigger className={styles.tabsTrigger} value="filter">
            Filter{" "}
            <div
              className={`ledIndicator ${
                isEffectActive("autoFilter") ? "active" : ""
              }`}
            ></div>
            <label className="toggleSwitch">
              <input
                type="checkbox"
                checked={isEffectActive("autoFilter")}
                onChange={(e) => onToggleFilter(e.target.checked)}
              />
              <span className="toggleSlider"></span>
            </label>
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="delay">
            Delay{" "}
            <div
              className={`ledIndicator ${
                isEffectActive("delay") ? "active" : ""
              }`}
            ></div>
            <label className="toggleSwitch">
              <input
                type="checkbox"
                checked={isEffectActive("delay")}
                onChange={(e) => onToggleDelay(e.target.checked)}
              />
              <span className="toggleSlider"></span>
            </label>
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="reverb">
            Reverb{" "}
            <div
              className={`ledIndicator ${
                isEffectActive("reverb") ? "active" : ""
              }`}
            ></div>
            <label className="toggleSwitch">
              <input
                type="checkbox"
                checked={isEffectActive("reverb")}
                onChange={(e) => onToggleReverb(e.target.checked)}
              />
              <span className="toggleSlider"></span>
            </label>
          </Tabs.Trigger>
          <Tabs.Trigger className={styles.tabsTrigger} value="distortion">
            Distortion{" "}
            <div
              className={`ledIndicator ${
                isEffectActive("distortion") ? "active" : ""
              }`}
            ></div>
            <label className="toggleSwitch">
              <input
                type="checkbox"
                checked={isEffectActive("distortion")}
                onChange={(e) => onToggleDistortion(e.target.checked)}
              />
              <span className="toggleSlider"></span>
            </label>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className={styles.tabsContent} value="filter">
          <FilterControl
            frequency={filterFrequency}
            depth={filterDepth}
            wet={filterWet}
            resonance={filterResonance}
            enabled={isEffectActive("filter")}
            onToggle={onToggleFilter}
            onFrequencyChange={onFrequencyChange}
            onDepthChange={onDepthChange}
            onWetChange={onFilterWetChange}
            onResonanceChange={onResonanceChange}
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
    </>
  );
}

export default EffectsTabs;
