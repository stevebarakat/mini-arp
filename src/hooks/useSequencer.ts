import { useEffect, useCallback, useRef } from "react";
import * as Tone from "tone";
import { NOTES, STEPS, transposeNote } from "../constants/sequencer";
import { transportMachine } from "../machines/transportMachine";
import { sequencerMachine } from "../machines/sequencerMachine";
import { useMachine } from "@xstate/react";
import { synthMachine } from "../machines/synthMachine";

export type Grid = boolean[][];

interface UseSequencerProps {
  onStepChange: (step: number) => void;
}

export function useSequencer({ onStepChange }: UseSequencerProps) {
  const [transportState, transportSend] = useMachine(transportMachine);
  const [sequencerState, sequencerSend] = useMachine(sequencerMachine);
  const { tempo } = transportState.context;
  const { grid, pitch, rootNote } = sequencerState.context;

  const [
    {
      context: { synth },
    },
  ] = useMachine(synthMachine);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // Cleanup function to safely dispose of sequence and reset transport
  const cleanupSequence = useCallback(() => {
    try {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
      }
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      if (synth) {
        synth.triggerRelease();
      }
      onStepChange(-1);
    } catch (error) {
      console.error("Error during sequence cleanup:", error);
    }
  }, [synth, onStepChange]);

  // Create or update sequence when grid changes
  useEffect(() => {
    if (!synth) return;

    // Dispose of previous sequence if it exists
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }

    const sequence = new Tone.Sequence(
      (time, step) => {
        grid.forEach((row, rowIndex) => {
          if (row[step]) {
            const baseNote = NOTES[rowIndex];
            // Get the root note without octave
            const rootNoteName = rootNote.slice(0, -1);
            const rootNoteOctave = parseInt(rootNote.slice(-1));
            const baseNoteName = baseNote.slice(0, -1);

            // Calculate semitones between root and base note
            const noteMap = [
              "C",
              "C#",
              "D",
              "D#",
              "E",
              "F",
              "F#",
              "G",
              "G#",
              "A",
              "A#",
              "B",
            ];
            const rootIndex = noteMap.indexOf(rootNoteName);
            const baseIndex = noteMap.indexOf(baseNoteName);
            let semitones = baseIndex - rootIndex;

            // Adjust for octave difference
            const baseNoteOctave = parseInt(baseNote.slice(-1));
            semitones += (baseNoteOctave - rootNoteOctave) * 12;

            // Create the final note by transposing from root
            const noteWithInterval = transposeNote(rootNote, semitones);
            const finalNote = transposeNote(noteWithInterval, pitch);

            synth.triggerAttackRelease(finalNote, "8n", time);
          }
        });
        onStepChange(step);
      },
      Array.from({ length: STEPS }, (_, i) => i),
      "8n"
    );

    sequenceRef.current = sequence;

    if (transportState.matches("playing")) {
      sequence.start();
    }

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
    };
  }, [grid, synth, transportState, onStepChange, pitch, rootNote]);

  const startPattern = useCallback(() => {
    if (!synth || !sequenceRef.current) return;

    try {
      Tone.Transport.bpm.value = tempo;
      Tone.Transport.position = 0;
      sequenceRef.current.start();
      Tone.Transport.start();
    } catch (error) {
      console.error("Error starting pattern:", error);
      cleanupSequence();
    }
  }, [synth, tempo, cleanupSequence]);

  const stopPattern = useCallback(() => {
    cleanupSequence();
  }, [cleanupSequence]);

  const togglePlayback = async () => {
    if (transportState.matches("playing")) {
      stopPattern();
      transportSend({ type: "STOP" });
    } else {
      try {
        await Tone.start();
        transportSend({ type: "PLAY" });
        startPattern();
      } catch (error) {
        console.error("Error toggling playback:", error);
        cleanupSequence();
        transportSend({ type: "STOP" });
      }
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

  const setRootNote = (note: string) => {
    sequencerSend({ type: "SET_ROOT_NOTE", note });
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
    setRootNote,
  };
}
