-- Check existing RLS policies on profiles table
-- and ensure users can update their own profiles

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a proper update policy that allows users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure insert policy exists for new profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);