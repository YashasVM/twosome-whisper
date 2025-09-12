-- Remove the foreign key constraint that references auth.users
-- since we're using custom authentication instead of Supabase auth

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;