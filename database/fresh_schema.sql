-- Fresh Database Schema for Max Wonkage
-- This schema includes all fields needed for AI curriculum generation

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS public.learning_sessions CASCADE;
DROP TABLE IF EXISTS public.curricula CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create curricula table with ALL required fields
CREATE TABLE public.curricula (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  goals TEXT,
  personal_background JSONB NOT NULL,
  time_availability JSONB NOT NULL,
  curriculum_data JSONB,
  syllabus_data JSONB,
  generation_prompt TEXT,
  generation_metadata JSONB,
  customization_notes TEXT,
  approval_status TEXT DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  curriculum_type TEXT,
  total_estimated_hours DECIMAL,
  session_count INTEGER,
  average_session_length INTEGER,
  status TEXT DEFAULT 'active',
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_sessions table with ALL required fields
CREATE TABLE public.learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES public.curricula(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  session_format JSONB,
  ai_essay TEXT,
  estimated_reading_time INTEGER,
  resources JSONB,
  discussion_prompts TEXT[],
  generation_metadata JSONB,
  content_density TEXT,
  session_type TEXT,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE public.curricula ADD CONSTRAINT check_approval_status 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.curricula ADD CONSTRAINT check_curriculum_type 
  CHECK (curriculum_type IN ('crash_course', 'standard', 'comprehensive', 'mastery'));

ALTER TABLE public.learning_sessions ADD CONSTRAINT check_content_density 
  CHECK (content_density IN ('light', 'moderate', 'intensive'));

ALTER TABLE public.learning_sessions ADD CONSTRAINT check_session_type 
  CHECK (session_type IN ('overview', 'deep_dive', 'practical', 'review'));

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Curricula policies
CREATE POLICY "Users can view own curricula" ON public.curricula
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own curricula" ON public.curricula
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own curricula" ON public.curricula
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own curricula" ON public.curricula
  FOR DELETE USING (auth.uid() = user_id);

-- Learning sessions policies
CREATE POLICY "Users can view own sessions" ON public.learning_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.curricula 
      WHERE curricula.id = learning_sessions.curriculum_id 
      AND curricula.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own sessions" ON public.learning_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.curricula 
      WHERE curricula.id = learning_sessions.curriculum_id 
      AND curricula.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sessions" ON public.learning_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.curricula 
      WHERE curricula.id = learning_sessions.curriculum_id 
      AND curricula.user_id = auth.uid()
    )
  );

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_curricula_user_id ON public.curricula(user_id);
CREATE INDEX idx_curricula_approval_status ON public.curricula(approval_status);
CREATE INDEX idx_curricula_curriculum_type ON public.curricula(curriculum_type);
CREATE INDEX idx_curricula_user_id_status ON public.curricula(user_id, status);
CREATE INDEX idx_learning_sessions_curriculum_id ON public.learning_sessions(curriculum_id);
CREATE INDEX idx_learning_sessions_session_number ON public.learning_sessions(curriculum_id, session_number);
CREATE INDEX idx_learning_sessions_content_density ON public.learning_sessions(content_density);
CREATE INDEX idx_learning_sessions_session_type ON public.learning_sessions(session_type);
