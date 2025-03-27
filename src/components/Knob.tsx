import React, { useEffect, useRef, useState } from "react";

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Knob({
  value,
  min,
  max,
  step = 1,
  label,
  unit = "",
  onChange,
  disabled = false,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  // Convert value to rotation degrees (0-300 degrees)
  const getRotation = (val: number) => {
    const range = max - min;
    const percentage = (val - min) / range;
    return percentage * 300 - 150; // -150 to +150 degrees
  };

  const rotation = getRotation(value);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sensitivity = 0.5;
      const deltaY = (startY - e.clientY) * sensitivity;
      const range = max - min;
      const newValue = Math.min(
        max,
        Math.max(min, startValue + (deltaY / 100) * range)
      );
      onChange(Number(newValue.toFixed(2)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, startY, startValue, onChange]);

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className={`knob ${disabled ? "disabled" : ""}`}
        style={{ "--rotation": `${rotation}deg` } as React.CSSProperties}
        onMouseDown={handleMouseDown}
      />
      <div className="knob-label">{label}</div>
      <div className="knob-value">
        {value.toFixed(step >= 1 ? 0 : 2)}
        {unit}
      </div>
    </div>
  );
}
