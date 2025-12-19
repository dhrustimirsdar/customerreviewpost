# Deployment Instructions for Vercel

Your code has been updated with the following features:
1. Phone Number field (optional) in complaint form
2. Tracking ID field (optional) in complaint form
3. Contact column in admin dashboard showing emails and phone numbers
4. Tracking IDs displayed in admin dashboard
5. reCAPTCHA integration (optional - works without configuration)

## Deploy to Vercel

You have two options to deploy:

### Option 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project directory:
   ```bash
   vercel --prod
   ```

4. Follow the prompts to link to your existing project or create a new one

### Option 2: Using Git + Vercel Dashboard

1. **Push to GitHub/GitLab/Bitbucket:**

   If you have a repository connected to your Vercel project:

   ```bash
   # If you haven't connected to a remote yet:
   git remote add origin YOUR_REPOSITORY_URL

   # Push your changes:
   git push origin master
   ```

2. **Automatic Deployment:**

   Vercel will automatically detect the push and deploy your changes.

3. **Manual Trigger (if needed):**

   - Go to https://vercel.com/dashboard
   - Find your project (postalai)
   - Click "Redeploy" on the latest deployment
   - Or trigger a new deployment from the Git tab

### Option 3: Manual Upload via Vercel Dashboard

1. Build your project locally:
   ```bash
   npm run build
   ```

2. Go to https://vercel.com/dashboard
3. Select your project
4. Go to Settings → Git
5. Upload the `dist` folder directly (though this is not recommended for production)

## Verify Deployment

After deployment, verify these features are working:

1. **Complaint Form:**
   - Visit https://postalai.vercel.app
   - You should see two new fields:
     - Phone Number (Optional)
     - Tracking ID (Optional)
   - Submit a test complaint with phone and tracking ID

2. **Admin Dashboard:**
   - Login at https://postalai.vercel.app/admin
   - Check the "Contact" column shows emails and phone numbers
   - Tracking IDs should appear under complaint text
   - Click "View" on a complaint to see all details

## Troubleshooting

### Changes Not Showing After Deploy

1. **Clear Browser Cache:**
   - Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Check Vercel Build Logs:**
   - Go to Vercel dashboard
   - Click on your deployment
   - Check the "Build Logs" tab for errors

3. **Verify Environment Variables:**
   - Ensure all environment variables are set in Vercel dashboard
   - Go to Project Settings → Environment Variables

### Database Not Showing New Fields

The database migration has already been applied. New complaints should automatically include phone_number and tracking_id fields.

## Current Status

- ✅ Code changes completed
- ✅ Database migration applied
- ✅ Edge functions deployed
- ✅ Local build successful
- ⏳ Vercel deployment pending (you need to deploy)

## Quick Deploy Command

The fastest way to deploy:

```bash
vercel --prod
```

This will build and deploy your project directly to production.
