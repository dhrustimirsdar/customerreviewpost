# Separate Login Portals Guide

## Overview

Your app now has **completely separate login portals** for admin and regular users. Logging into one portal does NOT give you access to the other.

---

## Two Independent Portals

### 1. User Portal (Public)
- **URL**: `/` (homepage)
- **Access**: Anyone can sign up and log in
- **Features**:
  - Submit complaints
  - View own complaints
  - Message about own complaints
  - Track complaint status

### 2. Admin Portal (Restricted)
- **URL**: `/admin/login`
- **Access**: Only authorized administrators (swarnimbandekar9@gmail.com)
- **Features**:
  - View all user complaints
  - Dashboard analytics
  - Message users
  - Mark complaints as resolved

---

## How It Works

### Login Context Tracking

Each portal tracks which context you logged in through:
- User Portal → `loginContext = 'user'`
- Admin Portal → `loginContext = 'admin'`

This is stored in:
1. **React State** (in AuthContext)
2. **localStorage** (persists across page reloads)

### Portal Separation

```
User logs in at /          → Can access: / (user dashboard)
                            → Cannot access: /admin (wrong portal)

Admin logs in at /admin/login → Can access: /admin (admin dashboard)
                               → Cannot access: / (wrong portal)
```

---

## User Experience

### For Regular Users

1. Visit homepage (`/`)
2. Sign up or log in
3. Access user dashboard
4. Can see "Admin Portal Access" link at bottom
5. If they try `/admin`, see "Wrong Portal" message

### For Administrators

1. Visit `/admin/login` directly
2. Log in with admin credentials (swarnimbandekar9@gmail.com)
3. Access admin dashboard at `/admin`
4. If they try `/`, see "Wrong Portal" message

---

## Portal Switching

If a user is logged into the wrong portal, they see:

**"Wrong Portal" Page**
- Clear explanation of the issue
- "Sign Out & Use [Correct] Portal" button
- Automatically signs them out and redirects

Example scenarios:

### Scenario 1: User tries to access admin
```
1. User logs in at /
2. User manually navigates to /admin
3. See: "You are logged in as a user. Please log in through the Admin Portal."
4. Click "Sign Out & Use Admin Portal"
5. Redirected to /admin/login
6. Must log in with admin credentials
```

### Scenario 2: Admin tries to access user portal
```
1. Admin logs in at /admin/login
2. Admin manually navigates to /
3. See: "You are logged in as an admin. Please log in through the User Portal."
4. Click "Sign Out & Use User Portal"
5. Redirected to /
6. Must log in with user credentials
```

---

## Security Features

### 1. Context Validation
Every protected route checks:
- Is user logged in? ✓
- Is login context correct? ✓
- (For admin) Is user an admin? ✓

### 2. No Cross-Portal Access
Even if you're authenticated, you cannot access routes from a different portal without logging in through that portal.

### 3. Database-Level Admin Check
Admin status is verified from the `admins` table in the database, not just from the login context.

### 4. Persistent State
Login context is stored in localStorage, so it persists across:
- Page refreshes
- Browser restarts
- Navigation

### 5. Automatic Cleanup
When user signs out:
- Supabase session cleared
- Login context cleared from state
- Login context cleared from localStorage

---

## Code Architecture

### AuthContext (`src/contexts/AuthContext.tsx`)
```typescript
- loginContext: 'admin' | 'user' | null
- signIn(email, password, context) // Takes context parameter
- signUp(email, password) // Defaults to 'user' context
- signOut() // Clears everything
```

### ProtectedRoute (`src/App.tsx`)
```typescript
<ProtectedRoute
  requiredContext="admin"  // or "user"
  requireAdmin={true}      // for admin routes
>
  <Component />
</ProtectedRoute>
```

### Routes
```typescript
/                → User Portal (context: 'user')
/admin/login     → Admin Login Page (public)
/admin           → Admin Dashboard (context: 'admin', requireAdmin: true)
```

---

## Files Modified

1. **src/contexts/AuthContext.tsx**
   - Added `loginContext` state
   - Updated `signIn()` to accept context parameter
   - Store/retrieve context from localStorage

2. **src/components/AdminLogin.tsx** (NEW)
   - Dedicated admin login page
   - Dark theme to differentiate from user portal
   - Calls `signIn(email, password, 'admin')`

3. **src/components/AuthPage.tsx**
   - Calls `signIn(email, password, 'user')`
   - Added "Admin Portal Access" link

4. **src/App.tsx**
   - Updated ProtectedRoute to check `loginContext`
   - Added "Wrong Portal" error page
   - Added `/admin/login` route

---

## Testing Guide

### Test 1: User Cannot Access Admin
1. Sign up as regular user (e.g., test@example.com)
2. Log in at `/`
3. Navigate to `/admin/login` or `/admin`
4. Result: See "Wrong Portal" page ✓

### Test 2: Admin Cannot Access User Portal
1. Log in as admin at `/admin/login` (swarnimbandekar9@gmail.com)
2. Navigate to `/`
3. Result: See "Wrong Portal" page ✓

### Test 3: Portal Switching
1. Log in as user at `/`
2. Try to access `/admin`
3. Click "Sign Out & Use Admin Portal"
4. Redirected to `/admin/login`
5. Log in as admin
6. Access admin dashboard ✓

### Test 4: Direct Admin Access
1. Go directly to `/admin/login`
2. Log in as admin
3. Access `/admin` dashboard ✓
4. Cannot access `/` without switching ✓

### Test 5: Persistence
1. Log in as user at `/`
2. Refresh page
3. Still logged in as user ✓
4. Still cannot access `/admin` ✓

---

## Admin Setup Required

Before admin portal works, you must:

1. **Create admins table** (Run in Supabase SQL Editor):
```sql
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check their admin status"
  ON admins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS admins_user_id_idx ON admins(user_id);
CREATE INDEX IF NOT EXISTS admins_email_idx ON admins(email);
```

2. **Grant admin access**:
```sql
-- First, sign up with swarnimbandekar9@gmail.com in the app
-- Then run:
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users
WHERE email = 'swarnimbandekar9@gmail.com'
ON CONFLICT (email) DO NOTHING;
```

3. **Test admin login**:
   - Go to `/admin/login`
   - Log in with swarnimbandekar9@gmail.com
   - Access `/admin` dashboard

See **ADMIN_ACCESS_SETUP.md** for detailed instructions.

---

## Troubleshooting

### Problem: Can't access admin portal after logging in as admin
**Solution**:
- Make sure you logged in at `/admin/login`, not at `/`
- Check that admin was added to `admins` table
- Clear browser cache and try again

### Problem: Stuck on "Wrong Portal" page
**Solution**:
- Click "Sign Out & Use [Correct] Portal"
- This will clear your session and redirect you
- Log in through the correct portal

### Problem: Login context persists after signing out
**Solution**:
- Check browser console for errors
- Clear localStorage manually: `localStorage.removeItem('loginContext')`
- Sign in again through the correct portal

### Problem: Regular user can access admin
**Solution**:
- Verify `admins` table exists in database
- Check that user is NOT in `admins` table
- Verify frontend code was updated correctly
- Rebuild: `npm run build`

---

## Summary

**Key Points:**
1. Two separate login pages: `/` and `/admin/login`
2. Sessions are portal-specific via `loginContext`
3. Cannot switch portals without signing out
4. Admin access requires both:
   - Logging in through `/admin/login`
   - Being in the `admins` database table

**Security:**
- Database-backed admin verification
- Context validation on every route
- Clear separation between portals
- No accidental cross-access

Your app now has enterprise-grade portal separation!
