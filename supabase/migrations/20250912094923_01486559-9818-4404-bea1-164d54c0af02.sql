-- Update the profiles INSERT policy to allow signup without auth.uid()
-- Since we're using custom authentication, we need to allow profile creation
-- without requiring Supabase's built-in authentication

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

CREATE POLICY "Allow profile creation for signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);