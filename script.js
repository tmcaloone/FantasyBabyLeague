// 1. Set up your Supabase client
const SUPABASE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co'; // Get this from your Supabase Project Settings -> API
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zempqeG53cXdzdXp1YW9oaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDA3MTAsImV4cCI6MjA2NzMxNjcxMH0.YGq7N23qtdvTF-TRfYoUMCZfV3VOyDEBkAbn1PX0gFw'; // Get this from your Supabase Project Settings -> API

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Get references to your HTML elements
const form = document.getElementById('guess-form');
const guessesList = document.getElementById('guesses-list');

// 3. Function to fetch and display guesses
const fetchGuesses = async () => {
    // Fetch data from the 'guesses' table
    const { data, error } = await supabase
        .from('guesses')
        .select('*')
        .order('created_at', { ascending: false }); // Show newest first

    if (error) {
        console.error('Error fetching guesses:', error);
        return;
    }

    // Clear the list and display the new data
    guessesList.innerHTML = '';
    data.forEach(guess => {
        const li = document.createElement('li');
        li.textContent = `${guess.baby_name_guess} (guessed by ${guess.guesser_name})`;
        guessesList.appendChild(li);
    });
};

// 4. Function to handle form submission
const addGuess = async (event) => {
    event.preventDefault(); // Prevent the form from reloading the page

    const guesserName = document.getElementById('guesser-name').value;
    const babyName = document.getElementById('baby-name').value;

    // Insert the new guess into the 'guesses' table
    const { error } = await supabase
        .from('guesses')
        .insert([{ guesser_name: guesserName, baby_name_guess: babyName }]);
    
    if (error) {
        console.error('Error adding guess:', error);
        alert('Could not submit your guess. Please try again.');
    } else {
        // Clear the form and refresh the list of guesses
        form.reset();
        await fetchGuesses();
    }
};

// 5. Add event listeners
form.addEventListener('submit', addGuess);
// Fetch guesses when the page first loads
document.addEventListener('DOMContentLoaded', fetchGuesses);