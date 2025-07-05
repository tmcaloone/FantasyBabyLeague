// === CHANGED: Updated element references ===
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const boyGuessesList = document.getElementById('boy-guesses-list');   // New reference
const girlGuessesList = document.getElementById('girl-guesses-list'); // New reference
// === END OF CHANGES ===

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

// === CHANGED: displayGuesses function is completely rewritten ===
const displayGuesses = (guesses) => {
    // Clear both lists before populating
    boyGuessesList.innerHTML = '';
    girlGuessesList.innerHTML = '';

    if (!guesses || guesses.length === 0) {
        boyGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        girlGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        return;
    }

    // Loop through each guess object and add to the respective lists
    guesses.forEach(guess => {
        // Create list item for the boy's name
        const boyLi = document.createElement('li');
        boyLi.textContent = guess.boy_name_guess; // Anonymized - no guesser name
        boyGuessesList.appendChild(boyLi);

        // Create list item for the girl's name
        const girlLi = document.createElement('li');
        girlLi.textContent = guess.girl_name_guess; // Anonymized - no guesser name
        girlGuessesList.appendChild(girlLi);
    });
};
// === END OF CHANGES ===

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