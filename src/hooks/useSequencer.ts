import { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone";
import {
  NOTES,
  STEPS,
  SYNTH_CONFIG,
  DEFAULT_PITCH_SHIFT,
  transposeNote,
} from "../constants/sequencer";
import { transportMachine } from "../machines/transportMachine";
import { useMachine } from "@xstate/react";

export type Grid = boolean[][];

interface UseSequencerProps {
  onStepChange: (step: number) => void;
}

export function useSequencer({ onStepChange }: UseSequencerProps) {
  const [state, send] = useMachine(transportMachine);
  const { tempo } = state.context;
  const [grid, setGrid] = useState<Grid>(() =>
    Array(NOTES.length)
      .fill(null)
      .map(() => Array(STEPS).fill(false))
  );
  const [synth, setSynth] = useState<Tone.Synth | null>(null);
  const [pitchShift, setPitchShift] = useState(DEFAULT_PITCH_SHIFT);
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
    if (!synth) return;

    // Dispose of previous sequence if it exists
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        grid.forEach((row, rowIndex) => {
          if (row[step]) {
            const baseNote = NOTES[rowIndex];
            const transposedNote = transposeNote(baseNote, pitchShift);
            synth.triggerAttackRelease(transposedNote, "8n", time);
          }
        });
        onStepChange(step);
      },
      Array.from({ length: STEPS }, (_, i) => i),
      "8n"
    );

    sequenceRef.current = sequence;

    if (state.matches("playing")) {
      sequence.start(0);
    }

    return () => {
      sequence.dispose();
    };
  }, [grid, synth, state, onStepChange, pitchShift]);

  const startPattern = useCallback(() => {
    if (!synth || !sequenceRef.current) return;

    Tone.getTransport().bpm.value = tempo;
    sequenceRef.current.start(0);
    Tone.getTransport().start();
  }, [synth, tempo]);

  const togglePlayback = async () => {
    if (state.matches("playing")) {
      Tone.getTransport().stop();
      send({ type: "STOP" });
      onStepChange(-1);
    } else {
      await Tone.start();
      send({ type: "PLAY" });
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
    send({ type: "UPDATE_TEMPO", tempo: newTempo });
  };

  const updatePitchShift = (newPitchShift: number) => {
    setPitchShift(newPitchShift);
  };

  return {
    state,
    grid,
    tempo,
    pitchShift,
    togglePlayback,
    toggleCell,
    updateTempo,
    updatePitchShift,
  };
}
