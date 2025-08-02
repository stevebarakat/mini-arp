import React from "react";
import styles from "./Keyboard.module.css";

type WhiteKeyProps = {
  isActive: boolean;
  onPointerDown: () => void;
  onPointerUp: () => void;
};

type BlackKeyProps = {
  isActive: boolean;
  position: number;
  width: number;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};

function WhiteKey({ isActive, onPointerDown, onPointerUp }: WhiteKeyProps) {
  return (
    <div
      className={`${styles.whiteKey} ${isActive ? styles.whiteKeyActive : ""}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    />
  );
}

function BlackKey({
  isActive,
  position,
  width,
  onPointerDown,
  onPointerUp,
  onPointerEnter,
  onPointerLeave,
}: BlackKeyProps) {
  return (
    <div
      className={`${styles.blackKey} ${isActive ? styles.blackKeyActive : ""}`}
      style={{ left: `${position}%`, width: `${width}%` }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    />
  );
}

export { WhiteKey, BlackKey };
