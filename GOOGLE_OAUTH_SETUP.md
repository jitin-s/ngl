# How to Enable Google Sign-Up & Login in Supabase 🚀

Your web application is already coded and ready for **Google One-Click Sign-In**! To enable it with your own Google credentials, follow these 3 simple steps:

---

### Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or click **New Project** and name it `nglcrush`).
3. In the left navigation, go to **APIs & Services** ➔ **OAuth consent screen**:
   - Choose **External** and click **Create**.
   - Enter **App name** (e.g. `nglcrush`).
   - Enter **User support email** and **Developer contact information**.
   - Click **Save and Continue** until finished.
4. Go to **APIs & Services** ➔ **Credentials**:
   - Click **+ CREATE CREDENTIALS** ➔ **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `nglcrush Web Client`.
   - Under **Authorized JavaScript origins**, add:
     - `http://localhost:3000`
     - `https://your-vercel-domain.vercel.app`
   - Under **Authorized redirect URIs**, add your Supabase callback URL:
     - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
     *(For example: `https://rxhbuidfsedbvkyellum.supabase.co/auth/v1/callback`)*
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret**.

---

### Step 2: Enable Google Provider in Supabase

1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/rxhbuidfsedbvkyellum).
2. In the left sidebar, click **Authentication** ➔ **Providers**.
3. Find **Google** in the list and expand it:
   - Toggle **Enable Google provider** to ON.
   - Paste your **Client ID** from Step 1.
   - Paste your **Client Secret** from Step 1.
   - Click **Save**.

---

### Step 3: Test Google Sign-In

1. Run your site locally: `npm run dev` or deploy to Vercel.
2. Click **Log In / Sign Up / Guest Mode 🎭** on the top of the page (or visit `/auth`).
3. Click **Continue with Google** 🌸!
4. You will be redirected to Google for sign-in, and brought right back to your confession vault.

---

### Step 4 (Optional): Supabase URL Configuration for Production

When deploying to Vercel:
1. In Supabase Dashboard ➔ **Authentication** ➔ **URL Configuration**:
   - Set **Site URL** to your Vercel URL (e.g. `https://your-app.vercel.app`).
   - Under **Redirect URLs**, add:
     - `http://localhost:3000/**`
     - `https://your-app.vercel.app/**`
2. Save changes.
