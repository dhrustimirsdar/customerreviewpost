/*
  # Cleanup Duplicate RLS Policies

  1. Changes
    - Remove old/duplicate policies that conflict with the new admin system
    - Keep only the essential policies for:
      - Admins viewing and updating all complaints
      - Regular users viewing and updating their own complaints
      - Anonymous and authenticated users submitting complaints
    
  2. Notes
    - This migration removes redundant policies to avoid confusion
    - Service role policies are not needed as service role bypasses RLS by default
*/

-- Remove duplicate/old policies
DROP POLICY IF EXISTS "Allow anonymous complaint submission" ON complaints;
DROP POLICY IF EXISTS "Service role can update all complaints" ON complaints;
DROP POLICY IF EXISTS "Service role can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Users can insert own complaints" ON complaints;

-- The following policies remain and are correct:
-- 1. "Anyone can submit complaints" - for INSERT (anon + authenticated)
-- 2. "Admins can view all complaints" - for SELECT (admins only)
-- 3. "Users can view own complaints" - for SELECT (regular users only)
-- 4. "Anonymous can view complaints" - for SELECT (anonymous users)
-- 5. "Admins can update all complaints" - for UPDATE (admins only)
-- 6. "Users can update own complaints" - for UPDATE (regular users only)