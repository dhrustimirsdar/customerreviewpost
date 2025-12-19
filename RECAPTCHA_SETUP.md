# Google reCAPTCHA Setup Instructions

This guide will help you set up Google reCAPTCHA v2 for the complaint submission form.

## Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click on the **+** button to register a new site
3. Fill in the form:
   - **Label**: Give your site a name (e.g., "Indian Post Complaint System")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domain(s)
     - For local development: `localhost`
     - For production: Your actual domain (e.g., `yourdomain.com`)
   - Accept the reCAPTCHA Terms of Service
4. Click **Submit**
5. You'll receive two keys:
   - **Site Key** (public key - used in frontend)
   - **Secret Key** (private key - used in backend)

## Step 2: Configure Environment Variables

### For Local Development (.env file)

Add the following to your `.env` file:

```env
# Google reCAPTCHA Keys
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

Replace `your_site_key_here` and `your_secret_key_here` with the actual keys from Step 1.

### For Production (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Click on **Secrets** or **Environment Variables**
4. Add the following secret:
   - Key: `RECAPTCHA_SECRET_KEY`
   - Value: Your secret key from Google reCAPTCHA

Note: The site key (VITE_RECAPTCHA_SITE_KEY) is automatically included in your frontend build.

## Step 3: Testing reCAPTCHA

### Test Keys for Development

Google provides test keys that you can use during development:

```env
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

**Important**: These test keys will:
- Always pass validation
- Show a warning message in the reCAPTCHA widget
- Should NOT be used in production

### Testing in Production

1. Deploy your application with the production reCAPTCHA keys
2. Submit a test complaint
3. Verify that:
   - The reCAPTCHA checkbox appears
   - You must check the box before submitting
   - The form submits successfully after completing reCAPTCHA
   - You receive appropriate error messages if reCAPTCHA fails

## Step 4: Deploy Edge Function

The edge function has already been deployed with reCAPTCHA verification. However, you need to add the secret key to Supabase:

```bash
# If using Supabase CLI locally
supabase secrets set RECAPTCHA_SECRET_KEY=your_secret_key_here
```

Or add it through the Supabase dashboard as mentioned in Step 2.

## Troubleshooting

### reCAPTCHA Widget Not Showing

1. Check browser console for errors
2. Verify the reCAPTCHA script is loaded in `index.html`
3. Ensure `VITE_RECAPTCHA_SITE_KEY` is set correctly in `.env`
4. Clear browser cache and reload

### "reCAPTCHA verification failed" Error

1. Verify your secret key is set correctly in Supabase
2. Check that your domain is registered in the reCAPTCHA admin console
3. For localhost testing, make sure "localhost" is added as a domain

### Form Submits Without reCAPTCHA

1. The form requires reCAPTCHA completion before submission
2. If the widget doesn't load, check the console for errors
3. Ensure the reCAPTCHA script loads before the React app

## Features Implemented

### 1. Phone Number Field
- Optional field for user contact
- Displayed in admin dashboard
- Helps admins contact users directly

### 2. Tracking ID Field
- Optional field for package/shipment tracking reference
- Displayed prominently in admin dashboard
- Helps link complaints to specific shipments

### 3. reCAPTCHA Protection
- Prevents spam and bot submissions
- Validates on server-side for security
- Uses score threshold of 0.5 for filtering

## Admin Panel Access

The admin panel (accessible via swarnimbandekar9@gmail.com) can now see:
- All complaints from any user (not just their own)
- User email addresses
- Phone numbers (if provided)
- Tracking IDs (if provided)
- All existing complaint details

The edge function uses the service role key to bypass Row Level Security (RLS) policies, ensuring all complaints are visible to the admin regardless of who submitted them.

## Next Steps

1. Add your production reCAPTCHA keys to the `.env` file
2. Test the complaint submission form with reCAPTCHA
3. Verify that phone number and tracking ID appear in the admin dashboard
4. Deploy your changes to production
