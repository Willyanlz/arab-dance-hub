
DROP POLICY "Users can insert ingressos_vendidos" ON public.ingressos_vendidos;
CREATE POLICY "Authenticated users can insert ingressos_vendidos" ON public.ingressos_vendidos FOR INSERT TO authenticated WITH CHECK (true);
