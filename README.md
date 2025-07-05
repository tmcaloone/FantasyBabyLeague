# Fantasy Baby League

A simple, private web app for friends and family to guess a baby's name. The app is password-protected and displays all guesses anonymously in separate columns for boy and girl names.

This project is built as a static site hosted on GitHub Pages, with a backend powered entirely by Supabase.

## Tech Stack

*   **Frontend**: HTML, CSS, JavaScript (no framework)
*   **Hosting**: GitHub Pages
*   **Backend**: Supabase
    *   **Database**: Supabase Postgres for storing guesses and configuration.
    *   **API**: Two Supabase Edge Functions act as a secure API layer.
    *   **Security**: A shared password, hashed with Bcrypt, is used to grant access.

## Features

*   Password-protected access for the friend group.
*   Form submission for a user's name and their boy/girl name guesses.
*   Real-time display of all submitted guesses.
*   Guesses are displayed anonymously to build suspense.
*   Responsive two-column layout for boy and girl names.

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
    *   When prompted for the database password, you can skip it by pressing Enter.

4.  **Set Up Secrets**
    *   The Edge Functions need secure access to your project's URL and a secret key.
    *   Go to your Supabase project's **Settings > API** page to find your **Project URL** and your `service_role` secret key.
    *   Run the following commands in your terminal, pasting your own values:
    ```bash
    # Set the public URL
    supabase secrets set SUPABASE_URL=YOUR_PROJECT_URL

    # Set the secret service role key (NEVER commit this key to Git)
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
    ```

5.  **Push the Database Schema**
    *   This command will read the migration files in the `supabase/migrations` directory and apply them to your live database, creating the `guesses` and `config` tables.
    ```bash
    supabase db push
    ```

6.  **Deploy the Edge Functions**
    *   This command bundles and deploys the two Edge Functions (`get-guesses` and `add-guess`) to your Supabase project. Make sure Docker is running before executing.
    ```bash
    supabase functions deploy
    ```

7.  **Manually Add the Access Password**
    *   The app requires a hashed password to be in the database.
    *   Go to an online [Bcrypt Generator](https://bcrypt-generator.com/).
    *   Enter the shared password you want to use (e.g., "BabySmith2024") and generate the hash.
    *   In your Supabase project, go to the **Table Editor**.
    *   Select the `config` table.
    *   Click **"Insert row"**.
    *   Leave the `id` blank and paste your generated hash into the `password_hash` column.
    *   Click **Save**.

### Frontend Setup

1.  **Update Function URLs**
    *   Open the `script.js` file.
    *   On lines 13 and 14, replace the placeholder `mszjjxnwqwsuzuaohhsm` with your own Supabase project's reference ID.

2.  **Deploy to GitHub Pages**
    *   Push your code to a GitHub repository.
    *   In the repository settings, go to the "Pages" section.
    *   Deploy from the `main` branch. Your site will be live in a few minutes.

Your Fantasy Baby League is now live!