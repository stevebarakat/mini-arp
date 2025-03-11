import { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone";
import {
  NOTES,
  STEPS,
  SYNTH_CONFIG,
  transposeNote,
} from "../constants/sequencer";
import { transportMachine } from "../machines/transportMachine";
import { sequencerMachine } from "../machines/sequencerMachine";
import { useMachine } from "@xstate/react";

export type Grid = boolean[][];

interface UseSequencerProps {
  onStepChange: (step: number) => void;
}

export function useSequencer({ onStepChange }: UseSequencerProps) {
  const [transportState, transportSend] = useMachine(transportMachine);
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const { tempo } = transportState.context;
  const { grid, pitch } = sequencerState.context;

  const [synth, setSynth] = useState<Tone.Synth | null>(null);
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
            const transposedNote = transposeNote(baseNote, pitch);
            synth.triggerAttackRelease(transposedNote, "8n", time);
          }
        });
        onStepChange(step);
      },
      Array.from({ length: STEPS }, (_, i) => i),
      "8n"
    );

    sequenceRef.current = sequence;

    if (transportState.matches("playing")) {
      sequence.start(0);
    }

    return () => {
      sequence.dispose();
    };
  }, [grid, synth, transportState, onStepChange, pitch]);

  const startPattern = useCallback(() => {
    if (!synth || !sequenceRef.current) return;

    Tone.getTransport().bpm.value = tempo;
    sequenceRef.current.start(0);
    Tone.getTransport().start();
  }, [synth, tempo]);

  const togglePlayback = async () => {
    if (transportState.matches("playing")) {
      Tone.getTransport().stop();
      transportSend({ type: "STOP" });
      onStepChange(-1);
    } else {
      await Tone.start();
      transportSend({ type: "PLAY" });
      startPattern();
    }
  };

  const toggleCell = (rowIndex: number, colIndex: number) => {
    const newGrid = grid.map((row, r) =>
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
    );
    sequencerSend({ type: "SET_GRID", grid: newGrid });
  };

  const updateTempo = (newTempo: number) => {
    transportSend({ type: "UPDATE_TEMPO", tempo: newTempo });
  };

  const updatePitch = (newPitch: number) => {
    sequencerSend({ type: "UPDATE_PITCH", pitch: newPitch });
  };

  return {
    state: transportState,
    grid,
    tempo,
    pitch,
    togglePlayback,
    toggleCell,
    updateTempo,
    updatePitch,
  };
}
