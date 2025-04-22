import { EFFECT_PARAM_RANGES } from "@/constants";
import Knob from "@/components/Knob";
import "@/styles/effects.css";

type DriveControlProps = {
  drive: number;
  tone: number;
  level: number;
  onDriveChange: (drive: number) => void;
  onToneChange: (tone: number) => void;
  onLevelChange: (level: number) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

function DriveControl({
  drive,
  tone,
  level,
  onDriveChange,
  onToneChange,
  onLevelChange,
  enabled,
  onToggle,
}: DriveControlProps) {
  return (
    <div className="effectControl">
      <div className="effectHeader">
        <h3>DRIVE</h3>
        <div className={`ledIndicator ${enabled ? "active" : ""}`}></div>
        <label className="toggleSwitch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span className="toggleSlider"></span>
        </label>
      </div>

      <div className="effectKnobs">
        <Knob
          value={drive}
          min={EFFECT_PARAM_RANGES.distortion.min}
          max={EFFECT_PARAM_RANGES.distortion.max}
          step={0.01}
          label="DRIVE"
          unit="%"
          onChange={onDriveChange}
          disabled={!enabled}
        />
        <Knob
          value={tone}
          min={0}
          max={100}
          step={0.01}
          label="TONE"
          unit="%"
          onChange={onToneChange}
          disabled={!enabled}
        />
        <Knob
          value={level}
          min={0}
          max={100}
          step={0.01}
          label="LEVEL"
          unit="%"
          onChange={onLevelChange}
          disabled={!enabled}
        />
      </div>
    </div>
  );
}

export default DriveControl;
