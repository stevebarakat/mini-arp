import React from "react";
import styles from "./Keyboard.module.css";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
};

function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <label className={styles.toggleSwitch} htmlFor={id}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.toggleSlider}></span>
      </label>
      <span style={{ fontSize: "14px", color: "hsl(220, 13%, 90%)" }}>
        {label}
      </span>
    </div>
  );
}

export default Toggle;
