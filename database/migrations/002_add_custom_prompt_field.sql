-- Add custom_prompt field to curricula table
ALTER TABLE public.curricula ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_curricula_custom_prompt ON public.curricula(custom_prompt);
