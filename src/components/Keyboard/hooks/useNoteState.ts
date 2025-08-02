import { useState, useCallback } from "react";

export function useNoteState() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isStickyKeys, setIsStickyKeys] = useState(false);
  const [stickyNote, setStickyNote] = useState<string | null>(null);
  const [mousePressedNote, setMousePressedNote] = useState<string | null>(null);

  const handleKeyPress = useCallback(
    (note: string, onKeyClick: (note: string) => void) => {
      if (isStickyKeys) {
        if (stickyNote === note) {
          setStickyNote(null);
          setActiveNotes((prev) => {
            const next = new Set(prev);
            next.delete(note);
            return next;
          });
          onKeyClick("");
        } else {
          if (stickyNote) {
            setActiveNotes((prev) => {
              const next = new Set(prev);
              next.delete(stickyNote);
              next.add(note);
              return next;
            });
          } else {
            setActiveNotes((prev) => {
              const next = new Set(prev);
              next.add(note);
              return next;
            });
          }
          setStickyNote(note);
          onKeyClick(note);
        }
      } else {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.add(note);
          return next;
        });
        onKeyClick(note);
      }
    },
    [isStickyKeys, stickyNote]
  );

  const handleKeyRelease = useCallback(
    (note: string, key: string, onStopArpeggiator: () => void) => {
      if (!isStickyKeys) {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(note);
          return next;
        });
        onStopArpeggiator();
      }
    },
    [isStickyKeys]
  );

  const handleMouseDown = useCallback(
    (note: string, onKeyClick: (note: string) => void) => {
      setMousePressedNote(note);
      onKeyClick(note);
    },
    []
  );

  const handleMouseUp = useCallback(
    (onKeyClick: (note: string) => void) => {
      if (mousePressedNote) {
        onKeyClick("");
        setMousePressedNote(null);
      }
    },
    [mousePressedNote]
  );

  const handleMouseDownDirect = useCallback(
    (
      note: string,
      onKeyClick: (note: string) => void,
      onStopArpeggiator: () => void
    ) => {
      setMousePressedNote(note);
      if (isStickyKeys) {
        if (stickyNote === note) {
          setStickyNote(null);
          onStopArpeggiator();
        } else {
          setStickyNote(note);
          onKeyClick(note);
        }
      } else {
        onKeyClick(note);
      }
    },
    [isStickyKeys, stickyNote]
  );

  const handleMouseUpDirect = useCallback(
    (onStopArpeggiator: () => void) => {
      if (mousePressedNote && !isStickyKeys) {
        onStopArpeggiator();
      }
      setMousePressedNote(null);
    },
    [mousePressedNote, isStickyKeys]
  );

  const handleGlobalMouseUp = useCallback(
    (onKeyClick: (note: string) => void) => {
      if (mousePressedNote) {
        onKeyClick("");
        setMousePressedNote(null);
      }
    },
    [mousePressedNote]
  );

  const toggleStickyKeys = useCallback((checked: boolean) => {
    setIsStickyKeys(checked);
    if (!checked) {
      setStickyNote(null);
    }
  }, []);

  const clearNoteState = useCallback(() => {
    setActiveNotes(new Set());
    setStickyNote(null);
    setMousePressedNote(null);
  }, []);

  return {
    activeNotes,
    isStickyKeys,
    stickyNote,
    mousePressedNote,
    handleKeyPress,
    handleKeyRelease,
    handleMouseDown,
    handleMouseUp,
    handleMouseDownDirect,
    handleMouseUpDirect,
    handleGlobalMouseUp,
    toggleStickyKeys,
    clearNoteState,
  };
}
