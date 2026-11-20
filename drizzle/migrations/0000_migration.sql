DROP POLICY IF EXISTS "Cache readable by everyone" ON public.translation_cache;
REVOKE ALL ON public.translation_cache FROM anon, authenticated;
GRANT ALL ON public.translation_cache TO service_role;