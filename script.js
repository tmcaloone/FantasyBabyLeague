// NEW: Supabase Client Initialization
// This should be at the very top of your file.
const SUPABASE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co';
// IMPORTANT: Get this from your Supabase Dashboard: Settings -> API -> Project API keys -> anon public
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // PASTE YOUR KEY HERE
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
// CHANGED: Added the new add-vote URL
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';
const ADD_VOTE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-vote';


// --- Function to unlock the app ---
// CHANGED: This function now handles anonymous sign-in and passes the auth token.
const unlockApp = async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    errorMessage.textContent = '';
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';

    try {
        // 1. Sign in anonymously to get a user session and JWT
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            throw new Error(`Anonymous sign-in failed: ${authError.message}`);
        }
        
        // 2. Get the session token to pass to our secure function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error('Could not get user session. Please try again.');
        }
        const token = session.access_token;

        // 3. Call the get-guesses function with the password AND the auth token
        const response = await fetch(GET_GUESSES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Pass the auth token!
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
        // If login fails, sign out the anonymous user to be clean
        await supabase.auth.signOut();
    }
};

// --- displayGuesses function (already correct) ---
const displayGuesses = (guesses) => {
    boyGuessesList.innerHTML = '';
    girlGuessesList.innerHTML = '';

    if (!guesses || guesses.length === 0) {
        boyGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        girlGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        return;
    }

    guesses.forEach(guess => {
        const boyLi = document.createElement('li');
        boyLi.innerHTML = `
            <span>${guess.boy_name_guess}</span>
            <button class="vote-btn" data-guess-id="${guess.id}" data-type="boy" ${guess.user_voted_for_boy ? 'disabled' : ''}>
                👍 (${guess.boy_votes_count || 0})
            </button>
        `;
        boyGuessesList.appendChild(boyLi);

        const girlLi = document.createElement('li');
        girlLi.innerHTML = `
            <span>${guess.girl_name_guess}</span>
            <button class="vote-btn" data-guess-id="${guess.id}" data-type="girl" ${guess.user_voted_for_girl ? 'disabled' : ''}>
                👍 (${guess.girl_votes_count || 0})
            </button>
        `;
        girlGuessesList.appendChild(girlLi);
    });
};

// --- handleVote function (already correct) ---
const handleVote = async (event) => {
    if (!event.target.matches('.vote-btn')) return;

    const button = event.target;
    const guessId = button.dataset.guessId;
    const voteType = button.dataset.type;

    button.disabled = true;
    button.textContent = '...';

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not logged in');
        const token = session.access_token;
        
        const response = await fetch(ADD_VOTE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                guess_id: parseInt(guessId), 
                vote_type: voteType
            })
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
// CHANGED: This function now requires and passes the auth token.
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
        // NEW: Get the session and token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not logged in');
        const token = session.access_token;

        const response = await fetch(ADD_GUESS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // NEW: Pass the token
            },
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

// --- Event Listeners (no changes) ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess);
document.getElementById('guesses-container').addEventListener('click', handleVote);