import { effectsMachine } from "../machines/effectsMachine";
import { useMachine } from "@xstate/react";
import * as Tone from "tone";

function EffectsPanel({ channel }: { channel: Tone.Channel }) {
  const [state, send] = useMachine(effectsMachine);
  const { reverb, delay, distortion } = state.context;
  console.log(state.context);
  return (
    <div>
      <label>Reverb</label>
      <input
        type="checkbox"
        checked={reverb}
        onChange={(e) =>
          send({
            type: "TOGGLE_REVERB",
            checked: e.target.checked,
            channel,
          })
        }
      />
      <label>Delay</label>
      <input
        type="checkbox"
        checked={delay}
        onChange={(e) =>
          send({
            type: "TOGGLE_DELAY",
            checked: e.target.checked,
            channel,
          })
        }
      />
      <label>Distortion</label>
      <input
        type="checkbox"
        checked={distortion}
        onChange={(e) =>
          send({
            type: "TOGGLE_DISTORTION",
            checked: e.target.checked,
            channel,
          })
        }
      />
    </div>
  );
}

export default EffectsPanel;
