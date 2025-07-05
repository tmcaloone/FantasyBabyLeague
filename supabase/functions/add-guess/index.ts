import { createClient } from 'npm:@supabase/supabase-js@2'

// Define the CORS headers to allow our website to call this function.
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
    // 1. Get the new guess data from the request body
    const { guesser_name, boy_name_guess, girl_name_guess } = await req.json()

    // Basic validation
    if (!guesser_name || !boy_name_guess || !girl_name_guess) {
      return new Response('Missing required guess fields', { status: 400, headers: corsHeaders })
    }

    // 2. Create an admin client to interact with the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Insert the new guess into the 'guesses' table
    const { error: insertError } = await supabaseAdmin
      .from('guesses')
      .insert({ guesser_name, boy_name_guess, girl_name_guess })

    if (insertError) {
      console.error('Error inserting guess:', insertError)
      return new Response('Could not save guess', { status: 500, headers: corsHeaders })
    }

    // 4. After successful insert, fetch the UPDATED list of all guesses
    const { data: allGuesses, error: fetchError } = await supabaseAdmin
      .from('guesses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      // The insert worked, but we couldn't get the new list.
      // Return an empty array so the frontend doesn't break.
      return new Response(JSON.stringify({ guesses: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 5. Return the complete, updated list of guesses
    return new Response(JSON.stringify({ guesses: allGuesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('Fatal error in add-guess function:', e)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})