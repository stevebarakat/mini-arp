import { RefObject } from "react";

export type KeyboardProps = {
  activeKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  instrumentType?: string;
  isArpeggiatorMode?: boolean;
  onToggleArpeggiatorMode?: (checked: boolean) => void;
  onStopArpeggiator?: () => void;
  ref?: RefObject<{
    playNote: (note: string) => void;
  }>;
};

export type KeyboardRef = {
  playNote: (note: string) => void;
};

export type KeyData = {
  note: string;
  isSharp: boolean;
};

export type WhiteKeyData = {
  key: string;
  note: string;
  isActive: boolean;
  onPointerDown: () => void;
  onPointerUp: () => void;
};

export type BlackKeyData = {
  key: string;
  note: string;
  isActive: boolean;
  position: number;
  width: number;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
};
