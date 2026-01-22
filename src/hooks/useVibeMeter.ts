import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type VibeType = 'fire' | 'meh' | 'sleep';

interface VoteCounts {
  fire: number;
  meh: number;
  sleep: number;
}

export function useVibeMeter(eventId: string) {
  const [counts, setCounts] = useState<VoteCounts>({ fire: 0, meh: 0, sleep: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVotedVibe, setLastVotedVibe] = useState<VibeType | null>(null);

  // Fetch initial counts
  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('vibe')
        .eq('event_id', eventId);

      if (error) throw error;

      const newCounts: VoteCounts = { fire: 0, meh: 0, sleep: 0 };
      data?.forEach((vote) => {
        const vibe = vote.vibe as VibeType;
        if (vibe in newCounts) {
          newCounts[vibe]++;
        }
      });

      setCounts(newCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching counts:', err);
      setError('Failed to load votes');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Submit a vote
  const vote = useCallback(async (vibe: VibeType) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('votes')
        .insert({ vibe, event_id: eventId });

      if (error) throw error;

      // Show confirmation
      setLastVotedVibe(vibe);
      
      // Clear confirmation after 1.5s
      setTimeout(() => {
        setLastVotedVibe(null);
      }, 1500);
    } catch (err) {
      console.error('Error voting:', err);
      setError('Vote failed. Please try again.');
    } finally {
      setIsVoting(false);
    }
  }, [eventId, isVoting]);

  // Set up realtime subscription
  useEffect(() => {
    fetchCounts();

    const channel = supabase
      .channel(`votes-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const vibe = payload.new.vibe as VibeType;
          if (vibe in counts || ['fire', 'meh', 'sleep'].includes(vibe)) {
            setCounts((prev) => ({
              ...prev,
              [vibe]: prev[vibe] + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchCounts]);

  return {
    counts,
    isLoading,
    isVoting,
    error,
    lastVotedVibe,
    vote,
  };
}
