import { useState, useEffect, useCallback } from "react";
import * as Tone from "tone";
import {
  NOTES,
  STEPS,
  SYNTH_CONFIG,
  DEFAULT_TEMPO,
} from "../constants/sequencer";

export type Grid = boolean[][];

interface UseSequencerProps {
  onStepChange: (step: number) => void;
}

export function useSequencer({ onStepChange }: UseSequencerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<Grid>(() =>
    Array(NOTES.length)
      .fill(null)
      .map(() => Array(STEPS).fill(false))
  );
  const [synth, setSynth] = useState<Tone.Synth | null>(null);
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);

  useEffect(() => {
    const newSynth = new Tone.Synth(SYNTH_CONFIG).toDestination();
    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, []);

  const startPattern = useCallback(() => {
    if (!synth) return;

    const sequence = new Tone.Sequence(
      (time, step) => {
        grid.forEach((row, rowIndex) => {
          if (row[step]) {
            synth.triggerAttackRelease(NOTES[rowIndex], "8n", time);
          }
        });
        onStepChange(step);
      },
      Array.from({ length: STEPS }, (_, i) => i),
      "8n"
    );

    Tone.Transport.bpm.value = tempo;
    sequence.start(0);
    Tone.Transport.start();

    return () => {
      sequence.stop();
      Tone.Transport.stop();
    };
  }, [grid, synth, tempo, onStepChange]);

  const togglePlayback = async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      onStepChange(-1);
    } else {
      await Tone.start();
      startPattern();
      setIsPlaying(true);
    }
  };

  const toggleCell = (rowIndex: number, colIndex: number) => {
    setGrid((grid) =>
      grid.map((row, r) =>
        row.map((cell, c) => (r === rowIndex && c === colIndex ? !cell : cell))
      )
    );
  };

  const updateTempo = (newTempo: number) => {
    setTempo(newTempo);
    Tone.Transport.bpm.value = newTempo;
  };

  return {
    isPlaying,
    grid,
    tempo,
    togglePlayback,
    toggleCell,
    updateTempo,
  };
}
