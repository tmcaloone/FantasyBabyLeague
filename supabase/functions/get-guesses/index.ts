import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'

// Define the CORS headers. This allows our website to call the function.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This is the main function that will be executed
Deno.serve(async (req) => {
  // This is a preflight request. We don't need to do anything
  // other than return the CORS headers to the browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { password } = await req.json()
    if (!password) {
      return new Response('Password is required', { status: 400, headers: corsHeaders })
    }

    // Create a Supabase admin client. This uses environment variables for security.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch the stored password hash from your 'config' table
    const { data: config, error: configError } = await supabaseAdmin
      .from('config')
      .select('password_hash')
      .limit(1)
      .single()

    if (configError || !config) {
      console.error('Server config error:', configError)
      return new Response('Server configuration error', { status: 500, headers: corsHeaders })
    }

    // Compare the submitted password with the stored hash
    const passwordsMatch = await bcrypt.compare(password, config.password_hash)

    if (!passwordsMatch) {
      return new Response('Invalid password', { status: 401, headers: corsHeaders })
    }

    // If passwords match, fetch the actual baby guesses
    const { data: guesses, error: guessesError } = await supabaseAdmin
      .from('guesses')
      .select('*')
      .order('created_at', { ascending: false })

    if (guessesError) {
      console.error('Error fetching guesses:', guessesError)
      return new Response('Could not fetch guesses', { status: 500, headers: corsHeaders })
    }

    // Return the guesses to the client, WITH CORS headers
    return new Response(
      JSON.stringify({ guesses }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error(e)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})