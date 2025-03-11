import { Play, Square, Settings } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  onPlayClick: () => void;
}

export function Controls({ isPlaying, onPlayClick }: ControlsProps) {
  return (
    <div className="controls">
      <button className="button" onClick={onPlayClick}>
        {isPlaying ? <Square size={20} /> : <Play size={20} />}
        {isPlaying ? " Stop" : " Play"}
      </button>

      <button className="button">
        <Settings size={20} />
        Settings
      </button>
    </div>
  );
}
