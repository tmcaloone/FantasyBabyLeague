// Get references to all the elements
const passwordGate = document.getElementById('password-gate');
const mainApp = document.getElementById('main-app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const errorMessage = document.getElementById('error-message');
const guessForm = document.getElementById('guess-form');
const guessesList = document.getElementById('guesses-list');

// The URL for your DEPLOYED Edge Function
const EDGE_FUNCTION_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';

// Function to unlock the app by calling the Edge Function
const unlockApp = async (event) => {
    event.preventDefault(); // Prevent the form from reloading the page
    const password = passwordInput.value;
    errorMessage.textContent = '';
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });

        if (!response.ok) {
            // Get error message from the Edge Function's response
            const errorText = await response.text();
            throw new Error(errorText || 'Invalid password');
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
        button.disabled = false;
        button.textContent = 'Unlock';
    }
};

// Function to render the list of guesses
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

// Add event listener for the password form
passwordForm.addEventListener('submit', unlockApp);

// NOTE: We still need to create a function to handle submitting a NEW guess.
// That would require another Edge Function.