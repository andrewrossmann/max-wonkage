-- Add session_images table to store downloaded DALL-E images permanently
CREATE TABLE IF NOT EXISTS public.session_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  original_url TEXT, -- The original DALL-E URL
  stored_url TEXT NOT NULL, -- The permanent stored URL
  filename TEXT NOT NULL,
  prompt TEXT, -- The original image prompt
  file_size INTEGER, -- File size in bytes
  mime_type TEXT DEFAULT 'image/png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_images_session_id ON public.session_images(session_id);
CREATE INDEX IF NOT EXISTS idx_session_images_stored_url ON public.session_images(stored_url);

-- Add RLS policies
ALTER TABLE public.session_images ENABLE ROW LEVEL SECURITY;

-- Users can only see images for their own sessions
CREATE POLICY "Users can view images for their own sessions" ON public.session_images
  FOR SELECT USING (
    session_id IN (
      SELECT ls.id FROM public.learning_sessions ls
      JOIN public.curricula c ON ls.curriculum_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can insert images for their own sessions
CREATE POLICY "Users can insert images for their own sessions" ON public.session_images
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT ls.id FROM public.learning_sessions ls
      JOIN public.curricula c ON ls.curriculum_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can update images for their own sessions
CREATE POLICY "Users can update images for their own sessions" ON public.session_images
  FOR UPDATE USING (
    session_id IN (
      SELECT ls.id FROM public.learning_sessions ls
      JOIN public.curricula c ON ls.curriculum_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Users can delete images for their own sessions
CREATE POLICY "Users can delete images for their own sessions" ON public.session_images
  FOR DELETE USING (
    session_id IN (
      SELECT ls.id FROM public.learning_sessions ls
      JOIN public.curricula c ON ls.curriculum_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
