import { useRef, useCallback, useEffect, useState } from "react";
import { VibeButton } from "@/components/VibeButton";
import { VoteCounter } from "@/components/VoteCounter";
import { PhysicsVoteCanvasWithRef, PhysicsVoteCanvasHandle } from "@/components/PhysicsVoteCanvas";
import { useVibeMeter, VibeType } from "@/hooks/useVibeMeter";
import { useEventId } from "@/hooks/useEventId";
import { Sparkles } from "lucide-react";

const Index = () => {
  const eventId = useEventId();
  const physicsCanvasRef = useRef<PhysicsVoteCanvasHandle>(null);
  
  // Callback when new vote comes in via realtime
  const handleNewVote = useCallback((vibe: VibeType) => {
    physicsCanvasRef.current?.addEmoji(vibe);
  }, []);

  const { counts, isLoading, isVoting, error, lastVotedVibe, vote, fetchCounts } = useVibeMeter(eventId, {
    onNewVote: handleNewVote,
  });

  // Load initial emojis when counts are fetched
  useEffect(() => {
    if (!isLoading && physicsCanvasRef.current) {
      // Add existing votes as emojis with a staggered delay
      const allVibes: VibeType[] = [];
      for (let i = 0; i < Math.min(counts.fire, 30); i++) allVibes.push('fire');
      for (let i = 0; i < Math.min(counts.meh, 30); i++) allVibes.push('meh');
      for (let i = 0; i < Math.min(counts.sleep, 30); i++) allVibes.push('sleep');
      
      // Shuffle for natural look
      allVibes.sort(() => Math.random() - 0.5);
      
      physicsCanvasRef.current.addMultipleEmojis(allVibes);
    }
  }, [isLoading]); // Only run once when loading completes

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen min-h-[100dvh] px-6 py-8 safe-area-inset overflow-hidden">
      {/* Physics Canvas - Background layer */}
      <PhysicsVoteCanvasWithRef ref={physicsCanvasRef} />
      
      {/* Header */}
      <header className="text-center fade-in relative z-10">
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
      <main className="flex flex-col items-center gap-5 w-full max-w-sm my-8 fade-in relative z-10">
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

      {/* Shake Button */}
      <button
        onClick={() => physicsCanvasRef.current?.shake()}
        className="fixed bottom-24 right-4 z-20 p-3 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary active:scale-95 transition-all duration-150"
        aria-label="Secouer les emojis"
      >
        <Sparkles className="w-5 h-5" />
      </button>
      {/* Footer with Counter */}
      <footer className="w-full max-w-md space-y-3 relative z-10">
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
