// In supabase/functions/add-guess/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get user from token to know who is submitting
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Authentication error', { status: 401, headers: corsHeaders });
    }

    // 2. Get the new guess data from the request body
    const { guesser_name, boy_name_guess, girl_name_guess } = await req.json();
    if (!guesser_name || !boy_name_guess || !girl_name_guess) {
      return new Response('Missing required guess fields', { status: 400, headers: corsHeaders });
    }

    // 3. Create an ADMIN client to perform the insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Insert the new guess into the 'guesses' table
    const { error: insertError } = await supabaseAdmin
      .from('guesses')
      .insert({ guesser_name, boy_name_guess, girl_name_guess });

    if (insertError) {
      console.error('Error inserting guess:', insertError);
      return new Response('Could not save guess', { status: 500, headers: corsHeaders });
    }

    // 5. CORRECTED: After insert, call the RPC function to get the complete, formatted list
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });

    if (rpcError) {
      console.error('Error calling RPC function after insert:', rpcError);
      // Even if this fails, the insert worked. Return an empty array so the frontend doesn't break.
      return new Response(JSON.stringify({ guesses: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 6. Return the complete, updated list of guesses in the correct format
    return new Response(JSON.stringify({ guesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Fatal error in add-guess function:', e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
})