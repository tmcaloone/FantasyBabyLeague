import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = { /* ... */ };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    // 1. Get user from token
    const supabaseClient = createClient( /* ... client init with user auth ... */ );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { return new Response('Authentication error', { status: 401, headers: corsHeaders }) }

    // 2. Get vote data from request body
    const { guess_id, vote_type } = await req.json();
    if (!guess_id || !['boy', 'girl'].includes(vote_type)) {
        return new Response('Missing or invalid vote data', { status: 400, headers: corsHeaders });
    }

    // 3. Create ADMIN client to perform the insert
    const supabaseAdmin = createClient( /* ... admin client init ... */ );

    // 4. Insert the vote with the correct type
    const { error: insertError } = await supabaseAdmin
      .from('votes')
      .insert({ user_id: user.id, guess_id: guess_id, voted_for: vote_type });
      
    // Ignore unique constraint violation (user clicking an already-voted button)
    if (insertError && insertError.code !== '23505') {
        console.error('Vote insert error:', insertError);
        return new Response('Could not save vote', { status: 500, headers: corsHeaders });
    }

    // 5. After voting, call our RPC function to get the fresh, complete state
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });
    
    if (rpcError) { throw rpcError; }

    // 6. Return the updated list to the frontend
    return new Response(JSON.stringify({ guesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Fatal error in add-vote function:', e)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});