import { useState, useEffect, useCallback } from "react";
import { PolySynth, Synth, context, start } from "tone";

export function useInstrument(instrumentType: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<PolySynth | null>(null);
  const [currentInstrumentType, setCurrentInstrumentType] =
    useState(instrumentType);

  useEffect(() => {
    if (currentInstrumentType !== instrumentType) {
      setCurrentInstrumentType(instrumentType);
      setIsLoaded(false);
    }
  }, [instrumentType, currentInstrumentType]);

  const initializeInstrument = useCallback(async () => {
    try {
      if (instrument) {
        instrument.dispose();
      }

      const currentInstrument = new PolySynth(Synth, {
        oscillator: {
          type: "triangle",
        },
      }).toDestination();

      setIsLoaded(true);
      setInstrument(currentInstrument);

      await start();
    } catch (e) {
      console.error("Error initializing instrument:", e);
      setIsLoaded(true);
    }
  }, [instrument]);

  useEffect(() => {
    if (!instrument || currentInstrumentType !== instrumentType) {
      initializeInstrument();
    }

    return () => {
      if (currentInstrumentType !== instrumentType && instrument) {
        instrument.dispose();
      }
    };
  }, [instrumentType, currentInstrumentType, instrument, initializeInstrument]);

  const playNote = useCallback(
    async (note: string) => {
      if (instrument && isLoaded) {
        try {
          if (context.state !== "running") {
            await start();
          }
          instrument.triggerAttackRelease(note, "4n");
        } catch (e) {
          console.error("Error playing note:", e);
          setTimeout(() => {
            setIsLoaded(true);
          }, 3000);
        }
      }
    },
    [instrument, isLoaded]
  );

  return {
    instrument,
    isLoaded,
    playNote,
  };
}
