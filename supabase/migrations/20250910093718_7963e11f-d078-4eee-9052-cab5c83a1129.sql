-- Drop the dependent policy first
DROP POLICY "Users can view approved profiles" ON public.profiles;

-- Now remove approval_status column from profiles table
ALTER TABLE public.profiles DROP COLUMN approval_status;

-- Create new policy to allow all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);