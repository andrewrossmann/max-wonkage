-- Setup script for image storage
-- Run this in your Supabase SQL editor

-- Create the session-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'session-images',
  'session-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the session-images bucket
CREATE POLICY "Users can view images for their own sessions" ON storage.objects
FOR SELECT USING (
  bucket_id = 'session-images' AND
  (storage.foldername(name))[1] IN (
    SELECT ls.id::text FROM public.learning_sessions ls
    JOIN public.curricula c ON ls.curriculum_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload images for their own sessions" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'session-images' AND
  (storage.foldername(name))[1] IN (
    SELECT ls.id::text FROM public.learning_sessions ls
    JOIN public.curricula c ON ls.curriculum_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update images for their own sessions" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'session-images' AND
  (storage.foldername(name))[1] IN (
    SELECT ls.id::text FROM public.learning_sessions ls
    JOIN public.curricula c ON ls.curriculum_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images for their own sessions" ON storage.objects
FOR DELETE USING (
  bucket_id = 'session-images' AND
  (storage.foldername(name))[1] IN (
    SELECT ls.id::text FROM public.learning_sessions ls
    JOIN public.curricula c ON ls.curriculum_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Run the migration for the session_images table
\i database/migrations/004_add_session_images_table.sql
