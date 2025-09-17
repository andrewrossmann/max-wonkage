-- Add expert interest table for collecting expert marketplace signups
CREATE TABLE IF NOT EXISTS public.expert_interest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  expertise_areas TEXT[],
  experience_level TEXT,
  hourly_rate_range TEXT,
  availability TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending', -- pending, contacted, onboarded, declined
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints
ALTER TABLE public.expert_interest ADD CONSTRAINT check_experience_level 
  CHECK (experience_level IN ('student', 'early_career', 'mid_career', 'senior', 'expert'));

ALTER TABLE public.expert_interest ADD CONSTRAINT check_status 
  CHECK (status IN ('pending', 'contacted', 'onboarded', 'declined'));

-- Enable RLS
ALTER TABLE public.expert_interest ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for the signup form)
CREATE POLICY "Anyone can insert expert interest" ON public.expert_interest
  FOR INSERT WITH CHECK (true);

-- Create policy to allow admins to view all (you'll need to set up admin role)
-- For now, we'll allow authenticated users to view (you can restrict this later)
CREATE POLICY "Authenticated users can view expert interest" ON public.expert_interest
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_expert_interest_email ON public.expert_interest(email);
CREATE INDEX idx_expert_interest_status ON public.expert_interest(status);
CREATE INDEX idx_expert_interest_created_at ON public.expert_interest(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expert_interest_updated_at
  BEFORE UPDATE ON public.expert_interest
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
