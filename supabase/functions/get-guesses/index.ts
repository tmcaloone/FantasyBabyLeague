// In supabase/functions/get-guesses/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'
import bcrypt from 'npm:bcryptjs@2.4.3'

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
    // 1. Authenticate user via JWT from the client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Authentication error', { status: 401, headers: corsHeaders });
    }

    // 2. Get the password from the request body
    const { password } = await req.json();
    if (!password) {
      return new Response('Password is required', { status: 400, headers: corsHeaders });
    }

    // 3. Create a Supabase ADMIN client to access protected data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 4. Fetch the stored password hash from the 'config' table
    const { data: config, error: configError } = await supabaseAdmin
      .from('config')
      .select('password_hash')
      .limit(1)
      .single();

    if (configError || !config || !config.password_hash) {
      console.error('Server config error:', configError);
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    // 5. Compare the submitted password with the stored hash
    const passwordsMatch = await bcrypt.compare(password, config.password_hash);

    if (!passwordsMatch) {
      return new Response('Invalid password', { status: 401, headers: corsHeaders });
    }

    // 6. If password is valid, call our Postgres function to get all data
    const { data: guesses, error: rpcError } = await supabaseAdmin
      .rpc('get_all_guesses_with_votes', { current_user_id: user.id });

    if (rpcError) {
      console.error('Error calling RPC function:', rpcError);
      return new Response('Could not fetch guesses', { status: 500, headers: corsHeaders });
    }

    // 7. Return the data with correct headers
    return new Response(JSON.stringify({ guesses }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Fatal unhandled error:', e);
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
  }
});