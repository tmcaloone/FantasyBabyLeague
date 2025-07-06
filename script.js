// =================================================================================
// Fantasy Baby League - Final Script
// =================================================================================

// --- Client Initialization ---
const SUPABASE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co';
// IMPORTANT: Paste your ANON KEY here. You can find it in your Supabase Dashboard:
// Settings -> API -> Project API keys -> anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zempqeG53cXdzdXp1YW9oaHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDA3MTAsImV4cCI6MjA2NzMxNjcxMH0.YGq7N23qtdvTF-TRfYoUMCZfV3VOyDEBkAbn1PX0gFw';
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
const wordcloudCanvas = document.getElementById('wordcloud-canvas'); // <-- NEW

// --- Edge Function URLs ---
const GET_GUESSES_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/get-guesses';
const ADD_GUESS_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-guess';
const ADD_VOTE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/add-vote';
const REMOVE_VOTE_URL = 'https://mszjjxnwqwsuzuaohhsm.supabase.co/functions/v1/remove-vote'; // <-- NEW

// --- Main Display Function ---
const displayGuesses = (guesses) => {
    // Clear both lists before populating
    boyGuessesList.innerHTML = '';
    girlGuessesList.innerHTML = '';

    if (!guesses || guesses.length === 0) {
        boyGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        girlGuessesList.innerHTML = '<li>(No guesses yet)</li>';
        // Clear the canvas if there are no guesses
        const ctx = wordcloudCanvas.getContext('2d');
        ctx.clearRect(0, 0, wordcloudCanvas.width, wordcloudCanvas.height);
        return;
    }

    // ====================== WORD CLOUD LOGIC ======================
    const generateWordCloud = (allGuesses) => {
        const wordVotes = {};

        // 1. Aggregate votes for each unique name (boy or girl)
        allGuesses.forEach(guess => {
            const boyName = guess.boy_name_guess.trim();
            const girlName = guess.girl_name_guess.trim();
            
            if (boyName) {
                wordVotes[boyName] = (wordVotes[boyName] || 0) + (guess.boy_votes_count || 0);
            }
            if (girlName) {
                wordVotes[girlName] = (wordVotes[girlName] || 0) + (guess.girl_votes_count || 0);
            }
        });

        // 2. Format data for the WordCloud2.js library: [['word', weight], ...]
        // We add 1 to the vote count to ensure names with 0 votes are still visible.
        const wordCloudData = Object.entries(wordVotes).map(([name, votes]) => [name, votes + 1]);

        if (wordCloudData.length === 0) return;

        // 3. Configure and draw the word cloud
        WordCloud(wordcloudCanvas, {
            list: wordCloudData,
            gridSize: Math.round(16 * wordcloudCanvas.width / 1024),
            weightFactor: 6, // Increase this number to make words bigger overall
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            color: 'random-dark',
            backgroundColor: '#fff', // Match your page background
            rotateRatio: 0.5, // 50% of words will be rotated
            minSize: 10 // Minimum font size
        });
    };
    generateWordCloud(guesses);
    // =============================================================


    // ====================== SORTING LOGIC ======================
    const boyData = guesses.map(g => ({
        id: g.id, name: g.boy_name_guess, votes: g.boy_votes_count || 0, voted: g.user_voted_for_boy,
    }));
    const girlData = guesses.map(g => ({
        id: g.id, name: g.girl_name_guess, votes: g.girl_votes_count || 0, voted: g.user_voted_for_girl,
    }));
    const sortFunction = (a, b) => {
        if (a.votes !== b.votes) return b.votes - a.votes;
        return a.name.localeCompare(b.name);
    };
    boyData.sort(sortFunction);
    girlData.sort(sortFunction);
    // =============================================================


    // ====================== RENDERING LOGIC ======================
    boyData.forEach((guess) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${guess.name}</span>
            <button class="vote-btn ${guess.voted ? 'voted' : ''}" data-guess-id="${guess.id}" data-type="boy" data-voted="${guess.voted}">
                👍 (${guess.votes})
            </button>`;
        boyGuessesList.appendChild(li);
    });

    girlData.forEach((guess) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${guess.name}</span>
            <button class="vote-btn ${guess.voted ? 'voted' : ''}" data-guess-id="${guess.id}" data-type="girl" data-voted="${guess.voted}">
                👍 (${guess.votes})
            </button>`;
        girlGuessesList.appendChild(li);
    });
    // =============================================================
};

// --- API Call & Logic Functions ---
const unlockApp = async (event) => {
    event.preventDefault();
    const button = passwordForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Unlocking...';
    errorMessage.textContent = '';

    try {
        let { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            const { data: signInData, error: authError } = await supabaseClient.auth.signInAnonymously();
            if (authError) throw new Error(`Anonymous sign-in failed: ${authError.message}`);
            session = signInData.session;
        }

        if (!session) throw new Error('Could not get or create a user session.');

        const response = await fetch(GET_GUESSES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ password: passwordInput.value })
        });

        if (!response.ok) {
            if (response.status === 401) await supabaseClient.auth.signOut();
            throw new Error(await response.text() || 'Invalid password');
        }

        const data = await response.json();
        passwordGate.style.display = 'none';
        mainApp.style.display = 'block';
        displayGuesses(data.guesses);
    } catch (error) {
        console.error('Login failed:', error.message);
        errorMessage.textContent = 'Incorrect password or a server error occurred.';
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

// MODIFIED TO HANDLE BOTH ADDING AND REMOVING VOTES
const handleVote = async (event) => {
    if (!event.target.matches('.vote-btn')) return;

    const button = event.target;
    const hasVoted = button.dataset.voted === 'true';
    
    // Temporarily disable button to prevent double-clicks
    button.disabled = true; 
    const originalText = button.innerHTML;
    button.textContent = '...';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('User not logged in');

        // Determine which URL to call based on whether the user has already voted
        const url = hasVoted ? REMOVE_VOTE_URL : ADD_VOTE_URL;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
                guess_id: parseInt(button.dataset.guessId),
                vote_type: button.dataset.type
            })
        });

        if (!response.ok) throw new Error('Failed to update vote.');

        const data = await response.json();
        // The displayGuesses function will re-enable the button implicitly by re-rendering it
        displayGuesses(data.guesses);

    } catch (error) {
        console.error('Vote failed:', error);
        alert('There was an error casting your vote.');
        // Restore button on error
        button.innerHTML = originalText;
        button.disabled = false;
    }
    // Note: We don't need a `finally` block because a successful call replaces the button entirely.
};

// --- Event Listeners ---
passwordForm.addEventListener('submit', unlockApp);
guessForm.addEventListener('submit', addGuess);
guessesContainer.addEventListener('click', handleVote);