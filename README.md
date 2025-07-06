# Fantasy Baby League

A simple, private web app for friends and family to guess a baby's name and vote on their favorites. The app is password-protected and displays all guesses anonymously in separate columns for boy and girl names.

This project is built as a static site hosted on GitHub Pages, with a backend powered entirely by Supabase.

## Tech Stack

*   **Frontend**: HTML, CSS, JavaScript (no framework)
*   **Hosting**: GitHub Pages
*   **Backend**: Supabase
    *   **Database**: Supabase Postgres for storing guesses and configuration.
    *   **Authentication**: Supabase Anonymous Auth to provide persistent identities for voting without user signups.
    *   **API**: Three Supabase Edge Functions (`get-guesses`, `add-guess`, `add-vote`) act as a secure API layer.
    *   **Security**: A shared password, hashed with Bcrypt, is used to grant access.

## Features

*   Password-protected access for the friend group.
*   Form submission for a user's name and their boy/girl name guesses.
*   Real-time display of all submitted guesses.
*   Guesses are displayed anonymously to build suspense.
*   Responsive two-column layout for boy and girl names.
*   Anonymous voting system to 'like' favorite names, with vote counts displayed next to each name.

---

## Backend Setup (Supabase)

To get this project running with your own backend, you will need to set up a new Supabase project.

### Prerequisites

1.  A [Supabase Account](https://supabase.com) (free tier is sufficient).
2.  [Supabase CLI](https://supabase.com/docs/guides/cli) installed and configured.
3.  [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running (required by the CLI for deploying functions).

### Step-by-Step Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Create a Supabase Project**
    *   Go to [supabase.com](https://supabase.com) and create a new project.
    *   Keep your project's **Reference ID** and **Database Password** handy.

3.  **Link Your Local Project**
    *   In your terminal, link your local repository to your new Supabase project. Replace `YOUR_PROJECT_ID` with your actual project reference ID.
    ```bash
    supabase link --project-ref YOUR_PROJECT_ID
    ```

4.  **Set Up Secrets**
    *   The Edge Functions need secure access to your project's URL and secret keys.
    *   Go to your Supabase project's **Settings > API** page to find your **Project URL**, your `service_role` key, and your `anon` `public` key.
    *   Run the following commands in your terminal, pasting your own values:
    ```bash
    # Set the public URL
    supabase secrets set SUPABASE_URL=YOUR_PROJECT_URL

    # Set the secret service role key (NEVER commit this key to Git)
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

    # Set the public anonymous key
    supabase secrets set SUPABASE_ANON_KEY=YOUR_PROJECT_ANON_KEY
    ```

5.  **Enable Anonymous Authentication**
    * In your Supabase project dashboard, go to **Authentication** -> **Providers**.
    * Find the **Anonymous** provider, expand it, and click the toggle to enable it.

6.  **Push the Database Schema**
    *   This command will read the migration files in the `supabase/migrations` directory and apply them to your live database. This creates the `guesses`, `config`, and `votes` tables, as well as a helper function for querying votes.
    ```bash
    supabase db push
    ```

7.  **Deploy the Edge Functions**
    *   This command bundles and deploys the three Edge Functions (`get-guesses`, `add-guess`, and `add-vote`) to your Supabase project. Make sure Docker is running.
    ```bash
    supabase functions deploy
    ```

8.  **Manually Add the Access Password**
    *   The app requires a hashed password to be in the database.
    *   Go to an online [Bcrypt Generator](https://bcrypt-generator.com/).
    *   Enter the shared password you want to use (e.g., "BabySmith2024") and generate the hash.
    *   In your Supabase project, go to the **Table Editor**.
    *   Select the `config` table and click **"Insert row"**.
    *   Leave the `id` blank and paste your generated hash into the `password_hash` column.
    *   Click **Save**.

### Frontend Setup

1.  **Update Supabase Client Keys**
    *   Open the `script.js` file.
    *   At the top of the file, replace the placeholder values for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your own. You can get these from your Supabase project's **Settings > API** page.

2.  **Deploy to GitHub Pages**
    *   Push your code to a GitHub repository.
    *   In the repository settings, go to the "Pages" section.
    *   Deploy from your main branch. Your site will be live in a few minutes.

Your Fantasy Baby League is now live!