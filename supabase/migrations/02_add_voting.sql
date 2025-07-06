-- This new schema correctly allows separate voting for boy and girl names.

-- (Optional but good practice) Create a specific type for the vote
CREATE TYPE public.vote_type AS ENUM ('boy', 'girl');

-- Create the votes table with the new structure
CREATE TABLE public.votes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- The unique ID of the anonymous user who voted
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- The ID of the guess submission row
    guess_id bigint NOT NULL REFERENCES public.guesses(id) ON DELETE CASCADE,

    -- The type of name being voted for ('boy' or 'girl')
    voted_for vote_type NOT NULL,
    
    -- A user can only vote ONCE for a specific name in a specific submission.
    -- e.g., User A can vote for guess #5's boy name, and also for guess #5's girl name.
    -- But they cannot vote for guess #5's boy name twice.
    CONSTRAINT user_can_only_vote_once_per_name UNIQUE (user_id, guess_id, voted_for)
);

-- Enable Row Level Security (RLS) on the new table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own votes.
-- The check `auth.uid() = user_id` ensures a user can't vote on behalf of someone else.
CREATE POLICY "Users can insert their own votes"
ON public.votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Everyone can read all votes.
CREATE POLICY "Anyone can read vote data"
ON public.votes
FOR SELECT USING (true);