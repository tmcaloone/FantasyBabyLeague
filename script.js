// Get references to all the elements
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const guessesList = document.getElementById('guesses-list');

// URLs for our two Edge Functions
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';

// --- Function to unlock the app by calling the first Edge Function ---
const unlockApp = async (event) => {
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

// --- Function to display the list of guesses ---
const displayGuesses = (guesses) => {
    guessesList.innerHTML = '';
    if (!guesses || guesses.length === 0) {
        guessesList.innerHTML = '<li>No guesses yet. Be the first!</li>';
        return;
    }
    guesses.forEach(guess => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${guess.guesser_name}</strong> guessed:<br>
            Boy: ${guess.boy_name_guess} | Girl: ${guess.girl_name_guess}
        `;
        guessesList.appendChild(li);
    });
};

// === NEW: Function to add a guess by calling the second Edge Function ===
const addGuess = async (event) => {
    event.preventDefault(); // This is the crucial line that prevents the page from reloading!

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

        // The function returns the full updated list of guesses
        const { guesses } = await response.json();

        // Refresh the list on the page and reset the form
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
// === END OF NEW FUNCTION ===


// --- Event Listeners ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess); // === NEW: Add event listener for the guess form ===