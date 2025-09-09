-- Migration: Add AI curriculum generation fields (Fixed version)
-- This migration adds the necessary fields for AI-powered curriculum generation

-- Add new fields to curricula table
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS syllabus_data JSONB;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS generation_metadata JSONB;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS customization_notes TEXT;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS curriculum_type TEXT;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS total_estimated_hours DECIMAL;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS session_count INTEGER;
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS average_session_length INTEGER;

-- Add new fields to learning_sessions table
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS session_format JSONB;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS ai_essay TEXT;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS estimated_reading_time INTEGER;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS resources JSONB;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS discussion_prompts TEXT[];
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS generation_metadata JSONB;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS content_density TEXT;
ALTER TABLE public.learning_sessions ADD COLUMN IF NOT EXISTS session_type TEXT;

-- Add constraints (using DO blocks to handle IF NOT EXISTS)
DO $$ 
BEGIN
    -- Add constraint for approval_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_approval_status' 
        AND table_name = 'curricula'
    ) THEN
        ALTER TABLE public.curricula ADD CONSTRAINT check_approval_status 
        CHECK (approval_status IN ('pending', 'approved', 'rejected'));
    END IF;

    -- Add constraint for curriculum_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_curriculum_type' 
        AND table_name = 'curricula'
    ) THEN
        ALTER TABLE public.curricula ADD CONSTRAINT check_curriculum_type 
        CHECK (curriculum_type IN ('crash_course', 'standard', 'comprehensive', 'mastery'));
    END IF;

    -- Add constraint for content_density if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_content_density' 
        AND table_name = 'learning_sessions'
    ) THEN
        ALTER TABLE public.learning_sessions ADD CONSTRAINT check_content_density 
        CHECK (content_density IN ('light', 'moderate', 'intensive'));
    END IF;

    -- Add constraint for session_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_session_type' 
        AND table_name = 'learning_sessions'
    ) THEN
        ALTER TABLE public.learning_sessions ADD CONSTRAINT check_session_type 
        CHECK (session_type IN ('overview', 'deep_dive', 'practical', 'review'));
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_curricula_approval_status ON public.curricula(approval_status);
CREATE INDEX IF NOT EXISTS idx_curricula_curriculum_type ON public.curricula(curriculum_type);
CREATE INDEX IF NOT EXISTS idx_curricula_user_id_status ON public.curricula(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_curriculum_id ON public.learning_sessions(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_number ON public.learning_sessions(curriculum_id, session_number);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_content_density ON public.learning_sessions(content_density);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_type ON public.learning_sessions(session_type);

-- Update existing records to have default values
UPDATE public.curricula 
SET 
  approval_status = 'approved',
  curriculum_type = 'standard',
  total_estimated_hours = 0,
  session_count = 0,
  average_session_length = 60
WHERE approval_status IS NULL;

-- Update existing learning sessions to have default values
UPDATE public.learning_sessions 
SET 
  content_density = 'moderate',
  session_type = 'overview',
  estimated_reading_time = 0
WHERE content_density IS NULL;
