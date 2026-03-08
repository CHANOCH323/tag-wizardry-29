
-- Fix overly permissive policies on tags
DROP POLICY "Authenticated users can insert tags" ON public.tags;
DROP POLICY "Authenticated users can update tags" ON public.tags;

CREATE POLICY "Authenticated users can insert tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update tags" ON public.tags FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
