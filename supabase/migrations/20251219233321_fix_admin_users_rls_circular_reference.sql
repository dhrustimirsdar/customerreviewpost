/*
  # Fix Admin Users RLS - Remove Circular Reference

  1. Changes
    - Drop the circular RLS policy on admin_users table
    - Create a simple policy that allows all authenticated users to read admin_users
    - This is safe because admin_users only contains email addresses
    - The table is used for authentication checks only
    
  2. Security Notes
    - All authenticated users can check if an email is an admin
    - This is necessary to avoid circular reference errors
    - Only the email list is visible, no sensitive data exposed
    - No one can INSERT/UPDATE/DELETE without proper permissions
*/

-- Drop the problematic circular policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create a simple policy allowing authenticated users to read admin list
CREATE POLICY "Authenticated users can check admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);