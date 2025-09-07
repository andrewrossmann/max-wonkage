-- Note: auth.users table is managed by Supabase and doesn't need RLS enabled

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create curricula table
CREATE TABLE IF NOT EXISTS public.curricula (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  goals TEXT,
  personal_background JSONB NOT NULL, -- {background, interests, experiences, goals}
  time_availability JSONB NOT NULL, -- {totalDays, sessionsPerWeek, sessionLength}
  curriculum_data JSONB, -- Generated curriculum content
  status TEXT DEFAULT 'active', -- active, completed, paused
  progress JSONB DEFAULT '{}', -- Track completion status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table for individual learning sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES public.curricula(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB, -- Session materials and content
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
-- User profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Curricula: users can only see/edit their own curricula
CREATE POLICY "Users can view own curricula" ON public.curricula
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own curricula" ON public.curricula
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own curricula" ON public.curricula
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own curricula" ON public.curricula
  FOR DELETE USING (auth.uid() = user_id);

-- Learning sessions: users can only see/edit sessions for their curricula
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
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger will be created automatically by Supabase when you enable it in the dashboard
