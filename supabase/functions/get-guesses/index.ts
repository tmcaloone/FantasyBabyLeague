import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'

const corsHeaders = { /* ... */ };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }

  try {
    // 1. Authenticate user via JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { return new Response('Authentication error', { status: 401, headers: corsHeaders }) }

    // 2. Check the shared password (business logic)
    const { password } = await req.json();
    const supabaseAdmin = createClient( /* ... admin client init ... */ );
    // ... (rest of password checking logic is the same) ...
    if (!passwordsMatch) { return new Response('Invalid password', { status: 401, headers: corsHeaders }) }

    // 3. If password is valid, call our new Postgres function!
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });

    if (rpcError) {
      console.error('Error calling RPC function:', rpcError);
      return new Response('Could not fetch guesses', { status: 500, headers: corsHeaders });
    }

    // 4. Return the data directly. It's already in the perfect format for the frontend.
    return new Response(
      JSON.stringify({ guesses }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    console.error(e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});