import { useState, useEffect, useCallback, useRef } from "react";
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
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    const newSynth = new Tone.Synth(SYNTH_CONFIG).toDestination();
    setSynth(newSynth);

    return () => {
      newSynth.dispose();
    };
  }, []);

  // Clean up sequence on unmount
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  }, []);

  // Create or update sequence when grid changes
  useEffect(() => {
    if (!synth) return; // Only check for synth, remove isPlaying check

    // Dispose of previous sequence if it exists
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

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

    sequenceRef.current = sequence;

    // Only start if we're playing
    if (isPlaying) {
      sequence.start(0);
    }

    return () => {
      sequence.dispose();
    };
  }, [grid, synth, isPlaying, onStepChange]);

  const startPattern = useCallback(() => {
    if (!synth || !sequenceRef.current) return;

    Tone.Transport.bpm.value = tempo;
    sequenceRef.current.start(0);
    Tone.Transport.start();
  }, [synth, tempo]);

  const togglePlayback = async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
      onStepChange(-1);
    } else {
      await Tone.start();
      setIsPlaying(true);
      startPattern();
    }
  };

  const toggleCell = (rowIndex: number, colIndex: number) => {
    setGrid((grid) =>
      grid.map((row, r) =>
        row.map((cell, c) => {
          if (c === colIndex) {
            // If this is the clicked cell, toggle it
            if (r === rowIndex) {
              return !cell;
            }
            // If this is any other cell in the same column, deselect it
            return false;
          }
          // Keep other cells unchanged
          return cell;
        })
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
