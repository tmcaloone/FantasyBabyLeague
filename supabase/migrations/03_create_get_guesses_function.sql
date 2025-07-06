-- This function fetches all guesses, aggregates vote counts, and checks if the
-- current user has voted for each name. It is much more efficient than
-- doing multiple queries in an Edge Function.

CREATE OR REPLACE FUNCTION get_all_guesses_with_votes(current_user_id uuid)
RETURNS TABLE (
    id bigint,
    boy_name_guess text,
    girl_name_guess text,
    boy_votes_count bigint,
    girl_votes_count bigint,
    user_voted_for_boy boolean,
    user_voted_for_girl boolean
)
LANGUAGE sql
STABLE -- Indicates the function doesn't modify the database
AS $$
    SELECT
        g.id,
        g.boy_name_guess,
        g.girl_name_guess,
        -- Count boy votes for this guess
        COUNT(v.id) FILTER (WHERE v.voted_for = 'boy') AS boy_votes_count,
        -- Count girl votes for this guess
        COUNT(v.id) FILTER (WHERE v.voted_for = 'girl') AS girl_votes_count,
        -- Check if the *specific user* has voted for this boy name
        COALESCE(bool_or(v.voted_for = 'boy' AND v.user_id = current_user_id), false) AS user_voted_for_boy,
        -- Check if the *specific user* has voted for this girl name
        COALESCE(bool_or(v.voted_for = 'girl' AND v.user_id = current_user_id), false) AS user_voted_for_girl
    FROM
        public.guesses g
    LEFT JOIN
        public.votes v ON g.id = v.guess_id
    GROUP BY
        g.id, g.created_at
    ORDER BY
        g.created_at DESC;
$$;