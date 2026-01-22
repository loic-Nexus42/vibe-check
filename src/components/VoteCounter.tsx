interface VoteCounterProps {
  fireCount: number;
  mehCount: number;
  sleepCount: number;
}

export function VoteCounter({ fireCount, mehCount, sleepCount }: VoteCounterProps) {
  return (
    <div className="counter-bar fade-in">
      <div className="counter-item">
        <span role="img" aria-label="On fire votes">🔥</span>
        <span className="text-vibe-fire font-bold tabular-nums">{fireCount}</span>
      </div>
      <div className="counter-item">
        <span role="img" aria-label="Meh votes">😐</span>
        <span className="text-vibe-meh font-bold tabular-nums">{mehCount}</span>
      </div>
      <div className="counter-item">
        <span role="img" aria-label="Sleep votes">😴</span>
        <span className="text-vibe-sleep font-bold tabular-nums">{sleepCount}</span>
      </div>
    </div>
  );
}
