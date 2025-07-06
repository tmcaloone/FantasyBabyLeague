// NEW: Supabase Client Initialization
// This should be at the very top of your file.
const SUPABASE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co';
// IMPORTANT: Get this from your Supabase Dashboard: Settings -> API -> Project API keys -> anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zempqeG53cXdzdXp1YW9oaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDA3MTAsImV4cCI6MjA2NzMxNjcxMH0.YGq7N23qtdvTF-TRfYoUMCZfV3VOyDEBkAbn1PX0gFw'; // PASTE YOUR KEY HERE
const supabaseClient  = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- Element References (no changes) ---
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const boyGuessesList = document.getElementById('boy-guesses-list');
const girlGuessesList = document.getElementById('girl-guesses-list');

// --- Edge Function URLs ---
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';
const ADD_VOTE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-vote';


// --- Function to unlock the app ---
const unlockApp = async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    errorMessage.textContent = '';
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';

    try {
        // 1. Sign in anonymously using our new client instance
        const { error: authError } = await supabaseClient.auth.signInAnonymously(); // FIXED
        if (authError) {
            throw new Error(`Anonymous sign-in failed: ${authError.message}`);
        }
        
        // 2. Get the session token
        const { data: { session } } = await supabaseClient.auth.getSession(); // FIXED
        if (!session) {
            throw new Error('Could not get user session. Please try again.');
        }
        const token = session.access_token;

        // 3. Call the get-guesses function
        const response = await fetch(GET_GUESSES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: password })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Invalid password');
        }

        const { guesses } = await response.json();
        passwordGate.style.display = 'none';
        mainApp.style.display = 'block';
        displayGuesses(guesses);

    } catch (error) {
        errorMessage.textContent = 'Incorrect password or auth error. Please try again.';
        console.error('Login failed:', error.message);
        button.disabled = false;
        button.textContent = 'Unlock';
        // If login fails, sign out
        await supabaseClient.auth.signOut(); // FIXED
    }
};

// --- displayGuesses function (no changes needed here) ---
const displayGuesses = (guesses) => {
    // ... (this function is correct)
};

// --- handleVote function ---
const handleVote = async (event) => {
    if (!event.target.matches('.vote-btn')) return;

    const button = event.target;
    const guessId = button.dataset.guessId;
    const voteType = button.dataset.type;

    button.disabled = true;
    button.textContent = '...';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession(); // FIXED
        if (!session) throw new Error('User not logged in');
        const token = session.access_token;
        
        const response = await fetch(ADD_VOTE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ guess_id: parseInt(guessId), vote_type: voteType })
        });
        
        if (!response.ok) throw new Error('Failed to save vote.');

        const { guesses } = await response.json();
        displayGuesses(guesses);

    } catch (error) {
        console.error('Vote failed:', error);
        alert('There was an error casting your vote.');
    }
};

// --- Function to add a guess ---
const addGuess = async (event) => {
    event.preventDefault();
    const button = guessForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Submitting...';

    const newGuess = {
        guesser_name: document.getElementById('guesser-name').value,
        boy_name_guess: document.getElementById('boy-name-guess').value,
        girl_name_guess: document.getElementById('girl-name-guess').value
    };

    try {
        // Get the session and token
        const { data: { session } } = await supabaseClient.auth.getSession(); // FIXED
        if (!session) throw new Error('User not logged in');
        const token = session.access_token;

        const response = await fetch(ADD_GUESS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newGuess)
        });
        if (!response.ok) {
            throw new Error('Server could not save the guess.');
        }
        const { guesses } = await response.json();
        displayGuesses(guesses);
        guessForm.reset();
    } catch (error) {
        alert('Sorry, there was an error submitting your guess.');
        console.error('Failed to add guess:', error);
    } finally {
        button.disabled = false;
        button.textContent = 'Submit Guesses';
    }
};

// --- Event Listeners (no changes needed here) ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess);
document.getElementById('guesses-container').addEventListener('click', handleVote);