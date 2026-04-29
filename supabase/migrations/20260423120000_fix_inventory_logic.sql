-- Migration to fix inventory calculation and add purchase tracking
-- 1. Add lote_id column to ingressos_vendidos
ALTER TABLE public.ingressos_vendidos ADD COLUMN IF NOT EXISTS lote_id UUID REFERENCES public.lotes_ingresso(id);

-- 2. Function to update lote inventory
CREATE OR REPLACE FUNCTION public.update_lote_inventory_count()
RETURNS TRIGGER AS $$
DECLARE
    target_lote_id UUID;
BEGIN
    -- Identify the lote to update
    IF (TG_OP = 'DELETE') THEN
        target_lote_id := OLD.lote_id;
    ELSE
        target_lote_id := NEW.lote_id;
    END IF;

    IF target_lote_id IS NOT NULL THEN
        UPDATE public.lotes_ingresso
        SET quantidade_vendida = (
            SELECT COALESCE(SUM(quantidade), 0)
            FROM public.ingressos_vendidos
            WHERE lote_id = target_lote_id AND status != 'cancelado'
        )
        WHERE id = target_lote_id;
    END IF;

    -- If lote_id changed in an update, update the old lote as well
    IF (TG_OP = 'UPDATE' AND OLD.lote_id IS NOT NULL AND OLD.lote_id != NEW.lote_id) THEN
        UPDATE public.lotes_ingresso
        SET quantidade_vendida = (
            SELECT COALESCE(SUM(quantidade), 0)
            FROM public.ingressos_vendidos
            WHERE lote_id = OLD.lote_id AND status != 'cancelado'
        )
        WHERE id = OLD.lote_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger for ingressos_vendidos
DROP TRIGGER IF EXISTS tr_update_lote_inventory ON public.ingressos_vendidos;
CREATE TRIGGER tr_update_lote_inventory
AFTER INSERT OR UPDATE OR DELETE ON public.ingressos_vendidos
FOR EACH ROW EXECUTE FUNCTION public.update_lote_inventory_count();

-- 4. Initial sync
UPDATE public.ingressos_vendidos v
SET lote_id = l.id
FROM public.lotes_ingresso l
JOIN public.tipos_ingresso t ON t.grupo_id = l.grupo_id
WHERE v.tipo_ingresso_id = t.id
  AND v.lote_id IS NULL
  AND v.created_at::date >= l.data_inicio
  AND v.created_at::date <= l.data_fim;

UPDATE public.lotes_ingresso l
SET quantidade_vendida = (
    SELECT COALESCE(SUM(quantidade), 0)
    FROM public.ingressos_vendidos
    WHERE lote_id = l.id AND status != 'cancelado'
);
