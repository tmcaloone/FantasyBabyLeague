// In supabase/functions/add-vote/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Authentication error', { status: 401, headers: corsHeaders });
    }

    // 2. Get vote data from the request body
    const { guess_id, vote_type } = await req.json();
    if (!guess_id || !['boy', 'girl'].includes(vote_type)) {
      return new Response('Missing or invalid vote data', { status: 400, headers: corsHeaders });
    }

    // 3. Create an admin client to perform the insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Insert the vote
    // This will fail harmlessly if the user has already voted, due to the unique constraint.
    await supabaseAdmin
      .from('votes')
      .insert({ user_id: user.id, guess_id: guess_id, voted_for: vote_type });

    // 5. After voting, call our RPC function to get the fresh, complete state
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });
    
    if (rpcError) {
      console.error("Error fetching guesses after vote:", rpcError);
      // Return an empty list but with correct headers to prevent a new CORS error
      return new Response(JSON.stringify({ guesses: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. THE FIX: Return the updated list with the correct CORS headers
    return new Response(JSON.stringify({ guesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Fatal error in add-vote function:', e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
})