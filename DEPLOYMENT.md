# Vercel Deployment Guide for MONO

This guide will walk you through deploying MONO to Vercel.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your MONO project pushed to a Git repository

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push to Git Repository

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a repository on GitHub/GitLab/Bitbucket

3. Push your code:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository:
   - If using GitHub, click **"Import"** next to your repository
   - If using GitLab/Bitbucket, click the respective tab and select your repository
4. Vercel will auto-detect Next.js settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

### Step 3: Configure Project Settings

1. **Project Name**: Change if desired (defaults to repository name)
2. **Framework Preset**: Next.js (should be auto-detected)
3. **Root Directory**: Leave as `./` unless your Next.js app is in a subdirectory
4. **Build and Output Settings**: Leave as defaults (Vercel auto-detects Next.js)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-3 minutes)
3. Once deployed, you'll get a URL like: `https://mono-xyz.vercel.app`

### Step 5: Custom Domain (Optional)

1. Go to your project dashboard on Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow the DNS configuration instructions

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

### Step 3: Deploy

From your project directory:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (first time) or Yes (if updating)
- **Project name?** → `mono` (or your preferred name)
- **Directory?** → `./` (press Enter)
- **Override settings?** → No (press Enter)

### Step 4: Verify Deployment

After deployment, you'll receive:
- Preview URL: `https://mono-xyz.vercel.app`
- Production URL: `https://mono.vercel.app` (if using project name as domain)

## Environment Variables

MONO doesn't require any environment variables as it's fully client-side with LocalStorage. However, if you need to add any in the future:

1. Go to your project on Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add your variables
4. Redeploy for changes to take effect

## Build Settings

Vercel automatically detects Next.js projects and uses these settings:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x (or latest LTS)

These are already configured in `vercel.json` but Vercel will use them automatically.

## Automatic Deployments

Once connected to Git:

- **Preview Deployments**: Every push to any branch creates a preview deployment
- **Production Deployments**: Pushes to `main` (or your default branch) deploy to production
- **Pull Request Deployments**: Each PR gets its own preview URL

## Troubleshooting

### Build Fails

1. **Check Build Logs**: Go to your project → "Deployments" → Click on failed deployment → View logs
2. **Common Issues**:
   - Node version mismatch: Ensure `engines.node` in `package.json` matches Vercel's Node version
   - Missing dependencies: Ensure all dependencies are in `package.json`
   - TypeScript errors: Fix any TypeScript errors locally first

### LocalStorage Not Working

- LocalStorage works in production on Vercel
- Ensure you're using HTTPS (Vercel provides this automatically)
- Check browser console for any errors

### Performance Issues

1. **Enable Analytics**: Go to project settings → Enable Vercel Analytics
2. **Check Bundle Size**: Use `npm run build` locally to see bundle analysis
3. **Optimize Images**: If adding images later, use Next.js Image component

## Updating Your Deployment

### Via Git (Automatic)

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically deploys the new version

### Via CLI

```bash
vercel --prod
```

## Project Structure for Vercel

Vercel expects this structure (which MONO already has):

```
mono/
├── package.json          # Dependencies and scripts
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # TailwindCSS configuration
├── postcss.config.mjs    # PostCSS configuration
├── vercel.json           # Vercel configuration (optional)
└── src/
    └── app/              # Next.js App Router
```

## Important Notes

1. **LocalStorage**: All data is stored in the user's browser, not on Vercel servers
2. **No Backend Required**: MONO is fully static/client-side
3. **Free Tier**: Vercel's free tier is sufficient for MONO
4. **HTTPS**: Automatically provided by Vercel
5. **Global CDN**: Your app is served from Vercel's global CDN

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)

## Quick Deploy Button

You can also use this button to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/mono)

(Replace `yourusername/mono` with your actual repository URL)

