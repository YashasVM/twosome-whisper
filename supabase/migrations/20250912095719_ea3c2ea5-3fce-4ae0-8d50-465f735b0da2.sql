-- Insert the two predefined users
INSERT INTO public.profiles (id, user_id, name, password_hash, nice_comment, created_at, updated_at) 
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'Yashas V M', encode('ADMIN', 'base64'), 'Admin user', now(), now()),
  (gen_random_uuid(), gen_random_uuid(), 'Nireeksha (Chotu)', encode('Buddu', 'base64'), 'Buddu user', now(), now())
ON CONFLICT (name) DO NOTHING;