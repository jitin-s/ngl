# 💕 Secret Feelings & Crush Confession Vault

A romantic, high-performance web application designed to collect secret crushes, relationship statuses, notifications, and confessions with 100% privacy control.

---

### 🚀 Features
- 🎨 **Romantic Glassmorphism UI**: Ambient glowing gradients, floating hearts, smooth micro-interactions.
- 💌 **Comprehensive Crush Form**:
  - Optional Instagram ID (@handle)
  - Name or Nickname (Required)
  - Relationship Status selector (Single / Committed / Complicated)
  - Crush status toggle with dynamic accordion (Crush Name, Duration pills like 1 week, 2 weeks, 1 month, custom duration)
  - Anonymous Special Comments / Confession Box
  - "Notify me when single" toggle (WhatsApp / Email alerts)
  - Confidentiality switch (100% Private Lock vs. Anonymous Public)
- 🎊 **Confetti celebration** on successful submission.
- 🗝️ **Owner Admin Dashboard** (`/admin`): Search, filter, and review all incoming responses.
- ⚡ **Supabase PostgreSQL Database** integration.

---

### 🛠️ Local Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the main confession form.
Visit [http://localhost:3000/admin](http://localhost:3000/admin) to access the owner vault dashboard.

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

2. Go to [Vercel](https://vercel.com/new), select your repo, and add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Click **Deploy**!
