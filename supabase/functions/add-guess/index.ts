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
    // 1. Authenticate the user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ message: 'Authentication error' }), { status: 401, headers: corsHeaders });
    }

    // 2. Get guess data and trim whitespace
    let { guesser_name, boy_name_guess, girl_name_guess } = await req.json();
    if (!guesser_name || !boy_name_guess || !girl_name_guess) {
      return new Response(JSON.stringify({ message: 'Missing required guess fields' }), { status: 400, headers: corsHeaders });
    }
    boy_name_guess = boy_name_guess.trim();
    girl_name_guess = girl_name_guess.trim();

    // 3. Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ================== NEW: DUPLICATE CHECK ==================
    // 4. Check if either name already exists in its respective category (case-insensitive)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('guesses')
      .select('boy_name_guess, girl_name_guess')
      .or(`boy_name_guess.ilike.${boy_name_guess},girl_name_guess.ilike.${girl_name_guess}`);

    if (checkError) {
      console.error('Error checking for duplicates:', checkError);
      return new Response(JSON.stringify({ message: 'Error checking for duplicates' }), { status: 500, headers: corsHeaders });
    }

    if (existing && existing.length > 0) {
      const isBoyDuplicate = existing.some(g => g.boy_name_guess.toLowerCase() === boy_name_guess.toLowerCase());
      const isGirlDuplicate = existing.some(g => g.girl_name_guess.toLowerCase() === girl_name_guess.toLowerCase());
      
      let errorMessage = '';
      if (isBoyDuplicate && isGirlDuplicate) {
        errorMessage = `The names "${boy_name_guess}" and "${girl_name_guess}" already exist in the lists.`;
      } else if (isBoyDuplicate) {
        errorMessage = `The boy name "${boy_name_guess}" already exists.`;
      } else if (isGirlDuplicate) {
        errorMessage = `The girl name "${girl_name_guess}" already exists.`;
      }

      if (errorMessage) {
        // Return a 409 Conflict status with a clear message
        return new Response(JSON.stringify({ message: errorMessage }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    // ==========================================================

    // 5. Insert the new guess if no duplicates were found
    const { error: insertError } = await supabaseAdmin
      .from('guesses')
      .insert({ guesser_name, boy_name_guess, girl_name_guess });

    if (insertError) {
      console.error('Error inserting guess:', insertError);
      return new Response(JSON.stringify({ message: 'Could not save guess' }), { status: 500, headers: corsHeaders });
    }

    // 6. Call the RPC function to get the fresh, formatted list
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });

    if (rpcError) {
      console.error('Error calling RPC function after insert:', rpcError);
      return new Response(JSON.stringify({ guesses: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 7. Return the updated list
    return new Response(JSON.stringify({ guesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Fatal error in add-guess function:', e);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
})