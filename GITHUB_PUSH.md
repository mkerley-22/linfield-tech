# Push to GitHub - Authentication Required

Your code is committed locally, but you need to authenticate to push to GitHub.

## Option 1: Use GitHub CLI (Easiest)

1. Install GitHub CLI if you don't have it:
   ```bash
   brew install gh
   ```

2. Authenticate:
   ```bash
   gh auth login
   ```
   - Follow the prompts
   - Choose GitHub.com
   - Choose HTTPS
   - Authenticate in browser

3. Push your code:
   ```bash
   git push -u origin main
   ```

## Option 2: Use Personal Access Token

1. **Create a Personal Access Token:**
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name it: "Vercel Deployment"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   ```
   - When prompted for username: enter your GitHub username
   - When prompted for password: paste your personal access token (not your GitHub password)

## Option 3: Use SSH (If you have SSH keys set up)

1. **Check if you have SSH keys:**
   ```bash
   ls -la ~/.ssh
   ```

2. **If you don't have SSH keys, generate them:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. **Add SSH key to GitHub:**
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub.com → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key
   - Save

4. **Update remote to use SSH:**
   ```bash
   git remote set-url origin git@github.com:mkerley-22/linfield-tech.git
   git push -u origin main
   ```

## Quick Command Reference

After authenticating with any method above:
```bash
git push -u origin main
```

## After Pushing

Once your code is on GitHub, you can:
1. Go to [vercel.com](https://vercel.com)
2. Import your repository
3. Follow the deployment guides (QUICK_DEPLOY.md or SETUP_VERCEL.md)

