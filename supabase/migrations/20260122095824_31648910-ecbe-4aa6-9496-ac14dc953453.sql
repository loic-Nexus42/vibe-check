-- Create votes table for Vibe Meter
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vibe TEXT NOT NULL CHECK (vibe IN ('fire', 'meh', 'sleep')),
  event_id TEXT NOT NULL DEFAULT 'default'
);

-- Create index for faster queries by event_id
CREATE INDEX idx_votes_event_id ON public.votes(event_id);

-- Enable Row Level Security
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can vote)
CREATE POLICY "Anyone can insert votes"
ON public.votes
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous reads (for counting votes)
CREATE POLICY "Anyone can read votes"
ON public.votes
FOR SELECT
TO anon
USING (true);

-- Enable realtime for votes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;