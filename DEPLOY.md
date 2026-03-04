# Deploy The Grind to Vercel

## Step 1: Create GitHub Account (if you don't have one)
Go to https://github.com/signup and create an account

## Step 2: Create a GitHub Repo
1. Go to https://github.com/new
2. Name it: `the-grind`
3. Click "Create repository"
4. Copy the HTTPS URL (looks like: `https://github.com/YOUR_USERNAME/the-grind.git`)

## Step 3: Run These Commands (Copy & Paste in Terminal)

Open PowerShell in this folder and run:

```powershell
git init
git add .
git commit -m "Initial commit - The Grind study app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/the-grind.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username!

## Step 4: Deploy to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize & log in
4. Click "Add New..." → "Project"
5. Select your `the-grind` repository
6. Click "Deploy"
7. Wait 2-3 minutes
8. You'll get a live URL! 🚀

## Done!
Your app is now live. Your URL will be: `https://the-grind.vercel.app` (or similar)

Share this link, use it anytime from any device!
