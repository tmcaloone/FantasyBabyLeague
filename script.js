// 1. Set up your Supabase client
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Get this from your Supabase Project Settings -> API
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Get this from your Supabase Project Settings -> API

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Get references to your HTML elements
const form = document.getElementById('guess-form');
const guessesList = document.getElementById('guesses-list');

// 3. Function to fetch and display guesses
const fetchGuesses = async () => {
    const { data, error } = await supabase
        .from('guesses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching guesses:', error);
        return;
    }

    guessesList.innerHTML = '';
    data.forEach(guess => {
        const li = document.createElement('li');
        // === CHANGED: Updated display to show both guesses ===
        li.innerHTML = `
            <strong>${guess.guesser_name}</strong> guessed:<br>
            Boy: ${guess.boy_name_guess} | Girl: ${guess.girl_name_guess}
        `;
        // === END OF CHANGES ===
        guessesList.appendChild(li);
    });
};

// 4. Function to handle form submission
const addGuess = async (event) => {
    event.preventDefault();

    const guesserName = document.getElementById('guesser-name').value;
    
    // === CHANGED: Get values from the two new input fields ===
    const boyNameGuess = document.getElementById('boy-name-guess').value;
    const girlNameGuess = document.getElementById('girl-name-guess').value;
    // === END OF CHANGES ===

    // === CHANGED: Insert object now matches your new table columns ===
    const { error } = await supabase
        .from('guesses')
        .insert([{ 
            guesser_name: guesserName, 
            boy_name_guess: boyNameGuess, 
            girl_name_guess: girlNameGuess 
        }]);
    // === END OF CHANGES ===
    
    if (error) {
        console.error('Error adding guess:', error);
        alert('Could not submit your guess. Please try again.');
    } else {
        form.reset();
        await fetchGuesses();
    }
};

// 5. Add event listeners
form.addEventListener('submit', addGuess);
document.addEventListener('DOMContentLoaded', fetchGuesses);