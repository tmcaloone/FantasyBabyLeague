const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const boyGuessesList = document.getElementById('boy-guesses-list');   // New reference
const girlGuessesList = document.getElementById('girl-guesses-list'); // New reference

// URLs for our two Edge Functions (no changes here)
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';

// --- Function to unlock the app (no changes here) ---
const unlockApp = async (event) => {
    // ... (this function remains exactly the same)
    event.preventDefault();
    const password = passwordInput.value;
    errorMessage.textContent = '';
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';

    try {
        const response = await fetch(GET_GUESSES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        errorMessage.textContent = 'Incorrect password. Please try again.';
        console.error('Login failed:', error.message);
        button.disabled = false;
        button.textContent = 'Unlock';
    }
};

// === CHANGED: displayGuesses is updated for the new data structure ===
const displayGuesses = (guesses) => {
    boyGuessesList.innerHTML = '';
    girlGuessesList.innerHTML = '';

    if (!guesses || guesses.length === 0) {
        // ... (no change here)
        return;
    }

    guesses.forEach(guess => {
        // `guess` object now looks like:
        // { id: 1, boy_name_guess: 'John', girl_name_guess: 'Jane', 
        //   boy_votes_count: 5, girl_votes_count: 2,
        //   user_voted_for_boy: true, user_voted_for_girl: false }

        // Create Boy Guess Item
        const boyLi = document.createElement('li');
        boyLi.innerHTML = `
            <span>${guess.boy_name_guess}</span>
            <button class="vote-btn" data-guess-id="${guess.id}" data-type="boy" ${guess.user_voted_for_boy ? 'disabled' : ''}>
                👍 (${guess.boy_votes_count || 0})
            </button>
        `;
        boyGuessesList.appendChild(boyLi);

        // Create Girl Guess Item
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

// === CHANGED: handleVote sends the vote type ===
const handleVote = async (event) => {
    if (!event.target.matches('.vote-btn')) return;

    const button = event.target;
    const guessId = button.dataset.guessId;
    const voteType = button.dataset.type; // 'boy' or 'girl'

    button.disabled = true;
    button.textContent = '...';

    try {
        const session = await supabase.auth.getSession();
        const token = session.data.session.access_token;
        
        const response = await fetch(ADD_VOTE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                guess_id: parseInt(guessId), 
                vote_type: voteType // Send the type of vote
            })
        });
        
        if (!response.ok) throw new Error('Failed to save vote.');

        const { guesses } = await response.json();
        displayGuesses(guesses); // Re-render the list with fresh data

    } catch (error) {
        console.error('Vote failed:', error);
        alert('There was an error casting your vote.');
        // Don't re-enable the button to avoid confusion or double-clicks
    }
};

// --- Function to add a guess (no changes here) ---
const addGuess = async (event) => {
    // ... (this function remains exactly the same)
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
        const response = await fetch(ADD_GUESS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

// --- Event Listeners (no changes here) ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess);

document.getElementById('guesses-container').addEventListener('click', handleVote);