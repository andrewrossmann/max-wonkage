-- Fix RLS policy to allow anonymous inserts for expert interest signups

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert expert interest" ON public.expert_interest;

-- Create a new policy that allows anonymous inserts
CREATE POLICY "Allow anonymous expert interest inserts" ON public.expert_interest
  FOR INSERT WITH CHECK (true);

-- Also ensure the table allows anonymous access
ALTER TABLE public.expert_interest ENABLE ROW LEVEL SECURITY;

-- Verify the policy exists
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'expert_interest';
