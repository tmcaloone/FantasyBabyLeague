// Get references to all the new elements
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');

// Get references for the main app
const guessForm = document.getElementById('guess-form');
const guessesList = document.getElementById('guesses-list');
const guesserNameInput = document.getElementById('guesser-name');
const boyNameInput = document.getElementById('boy-name-guess');
const girlNameInput = document.getElementById('girl-name-guess');

// The URL for your new Edge Function
const EDGE_FUNCTION_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
// No need for Supabase client or keys on the frontend anymore!

// Function to unlock the app
const unlockApp = async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    errorMessage.textContent = '';

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const { guesses } = await response.json();
        
        // Success! Hide the password gate and show the main app
        passwordGate.style.display = 'none';
        mainApp.style.display = 'block';

        // Display the initial list of guesses
        displayGuesses(guesses);

    } catch (error) {
        errorMessage.textContent = 'Incorrect password. Please try again.';
        console.error('Login failed:', error.message);
    }
};

// Function to display the list of guesses
const displayGuesses = (guesses) => {
    guessesList.innerHTML = '';
    if (guesses.length === 0) {
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

// Note: Submitting a new guess would now also require an Edge Function
// for full security, but for a friend group, this is a huge improvement.

// Add event listener for the password form
passwordForm.addEventListener('submit', unlockApp);