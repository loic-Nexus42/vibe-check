import { VibeButton } from "@/components/VibeButton";
import { VoteCounter } from "@/components/VoteCounter";
import { useVibeMeter } from "@/hooks/useVibeMeter";
import { useEventId } from "@/hooks/useEventId";

const Index = () => {
  const eventId = useEventId();
  const { counts, isLoading, isVoting, error, lastVotedVibe, vote } = useVibeMeter(eventId);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen min-h-[100dvh] px-6 py-8 safe-area-inset">
      {/* Header */}
      <header className="text-center fade-in">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">
          Vibe Meter
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Vote now
        </p>
        {eventId !== 'default' && (
          <p className="mt-1 text-sm text-muted-foreground/70 font-medium">
            {eventId}
          </p>
        )}
      </header>

      {/* Vote Buttons */}
      <main className="flex flex-col items-center gap-5 w-full max-w-sm my-8 fade-in">
        <VibeButton
          vibe="fire"
          emoji="🔥"
          label="On fire"
          onClick={() => vote('fire')}
          disabled={isVoting}
          showConfirmation={lastVotedVibe === 'fire'}
        />
        <VibeButton
          vibe="meh"
          emoji="😐"
          label="Moyen"
          onClick={() => vote('meh')}
          disabled={isVoting}
          showConfirmation={lastVotedVibe === 'meh'}
        />
        <VibeButton
          vibe="sleep"
          emoji="😴"
          label="Dodo"
          onClick={() => vote('sleep')}
          disabled={isVoting}
          showConfirmation={lastVotedVibe === 'sleep'}
        />
      </main>

      {/* Footer with Counter */}
      <footer className="w-full max-w-md space-y-3">
        {isLoading ? (
          <div className="counter-bar animate-pulse">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <VoteCounter
            fireCount={counts.fire}
            mehCount={counts.meh}
            sleepCount={counts.sleep}
          />
        )}
        
        {error && (
          <p className="text-center text-sm text-destructive fade-in">
            {error}
          </p>
        )}
      </footer>
    </div>
  );
};

export default Index;
