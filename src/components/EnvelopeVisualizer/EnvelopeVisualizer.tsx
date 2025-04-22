import React, { useEffect, useRef } from "react";
import styles from "./EnvelopeVisualizer.module.css";

type CurveType = "linear" | "exponential";

interface EnvelopeVisualizerProps {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve: CurveType;
  decayCurve: CurveType;
  releaseCurve: CurveType;
}

const EnvelopeVisualizer: React.FC<EnvelopeVisualizerProps> = ({
  attack,
  decay,
  sustain,
  release,
  attackCurve,
  decayCurve,
  releaseCurve,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawEnvelope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "hsl(220, 100%, 70%)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "hsla(220, 100%, 70%, 0.1)";

    const totalTime = attack + decay + release;
    const timeScale = (width - padding * 2) / totalTime;

    const points: { x: number; y: number }[] = [
      { x: padding, y: height - padding },
      { x: padding + attack * timeScale, y: padding },
      {
        x: padding + (attack + decay) * timeScale,
        y: height - padding - sustain * (height - padding * 2),
      },
      {
        x: padding + (attack + decay + release) * timeScale,
        y: height - padding,
      },
    ];

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    const drawCurvedLine = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      curve: CurveType
    ) => {
      if (curve === "exponential") {
        ctx.bezierCurveTo(
          start.x + (end.x - start.x) * 0.5,
          start.y,
          end.x,
          end.y,
          end.x,
          end.y
        );
      } else {
        ctx.lineTo(end.x, end.y);
      }
    };

    drawCurvedLine(points[0], points[1], attackCurve);
    drawCurvedLine(points[1], points[2], decayCurve);
    drawCurvedLine(points[2], points[3], releaseCurve);

    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "hsl(220, 100%, 90%)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    ctx.fillText("A", points[1].x, height - 5);
    ctx.fillText("D", points[2].x, height - 5);
    ctx.fillText("R", points[3].x, height - 5);
    ctx.fillText("S", width - 10, points[2].y);
  };

  useEffect(() => {
    drawEnvelope();
  }, [attack, decay, sustain, release, attackCurve, decayCurve, releaseCurve]);

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className={styles.canvas}
      />
    </div>
  );
};

export default EnvelopeVisualizer;
