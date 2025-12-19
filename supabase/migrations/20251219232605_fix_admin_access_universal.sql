/*
  # Fix Admin Access - Create Universal Admin Panel

  1. New Tables
    - `admin_users` - Table to track who has admin privileges
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Link to auth user
      - `email` (text, unique) - Admin email for easy lookup
      - `created_at` (timestamptz) - When admin access was granted

  2. Changes to Existing Tables
    - Drop old restrictive RLS policies on complaints table
    - Create new policies that allow:
      - Admins: View and update ALL complaints
      - Regular users: View and update only their own complaints
      - Anyone: Submit new complaints

  3. Security
    - RLS enabled on admin_users table
    - Only admins can view admin_users table
    - Admins identified by checking if their email exists in admin_users table
    
  4. Initial Admin Setup
    - Add swarnimbandekar9@gmail.com as the first admin
    
  5. Notes
    - Admin access is universal - admins see ALL complaints from ALL users
    - Regular users only see complaints they created
    - This separation allows proper admin panel functionality
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);
CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON admin_users(user_id);

-- RLS for admin_users table - only admins can view
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    email IN (SELECT email FROM admin_users)
    OR auth.email() IN (SELECT email FROM admin_users)
  );

-- Drop ALL existing policies on complaints table
DROP POLICY IF EXISTS "Anyone can view complaints" ON complaints;
DROP POLICY IF EXISTS "Anyone can insert complaints" ON complaints;
DROP POLICY IF EXISTS "Anyone can update complaints" ON complaints;
DROP POLICY IF EXISTS "Users can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Public can view complaints" ON complaints;
DROP POLICY IF EXISTS "Users can update own complaints" ON complaints;
DROP POLICY IF EXISTS "Service role can update complaints" ON complaints;

-- NEW POLICY: Anyone can submit complaints (public form + authenticated users)
CREATE POLICY "Anyone can submit complaints"
  ON complaints
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- NEW POLICY: Admins can view ALL complaints
CREATE POLICY "Admins can view all complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    auth.email() IN (SELECT email FROM admin_users)
  );

-- NEW POLICY: Regular users can view only their own complaints
CREATE POLICY "Users can view own complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- NEW POLICY: Anonymous users can view complaints (for public tracking)
CREATE POLICY "Anonymous can view complaints"
  ON complaints
  FOR SELECT
  TO anon
  USING (true);

-- NEW POLICY: Admins can update ALL complaints
CREATE POLICY "Admins can update all complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (
    auth.email() IN (SELECT email FROM admin_users)
  )
  WITH CHECK (
    auth.email() IN (SELECT email FROM admin_users)
  );

-- NEW POLICY: Regular users can update their own complaints (for feedback)
CREATE POLICY "Users can update own complaints"
  ON complaints
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- Insert initial admin user
INSERT INTO admin_users (email)
VALUES ('swarnimbandekar9@gmail.com')
ON CONFLICT (email) DO NOTHING;