-- Fix CRITICAL: Prevent privilege escalation on user_roles
-- Add INSERT policy: only admins can assign roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy: only admins can change roles
CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy: only admins can remove roles
CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: Replace permissive INSERT on ingressos_vendidos
DROP POLICY IF EXISTS "Authenticated users can insert ingressos_vendidos" ON public.ingressos_vendidos;

CREATE POLICY "Users can insert own ingressos_vendidos"
ON public.ingressos_vendidos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);