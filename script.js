// =================================================================================
// Fantasy Baby League - Final Script
// =================================================================================

// --- Client Initialization ---
const SUPABASE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co';
// IMPORTANT: Paste your ANON KEY here. You can find it in your Supabase Dashboard:
// Settings -> API -> Project API keys -> anon public
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Element References ---
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const boyGuessesList = document.getElementById('boy-guesses-list');
const girlGuessesList = document.getElementById('girl-guesses-list');
const guessesContainer = document.getElementById('guesses-container');

// --- Edge Function URLs ---
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';
const ADD_VOTE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-vote';

// --- Main Display Function ---
const displayGuesses = (guesses) => {
    // Clear both lists before populating
    boyGuessesList.innerHTML = '';
    girlGuessesList.innerHTML = '';

    if (!guesses || guesses.length === 0) {
        boyGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        girlGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        return;
    }

    guesses.forEach((guess) => {
        // Create list item for the boy's name
        const boyLi = document.createElement('li');
        boyLi.innerHTML = `
            <span>${guess.boy_name_guess}</span>
            <button class="vote-btn" data-guess-id="${guess.id}" data-type="boy" ${guess.user_voted_for_boy ? 'disabled' : ''}>
                👍 (${guess.boy_votes_count || 0})
            </button>
        `;
        boyGuessesList.appendChild(boyLi);

        // Create list item for the girl's name
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

// --- API Call & Logic Functions ---
const unlockApp = async (event) => {
    event.preventDefault();
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';
    errorMessage.textContent = '';

    try {
        const { error: authError } = await supabaseClient.auth.signInAnonymously();
        if (authError) throw new Error(`Anonymous sign-in failed: ${authError.message}`);

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('Could not get user session.');

        const response = await fetch(GET_GUESSES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ password: passwordInput.value })
        });

        if (!response.ok) throw new Error(await response.text() || 'Invalid password');

        const data = await response.json();
        passwordGate.style.display = 'none';
        mainApp.style.display = 'block';
        displayGuesses(data.guesses);
    } catch (error) {
        console.error('Login failed:', error.message);
        errorMessage.textContent = 'Incorrect password or a server error occurred.';
        await supabaseClient.auth.signOut();
    } finally {
        button.disabled = false;
        button.textContent = 'Unlock';
    }
};

const addGuess = async (event) => {
    event.preventDefault();
    const button = guessForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Submitting...';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('User not logged in');
        
        const newGuess = {
            guesser_name: document.getElementById('guesser-name').value,
            boy_name_guess: document.getElementById('boy-name-guess').value,
            girl_name_guess: document.getElementById('girl-name-guess').value
        };
        
        const response = await fetch(ADD_GUESS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify(newGuess)
        });

        if (!response.ok) throw new Error('Server could not save the guess.');
        
        const data = await response.json();
        displayGuesses(data.guesses);
        guessForm.reset();
    } catch (error) {
        console.error('Failed to add guess:', error);
        alert('Sorry, there was an error submitting your guess.');
    } finally {
        button.disabled = false;
        button.textContent = 'Submit Guesses';
    }
};

const handleVote = async (event) => {
    if (!event.target.matches('.vote-btn')) return;

    const button = event.target;
    button.disabled = true;
    button.textContent = '...';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('User not logged in');

        const response = await fetch(ADD_VOTE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
                guess_id: parseInt(button.dataset.guessId),
                vote_type: button.dataset.type
            })
        });

        if (!response.ok) throw new Error('Failed to save vote.');

        const data = await response.json();
        displayGuesses(data.guesses);
    } catch (error) {
        console.error('Vote failed:', error);
        alert('There was an error casting your vote.');
    }
};

// --- Event Listeners ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess);
guessesContainer.addEventListener('click', handleVote);