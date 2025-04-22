import Knob from "../Knob";
import styles from "./styles.module.css";

// Update curve types to match Tone.js's BasicEnvelopeCurve
const CURVE_TYPES = ["linear", "exponential"] as const;

type CurveType = (typeof CURVE_TYPES)[number];

interface EnvelopeControlProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve: CurveType;
  decayCurve: CurveType;
  releaseCurve: CurveType;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
  onAttackCurveChange: (value: CurveType) => void;
  onDecayCurveChange: (value: CurveType) => void;
  onReleaseCurveChange: (value: CurveType) => void;
}

export default function EnvelopeControl({
  attack,
  decay,
  sustain,
  release,
  attackCurve,
  decayCurve,
  releaseCurve,
  onAttackChange,
  onDecayChange,
  onSustainChange,
  onReleaseChange,
  onAttackCurveChange,
  onDecayCurveChange,
  onReleaseCurveChange,
}: EnvelopeControlProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Envelope</h3>
      <div className={styles.knobRow}>
        <Knob
          value={attack}
          min={0}
          max={2}
          step={0.01}
          label="Attack"
          unit="s"
          onChange={onAttackChange}
        />
        <Knob
          value={decay}
          min={0}
          max={2}
          step={0.01}
          label="Decay"
          unit="s"
          onChange={onDecayChange}
        />
        <Knob
          value={sustain}
          min={0}
          max={1}
          step={0.01}
          label="Sustain"
          onChange={onSustainChange}
        />
        <Knob
          value={release}
          min={0}
          max={5}
          step={0.01}
          label="Release"
          unit="s"
          onChange={onReleaseChange}
        />
      </div>
      <div className={styles.curveSelectors}>
        <div className={styles.curveSelector}>
          <label>Attack Curve</label>
          <select
            value={attackCurve}
            onChange={(e) => onAttackCurveChange(e.target.value as CurveType)}
          >
            {CURVE_TYPES.map((curve) => (
              <option key={curve} value={curve}>
                {curve}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.curveSelector}>
          <label>Decay Curve</label>
          <select
            value={decayCurve}
            onChange={(e) => onDecayCurveChange(e.target.value as CurveType)}
          >
            {CURVE_TYPES.map((curve) => (
              <option key={curve} value={curve}>
                {curve}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.curveSelector}>
          <label>Release Curve</label>
          <select
            value={releaseCurve}
            onChange={(e) => onReleaseCurveChange(e.target.value as CurveType)}
          >
            {CURVE_TYPES.map((curve) => (
              <option key={curve} value={curve}>
                {curve}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
