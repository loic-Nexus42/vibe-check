import { cn } from "@/lib/utils";

type VibeType = 'fire' | 'meh' | 'sleep';

interface VibeButtonProps {
  vibe: VibeType;
  emoji: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  showConfirmation?: boolean;
}

const vibeStyles: Record<VibeType, string> = {
  fire: 'vibe-button-fire',
  meh: 'vibe-button-meh',
  sleep: 'vibe-button-sleep',
};

export function VibeButton({ 
  vibe, 
  emoji, 
  label, 
  onClick, 
  disabled = false,
  showConfirmation = false 
}: VibeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "vibe-button-base",
        vibeStyles[vibe],
        disabled && "opacity-70 cursor-not-allowed",
        showConfirmation && "pulse-success"
      )}
      aria-label={`Vote ${label}`}
    >
      <span className="emoji-large" role="img" aria-hidden="true">
        {showConfirmation ? "✓" : emoji}
      </span>
      <span className="text-white/90 font-medium">
        {showConfirmation ? "Merci !" : label}
      </span>
    </button>
  );
}
